import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError, EmailFolder } from '@kozsd/shared';
import { encrypt, decrypt, generateUUID } from '../utils/crypto';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get emails with filtering and pagination
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    folder = 'inbox',
    page = 1,
    limit = 20,
    search,
    isRead,
    isStarred,
    isImportant,
    hasAttachments,
    from,
    to,
    subject,
    dateFrom,
    dateTo
  } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  // Build where clause
  const whereClause: any = {
    OR: [
      { fromUserId: userId },
      { recipients: { some: { userId } } }
    ]
  };

  if (folder && folder !== 'all') {
    whereClause.folder = folder;
  }

  if (search) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { subject: { contains: search as string, mode: 'insensitive' } },
          { bodyText: { contains: search as string, mode: 'insensitive' } }
        ]
      }
    ];
  }

  if (isRead !== undefined) {
    whereClause.isRead = isRead === 'true';
  }

  if (isStarred !== undefined) {
    whereClause.isStarred = isStarred === 'true';
  }

  if (isImportant !== undefined) {
    whereClause.isImportant = isImportant === 'true';
  }

  if (hasAttachments === 'true') {
    whereClause.attachments = { some: {} };
  }

  if (from) {
    whereClause.fromExternal = { contains: from as string, mode: 'insensitive' };
  }

  if (dateFrom) {
    whereClause.sentAt = { gte: new Date(dateFrom as string) };
  }

  if (dateTo) {
    whereClause.sentAt = {
      ...whereClause.sentAt,
      lte: new Date(dateTo as string)
    };
  }

  const [emails, totalCount] = await Promise.all([
    prisma.email.findMany({
      where: whereClause,
      include: {
        fromUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        attachments: true,
        _count: {
          select: {
            replies: true,
            attachments: true
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: limitNumber
    }),
    prisma.email.count({ where: whereClause })
  ]);

  // Decrypt email bodies if needed
  const processedEmails = emails.map(email => ({
    ...email,
    bodyText: email.encryptedBody ? decrypt(email.encryptedBody) : email.bodyText,
    storageUsed: email.storageUsed?.toString()
  }));

  const totalPages = Math.ceil(totalCount / limitNumber);

  res.json({
    success: true,
    data: processedEmails,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total: totalCount,
      totalPages,
      hasNext: pageNumber < totalPages,
      hasPrev: pageNumber > 1
    }
  });
}));

/**
 * Get specific email by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const email = await prisma.email.findFirst({
    where: {
      id,
      OR: [
        { fromUserId: userId },
        { recipients: { some: { userId } } }
      ]
    },
    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      recipients: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      attachments: true,
      replies: {
        include: {
          fromUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { sentAt: 'asc' }
      }
    }
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  // Mark as read if user is recipient
  const recipient = await prisma.emailRecipient.findFirst({
    where: { emailId: id, userId }
  });

  if (recipient && !recipient.isRead) {
    await prisma.emailRecipient.update({
      where: { id: recipient.id },
      data: { isRead: true, readAt: new Date() }
    });
  }

  // Decrypt email body if needed
  const processedEmail = {
    ...email,
    bodyText: email.encryptedBody ? decrypt(email.encryptedBody) : email.bodyText,
    replies: email.replies.map(reply => ({
      ...reply,
      bodyText: reply.encryptedBody ? decrypt(reply.encryptedBody) : reply.bodyText
    }))
  };

  res.json({
    success: true,
    data: processedEmail
  });
}));

/**
 * Send new email
 */
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const {
    to,
    cc = [],
    bcc = [],
    subject,
    bodyText,
    bodyHtml,
    saveAsDraft = false,
    scheduleSendAt,
    attachmentIds = []
  } = req.body;

  if (!to || !Array.isArray(to) || to.length === 0) {
    throw new ValidationError('At least one recipient is required');
  }

  if (!subject || !bodyText) {
    throw new ValidationError('Subject and body are required');
  }

  const messageId = generateUUID();
  const sentAt = scheduleSendAt ? new Date(scheduleSendAt) : new Date();
  const folder = saveAsDraft ? EmailFolder.DRAFTS : EmailFolder.SENT;

  // Encrypt email body for sensitive content
  const shouldEncrypt = bodyText.includes('confidential') || bodyText.includes('sensitive');
  const encryptedBody = shouldEncrypt ? encrypt(bodyText) : undefined;

  // Create email
  const email = await prisma.email.create({
    data: {
      messageId,
      fromUserId: userId,
      toExternal: to.map((addr: any) => typeof addr === 'string' ? addr : addr.email),
      ccExternal: cc.map((addr: any) => typeof addr === 'string' ? addr : addr.email),
      bccExternal: bcc.map((addr: any) => typeof addr === 'string' ? addr : addr.email),
      subject,
      bodyText: shouldEncrypt ? '' : bodyText,
      bodyHtml,
      encryptedBody,
      folder,
      sentAt,
      recipients: {
        create: [
          ...to.map((addr: any) => ({
            email: typeof addr === 'string' ? addr : addr.email,
            name: typeof addr === 'object' ? addr.name : undefined,
            type: 'to'
          })),
          ...cc.map((addr: any) => ({
            email: typeof addr === 'string' ? addr : addr.email,
            name: typeof addr === 'object' ? addr.name : undefined,
            type: 'cc'
          })),
          ...bcc.map((addr: any) => ({
            email: typeof addr === 'string' ? addr : addr.email,
            name: typeof addr === 'object' ? addr.name : undefined,
            type: 'bcc'
          }))
        ]
      }
    },
    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      recipients: true,
      attachments: true
    }
  });

  // Update user's email quota
  await prisma.user.update({
    where: { id: userId },
    data: { emailQuotaUsed: { increment: 1 } }
  });

  logger.info(`Email ${saveAsDraft ? 'saved as draft' : 'sent'}: ${messageId} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    data: email,
    message: saveAsDraft ? 'Email saved as draft' : 'Email sent successfully'
  });
}));

/**
 * Update email (mark as read, star, move to folder, etc.)
 */
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { isRead, isStarred, isImportant, folder, labels } = req.body;

  // Check if user has access to this email
  const email = await prisma.email.findFirst({
    where: {
      id,
      OR: [
        { fromUserId: userId },
        { recipients: { some: { userId } } }
      ]
    }
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  // Update email
  const updatedEmail = await prisma.email.update({
    where: { id },
    data: {
      ...(typeof isRead === 'boolean' && { isRead }),
      ...(typeof isStarred === 'boolean' && { isStarred }),
      ...(typeof isImportant === 'boolean' && { isImportant }),
      ...(folder && { folder }),
      ...(labels && { labels })
    },
    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      recipients: true,
      attachments: true
    }
  });

  // Update recipient read status if applicable
  if (typeof isRead === 'boolean') {
    await prisma.emailRecipient.updateMany({
      where: { emailId: id, userId },
      data: { isRead, readAt: isRead ? new Date() : null }
    });
  }

  logger.info(`Email updated: ${id} by ${req.user!.email}`);

  res.json({
    success: true,
    data: updatedEmail,
    message: 'Email updated successfully'
  });
}));

/**
 * Delete email
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { permanent = false } = req.query;

  // Check if user has access to this email
  const email = await prisma.email.findFirst({
    where: {
      id,
      OR: [
        { fromUserId: userId },
        { recipients: { some: { userId } } }
      ]
    }
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  if (permanent === 'true' || email.folder === EmailFolder.TRASH) {
    // Permanently delete
    await prisma.email.delete({
      where: { id }
    });
    logger.info(`Email permanently deleted: ${id} by ${req.user!.email}`);
  } else {
    // Move to trash
    await prisma.email.update({
      where: { id },
      data: { folder: EmailFolder.TRASH }
    });
    logger.info(`Email moved to trash: ${id} by ${req.user!.email}`);
  }

  res.json({
    success: true,
    message: permanent === 'true' ? 'Email deleted permanently' : 'Email moved to trash'
  });
}));

/**
 * Reply to email
 */
router.post('/:id/reply', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { bodyText, bodyHtml, replyAll = false } = req.body;

  if (!bodyText) {
    throw new ValidationError('Reply body is required');
  }

  // Get original email
  const originalEmail = await prisma.email.findFirst({
    where: {
      id,
      OR: [
        { fromUserId: userId },
        { recipients: { some: { userId } } }
      ]
    },
    include: {
      fromUser: true,
      recipients: true
    }
  });

  if (!originalEmail) {
    throw new NotFoundError('Original email not found');
  }

  // Determine recipients
  let recipients: string[] = [];
  if (originalEmail.fromUserId === userId) {
    // Replying to own email - send to original recipients
    recipients = originalEmail.toExternal || [];
  } else {
    // Replying to received email
    recipients = [originalEmail.fromExternal || originalEmail.fromUser?.email || ''];
    
    if (replyAll) {
      // Add all original recipients except current user
      const allRecipients = [
        ...(originalEmail.toExternal || []),
        ...(originalEmail.ccExternal || [])
      ];
      recipients = [...recipients, ...allRecipients.filter(email => email !== req.user!.email)];
    }
  }

  recipients = recipients.filter(Boolean); // Remove empty strings

  const messageId = generateUUID();
  const subject = originalEmail.subject.startsWith('Re: ') 
    ? originalEmail.subject 
    : `Re: ${originalEmail.subject}`;

  // Create reply
  const reply = await prisma.email.create({
    data: {
      messageId,
      threadId: originalEmail.threadId || originalEmail.id,
      fromUserId: userId,
      toExternal: recipients,
      subject,
      bodyText,
      bodyHtml,
      folder: EmailFolder.SENT,
      sentAt: new Date(),
      replyToId: originalEmail.id,
      recipients: {
        create: recipients.map(email => ({
          email,
          type: 'to'
        }))
      }
    },
    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      recipients: true,
      attachments: true
    }
  });

  logger.info(`Reply sent: ${messageId} by ${req.user!.email}`);

  res.status(201).json({
    success: true,
    data: reply,
    message: 'Reply sent successfully'
  });
}));

/**
 * Get email threads
 */
router.get('/threads', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  // Get threads (emails with same threadId)
  const threads = await prisma.email.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { recipients: { some: { userId } } }
      ],
      threadId: { not: null }
    },
    include: {
      fromUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      recipients: true,
      _count: {
        select: { replies: true }
      }
    },
    orderBy: { sentAt: 'desc' },
    skip,
    take: limitNumber
  });

  res.json({
    success: true,
    data: threads,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total: threads.length,
      totalPages: Math.ceil(threads.length / limitNumber),
      hasNext: threads.length === limitNumber,
      hasPrev: pageNumber > 1
    }
  });
}));

export default router;
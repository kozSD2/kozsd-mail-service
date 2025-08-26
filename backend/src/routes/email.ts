import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
// import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { emailRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { encrypt, decrypt } from '../utils/encryption';
import { logger, activityLogger } from '../utils/logger';

const router = Router();
// const prisma = new PrismaClient();

// Apply authentication to all email routes
router.use(authenticateToken);

// Get user's emails
router.get('/',
  [
    query('folder').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString()
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const folder = req.query.folder as string || 'inbox';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      recipients: {
        some: {
          userId
        }
      },
      isDeleted: false
    };

    if (folder !== 'all') {
      whereClause.folders = {
        some: {
          folder: {
            name: folder,
            userId
          }
        }
      };
    }

    // Get emails
    const emails = await prisma.email.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileSize: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      skip,
      take: limit
    });

    // Decrypt email content
    const decryptedEmails = emails.map(email => ({
      id: email.id,
      subject: email.encryptedSubject, // In real implementation, decrypt this
      body: email.encryptedBody, // In real implementation, decrypt this
      sender: email.sender,
      recipients: email.recipients,
      attachments: email.attachments,
      isRead: email.isRead,
      isStarred: email.isStarred,
      isDraft: email.isDraft,
      priority: email.priority,
      sentAt: email.sentAt,
      readAt: email.readAt
    }));

    // Get total count
    const totalCount = await prisma.email.count({
      where: whereClause
    });

    res.json({
      emails: decryptedEmails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  })
);

// Get specific email
router.get('/:emailId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { emailId } = req.params;
    const userId = req.user!.id;

    const email = await prisma.email.findFirst({
      where: {
        id: emailId,
        recipients: {
          some: {
            userId
          }
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            s3Key: true
          }
        }
      }
    });

    if (!email) {
      return res.status(404).json({
        error: 'Email not found',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    // Mark as read
    await prisma.emailRecipient.updateMany({
      where: {
        emailId,
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Log activity
    activityLogger.info('Email read', {
      userId,
      emailId,
      timestamp: new Date().toISOString()
    });

    const decryptedEmail = {
      id: email.id,
      subject: email.encryptedSubject, // Decrypt in real implementation
      body: email.encryptedBody, // Decrypt in real implementation
      sender: email.sender,
      recipients: email.recipients,
      attachments: email.attachments,
      isRead: true,
      isStarred: email.isStarred,
      isDraft: email.isDraft,
      priority: email.priority,
      sentAt: email.sentAt,
      readAt: new Date()
    };

    res.json(decryptedEmail);
  })
);

// Send email
router.post('/',
  emailRateLimiter,
  [
    body('to').isArray().notEmpty().withMessage('Recipients are required'),
    body('subject').isString().notEmpty().withMessage('Subject is required'),
    body('body').isString().notEmpty().withMessage('Email body is required'),
    body('cc').optional().isArray(),
    body('bcc').optional().isArray(),
    body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    body('isDraft').optional().isBoolean()
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const { to, cc = [], bcc = [], subject, body, priority = 'NORMAL', isDraft = false } = req.body;

    // Encrypt email content
    const encryptedSubject = encrypt(subject);
    const encryptedBody = encrypt(body);

    // Create email
    const email = await prisma.email.create({
      data: {
        encryptedSubject: encryptedSubject.encryptedData,
        encryptedBody: encryptedBody.encryptedData,
        senderId: userId,
        priority,
        isDraft,
        sentAt: isDraft ? undefined : new Date()
      }
    });

    // Create recipients
    const allRecipients = [
      ...to.map((recipient: string) => ({ email: recipient, type: 'TO' })),
      ...cc.map((recipient: string) => ({ email: recipient, type: 'CC' })),
      ...bcc.map((recipient: string) => ({ email: recipient, type: 'BCC' }))
    ];

    for (const recipient of allRecipients) {
      // In real implementation, you'd find or create users based on email
      // For now, we'll skip this step
      console.log(`Would send to: ${recipient.email} (${recipient.type})`);
    }

    // Log activity
    activityLogger.info('Email sent', {
      userId,
      emailId: email.id,
      recipientCount: allRecipients.length,
      isDraft,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: isDraft ? 'Draft saved successfully' : 'Email sent successfully',
      email: {
        id: email.id,
        subject,
        isDraft,
        sentAt: email.sentAt
      }
    });
  })
);

// Update email (star/unstar, mark read/unread)
router.patch('/:emailId',
  [
    body('isStarred').optional().isBoolean(),
    body('isRead').optional().isBoolean()
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { emailId } = req.params;
    const userId = req.user!.id;
    const { isStarred, isRead } = req.body;

    // Check if user has access to this email
    const emailRecipient = await prisma.emailRecipient.findFirst({
      where: {
        emailId,
        userId
      }
    });

    if (!emailRecipient) {
      return res.status(404).json({
        error: 'Email not found',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    const updateData: any = {};
    if (typeof isStarred === 'boolean') {
      updateData.isStarred = isStarred;
    }
    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.readAt = new Date();
      }
    }

    // Update email recipient
    await prisma.emailRecipient.update({
      where: {
        id: emailRecipient.id
      },
      data: updateData
    });

    res.json({
      message: 'Email updated successfully'
    });
  })
);

// Delete email (move to trash)
router.delete('/:emailId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { emailId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this email
    const emailRecipient = await prisma.emailRecipient.findFirst({
      where: {
        emailId,
        userId
      }
    });

    if (!emailRecipient) {
      return res.status(404).json({
        error: 'Email not found',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    // Soft delete by moving to trash folder
    // In real implementation, you'd manage folder relationships
    await prisma.email.update({
      where: { id: emailId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // Log activity
    activityLogger.info('Email deleted', {
      userId,
      emailId,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Email deleted successfully'
    });
  })
);

export default router;
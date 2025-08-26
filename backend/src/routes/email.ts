import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AppDataSource } from '../config/database';
import { Email } from '../entities/Email';
import { EmailRecipient } from '../entities/EmailRecipient';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { emailRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { encrypt, decrypt } from '../utils/encryption';
import { logger, activityLogger } from '../utils/logger';

const router = Router();

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

    // Simple TypeORM implementation - get user's received emails
    const emailRepository = AppDataSource.getRepository(Email);
    const emails = await emailRepository.find({
      relations: {
        sender: true,
        recipients: {
          user: true
        },
        attachments: true
      },
      order: {
        sentAt: 'DESC'
      },
      skip,
      take: limit
    });

    // Filter emails where user is a recipient
    const userEmails = emails.filter(email => 
      email.recipients.some(recipient => recipient.user.id === userId)
    );

    // Decrypt email content and format response
    const decryptedEmails = userEmails.map(email => ({
      id: email.id,
      subject: email.encryptedSubject, // In real implementation, decrypt this
      body: email.encryptedBody, // In real implementation, decrypt this  
      sender: {
        id: email.sender.id,
        username: email.sender.username
      },
      recipients: email.recipients.map(recipient => ({
        user: {
          id: recipient.user.id,
          username: recipient.user.username
        },
        recipientType: recipient.recipientType
      })),
      attachments: email.attachments.map(attachment => ({
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize
      })),
      isRead: email.isRead,
      isStarred: email.isStarred,
      isDraft: email.isDraft,
      priority: email.priority,
      sentAt: email.sentAt,
      readAt: email.readAt
    }));

    // Get total count
    const totalCount = await emailRepository.count();

    res.json({
      emails: decryptedEmails,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  })
);

// Get specific email
router.get('/:emailId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'Get email endpoint - TypeORM implementation pending',
      emailId: req.params.emailId
    });
  })
);

// Send new email
router.post('/',
  emailRateLimiter,
  [
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject is required and must be less than 200 characters'),
    body('body').isLength({ min: 1, max: 50000 }).withMessage('Body is required and must be less than 50000 characters'),
    body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
    body('isDraft').optional().isBoolean().withMessage('isDraft must be boolean')
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'Send email endpoint - TypeORM implementation pending'
    });
  })
);

// Mark email as read
router.patch('/:emailId/read',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'Mark as read endpoint - TypeORM implementation pending'
    });
  })
);

// Star/unstar email
router.patch('/:emailId/star',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'Star email endpoint - TypeORM implementation pending'
    });
  })
);

export default router;
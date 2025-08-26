import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Folder } from '../entities/Folder';
import { EmailRecipient } from '../entities/EmailRecipient';
import { Email } from '../entities/Email';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get user profile
router.get('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isEduVerified: true,
        profileSettings: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        isEduVerified: user.isEduVerified,
        profileSettings: user.profileSettings,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive
      }
    });
  })
);

// Get user folders
router.get('/folders',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const folderRepository = AppDataSource.getRepository(Folder);
    const folders = await folderRepository.find({
      where: { userId },
      order: { name: 'ASC' }
    });

    res.json({
      folders
    });
  })
);

// Get user stats
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const emailRecipientRepository = AppDataSource.getRepository(EmailRecipient);
    const emailRepository = AppDataSource.getRepository(Email);

    const [
      totalEmails,
      unreadEmails,
      sentEmails,
      draftEmails
    ] = await Promise.all([
      emailRecipientRepository.count({
        where: { userId }
      }),
      emailRecipientRepository.count({
        where: { 
          userId,
          isRead: false
        }
      }),
      emailRepository.count({
        where: { senderId: userId }
      }),
      emailRepository.count({
        where: { 
          senderId: userId,
          isDraft: true 
        }
      })
    ]);

    res.json({
      stats: {
        totalEmails,
        unreadEmails,
        sentEmails,
        draftEmails
      }
    });
  })
);

export default router;
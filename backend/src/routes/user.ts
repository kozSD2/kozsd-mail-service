import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get user profile
router.get('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isEduVerified: true,
        profileSettings: true,
        createdAt: true,
        lastLoginAt: true
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
        ...user,
        email: req.user!.email // From decrypted token
      }
    });
  })
);

// Get user folders
router.get('/folders',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const folders = await prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    res.json({ folders });
  })
);

// Get user statistics
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const [
      totalEmails,
      unreadEmails,
      sentEmails,
      draftEmails
    ] = await Promise.all([
      prisma.emailRecipient.count({
        where: { userId }
      }),
      prisma.emailRecipient.count({
        where: { 
          userId,
          isRead: false
        }
      }),
      prisma.email.count({
        where: { 
          senderId: userId,
          isDraft: false
        }
      }),
      prisma.email.count({
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
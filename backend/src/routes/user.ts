import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get user profile
router.get('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'User profile endpoint - TypeORM implementation pending',
      user: req.user
    });
  })
);

// Get user folders
router.get('/folders',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'User folders endpoint - TypeORM implementation pending',
      folders: []
    });
  })
);

// Get user stats
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement with TypeORM - placeholder for now
    res.json({
      message: 'User stats endpoint - TypeORM implementation pending',
      stats: {
        totalEmails: 0,
        unreadEmails: 0,
        sentEmails: 0,
        draftEmails: 0
      }
    });
  })
);

export default router;
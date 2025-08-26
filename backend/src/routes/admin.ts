import { Router } from 'express';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
// import { PrismaClient } from '@prisma/client';

const router = Router();
// const prisma = new PrismaClient();

// Apply authentication and admin requirement to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get system statistics
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const [
      totalUsers,
      activeUsers,
      totalEmails,
      emailsToday,
      eduUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { isActive: true }
      }),
      prisma.email.count(),
      prisma.email.count({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: { isEduVerified: true }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalEmails,
        emailsToday,
        eduUsers
      }
    });
  })
);

// Get all users
router.get('/users',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isEduVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const totalUsers = await prisma.user.count();

    res.json({
      users,
      pagination: {
        page,
        limit,
        totalCount: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  })
);

// Get recent activity logs
router.get('/activity',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const totalActivities = await prisma.activityLog.count();

    res.json({
      activities,
      pagination: {
        page,
        limit,
        totalCount: totalActivities,
        totalPages: Math.ceil(totalActivities / limit)
      }
    });
  })
);

// Get login attempts
router.get('/login-attempts',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const attempts = await prisma.loginAttempt.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const totalAttempts = await prisma.loginAttempt.count();

    res.json({
      attempts,
      pagination: {
        page,
        limit,
        totalCount: totalAttempts,
        totalPages: Math.ceil(totalAttempts / limit)
      }
    });
  })
);

export default router;
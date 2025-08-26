import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { NotFoundError, AuthorizationError } from '@kozsd/shared';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * Get admin dashboard statistics
 */
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeek = new Date();
  thisWeek.setDate(today.getDate() - 7);
  
  const thisMonth = new Date();
  thisMonth.setDate(today.getDate() - 30);

  const [
    totalUsers,
    totalEmails,
    totalAttachments,
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    emailsSentToday,
    emailsReceivedToday,
    totalStorage,
    eduUsers,
    verifiedUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.email.count(),
    prisma.attachment.count(),
    prisma.user.count({
      where: { lastLoginAt: { gte: today } }
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: thisWeek } }
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: thisMonth } }
    }),
    prisma.email.count({
      where: { sentAt: { gte: today } }
    }),
    prisma.email.count({
      where: { receivedAt: { gte: today } }
    }),
    prisma.user.aggregate({
      _sum: { storageUsed: true }
    }),
    prisma.user.count({
      where: { isEduDomain: true }
    }),
    prisma.user.count({
      where: { isVerified: true }
    })
  ]);

  const stats = {
    totalUsers,
    totalEmails,
    totalAttachments,
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    emailsSentToday,
    emailsReceivedToday,
    totalStorage: totalStorage._sum.storageUsed?.toString() || '0',
    eduUsers,
    verifiedUsers,
    storageUsed: totalStorage._sum.storageUsed?.toString() || '0',
    storageLimit: '1TB' // This would be configurable
  };

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * Get all users with admin information
 */
router.get('/users', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, search, isActive, isEduDomain, isVerified } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  if (isEduDomain !== undefined) {
    whereClause.isEduDomain = isEduDomain === 'true';
  }

  if (isVerified !== undefined) {
    whereClause.isVerified = isVerified === 'true';
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEduDomain: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        emailQuotaUsed: true,
        storageUsed: true,
        _count: {
          select: {
            sentEmails: true,
            receivedEmails: true,
            attachments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNumber
    }),
    prisma.user.count({ where: whereClause })
  ]);

  const processedUsers = users.map(user => ({
    ...user,
    storageUsed: user.storageUsed.toString(),
    emailCount: user._count.sentEmails + user._count.receivedEmails,
    attachmentCount: user._count.attachments,
    _count: undefined
  }));

  const totalPages = Math.ceil(totalCount / limitNumber);

  res.json({
    success: true,
    data: processedUsers,
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
 * Get specific user details
 */
router.get('/users/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      settings: true,
      _count: {
        select: {
          sentEmails: true,
          receivedEmails: true,
          attachments: true,
          sessions: true
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const recentEmails = await prisma.email.findMany({
    where: {
      OR: [
        { fromUserId: id },
        { recipients: { some: { userId: id } } }
      ]
    },
    select: {
      id: true,
      subject: true,
      sentAt: true,
      folder: true
    },
    orderBy: { sentAt: 'desc' },
    take: 10
  });

  res.json({
    success: true,
    data: {
      ...user,
      storageUsed: user.storageUsed.toString(),
      recentEmails,
      stats: {
        emailCount: user._count.sentEmails + user._count.receivedEmails,
        sentEmails: user._count.sentEmails,
        receivedEmails: user._count.receivedEmails,
        attachments: user._count.attachments,
        activeSessions: user._count.sessions
      }
    }
  });
}));

/**
 * Update user status (activate/deactivate, verify, etc.)
 */
router.put('/users/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { isActive, isVerified, isEduDomain } = req.body;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(typeof isVerified === 'boolean' && { isVerified }),
      ...(typeof isEduDomain === 'boolean' && { isEduDomain })
    }
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE_USER',
      resource: `user:${id}`,
      details: {
        changes: { isActive, isVerified, isEduDomain },
        targetUser: user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  logger.info(`User ${user.email} updated by admin ${req.user!.email}:`, { isActive, isVerified, isEduDomain });

  res.json({
    success: true,
    data: {
      ...updatedUser,
      storageUsed: updatedUser.storageUsed.toString()
    },
    message: 'User updated successfully'
  });
}));

/**
 * Delete user account (admin only)
 */
router.delete('/users/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.id === req.user!.id) {
    throw new AuthorizationError('Cannot delete your own account');
  }

  await prisma.user.delete({
    where: { id }
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE_USER',
      resource: `user:${id}`,
      details: {
        deletedUser: user.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  logger.info(`User ${user.email} deleted by admin ${req.user!.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

/**
 * Get system emails (for monitoring)
 */
router.get('/emails', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, folder, search, dateFrom, dateTo } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  const whereClause: any = {};

  if (folder) {
    whereClause.folder = folder;
  }

  if (search) {
    whereClause.OR = [
      { subject: { contains: search as string, mode: 'insensitive' } },
      { bodyText: { contains: search as string, mode: 'insensitive' } }
    ];
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
            lastName: true
          }
        },
        _count: {
          select: {
            recipients: true,
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

  const totalPages = Math.ceil(totalCount / limitNumber);

  res.json({
    success: true,
    data: emails,
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
 * Get audit logs
 */
router.get('/audit-logs', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 50, action, userId, dateFrom, dateTo } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  const whereClause: any = {};

  if (action) {
    whereClause.action = action;
  }

  if (userId) {
    whereClause.userId = userId;
  }

  if (dateFrom) {
    whereClause.createdAt = { gte: new Date(dateFrom as string) };
  }

  if (dateTo) {
    whereClause.createdAt = {
      ...whereClause.createdAt,
      lte: new Date(dateTo as string)
    };
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNumber
    }),
    prisma.auditLog.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / limitNumber);

  res.json({
    success: true,
    data: logs,
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
 * Get system health metrics
 */
router.get('/health', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  // Database health check
  let dbHealth = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealth = 'healthy';
  } catch {
    dbHealth = 'unhealthy';
  }

  const health = {
    status: 'operational',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    database: dbHealth,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({
    success: true,
    data: health
  });
}));

export default router;
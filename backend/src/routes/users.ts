import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '@kozsd/shared';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get user profile
 */
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      settings: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEduDomain: user.isEduDomain,
      isVerified: user.isVerified,
      isActive: user.isActive,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      emailQuotaUsed: user.emailQuotaUsed,
      storageUsed: user.storageUsed.toString(),
      settings: user.settings
    }
  });
}));

/**
 * Update user profile
 */
router.put('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { firstName, lastName, avatar } = req.body;

  if (!firstName || !lastName) {
    throw new ValidationError('First name and last name are required');
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(avatar && { avatar })
    },
    include: {
      settings: true
    }
  });

  logger.info(`User profile updated: ${updatedUser.email}`);

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isEduDomain: updatedUser.isEduDomain,
      isVerified: updatedUser.isVerified,
      avatar: updatedUser.avatar,
      settings: updatedUser.settings
    },
    message: 'Profile updated successfully'
  });
}));

/**
 * Get user settings
 */
router.get('/settings', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await prisma.userSettings.findUnique({
    where: { userId: req.user!.id }
  });

  if (!settings) {
    throw new NotFoundError('Settings not found');
  }

  res.json({
    success: true,
    data: settings
  });
}));

/**
 * Update user settings
 */
router.put('/settings', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    theme,
    language,
    timezone,
    emailNotifications,
    pushNotifications,
    autoSave,
    signatureEnabled,
    signature
  } = req.body;

  const updatedSettings = await prisma.userSettings.upsert({
    where: { userId: req.user!.id },
    update: {
      ...(theme && { theme }),
      ...(language && { language }),
      ...(timezone && { timezone }),
      ...(typeof emailNotifications === 'boolean' && { emailNotifications }),
      ...(typeof pushNotifications === 'boolean' && { pushNotifications }),
      ...(typeof autoSave === 'boolean' && { autoSave }),
      ...(typeof signatureEnabled === 'boolean' && { signatureEnabled }),
      ...(signature !== undefined && { signature })
    },
    create: {
      userId: req.user!.id,
      theme: theme || 'auto',
      language: language || 'en',
      timezone: timezone || 'UTC',
      emailNotifications: emailNotifications !== false,
      pushNotifications: pushNotifications !== false,
      autoSave: autoSave !== false,
      signatureEnabled: signatureEnabled || false,
      signature
    }
  });

  logger.info(`User settings updated: ${req.user!.email}`);

  res.json({
    success: true,
    data: updatedSettings,
    message: 'Settings updated successfully'
  });
}));

/**
 * Get user statistics
 */
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const [
    totalEmails,
    sentEmails,
    receivedEmails,
    unreadEmails,
    starredEmails,
    draftEmails,
    attachments
  ] = await Promise.all([
    prisma.email.count({
      where: {
        OR: [
          { fromUserId: userId },
          { recipients: { some: { userId } } }
        ]
      }
    }),
    prisma.email.count({
      where: { fromUserId: userId }
    }),
    prisma.email.count({
      where: { recipients: { some: { userId } } }
    }),
    prisma.emailRecipient.count({
      where: { userId, isRead: false }
    }),
    prisma.email.count({
      where: {
        OR: [
          { fromUserId: userId, isStarred: true },
          { recipients: { some: { userId } } }
        ],
        isStarred: true
      }
    }),
    prisma.email.count({
      where: { fromUserId: userId, folder: 'drafts' }
    }),
    prisma.attachment.count({
      where: { userId }
    })
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, emailQuotaUsed: true }
  });

  res.json({
    success: true,
    data: {
      totalEmails,
      sentEmails,
      receivedEmails,
      unreadEmails,
      starredEmails,
      draftEmails,
      attachments,
      storageUsed: user?.storageUsed.toString() || '0',
      emailQuotaUsed: user?.emailQuotaUsed || 0
    }
  });
}));

/**
 * Delete user account
 */
router.delete('/account', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to delete account');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify password
  const { comparePassword } = await import('../utils/crypto');
  const isValidPassword = await comparePassword(password, user.passwordHash);
  
  if (!isValidPassword) {
    throw new ValidationError('Invalid password');
  }

  // Delete user and all associated data (cascade will handle related records)
  await prisma.user.delete({
    where: { id: req.user!.id }
  });

  logger.info(`User account deleted: ${user.email}`);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

export default router;
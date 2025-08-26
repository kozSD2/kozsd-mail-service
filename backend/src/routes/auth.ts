import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticationError, ValidationError, isValidEmail, isEduDomain } from '@kozsd/shared';
import logger from '../utils/logger';
import { cacheService } from '../services/redis';

const router = Router();
const prisma = new PrismaClient();

/**
 * Register new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw new ValidationError('All fields are required');
  }

  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  const emailLower = email.toLowerCase();
  const isEdu = isEduDomain(emailLower);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower }
  });

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isEduDomain: isEdu,
      settings: {
        create: {
          theme: 'auto',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          autoSave: true,
          signatureEnabled: false
        }
      }
    },
    include: {
      settings: true
    }
  });

  // Generate tokens
  const authUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isEduDomain: user.isEduDomain,
    isVerified: user.isVerified,
    avatar: user.avatar
  };

  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);

  // Store session
  await cacheService.setUserSession(user.id, {
    userId: user.id,
    email: user.email,
    loginAt: new Date(),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip
  });

  // Store refresh token in database
  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      }
    },
    message: 'User registered successfully'
  });
}));

/**
 * Login user
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const emailLower = email.toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    include: {
      settings: true
    }
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const authUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isEduDomain: user.isEduDomain,
    isVerified: user.isVerified,
    avatar: user.avatar
  };

  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);

  // Store session
  await cacheService.setUserSession(user.id, {
    userId: user.id,
    email: user.email,
    loginAt: new Date(),
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip
  });

  // Clean up old sessions and create new one
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: new Date() }
    }
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      }
    },
    message: 'Login successful'
  });
}));

/**
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  
  if (payload.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type');
  }

  // Check if session exists
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  if (!session.user.isActive) {
    throw new AuthenticationError('User account is deactivated');
  }

  // Generate new tokens
  const authUser = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    isEduDomain: session.user.isEduDomain,
    isVerified: session.user.isVerified,
    avatar: session.user.avatar
  };

  const newAccessToken = generateAccessToken(authUser);
  const newRefreshToken = generateRefreshToken(authUser);

  // Update session
  await prisma.session.update({
    where: { id: session.id },
    data: {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      updatedAt: new Date()
    }
  });

  logger.info(`Token refreshed for user: ${session.user.email}`);

  res.json({
    success: true,
    data: {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15 minutes
      }
    },
    message: 'Token refreshed successfully'
  });
}));

/**
 * Logout user
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (accessToken) {
    // Invalidate session
    await prisma.session.deleteMany({
      where: { token: accessToken }
    });
  }

  if (refreshToken) {
    // Invalidate refresh token
    await prisma.session.deleteMany({
      where: { refreshToken }
    });
  }

  logger.info('User logged out');

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * Get current user profile
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!accessToken) {
    throw new AuthenticationError('No access token provided');
  }

  // Find session
  const session = await prisma.session.findUnique({
    where: { token: accessToken },
    include: {
      user: {
        include: {
          settings: true
        }
      }
    }
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired token');
  }

  const user = session.user;
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEduDomain: user.isEduDomain,
      isVerified: user.isVerified,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      settings: user.settings
    }
  });
}));

export default router;
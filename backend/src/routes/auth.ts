import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { LoginAttempt } from '../entities/LoginAttempt';
import { hashPassword, verifyPassword, encrypt, generateUUID } from '../utils/encryption';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { logger, activityLogger } from '../utils/logger';

const router = Router();

// Register endpoint
router.post('/register', 
  authRateLimiter,
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscore, and dash'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({
      where: [
        { username },
        { encryptedEmail: encrypt(email).encryptedData }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const encryptedEmail = encrypt(email);
    const encryptionKeyId = generateUUID();

    const user = await userRepository.save({
      username,
      encryptedEmail: encryptedEmail.encryptedData,
      passwordHash: hashedPassword,
      encryptionKeyId,
      isEduVerified: email.toLowerCase().endsWith('.edu')
    });

    // Log activity
    activityLogger.info('User registered', {
      userId: user.id,
      username: user.username,
      isEduVerified: user.isEduVerified,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        isEduVerified: user.isEduVerified
      }
    });
  })
);

// Login endpoint
router.post('/login',
  authRateLimiter,
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isEduVerified: true,
        isActive: true,
        encryptedEmail: true
      }
    });

    if (!user || !user.isActive) {
      // Log failed attempt
      const loginAttemptRepository = AppDataSource.getRepository(LoginAttempt);
      await loginAttemptRepository.save({
        email: username,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'User not found or inactive'
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt
      const loginAttemptRepository = AppDataSource.getRepository(LoginAttempt);
      await loginAttemptRepository.save({
        userId: user.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'Invalid password'
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      refreshSecret,
      { expiresIn: '7d' }
    );

    // Update user with refresh token and last login
    await userRepository.update(
      { id: user.id },
      {
        refreshToken,
        lastLoginAt: new Date()
      }
    );

    // Log successful attempt
    const loginAttemptRepository = AppDataSource.getRepository(LoginAttempt);
    await loginAttemptRepository.save({
      userId: user.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Log activity
    activityLogger.info('User logged in', {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        isEduVerified: user.isEduVerified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  })
);

// Token refresh endpoint
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshSecret) {
        throw new Error('JWT refresh secret not configured');
      }

      const decoded = jwt.verify(refreshToken, refreshSecret) as any;
      
      // Find user and verify refresh token
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { 
          id: decoded.userId,
          refreshToken
        },
        select: {
          id: true,
          username: true,
          isEduVerified: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new access token
      const jwtSecret = process.env.JWT_ACCESS_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT access secret not configured');
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, username: user.username },
        jwtSecret,
        { expiresIn: '15m' }
      );

      res.json({
        accessToken: newAccessToken
      });

    } catch (error) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  })
);

// Logout endpoint
router.post('/logout',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Clear refresh token from database
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.update(
      { refreshToken },
      { refreshToken: null }
    );

    res.json({
      message: 'Logout successful'
    });
  })
);

export default router;
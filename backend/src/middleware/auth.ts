import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '@kozsd/shared';
import { verifyAccessToken } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEduDomain: boolean;
    isVerified: boolean;
    isActive: boolean;
  };
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header or cookies
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify the token
    const payload = verifyAccessToken(token);
    
    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEduDomain: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    // Attach user to request
    req.user = user;
    
    logger.debug(`Authenticated user: ${user.email}`);
    next();
    
  } catch (error) {
    logger.warn(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error);
  }
}

/**
 * Middleware to require verified email
 */
export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isVerified) {
    throw new AuthorizationError('Email verification required');
  }
  next();
}

/**
 * Middleware to require .edu domain
 */
export function requireEduDomain(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isEduDomain) {
    throw new AuthorizationError('Educational domain required');
  }
  next();
}

/**
 * Middleware to require admin privileges
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // For now, we'll consider .edu domain users as having admin privileges
  // In a real implementation, you'd have a separate admin role
  if (!req.user?.isEduDomain) {
    throw new AuthorizationError('Administrator privileges required');
  }
  next();
}

/**
 * Optional authentication middleware (doesn't throw if no token)
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authMiddleware(req, res, next);
  } catch (error) {
    // Don't throw, just continue without user
    next();
  }
}
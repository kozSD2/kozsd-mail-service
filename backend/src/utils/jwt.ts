import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthUser } from '@kozsd/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  isEduDomain: boolean;
  type: 'access' | 'refresh';
}

/**
 * Generate access token
 */
export function generateAccessToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    isEduDomain: user.isEduDomain,
    type: 'access'
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'kozsd-mail-service',
    subject: user.id
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    isEduDomain: user.isEduDomain,
    type: 'refresh'
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'kozsd-mail-service',
    subject: user.id
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}
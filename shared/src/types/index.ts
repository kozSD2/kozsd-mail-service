import { z } from 'zod';

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEduDomain: boolean;
  isVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoSave: boolean;
  signatureEnabled: boolean;
  signature?: string;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEduDomain: boolean;
  isVerified: boolean;
  avatar?: string;
}

// Email Types
export interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  folder: EmailFolder;
  labels: string[];
  attachments: Attachment[];
  encryptedBody?: string;
  sentAt: Date;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  replyToId?: string;
  forwardFromId?: string;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isInline: boolean;
  contentId?: string;
  uploadedAt: Date;
}

export enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  SPAM = 'spam',
  TRASH = 'trash',
  ARCHIVE = 'archive'
}

export interface EmailCompose {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  attachments?: File[];
  saveAsDraft?: boolean;
  scheduleSendAt?: Date;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  emailCount: number;
  lastEmailAt: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: EmailFolder;
  labels: string[];
  emails: Email[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and Search Types
export interface EmailFilters {
  folder?: EmailFolder;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  from?: string;
  to?: string;
  subject?: string;
  labels?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface EmailSort {
  field: 'sentAt' | 'receivedAt' | 'subject' | 'from';
  direction: 'asc' | 'desc';
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalEmails: number;
  totalStorage: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  emailsSentToday: number;
  emailsReceivedToday: number;
  storageUsed: number;
  storageLimit: number;
}

export interface AdminUser extends User {
  emailCount: number;
  storageUsed: number;
  lastActivity: Date;
  isBlocked: boolean;
  blockReason?: string;
}

// Rate Limiting Types
export interface RateLimit {
  windowMs: number;
  maxRequests: number;
  remaining: number;
  resetTime: Date;
}

// File Upload Types
export interface FileUploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Validation Schemas using Zod
export const EmailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

export const EmailComposeSchema = z.object({
  to: z.array(EmailAddressSchema).min(1),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  subject: z.string().min(1).max(998),
  bodyText: z.string().max(1000000),
  bodyHtml: z.string().max(1000000).optional(),
  saveAsDraft: z.boolean().optional(),
  scheduleSendAt: z.date().optional()
});

export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  autoSave: z.boolean(),
  signatureEnabled: z.boolean(),
  signature: z.string().max(1000).optional()
});

export const EmailFiltersSchema = z.object({
  folder: z.nativeEnum(EmailFolder).optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional()
});

// Error Types
export class KozSDError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'KozSDError';
  }
}

export class ValidationError extends KozSDError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends KozSDError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends KozSDError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends KozSDError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends KozSDError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}
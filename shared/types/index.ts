export interface User {
  id: string;
  username: string;
  email: string;
  isEduVerified: boolean;
  isActive: boolean;
  profileSettings?: any;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Email {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  sender?: User;
  recipients: EmailRecipient[];
  attachments: Attachment[];
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  isDeleted: boolean;
  priority: Priority;
  sentAt: Date;
  readAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailRecipient {
  id: string;
  emailId: string;
  userId: string;
  user?: User;
  recipientType: RecipientType;
  isRead: boolean;
  readAt?: Date;
}

export interface Attachment {
  id: string;
  originalName: string;
  encryptedName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  emailId?: string;
  uploadedBy: string;
  isScanned: boolean;
  scanResult?: ScanResult;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  isSystem: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface LoginAttempt {
  id: string;
  userId?: string;
  user?: User;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum RecipientType {
  TO = 'TO',
  CC = 'CC',
  BCC = 'BCC'
}

export enum ScanResult {
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
  SUSPICIOUS = 'SUSPICIOUS',
  ERROR = 'ERROR'
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface UserStats {
  totalEmails: number;
  unreadEmails: number;
  sentEmails: number;
  draftEmails: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalEmails: number;
  emailsToday: number;
  eduUsers: number;
}
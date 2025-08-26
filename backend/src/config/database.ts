import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// Import entities
import { User } from '../entities/User';
import { Email } from '../entities/Email';
import { EmailRecipient } from '../entities/EmailRecipient';
import { Folder } from '../entities/Folder';
import { EmailFolder } from '../entities/EmailFolder';
import { Attachment } from '../entities/Attachment';
import { ActivityLog } from '../entities/ActivityLog';
import { LoginAttempt } from '../entities/LoginAttempt';
import { EncryptionKey } from '../entities/EncryptionKey';
import { RateLimitLog } from '../entities/RateLimitLog';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development', // Only in development
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Email,
    EmailRecipient,
    Folder,
    EmailFolder,
    Attachment,
    ActivityLog,
    LoginAttempt,
    EncryptionKey,
    RateLimitLog
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize the database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
};

// Close the database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error during database disconnection:', error);
    throw error;
  }
};
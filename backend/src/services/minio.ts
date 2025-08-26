import * as Minio from 'minio';
import config from '../config';
import logger from '../utils/logger';
import { generateUUID } from '../utils/crypto';

let minioClient: Minio.Client;

/**
 * Initialize MinIO client and bucket
 */
export async function initializeMinIO(): Promise<Minio.Client> {
  if (minioClient) {
    return minioClient;
  }

  minioClient = new Minio.Client({
    endPoint: config.minio.endpoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey
  });

  // Check if bucket exists, create if not
  const bucketExists = await minioClient.bucketExists(config.minio.bucketName);
  
  if (!bucketExists) {
    await minioClient.makeBucket(config.minio.bucketName, 'us-east-1');
    logger.info(`Created MinIO bucket: ${config.minio.bucketName}`);
  }

  // Set bucket policy for public read access to thumbnails
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${config.minio.bucketName}/thumbnails/*`]
      }
    ]
  };

  try {
    await minioClient.setBucketPolicy(config.minio.bucketName, JSON.stringify(policy));
  } catch (error) {
    logger.warn('Could not set bucket policy:', error);
  }

  logger.info('MinIO client initialized successfully');
  return minioClient;
}

/**
 * Get MinIO client instance
 */
export function getMinIOClient(): Minio.Client {
  if (!minioClient) {
    throw new Error('MinIO client not initialized. Call initializeMinIO() first.');
  }
  return minioClient;
}

/**
 * File storage service
 */
export class FileStorageService {
  private client: Minio.Client;

  constructor() {
    this.client = getMinIOClient();
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<{ key: string; url: string; size: number }> {
    const fileExtension = originalName.split('.').pop() || '';
    const key = `attachments/${userId}/${generateUUID()}.${fileExtension}`;
    
    const metaData = {
      'Content-Type': mimeType,
      'X-Original-Name': originalName,
      'X-User-Id': userId
    };

    await this.client.putObject(
      config.minio.bucketName,
      key,
      buffer,
      buffer.length,
      metaData
    );

    const url = await this.getFileUrl(key);
    
    return {
      key,
      url,
      size: buffer.length
    };
  }

  /**
   * Upload thumbnail
   */
  async uploadThumbnail(
    buffer: Buffer,
    originalKey: string,
    mimeType: string = 'image/jpeg'
  ): Promise<{ key: string; url: string }> {
    const thumbnailKey = `thumbnails/${originalKey.replace('attachments/', '')}.thumb.jpg`;
    
    const metaData = {
      'Content-Type': mimeType,
      'X-Original-Key': originalKey
    };

    await this.client.putObject(
      config.minio.bucketName,
      thumbnailKey,
      buffer,
      buffer.length,
      metaData
    );

    const url = await this.getFileUrl(thumbnailKey);
    
    return {
      key: thumbnailKey,
      url
    };
  }

  /**
   * Get file download URL
   */
  async getFileUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return await this.client.presignedGetObject(
      config.minio.bucketName,
      key,
      expirySeconds
    );
  }

  /**
   * Get file stream
   */
  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    return await this.client.getObject(config.minio.bucketName, key);
  }

  /**
   * Delete file
   */
  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(config.minio.bucketName, key);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await this.client.removeObjects(config.minio.bucketName, keys);
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(config.minio.bucketName, key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<any> {
    return await this.client.statObject(config.minio.bucketName, key);
  }

  /**
   * List files with prefix
   */
  async listFiles(prefix: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const files: string[] = [];
      const stream = this.client.listObjects(
        config.minio.bucketName,
        prefix,
        true
      );

      stream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });

      stream.on('end', () => {
        resolve(files);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    const files = await this.listFiles(`attachments/${userId}/`);
    let totalSize = 0;

    for (const file of files) {
      try {
        const metadata = await this.getFileMetadata(file);
        totalSize += metadata.size;
      } catch (error) {
        logger.warn(`Could not get size for file ${file}:`, error);
      }
    }

    return totalSize;
  }
}

export const fileStorageService = new FileStorageService();
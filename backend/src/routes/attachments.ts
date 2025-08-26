import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError, NotFoundError, FileUploadError } from '@kozsd/shared';
import { fileStorageService } from '../services/minio';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new FileUploadError(`File type ${file.mimetype} is not allowed`));
    }
  }
});

/**
 * Upload attachments
 */
router.post('/upload', upload.array('files'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new ValidationError('No files provided');
  }

  const uploadedAttachments = [];

  for (const file of files) {
    try {
      // Upload to MinIO
      const uploadResult = await fileStorageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId
      );

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          userId,
          emailId: req.body.emailId || '', // Will be updated when email is created
          filename: `${Date.now()}_${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: BigInt(file.size),
          storageKey: uploadResult.key,
          url: uploadResult.url,
          isInline: req.body.isInline === 'true'
        }
      });

      // Update user storage usage
      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            increment: BigInt(file.size)
          }
        }
      });

      uploadedAttachments.push({
        id: attachment.id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size.toString(),
        url: attachment.url,
        isInline: attachment.isInline
      });

      logger.info(`File uploaded: ${file.originalname} by ${req.user!.email}`);

    } catch (error) {
      logger.error(`Error uploading file ${file.originalname}:`, error);
      throw new FileUploadError(`Failed to upload ${file.originalname}`);
    }
  }

  res.status(201).json({
    success: true,
    data: uploadedAttachments,
    message: `${uploadedAttachments.length} file(s) uploaded successfully`
  });
}));

/**
 * Get attachment by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      OR: [
        { userId }, // User's own attachment
        {
          email: {
            OR: [
              { fromUserId: userId },
              { recipients: { some: { userId } } }
            ]
          }
        }
      ]
    },
    include: {
      email: {
        select: {
          id: true,
          subject: true,
          fromUserId: true
        }
      }
    }
  });

  if (!attachment) {
    throw new NotFoundError('Attachment not found');
  }

  res.json({
    success: true,
    data: {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size.toString(),
      url: attachment.url,
      thumbnailUrl: attachment.thumbnailUrl,
      isInline: attachment.isInline,
      uploadedAt: attachment.uploadedAt,
      email: attachment.email
    }
  });
}));

/**
 * Download attachment
 */
router.get('/:id/download', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      OR: [
        { userId },
        {
          email: {
            OR: [
              { fromUserId: userId },
              { recipients: { some: { userId } } }
            ]
          }
        }
      ]
    }
  });

  if (!attachment) {
    throw new NotFoundError('Attachment not found');
  }

  try {
    // Get file stream from MinIO
    const fileStream = await fileStorageService.getFileStream(attachment.storageKey);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.size.toString());

    // Pipe file stream to response
    fileStream.pipe(res);

    logger.info(`File downloaded: ${attachment.originalName} by ${req.user!.email}`);

  } catch (error) {
    logger.error(`Error downloading file ${attachment.originalName}:`, error);
    throw new FileUploadError('Failed to download file');
  }
}));

/**
 * Delete attachment
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      userId // Only allow users to delete their own attachments
    }
  });

  if (!attachment) {
    throw new NotFoundError('Attachment not found');
  }

  try {
    // Delete from MinIO
    await fileStorageService.deleteFile(attachment.storageKey);

    // Delete thumbnail if exists
    if (attachment.thumbnailUrl) {
      const thumbnailKey = attachment.storageKey.replace('attachments/', 'thumbnails/') + '.thumb.jpg';
      await fileStorageService.deleteFile(thumbnailKey);
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id }
    });

    // Update user storage usage
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          decrement: attachment.size
        }
      }
    });

    logger.info(`Attachment deleted: ${attachment.originalName} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    logger.error(`Error deleting attachment ${attachment.originalName}:`, error);
    throw new FileUploadError('Failed to delete attachment');
  }
}));

/**
 * Get user's attachments
 */
router.get('/user/list', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20, mimeType } = req.query;

  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  const whereClause: any = { userId };

  if (mimeType) {
    whereClause.mimeType = { startsWith: mimeType as string };
  }

  const [attachments, totalCount] = await Promise.all([
    prisma.attachment.findMany({
      where: whereClause,
      include: {
        email: {
          select: {
            id: true,
            subject: true,
            sentAt: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limitNumber
    }),
    prisma.attachment.count({ where: whereClause })
  ]);

  const processedAttachments = attachments.map(attachment => ({
    id: attachment.id,
    filename: attachment.filename,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size.toString(),
    url: attachment.url,
    thumbnailUrl: attachment.thumbnailUrl,
    isInline: attachment.isInline,
    uploadedAt: attachment.uploadedAt,
    email: attachment.email
  }));

  const totalPages = Math.ceil(totalCount / limitNumber);

  res.json({
    success: true,
    data: processedAttachments,
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
 * Generate thumbnail for image attachment
 */
router.post('/:id/thumbnail', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: {
      id,
      userId,
      mimeType: { startsWith: 'image/' }
    }
  });

  if (!attachment) {
    throw new NotFoundError('Image attachment not found');
  }

  if (attachment.thumbnailUrl) {
    return res.json({
      success: true,
      data: { thumbnailUrl: attachment.thumbnailUrl },
      message: 'Thumbnail already exists'
    });
  }

  try {
    // This is a simplified thumbnail generation
    // In a real implementation, you'd use a library like Sharp to resize the image
    const fileStream = await fileStorageService.getFileStream(attachment.storageKey);
    
    // For now, just return the original image URL as thumbnail
    // In production, implement actual thumbnail generation
    const thumbnailUrl = attachment.url;

    // Update attachment with thumbnail URL
    await prisma.attachment.update({
      where: { id },
      data: { thumbnailUrl }
    });

    res.json({
      success: true,
      data: { thumbnailUrl },
      message: 'Thumbnail generated successfully'
    });

  } catch (error) {
    logger.error(`Error generating thumbnail for ${attachment.originalName}:`, error);
    throw new FileUploadError('Failed to generate thumbnail');
  }
}));

export default router;
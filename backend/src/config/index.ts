import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  minio: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucketName: string;
  };
  email: {
    from: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  encryption: {
    algorithm: string;
    key: string;
    iv: string;
  };
  rateLimit: {
    windowMs: number;
    normalUserLimit: number;
    eduUserLimit: number;
    adminUserLimit: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://kozsd:kozsd123@localhost:5432/kozsd_mail_service'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'kozsd-mail-access-secret-key-2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'kozsd-mail-refresh-secret-key-2024',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'kozsd-mail-minio',
    secretKey: process.env.MINIO_SECRET_KEY || 'kozsd-mail-minio-secret-2024',
    bucketName: process.env.MINIO_BUCKET_NAME || 'kozsd-mail-attachments'
  },
  
  email: {
    from: process.env.EMAIL_FROM || 'noreply@kozsd-mail.com',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'kozsd-mail',
        pass: process.env.SMTP_PASS || 'kozsd-mail-2024'
      }
    }
  },
  
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || 'kozsd-mail-encryption-key-32-chars',
    iv: process.env.ENCRYPTION_IV || 'kozsd-mail-iv-16'
  },
  
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    normalUserLimit: 50,
    eduUserLimit: 200,
    adminUserLimit: 1000
  },
  
  cors: {
    origin: [
      'http://localhost:3000', // Frontend
      'http://localhost:3001', // Admin
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
}

export default config;
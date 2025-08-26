import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment or generate one
const getEncryptionKey = (): Buffer => {
  const key = process.env.AES_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('AES_ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is less than 32 bytes, derive it using PBKDF2
  if (key.length < KEY_LENGTH) {
    return crypto.pbkdf2Sync(key, 'kozsd-salt', 100000, KEY_LENGTH, 'sha256');
  }
  
  return Buffer.from(key.slice(0, KEY_LENGTH), 'utf8');
};

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  salt: string;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export const encrypt = (text: string): EncryptedData => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = getEncryptionKey();
    
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
};

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export const decrypt = (encryptedObj: EncryptedData): string => {
  try {
    const { encryptedData, iv, tag, salt } = encryptedObj;
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcrypt');
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};
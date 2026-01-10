import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

/**
 * Encrypt data using AES-256-GCM
 * @param data - Buffer to encrypt
 * @returns Encrypted buffer with IV, auth tag, and encrypted data
 */
export function encrypt(data: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Buffer containing IV, auth tag, and encrypted data
 * @returns Decrypted buffer
 */
export function decrypt(encryptedData: Buffer): Buffer {
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Encrypt string data
 * @param text - String to encrypt
 * @returns Encrypted buffer
 */
export function encryptString(text: string): Buffer {
    return encrypt(Buffer.from(text, 'utf-8'));
}

/**
 * Decrypt to string
 * @param encryptedData - Encrypted buffer
 * @returns Decrypted string
 */
export function decryptString(encryptedData: Buffer): string {
    return decrypt(encryptedData).toString('utf-8');
}


import crypto from 'crypto';
import config from '../config';

const ALGORITHM = 'aes-256-gcm';
// Key length depends on the algorithm. For AES-256-GCM, it's 32 bytes.
// Ensure the ENCRYPTION_KEY in .env is 64 hex characters (32 bytes)
const key = Buffer.from(config.encryptionKey, 'hex');
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16; // For GCM

/**
 * Encrypts text using AES-256-GCM.
 * @param text The text to encrypt.
 * @returns The encrypted text (hex string: iv + authTag + encryptedData).
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Combine IV, authTag, and encrypted data for storage/transmission
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
};

/**
 * Decrypts text encrypted with AES-256-GCM.
 * @param encryptedTextHex The encrypted text (hex string: iv + authTag + encryptedData).
 * @returns The original decrypted text.
 * @throws Error if decryption fails (e.g., invalid key, tampered data).
 */
export const decrypt = (encryptedTextHex: string): string => {
  const encryptedBuffer = Buffer.from(encryptedTextHex, 'hex');
  if (encryptedBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted text format: too short.');
  }

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedData = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // Log the specific error internally but return a generic message
    console.error("Decryption failed:", error);
    // Rethrow a more generic error or handle appropriately
    // Throwing error here will be caught by the controller's error handler
    throw new Error('Decryption failed. Invalid key or data integrity check failed.');
  }
};


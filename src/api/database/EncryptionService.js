/**
 * Encryption Service
 * Handles client-side encryption for sensitive data
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 16; // 128 bits for GCM
    this.saltLength = 16;
    this.iterations = 100000; // PBKDF2 iterations
    
    // Fields that should be encrypted
    this.sensitiveFields = {
      systemUsers: ['password', 'email', 'phone'],
      clients: ['email', 'phone', 'address'],
      personalMessages: ['content'],
      comments: ['content'],
      workHours: ['notes']
    };
  }

  /**
   * Generate encryption key from password
   */
  async generateKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    return key;
  }

  /**
   * Generate random salt
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  /**
   * Generate random IV
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Encrypt data
   */
  async encrypt(data, password) {
    try {
      if (!data || typeof data !== 'string') {
        return data; // Return as-is if not a string
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();
      
      // Generate key
      const key = await this.generateKey(password, salt);
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );
      
      // Combine salt, IV, and encrypted data
      const combined = new Uint8Array(
        this.saltLength + this.ivLength + encryptedBuffer.byteLength
      );
      
      combined.set(salt, 0);
      combined.set(iv, this.saltLength);
      combined.set(new Uint8Array(encryptedBuffer), this.saltLength + this.ivLength);
      
      // Return base64 encoded string
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Return original data if encryption fails
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData, password) {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        return encryptedData; // Return as-is if not encrypted
      }

      // Check if data looks like encrypted data (base64)
      if (!this.isBase64(encryptedData)) {
        return encryptedData; // Return as-is if not base64
      }

      // Decode base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      if (combined.byteLength < this.saltLength + this.ivLength) {
        return encryptedData; // Invalid encrypted data
      }
      
      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const encrypted = combined.slice(this.saltLength + this.ivLength);
      
      // Generate key
      const key = await this.generateKey(password, salt);
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData; // Return encrypted data if decryption fails
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  async encryptObject(obj, entityType, password) {
    if (!obj || !this.sensitiveFields[entityType] || !password) {
      return obj;
    }

    const encrypted = { ...obj };
    const fieldsToEncrypt = this.sensitiveFields[entityType];

    for (const field of fieldsToEncrypt) {
      if (encrypted[field]) {
        encrypted[field] = await this.encrypt(encrypted[field], password);
      }
    }

    // Mark as encrypted
    encrypted._encrypted = true;
    encrypted._encryptedFields = fieldsToEncrypt;

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in an object
   */
  async decryptObject(obj, entityType, password) {
    if (!obj || !obj._encrypted || !password) {
      return obj;
    }

    const decrypted = { ...obj };
    const fieldsToDecrypt = obj._encryptedFields || this.sensitiveFields[entityType] || [];

    for (const field of fieldsToDecrypt) {
      if (decrypted[field]) {
        decrypted[field] = await this.decrypt(decrypted[field], password);
      }
    }

    // Remove encryption metadata
    delete decrypted._encrypted;
    delete decrypted._encryptedFields;

    return decrypted;
  }

  /**
   * Encrypt array of objects
   */
  async encryptArray(array, entityType, password) {
    if (!Array.isArray(array) || !password) {
      return array;
    }

    const encrypted = [];
    for (const item of array) {
      encrypted.push(await this.encryptObject(item, entityType, password));
    }

    return encrypted;
  }

  /**
   * Decrypt array of objects
   */
  async decryptArray(array, entityType, password) {
    if (!Array.isArray(array) || !password) {
      return array;
    }

    const decrypted = [];
    for (const item of array) {
      decrypted.push(await this.decryptObject(item, entityType, password));
    }

    return decrypted;
  }

  /**
   * Generate encryption password from user credentials
   */
  generateEncryptionPassword(userId, userEmail) {
    // Simple password generation - in production, use a more secure method
    return `${userId}_${userEmail}_pixelart_2024`;
  }

  /**
   * Check if entity type has sensitive fields
   */
  hasSensitiveFields(entityType) {
    return this.sensitiveFields.hasOwnProperty(entityType);
  }

  /**
   * Get sensitive fields for entity type
   */
  getSensitiveFields(entityType) {
    return this.sensitiveFields[entityType] || [];
  }

  // Utility methods

  /**
   * Convert ArrayBuffer to base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check if string is valid base64
   */
  isBase64(str) {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  /**
   * Hash password for storage (one-way)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    
    return password;
  }
}

// Create and export singleton instance
export const encryptionService = new EncryptionService();
export default encryptionService;

/**
 * SecureStorage
 * 安全存储类 - 使用 AES-256-GCM 加密 API 密钥
 *
 * 安全特性：
 * - AES-256-GCM 对称加密
 * - PBKDF2 密钥派生（100,000 次迭代）
 * - 随机 IV 和 Salt
 * - GCM 认证标签防篡改
 *
 * @author Half open flowers
 */

// ==================== 常量配置 ====================

/**
 * 加密算法配置
 */
const CRYPTO_CONFIG = {
  /** 加密算法名称 */
  ALGORITHM: 'AES-GCM' as const,
  /** 密钥长度（位） */
  KEY_LENGTH: 256,
  /** IV 长度（字节） */
  IV_LENGTH: 12,
  /** Salt 长度（字节） */
  SALT_LENGTH: 16,
  /** PBKDF2 迭代次数 */
  PBKDF2_ITERATIONS: 100000,
  /** PBKDF2 哈希算法 */
  PBKDF2_HASH: 'SHA-256' as const,
} as const;

// ==================== 类型定义 ====================

/**
 * 加密结果
 */
interface EncryptedData {
  /** 密文（Base64） */
  ciphertext: string;
  /** 初始化向量（Base64） */
  iv: string;
  /** 盐值（Base64） */
  salt: string;
  /** 认证标签（Base64） */
  tag: string;
}

/**
 * 解密输入
 */
interface DecryptInput {
  /** 密文（Base64） */
  ciphertext: string;
  /** 初始化向量（Base64） */
  iv: string;
  /** 盐值（Base64） */
  salt: string;
  /** 认证标签（Base64） */
  tag: string;
}

// ==================== SecureStorage 类 ====================

/**
 * 安全存储类
 */
export class SecureStorage {
  private masterKey: CryptoKey | null = null;

  /**
   * 初始化主密钥
   * @param password 用户密码
   */
  async initialize(password: string): Promise<void> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // 导入密码作为 CryptoKey
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );
  }

  /**
   * 从密码派生加密密钥
   * @param salt 盐值
   * @returns 派生的加密密钥
   */
  private async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    if (!this.masterKey) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        hash: CRYPTO_CONFIG.PBKDF2_HASH,
      },
      this.masterKey,
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        length: CRYPTO_CONFIG.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * 加密明文
   * @param plaintext 明文
   * @returns 加密后的数据
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    if (!this.masterKey) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    // 生成随机 IV 和 Salt
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));
    const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH));

    // 从密码派生加密密钥
    const key = await this.deriveKey(salt);

    // 编码明文
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // AES-GCM 加密
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM,
        iv,
      },
      key,
      plaintextBuffer,
    );

    // GCM 模式下，密文包含认证标签（最后 16 字节）
    const ciphertext = new Uint8Array(ciphertextBuffer);
    const tag = ciphertext.slice(-16);
    const actualCiphertext = ciphertext.slice(0, -16);

    // 转换为 Base64
    return {
      ciphertext: this.arrayBufferToBase64(actualCiphertext),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
      tag: this.arrayBufferToBase64(tag),
    };
  }

  /**
   * 解密密文
   * @param encrypted 加密数据
   * @returns 解密后的明文
   */
  async decrypt(encrypted: DecryptInput): Promise<string> {
    if (!this.masterKey) {
      throw new Error('SecureStorage not initialized. Call initialize() first.');
    }

    // 从 Base64 解码
    const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
    const iv = this.base64ToArrayBuffer(encrypted.iv);
    const salt = this.base64ToArrayBuffer(encrypted.salt);
    const tag = this.base64ToArrayBuffer(encrypted.tag);

    // 重组完整密文（密文 + 标签）
    const fullCiphertext = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    fullCiphertext.set(new Uint8Array(ciphertext), 0);
    fullCiphertext.set(new Uint8Array(tag), ciphertext.byteLength);

    // 从密码派生解密密钥
    const key = await this.deriveKey(new Uint8Array(salt));

    try {
      // AES-GCM 解密（自动验证认证标签）
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: CRYPTO_CONFIG.ALGORITHM,
          iv: new Uint8Array(iv),
        },
        key,
        fullCiphertext,
      );

      // 解码明文
      const decoder = new TextDecoder();
      return decoder.decode(plaintextBuffer);
    } catch (error) {
      throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
  }

  /**
   * 清除主密钥（安全地从内存中移除）
   */
  clear(): void {
    this.masterKey = null;
  }

  // ==================== 工具方法 ====================

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i] as number);
    }
    return btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ==================== 单例导出 ====================

/**
 * 全局单例实例
 */
export const secureStorage = new SecureStorage();

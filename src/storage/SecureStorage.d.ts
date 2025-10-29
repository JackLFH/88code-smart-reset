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
/**
 * 安全存储类
 */
export declare class SecureStorage {
    private masterKey;
    /**
     * 初始化主密钥
     * @param password 用户密码
     */
    initialize(password: string): Promise<void>;
    /**
     * 从密码派生加密密钥
     * @param salt 盐值
     * @returns 派生的加密密钥
     */
    private deriveKey;
    /**
     * 加密明文
     * @param plaintext 明文
     * @returns 加密后的数据
     */
    encrypt(plaintext: string): Promise<EncryptedData>;
    /**
     * 解密密文
     * @param encrypted 加密数据
     * @returns 解密后的明文
     */
    decrypt(encrypted: DecryptInput): Promise<string>;
    /**
     * 清除主密钥（安全地从内存中移除）
     */
    clear(): void;
    /**
     * ArrayBuffer 转 Base64
     */
    private arrayBufferToBase64;
    /**
     * Base64 转 ArrayBuffer
     */
    private base64ToArrayBuffer;
}
/**
 * 全局单例实例
 */
export declare const secureStorage: SecureStorage;
export {};
//# sourceMappingURL=SecureStorage.d.ts.map
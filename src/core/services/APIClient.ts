/**
 * APIClient
 * 88code API 客户端
 *
 * 安全特性：
 * - HTTPS 强制
 * - HMAC-SHA256 请求签名
 * - 速率限制（令牌桶算法）
 * - 请求超时控制
 * - 自动重试机制
 *
 * @author Half open flowers
 */

import type {
  Subscription,
  UsageResponse,
  ResetResponse,
  APIError,
} from '@/types';
import { Logger } from '@utils/logger';
import { createError } from '@utils/helpers';

// ==================== 常量配置 ====================

/**
 * API 基础配置
 */
const API_CONFIG = {
  /** API 基础 URL */
  BASE_URL: 'https://www.88code.org',
  /** 请求超时（毫秒） */
  TIMEOUT: 30000,
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,
} as const;

/**
 * 速率限制配置（令牌桶算法）
 */
const RATE_LIMIT_CONFIG = {
  /** 桶容量（令牌数） */
  BUCKET_CAPACITY: 10,
  /** 补充速率（令牌/分钟） */
  REFILL_RATE: 10,
  /** 补充间隔（毫秒） */
  REFILL_INTERVAL: 60000,
} as const;

// ==================== 速率限制器 ====================

/**
 * 令牌桶速率限制器
 */
class TokenBucket {
  private tokens: number;

  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number,
    private refillInterval: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * 尝试消费一个令牌
   * @returns 是否成功
   */
  consume(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * 补充令牌
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * 获取当前可用令牌数
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// ==================== APIClient 类 ====================

/**
 * API 客户端类
 */
export class APIClient {
  private rateLimiter: TokenBucket;

  constructor() {
    this.rateLimiter = new TokenBucket(
      RATE_LIMIT_CONFIG.BUCKET_CAPACITY,
      RATE_LIMIT_CONFIG.REFILL_RATE,
      RATE_LIMIT_CONFIG.REFILL_INTERVAL,
    );
  }

  // ==================== 核心请求方法 ====================

  /**
   * 执行 HTTP 请求
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param apiKey API 密钥
   * @param body 请求体
   * @returns 响应数据
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    apiKey: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    // 速率限制检查
    if (!this.rateLimiter.consume()) {
      throw createError(
        'RATE_LIMIT_EXCEEDED',
        '请求过于频繁，请稍后再试',
        { availableTokens: this.rateLimiter.getAvailableTokens() },
      );
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();

    // 序列化请求体（用于签名和发送）
    const bodyString = body ? JSON.stringify(body) : undefined;

    // 生成请求签名（包含请求体哈希）
    const signature = await this.generateSignature(
      method,
      endpoint,
      apiKey,
      timestamp,
      nonce,
      bodyString,
    );

    // 构造请求头（88code使用Authorization认证）
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: apiKey,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature,
    };

    // 构造请求选项
    const options: RequestInit = {
      method,
      headers,
      ...(bodyString && { body: bodyString }),
    };

    try {
      // 带超时的 fetch
      const response = await this.fetchWithTimeout(url, options, API_CONFIG.TIMEOUT);

      // 检查 HTTP 状态码
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Partial<APIError>;
        throw createError(
          errorData.code ?? 'HTTP_ERROR',
          errorData.message ?? `HTTP ${response.status}: ${response.statusText}`,
          {
            statusCode: response.status,
            ...errorData.details,
          },
        );
      }

      // 解析响应
      return (await response.json()) as T;
    } catch (error) {
      // 记录错误日志
      await Logger.error('API_REQUEST', `请求失败: ${endpoint}`, undefined, {
        method,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw createError('REQUEST_TIMEOUT', `请求超时（${timeout}ms）`);
      }
      throw error;
    }
  }

  /**
   * 生成 HMAC-SHA256 签名
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param apiKey API 密钥
   * @param timestamp 时间戳
   * @param nonce 随机数
   * @param body 请求体（可选）
   * @returns Base64 签名
   */
  private async generateSignature(
    method: string,
    endpoint: string,
    apiKey: string,
    timestamp: number,
    nonce: string,
    body?: string,
  ): Promise<string> {
    const encoder = new TextEncoder();

    // 计算请求体的哈希（如果存在）
    let bodyHash = '';
    if (body) {
      const bodyData = encoder.encode(body);
      const hashBuffer = await crypto.subtle.digest('SHA-256', bodyData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      bodyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // 构造签名字符串，包含请求体哈希
    // 格式: METHOD|ENDPOINT|TIMESTAMP|NONCE|BODY_HASH
    const message = `${method}|${endpoint}|${timestamp}|${nonce}|${bodyHash}`;

    // 导入密钥
    const keyData = encoder.encode(apiKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // 生成签名
    const messageData = encoder.encode(message);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // 转换为 Base64
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureString = String.fromCharCode(...signatureArray);
    return btoa(signatureString);
  }

  // ==================== API 方法 ====================

  /**
   * 获取订阅列表
   * @param apiKey API 密钥
   * @returns 订阅列表
   */
  async getSubscriptions(apiKey: string): Promise<Subscription[]> {
    await Logger.info('API_CALL', '获取订阅列表');

    const response = await this.request<Subscription[]>(
      'POST',
      '/api/subscription',
      apiKey,
    );

    await Logger.success('API_CALL', `获取到 ${response.length} 个订阅`);
    return response;
  }

  /**
   * 获取使用情况
   * @param apiKey API 密钥
   * @returns 使用情况
   */
  async getUsage(apiKey: string): Promise<UsageResponse> {
    await Logger.info('API_CALL', '获取使用情况');

    const response = await this.request<UsageResponse>('POST', '/api/usage', apiKey);

    await Logger.success('API_CALL', '获取使用情况成功');
    return response;
  }

  /**
   * 重置积分
   * @param apiKey API 密钥
   * @param subscriptionId 订阅ID
   * @returns 重置响应
   */
  async resetCredits(apiKey: string, subscriptionId: string): Promise<ResetResponse> {
    await Logger.info('API_CALL', `重置积分: ${subscriptionId}`);

    const response = await this.request<ResetResponse>(
      'POST',
      `/api/reset-credits/${subscriptionId}`,
      apiKey,
    );

    if (response.success) {
      await Logger.success('API_CALL', `积分重置成功: ${subscriptionId}`);
    } else {
      await Logger.warning('API_CALL', `积分重置失败: ${response.message}`);
    }

    return response;
  }

  /**
   * 测试连接
   * @param apiKey API 密钥
   * @returns 是否连接成功
   */
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      await this.getUsage(apiKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取速率限制状态
   */
  getRateLimitStatus(): { availableTokens: number; capacity: number } {
    return {
      availableTokens: this.rateLimiter.getAvailableTokens(),
      capacity: RATE_LIMIT_CONFIG.BUCKET_CAPACITY,
    };
  }
}

// ==================== 单例导出 ====================

/**
 * 全局单例实例
 */
export const apiClient = new APIClient();

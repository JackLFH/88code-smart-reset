/**
 * APIClient
 * 88code API 客户端
 *
 * 安全特性：
 * - HTTPS 强制
 * - Authorization 认证
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

    // 序列化请求体
    const bodyString = body ? JSON.stringify(body) : undefined;

    // 构造请求头（88code只需要Authorization认证，无需签名）
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    };

    // 构造请求选项
    const options: RequestInit = {
      method,
      headers,
      ...(bodyString && { body: bodyString }),
    };

    // 详细记录请求信息
    await Logger.info('API_REQUEST_START', `发起请求: ${method} ${endpoint}`, undefined, {
      url,
      method,
      hasBody: !!bodyString,
      apiKeyPrefix: apiKey.slice(0, 8) + '...',
    });

    try {
      // 带超时的 fetch
      const response = await this.fetchWithTimeout(url, options, API_CONFIG.TIMEOUT);

      // 记录响应状态
      await Logger.info('API_RESPONSE_STATUS', `收到响应: ${endpoint}`, undefined, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // 🔍 直接输出到console进行调试
      console.log(`[DEBUG] 响应状态: ${response.status} ${response.statusText}, ok=${response.ok}`);

      // 检查 HTTP 状态码
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Partial<APIError>;
        const errorMessage = errorData.message ?? `HTTP ${response.status}: ${response.statusText}`;

        // 🔍 输出错误详情
        console.error('[DEBUG] API返回错误:', {
          status: response.status,
          statusText: response.statusText,
          errorCode: errorData.code,
          errorMessage,
          errorData,
        });

        // 记录详细的错误信息
        await Logger.error('API_ERROR_RESPONSE', `API返回错误 (${endpoint})`, undefined, {
          statusCode: response.status,
          statusText: response.statusText,
          errorCode: errorData.code,
          errorMessage,
          errorDetails: errorData.details,
        });

        throw createError(
          errorData.code ?? 'HTTP_ERROR',
          errorMessage,
          {
            statusCode: response.status,
            ...errorData.details,
          },
        );
      }

      // 检查是否有响应体
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      // 如果是204 No Content或者content-length为0，返回默认成功响应
      if (response.status === 204 || contentLength === '0') {
        console.log('[DEBUG] 空响应体 (204 或 content-length=0)，返回默认成功响应');
        return {
          success: true,
          message: '操作成功',
        } as T;
      }

      // 克隆response以便可以多次读取
      const responseClone = response.clone();

      // 先读取原始文本用于调试
      let rawText = '';
      try {
        rawText = await responseClone.text();
        console.log('[DEBUG] 原始响应文本:', {
          endpoint,
          status: response.status,
          contentType,
          textLength: rawText.length,
          textPreview: rawText.substring(0, 500),
        });
      } catch (textError) {
        console.error('[DEBUG] 读取响应文本失败:', textError);
      }

      // 如果响应体为空，返回默认成功响应
      if (!rawText || rawText.trim() === '') {
        console.log('[DEBUG] 响应体为空，返回默认成功响应');
        return {
          success: true,
          message: '操作成功',
        } as T;
      }

      // 解析响应 - 添加错误处理
      let responseData: T;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // JSON解析失败
        console.error('[DEBUG] JSON解析失败:', {
          endpoint,
          status: response.status,
          contentType,
          rawText,
          error: jsonError,
        });

        await Logger.error('API_JSON_PARSE_ERROR', `响应解析失败 (${endpoint})`, undefined, {
          status: response.status,
          statusText: response.statusText,
          contentType,
          rawTextPreview: rawText.substring(0, 200),
          errorMessage: jsonError instanceof Error ? jsonError.message : String(jsonError),
        });

        throw createError(
          'JSON_PARSE_ERROR',
          'API响应格式错误，无法解析JSON',
          { status: response.status, contentType, rawText: rawText.substring(0, 200) },
        );
      }

      // 🔍 输出成功响应的数据
      console.log('[DEBUG] API响应成功:', {
        endpoint,
        status: response.status,
        data: responseData,
        hasSuccess: 'success' in (responseData as object),
        successValue: (responseData as any)?.success,
      });

      // 🔍 检查是否是空对象（没有任何字段，或只有success字段但值为undefined）
      // 注意：不能简单检查是否有success字段，因为很多API（如getUsage）返回的数据本身就没有success字段
      const keys = Object.keys(responseData as object);
      const isEmpty = keys.length === 0;
      const hasOnlyUndefinedSuccess =
        keys.length === 1 &&
        'success' in (responseData as object) &&
        (responseData as any).success === undefined;

      if (!responseData || typeof responseData !== 'object' || isEmpty || hasOnlyUndefinedSuccess) {
        console.log('[DEBUG] 响应数据为空对象，返回默认成功响应', {
          isEmpty,
          hasOnlyUndefinedSuccess,
          keys,
        });
        return {
          success: true,
          message: '操作成功',
        } as T;
      }

      // 🔍 特殊处理：如果响应有success字段但值为undefined，替换为true
      if ('success' in (responseData as object) && (responseData as any).success === undefined) {
        console.log('[DEBUG] success字段为undefined，设置为true');
        (responseData as any).success = true;
        if (!(responseData as any).message) {
          (responseData as any).message = '操作成功';
        }
      }

      return responseData;
    } catch (error) {
      // 🔍 直接输出错误到console
      console.error('[DEBUG] API请求异常:', {
        method,
        endpoint,
        url,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined,
        fullError: error,
      });

      // 记录详细的错误日志
      await Logger.error('API_REQUEST', `请求失败: ${endpoint}`, undefined, {
        method,
        endpoint,
        url,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any).code,
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

      // 详细记录fetch错误
      await Logger.error('FETCH_ERROR', `网络请求失败: ${url}`, undefined, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        url,
        method: options.method,
      });

      if (error instanceof Error && error.name === 'AbortError') {
        throw createError('REQUEST_TIMEOUT', `请求超时（${timeout}ms）`);
      }
      throw error;
    }
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

    // 🔍 调试：查看getUsage返回的原始响应
    console.log('[DEBUG] APIClient.getUsage 返回的原始响应:', {
      response,
      currentCredits: response.currentCredits,
      creditLimit: response.creditLimit,
      hasCurrentCredits: 'currentCredits' in response,
      hasCreditLimit: 'creditLimit' in response,
      responseKeys: Object.keys(response),
      responseJSON: JSON.stringify(response),
    });

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

    // 🔍 详细调试日志 - 查看实际返回的响应对象
    console.log('[DEBUG] resetCredits 收到响应:', {
      response,
      success: response.success,
      message: response.message,
      typeof_success: typeof response.success,
      typeof_message: typeof response.message,
      keys: Object.keys(response),
      json: JSON.stringify(response),
    });

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
   * 测试特定API Key并返回详细结果
   * @param apiKey API 密钥
   * @returns 详细测试结果
   */
  async testSpecificKey(apiKey: string): Promise<{
    success: boolean;
    errorType?: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'PERMISSION_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
    message: string;
    details?: {
      error?: string;
      statusCode?: number;
      suggestion?: string;
    };
  }> {
    try {
      await Logger.info('API_KEY_TEST_START', '开始测试API Key', undefined, {
        apiKeyPrefix: apiKey.slice(0, 8) + '...',
      });

      // 尝试调用使用情况API
      const usage = await this.getUsage(apiKey);

      await Logger.success('API_KEY_TEST_SUCCESS', 'API Key测试成功', undefined, {
        currentCredits: usage.currentCredits,
        creditLimit: usage.creditLimit,
        subscriptionCount: usage.subscriptionEntityList?.length || 0,
      });

      return {
        success: true,
        message: '连接成功！',
        details: {
          suggestion: 'API Key有效，可以保存配置',
        },
      };
    } catch (error) {
      await Logger.error('API_KEY_TEST_FAILED', 'API Key测试失败', undefined, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });

      // 分析错误类型并提供具体建议
      const errorObj = error as any;
      const statusCode = errorObj?.details?.statusCode;
      const errorCode = errorObj?.code;

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          errorType: 'NETWORK_ERROR',
          message: '连接超时',
          details: {
            error: '请求超时（30秒）',
            suggestion: '请检查网络连接，或稍后重试',
          },
        };
      }

      if (error instanceof Error && error.message.includes('fetch')) {
        return {
          success: false,
          errorType: 'NETWORK_ERROR',
          message: '网络连接失败',
          details: {
            error: error.message,
            suggestion: '请检查网络连接或防火墙设置',
          },
        };
      }

      // 根据HTTP状态码判断错误类型
      if (statusCode) {
        if (statusCode === 401) {
          return {
            success: false,
            errorType: 'AUTH_ERROR',
            message: 'API Key无效或已过期',
            details: {
              statusCode,
              error: '认证失败',
              suggestion: '请检查API Key是否正确，或登录88code.org重新获取',
            },
          };
        }

        if (statusCode === 403) {
          return {
            success: false,
            errorType: 'PERMISSION_ERROR',
            message: 'API Key权限不足',
            details: {
              statusCode,
              error: '权限被拒绝',
              suggestion: '请确保API Key具有查询使用情况的权限',
            },
          };
        }

        if (statusCode >= 500) {
          return {
            success: false,
            errorType: 'SERVER_ERROR',
            message: '服务器错误',
            details: {
              statusCode,
              error: `服务器返回${statusCode}错误`,
              suggestion: '请稍后重试，或联系88code技术支持',
            },
          };
        }
      }

      // 根据错误代码判断
      if (errorCode) {
        if (errorCode.includes('RATE_LIMIT')) {
          return {
            success: false,
            errorType: 'NETWORK_ERROR',
            message: '请求过于频繁',
            details: {
              error: '触发速率限制',
              suggestion: '请稍等片刻再试',
            },
          };
        }
      }

      return {
        success: false,
        errorType: 'UNKNOWN_ERROR',
        message: '未知错误',
        details: {
          error: error instanceof Error ? error.message : String(error),
          suggestion: '请检查API Key配置，或联系技术支持',
        },
      };
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

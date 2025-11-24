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
import type { Subscription, UsageResponse, ResetResponse } from '@/types';
/**
 * API 客户端类
 */
export declare class APIClient {
    private rateLimiter;
    constructor();
    /**
     * 执行 HTTP 请求
     * @param method HTTP 方法
     * @param endpoint API 端点
     * @param apiKey API 密钥
     * @param body 请求体
     * @returns 响应数据
     */
    private request;
    /**
     * 带超时的 fetch
     */
    private fetchWithTimeout;
    /**
     * 获取订阅列表
     * @param apiKey API 密钥
     * @returns 订阅列表
     */
    getSubscriptions(apiKey: string): Promise<Subscription[]>;
    /**
     * 适配多种订阅响应格式，确保返回数组
     */
    private normalizeSubscriptionsResponse;
    /**
     * 获取使用情况
     * @param apiKey API 密钥
     * @returns 使用情况
     */
    getUsage(apiKey: string): Promise<UsageResponse>;
    /**
     * 重置积分
     * @param apiKey API 密钥
     * @param subscriptionId 订阅ID
     * @returns 重置响应
     */
    resetCredits(apiKey: string, subscriptionId: string): Promise<ResetResponse>;
    /**
     * 适配使用情况接口的多种返回格式
     */
    private normalizeUsageResponse;
    /**
     * 适配重置接口的多种返回格式
     */
    private normalizeResetResponse;
    /**
     * 测试连接
     * @param apiKey API 密钥
     * @returns 是否连接成功
     */
    testConnection(apiKey: string): Promise<boolean>;
    /**
     * 获取速率限制状态
     */
    getRateLimitStatus(): {
        availableTokens: number;
        capacity: number;
    };
}
/**
 * 全局单例实例
 */
export declare const apiClient: APIClient;
//# sourceMappingURL=APIClient.d.ts.map
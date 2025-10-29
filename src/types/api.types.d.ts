/**
 * API Integration Types
 * 88code API 接口类型定义
 *
 * @author Half open flowers
 */
/**
 * 订阅计划类型
 */
export type SubscriptionPlan = 'MONTHLY' | 'PAYGO' | 'ENTERPRISE';
/**
 * 订阅状态
 */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
/**
 * 订阅信息
 */
export interface Subscription {
    /** 账号ID */
    accountId: string;
    /** 邮箱地址 */
    email: string;
    /** 订阅计划类型 */
    subscriptionPlan: SubscriptionPlan;
    /** 订阅状态 */
    status: SubscriptionStatus;
    /** 当前计费周期开始时间（ISO 8601） */
    currentBillingCycleStart: string;
    /** 当前计费周期结束时间（ISO 8601） */
    currentBillingCycleEnd: string;
    /** 已使用流量（GB） */
    usageGb: number;
    /** 剩余重置次数 */
    resetCount: number;
    /** 订阅ID */
    subscriptionId: string;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}
/**
 * 使用情况响应
 */
export interface UsageResponse {
    /** 账号ID */
    accountId: string;
    /** 总配额（GB） */
    totalQuotaGb: number;
    /** 已使用（GB） */
    usedGb: number;
    /** 剩余配额（GB） */
    remainingGb: number;
    /** 使用百分比（0-100） */
    usagePercentage: number;
    /** 查询时间戳 */
    timestamp: number;
}
/**
 * 重置响应
 */
export interface ResetResponse {
    /** 是否成功 */
    success: boolean;
    /** 消息 */
    message: string;
    /** 重置后的使用情况 */
    usage?: UsageResponse;
    /** 剩余重置次数 */
    remainingResets?: number;
    /** 重置时间戳 */
    resetTimestamp?: number;
}
/**
 * API 错误响应
 */
export interface APIError {
    /** 错误代码 */
    code: string;
    /** 错误消息 */
    message: string;
    /** 详细信息 */
    details?: Record<string, unknown>;
    /** HTTP 状态码 */
    statusCode: number;
    /** 时间戳 */
    timestamp: number;
}
/**
 * 检查是否为 MONTHLY 订阅
 */
export declare function isMonthlySubscription(sub: Subscription): boolean;
/**
 * 检查是否为 PAYGO 订阅
 */
export declare function isPaygoSubscription(sub: Subscription): boolean;
/**
 * 检查订阅是否激活
 */
export declare function isActiveSubscription(sub: Subscription): boolean;
/**
 * 检查是否为有效的 API 错误
 */
export declare function isAPIError(error: unknown): error is APIError;
//# sourceMappingURL=api.types.d.ts.map
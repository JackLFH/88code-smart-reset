/**
 * API Integration Types
 * 88code API 接口类型定义（根据实际 API 返回结构）
 *
 * @author Half open flowers
 */
/**
 * 订阅计划类型（实际 API 使用的是 planType 字段）
 */
export type PlanType = 'MONTHLY' | 'PAY_PER_USE' | 'ENTERPRISE';
/**
 * 计费周期
 */
export type BillingCycle = 'monthly' | 'yearly';
/**
 * 订阅计划详情
 */
export interface SubscriptionPlanDetails {
    /** 计划 ID */
    id: number;
    /** 订阅名称 */
    subscriptionName: string;
    /** 计费周期 */
    billingCycle: BillingCycle;
    /** 费用 */
    cost: number;
    /** 原价 */
    originalPrice: number | null;
    /** 功能描述 */
    features: string;
    /** 热门标签 */
    hotTag: string | null;
    /** 并发限制 */
    concurrencyLimit: number;
    /** 积分限制 */
    creditLimit: number;
    /** 计划类型（MONTHLY/PAY_PER_USE） */
    planType: PlanType;
    /** 排序 */
    sortOrder: number | null;
    /** 创建时间 */
    createdAt: string | null;
    /** 更新时间 */
    updatedAt: string | null;
}
/**
 * 订阅信息（实际 API 返回的结构）
 */
export interface Subscription {
    /** 剩余重置次数 */
    resetTimes: number;
    /** 订阅 ID */
    id: number;
    /** 员工 ID */
    employeeId: number;
    /** 员工名称 */
    employeeName: string | null;
    /** 员工邮箱 */
    employeeEmail: string;
    /** 当前积分 */
    currentCredits: number;
    /** 最后积分更新时间 */
    lastCreditUpdate: string | null;
    /** 订阅计划 ID */
    subscriptionPlanId: number;
    /** 订阅名称 */
    subscriptionName: string;
    /** 费用 */
    cost: number;
    /** 开始日期 */
    startDate: string;
    /** 结束日期 */
    endDate: string;
    /** 计费周期 */
    billingCycle: BillingCycle;
    /** 计费周期描述 */
    billingCycleDesc: string;
    /** 剩余天数 */
    remainingDays: number;
    /** 订阅状态（中文） */
    subscriptionStatus: string;
    /** 订阅计划详情 */
    subscriptionPlan: SubscriptionPlanDetails;
    /** 是否激活 */
    isActive: boolean;
    /** 自动续费 */
    autoRenew: boolean;
    /** 积分为0时自动重置 */
    autoResetWhenZero: boolean;
    /** 最后积分重置时间 */
    lastCreditReset: string | null;
    /** 创建者 */
    createdBy: string | null;
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
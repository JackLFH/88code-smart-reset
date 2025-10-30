/**
 * ResetService
 * 核心重置服务
 *
 * 功能：
 * - 执行订阅重置
 * - 双重 PAYGO 保护
 * - 并行重置多个订阅
 * - 结果验证
 *
 * @author Half open flowers
 */
import { isMonthlySubscription, isPaygoSubscription, isActiveSubscription } from '@/types';
import { apiClient } from './APIClient';
import { Logger } from '@utils/logger';
import { formatDuration } from '@utils/helpers';
// ==================== ResetService 类 ====================
/**
 * 重置服务类
 */
export class ResetService {
    /**
     * 执行账号重置
     * @param account 账号信息
     * @param manual 是否手动触发
     * @param resetType 重置类型（首次/二次/手动）
     * @returns 重置结果
     */
    async executeReset(account, manual = false, resetType) {
        const startTime = Date.now();
        await Logger.info('RESET_START', `开始重置账号: ${account.name}${manual ? ' (手动触发)' : ''}`, account.id);
        const result = {
            accountId: account.id,
            accountName: account.name,
            status: 'SUCCESS',
            startTime,
            endTime: 0,
            totalDuration: 0,
            subscriptions: [],
            successCount: 0,
            failedCount: 0,
            skippedCount: 0,
            summary: '',
        };
        try {
            // 1. 获取订阅列表
            const subscriptions = await apiClient.getSubscriptions(account.apiKey);
            if (subscriptions.length === 0) {
                result.status = 'SKIPPED';
                result.summary = '没有找到任何订阅';
                await Logger.warning('RESET_SKIPPED', result.summary, account.id);
                return this.finalizeResult(result);
            }
            // 输出订阅摘要信息
            await Logger.info('DEBUG_SUBSCRIPTIONS', `获取到 ${subscriptions.length} 个订阅，开始分析...`, account.id);
            // 2. 过滤 MONTHLY 订阅（双重 PAYGO 保护 + 冷却检查）
            const monthlySubscriptions = subscriptions.filter((sub) => {
                // 双重检查：确保不是 PAYGO
                if (isPaygoSubscription(sub)) {
                    const skipMsg = `PAYGO 订阅受保护，已跳过 (ID: ${sub.id}, Plan: ${sub.subscriptionPlan.planType})`;
                    result.skippedCount += 1;
                    result.subscriptions.push({
                        subscriptionId: String(sub.id),
                        plan: sub.subscriptionPlan.planType,
                        status: 'SKIPPED',
                        message: skipMsg,
                    });
                    Logger.info('SUBSCRIPTION_SKIPPED', skipMsg, account.id).catch(() => { });
                    return false;
                }
                // 手动重置时检查冷却时间（5小时 = 18000000毫秒）
                if (manual && sub.lastCreditReset) {
                    const lastResetTime = new Date(sub.lastCreditReset).getTime();
                    const now = Date.now();
                    const timeSinceLastReset = now - lastResetTime;
                    const cooldownPeriod = 5 * 60 * 60 * 1000; // 5小时
                    if (timeSinceLastReset < cooldownPeriod) {
                        const remainingMs = cooldownPeriod - timeSinceLastReset;
                        const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
                        const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
                        const skipMsg = `冷却中，还需等待 ${remainingHours}小时${remainingMinutes}分钟 (上次重置: ${sub.lastCreditReset})`;
                        result.skippedCount += 1;
                        result.subscriptions.push({
                            subscriptionId: String(sub.id),
                            plan: sub.subscriptionPlan.planType,
                            status: 'SKIPPED',
                            message: skipMsg,
                        });
                        Logger.warning('SUBSCRIPTION_COOLDOWN', skipMsg, account.id).catch(() => { });
                        return false;
                    }
                }
                // 检查剩余重置次数（首次重置需要 >= 2，二次重置需要 >= 1）
                if (resetType === 'FIRST' && sub.resetTimes < 2) {
                    const skipMsg = `首次重置需要>=2次，当前剩余: ${sub.resetTimes} (Plan: ${sub.subscriptionPlan.planType}, ID: ${sub.id})`;
                    result.skippedCount += 1;
                    result.subscriptions.push({
                        subscriptionId: String(sub.id),
                        plan: sub.subscriptionPlan.planType,
                        status: 'SKIPPED',
                        message: skipMsg,
                    });
                    Logger.warning('SUBSCRIPTION_SKIPPED', skipMsg, account.id).catch(() => { });
                    return false;
                }
                if (resetType === 'SECOND' && sub.resetTimes < 1) {
                    const skipMsg = `二次重置需要>=1次，当前剩余: ${sub.resetTimes} (Plan: ${sub.subscriptionPlan.planType}, ID: ${sub.id})`;
                    result.skippedCount += 1;
                    result.subscriptions.push({
                        subscriptionId: String(sub.id),
                        plan: sub.subscriptionPlan.planType,
                        status: 'SKIPPED',
                        message: skipMsg,
                    });
                    Logger.warning('SUBSCRIPTION_SKIPPED', skipMsg, account.id).catch(() => { });
                    return false;
                }
                // 手动重置时的友好提示
                if (resetType === 'MANUAL' && sub.resetTimes === 0) {
                    const skipMsg = `剩余重置次数已用完 (0/2) (Plan: ${sub.subscriptionPlan.planType}, ID: ${sub.id})`;
                    result.skippedCount += 1;
                    result.subscriptions.push({
                        subscriptionId: String(sub.id),
                        plan: sub.subscriptionPlan.planType,
                        status: 'SKIPPED',
                        message: skipMsg,
                    });
                    Logger.warning('SUBSCRIPTION_SKIPPED', skipMsg, account.id).catch(() => { });
                    return false;
                }
                // 检查是否为 MONTHLY 且激活
                if (isMonthlySubscription(sub) && isActiveSubscription(sub)) {
                    Logger.info('SUBSCRIPTION_ELIGIBLE', `订阅符合重置条件 (Plan: ${sub.subscriptionPlan.planType}, Active: ${sub.isActive}, ResetTimes: ${sub.resetTimes})`, account.id).catch(() => { });
                    return true;
                }
                // 其他情况：不符合 MONTHLY 或 ACTIVE 条件
                const skipMsg = `订阅不符合条件 (Plan: ${sub.subscriptionPlan.planType}, Active: ${sub.isActive}, ResetTimes: ${sub.resetTimes}, ID: ${sub.id})`;
                result.skippedCount += 1;
                result.subscriptions.push({
                    subscriptionId: String(sub.id),
                    plan: sub.subscriptionPlan.planType,
                    status: 'SKIPPED',
                    message: skipMsg,
                });
                Logger.warning('SUBSCRIPTION_SKIPPED', skipMsg, account.id).catch(() => { });
                return false;
            });
            if (monthlySubscriptions.length === 0) {
                result.status = 'SKIPPED';
                // 分析跳过原因，生成友好提示
                const cooldownSkipped = result.subscriptions.filter(s => s.message?.includes('冷却中'));
                const paygoSkipped = result.subscriptions.filter(s => s.message?.includes('PAYGO'));
                const resetTimesSkipped = result.subscriptions.filter(s => s.message?.includes('重置次数'));
                if (cooldownSkipped.length > 0) {
                    result.summary = `冷却中：${cooldownSkipped[0]?.message || '请等待5小时后再试'}`;
                }
                else if (paygoSkipped.length > 0) {
                    result.summary = `所有订阅均为PAYGO类型，无需重置`;
                }
                else if (resetTimesSkipped.length > 0) {
                    result.summary = `今日重置次数已用完（0/2）`;
                }
                else {
                    result.summary = '没有符合重置条件的 MONTHLY 订阅';
                }
                await Logger.warning('RESET_SKIPPED', result.summary, account.id);
                return this.finalizeResult(result);
            }
            // 3. 并行重置所有符合条件的订阅
            await Logger.info('RESET_EXECUTE', `准备重置 ${monthlySubscriptions.length} 个 MONTHLY 订阅`, account.id);
            const resetPromises = monthlySubscriptions.map((sub) => this.resetSingleSubscription(account.apiKey, String(sub.id), sub.currentCredits));
            const resetResults = await Promise.allSettled(resetPromises);
            // 4. 汇总结果
            for (let i = 0; i < resetResults.length; i += 1) {
                const resetResult = resetResults[i];
                const subscription = monthlySubscriptions[i];
                if (!subscription)
                    continue;
                if (resetResult?.status === 'fulfilled') {
                    result.subscriptions.push(resetResult.value);
                    if (resetResult.value.status === 'SUCCESS') {
                        result.successCount += 1;
                    }
                    else {
                        result.failedCount += 1;
                    }
                }
                else {
                    result.failedCount += 1;
                    result.subscriptions.push({
                        subscriptionId: String(subscription.id),
                        plan: subscription.subscriptionPlan.planType,
                        status: 'FAILED',
                        message: resetResult?.reason instanceof Error
                            ? resetResult.reason.message
                            : String(resetResult?.reason),
                    });
                }
            }
            // 5. 确定总体状态
            if (result.failedCount === 0) {
                result.status = 'SUCCESS';
                result.summary = `成功重置 ${result.successCount} 个订阅`;
            }
            else if (result.successCount > 0) {
                result.status = 'PARTIAL';
                result.summary = `部分成功：${result.successCount} 成功，${result.failedCount} 失败`;
            }
            else {
                result.status = 'FAILED';
                result.summary = `重置失败：所有订阅均失败`;
            }
            // 6. 记录日志
            if (result.status === 'SUCCESS') {
                await Logger.success('RESET_COMPLETED', result.summary, account.id, {
                    successCount: result.successCount,
                    duration: formatDuration(startTime, Date.now()),
                });
            }
            else if (result.status === 'PARTIAL') {
                await Logger.warning('RESET_PARTIAL', result.summary, account.id, {
                    successCount: result.successCount,
                    failedCount: result.failedCount,
                });
            }
            else {
                await Logger.error('RESET_FAILED', result.summary, account.id, {
                    failedCount: result.failedCount,
                });
            }
        }
        catch (error) {
            result.status = 'FAILED';
            result.summary = error instanceof Error ? error.message : '重置过程发生未知错误';
            await Logger.error('RESET_FAILED', result.summary, account.id, {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        return this.finalizeResult(result);
    }
    /**
     * 重置单个订阅
     */
    async resetSingleSubscription(apiKey, subscriptionId, usageBefore) {
        const resetStart = Date.now();
        try {
            // 执行重置
            await Logger.info('RESET_API_CALL', `开始调用重置API (ID: ${subscriptionId})`, undefined);
            const response = await apiClient.resetCredits(apiKey, subscriptionId);
            // 记录完整的API响应
            await Logger.info('RESET_API_RESPONSE', `收到重置API响应 (ID: ${subscriptionId})`, undefined, {
                success: response.success,
                message: response.message,
                hasData: !!response.data,
                hasError: !!response.error,
                dataSubscriptionId: response.data?.subscriptionId,
                dataNewCredits: response.data?.newCredits,
                dataResetAt: response.data?.resetAt,
                errorCode: response.error?.code,
                errorMessage: response.error?.message,
                errorType: response.error?.type,
                fullResponse: JSON.stringify(response),
            });
            // 检查API返回的success字段
            if (!response.success) {
                await Logger.error('RESET_API_FAILED', `API返回失败 (ID: ${subscriptionId})`, undefined, {
                    message: response.message,
                    error: response.error,
                    response: JSON.stringify(response),
                });
                return {
                    subscriptionId,
                    plan: 'MONTHLY',
                    status: 'FAILED',
                    message: response.message || '重置失败',
                    usageBefore,
                    duration: Date.now() - resetStart,
                };
            }
            // 检查是否有错误信息
            if (response.error) {
                await Logger.error('RESET_API_ERROR', `API返回错误信息 (ID: ${subscriptionId})`, undefined, {
                    errorCode: response.error.code,
                    errorMessage: response.error.message,
                    errorType: response.error.type,
                });
                return {
                    subscriptionId,
                    plan: 'MONTHLY',
                    status: 'FAILED',
                    message: response.error.message || '重置失败',
                    usageBefore,
                    duration: Date.now() - resetStart,
                };
            }
            // 验证重置成功（根据API返回的data字段）
            const newCredits = response.data?.newCredits ?? usageBefore;
            const resetSuccessful = response.success && response.data !== undefined;
            return {
                subscriptionId,
                plan: 'MONTHLY',
                status: resetSuccessful ? 'SUCCESS' : 'FAILED',
                message: resetSuccessful
                    ? `成功重置（${usageBefore.toFixed(2)} → ${newCredits.toFixed(2)} Credits，重置时间：${response.data?.resetAt}）`
                    : '重置未返回数据',
                usageBefore,
                usageAfter: newCredits,
                duration: Date.now() - resetStart,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            await Logger.error('RESET_EXCEPTION', `重置异常 (ID: ${subscriptionId})`, undefined, {
                error: errorMsg,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                stack: error instanceof Error ? error.stack : undefined,
            });
            return {
                subscriptionId,
                plan: 'MONTHLY',
                status: 'FAILED',
                message: errorMsg,
                usageBefore,
                duration: Date.now() - resetStart,
                error: errorMsg,
            };
        }
    }
    /**
     * 完成结果（计算总耗时）
     */
    finalizeResult(result) {
        result.endTime = Date.now();
        result.totalDuration = result.endTime - result.startTime;
        return result;
    }
}
// ==================== 单例导出 ====================
/**
 * 全局单例实例
 */
export const resetService = new ResetService();
//# sourceMappingURL=ResetService.js.map
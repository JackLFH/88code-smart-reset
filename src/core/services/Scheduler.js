/**
 * Scheduler
 * 定时调度系统 - 基于 Chrome Alarms API
 *
 * @author Half open flowers
 */
import { StorageService } from '@storage/StorageService';
import { resetService } from './ResetService';
import { Logger } from '@utils/logger';
import { timeStringToTimestamp, getTodayDateString } from '@utils/helpers';
// ==================== 常量配置 ====================
/**
 * Alarm 名称
 */
const ALARM_NAMES = {
    FIRST_RESET: '88code-first-reset',
    SECOND_RESET: '88code-second-reset',
    HEARTBEAT: '88code-heartbeat',
};
/**
 * 心跳间隔（分钟）
 */
const HEARTBEAT_INTERVAL = 5;
// ==================== Scheduler 类 ====================
/**
 * 调度器类
 */
export class Scheduler {
    initialized = false;
    /**
     * 初始化调度器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        await Logger.info('SCHEDULER', '初始化调度器');
        // 获取配置
        const config = await StorageService.getScheduleConfig();
        if (!config.enabled) {
            await Logger.info('SCHEDULER', '调度已禁用');
            await this.clearAllAlarms();
            return;
        }
        // 设置定时任务
        await this.setupAlarms(config);
        // 设置心跳（可选，保持 Service Worker 活跃）
        await this.setupHeartbeat();
        this.initialized = true;
        await Logger.success('SCHEDULER', '调度器初始化完成');
    }
    /**
     * 设置定时任务
     */
    async setupAlarms(config) {
        // 清除旧的任务
        await this.clearAllAlarms();
        // 计算首次重置时间
        const firstResetTime = timeStringToTimestamp(config.firstResetTime, config.timezone);
        await chrome.alarms.create(ALARM_NAMES.FIRST_RESET, {
            when: firstResetTime,
            periodInMinutes: 24 * 60, // 每天重复
        });
        // 计算二次重置时间
        const secondResetTime = timeStringToTimestamp(config.secondResetTime, config.timezone);
        await chrome.alarms.create(ALARM_NAMES.SECOND_RESET, {
            when: secondResetTime,
            periodInMinutes: 24 * 60, // 每天重复
        });
        await Logger.info('SCHEDULER', '定时任务已设置', undefined, {
            firstResetTime: new Date(firstResetTime).toLocaleString(),
            secondResetTime: new Date(secondResetTime).toLocaleString(),
        });
    }
    /**
     * 设置心跳（保持 Service Worker 活跃）
     */
    async setupHeartbeat() {
        await chrome.alarms.create(ALARM_NAMES.HEARTBEAT, {
            periodInMinutes: HEARTBEAT_INTERVAL,
        });
    }
    /**
     * 处理 Alarm 触发
     */
    async handleAlarm(alarm) {
        await Logger.info('ALARM_TRIGGERED', `触发告警: ${alarm.name}`);
        switch (alarm.name) {
            case ALARM_NAMES.FIRST_RESET:
                await this.executeScheduledReset(true);
                break;
            case ALARM_NAMES.SECOND_RESET:
                await this.executeScheduledReset(false);
                break;
            case ALARM_NAMES.HEARTBEAT:
                await this.handleHeartbeat();
                break;
            default:
                await Logger.warning('ALARM_UNKNOWN', `未知告警: ${alarm.name}`);
        }
    }
    /**
     * 执行定时重置
     */
    async executeScheduledReset(isFirstReset) {
        const label = isFirstReset ? '首次' : '二次';
        await Logger.info('SCHEDULED_RESET', `开始执行${label}重置`);
        // 获取配置（用于时区）
        const config = await StorageService.getScheduleConfig();
        // 检查今天是否已执行（使用配置的时区）
        const state = await StorageService.getExecutionState();
        const today = getTodayDateString(config.timezone);
        // 如果日期变化，重置状态
        if (state.lastExecutionDate !== today) {
            state.firstResetToday = false;
            state.secondResetToday = false;
            state.lastExecutionDate = today;
        }
        // 检查是否已执行
        if (isFirstReset && state.firstResetToday) {
            await Logger.info('SCHEDULED_RESET', `今天${label}重置已执行，跳过`);
            return;
        }
        if (!isFirstReset && state.secondResetToday) {
            await Logger.info('SCHEDULED_RESET', `今天${label}重置已执行，跳过`);
            return;
        }
        // 获取所有启用的账号
        const accounts = await StorageService.getAccounts();
        const enabledAccounts = accounts.filter((acc) => acc.enabled);
        if (enabledAccounts.length === 0) {
            await Logger.warning('SCHEDULED_RESET', '没有启用的账号');
            return;
        }
        // 并行执行所有账号的重置
        await Logger.info('SCHEDULED_RESET', `准备重置 ${enabledAccounts.length} 个账号`);
        const resetType = isFirstReset ? 'FIRST' : 'SECOND';
        const results = await Promise.allSettled(enabledAccounts.map((account) => resetService.executeReset(account, false, resetType)));
        // 统计结果并收集详细信息
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const allResults = [];
        const failureReasons = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allResults.push(result.value);
                if (result.value.status === 'SUCCESS') {
                    successCount += 1;
                }
                else if (result.value.status === 'SKIPPED') {
                    skippedCount += 1;
                    // 收集跳过原因
                    if (result.value.summary) {
                        failureReasons.push(result.value.summary);
                    }
                }
                else {
                    failedCount += 1;
                    // 收集失败原因
                    if (result.value.summary) {
                        failureReasons.push(result.value.summary);
                    }
                }
            }
            else {
                failedCount += 1;
                // Promise rejected
                const error = result.reason;
                const errorMsg = error instanceof Error ? error.message : String(error);
                failureReasons.push(`执行异常: ${errorMsg}`);
            }
        }
        // 标记已执行
        await StorageService.markResetExecuted(isFirstReset);
        // 生成通知消息
        let notificationMessage = '';
        if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
            // 全部成功
            notificationMessage = `${label}重置成功：${successCount} 个账号已重置`;
        }
        else if (skippedCount > 0 && successCount === 0 && failedCount === 0) {
            // 全部跳过（比如冷却中）
            const firstReason = failureReasons[0] || '所有订阅均已跳过';
            notificationMessage = `${label}重置跳过：${firstReason}`;
        }
        else if (failedCount > 0 || skippedCount > 0) {
            // 部分成功/失败/跳过
            const parts = [];
            if (successCount > 0)
                parts.push(`${successCount}成功`);
            if (skippedCount > 0)
                parts.push(`${skippedCount}跳过`);
            if (failedCount > 0)
                parts.push(`${failedCount}失败`);
            notificationMessage = `${label}重置完成：${parts.join('，')}`;
            // 添加第一个失败原因
            if (failureReasons.length > 0) {
                notificationMessage += `\n原因：${failureReasons[0]}`;
            }
        }
        else {
            notificationMessage = `${label}重置完成`;
        }
        // 发送通知
        const preferences = await StorageService.getUserPreferences();
        if (preferences.notificationsEnabled) {
            await this.sendNotification(successCount > 0 && failedCount === 0 && skippedCount === 0 ? '定时重置成功' : '定时重置完成', notificationMessage);
        }
        // 记录日志
        if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
            await Logger.success('SCHEDULED_RESET', `${label}重置成功`, undefined, {
                successCount,
            });
        }
        else {
            await Logger.info('SCHEDULED_RESET', `${label}重置完成`, undefined, {
                successCount,
                failedCount,
                skippedCount,
                reasons: failureReasons,
            });
        }
    }
    /**
     * 处理心跳
     */
    async handleHeartbeat() {
        // 简单的健康检查
        await Logger.info('HEARTBEAT', 'Service Worker 运行中');
    }
    /**
     * 发送通知
     */
    async sendNotification(title, message) {
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
                title,
                message,
                priority: 1,
            });
        }
        catch (error) {
            await Logger.error('NOTIFICATION', '发送通知失败', undefined, {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * 更新调度配置
     */
    async updateSchedule(config) {
        await Logger.info('SCHEDULER', '更新调度配置');
        await StorageService.saveScheduleConfig(config);
        if (config.enabled) {
            await this.setupAlarms(config);
            await Logger.success('SCHEDULER', '调度配置已更新');
        }
        else {
            await this.clearAllAlarms();
            await Logger.info('SCHEDULER', '调度已禁用');
        }
    }
    /**
     * 清除所有定时任务
     */
    async clearAllAlarms() {
        await chrome.alarms.clearAll();
        await Logger.info('SCHEDULER', '已清除所有定时任务');
    }
    /**
     * 获取下次执行时间
     */
    async getNextScheduledTime() {
        const [firstReset, secondReset] = await Promise.all([
            chrome.alarms.get(ALARM_NAMES.FIRST_RESET),
            chrome.alarms.get(ALARM_NAMES.SECOND_RESET),
        ]);
        return {
            firstReset: firstReset?.scheduledTime ?? null,
            secondReset: secondReset?.scheduledTime ?? null,
        };
    }
    /**
     * 手动触发重置
     */
    async triggerManualReset() {
        await Logger.info('MANUAL_RESET', '手动触发重置');
        const accounts = await StorageService.getAccounts();
        const enabledAccounts = accounts.filter((acc) => acc.enabled);
        if (enabledAccounts.length === 0) {
            throw new Error('没有启用的账号');
        }
        const results = await Promise.allSettled(enabledAccounts.map((account) => resetService.executeReset(account, true, 'MANUAL')));
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const allResults = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allResults.push(result.value);
                if (result.value.status === 'SUCCESS') {
                    successCount += 1;
                }
                else if (result.value.status === 'SKIPPED') {
                    skippedCount += 1;
                }
                else {
                    failedCount += 1;
                }
            }
            else {
                failedCount += 1;
            }
        }
        // 生成友好的消息
        let message = '';
        let success = false;
        if (skippedCount > 0 && successCount === 0 && failedCount === 0) {
            // 全部跳过（比如冷却中）
            const firstSkipped = allResults.find(r => r.status === 'SKIPPED');
            message = firstSkipped?.summary || '操作已跳过';
            success = false; // 虽然没出错，但也没成功重置
        }
        else if (successCount > 0 && failedCount === 0) {
            // 全部成功
            message = `成功重置 ${successCount} 个订阅`;
            success = true;
        }
        else if (successCount > 0) {
            // 部分成功
            message = `部分成功：${successCount} 成功，${failedCount} 失败`;
            success = true;
        }
        else {
            // 全部失败
            message = `重置失败：${failedCount} 个订阅失败`;
            success = false;
        }
        await Logger.success('MANUAL_RESET', `手动重置完成：${successCount} 成功，${failedCount} 失败，${skippedCount} 跳过`);
        return { success, message, results: allResults };
    }
}
// ==================== 单例导出 ====================
/**
 * 全局单例实例
 */
export const scheduler = new Scheduler();
//# sourceMappingURL=Scheduler.js.map
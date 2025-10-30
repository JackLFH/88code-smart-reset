/**
 * Scheduler
 * 定时调度系统 - 基于 Chrome Alarms API
 *
 * @author Half open flowers
 */
import type { ResetScheduleConfig } from '@/types';
/**
 * 调度器类
 */
export declare class Scheduler {
    private initialized;
    /**
     * 初始化调度器
     */
    initialize(): Promise<void>;
    /**
     * 设置定时任务
     */
    private setupAlarms;
    /**
     * 设置心跳（保持 Service Worker 活跃）
     */
    private setupHeartbeat;
    /**
     * 处理 Alarm 触发
     */
    handleAlarm(alarm: chrome.alarms.Alarm): Promise<void>;
    /**
     * 执行定时重置
     */
    private executeScheduledReset;
    /**
     * 处理心跳
     */
    private handleHeartbeat;
    /**
     * 发送通知
     */
    private sendNotification;
    /**
     * 更新调度配置
     */
    updateSchedule(config: ResetScheduleConfig): Promise<void>;
    /**
     * 清除所有定时任务
     */
    private clearAllAlarms;
    /**
     * 获取下次执行时间
     */
    getNextScheduledTime(): Promise<{
        firstReset: number | null;
        secondReset: number | null;
    }>;
    /**
     * 手动触发重置
     */
    triggerManualReset(): Promise<{
        success: boolean;
        message: string;
        results: any[];
    }>;
}
/**
 * 全局单例实例
 */
export declare const scheduler: Scheduler;
//# sourceMappingURL=Scheduler.d.ts.map
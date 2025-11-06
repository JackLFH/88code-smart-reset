/**
 * Logger Utility
 * 日志工具类 - 自动脱敏敏感信息
 *
 * @author Half open flowers
 */
import type { LogEntry, LogLevel } from '@/types';
/**
 * 日志工具类
 */
export declare class Logger {
    /**
     * 脱敏文本
     */
    private static sanitize;
    /**
     * 脱敏对象
     */
    private static sanitizeObject;
    /**
     * 检查操作是否应该被静默
     */
    private static shouldSilence;
    /**
     * 记录日志
     */
    private static log;
    /**
     * INFO 级别日志
     */
    static info(operation: string, message: string, accountId?: string, details?: Record<string, unknown>): Promise<void>;
    /**
     * SUCCESS 级别日志
     */
    static success(operation: string, message: string, accountId?: string, details?: Record<string, unknown>): Promise<void>;
    /**
     * WARNING 级别日志
     */
    static warning(operation: string, message: string, accountId?: string, details?: Record<string, unknown>): Promise<void>;
    /**
     * ERROR 级别日志
     */
    static error(operation: string, message: string, accountId?: string, details?: Record<string, unknown>): Promise<void>;
    /**
     * 获取日志（带过滤）
     */
    static getLogs(limit?: number, level?: LogLevel): Promise<LogEntry[]>;
    /**
     * 清空日志
     */
    static clearLogs(): Promise<void>;
}
//# sourceMappingURL=logger.d.ts.map
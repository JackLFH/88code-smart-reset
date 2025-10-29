/**
 * Helper Functions
 * 通用工具函数
 *
 * @author Half open flowers
 */
/**
 * 将时间字符串（HH:mm）转换为今天的时间戳
 * @param timeStr 时间字符串（如 "18:50"）
 * @param _timezone 时区（暂未使用）
 * @returns 时间戳（毫秒）
 */
export declare function timeStringToTimestamp(timeStr: string, _timezone: string): number;
/**
 * 格式化时间戳为可读字符串
 * @param timestamp 时间戳
 * @returns 格式化后的字符串（如 "2025-10-29 18:50:00"）
 */
export declare function formatTimestamp(timestamp: number): string;
/**
 * 获取今天的日期字符串（YYYY-MM-DD）
 * @param timezone 时区（如 "Asia/Shanghai"），不提供则使用本地时区
 * @returns 日期字符串（YYYY-MM-DD）
 */
export declare function getTodayDateString(timezone?: string): string;
/**
 * 计算两个时间戳之间的差值（人类可读）
 * @param start 开始时间戳
 * @param end 结束时间戳
 * @returns 可读的时间差（如 "2 分钟 30 秒"）
 */
export declare function formatDuration(start: number, end: number): string;
/**
 * 格式化字节大小
 * @param gb GB 数量
 * @returns 格式化后的字符串（如 "10.5 GB"）
 */
export declare function formatGB(gb: number): string;
/**
 * 格式化百分比
 * @param value 百分比值（0-100）
 * @returns 格式化后的字符串（如 "75.5%"）
 */
export declare function formatPercentage(value: number): string;
/**
 * 截断字符串
 * @param str 原始字符串
 * @param maxLength 最大长度
 * @returns 截断后的字符串（超过长度会添加 "..."）
 */
export declare function truncateString(str: string, maxLength: number): string;
/**
 * 生成唯一ID
 * @returns UUID v4
 */
export declare function generateId(): string;
/**
 * 安全地解析错误对象
 * @param error 错误对象
 * @returns 错误消息
 */
export declare function parseError(error: unknown): string;
/**
 * 创建错误对象
 * @param code 错误代码
 * @param message 错误消息
 * @param details 详细信息
 */
export declare function createError(code: string, message: string, details?: Record<string, unknown>): Error & {
    code: string;
    details?: Record<string, unknown>;
};
/**
 * 深拷贝对象
 * @param obj 源对象
 * @returns 拷贝后的对象
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 延迟执行
 * @param ms 延迟毫秒数
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 验证邮箱格式
 */
export declare function isValidEmail(email: string): boolean;
/**
 * 验证时间格式（HH:mm）
 */
export declare function isValidTimeFormat(time: string): boolean;
/**
 * 验证 API 密钥格式（假设至少 20 个字符）
 */
export declare function isValidAPIKey(apiKey: string): boolean;
//# sourceMappingURL=helpers.d.ts.map
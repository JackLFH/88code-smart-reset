/**
 * Helper Functions
 * 通用工具函数
 *
 * @author Half open flowers
 */

// ==================== 时间相关 ====================

/**
 * 将时间字符串（HH:mm）转换为今天的时间戳
 * @param timeStr 时间字符串（如 "18:50"）
 * @param _timezone 时区（暂未使用）
 * @returns 时间戳（毫秒）
 */
export function timeStringToTimestamp(timeStr: string, _timezone: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);

  const now = new Date();
  const target = new Date(now);
  target.setHours(hours as number, minutes as number, 0, 0);

  // 如果今天的目标时间已过，返回明天的时间
  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

/**
 * 格式化时间戳为可读字符串
 * @param timestamp 时间戳
 * @returns 格式化后的字符串（如 "2025-10-29 18:50:00"）
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD）
 * @param timezone 时区（如 "Asia/Shanghai"），不提供则使用本地时区
 * @returns 日期字符串（YYYY-MM-DD）
 */
export function getTodayDateString(timezone?: string): string {
  if (timezone) {
    // 使用指定时区获取日期
    const dateStr = new Date().toLocaleString('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // en-CA 格式: "2025-10-29, 19:00:00" -> 取日期部分
    return dateStr.split(',')[0] as string;
  }

  // 使用本地时区（ISO格式）
  return new Date().toISOString().split('T')[0] as string;
}

/**
 * 计算两个时间戳之间的差值（人类可读）
 * @param start 开始时间戳
 * @param end 结束时间戳
 * @returns 可读的时间差（如 "2 分钟 30 秒"）
 */
export function formatDuration(start: number, end: number): string {
  const diff = end - start;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} 小时 ${minutes % 60} 分钟`;
  }
  if (minutes > 0) {
    return `${minutes} 分钟 ${seconds % 60} 秒`;
  }
  return `${seconds} 秒`;
}

// ==================== 数据格式化 ====================

/**
 * 格式化字节大小
 * @param gb GB 数量
 * @returns 格式化后的字符串（如 "10.5 GB"）
 */
export function formatGB(gb: number): string {
  return `${gb.toFixed(2)} GB`;
}

/**
 * 格式化百分比
 * @param value 百分比值（0-100）
 * @returns 格式化后的字符串（如 "75.5%"）
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ==================== 字符串处理 ====================

/**
 * 截断字符串
 * @param str 原始字符串
 * @param maxLength 最大长度
 * @returns 截断后的字符串（超过长度会添加 "..."）
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength)}...`;
}

/**
 * 生成唯一ID
 * @returns UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

// ==================== 错误处理 ====================

/**
 * 安全地解析错误对象
 * @param error 错误对象
 * @returns 错误消息
 */
export function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return '未知错误';
}

/**
 * 创建错误对象
 * @param code 错误代码
 * @param message 错误消息
 * @param details 详细信息
 */
export function createError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Error & { code: string; details?: Record<string, unknown> } {
  const error = new Error(message) as Error & {
    code: string;
    details?: Record<string, unknown>;
  };
  error.code = code;
  error.details = details;
  return error;
}

// ==================== 数组/对象操作 ====================

/**
 * 深拷贝对象
 * @param obj 源对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ==================== 验证函数 ====================

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证时间格式（HH:mm）
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * 验证 API 密钥格式（假设至少 20 个字符）
 */
export function isValidAPIKey(apiKey: string): boolean {
  return apiKey.length >= 20;
}

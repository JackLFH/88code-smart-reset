/**
 * Logger Utility
 * 日志工具类 - 自动脱敏敏感信息
 *
 * @author Half open flowers
 */

import type { LogEntry, LogLevel } from '@/types';
import { StorageService } from '@storage/StorageService';

// ==================== 敏感信息模式 ====================

/**
 * 敏感信息正则表达式
 */
const SENSITIVE_PATTERNS = {
  /** API 密钥 */
  API_KEY: /\b([A-Za-z0-9_-]{20,})\b/g,
  /** 邮箱 */
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /** 手机号 */
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /** JWT Token */
  JWT: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /** 密码字段 */
  PASSWORD: /"password"\s*:\s*"[^"]+"/gi,
} as const;

// ==================== Logger 类 ====================

/**
 * 需要静默的消息类型（不记录到日志）
 */
const SILENT_MESSAGE_TYPES = [
  'GET_LOGS',     // 获取日志（页面切换/刷新）
  'GET_USAGE',    // 获取使用量（页面刷新）
  'GET_ACCOUNTS', // 获取账号列表（页面切换）
  'GET_CONFIG',   // 获取配置（页面加载）
  'GET_STATUS',   // 获取状态（页面刷新）
] as const;

/**
 * 日志工具类
 */
export class Logger {
  /**
   * 脱敏文本
   */
  private static sanitize(text: string): string {
    let sanitized = text;

    // API 密钥脱敏
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_KEY, (match) => {
      if (match.length < 8) return match;
      return `${match.slice(0, 4)}****${match.slice(-4)}`;
    });

    // 邮箱脱敏
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, (match) => {
      const [local, domain] = match.split('@');
      const sanitizedLocal =
        (local?.length ?? 0) > 2
          ? `${local?.slice(0, 2)}****`
          : local;
      return `${sanitizedLocal}@${domain}`;
    });

    // JWT Token 脱敏
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.JWT, () => 'eyJ****');

    // 密码字段脱敏
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.PASSWORD, '"password":"****"');

    return sanitized;
  }

  /**
   * 脱敏对象
   */
  private static sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 检查操作是否应该被静默
   */
  private static shouldSilence(operation: string, message: string): boolean {
    // 如果操作类型是MESSAGE_RECEIVED，检查消息类型
    if (operation === 'MESSAGE_RECEIVED') {
      // 从消息中提取消息类型
      const messageMatch = message.match(/收到消息: ([A-Z_]+)/);
      if (messageMatch) {
        const messageType = messageMatch[1];
        return SILENT_MESSAGE_TYPES.includes(messageType as typeof SILENT_MESSAGE_TYPES[number]);
      }
    }
    return false;
  }

  /**
   * 记录日志
   */
  private static async log(
    level: LogLevel,
    operation: string,
    message: string,
    accountId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    // 检查是否应该静默此日志
    if (this.shouldSilence(operation, message)) {
      return;
    }

    const log: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      operation,
      message: this.sanitize(message),
      accountId,
      details: details ? this.sanitizeObject(details) : undefined,
    };

    // 保存到存储
    await StorageService.addLog(log);

    // 同时输出到控制台（开发模式）
    // @ts-ignore - process.env is available in build env
    if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
      const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARNING' ? 'warn' : 'log';
      // eslint-disable-next-line no-console
      console[consoleMethod](`[${level}] ${operation}: ${message}`, details);
    }
  }

  /**
   * INFO 级别日志
   */
  static async info(
    operation: string,
    message: string,
    accountId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.log('INFO', operation, message, accountId, details);
  }

  /**
   * SUCCESS 级别日志
   */
  static async success(
    operation: string,
    message: string,
    accountId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.log('SUCCESS', operation, message, accountId, details);
  }

  /**
   * WARNING 级别日志
   */
  static async warning(
    operation: string,
    message: string,
    accountId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.log('WARNING', operation, message, accountId, details);
  }

  /**
   * ERROR 级别日志
   */
  static async error(
    operation: string,
    message: string,
    accountId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.log('ERROR', operation, message, accountId, details);
  }

  /**
   * 获取日志（带过滤）
   */
  static async getLogs(
    limit?: number,
    level?: LogLevel,
  ): Promise<LogEntry[]> {
    let logs = await StorageService.getLogs(limit);

    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    return logs;
  }

  /**
   * 清空日志
   */
  static async clearLogs(): Promise<void> {
    await StorageService.clearLogs();
  }
}

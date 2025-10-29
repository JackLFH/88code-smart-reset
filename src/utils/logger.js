/**
 * Logger Utility
 * 日志工具类 - 自动脱敏敏感信息
 *
 * @author Half open flowers
 */
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
};
// ==================== Logger 类 ====================
/**
 * 日志工具类
 */
export class Logger {
    /**
     * 脱敏文本
     */
    static sanitize(text) {
        let sanitized = text;
        // API 密钥脱敏
        sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_KEY, (match) => {
            if (match.length < 8)
                return match;
            return `${match.slice(0, 4)}****${match.slice(-4)}`;
        });
        // 邮箱脱敏
        sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, (match) => {
            const [local, domain] = match.split('@');
            const sanitizedLocal = (local?.length ?? 0) > 2
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
    static sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitize(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * 记录日志
     */
    static async log(level, operation, message, accountId, details) {
        const log = {
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
    static async info(operation, message, accountId, details) {
        await this.log('INFO', operation, message, accountId, details);
    }
    /**
     * SUCCESS 级别日志
     */
    static async success(operation, message, accountId, details) {
        await this.log('SUCCESS', operation, message, accountId, details);
    }
    /**
     * WARNING 级别日志
     */
    static async warning(operation, message, accountId, details) {
        await this.log('WARNING', operation, message, accountId, details);
    }
    /**
     * ERROR 级别日志
     */
    static async error(operation, message, accountId, details) {
        await this.log('ERROR', operation, message, accountId, details);
    }
    /**
     * 获取日志（带过滤）
     */
    static async getLogs(limit, level) {
        let logs = await StorageService.getLogs(limit);
        if (level) {
            logs = logs.filter((log) => log.level === level);
        }
        return logs;
    }
    /**
     * 清空日志
     */
    static async clearLogs() {
        await StorageService.clearLogs();
    }
}
//# sourceMappingURL=logger.js.map
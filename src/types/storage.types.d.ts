/**
 * Storage Types
 * chrome.storage 数据结构定义
 *
 * @author Half open flowers
 */
import type { Account, AccountPreferences, ResetScheduleConfig, ExecutionState, LogEntry } from './business.types';
/**
 * Local Storage Schema
 * 本地存储（chrome.storage.local）
 * 用于存储大量数据和敏感信息
 */
export interface LocalStorageSchema {
    /** 加密后的 API 密钥 */
    api_key_encrypted?: string;
    /** 加密初始化向量 */
    api_key_iv?: string;
    /** 加密盐值 */
    api_key_salt?: string;
    /** 加密标签（用于GCM验证） */
    api_key_tag?: string;
    /** 账号列表 */
    accounts?: Account[];
    /** 用户偏好设置 */
    user_preferences?: AccountPreferences;
    /** 日志条目列表（最多1000条） */
    log_entries?: LogEntry[];
    /** 执行状态 */
    execution_state?: ExecutionState;
}
/**
 * Sync Storage Schema
 * 同步存储（chrome.storage.sync）
 * 用于存储需要跨设备同步的少量配置
 */
export interface SyncStorageSchema {
    /** 重置调度配置 */
    schedule_config?: ResetScheduleConfig;
    /** 偏好设置 */
    preferences?: AccountPreferences;
}
/**
 * Local Storage 键名常量
 */
export declare const LOCAL_STORAGE_KEYS: {
    readonly API_KEY_ENCRYPTED: "api_key_encrypted";
    readonly API_KEY_IV: "api_key_iv";
    readonly API_KEY_SALT: "api_key_salt";
    readonly API_KEY_TAG: "api_key_tag";
    readonly ACCOUNTS: "accounts";
    readonly USER_PREFERENCES: "user_preferences";
    readonly LOG_ENTRIES: "log_entries";
    readonly EXECUTION_STATE: "execution_state";
};
/**
 * Sync Storage 键名常量
 */
export declare const SYNC_STORAGE_KEYS: {
    readonly SCHEDULE_CONFIG: "schedule_config";
    readonly PREFERENCES: "preferences";
};
/**
 * 默认的账号偏好设置
 */
export declare const DEFAULT_PREFERENCES: AccountPreferences;
/**
 * 默认的调度配置
 */
export declare const DEFAULT_SCHEDULE_CONFIG: ResetScheduleConfig;
/**
 * 默认的执行状态
 */
export declare const DEFAULT_EXECUTION_STATE: ExecutionState;
/**
 * 检查是否为有效的 LocalStorageSchema
 */
export declare function isValidLocalStorage(data: unknown): data is LocalStorageSchema;
/**
 * 检查是否为有效的 SyncStorageSchema
 */
export declare function isValidSyncStorage(data: unknown): data is SyncStorageSchema;
//# sourceMappingURL=storage.types.d.ts.map
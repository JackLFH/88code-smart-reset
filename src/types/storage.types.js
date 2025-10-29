/**
 * Storage Types
 * chrome.storage 数据结构定义
 *
 * @author Half open flowers
 */
// ==================== Storage Keys ====================
/**
 * Local Storage 键名常量
 */
export const LOCAL_STORAGE_KEYS = {
    API_KEY_ENCRYPTED: 'api_key_encrypted',
    API_KEY_IV: 'api_key_iv',
    API_KEY_SALT: 'api_key_salt',
    API_KEY_TAG: 'api_key_tag',
    ACCOUNTS: 'accounts',
    USER_PREFERENCES: 'user_preferences',
    LOG_ENTRIES: 'log_entries',
    EXECUTION_STATE: 'execution_state',
};
/**
 * Sync Storage 键名常量
 */
export const SYNC_STORAGE_KEYS = {
    SCHEDULE_CONFIG: 'schedule_config',
    PREFERENCES: 'preferences',
};
// ==================== 默认值 ====================
/**
 * 默认的账号偏好设置
 */
export const DEFAULT_PREFERENCES = {
    autoResetEnabled: true,
    notificationsEnabled: true,
    timezone: 'Asia/Shanghai', // 北京时间（东八区）
    theme: 'auto',
};
/**
 * 默认的调度配置
 */
export const DEFAULT_SCHEDULE_CONFIG = {
    firstResetTime: '18:50',
    secondResetTime: '23:55',
    timezone: 'Asia/Shanghai', // 北京时间（东八区）
    enabled: true,
};
/**
 * 默认的执行状态
 */
export const DEFAULT_EXECUTION_STATE = {
    firstResetToday: false,
    secondResetToday: false,
    lastExecutionDate: '',
    lastUpdated: 0,
};
// ==================== 类型守卫 ====================
/**
 * 检查是否为有效的 LocalStorageSchema
 */
export function isValidLocalStorage(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const storage = data;
    // 检查关键字段的类型
    if (storage.accounts !== undefined && !Array.isArray(storage.accounts)) {
        return false;
    }
    if (storage.log_entries !== undefined && !Array.isArray(storage.log_entries)) {
        return false;
    }
    return true;
}
/**
 * 检查是否为有效的 SyncStorageSchema
 */
export function isValidSyncStorage(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    return true;
}
//# sourceMappingURL=storage.types.js.map
/**
 * Storage Types
 * chrome.storage 数据结构定义
 *
 * @author Half open flowers
 */

import type {
  Account,
  AccountPreferences,
  ResetScheduleConfig,
  ExecutionState,
  LogEntry,
} from './business.types';

// ==================== Storage Schema ====================

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
} as const;

/**
 * Sync Storage 键名常量
 */
export const SYNC_STORAGE_KEYS = {
  SCHEDULE_CONFIG: 'schedule_config',
  PREFERENCES: 'preferences',
} as const;

// ==================== 默认值 ====================

/**
 * 默认的账号偏好设置
 */
export const DEFAULT_PREFERENCES: AccountPreferences = {
  autoResetEnabled: true,
  notificationsEnabled: true,
  timezone: 'Asia/Shanghai', // 北京时间（东八区）
  theme: 'auto',
};

/**
 * 默认的调度配置
 */
export const DEFAULT_SCHEDULE_CONFIG: ResetScheduleConfig = {
  firstResetTime: '18:50',
  secondResetTime: '23:55',
  timezone: 'Asia/Shanghai', // 北京时间（东八区）
  enabled: true,
};

/**
 * 默认的执行状态
 */
export const DEFAULT_EXECUTION_STATE: ExecutionState = {
  firstResetToday: false,
  secondResetToday: false,
  lastExecutionDate: '',
  lastUpdated: 0,
};

// ==================== 类型守卫 ====================

/**
 * 检查是否为有效的 LocalStorageSchema
 */
export function isValidLocalStorage(data: unknown): data is LocalStorageSchema {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const storage = data as Partial<LocalStorageSchema>;

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
export function isValidSyncStorage(data: unknown): data is SyncStorageSchema {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  return true;
}

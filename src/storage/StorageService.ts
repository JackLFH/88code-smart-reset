/**
 * StorageService
 * chrome.storage 封装服务
 *
 * 提供类型安全的存储操作接口
 *
 * @author Half open flowers
 */

import type {
  Account,
  AccountPreferences,
  ResetScheduleConfig,
  ExecutionState,
  LogEntry,
} from '@/types';

import {
  LOCAL_STORAGE_KEYS,
  SYNC_STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_EXECUTION_STATE,
} from '@/types/storage.types';

// ==================== 常量配置 ====================

/**
 * 日志容量限制
 */
const MAX_LOG_ENTRIES = 1000;

// ==================== StorageService 类 ====================

/**
 * 存储服务类
 */
export class StorageService {
  // ==================== Local Storage 操作 ====================

  /**
   * 获取所有账号
   */
  static async getAccounts(): Promise<Account[]> {
    const result = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.ACCOUNTS);
    return (result[LOCAL_STORAGE_KEYS.ACCOUNTS] as Account[] | undefined) ?? [];
  }

  /**
   * 保存账号列表
   */
  static async saveAccounts(accounts: Account[]): Promise<void> {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.ACCOUNTS]: accounts,
    });
  }

  /**
   * 添加账号
   */
  static async addAccount(account: Account): Promise<void> {
    const accounts = await this.getAccounts();
    accounts.push(account);
    await this.saveAccounts(accounts);
  }

  /**
   * 更新账号
   */
  static async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const accounts = await this.getAccounts();
    const index = accounts.findIndex((acc) => acc.id === accountId);

    if (index === -1) {
      throw new Error(`Account not found: ${accountId}`);
    }

    accounts[index] = {
      ...accounts[index],
      ...updates,
      lastUpdated: Date.now(),
    } as Account;

    await this.saveAccounts(accounts);
  }

  /**
   * 删除账号
   */
  static async deleteAccount(accountId: string): Promise<void> {
    const accounts = await this.getAccounts();
    const filtered = accounts.filter((acc) => acc.id !== accountId);
    await this.saveAccounts(filtered);
  }

  /**
   * 获取用户偏好设置
   */
  static async getUserPreferences(): Promise<AccountPreferences> {
    const result = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.USER_PREFERENCES);
    return (
      (result[LOCAL_STORAGE_KEYS.USER_PREFERENCES] as AccountPreferences | undefined) ??
      DEFAULT_PREFERENCES
    );
  }

  /**
   * 保存用户偏好设置
   */
  static async saveUserPreferences(preferences: AccountPreferences): Promise<void> {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.USER_PREFERENCES]: preferences,
    });
  }

  /**
   * 获取执行状态
   */
  static async getExecutionState(): Promise<ExecutionState> {
    const result = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.EXECUTION_STATE);
    return (
      (result[LOCAL_STORAGE_KEYS.EXECUTION_STATE] as ExecutionState | undefined) ??
      DEFAULT_EXECUTION_STATE
    );
  }

  /**
   * 保存执行状态
   */
  static async saveExecutionState(state: ExecutionState): Promise<void> {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.EXECUTION_STATE]: {
        ...state,
        lastUpdated: Date.now(),
      },
    });
  }

  /**
   * 更新执行状态（标记已完成）
   */
  static async markResetExecuted(isFirstReset: boolean): Promise<void> {
    const state = await this.getExecutionState();
    const today = new Date().toISOString().split('T')[0] as string;

    // 如果日期变化，重置状态
    if (state.lastExecutionDate !== today) {
      state.firstResetToday = false;
      state.secondResetToday = false;
      state.lastExecutionDate = today;
    }

    // 标记对应时段已执行
    if (isFirstReset) {
      state.firstResetToday = true;
    } else {
      state.secondResetToday = true;
    }

    await this.saveExecutionState(state);
  }

  // ==================== 日志操作 ====================

  /**
   * 获取日志列表
   */
  static async getLogs(limit?: number): Promise<LogEntry[]> {
    const result = await chrome.storage.local.get(LOCAL_STORAGE_KEYS.LOG_ENTRIES);
    const logs = (result[LOCAL_STORAGE_KEYS.LOG_ENTRIES] as LogEntry[] | undefined) ?? [];

    // 按时间戳降序排序
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * 添加日志条目
   */
  static async addLog(log: LogEntry): Promise<void> {
    const logs = await this.getLogs();

    // 添加新日志
    logs.unshift(log);

    // 限制日志数量
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(MAX_LOG_ENTRIES);
    }

    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.LOG_ENTRIES]: logs,
    });
  }

  /**
   * 清空日志
   */
  static async clearLogs(): Promise<void> {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.LOG_ENTRIES]: [],
    });
  }

  // ==================== 加密存储操作 ====================

  /**
   * 保存加密数据
   */
  static async saveEncryptedData(data: {
    ciphertext: string;
    iv: string;
    salt: string;
    tag: string;
  }): Promise<void> {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEYS.API_KEY_ENCRYPTED]: data.ciphertext,
      [LOCAL_STORAGE_KEYS.API_KEY_IV]: data.iv,
      [LOCAL_STORAGE_KEYS.API_KEY_SALT]: data.salt,
      [LOCAL_STORAGE_KEYS.API_KEY_TAG]: data.tag,
    });
  }

  /**
   * 获取加密数据
   */
  static async getEncryptedData(): Promise<{
    ciphertext: string;
    iv: string;
    salt: string;
    tag: string;
  } | null> {
    const result = await chrome.storage.local.get([
      LOCAL_STORAGE_KEYS.API_KEY_ENCRYPTED,
      LOCAL_STORAGE_KEYS.API_KEY_IV,
      LOCAL_STORAGE_KEYS.API_KEY_SALT,
      LOCAL_STORAGE_KEYS.API_KEY_TAG,
    ]);

    const ciphertext = result[LOCAL_STORAGE_KEYS.API_KEY_ENCRYPTED] as string | undefined;
    const iv = result[LOCAL_STORAGE_KEYS.API_KEY_IV] as string | undefined;
    const salt = result[LOCAL_STORAGE_KEYS.API_KEY_SALT] as string | undefined;
    const tag = result[LOCAL_STORAGE_KEYS.API_KEY_TAG] as string | undefined;

    if (!ciphertext || !iv || !salt || !tag) {
      return null;
    }

    return { ciphertext, iv, salt, tag };
  }

  /**
   * 清除加密数据
   */
  static async clearEncryptedData(): Promise<void> {
    await chrome.storage.local.remove([
      LOCAL_STORAGE_KEYS.API_KEY_ENCRYPTED,
      LOCAL_STORAGE_KEYS.API_KEY_IV,
      LOCAL_STORAGE_KEYS.API_KEY_SALT,
      LOCAL_STORAGE_KEYS.API_KEY_TAG,
    ]);
  }

  // ==================== Sync Storage 操作 ====================

  /**
   * 获取调度配置
   */
  static async getScheduleConfig(): Promise<ResetScheduleConfig> {
    const result = await chrome.storage.sync.get(SYNC_STORAGE_KEYS.SCHEDULE_CONFIG);
    return (
      (result[SYNC_STORAGE_KEYS.SCHEDULE_CONFIG] as ResetScheduleConfig | undefined) ??
      DEFAULT_SCHEDULE_CONFIG
    );
  }

  /**
   * 保存调度配置
   */
  static async saveScheduleConfig(config: ResetScheduleConfig): Promise<void> {
    await chrome.storage.sync.set({
      [SYNC_STORAGE_KEYS.SCHEDULE_CONFIG]: config,
    });
  }

  // ==================== 工具方法 ====================

  /**
   * 清空所有存储（危险操作！）
   */
  static async clearAll(): Promise<void> {
    await Promise.all([chrome.storage.local.clear(), chrome.storage.sync.clear()]);
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageUsage(): Promise<{
    local: { used: number; quota: number };
    sync: { used: number; quota: number };
  }> {
    const [localUsage, syncUsage] = await Promise.all([
      chrome.storage.local.getBytesInUse(),
      chrome.storage.sync.getBytesInUse(),
    ]);

    return {
      local: {
        used: localUsage,
        quota: chrome.storage.local.QUOTA_BYTES,
      },
      sync: {
        used: syncUsage,
        quota: chrome.storage.sync.QUOTA_BYTES,
      },
    };
  }
}

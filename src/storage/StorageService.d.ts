/**
 * StorageService
 * chrome.storage 封装服务
 *
 * 提供类型安全的存储操作接口
 *
 * @author Half open flowers
 */
import type { Account, AccountPreferences, ResetScheduleConfig, ExecutionState, LogEntry } from '@/types';
/**
 * 存储服务类
 */
export declare class StorageService {
    /**
     * 获取所有账号
     */
    static getAccounts(): Promise<Account[]>;
    /**
     * 保存账号列表
     */
    static saveAccounts(accounts: Account[]): Promise<void>;
    /**
     * 添加账号
     */
    static addAccount(account: Account): Promise<void>;
    /**
     * 更新账号
     */
    static updateAccount(accountId: string, updates: Partial<Account>): Promise<void>;
    /**
     * 删除账号
     */
    static deleteAccount(accountId: string): Promise<void>;
    /**
     * 获取用户偏好设置
     */
    static getUserPreferences(): Promise<AccountPreferences>;
    /**
     * 保存用户偏好设置
     */
    static saveUserPreferences(preferences: AccountPreferences): Promise<void>;
    /**
     * 获取执行状态
     */
    static getExecutionState(): Promise<ExecutionState>;
    /**
     * 保存执行状态
     */
    static saveExecutionState(state: ExecutionState): Promise<void>;
    /**
     * 更新执行状态（标记已完成）
     */
    static markResetExecuted(isFirstReset: boolean): Promise<void>;
    /**
     * 获取日志列表
     */
    static getLogs(limit?: number): Promise<LogEntry[]>;
    /**
     * 添加日志条目
     */
    static addLog(log: LogEntry): Promise<void>;
    /**
     * 清空日志
     */
    static clearLogs(): Promise<void>;
    /**
     * 保存加密数据
     */
    static saveEncryptedData(data: {
        ciphertext: string;
        iv: string;
        salt: string;
        tag: string;
    }): Promise<void>;
    /**
     * 获取加密数据
     */
    static getEncryptedData(): Promise<{
        ciphertext: string;
        iv: string;
        salt: string;
        tag: string;
    } | null>;
    /**
     * 清除加密数据
     */
    static clearEncryptedData(): Promise<void>;
    /**
     * 获取调度配置
     */
    static getScheduleConfig(): Promise<ResetScheduleConfig>;
    /**
     * 保存调度配置
     */
    static saveScheduleConfig(config: ResetScheduleConfig): Promise<void>;
    /**
     * 清空所有存储（危险操作！）
     */
    static clearAll(): Promise<void>;
    /**
     * 获取存储使用情况
     */
    static getStorageUsage(): Promise<{
        local: {
            used: number;
            quota: number;
        };
        sync: {
            used: number;
            quota: number;
        };
    }>;
}
//# sourceMappingURL=StorageService.d.ts.map
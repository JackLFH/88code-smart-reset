/**
 * ResetService
 * 核心重置服务
 *
 * 功能：
 * - 执行订阅重置
 * - 双重 PAYGO 保护
 * - 并行重置多个订阅
 * - 结果验证
 *
 * @author Half open flowers
 */
import type { Account, ResetResult, ResetType } from '@/types';
/**
 * 重置服务类
 */
export declare class ResetService {
    /**
     * 执行账号重置
     * @param account 账号信息
     * @param manual 是否手动触发
     * @param resetType 重置类型（首次/二次/手动）
     * @returns 重置结果
     */
    executeReset(account: Account, manual?: boolean, resetType?: ResetType): Promise<ResetResult>;
    /**
     * 重置单个订阅
     */
    private resetSingleSubscription;
    /**
     * 完成结果（计算总耗时）
     */
    private finalizeResult;
}
/**
 * 全局单例实例
 */
export declare const resetService: ResetService;
//# sourceMappingURL=ResetService.d.ts.map
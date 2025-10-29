/**
 * Business Logic Types
 * 业务逻辑类型定义
 *
 * @author Half open flowers
 */
// ==================== 类型守卫 ====================
/**
 * 检查重置结果是否成功
 */
export function isResetSuccess(result) {
    return result.status === 'SUCCESS' && result.failedCount === 0;
}
/**
 * 检查重置结果是否部分成功
 */
export function isResetPartial(result) {
    return result.status === 'PARTIAL' || (result.successCount > 0 && result.failedCount > 0);
}
/**
 * 检查今天是否需要执行重置
 */
export function shouldExecuteReset(state, isFirstReset) {
    const today = new Date().toISOString().split('T')[0];
    // 如果日期变化，重置状态
    if (state.lastExecutionDate !== today) {
        return true;
    }
    // 检查对应时段是否已执行
    return isFirstReset ? !state.firstResetToday : !state.secondResetToday;
}
//# sourceMappingURL=business.types.js.map
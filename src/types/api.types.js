/**
 * API Integration Types
 * 88code API 接口类型定义（根据实际 API 返回结构）
 *
 * @author Half open flowers
 */
// ==================== 类型守卫 ====================
/**
 * 检查是否为 MONTHLY 订阅
 */
export function isMonthlySubscription(sub) {
    return sub.subscriptionPlan?.planType === 'MONTHLY';
}
/**
 * 检查是否为 PAYGO 订阅
 */
export function isPaygoSubscription(sub) {
    return sub.subscriptionPlan?.planType === 'PAY_PER_USE';
}
/**
 * 检查订阅是否激活
 */
export function isActiveSubscription(sub) {
    return sub.isActive === true;
}
/**
 * 检查是否为有效的 API 错误
 */
export function isAPIError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'statusCode' in error);
}
//# sourceMappingURL=api.types.js.map
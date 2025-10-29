/**
 * Message Types
 * UI 和后台之间的消息传递类型
 *
 * @author Half open flowers
 */
// ==================== 消息类型 ====================
/**
 * 消息类型枚举
 */
export var MessageType;
(function (MessageType) {
    // 查询类
    MessageType["GET_USAGE"] = "GET_USAGE";
    MessageType["GET_ACCOUNTS"] = "GET_ACCOUNTS";
    MessageType["GET_LOGS"] = "GET_LOGS";
    MessageType["GET_CONFIG"] = "GET_CONFIG";
    MessageType["GET_STATUS"] = "GET_STATUS";
    // 操作类
    MessageType["EXECUTE_RESET"] = "EXECUTE_RESET";
    MessageType["SAVE_API_KEY"] = "SAVE_API_KEY";
    MessageType["UPDATE_CONFIG"] = "UPDATE_CONFIG";
    MessageType["CLEAR_LOGS"] = "CLEAR_LOGS";
    MessageType["TEST_CONNECTION"] = "TEST_CONNECTION";
    // 通知类
    MessageType["RESET_COMPLETED"] = "RESET_COMPLETED";
    MessageType["RESET_FAILED"] = "RESET_FAILED";
    MessageType["STATUS_UPDATE"] = "STATUS_UPDATE";
    MessageType["LOG_ADDED"] = "LOG_ADDED";
    // 错误类
    MessageType["ERROR"] = "ERROR";
})(MessageType || (MessageType = {}));
// ==================== 工具函数 ====================
/**
 * 创建消息
 */
export function createMessage(type, payload, source, destination) {
    return {
        id: crypto.randomUUID(),
        type,
        payload,
        timestamp: Date.now(),
        source,
        destination,
    };
}
/**
 * 创建成功响应
 */
export function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: Date.now(),
    };
}
/**
 * 创建错误响应
 */
export function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=message.types.js.map
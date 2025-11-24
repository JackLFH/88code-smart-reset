/**
 * APIClient
 * 88code API 客户端
 *
 * 安全特性：
 * - HTTPS 强制
 * - Authorization 认证
 * - 速率限制（令牌桶算法）
 * - 请求超时控制
 * - 自动重试机制
 *
 * @author Half open flowers
 */
import { Logger } from '@utils/logger';
import { createError } from '@utils/helpers';
// ==================== 常量配置 ====================
/**
 * API 基础配置
 */
const API_CONFIG = {
    /** API 基础 URL */
    BASE_URL: 'https://www.88code.org',
    /** 请求超时（毫秒） */
    TIMEOUT: 30000,
    /** 最大重试次数 */
    MAX_RETRIES: 3,
    /** 重试延迟（毫秒） */
    RETRY_DELAY: 1000,
};
/**
 * 速率限制配置（令牌桶算法）
 */
const RATE_LIMIT_CONFIG = {
    /** 桶容量（令牌数） */
    BUCKET_CAPACITY: 10,
    /** 补充速率（令牌/分钟） */
    REFILL_RATE: 10,
    /** 补充间隔（毫秒） */
    REFILL_INTERVAL: 60000,
};
// ==================== 速率限制器 ====================
/**
 * 令牌桶速率限制器
 */
class TokenBucket {
    capacity;
    refillRate;
    refillInterval;
    tokens;
    lastRefill;
    constructor(capacity, refillRate, refillInterval) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.refillInterval = refillInterval;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    /**
     * 尝试消费一个令牌
     * @returns 是否成功
     */
    consume() {
        this.refill();
        if (this.tokens > 0) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }
    /**
     * 补充令牌
     */
    refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;
        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }
    /**
     * 获取当前可用令牌数
     */
    getAvailableTokens() {
        this.refill();
        return Math.floor(this.tokens);
    }
}
// ==================== APIClient 类 ====================
/**
 * API 客户端类
 */
export class APIClient {
    rateLimiter;
    constructor() {
        this.rateLimiter = new TokenBucket(RATE_LIMIT_CONFIG.BUCKET_CAPACITY, RATE_LIMIT_CONFIG.REFILL_RATE, RATE_LIMIT_CONFIG.REFILL_INTERVAL);
    }
    // ==================== 核心请求方法 ====================
    /**
     * 执行 HTTP 请求
     * @param method HTTP 方法
     * @param endpoint API 端点
     * @param apiKey API 密钥
     * @param body 请求体
     * @returns 响应数据
     */
    async request(method, endpoint, apiKey, body) {
        // 速率限制检查
        if (!this.rateLimiter.consume()) {
            throw createError('RATE_LIMIT_EXCEEDED', '请求过于频繁，请稍后再试', { availableTokens: this.rateLimiter.getAvailableTokens() });
        }
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        // 序列化请求体
        const bodyString = body ? JSON.stringify(body) : undefined;
        // 构造请求头（88code只需要Authorization认证，无需签名）
        const headers = {
            'Content-Type': 'application/json',
            Authorization: apiKey,
        };
        // 构造请求选项
        const options = {
            method,
            headers,
            ...(bodyString && { body: bodyString }),
        };
        // 详细记录请求信息
        await Logger.info('API_REQUEST_START', `发起请求: ${method} ${endpoint}`, undefined, {
            url,
            method,
            hasBody: !!bodyString,
            apiKeyPrefix: apiKey.slice(0, 8) + '...',
        });
        try {
            // 带超时的 fetch
            const response = await this.fetchWithTimeout(url, options, API_CONFIG.TIMEOUT);
            // 记录响应状态
            await Logger.info('API_RESPONSE_STATUS', `收到响应: ${endpoint}`, undefined, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries()),
            });
            // 🔍 直接输出到console进行调试
            console.log(`[DEBUG] 响应状态: ${response.status} ${response.statusText}, ok=${response.ok}`);
            // 检查 HTTP 状态码
            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({})));
                const errorMessage = errorData.message ?? `HTTP ${response.status}: ${response.statusText}`;
                // 🔍 输出错误详情
                console.error('[DEBUG] API返回错误:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorCode: errorData.code,
                    errorMessage,
                    errorData,
                });
                // 记录详细的错误信息
                await Logger.error('API_ERROR_RESPONSE', `API返回错误 (${endpoint})`, undefined, {
                    statusCode: response.status,
                    statusText: response.statusText,
                    errorCode: errorData.code,
                    errorMessage,
                    errorDetails: errorData.details,
                });
                throw createError(errorData.code ?? 'HTTP_ERROR', errorMessage, {
                    statusCode: response.status,
                    ...errorData.details,
                });
            }
            // 检查是否有响应体
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');
            // 如果是204 No Content或者content-length为0，返回默认成功响应
            if (response.status === 204 || contentLength === '0') {
                console.log('[DEBUG] 空响应体 (204 或 content-length=0)，返回默认成功响应');
                return {
                    success: true,
                    message: '操作成功',
                };
            }
            // 克隆response以便可以多次读取
            const responseClone = response.clone();
            // 先读取原始文本用于调试
            let rawText = '';
            try {
                rawText = await responseClone.text();
                console.log('[DEBUG] 原始响应文本:', {
                    endpoint,
                    status: response.status,
                    contentType,
                    textLength: rawText.length,
                    textPreview: rawText.substring(0, 500),
                });
            }
            catch (textError) {
                console.error('[DEBUG] 读取响应文本失败:', textError);
            }
            // 如果响应体为空，返回默认成功响应
            if (!rawText || rawText.trim() === '') {
                console.log('[DEBUG] 响应体为空，返回默认成功响应');
                return {
                    success: true,
                    message: '操作成功',
                };
            }
            // 解析响应 - 添加错误处理
            let responseData;
            try {
                responseData = await response.json();
            }
            catch (jsonError) {
                // JSON解析失败
                console.error('[DEBUG] JSON解析失败:', {
                    endpoint,
                    status: response.status,
                    contentType,
                    rawText,
                    error: jsonError,
                });
                await Logger.error('API_JSON_PARSE_ERROR', `响应解析失败 (${endpoint})`, undefined, {
                    status: response.status,
                    statusText: response.statusText,
                    contentType,
                    rawTextPreview: rawText.substring(0, 200),
                    errorMessage: jsonError instanceof Error ? jsonError.message : String(jsonError),
                });
                throw createError('JSON_PARSE_ERROR', 'API响应格式错误，无法解析JSON', { status: response.status, contentType, rawText: rawText.substring(0, 200) });
            }
            // 🔍 输出成功响应的数据
            console.log('[DEBUG] API响应成功:', {
                endpoint,
                status: response.status,
                data: responseData,
                hasSuccess: 'success' in responseData,
                successValue: responseData?.success,
            });
            // 🔍 检查是否是空对象（没有任何字段，或只有success字段但值为undefined）
            // 注意：不能简单检查是否有success字段，因为很多API（如getUsage）返回的数据本身就没有success字段
            const keys = Object.keys(responseData);
            const isEmpty = keys.length === 0;
            const hasOnlyUndefinedSuccess = keys.length === 1 &&
                'success' in responseData &&
                responseData.success === undefined;
            if (!responseData || typeof responseData !== 'object' || isEmpty || hasOnlyUndefinedSuccess) {
                console.log('[DEBUG] 响应数据为空对象，返回默认成功响应', {
                    isEmpty,
                    hasOnlyUndefinedSuccess,
                    keys,
                });
                return {
                    success: true,
                    message: '操作成功',
                };
            }
            // 🔍 特殊处理：如果响应有success字段但值为undefined，替换为true
            if ('success' in responseData && responseData.success === undefined) {
                console.log('[DEBUG] success字段为undefined，设置为true');
                responseData.success = true;
                if (!responseData.message) {
                    responseData.message = '操作成功';
                }
            }
            return responseData;
        }
        catch (error) {
            // 🔍 直接输出错误到console
            console.error('[DEBUG] API请求异常:', {
                method,
                endpoint,
                url,
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorStack: error instanceof Error ? error.stack : undefined,
                fullError: error,
            });
            // 记录详细的错误日志
            await Logger.error('API_REQUEST', `请求失败: ${endpoint}`, undefined, {
                method,
                endpoint,
                url,
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorStack: error instanceof Error ? error.stack : undefined,
                errorCode: error.code,
            });
            throw error;
        }
    }
    /**
     * 带超时的 fetch
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            // 详细记录fetch错误
            await Logger.error('FETCH_ERROR', `网络请求失败: ${url}`, undefined, {
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                url,
                method: options.method,
            });
            if (error instanceof Error && error.name === 'AbortError') {
                throw createError('REQUEST_TIMEOUT', `请求超时（${timeout}ms）`);
            }
            throw error;
        }
    }
    // ==================== API 方法 ====================
    /**
     * 获取订阅列表
     * @param apiKey API 密钥
     * @returns 订阅列表
     */
    async getSubscriptions(apiKey) {
        await Logger.info('API_CALL', '获取订阅列表');
        const response = await this.request('POST', '/api/subscription', apiKey);
        try {
            const subscriptions = this.normalizeSubscriptionsResponse(response);
            await Logger.success('API_CALL', `获取到 ${subscriptions.length} 个订阅`, undefined, {
                responseShape: Array.isArray(response) ? 'array' : typeof response,
            });
            return subscriptions;
        }
        catch (error) {
            await Logger.error('API_SUBSCRIPTION_PARSE_FAILED', '订阅接口响应格式解析失败', undefined, {
                error: error instanceof Error ? error.message : String(error),
                rawType: typeof response,
                rawKeys: response && typeof response === 'object' ? Object.keys(response) : [],
                rawPreview: (() => {
                    try {
                        return JSON.stringify(response).slice(0, 500);
                    }
                    catch {
                        return String(response);
                    }
                })(),
            });
            throw error;
        }
    }
    /**
     * 适配多种订阅响应格式，确保返回数组
     */
    normalizeSubscriptionsResponse(response) {
        const candidates = [
            { value: response, path: 'root' },
            { value: response?.data, path: 'data' },
            { value: response?.data?.subscriptions, path: 'data.subscriptions' },
            { value: response?.data?.subscriptionList, path: 'data.subscriptionList' },
            { value: response?.data?.subscriptionEntityList, path: 'data.subscriptionEntityList' },
            { value: response?.data?.list, path: 'data.list' },
            { value: response?.data?.items, path: 'data.items' },
            { value: response?.subscriptions, path: 'subscriptions' },
            { value: response?.subscriptionList, path: 'subscriptionList' },
            { value: response?.subscriptionEntityList, path: 'subscriptionEntityList' },
            { value: response?.list, path: 'list' },
            { value: response?.items, path: 'items' },
            { value: response?.records, path: 'records' },
            { value: response?.result, path: 'result' },
        ];
        for (const candidate of candidates) {
            if (Array.isArray(candidate.value)) {
                // 找到数组，直接返回
                return candidate.value;
            }
        }
        const keys = response && typeof response === 'object' ? Object.keys(response) : [];
        throw createError('INVALID_SUBSCRIPTION_RESPONSE', '订阅接口返回格式已变更，无法解析订阅列表', {
            keys,
            sample: (() => {
                try {
                    return JSON.stringify(response).slice(0, 500);
                }
                catch {
                    return String(response);
                }
            })(),
        });
    }
    /**
     * 获取使用情况
     * @param apiKey API 密钥
     * @returns 使用情况
     */
    async getUsage(apiKey) {
        await Logger.info('API_CALL', '获取使用情况');
        const rawResponse = await this.request('POST', '/api/usage', apiKey);
        let response;
        try {
            response = this.normalizeUsageResponse(rawResponse);
        }
        catch (error) {
            await Logger.error('API_USAGE_PARSE_FAILED', '使用情况接口响应格式解析失败', undefined, {
                error: error instanceof Error ? error.message : String(error),
                rawType: typeof rawResponse,
                rawKeys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : [],
                rawPreview: (() => {
                    try {
                        return JSON.stringify(rawResponse).slice(0, 500);
                    }
                    catch {
                        return String(rawResponse);
                    }
                })(),
            });
            throw error;
        }
        // 🔍 调试：查看getUsage返回的原始响应
        console.log('[DEBUG] APIClient.getUsage 返回的原始响应:', {
            rawResponse,
            normalized: response,
            currentCredits: response.currentCredits,
            creditLimit: response.creditLimit,
            hasCurrentCredits: 'currentCredits' in response,
            hasCreditLimit: 'creditLimit' in response,
            responseKeys: Object.keys(response),
            responseJSON: JSON.stringify(response),
        });
        await Logger.success('API_CALL', '获取使用情况成功');
        return response;
    }
    /**
     * 重置积分
     * @param apiKey API 密钥
     * @param subscriptionId 订阅ID
     * @returns 重置响应
     */
    async resetCredits(apiKey, subscriptionId) {
        await Logger.info('API_CALL', `重置积分: ${subscriptionId}`);
        const rawResponse = await this.request('POST', `/api/reset-credits/${subscriptionId}`, apiKey);
        const response = this.normalizeResetResponse(rawResponse);
        // 🔍 详细调试日志 - 查看实际返回的响应对象
        console.log('[DEBUG] resetCredits 收到响应:', {
            rawResponse,
            normalized: response,
            success: response.success,
            message: response.message,
            typeof_success: typeof response.success,
            typeof_message: typeof response.message,
            keys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : [],
            json: (() => {
                try {
                    return JSON.stringify(rawResponse);
                }
                catch {
                    return String(rawResponse);
                }
            })(),
        });
        if (response.success) {
            await Logger.success('API_CALL', `积分重置成功: ${subscriptionId}`, undefined, {
                message: response.message,
            });
        }
        else {
            await Logger.warning('API_CALL', `积分重置失败: ${response.message}`, undefined, {
                message: response.message,
                error: response.error,
            });
        }
        return response;
    }
    /**
     * 适配使用情况接口的多种返回格式
     */
    normalizeUsageResponse(raw) {
        const candidates = [
            { value: raw, path: 'root' },
            { value: raw?.data, path: 'data' },
            { value: raw?.data?.data, path: 'data.data' },
            { value: raw?.result, path: 'result' },
            { value: raw?.payload, path: 'payload' },
            { value: raw?.usage, path: 'usage' },
            { value: raw?.data?.usage, path: 'data.usage' },
        ];
        const hasUsageShape = (obj) => obj &&
            typeof obj === 'object' &&
            ('currentCredits' in obj ||
                'creditLimit' in obj ||
                'remainingCredits' in obj ||
                'availableCredits' in obj ||
                'subscriptionEntityList' in obj);
        const firstHit = candidates.find((c) => hasUsageShape(c.value));
        const usageObj = firstHit?.value ?? raw;
        if (!hasUsageShape(usageObj)) {
            throw createError('INVALID_USAGE_RESPONSE', '使用情况接口返回格式已变更，无法解析', {
                keys: usageObj && typeof usageObj === 'object' ? Object.keys(usageObj) : [],
                sample: (() => {
                    try {
                        return JSON.stringify(usageObj).slice(0, 500);
                    }
                    catch {
                        return String(usageObj);
                    }
                })(),
            });
        }
        const toNumber = (val) => {
            if (typeof val === 'number' && Number.isFinite(val))
                return val;
            if (typeof val === 'string') {
                const n = Number(val);
                return Number.isFinite(n) ? n : 0;
            }
            return 0;
        };
        const currentCredits = toNumber(usageObj.currentCredits ?? usageObj.remainingCredits ?? usageObj.availableCredits ?? usageObj.credits);
        const creditLimit = toNumber(usageObj.creditLimit ?? usageObj.totalCredits ?? usageObj.quota ?? usageObj.limit);
        const subscriptionEntityList = Array.isArray(usageObj.subscriptionEntityList)
            ? usageObj.subscriptionEntityList
            : Array.isArray(usageObj.subscriptions)
                ? usageObj.subscriptions
                : Array.isArray(usageObj.data?.subscriptions)
                    ? usageObj.data.subscriptions
                    : [];
        const normalized = {
            id: usageObj.id ?? 0,
            keyId: usageObj.keyId ?? '',
            name: usageObj.name ?? '',
            employeeId: usageObj.employeeId ?? 0,
            subscriptionId: usageObj.subscriptionId ?? usageObj.id ?? 0,
            subscriptionName: usageObj.subscriptionName ?? '',
            currentCredits,
            creditLimit,
            subscriptionEntityList,
            createdAt: usageObj.createdAt ?? '',
            updatedAt: usageObj.updatedAt ?? '',
        };
        return normalized;
    }
    /**
     * 适配重置接口的多种返回格式
     */
    normalizeResetResponse(raw) {
        const obj = (raw ?? {});
        const rawSuccess = obj['success'];
        const code = typeof obj['code'] === 'number' ? obj['code'] : undefined;
        const statusCode = typeof obj['statusCode'] === 'number' ? obj['statusCode'] : undefined;
        const status = typeof obj['status'] === 'number' ? obj['status'] : undefined;
        const message = (typeof obj['message'] === 'string' && obj['message']) ||
            (typeof obj?.msg === 'string' && obj.msg) ||
            '重置失败';
        const data = obj['data'] ||
            obj['result'] ||
            obj['payload'];
        // 判定成功：显式 success=true 或 code/status/statusCode 为成功值，或存在 data 但无错误
        const success = rawSuccess === true ||
            code === 0 ||
            statusCode === 200 ||
            status === 200 ||
            status === 201 ||
            (rawSuccess === undefined && code === undefined && statusCode === undefined && status === undefined && !!data);
        const error = obj['error'] ||
            (typeof code === 'number' && code !== 0 && code !== 200 && code !== 201
                ? { code, message: message || '重置失败', type: 'API_CODE_NON_ZERO' }
                : undefined);
        // 如果 success 仍然无法判定且没有 data，则认为失败
        const finalSuccess = success === true;
        return {
            success: finalSuccess,
            message: finalSuccess ? message || '重置成功' : message || '重置失败',
            data,
            error: finalSuccess ? undefined : error,
        };
    }
    /**
     * 测试连接
     * @param apiKey API 密钥
     * @returns 是否连接成功
     */
    async testConnection(apiKey) {
        try {
            await this.getUsage(apiKey);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 获取速率限制状态
     */
    getRateLimitStatus() {
        return {
            availableTokens: this.rateLimiter.getAvailableTokens(),
            capacity: RATE_LIMIT_CONFIG.BUCKET_CAPACITY,
        };
    }
}
// ==================== 单例导出 ====================
/**
 * 全局单例实例
 */
export const apiClient = new APIClient();
//# sourceMappingURL=APIClient.js.map
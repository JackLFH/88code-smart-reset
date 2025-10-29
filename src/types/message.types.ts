/**
 * Message Types
 * UI 和后台之间的消息传递类型
 *
 * @author Half open flowers
 */

import type { ResetResult, LogEntry, Account } from './business.types';
import type { UsageResponse } from './api.types';

// ==================== 消息来源与目标 ====================

/**
 * 消息来源
 */
export type MessageSource = 'popup' | 'options' | 'background' | 'content';

/**
 * 消息目标
 */
export type MessageDestination = 'popup' | 'options' | 'background' | 'content' | 'all';

// ==================== 消息类型 ====================

/**
 * 消息类型枚举
 */
export enum MessageType {
  // 查询类
  GET_USAGE = 'GET_USAGE',
  GET_ACCOUNTS = 'GET_ACCOUNTS',
  GET_LOGS = 'GET_LOGS',
  GET_CONFIG = 'GET_CONFIG',
  GET_STATUS = 'GET_STATUS',

  // 操作类
  EXECUTE_RESET = 'EXECUTE_RESET',
  SAVE_API_KEY = 'SAVE_API_KEY',
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  CLEAR_LOGS = 'CLEAR_LOGS',
  TEST_CONNECTION = 'TEST_CONNECTION',

  // 通知类
  RESET_COMPLETED = 'RESET_COMPLETED',
  RESET_FAILED = 'RESET_FAILED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  LOG_ADDED = 'LOG_ADDED',

  // 错误类
  ERROR = 'ERROR',
}

// ==================== 消息 Payload 定义 ====================

/**
 * 获取使用情况 Payload
 */
export interface GetUsagePayload extends Record<string, unknown> {
  accountId?: string;
}

/**
 * 获取日志 Payload
 */
export interface GetLogsPayload extends Record<string, unknown> {
  limit?: number;
  level?: string;
}

/**
 * 执行重置 Payload
 */
export interface ExecuteResetPayload extends Record<string, unknown> {
  accountId?: string;
  manual: boolean;
}

/**
 * 保存 API 密钥 Payload
 */
export interface SaveAPIKeyPayload extends Record<string, unknown> {
  apiKey: string;
  accountName: string;
}

/**
 * 更新配置 Payload
 */
export interface UpdateConfigPayload extends Record<string, unknown> {
  scheduleConfig?: {
    firstResetTime?: string;
    secondResetTime?: string;
    timezone?: string;
    enabled?: boolean;
  };
  preferences?: {
    autoResetEnabled?: boolean;
    notificationsEnabled?: boolean;
    theme?: 'dark' | 'light' | 'auto';
  };
}

// ==================== 消息响应定义 ====================

/**
 * 使用情况响应
 */
export interface UsageResponsePayload extends Record<string, unknown> {
  usage: UsageResponse | null;
  error?: string;
}

/**
 * 账号列表响应
 */
export interface AccountsResponsePayload extends Record<string, unknown> {
  accounts: Account[];
}

/**
 * 日志列表响应
 */
export interface LogsResponsePayload extends Record<string, unknown> {
  logs: LogEntry[];
}

/**
 * 重置完成响应
 */
export interface ResetCompletedPayload extends Record<string, unknown> {
  result: ResetResult;
}

/**
 * 状态更新响应
 */
export interface StatusUpdatePayload extends Record<string, unknown> {
  connected: boolean;
  lastSync?: number;
  nextScheduledReset?: number;
}

/**
 * 错误响应
 */
export interface ErrorPayload extends Record<string, unknown> {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==================== 泛型消息接口 ====================

/**
 * 泛型消息接口
 * @template T 消息类型
 * @template P Payload 类型
 */
export interface Message<T extends MessageType, P extends Record<string, unknown>> {
  /** 消息唯一ID */
  id: string;
  /** 消息类型 */
  type: T;
  /** 消息数据 */
  payload: P;
  /** 时间戳 */
  timestamp: number;
  /** 消息来源 */
  source: MessageSource;
  /** 消息目标 */
  destination: MessageDestination;
}

/**
 * 消息响应接口
 * @template T 数据类型
 */
export interface MessageResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: ErrorPayload;
  /** 响应时间戳 */
  timestamp: number;
}

// ==================== 具体消息类型 ====================

/**
 * 获取使用情况消息
 */
export type GetUsageMessage = Message<MessageType.GET_USAGE, GetUsagePayload>;

/**
 * 执行重置消息
 */
export type ExecuteResetMessage = Message<MessageType.EXECUTE_RESET, ExecuteResetPayload>;

/**
 * 保存 API 密钥消息
 */
export type SaveAPIKeyMessage = Message<MessageType.SAVE_API_KEY, SaveAPIKeyPayload>;

/**
 * 重置完成消息
 */
export type ResetCompletedMessage = Message<MessageType.RESET_COMPLETED, ResetCompletedPayload>;

/**
 * 状态更新消息
 */
export type StatusUpdateMessage = Message<MessageType.STATUS_UPDATE, StatusUpdatePayload>;

// ==================== 工具函数 ====================

/**
 * 创建消息
 */
export function createMessage<T extends MessageType, P extends Record<string, unknown>>(
  type: T,
  payload: P,
  source: MessageSource,
  destination: MessageDestination,
): Message<T, P> {
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
export function createSuccessResponse<T>(data: T): MessageResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): MessageResponse {
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

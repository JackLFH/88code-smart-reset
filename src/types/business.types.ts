/**
 * Business Logic Types
 * 业务逻辑类型定义
 *
 * @author Half open flowers
 */

// ==================== 账号管理 ====================

/**
 * 账号配置
 */
export interface Account {
  /** 账号ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** API 密钥（加密存储） */
  apiKey: string;
  /** 邮箱地址 */
  email: string;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 账号偏好设置
 */
export interface AccountPreferences {
  /** 是否启用自动重置 */
  autoResetEnabled: boolean;
  /** 是否启用通知 */
  notificationsEnabled: boolean;
  /** 时区（IANA Time Zone） */
  timezone: string;
  /** 主题（暗色/亮色） */
  theme: 'dark' | 'light' | 'auto';
}

// ==================== 重置操作 ====================

/**
 * 重置类型
 */
export type ResetType = 'FIRST' | 'SECOND' | 'MANUAL';

/**
 * 重置结果状态
 */
export type ResetResultStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'PARTIAL';

/**
 * 单个订阅的重置结果
 */
export interface SubscriptionResetResult {
  /** 订阅ID */
  subscriptionId: string;
  /** 订阅计划 */
  plan: string;
  /** 状态 */
  status: ResetResultStatus;
  /** 消息 */
  message: string;
  /** 重置前使用量（GB） */
  usageBefore?: number;
  /** 重置后使用量（GB） */
  usageAfter?: number;
  /** 耗时（毫秒） */
  duration?: number;
  /** 错误详情 */
  error?: string;
}

/**
 * 账号重置结果
 */
export interface ResetResult {
  /** 账号ID */
  accountId: string;
  /** 账号名称 */
  accountName: string;
  /** 总体状态 */
  status: ResetResultStatus;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 总耗时（毫秒） */
  totalDuration: number;
  /** 各订阅的重置结果 */
  subscriptions: SubscriptionResetResult[];
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 跳过数量 */
  skippedCount: number;
  /** 总结消息 */
  summary: string;
}

// ==================== 调度与执行 ====================

/**
 * 重置时间配置
 */
export interface ResetScheduleConfig {
  /** 首次重置时间（HH:mm） */
  firstResetTime: string;
  /** 二次重置时间（HH:mm） */
  secondResetTime: string;
  /** 时区 */
  timezone: string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 执行状态
 */
export interface ExecutionState {
  /** 今天是否已执行首次重置 */
  firstResetToday: boolean;
  /** 今天是否已执行二次重置 */
  secondResetToday: boolean;
  /** 上次执行日期（YYYY-MM-DD） */
  lastExecutionDate: string;
  /** 最后更新时间戳 */
  lastUpdated: number;
}

/**
 * 调度任务信息
 */
export interface ScheduledTask {
  /** 任务名称 */
  name: string;
  /** 下次执行时间 */
  scheduledTime: number;
  /** 周期（分钟） */
  periodInMinutes: number;
}

// ==================== 日志记录 ====================

/**
 * 日志级别
 */
export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * 日志条目
 */
export interface LogEntry {
  /** 日志ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 操作类型 */
  operation: string;
  /** 消息 */
  message: string;
  /** 账号ID（可选） */
  accountId?: string;
  /** 详细数据（已脱敏） */
  details?: Record<string, unknown>;
}

// ==================== 类型守卫 ====================

/**
 * 检查重置结果是否成功
 */
export function isResetSuccess(result: ResetResult): boolean {
  return result.status === 'SUCCESS' && result.failedCount === 0;
}

/**
 * 检查重置结果是否部分成功
 */
export function isResetPartial(result: ResetResult): boolean {
  return result.status === 'PARTIAL' || (result.successCount > 0 && result.failedCount > 0);
}

/**
 * 检查今天是否需要执行重置
 */
export function shouldExecuteReset(
  state: ExecutionState,
  isFirstReset: boolean,
): boolean {
  const today = new Date().toISOString().split('T')[0];

  // 如果日期变化，重置状态
  if (state.lastExecutionDate !== today) {
    return true;
  }

  // 检查对应时段是否已执行
  return isFirstReset ? !state.firstResetToday : !state.secondResetToday;
}

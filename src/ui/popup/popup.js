/**
 * Popup Script
 * Popup 界面交互逻辑
 *
 * @author Half open flowers
 */
// ==================== DOM 元素 ====================
const statusIndicator = document.getElementById('statusIndicator');
const statusText = statusIndicator.querySelector('.status-text');
const usageLoading = document.getElementById('usageLoading');
const usageContent = document.getElementById('usageContent');
const usageError = document.getElementById('usageError');
const errorMessage = document.getElementById('errorMessage');
const gaugeFill = document.getElementById('gaugeFill');
const gaugePercentage = document.getElementById('gaugePercentage');
const usedValue = document.getElementById('usedValue');
const totalValue = document.getElementById('totalValue');
const remainingValue = document.getElementById('remainingValue');
const resetBtn = document.getElementById('resetBtn');
const btnText = resetBtn.querySelector('.btn-text');
const btnLoading = resetBtn.querySelector('.btn-loading');
const settingsBtn = document.getElementById('settingsBtn');
const nextResetTime = document.getElementById('nextResetTime');
const viewLogsLink = document.getElementById('viewLogsLink');
// ==================== 工具函数 ====================
/**
 * 发送消息到后台
 */
const sendMessage = async (type, payload) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, payload }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (!response || !response.success) {
                reject(new Error(response?.error?.message || '未知错误'));
                return;
            }
            resolve(response.data);
        });
    });
};
/**
 * 格式化 GB 数值
 */
const formatGB = (gb) => {
    return `${gb.toFixed(2)} GB`;
};
/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === now.toDateString()) {
        return `今天 ${timeStr}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return `明天 ${timeStr}`;
    }
    return `${date.toLocaleDateString('zh-CN')} ${timeStr}`;
};
// ==================== UI 更新函数 ====================
/**
 * 显示加载状态
 */
const showLoading = () => {
    usageLoading.classList.remove('hidden');
    usageContent.classList.add('hidden');
    usageError.classList.add('hidden');
};
/**
 * 显示错误
 */
const showError = (message) => {
    usageLoading.classList.add('hidden');
    usageContent.classList.add('hidden');
    usageError.classList.remove('hidden');
    errorMessage.textContent = message;
};
/**
 * 更新使用情况显示
 */
const updateUsageDisplay = (usage) => {
    usageLoading.classList.add('hidden');
    usageError.classList.add('hidden');
    usageContent.classList.remove('hidden');
    // 更新数值
    const percentage = Math.min(Math.max(usage.usagePercentage, 0), 100);
    gaugePercentage.textContent = `${percentage.toFixed(1)}%`;
    usedValue.textContent = formatGB(usage.usedGb);
    totalValue.textContent = formatGB(usage.totalQuotaGb);
    remainingValue.textContent = formatGB(usage.remainingGb);
    // 更新圆形进度条
    const circumference = 2 * Math.PI * 80; // r=80
    const offset = circumference - (percentage / 100) * circumference;
    gaugeFill.style.strokeDashoffset = offset.toString();
    // 根据使用率设置颜色
    let color = 'var(--color-success)';
    if (percentage >= 80) {
        color = 'var(--color-error)';
    }
    else if (percentage >= 60) {
        color = 'var(--color-warning)';
    }
    gaugeFill.style.stroke = color;
};
/**
 * 更新状态指示器
 */
const updateStatus = (connected) => {
    if (connected) {
        statusIndicator.classList.add('connected');
        statusText.textContent = '已连接';
    }
    else {
        statusIndicator.classList.remove('connected');
        statusText.textContent = '未连接';
    }
};
/**
 * 更新下次重置时间
 */
const updateNextResetTime = (timestamp) => {
    if (timestamp) {
        nextResetTime.textContent = formatTimestamp(timestamp);
    }
    else {
        nextResetTime.textContent = '未设置';
    }
};
// ==================== 数据加载 ====================
/**
 * 加载使用情况
 */
const loadUsage = async () => {
    showLoading();
    try {
        const usage = await sendMessage('GET_USAGE');
        if (!usage) {
            showError('请先在设置中配置 API 密钥');
            return;
        }
        updateUsageDisplay(usage);
    }
    catch (error) {
        showError(error instanceof Error ? error.message : '加载失败');
    }
};
/**
 * 加载状态
 */
const loadStatus = async () => {
    try {
        const status = await sendMessage('GET_STATUS');
        updateStatus(status.connected);
        updateNextResetTime(status.nextScheduledReset);
    }
    catch (error) {
        updateStatus(false);
    }
};
// ==================== 事件处理 ====================
/**
 * 重置按钮点击
 */
resetBtn.addEventListener('click', async () => {
    if (resetBtn.disabled)
        return;
    // 显示加载状态
    resetBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    try {
        await sendMessage('EXECUTE_RESET', { manual: true });
        // 显示成功提示
        btnText.textContent = '重置成功！';
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        // 重新加载数据
        setTimeout(() => {
            btnText.textContent = '立即重置';
            loadUsage();
            loadStatus();
        }, 1500);
    }
    catch (error) {
        // 显示错误
        btnText.textContent = '重置失败';
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        setTimeout(() => {
            btnText.textContent = '立即重置';
        }, 2000);
        showError(error instanceof Error ? error.message : '重置失败');
    }
    finally {
        resetBtn.disabled = false;
    }
});
/**
 * 设置按钮点击
 */
settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});
/**
 * 查看日志链接点击
 */
viewLogsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});
// ==================== 初始化 ====================
/**
 * 初始化 Popup
 */
const initialize = async () => {
    await Promise.all([
        loadUsage(),
        loadStatus(),
    ]);
};
// 启动
initialize().catch((error) => {
    console.error('初始化失败:', error);
    showError('初始化失败');
});
// 定期刷新（每30秒）
setInterval(() => {
    loadUsage().catch(() => {
        // 忽略错误
    });
}, 30000);
export {};
//# sourceMappingURL=popup.js.map
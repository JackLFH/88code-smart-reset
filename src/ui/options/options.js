/**
 * Options Page Script
 *
 * @author Half open flowers
 */
// ==================== DOM 元素 ====================
// 导航
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
// API 配置
const apiForm = document.getElementById('apiForm');
const accountNameInput = document.getElementById('accountName');
const apiKeyInput = document.getElementById('apiKey');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const apiAlert = document.getElementById('apiAlert');
// 定时设置
const scheduleForm = document.getElementById('scheduleForm');
const firstResetTimeInput = document.getElementById('firstResetTime');
const secondResetTimeInput = document.getElementById('secondResetTime');
const autoResetEnabledCheckbox = document.getElementById('autoResetEnabled');
const notificationsEnabledCheckbox = document.getElementById('notificationsEnabled');
const scheduleAlert = document.getElementById('scheduleAlert');
// 日志
const refreshLogsBtn = document.getElementById('refreshLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logsContainer = document.getElementById('logsContainer');
// 账号列表
const accountList = document.getElementById('accountList');
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
 * 显示提示
 */
const showAlert = (element, message, type) => {
    element.textContent = message;
    element.className = `alert ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 3000);
};
/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
};
// ==================== Tab 切换 ====================
navItems.forEach((navItem) => {
    navItem.addEventListener('click', () => {
        const tabId = navItem.getAttribute('data-tab');
        // 更新导航状态
        navItems.forEach((item) => item.classList.remove('active'));
        navItem.classList.add('active');
        // 更新内容显示
        tabContents.forEach((content) => {
            content.classList.remove('active');
            if (content.id === `${tabId}Tab`) {
                content.classList.add('active');
            }
        });
        // 如果切换到日志 Tab，加载日志
        if (tabId === 'logs') {
            loadLogs().catch(console.error);
        }
    });
});
// ==================== API 配置 ====================
/**
 * 保存 API 配置
 */
apiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const accountName = accountNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!accountName || !apiKey) {
        showAlert(apiAlert, '请填写完整信息', 'error');
        return;
    }
    try {
        await sendMessage('SAVE_API_KEY', { accountName, apiKey });
        showAlert(apiAlert, 'API 密钥已保存', 'success');
        apiForm.reset();
        // 重新加载账号列表
        loadAccountList().catch(console.error);
    }
    catch (error) {
        showAlert(apiAlert, error instanceof Error ? error.message : '保存失败', 'error');
    }
});
/**
 * 测试连接
 */
testConnectionBtn.addEventListener('click', async () => {
    try {
        const result = await sendMessage('TEST_CONNECTION');
        if (result.connected) {
            showAlert(apiAlert, '连接成功！', 'success');
        }
        else {
            showAlert(apiAlert, '连接失败，请检查 API 密钥', 'error');
        }
    }
    catch (error) {
        showAlert(apiAlert, error instanceof Error ? error.message : '测试失败', 'error');
    }
});
// ==================== 账号列表 ====================
/**
 * 加载账号列表
 */
const loadAccountList = async () => {
    accountList.innerHTML = '<div class="account-list-loading">加载中...</div>';
    try {
        const accounts = await sendMessage('GET_ACCOUNTS');
        if (accounts.length === 0) {
            accountList.innerHTML = '<div class="account-list-empty">暂无账号，请在上方添加</div>';
            return;
        }
        // 渲染账号列表
        accountList.innerHTML = '';
        accounts.forEach((account) => {
            const card = createAccountCard(account);
            accountList.appendChild(card);
        });
    }
    catch (error) {
        accountList.innerHTML = '<div class="account-list-empty">加载失败</div>';
        console.error('加载账号列表失败:', error);
    }
};
/**
 * 创建账号卡片
 */
const createAccountCard = (account) => {
    const card = document.createElement('div');
    card.className = 'account-card';
    // 图标（显示账号名称首字母）
    const icon = document.createElement('div');
    icon.className = 'account-icon';
    icon.textContent = account.name.charAt(0).toUpperCase();
    // 账号信息
    const info = document.createElement('div');
    info.className = 'account-info';
    // 账号名称和状态
    const nameDiv = document.createElement('div');
    nameDiv.className = 'account-name';
    const nameText = document.createElement('span');
    nameText.textContent = account.name;
    const statusBadge = document.createElement('span');
    statusBadge.className = `account-status ${account.enabled ? 'enabled' : 'disabled'}`;
    statusBadge.textContent = account.enabled ? '✓ 启用' : '✕ 禁用';
    nameDiv.appendChild(nameText);
    nameDiv.appendChild(statusBadge);
    // 元数据（创建时间、ID等）
    const metaDiv = document.createElement('div');
    metaDiv.className = 'account-meta';
    const idItem = document.createElement('div');
    idItem.className = 'account-meta-item';
    idItem.innerHTML = `<span>ID:</span> <span>${account.id.substring(0, 8)}...</span>`;
    const timeItem = document.createElement('div');
    timeItem.className = 'account-meta-item';
    timeItem.innerHTML = `<span>创建:</span> <span>${formatTimestamp(account.createdAt)}</span>`;
    metaDiv.appendChild(idItem);
    metaDiv.appendChild(timeItem);
    info.appendChild(nameDiv);
    info.appendChild(metaDiv);
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'account-actions';
    // 切换启用/禁用按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'account-btn account-btn-toggle';
    toggleBtn.textContent = account.enabled ? '禁用' : '启用';
    toggleBtn.onclick = () => toggleAccount(account.id, !account.enabled);
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'account-btn account-btn-delete';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => deleteAccount(account.id, account.name);
    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    // 组装卡片
    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(actions);
    return card;
};
/**
 * 切换账号启用状态
 */
const toggleAccount = async (accountId, enabled) => {
    try {
        await sendMessage('UPDATE_ACCOUNT', { accountId, enabled });
        loadAccountList().catch(console.error);
    }
    catch (error) {
        showAlert(apiAlert, error instanceof Error ? error.message : '操作失败', 'error');
    }
};
/**
 * 删除账号
 */
const deleteAccount = async (accountId, accountName) => {
    if (!confirm(`确定要删除账号"${accountName}"吗？\n\n此操作不可撤销。`)) {
        return;
    }
    try {
        await sendMessage('DELETE_ACCOUNT', { accountId });
        showAlert(apiAlert, '账号已删除', 'success');
        loadAccountList().catch(console.error);
    }
    catch (error) {
        showAlert(apiAlert, error instanceof Error ? error.message : '删除失败', 'error');
    }
};
// ==================== 定时设置 ====================
/**
 * 加载定时设置
 */
const loadScheduleConfig = async () => {
    try {
        const data = await sendMessage('GET_CONFIG');
        firstResetTimeInput.value = data.config.firstResetTime;
        secondResetTimeInput.value = data.config.secondResetTime;
        autoResetEnabledCheckbox.checked = data.config.enabled;
        notificationsEnabledCheckbox.checked = data.preferences.notificationsEnabled;
    }
    catch (error) {
        console.error('加载配置失败:', error);
    }
};
/**
 * 保存定时设置
 */
scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const scheduleConfig = {
        firstResetTime: firstResetTimeInput.value,
        secondResetTime: secondResetTimeInput.value,
        enabled: autoResetEnabledCheckbox.checked,
        timezone: 'Asia/Shanghai', // 北京时间（东八区）
    };
    const preferences = {
        autoResetEnabled: autoResetEnabledCheckbox.checked,
        notificationsEnabled: notificationsEnabledCheckbox.checked,
        timezone: 'Asia/Shanghai', // 北京时间（东八区）
        theme: 'dark',
    };
    try {
        await sendMessage('UPDATE_CONFIG', { scheduleConfig, preferences });
        showAlert(scheduleAlert, '设置已保存', 'success');
    }
    catch (error) {
        showAlert(scheduleAlert, error instanceof Error ? error.message : '保存失败', 'error');
    }
});
// ==================== 日志 ====================
/**
 * 加载日志
 */
const loadLogs = async () => {
    // 显示加载状态
    logsContainer.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'logs-loading';
    loadingDiv.textContent = '加载中...';
    logsContainer.appendChild(loadingDiv);
    try {
        const logs = await sendMessage('GET_LOGS', { limit: 100 });
        // 清空容器
        logsContainer.innerHTML = '';
        if (logs.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'logs-loading';
            emptyDiv.textContent = '暂无日志';
            logsContainer.appendChild(emptyDiv);
            return;
        }
        // 使用 DOM API 安全地创建日志条目（防止 XSS）
        logs.forEach((log) => {
            // 创建日志条目容器
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            // 创建日志头部
            const logHeader = document.createElement('div');
            logHeader.className = 'log-header';
            // 创建日志级别标签
            const logLevel = document.createElement('span');
            logLevel.className = `log-level ${log.level.toLowerCase()}`;
            logLevel.textContent = log.level; // textContent 自动转义，防止 XSS
            // 创建时间标签
            const logTime = document.createElement('span');
            logTime.className = 'log-time';
            logTime.textContent = formatTimestamp(log.timestamp);
            // 组装头部
            logHeader.appendChild(logLevel);
            logHeader.appendChild(logTime);
            // 创建日志消息
            const logMessage = document.createElement('div');
            logMessage.className = 'log-message';
            logMessage.textContent = `${log.operation}: ${log.message}`; // textContent 自动转义
            // 组装完整的日志条目
            logEntry.appendChild(logHeader);
            logEntry.appendChild(logMessage);
            // 添加到容器
            logsContainer.appendChild(logEntry);
        });
    }
    catch (error) {
        logsContainer.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'logs-loading';
        errorDiv.textContent = '加载失败';
        logsContainer.appendChild(errorDiv);
    }
};
/**
 * 刷新日志
 */
refreshLogsBtn.addEventListener('click', () => {
    loadLogs().catch(console.error);
});
/**
 * 清空日志
 */
clearLogsBtn.addEventListener('click', async () => {
    if (!confirm('确定要清空所有日志吗？此操作不可撤销。')) {
        return;
    }
    try {
        await sendMessage('CLEAR_LOGS');
        loadLogs().catch(console.error);
    }
    catch (error) {
        console.error('清空日志失败:', error);
    }
});
// ==================== 初始化 ====================
/**
 * 初始化页面
 */
const initialize = async () => {
    await loadScheduleConfig();
    await loadAccountList();
};
// 启动
initialize().catch(console.error);
export {};
//# sourceMappingURL=options.js.map
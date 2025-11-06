/**
 * Options Page Script
 *
 * @author Half open flowers
 */
// ==================== DOM 元素 ====================
// 导航（Hero卡片）
const heroCards = document.querySelectorAll('.hero-cards .card');
const tabContents = document.querySelectorAll('.tab-content');
const heroSection = document.querySelector('.hero');
const backToHeroBtn = document.getElementById('backToHeroBtn');
const logoBtn = document.querySelector('.logo');
// API 配置
const apiForm = document.getElementById('apiForm');
const accountNameInput = document.getElementById('accountName');
const apiKeyInput = document.getElementById('apiKey');
const apiAlert = document.getElementById('apiAlert');
const saveConfigBtn = document.getElementById('saveConfigBtn');
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
heroCards.forEach((card) => {
    card.addEventListener('click', () => {
        const tabId = card.getAttribute('data-tab');
        // 更新卡片状态
        heroCards.forEach((item) => item.classList.remove('active'));
        card.classList.add('active');
        // 更新内容显示
        tabContents.forEach((content) => {
            content.classList.remove('active');
            if (content.id === `${tabId}Tab`) {
                content.classList.add('active');
            }
        });
        // 显示返回按钮
        backToHeroBtn.style.display = 'block';
        // 平滑滚动到主内容区
        document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 如果切换到日志 Tab，加载日志
        if (tabId === 'logs') {
            loadLogs().catch(console.error);
        }
    });
});
// ==================== 返回Hero ====================
const scrollToHero = () => {
    // 滚动回Hero section
    heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 隐藏返回按钮
    setTimeout(() => {
        backToHeroBtn.style.display = 'none';
    }, 600);
    // 清除卡片active状态
    heroCards.forEach((item) => item.classList.remove('active'));
};
// 返回按钮点击事件
backToHeroBtn.addEventListener('click', scrollToHero);
// Logo点击事件（也可以返回）
logoBtn.addEventListener('click', scrollToHero);
// ==================== API 配置 ====================
/**
 * 保存 API 配置（整合测试连接功能）
 */
apiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const accountName = accountNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!accountName || !apiKey) {
        showAlert(apiAlert, '请填写完整信息', 'error');
        return;
    }
    // 输入验证
    const validation = validateInputs();
    if (!validation.isValid) {
        showAlert(apiAlert, validation.message, 'error');
        return;
    }
    // 显示测试中状态
    saveConfigBtn.disabled = true;
    saveConfigBtn.classList.add('loading');
    saveConfigBtn.textContent = '测试连接中...';
    apiAlert.classList.add('hidden');
    try {
        // 先测试API Key连接
        const testResult = await sendMessage('TEST_API_KEY', { apiKey });
        if (!testResult.success) {
            // 测试失败，显示错误信息
            let errorMessage = testResult.message;
            let suggestion = '';
            switch (testResult.errorType) {
                case 'NETWORK_ERROR':
                    suggestion = testResult.details?.suggestion || '请检查网络连接';
                    errorMessage = `${testResult.message} - ${suggestion}`;
                    break;
                case 'AUTH_ERROR':
                    suggestion = testResult.details?.suggestion || '请检查API Key是否正确';
                    errorMessage = `${testResult.message} - ${suggestion}`;
                    break;
                case 'PERMISSION_ERROR':
                    suggestion = testResult.details?.suggestion || '请确保API Key有足够权限';
                    errorMessage = `${testResult.message} - ${suggestion}`;
                    break;
                case 'SERVER_ERROR':
                    suggestion = testResult.details?.suggestion || '请稍后重试';
                    errorMessage = `${testResult.message} - ${suggestion}`;
                    break;
                default:
                    errorMessage = testResult.message;
                    if (testResult.details?.suggestion) {
                        errorMessage += ` - ${testResult.details.suggestion}`;
                    }
            }
            showAlert(apiAlert, `连接测试失败: ${errorMessage}`, 'error');
            return;
        }
        // 测试成功，开始保存配置
        saveConfigBtn.textContent = '保存中...';
        await sendMessage('SAVE_API_KEY', { accountName, apiKey });
        showAlert(apiAlert, `${testResult.message} ✅ 配置已成功保存`, 'success');
        apiForm.reset();
        // 重新加载配置列表
        loadAccountList().catch(console.error);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : '保存失败';
        showAlert(apiAlert, errorMsg, 'error');
    }
    finally {
        // 恢复按钮状态
        saveConfigBtn.disabled = false;
        saveConfigBtn.classList.remove('loading');
        saveConfigBtn.textContent = '保存配置';
    }
});
/**
 * 验证输入格式（只在需要时调用）
 */
function validateInputs() {
    const accountName = accountNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!accountName) {
        return { isValid: false, message: '请输入配置名称' };
    }
    if (!apiKey) {
        return { isValid: false, message: '请输入 API 密钥' };
    }
    if (apiKey.length < 20) {
        return { isValid: false, message: 'API 密钥格式不正确，至少需要20个字符' };
    }
    return { isValid: true, message: '' };
}
// ==================== 账号列表 ====================
/**
 * 加载配置列表
 */
const loadAccountList = async () => {
    accountList.innerHTML = '<div class="account-list-loading">加载中...</div>';
    try {
        const accounts = await sendMessage('GET_ACCOUNTS');
        if (accounts.length === 0) {
            accountList.innerHTML = '<div class="account-list-empty">暂无配置，请在上方添加</div>';
            return;
        }
        // 渲染配置列表
        accountList.innerHTML = '';
        accounts.forEach((account) => {
            const card = createAccountCard(account);
            accountList.appendChild(card);
        });
    }
    catch (error) {
        accountList.innerHTML = '<div class="account-list-empty">加载失败</div>';
        console.error('加载配置列表失败:', error);
    }
};
/**
 * 创建配置卡片
 */
const createAccountCard = (account) => {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.dataset['enabled'] = account.enabled.toString();
    // 图标（显示配置名称首字母）
    const icon = document.createElement('div');
    icon.className = 'account-icon';
    icon.textContent = account.name.charAt(0).toUpperCase();
    // 配置信息
    const info = document.createElement('div');
    info.className = 'account-info';
    // 配置名称和状态
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
 * 切换配置启用状态
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
 * 删除配置
 */
const deleteAccount = async (accountId, accountName) => {
    if (!confirm(`确定要删除配置"${accountName}"吗？\n\n此操作不可撤销。`)) {
        return;
    }
    try {
        await sendMessage('DELETE_ACCOUNT', { accountId });
        showAlert(apiAlert, '配置已删除', 'success');
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
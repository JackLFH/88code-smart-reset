# API 配置说明

## ⚠️ 重要提示

当前项目中的 API 端点配置可能不是真实的 88code API 地址！

本项目是根据设计文档实现的，但 **88code 的真实 API 端点需要根据实际情况调整**。

---

## 📍 当前配置

### 基础 URL
```typescript
// 文件位置: src/core/services/APIClient.ts:31
BASE_URL: 'https://api.88code.com'
```

### API 端点
```typescript
// 获取订阅列表
GET /api/v1/subscriptions

// 获取使用情况
GET /api/v1/usage

// 健康检查
GET /api/v1/health

// 重置积分
POST /api/v1/subscriptions/{subscriptionId}/reset
```

---

## 🔧 如何修改 API 配置

### 方法 1: 修改源代码（推荐）

**步骤 1：修改 APIClient.ts**

```bash
# 编辑文件
src/core/services/APIClient.ts
```

找到第 31 行，修改为真实的 API 地址：
```typescript
const API_CONFIG = {
  /** API 基础 URL */
  BASE_URL: 'https://你的真实API地址.com',  // ← 修改这里
  /** 请求超时（毫秒） */
  TIMEOUT: 30000,
  // ...
} as const;
```

**步骤 2：修改 manifest.json**

```bash
# 编辑文件
public/manifest.json
```

找到第 39-41 行，修改 host_permissions：
```json
"host_permissions": [
  "https://你的真实API地址.com/*"  // ← 修改这里
]
```

**步骤 3：重新构建**

```bash
npm run build
```

**步骤 4：重新加载扩展**

1. 打开 `chrome://extensions/`
2. 点击扩展的"重新加载"按钮
3. 测试连接

---

### 方法 2: 使用环境变量（推荐用于开发）

**步骤 1：创建 .env 文件**

```bash
# 在项目根目录创建 .env
VITE_API_BASE_URL=https://你的真实API地址.com
```

**步骤 2：修改 APIClient.ts**

```typescript
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.88code.com',
  // ...
} as const;
```

**步骤 3：重新构建**

```bash
npm run build
```

---

## 🔍 如何找到真实的 API 地址

### 选项 1：查看 88code 官方文档
- 登录 88code 平台
- 查找 API 文档或开发者文档
- 找到 API 基础 URL

### 选项 2：浏览器开发者工具
1. 登录 88code 网站
2. 打开浏览器开发者工具 (F12)
3. 切换到 "Network" 标签
4. 执行一些操作（如查看订阅、重置等）
5. 观察请求的 URL，例如：
   ```
   Request URL: https://真实地址.com/api/xxx
   ```

### 选项 3：联系 88code 支持
- 询问官方 API 端点地址
- 获取 API 文档

---

## 📋 需要确认的信息

请提供以下信息，以便正确配置：

1. **API 基础 URL**
   - 示例：`https://api.88code.com` 或 `https://www.88code.org`

2. **API 端点路径**（如果与当前不同）
   - 获取订阅列表：`???`
   - 获取使用情况：`???`
   - 重置积分：`???`
   - 健康检查：`???`

3. **认证方式**
   - API Key 的请求头名称（当前是 `X-API-Key`）
   - 是否需要额外的认证？

4. **CORS 配置**
   - Chrome 扩展是否需要特殊的 CORS 设置？

---

## 🧪 测试 API 连接

修改配置后，可以使用以下方法测试：

### 使用 curl 测试

```bash
# 测试健康检查
curl -X GET "https://你的API地址.com/api/v1/health" \
  -H "X-API-Key: 你的API密钥"

# 测试获取订阅
curl -X GET "https://你的API地址.com/api/v1/subscriptions" \
  -H "X-API-Key: 你的API密钥"
```

### 使用 Postman/Insomnia

1. 创建新请求
2. 设置基础 URL
3. 添加 API Key 到请求头
4. 测试各个端点

---

## 📝 当前错误日志分析

```
ERROR - API_REQUEST: 请求失败: /api/v1/health
ERROR - API_REQUEST: 请求失败: /api/v1/usage
```

**可能原因**：
1. ❌ API 基础 URL 不正确
2. ❌ API 端点路径不正确
3. ❌ API Key 无效
4. ❌ CORS 策略阻止
5. ❌ 网络连接问题
6. ❌ 88code 服务器问题

---

## ✅ 修复步骤总结

1. **确认真实的 API 地址**
2. **修改 `src/core/services/APIClient.ts:31`**
3. **修改 `public/manifest.json:40`**
4. **运行 `npm run build`**
5. **重新加载 Chrome 扩展**
6. **在扩展中点击"测试连接"**

---

## 📞 需要帮助？

请提供以下信息，我可以帮你快速配置：

- 真实的 88code API 基础 URL
- API 文档链接（如果有）
- 或者提供一个有效的 API Key，我可以帮你测试

---

**⚠️ 重要提醒**：在提供真实的 API 信息之前，此扩展**无法正常工作**！

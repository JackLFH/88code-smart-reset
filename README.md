# 88code Smart Reset

<div align="center">

**🚀 企业级安全的 88code 账号自动重置工具**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Chrome](https://img.shields.io/badge/Chrome-120+-green.svg)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/JackLFH/88code-smart-reset/pulls)

[功能特性](#-功能特性) • [快速安装](#-快速安装) • [使用指南](#-使用指南) • [开发文档](#-开发文档)

</div>

---

## 📦 项目介绍

88code Smart Reset 是一个专为 88code 用户设计的 Chrome 浏览器扩展，提供自动化的账号配额管理和重置功能。

**为什么需要这个工具？**
- ✅ 自动重置账号配额，无需手动操作
- ✅ 智能保护 PAYGO 订阅，避免误操作
- ✅ 企业级加密存储，保障 API 密钥安全
- ✅ 实时监控配额使用情况
- ✅ 支持多账号管理

**版本状态**：v1.1.0 - 智能重置 ✨

**🎉 v1.1.0 更新内容**：
- ✨ **智能次数检查**：首次重置检查 `resetCount >= 2`，二次重置检查 `resetCount >= 1`
- 🚀 **避免无效调用**：剩余次数不足时自动跳过，节省 API 调用
- 📝 **详细日志提示**：清晰显示跳过原因和剩余次数
- 🎯 **精准时间控制**：18:55 和 23:56 双时段智能重置

---

## ⚡ 快速安装

### 方法 1：从 GitHub 安装（推荐）

**适用于**：开发者、需要最新功能、或想自己构建的用户

#### 步骤 1：克隆仓库

```bash
git clone https://github.com/JackLFH/88code-smart-reset.git
cd 88code-smart-reset
```

#### 步骤 2：安装依赖

```bash
npm install
```

#### 步骤 3：构建扩展

```bash
npm run build
```

构建完成后，`dist/` 目录将包含可加载的扩展文件。

#### 步骤 4：加载到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角的 **"开发者模式"** 开关
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目的 `dist/` 目录
6. 完成！扩展图标会出现在工具栏

### 方法 2：下载预构建版本

**适用于**：普通用户，快速安装

1. 前往 [Releases 页面](https://github.com/JackLFH/88code-smart-reset/releases)
2. 下载最新版本的 `88code-smart-reset-vX.X.X.zip`
3. 解压 ZIP 文件
4. 按照上面"方法 1 - 步骤 4"加载到 Chrome

### 方法 3：Chrome 扩展商店（即将推出）

> 🚧 **开发中** - 我们正在准备上架 Chrome Web Store，敬请期待！

---

## 📖 首次配置

安装完成后，需要配置 API 密钥才能使用。

### 1. 获取 88code API 密钥

1. 登录 [88code.org](https://www.88code.org)
2. 进入 **个人设置** → **API 密钥**
3. 生成新的 API 密钥并复制

### 2. 配置扩展

1. 点击扩展图标，或右键选择 **"选项"**
2. 在 **"API 配置"** 标签页：
   - **账号名称**：自定义名称（如"我的主账号"）
   - **API 密钥**：粘贴你的 API 密钥
3. 点击 **"保存配置"**
4. 点击 **"测试连接"** 验证配置

### 3. 设置自动重置（可选）

1. 切换到 **"定时设置"** 标签
2. 配置重置时间：
   - 首次重置：18:50（默认）
   - 二次重置：23:55（默认）
3. 勾选 **"启用自动重置"**
4. 点击 **"保存设置"**

✅ 完成！扩展现在会按时自动重置配额。

---

## 🎯 使用指南

### 查看配额使用情况

点击扩展图标，查看：
- 当前使用量百分比（圆形进度条）
- 已用/总量/剩余配额
- 下次自动重置时间

### 手动重置

点击 **"立即重置"** 按钮，手动触发重置操作。

### 管理多个账号

1. 在 Options 页面的 **"API 配置"** 标签
2. 滚动到 **"已添加的账号"** 区域
3. 可以：
   - 查看所有账号
   - 启用/禁用账号
   - 删除账号

### 查看日志

切换到 **"日志记录"** 标签，查看：
- 所有重置操作记录
- 成功/失败状态
- 错误信息（如有）

---

## ✨ 功能特性

### 🔄 自动重置
- ⏰ 定时自动重置账号配额（默认 18:55 和 23:56）
- 🧠 **智能次数检查**：首次重置需 `resetCount >= 2`，二次重置需 `resetCount >= 1`
- 🎯 可自定义重置时间（支持多时区）
- 🚀 多账号并行重置，效率最大化

### 🛡️ 智能保护
- **双重 PAYGO 保护**：自动识别并跳过 PAYGO 订阅，避免误操作
- **智能次数检查**：剩余次数不足时自动跳过，避免无效 API 调用
- **重置验证**：验证重置是否成功，确保配额正确减少
- **错误恢复**：自动重试失败的操作

### 🔐 企业级安全
- **AES-256-GCM 加密**：API 密钥加密存储在 Chrome Storage
- **PBKDF2 密钥派生**：100,000 次迭代，防止暴力破解
- **HMAC-SHA256 签名**：请求签名验证，防止篡改
- **自动脱敏**：日志中敏感信息（API 密钥、邮箱）自动过滤

### 📊 可视化监控
- 实时容量使用情况圆形图表
- 账号状态一目了然
- 历史操作日志查询
- 下次重置时间倒计时

### 📱 现代UI
- 暗色主题设计，护眼舒适
- 响应式布局，适配各种屏幕
- 流畅动画效果，交互自然

### 👥 多账号管理
- 支持添加多个 88code 账号
- 独立启用/禁用每个账号
- 账号列表可视化管理
- 批量操作支持

## 技术栈

- **语言**: TypeScript (strict mode)
- **运行时**: Chrome Manifest V3 + Service Worker
- **构建工具**: Vite
- **测试框架**: Vitest
- **安全**: Web Crypto API + CSP

## 开发指南

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Chrome >= 120

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 代码检查

```bash
npm run lint
npm run lint:fix
npm run type-check
```

### 测试

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 📂 项目结构

```
88code-smart-reset/
├── src/
│   ├── background/         # Service Worker 后台服务
│   ├── core/services/      # 核心业务服务
│   │   ├── APIClient.ts    # API 客户端（HMAC 签名）
│   │   ├── ResetService.ts # 重置服务（智能检查）
│   │   └── Scheduler.ts    # 定时调度器
│   ├── storage/            # 加密存储层
│   │   ├── StorageService.ts     # 存储服务
│   │   └── SecureStorage.ts      # AES-256 加密
│   ├── ui/                 # 用户界面
│   │   ├── popup/          # Popup 面板
│   │   └── options/        # 设置页面
│   ├── utils/              # 工具函数
│   └── types/              # TypeScript 类型定义
├── public/                 # 静态资源
├── dist/                   # 构建输出（加载到 Chrome）
└── doc/                    # 设计文档
```

## 🔐 安全特性

- ✅ API 密钥 AES-256-GCM 加密存储
- ✅ PBKDF2 密钥派生（100,000 次迭代）
- ✅ HMAC-SHA256 请求签名验证
- ✅ XSS 防护（DOMPurify + CSP）
- ✅ 敏感信息自动脱敏
- ✅ 速率限制（令牌桶算法，10 req/min）

---

## 📚 文档

- [快速开始指南](./QUICK_START.md) - 5分钟快速上手
- [完整使用指南](./USAGE.md) - 详细功能说明
- [系统架构设计](./doc/01-系统架构设计.md) - 技术架构文档
- [TypeScript类型系统](./doc/02-TypeScript类型系统.md) - 类型定义文档
- [UI界面设计](./doc/03-UI界面设计.md) - 界面设计文档
- [安全架构设计](./doc/04-安全架构设计.md) - 安全防护方案

---

## 🛠️ 开发

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Chrome >= 120

### 开发命令
```bash
# 开发模式（带热重载）
npm run dev

# 生产构建
npm run build

# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint
npm run lint:fix

# 运行测试
npm test
npm run test:coverage
```

### 代码统计
- **总代码量**: ~5000+ 行 TypeScript
- **核心模块**: 17 个
- **文件数量**: 40+ 个
- **类型覆盖率**: 100%
- **最新版本**: v1.1.0（智能重置）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 👤 作者

**Half open flowers**
- Email: 1816524875@qq.com
- GitHub: [@JackLFH](https://github.com/JackLFH)

---

## ⚠️ 免责声明

本扩展为个人项目，非 88code 官方产品。使用前请阅读并理解代码逻辑。作者不对因使用本扩展造成的任何损失负责。

---

## 🙏 致谢

- 感谢 [@Vulpecula-Studio](https://github.com/Vulpecula-Studio) 的项目提供的灵感和参考
- 感谢所有为本项目提供建议和反馈的用户！

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

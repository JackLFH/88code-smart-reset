# 88code 自动重置插件

一个帮你自动重置 88code 积分的 Chrome 插件，省得每天手动操作。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Chrome](https://img.shields.io/badge/Chrome-120+-green.svg)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## 这玩意儿能干啥？

88code 每天有两次免费重置机会（18:55 和 23:56），手动点太麻烦了，这个插件就是帮你自动搞定。

- 到点自动重置，不用你管
- 显示积分使用情况（剩余多少钱）
- 防止误操作重置 PAYGO 订阅（按量付费的那种）
- 有冷却时间保护，重置失败会告诉你还要等多久
- 支持多个账号

**当前版本**：v1.1.0

**这版更新了啥**：
- 修复了积分显示（现在能正确显示 $91.37 这种格式了）
- 加了5小时冷却检查，手动重置时会提示你"还需等待X小时X分钟"
- 重置次数检查更智能了，不会浪费API调用
- 修了一堆UI显示的bug

## 怎么装？

### 从源码安装（推荐）

```bash
# 1. 下载代码
git clone https://github.com/JackLFH/88code-smart-reset.git
cd 88code-smart-reset

# 2. 安装依赖
npm install

# 3. 构建
npm run build
```

然后：
1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角打开"开发者模式"
3. 点"加载已解压的扩展程序"
4. 选择项目里的 `dist/` 文件夹
5. 完事儿

### 下载打包好的

懒得折腾的话：
1. 去 [Releases](https://github.com/JackLFH/88code-smart-reset/releases) 下载最新版 zip
2. 解压
3. 按上面的步骤加载到 Chrome

## 怎么用？

### 第一次配置

1. **拿到 API Key**
   - 登录 [88code.org](https://www.88code.org)
   - 个人设置 → API 密钥
   - 复制你的密钥

2. **填进插件**
   - 右键点插件图标 → 选项
   - 粘贴 API 密钥
   - 随便起个名字（比如"我的账号"）
   - 点"保存"和"测试连接"

3. **设置定时**（可选）
   - 默认 18:55 和 23:56 自动重置
   - 想改时间的话去"定时设置"改
   - 勾上"启用自动重置"

搞定！

## 日常使用

- **看积分**：点插件图标就能看到剩余多少钱
- **手动重置**：点"立即重置"，但要注意5小时冷却
- **查日志**：右键插件 → 选项 → 日志记录，能看到所有操作记录

## 主要功能

- 自动定时重置（18:55 和 23:56）
- 手动重置功能（带冷却提醒）
- PAYGO订阅保护（不会误重置按量付费的）
- 积分显示（显示剩余$多少）
- 重置次数检查（剩0次会跳过）
- 多账号支持
- 操作日志

## 技术栈

TypeScript + Chrome Extension (Manifest V3) + Vite

安全方面：
- API密钥AES-256加密存储
- 日志自动脱敏
- 速率限制（防刷）

## 开发相关

需要Node.js 18+，然后：

```bash
npm install       # 装依赖
npm run dev      # 开发模式
npm run build    # 打包
npm run lint     # 代码检查
```

代码结构：
- `src/background/` - 后台服务
- `src/core/services/` - 核心逻辑（API、重置、调度）
- `src/ui/` - 界面（popup和设置页）
- `src/storage/` - 加密存储
- `dist/` - 打包输出

## License

MIT - 随便用，出事儿不负责 :)

## 作者
- GitHub: [@JackLFH](https://github.com/JackLFH)
- Email: 1816524875@qq.com

## 致谢

- 灵感来自 [@Vulpecula-Studio](https://github.com/Vulpecula-Studio) 的项目
- 感谢所有提建议的朋友



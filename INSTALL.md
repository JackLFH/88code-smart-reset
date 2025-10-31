# 安装指南

## 🚨 重要：正确安装方式

用户反馈安装报错，原因通常是**下载了源码而非构建好的版本**。

---

## ✅ 正确的安装方法

### 方法一：下载构建好的版本（推荐）

1. **访问 Releases 页面**：
   ```
   https://github.com/JackLFH/88code-smart-reset/releases
   ```

2. **下载最新版本**：
   - 找到 `v1.2.0` 或最新版本
   - 点击 `extension-v1.2.0.zip` 或类似文件名
   - 下载 zip 文件

3. **解压并安装**：
   ```
   1. 下载后解压 zip 文件
   2. 得到文件夹（包含 manifest.json）
   3. 打开 Chrome，地址栏输入：chrome://extensions/
   4. 右上角打开"开发者模式"
   5. 点击"加载已解压的扩展程序"
   6. 选择解压后的文件夹
   7. 完成！
   ```

### 方法二：从源码构建（开发者）

```bash
# 1. 下载源码
git clone https://github.com/JackLFH/88code-smart-reset.git
cd 88code-smart-reset

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 加载到Chrome
# 选择 dist/ 文件夹
```

---

## ❌ 常见的错误

### 错误1：直接下载源码 zip
**问题**：GitHub 仓库的 "Code" → "Download ZIP" 按钮下载的是源码，不是���建好的版本

**解决**：必须去 Releases 页面下载

### 错误2：文件夹选择错误
**问题**：选择了错误文件夹

**解决**：选择包含 `manifest.json` 的根文件夹

### 错误3：Chrome版本过低
**问题**：Chrome 版本 < 120

**解决**：更新到最新版 Chrome

---

## 🔍 如何确认安装正确

正确的安装后，文件夹结构应该是：
```
your-extension-folder/
├── manifest.json
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── popup/
│   └── popup.html
├── options/
│   └── options.html
├── background/
│   └── service-worker.js
└── assets/
    └── options-*.css
```

**关键文件**：必须要有 `manifest.json`！

---

## 🎯 快速检查清单

- [ ] 从 Releases 页面下载
- [ ] 不是从 "Download ZIP" 下载
- [ ] 解压后有 manifest.json 文件
- [ ] Chrome 版本 ≥ 120
- [ ] 开发者模式已开启
- [ ] 选择的是包含 manifest.json 的文件夹

---

## 💡 仍有问题？

如果还有安装问题，请：

1. **检查错误信息**：Chrome 会显示具体的错误提示
2. **确认文件结构**：确保解压后文件夹结构正确
3. **查看开发者控制��**：F12 → Console 查看错误详情
4. **提交 Issue**：到 GitHub 报告具体问题

---

## 📞 获取帮助

- GitHub Issues: [提交问题](https://github.com/JackLFH/88code-smart-reset/issues)
- Email: 1816524875@qq.com
- QQ群：[待补充]

---

**最后更新**：2025年1月1日
# Node.js 安装指南

## 快速安装步骤

### 1. 下载 Node.js

**直接下载链接**（Node.js 16.20.2 LTS）：
https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi

或访问官网：https://nodejs.org/

### 2. 安装

1. 双击下载的 `node-v16.20.2-x64.msi`
2. 点击 "Next"
3. 勾选 "I accept the terms"，点击 "Next"
4. 选择安装路径（推荐默认：`C:\Program Files\nodejs\`）
5. **重要**：确保勾选 "Add to PATH"
6. 点击 "Next" -> "Install"
7. 等待安装完成（1-2 分钟）
8. 点击 "Finish"

### 3. 验证安装

**打开新的 PowerShell 窗口**（必须是新窗口）：

```powershell
node --version
npm --version
```

应该显示：
```
v16.20.2
8.19.4
```

### 4. 配置 npm 镜像（可选）

```powershell
npm config set registry https://registry.npmmirror.com
```

### 5. 重启 HBuilderX

关闭并重新打开 HBuilderX

### 6. 再次尝试构建

在 HBuilderX 中：
- 发行 -> 网站-H5手机版

---

## 如果自动下载失败

请手动访问以下地址下载：

**Node.js 16.20.2**：
https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi

**或最新 LTS 版本**：
https://nodejs.org/zh-cn/download/

---

## 安装后检查

```powershell
# 检查 Node.js
node --version

# 检查 npm
npm --version

# 检查安装路径
where.exe node
```

---

## 常见问题

### Q: 命令提示 "node 不是内部或外部命令"

**解决**：
1. 重新打开终端窗口
2. 或手动添加到 PATH：
   - 右键"此电脑" -> 属性 -> 高级系统设置
   - 环境变量 -> 系统变量 -> Path
   - 添加：`C:\Program Files\nodejs\`

### Q: HBuilderX 还是提示找不到 Node.js

**解决**：
1. 重启 HBuilderX
2. 或在 HBuilderX 中手动配置：
   - 工具 -> 设置 -> 运行配置
   - Node路径：`C:\Program Files\nodejs\node.exe`


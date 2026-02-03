# Git 配置指南 - 关联 GitHub 仓库

## ✅ 已完成的步骤

1. ✅ Git 已添加到系统 PATH 环境变量
2. ✅ 项目已初始化 Git 仓库
3. ✅ 已创建 `.gitignore` 文件

## 📋 接下来的步骤

### 方法一：使用配置脚本（推荐）

运行配置脚本，按提示输入信息：

```powershell
.\setup-git-remote.ps1
```

脚本会引导您：
1. 配置 Git 用户信息（用户名和邮箱）
2. 添加 GitHub 远程仓库地址

### 方法二：手动配置

#### 步骤 1: 配置 Git 用户信息

```powershell
# 设置用户名
git config user.name "您的用户名"

# 设置邮箱
git config user.email "your.email@example.com"
```

#### 步骤 2: 添加 GitHub 远程仓库

```powershell
# 添加远程仓库（将 YOUR_USERNAME 和 YOUR_REPO 替换为实际值）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 或者使用 SSH（如果您已配置 SSH 密钥）
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

#### 步骤 3: 验证远程仓库配置

```powershell
# 查看远程仓库
git remote -v
```

### 步骤 4: 首次提交和推送

```powershell
# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "Initial commit"

# 如果 GitHub 仓库使用 main 分支，重命名当前分支
git branch -M main

# 推送到 GitHub（首次推送）
git push -u origin main

# 如果 GitHub 仓库使用 master 分支
git push -u origin master
```

## 🔧 配置 Cursor 识别 Git

如果 Cursor 仍然显示"下载适用于 Windows 的 Git"，请按以下步骤操作：

### 方法 1: 重启 Cursor（最简单）

1. **完全关闭 Cursor**（不是最小化）
2. **重新启动 Cursor**

这样 Cursor 会重新加载环境变量，识别到 Git。

### 方法 2: 手动配置 Cursor 的 Git 路径

1. 打开 Cursor 设置：
   - 按 `Ctrl + ,` 或
   - 点击菜单：`文件` → `首选项` → `设置`

2. 搜索 "git.path"

3. 在设置中输入 Git 的完整路径：
   ```
   E:\Git\bin\git.exe
   ```

4. 保存设置并重新加载窗口（`Ctrl + Shift + P` → 输入 "Reload Window"）

## 📝 常用 Git 命令

```powershell
# 查看状态
git status

# 查看远程仓库
git remote -v

# 拉取最新代码
git pull origin main

# 推送代码
git push origin main

# 查看提交历史
git log

# 查看分支
git branch -a
```

## ⚠️ 注意事项

1. **GitHub 仓库地址格式**：
   - HTTPS: `https://github.com/username/repository.git`
   - SSH: `git@github.com:username/repository.git`

2. **首次推送**：
   - 如果 GitHub 仓库是新建的且为空，直接推送即可
   - 如果 GitHub 仓库已有内容，可能需要先拉取：`git pull origin main --allow-unrelated-histories`

3. **认证**：
   - HTTPS: 需要输入 GitHub 用户名和 Personal Access Token（不是密码）
   - SSH: 需要配置 SSH 密钥

4. **分支名称**：
   - 新仓库通常使用 `main` 分支
   - 旧仓库可能使用 `master` 分支
   - 使用 `git branch -M main` 可以重命名当前分支

## 🆘 故障排除

### 问题：Cursor 仍然显示"下载 Git"

**解决方案**：
1. 完全关闭并重启 Cursor
2. 在 Cursor 设置中手动配置 Git 路径：`E:\Git\bin\git.exe`
3. 在终端中运行 `git --version` 验证 Git 是否可用

### 问题：推送时提示认证失败

**解决方案**：
- HTTPS: 使用 Personal Access Token 而不是密码
  - 生成 Token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- SSH: 配置 SSH 密钥
  ```powershell
  # 生成 SSH 密钥
  ssh-keygen -t ed25519 -C "your.email@example.com"
  
  # 复制公钥内容
  cat ~/.ssh/id_ed25519.pub
  
  # 添加到 GitHub: Settings → SSH and GPG keys → New SSH key
  ```

### 问题：推送时提示分支不匹配

**解决方案**：
```powershell
# 查看当前分支
git branch

# 重命名分支为 main（如果需要）
git branch -M main

# 或者重命名为 master（如果需要）
git branch -M master
```



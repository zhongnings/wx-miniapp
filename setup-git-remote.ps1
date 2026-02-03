# Git 配置脚本 - 关联 GitHub 仓库
# 使用方法：.\setup-git-remote.ps1

# 确保 Git 在 PATH 中
$env:Path = $env:Path + ";E:\Git\bin"

Write-Host "=== Git 仓库配置向导 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 配置 Git 用户信息
Write-Host "步骤 1: 配置 Git 用户信息" -ForegroundColor Yellow
$userName = Read-Host "请输入您的 Git 用户名（例如：YourName）"
$userEmail = Read-Host "请输入您的 Git 邮箱（例如：your.email@example.com）"

if ($userName -and $userEmail) {
    git config user.name $userName
    git config user.email $userEmail
    Write-Host "✓ Git 用户信息配置成功" -ForegroundColor Green
} else {
    Write-Host "⚠ 跳过用户信息配置" -ForegroundColor Yellow
}

Write-Host ""

# 2. 配置远程仓库
Write-Host "步骤 2: 配置 GitHub 远程仓库" -ForegroundColor Yellow
Write-Host "请输入您的 GitHub 仓库地址（支持 HTTPS 或 SSH）：" -ForegroundColor White
Write-Host "  示例 HTTPS: https://github.com/username/repository.git" -ForegroundColor Gray
Write-Host "  示例 SSH:   git@github.com:username/repository.git" -ForegroundColor Gray
$remoteUrl = Read-Host "GitHub 仓库地址"

if ($remoteUrl) {
    # 检查是否已有 origin 远程仓库
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "检测到已存在的远程仓库: $existingRemote" -ForegroundColor Yellow
        $replace = Read-Host "是否替换为新的地址？(Y/N)"
        if ($replace -eq "Y" -or $replace -eq "y") {
            git remote set-url origin $remoteUrl
            Write-Host "✓ 远程仓库地址已更新" -ForegroundColor Green
        } else {
            Write-Host "保持原有远程仓库地址" -ForegroundColor Yellow
        }
    } else {
        git remote add origin $remoteUrl
        Write-Host "✓ 远程仓库添加成功" -ForegroundColor Green
    }
    
    # 显示远程仓库信息
    Write-Host ""
    Write-Host "当前远程仓库配置：" -ForegroundColor Cyan
    git remote -v
} else {
    Write-Host "⚠ 跳过远程仓库配置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 配置完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作建议：" -ForegroundColor Yellow
Write-Host "1. 添加文件到暂存区: git add ." -ForegroundColor White
Write-Host "2. 提交更改: git commit -m 'Initial commit'" -ForegroundColor White
Write-Host "3. 推送到 GitHub: git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "注意：如果您的 GitHub 仓库使用 main 分支，可能需要先执行：" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor White


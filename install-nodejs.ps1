# Node.js 安装脚本
# 自动下载并提示安装 Node.js

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Node.js 安装助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已安装
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✓ Node.js 已安装：$nodeVersion" -ForegroundColor Green
        $npmVersion = npm --version 2>$null
        Write-Host "✓ npm 版本：$npmVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Yellow
}

if ($nodeInstalled) {
    Write-Host ""
    Write-Host "Node.js 已经安装，无需重复安装。" -ForegroundColor Green
    Write-Host ""
    Write-Host "如果 HBuilderX 仍然提示找不到 Node.js，请：" -ForegroundColor Yellow
    Write-Host "1. 重启 HBuilderX" -ForegroundColor Cyan
    Write-Host "2. 或在 HBuilderX 中手动配置 Node.js 路径" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host "准备下载 Node.js 16.20.2 LTS..." -ForegroundColor Yellow
Write-Host ""

# 下载地址
$nodeUrl = "https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi"
$downloadPath = "$env:TEMP\node-v16.20.2-x64.msi"

Write-Host "下载地址：$nodeUrl" -ForegroundColor Cyan
Write-Host "保存位置：$downloadPath" -ForegroundColor Cyan
Write-Host ""

# 下载文件
Write-Host "正在下载 Node.js 安装包..." -ForegroundColor Yellow
try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $nodeUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✓ 下载完成！" -ForegroundColor Green
} catch {
    Write-Host "✗ 下载失败：$_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动下载并安装：" -ForegroundColor Yellow
    Write-Host "  下载地址：https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi" -ForegroundColor Cyan
    Write-Host "  或访问：https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  准备安装 Node.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "安装提示：" -ForegroundColor Yellow
Write-Host "1. 保持默认安装选项" -ForegroundColor Cyan
Write-Host "2. 确保勾选 'Add to PATH'" -ForegroundColor Cyan
Write-Host "3. 安装完成后重启终端" -ForegroundColor Cyan
Write-Host ""

# 启动安装程序
Write-Host "正在启动安装程序..." -ForegroundColor Yellow
Start-Process -FilePath $downloadPath -Wait

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 关闭当前终端窗口" -ForegroundColor Cyan
Write-Host "2. 打开新的 PowerShell 窗口" -ForegroundColor Cyan
Write-Host "3. 运行命令验证：node --version" -ForegroundColor Cyan
Write-Host "4. 重启 HBuilderX" -ForegroundColor Cyan
Write-Host ""


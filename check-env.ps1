# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================"
Write-Host "  Java 和 Maven 环境检查"
Write-Host "========================================"

# 检查 Java
Write-Host ""
Write-Host "[1/4] 检查 Java..." -ForegroundColor Yellow
$javaInstalled = $false
try {
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $javaVersion = java -version 2>&1 | Out-String
        Write-Host $javaVersion
        Write-Host "[OK] Java 已安装" -ForegroundColor Green
        $javaInstalled = $true
    }
} catch {
    Write-Host "[错误] Java 未安装或未配置到 PATH" -ForegroundColor Red
}

# 检查 Maven
Write-Host ""
Write-Host "[2/4] 检查 Maven..." -ForegroundColor Yellow
$mavenInstalled = $false
try {
    $mvnCmd = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvnCmd) {
        $mavenVersion = mvn -version 2>&1 | Out-String
        Write-Host $mavenVersion
        Write-Host "[OK] Maven 已安装" -ForegroundColor Green
        $mavenInstalled = $true
    }
} catch {
    Write-Host "[错误] Maven 未安装或未配置到 PATH" -ForegroundColor Red
}

# 检查环境变量
Write-Host ""
Write-Host "[3/4] 检查环境变量..." -ForegroundColor Yellow

$javaHome = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
if ($javaHome) {
    Write-Host "JAVA_HOME = $javaHome"
    if (Test-Path $javaHome) {
        Write-Host "[OK] JAVA_HOME 已设置且路径存在" -ForegroundColor Green
    } else {
        Write-Host "[错误] JAVA_HOME 路径不存在" -ForegroundColor Red
    }
} else {
    Write-Host "[错误] JAVA_HOME 未设置" -ForegroundColor Red
}

$mavenHome = [System.Environment]::GetEnvironmentVariable("MAVEN_HOME", "Machine")
if ($mavenHome) {
    Write-Host "MAVEN_HOME = $mavenHome"
    if (Test-Path $mavenHome) {
        Write-Host "[OK] MAVEN_HOME 已设置且路径存在" -ForegroundColor Green
    } else {
        Write-Host "[错误] MAVEN_HOME 路径不存在" -ForegroundColor Red
    }
} else {
    Write-Host "[警告] MAVEN_HOME 未设置 (可选)" -ForegroundColor Yellow
}

# 检查 PATH
Write-Host ""
Write-Host "[4/4] 检查 PATH 配置..." -ForegroundColor Yellow
$path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

if ($javaHome -and $path -like "*$javaHome\bin*") {
    Write-Host "[OK] Java bin 目录在 PATH 中" -ForegroundColor Green
} elseif ($javaInstalled) {
    Write-Host "[OK] Java 可执行 (通过其他路径)" -ForegroundColor Green
} else {
    Write-Host "[错误] Java bin 目录不在 PATH 中" -ForegroundColor Red
}

if ($mavenHome -and $path -like "*$mavenHome\bin*") {
    Write-Host "[OK] Maven bin 目录在 PATH 中" -ForegroundColor Green
} elseif ($mavenInstalled) {
    Write-Host "[OK] Maven 可执行 (通过其他路径)" -ForegroundColor Green
} else {
    Write-Host "[错误] Maven bin 目录不在 PATH 中" -ForegroundColor Red
}

# 总结
Write-Host ""
Write-Host "========================================"
Write-Host "  检查完成"
Write-Host "========================================"

if (-not $javaInstalled -or -not $mavenInstalled) {
    Write-Host ""
    Write-Host "下一步操作:" -ForegroundColor Yellow
    Write-Host "1. 运行安装脚本: .\install-java-maven.ps1" -ForegroundColor White
    Write-Host "2. 或查看详细文档: JAVA_MAVEN_SETUP.md" -ForegroundColor White
    Write-Host "3. 安装后重启 PowerShell 或 IDE" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[成功] 环境配置正确!" -ForegroundColor Green
    Write-Host "可以开始构建项目: mvn clean compile" -ForegroundColor Cyan
}














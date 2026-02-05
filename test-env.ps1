# 环境检查脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Java & Maven 环境检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查 Java
Write-Host "`n[1/4] 检查 Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host $javaVersion -ForegroundColor White
    Write-Host "✓ Java 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Java 未安装或未配置到 PATH" -ForegroundColor Red
    Write-Host "  错误: $_" -ForegroundColor Red
}

# 检查 Maven
Write-Host "`n[2/4] 检查 Maven..." -ForegroundColor Yellow
try {
    $mavenVersion = mvn -version 2>&1
    Write-Host $mavenVersion -ForegroundColor White
    Write-Host "✓ Maven 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Maven 未安装或未配置到 PATH" -ForegroundColor Red
    Write-Host "  错误: $_" -ForegroundColor Red
}

# 检查环境变量
Write-Host "`n[3/4] 检查环境变量..." -ForegroundColor Yellow

$javaHome = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
if ($javaHome) {
    Write-Host "JAVA_HOME = $javaHome" -ForegroundColor White
    if (Test-Path $javaHome) {
        Write-Host "✓ JAVA_HOME 已设置且路径存在" -ForegroundColor Green
    } else {
        Write-Host "✗ JAVA_HOME 路径不存在" -ForegroundColor Red
    }
} else {
    Write-Host "✗ JAVA_HOME 未设置" -ForegroundColor Red
}

$mavenHome = [System.Environment]::GetEnvironmentVariable("MAVEN_HOME", "Machine")
if ($mavenHome) {
    Write-Host "MAVEN_HOME = $mavenHome" -ForegroundColor White
    if (Test-Path $mavenHome) {
        Write-Host "✓ MAVEN_HOME 已设置且路径存在" -ForegroundColor Green
    } else {
        Write-Host "✗ MAVEN_HOME 路径不存在" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ MAVEN_HOME 未设置（可选）" -ForegroundColor Yellow
}

# 检查 PATH
Write-Host "`n[4/4] 检查 PATH 配置..." -ForegroundColor Yellow
$path = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

if ($javaHome -and $path -like "*$javaHome\bin*") {
    Write-Host "✓ Java bin 目录在 PATH 中" -ForegroundColor Green
} else {
    Write-Host "✗ Java bin 目录不在 PATH 中" -ForegroundColor Red
}

if ($mavenHome -and $path -like "*$mavenHome\bin*") {
    Write-Host "✓ Maven bin 目录在 PATH 中" -ForegroundColor Green
} elseif ($path -like "*maven*bin*") {
    Write-Host "✓ Maven bin 目录在 PATH 中（通过其他路径）" -ForegroundColor Green
} else {
    Write-Host "✗ Maven bin 目录不在 PATH 中" -ForegroundColor Red
}

# 总结
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  检查完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n如果看到错误，请执行以下操作：" -ForegroundColor Yellow
Write-Host "1. 运行安装脚本: .\install-java-maven.ps1" -ForegroundColor White
Write-Host "2. 或查看详细文档: JAVA_MAVEN_SETUP.md" -ForegroundColor White
Write-Host "3. 安装后重启 PowerShell 或 IDE" -ForegroundColor White





















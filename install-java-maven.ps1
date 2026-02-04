# Java 和 Maven 自动安装脚本
# 适用于 Windows 系统

param(
    [string]$InstallPath = "C:\DevTools",
    [switch]$UseChocolatey = $false
)

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 下载文件
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    Write-ColorOutput "正在下载: $Url" "Yellow"
    
    try {
        # 使用 .NET WebClient 下载
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($Url, $OutputPath)
        Write-ColorOutput "✓ 下载完成: $OutputPath" "Green"
        return $true
    } catch {
        Write-ColorOutput "✗ 下载失败: $_" "Red"
        return $false
    }
}

# 解压 ZIP 文件
function Extract-ZipFile {
    param(
        [string]$ZipPath,
        [string]$DestinationPath
    )
    
    Write-ColorOutput "正在解压: $ZipPath" "Yellow"
    
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $DestinationPath)
        Write-ColorOutput "✓ 解压完成" "Green"
        return $true
    } catch {
        Write-ColorOutput "✗ 解压失败: $_" "Red"
        return $false
    }
}

# 设置环境变量
function Set-EnvironmentVariable {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Target = "Machine"
    )
    
    Write-ColorOutput "设置环境变量: $Name = $Value" "Yellow"
    
    try {
        [System.Environment]::SetEnvironmentVariable($Name, $Value, $Target)
        Write-ColorOutput "✓ 环境变量设置成功" "Green"
        return $true
    } catch {
        Write-ColorOutput "✗ 环境变量设置失败: $_" "Red"
        return $false
    }
}

# 添加到 PATH
function Add-ToPath {
    param(
        [string]$PathToAdd,
        [string]$Target = "Machine"
    )
    
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", $Target)
    
    if ($currentPath -notlike "*$PathToAdd*") {
        Write-ColorOutput "添加到 PATH: $PathToAdd" "Yellow"
        $newPath = "$currentPath;$PathToAdd"
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, $Target)
        Write-ColorOutput "✓ PATH 更新成功" "Green"
    } else {
        Write-ColorOutput "PATH 中已存在: $PathToAdd" "Cyan"
    }
}

# 使用 Chocolatey 安装
function Install-WithChocolatey {
    Write-ColorOutput "`n=== 使用 Chocolatey 安装 ===" "Magenta"
    
    # 检查 Chocolatey 是否已安装
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    
    if (-not $chocoInstalled) {
        Write-ColorOutput "Chocolatey 未安装，正在安装..." "Yellow"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    Write-ColorOutput "安装 OpenJDK 8..." "Yellow"
    choco install openjdk8 -y
    
    Write-ColorOutput "安装 Maven..." "Yellow"
    choco install maven -y
    
    Write-ColorOutput "✓ Chocolatey 安装完成" "Green"
}

# 手动安装 Java
function Install-Java {
    Write-ColorOutput "`n=== 安装 Java JDK 8 ===" "Magenta"
    
    $javaDir = Join-Path $InstallPath "Java"
    $jdkDir = Join-Path $javaDir "jdk8"
    
    # 创建目录
    if (-not (Test-Path $javaDir)) {
        New-Item -ItemType Directory -Path $javaDir -Force | Out-Null
    }
    
    # 下载 OpenJDK 8 (Adoptium)
    $jdkUrl = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u402-b06/OpenJDK8U-jdk_x64_windows_hotspot_8u402b06.zip"
    $jdkZip = Join-Path $javaDir "openjdk8.zip"
    
    Write-ColorOutput "下载 OpenJDK 8..." "Yellow"
    Write-ColorOutput "如果下载失败，请手动下载并解压到: $jdkDir" "Cyan"
    
    if (Download-File -Url $jdkUrl -OutputPath $jdkZip) {
        if (Extract-ZipFile -ZipPath $jdkZip -DestinationPath $javaDir) {
            # 查找解压后的 JDK 目录
            $extractedDir = Get-ChildItem -Path $javaDir -Directory | Where-Object { $_.Name -like "jdk*" } | Select-Object -First 1
            
            if ($extractedDir) {
                # 重命名为 jdk8
                if (Test-Path $jdkDir) {
                    Remove-Item $jdkDir -Recurse -Force
                }
                Move-Item $extractedDir.FullName $jdkDir
                
                # 删除 ZIP 文件
                Remove-Item $jdkZip -Force
                
                Write-ColorOutput "✓ Java JDK 8 安装完成: $jdkDir" "Green"
                return $jdkDir
            }
        }
    }
    
    Write-ColorOutput "自动安装失败，请手动安装 Java JDK 8" "Red"
    Write-ColorOutput "下载地址: https://adoptium.net/temurin/releases/?version=8" "Cyan"
    return $null
}

# 手动安装 Maven
function Install-Maven {
    Write-ColorOutput "`n=== 安装 Apache Maven ===" "Magenta"
    
    $mavenDir = Join-Path $InstallPath "Maven"
    $mavenHome = Join-Path $mavenDir "apache-maven-3.9.6"
    
    # 创建目录
    if (-not (Test-Path $mavenDir)) {
        New-Item -ItemType Directory -Path $mavenDir -Force | Out-Null
    }
    
    # 下载 Maven
    $mavenUrl = "https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    $mavenZip = Join-Path $mavenDir "maven.zip"
    
    Write-ColorOutput "下载 Apache Maven 3.9.6..." "Yellow"
    
    if (Download-File -Url $mavenUrl -OutputPath $mavenZip) {
        if (Extract-ZipFile -ZipPath $mavenZip -DestinationPath $mavenDir) {
            # 删除 ZIP 文件
            Remove-Item $mavenZip -Force
            
            Write-ColorOutput "✓ Maven 安装完成: $mavenHome" "Green"
            return $mavenHome
        }
    }
    
    Write-ColorOutput "自动安装失败，请手动安装 Maven" "Red"
    Write-ColorOutput "下载地址: https://maven.apache.org/download.cgi" "Cyan"
    return $null
}

# 配置 Maven 镜像
function Configure-MavenMirror {
    param(
        [string]$MavenHome
    )
    
    Write-ColorOutput "`n=== 配置 Maven 阿里云镜像 ===" "Magenta"
    
    $settingsFile = Join-Path $MavenHome "conf\settings.xml"
    
    if (Test-Path $settingsFile) {
        # 备份原文件
        $backupFile = "$settingsFile.backup"
        Copy-Item $settingsFile $backupFile -Force
        
        # 读取文件内容
        $content = Get-Content $settingsFile -Raw
        
        # 检查是否已配置镜像
        if ($content -notlike "*aliyun*") {
            # 在 </mirrors> 前添加阿里云镜像
            $mirrorConfig = @"
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <name>Aliyun Maven Mirror</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
"@
            
            $content = $content -replace "</mirrors>", "$mirrorConfig`n  </mirrors>"
            
            # 写回文件
            Set-Content -Path $settingsFile -Value $content -Encoding UTF8
            
            Write-ColorOutput "✓ Maven 镜像配置完成" "Green"
        } else {
            Write-ColorOutput "Maven 镜像已配置" "Cyan"
        }
    } else {
        Write-ColorOutput "✗ 未找到 settings.xml 文件" "Red"
    }
}

# 验证安装
function Test-Installation {
    Write-ColorOutput "`n=== 验证安装 ===" "Magenta"
    
    # 刷新环境变量
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:JAVA_HOME = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
    $env:MAVEN_HOME = [System.Environment]::GetEnvironmentVariable("MAVEN_HOME", "Machine")
    
    Write-ColorOutput "`n检查 Java..." "Yellow"
    try {
        $javaVersion = & java -version 2>&1
        Write-ColorOutput $javaVersion "Cyan"
        Write-ColorOutput "✓ Java 验证成功" "Green"
    } catch {
        Write-ColorOutput "✗ Java 验证失败: $_" "Red"
        Write-ColorOutput "请重启 PowerShell 或计算机后再试" "Yellow"
    }
    
    Write-ColorOutput "`n检查 Maven..." "Yellow"
    try {
        $mavenVersion = & mvn -version 2>&1
        Write-ColorOutput $mavenVersion "Cyan"
        Write-ColorOutput "✓ Maven 验证成功" "Green"
    } catch {
        Write-ColorOutput "✗ Maven 验证失败: $_" "Red"
        Write-ColorOutput "请重启 PowerShell 或计算机后再试" "Yellow"
    }
}

# 主函数
function Main {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "  Java & Maven 自动安装脚本" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    
    # 检查管理员权限
    if (-not (Test-Administrator)) {
        Write-ColorOutput "`n警告: 建议以管理员身份运行此脚本" "Yellow"
        Write-ColorOutput "某些操作可能需要管理员权限" "Yellow"
        
        $continue = Read-Host "`n是否继续? (Y/N)"
        if ($continue -ne "Y" -and $continue -ne "y") {
            Write-ColorOutput "安装已取消" "Red"
            return
        }
    }
    
    # 选择安装方式
    if ($UseChocolatey) {
        Install-WithChocolatey
    } else {
        Write-ColorOutput "`n安装路径: $InstallPath" "Cyan"
        
        # 安装 Java
        $jdkPath = Install-Java
        
        if ($jdkPath) {
            # 设置 JAVA_HOME
            Set-EnvironmentVariable -Name "JAVA_HOME" -Value $jdkPath
            Add-ToPath -PathToAdd "$jdkPath\bin"
        }
        
        # 安装 Maven
        $mavenPath = Install-Maven
        
        if ($mavenPath) {
            # 设置 MAVEN_HOME
            Set-EnvironmentVariable -Name "MAVEN_HOME" -Value $mavenPath
            Add-ToPath -PathToAdd "$mavenPath\bin"
            
            # 配置镜像
            Configure-MavenMirror -MavenHome $mavenPath
        }
    }
    
    # 验证安装
    Test-Installation
    
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput "  安装完成！" "Green"
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "`n重要提示:" "Yellow"
    Write-ColorOutput "1. 请重启 PowerShell 或 IDE 以使环境变量生效" "Yellow"
    Write-ColorOutput "2. 重启后运行: java -version 和 mvn -version 验证" "Yellow"
    Write-ColorOutput "3. 进入项目目录运行: mvn clean compile" "Yellow"
    Write-ColorOutput "`n详细文档请查看: JAVA_MAVEN_SETUP.md" "Cyan"
}

# 运行主函数
Main




















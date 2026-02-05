# Java 和 Maven 环境配置指南

## 当前项目要求
- **Java版本**: JDK 8 (1.8)
- **Maven版本**: 3.6+ 推荐
- **项目类型**: Spring Boot 2.7.18

## 一、自动安装（推荐）

我们提供了自动安装脚本，可以一键安装Java和Maven。

### 运行安装脚本

```powershell
# 在项目根目录执行
.\install-java-maven.ps1
```

安装脚本会自动：
1. 下载 OpenJDK 8
2. 下载 Apache Maven 3.9.6
3. 解压到 `C:\DevTools` 目录
4. 配置环境变量
5. 验证安装

## 二、手动安装

如果自动安装失败，可以按照以下步骤手动安装。

### 步骤1: 安装 Java JDK 8

#### 方法A: 使用 Chocolatey（推荐）

```powershell
# 以管理员身份运行 PowerShell

# 如果没有安装 Chocolatey，先安装它
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 OpenJDK 8
choco install openjdk8 -y
```

#### 方法B: 手动下载安装

1. 访问以下任一网站下载 JDK 8：
   - **Adoptium (推荐)**: https://adoptium.net/temurin/releases/?version=8
   - **Oracle JDK**: https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html
   - **Amazon Corretto**: https://aws.amazon.com/corretto/

2. 选择 Windows x64 版本的 `.msi` 或 `.zip` 文件

3. 安装到默认位置（例如：`C:\Program Files\Java\jdk1.8.0_xxx`）

4. 配置环境变量：
   - 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
   - 新建系统变量 `JAVA_HOME`，值为JDK安装路径
   - 编辑 `Path` 变量，添加 `%JAVA_HOME%\bin`

### 步骤2: 安装 Maven

#### 方法A: 使用 Chocolatey（推荐）

```powershell
# 以管理员身份运行 PowerShell
choco install maven -y
```

#### 方法B: 手动下载安装

1. 访问 Maven 官网：https://maven.apache.org/download.cgi

2. 下载 `apache-maven-3.9.6-bin.zip`（或最新版本）

3. 解压到目录（例如：`C:\Program Files\Apache\maven`）

4. 配置环境变量：
   - 新建系统变量 `MAVEN_HOME`，值为Maven解压路径
   - 编辑 `Path` 变量，添加 `%MAVEN_HOME%\bin`

### 步骤3: 配置 Maven 镜像（可选但推荐）

为了加快依赖下载速度，配置阿里云镜像：

1. 找到 Maven 配置文件：`%MAVEN_HOME%\conf\settings.xml`

2. 在 `<mirrors>` 标签内添加：

```xml
<mirror>
  <id>aliyun</id>
  <mirrorOf>central</mirrorOf>
  <name>Aliyun Maven Mirror</name>
  <url>https://maven.aliyun.com/repository/public</url>
</mirror>
```

### 步骤4: 验证安装

打开新的 PowerShell 窗口，执行：

```powershell
# 检查 Java 版本
java -version

# 检查 Maven 版本
mvn -version
```

预期输出：
```
java version "1.8.0_xxx"
...

Apache Maven 3.9.6
Maven home: C:\Program Files\Apache\maven
Java version: 1.8.0_xxx
```

## 三、构建项目

环境配置完成后，可以构建项目：

```powershell
# 进入项目目录
cd E:\workspace\miniapp

# 清理并编译
mvn clean compile

# 打包（跳过测试）
mvn clean package -DskipTests

# 运行项目
mvn spring-boot:run
```

## 四、常见问题

### 问题1: 命令未找到

**症状**: 执行 `java` 或 `mvn` 提示命令未找到

**解决方案**:
1. 确认环境变量配置正确
2. **重启 PowerShell 或 IDE**（环境变量需要重新加载）
3. 使用完整路径测试：`C:\Program Files\Java\jdk1.8.0_xxx\bin\java.exe -version`

### 问题2: JAVA_HOME 未设置

**症状**: Maven 提示 `JAVA_HOME is not set`

**解决方案**:
```powershell
# 临时设置（当前会话）
$env:JAVA_HOME = "C:\Program Files\Java\jdk1.8.0_xxx"

# 永久设置（需要管理员权限）
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk1.8.0_xxx", "Machine")
```

### 问题3: Maven 依赖下载慢

**解决方案**:
1. 配置阿里云镜像（见上文）
2. 或使用代理：
```powershell
mvn clean package -DskipTests -Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=7890
```

### 问题4: 编码问题

**症状**: 编译时出现中文乱码

**解决方案**:
```powershell
# 设置控制台编码为 UTF-8
chcp 65001

# 或在 Maven 命令中指定
mvn clean package -Dfile.encoding=UTF-8
```

## 五、IDE 配置

### IntelliJ IDEA

1. File → Project Structure → Project
   - Project SDK: 选择 JDK 1.8
   - Project language level: 8

2. File → Settings → Build, Execution, Deployment → Build Tools → Maven
   - Maven home directory: 选择 Maven 安装目录
   - User settings file: 选择 settings.xml

### VS Code

安装扩展：
- Extension Pack for Java
- Maven for Java

配置 settings.json：
```json
{
  "java.home": "C:\\Program Files\\Java\\jdk1.8.0_xxx",
  "maven.executable.path": "C:\\Program Files\\Apache\\maven\\bin\\mvn.cmd"
}
```

## 六、快速验证脚本

创建一个测试文件 `test-env.ps1`：

```powershell
Write-Host "=== 环境检查 ===" -ForegroundColor Green

# 检查 Java
Write-Host "`n检查 Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host $javaVersion -ForegroundColor Cyan
    Write-Host "✓ Java 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Java 未安装或未配置到 PATH" -ForegroundColor Red
}

# 检查 Maven
Write-Host "`n检查 Maven..." -ForegroundColor Yellow
try {
    $mavenVersion = mvn -version
    Write-Host $mavenVersion -ForegroundColor Cyan
    Write-Host "✓ Maven 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ Maven 未安装或未配置到 PATH" -ForegroundColor Red
}

# 检查环境变量
Write-Host "`n检查环境变量..." -ForegroundColor Yellow
$javaHome = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
if ($javaHome) {
    Write-Host "JAVA_HOME = $javaHome" -ForegroundColor Cyan
    Write-Host "✓ JAVA_HOME 已设置" -ForegroundColor Green
} else {
    Write-Host "✗ JAVA_HOME 未设置" -ForegroundColor Red
}

Write-Host "`n=== 检查完成 ===" -ForegroundColor Green
```

运行：
```powershell
.\test-env.ps1
```

## 七、下一步

环境配置完成后，您可以：

1. **编译项目**: `mvn clean compile`
2. **运行测试**: `mvn test`
3. **打包应用**: `mvn clean package`
4. **启动应用**: `mvn spring-boot:run`
5. **生成开发环境包**: `mvn clean package -Pdev`
6. **生成生产环境包**: `mvn clean package -Pprod`

## 联系支持

如果遇到问题，请提供以下信息：
- 操作系统版本
- Java 版本输出
- Maven 版本输出
- 完整的错误信息





















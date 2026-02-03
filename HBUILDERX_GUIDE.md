# HBuilderX 前端打包完整指南

## 📥 第一步：下载并安装 HBuilderX

### 下载地址
https://www.dcloud.io/hbuilderx.html

### 选择版本
- **推荐**：HBuilderX 标准版（免费）
- 大小：约 300MB
- 支持：Windows / macOS / Linux

### 安装步骤
1. 下载 zip 压缩包
2. 解压到任意目录（如：`D:\HBuilderX`）
3. 双击 `HBuilderX.exe` 启动（无需安装）

---

## 📂 第二步：在 HBuilderX 中打开项目

### 操作步骤
1. 启动 HBuilderX
2. 点击菜单：**文件** -> **打开目录**
3. 选择：`d:\workcode\miniapp\uniapp-h5`
4. 点击"选择文件夹"

### 预期结果
左侧项目树会显示：
```
uniapp-h5
├── pages/
├── components/
├── static/
├── utils/
├── App.vue
├── main.js
├── pages.json
├── manifest.json
└── package.json
```

---

## 🔧 第三步：配置项目（可选）

### 检查 manifest.json
1. 双击打开 `manifest.json`
2. 点击"源码视图"
3. 确认 H5 配置存在：

```json
"h5": {
  "title": "益信通",
  "template": "index.html",
  "router": {
    "mode": "hash",
    "base": "/"
  }
}
```

### 如果需要修改
- **标题**：修改 `"title": "益信通"`
- **路由模式**：`hash` 或 `history`（推荐 hash）
- **基础路径**：`"base": "/"`

---

## 🚀 第四步：构建 H5 版本

### 操作步骤
1. 在 HBuilderX 中，确保 `uniapp-h5` 项目已打开
2. 点击菜单：**发行** -> **网站-H5手机版**
3. 在弹出的对话框中：
   - **网站标题**：益信通贷款管理系统
   - **网站域名**：http://localhost:8081（或留空）
   - 点击"发行"按钮

### 构建过程
```
正在编译...
├── 编译 pages.json
├── 编译 App.vue
├── 编译 pages/login/index.vue
├── 编译 pages/home/index.vue
├── 编译 pages/order/...
└── 生成 index.html
```

### 预期时间
- 首次构建：1-3 分钟
- 后续构建：30 秒 - 1 分钟

### 构建完成标志
控制台显示：
```
Build complete. The dist directory is ready to be deployed.
```

---

## 📁 第五步：查看构建产物

### 构建产物位置
```
d:\workcode\miniapp\uniapp-h5\unpackage\dist\build\h5\
├── index.html          # 入口文件
├── static/             # 静态资源
│   ├── css/
│   ├── js/
│   └── img/
└── manifest.json       # 应用清单
```

### 验证构建成功
检查文件是否存在：
```powershell
Test-Path "d:\workcode\miniapp\uniapp-h5\unpackage\dist\build\h5\index.html"
```

应该返回：`True`

---

## 📋 第六步：复制到后端项目

### 方法 1：使用 PowerShell 脚本（推荐）

创建文件：`d:\workcode\miniapp\copy-frontend.ps1`

```powershell
# 复制前端构建产物到后端 static 目录

Write-Host "开始复制前端文件..." -ForegroundColor Green

# 源目录
$source = "d:\workcode\miniapp\uniapp-h5\unpackage\dist\build\h5"

# 目标目录
$target = "d:\workcode\miniapp\src\main\resources\static"

# 检查源目录是否存在
if (-not (Test-Path $source)) {
    Write-Host "错误：前端构建产物不存在！" -ForegroundColor Red
    Write-Host "请先在 HBuilderX 中构建前端项目" -ForegroundColor Yellow
    exit 1
}

# 清空目标目录（保留目录本身）
if (Test-Path $target) {
    Write-Host "清空旧的静态文件..." -ForegroundColor Yellow
    Remove-Item "$target\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# 创建目标目录（如果不存在）
if (-not (Test-Path $target)) {
    New-Item -ItemType Directory -Path $target -Force | Out-Null
}

# 复制文件
Write-Host "复制新的前端文件..." -ForegroundColor Yellow
Copy-Item "$source\*" $target -Recurse -Force

# 验证
$indexFile = "$target\index.html"
if (Test-Path $indexFile) {
    Write-Host "✓ 复制成功！" -ForegroundColor Green
    Write-Host "前端文件已复制到：$target" -ForegroundColor Cyan
} else {
    Write-Host "✗ 复制失败！" -ForegroundColor Red
    exit 1
}
```

**运行脚本**：
```powershell
cd d:\workcode\miniapp
.\copy-frontend.ps1
```

### 方法 2：手动复制

1. 打开文件资源管理器
2. 进入：`d:\workcode\miniapp\uniapp-h5\unpackage\dist\build\h5\`
3. 全选所有文件（Ctrl+A）
4. 复制（Ctrl+C）
5. 进入：`d:\workcode\miniapp\src\main\resources\static\`
6. 删除旧文件
7. 粘贴（Ctrl+V）

---

## 🔨 第七步：重新打包后端

### 打包命令
```bash
cd d:\workcode\miniapp
mvn clean package -DskipTests
```

### 预期输出
```
[INFO] Building yixinjr 0.0.1-SNAPSHOT
[INFO] --- maven-resources-plugin:3.3.1:resources ---
[INFO] Copying 3 resources from src\main\resources to target\classes
[INFO] --- maven-compiler-plugin:3.10.1:compile ---
[INFO] Compiling 90 source files
[INFO] --- maven-jar-plugin:3.2.2:jar ---
[INFO] Building jar: D:\workcode\miniapp\target\yixinjr-dev.jar
[INFO] --- spring-boot-maven-plugin:2.7.18:repackage ---
[INFO] BUILD SUCCESS
```

### 生成文件
```
d:\workcode\miniapp\target\yixinjr-dev.jar
```

---

## 🚀 第八步：启动应用

### 启动命令
```bash
cd d:\workcode\miniapp
java -jar target\yixinjr-dev.jar
```

### 预期日志
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v2.7.18)

2026-01-26 17:30:00.000  INFO --- [main] c.e.l.LoanMiniappApplication : Starting LoanMiniappApplication
2026-01-26 17:30:05.000  INFO --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 8081 (http)
2026-01-26 17:30:05.000  INFO --- [main] c.e.l.LoanMiniappApplication : Started LoanMiniappApplication in 5.123 seconds
```

---

## 🌐 第九步：访问应用

### 访问地址
```
http://localhost:8081/
```

### 预期效果
- ✅ 自动加载 uni-app 的 H5 页面
- ✅ 显示登录页面（uni-app 版本）
- ✅ 可以正常导航和交互

### 如果看到的还是旧页面
1. **清除浏览器缓存**：Ctrl+Shift+Delete
2. **强制刷新**：Ctrl+F5
3. **检查文件**：访问 `http://localhost:8081/static/js/` 看是否有新文件

---

## 🔄 后续开发流程

### 每次修改前端后
1. 在 HBuilderX 中修改代码
2. 点击：**发行** -> **网站-H5手机版**
3. 运行复制脚本：`.\copy-frontend.ps1`
4. 重新打包：`mvn clean package -DskipTests`
5. 重启应用：`java -jar target\yixinjr-dev.jar`
6. 刷新浏览器：Ctrl+F5

### 开发模式（推荐）
在开发阶段，可以分离前后端：

**前端**（在 HBuilderX 中）：
```
运行 -> 运行到浏览器 -> Chrome
前端地址：http://localhost:8080
```

**后端**（在 IDE 中）：
```
直接运行 LoanMiniappApplication.main()
后端地址：http://localhost:8081
```

前端会通过 `manifest.json` 中配置的代理访问后端 API。

---

## 📝 常见问题

### Q1: HBuilderX 构建失败
**错误**：`Error: Cannot find module...`

**解决**：
1. 在 HBuilderX 中右键项目
2. 选择"使用命令行窗口打开所在目录"
3. 运行：`npm install`（如果有 npm）
4. 或者忽略错误，HBuilderX 内置了构建工具

### Q2: 复制后还是旧页面
**原因**：浏览器缓存

**解决**：
1. 清除缓存：Ctrl+Shift+Delete
2. 强制刷新：Ctrl+F5
3. 或使用无痕模式

### Q3: 构建产物找不到
**检查路径**：
```powershell
Get-ChildItem "d:\workcode\miniapp\uniapp-h5\unpackage" -Recurse -Filter "index.html"
```

### Q4: 想要自动化这个过程
**方案**：创建一个完整的构建脚本（见下一节）

---

## 🤖 自动化脚本（可选）

创建文件：`d:\workcode\miniapp\build-all.ps1`

```powershell
# 完整的前后端构建脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  益信通项目 - 完整构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 HBuilderX 构建产物
Write-Host "[1/4] 检查前端构建产物..." -ForegroundColor Yellow
$frontendDist = "d:\workcode\miniapp\uniapp-h5\unpackage\dist\build\h5"
if (-not (Test-Path "$frontendDist\index.html")) {
    Write-Host "✗ 前端构建产物不存在！" -ForegroundColor Red
    Write-Host "请先在 HBuilderX 中构建前端：发行 -> 网站-H5手机版" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ 前端构建产物存在" -ForegroundColor Green

# 2. 复制前端文件
Write-Host "[2/4] 复制前端文件到 static 目录..." -ForegroundColor Yellow
$staticDir = "d:\workcode\miniapp\src\main\resources\static"
Remove-Item "$staticDir\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$frontendDist\*" $staticDir -Recurse -Force
Write-Host "✓ 前端文件复制完成" -ForegroundColor Green

# 3. Maven 打包
Write-Host "[3/4] Maven 打包后端..." -ForegroundColor Yellow
cd "d:\workcode\miniapp"
& "D:\apache-maven-3.8.6\bin\mvn.cmd" clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Maven 打包失败！" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Maven 打包完成" -ForegroundColor Green

# 4. 完成
Write-Host "[4/4] 构建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  构建成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动命令：" -ForegroundColor Yellow
Write-Host "  java -jar target\yixinjr-dev.jar" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Yellow
Write-Host "  http://localhost:8081/" -ForegroundColor Cyan
Write-Host ""
```

**使用方法**：
```powershell
# 1. 在 HBuilderX 中构建前端
# 2. 运行脚本
cd d:\workcode\miniapp
.\build-all.ps1
```

---

## ✅ 总结

### 必须手动操作的步骤
1. ✅ 安装 HBuilderX
2. ✅ 在 HBuilderX 中打开项目
3. ✅ 点击"发行 -> 网站-H5手机版"

### 可以自动化的步骤
4. ✅ 复制文件（使用脚本）
5. ✅ Maven 打包（使用脚本）
6. ✅ 启动应用（使用脚本）

### 为什么需要 HBuilderX
- ❌ npm 依赖无法正确安装
- ✅ HBuilderX 内置了 uni-app 构建工具
- ✅ 不依赖 npm
- ✅ 官方推荐方式

**这是目前最可靠的解决方案！** 🎉


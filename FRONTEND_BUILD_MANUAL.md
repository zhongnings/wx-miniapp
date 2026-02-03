# 前端构建说明

## 问题说明

uni-app 前端项目的依赖安装遇到问题，npm 无法正确解析和安装所有依赖包。这可能是由于：

1. `@dcloudio` 包的版本号格式特殊（`2.0.2-3081220230817001`）
2. npm 镜像源中可能缺少某些版本
3. 依赖关系复杂导致解析失败

## 临时解决方案

### 方案 1：使用 HBuilderX 构建（推荐）

1. 下载并安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 在 HBuilderX 中打开 `uniapp-h5` 项目
3. 点击菜单：发行 -> H5-手机版
4. 构建完成后，将 `uniapp-h5/unpackage/dist/build/h5` 目录下的所有文件复制到 `src/main/resources/static/` 目录

### 方案 2：使用现有的微信小程序页面

当前项目中已经有完整的微信小程序页面（`uniapp-h5/pages/` 目录），这些页面可以直接在 HBuilderX 中运行和构建。

### 方案 3：先使用后端静态页面

1. 当前 `src/main/resources/static/` 目录下已有基础的登录页面
2. 可以先使用这些页面进行后端功能测试
3. 等前端构建问题解决后再替换

## 当前配置

- **前端自动构建已禁用**：pom.xml 中的 `frontend-maven-plugin` 已被注释
- **后端可以正常打包**：运行 `mvn clean package -DskipTests` 即可
- **访问方式**：
  - 后端 API：`http://localhost:8081/api/`
  - 静态页面：`http://localhost:8081/login.html`

## 下一步计划

1. 研究 uni-app 官方推荐的构建方式
2. 或者考虑将前端改为纯 Vue.js 项目（不使用 uni-app）
3. 或者使用 HBuilderX 手动构建后集成

## 快速启动后端

```bash
# 打包（不包含前端构建）
mvn clean package -DskipTests

# 运行
java -jar target/yixinjr-dev.jar

# 访问
http://localhost:8081/login.html
```

## 前端开发建议

如果需要开发 H5 前端，建议：

1. 使用 HBuilderX 进行开发和调试
2. 在 HBuilderX 中运行 H5 项目（会自动启动开发服务器）
3. 开发完成后在 HBuilderX 中构建
4. 将构建产物复制到 Spring Boot 的 static 目录

这样可以避免 Maven 构建过程中的依赖问题。


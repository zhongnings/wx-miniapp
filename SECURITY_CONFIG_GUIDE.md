# 安全配置说明

## 📋 当前 SecurityConfig 配置

### 允许公开访问的路径

#### 1. H5 前端资源（uni-app 构建的 H5 页面）
```
/                    - 根路径（会转发到 index.html）
/index.html          - H5 应用入口
/main.js             - 主 JS 文件（如果存在）
/static/**           - 所有静态资源（JS、CSS、图片等）
/hybrid/**           - uni-app 混合资源
```

#### 2. 上传文件访问
```
/uploads/**          - 用户上传的文件（如身份证照片、合同等）
```

#### 3. 公开 API（小程序和 H5 都可以访问）
```
/auth/**             - 认证相关接口（登录、注册等）
/public/**           - 公开接口（订单查询、合同下载等）
/agreements/**       - 协议相关接口
```

#### 4. 其他请求
```
需要认证（JWT Token）
```

---

## 🔒 对小程序的影响

### ✅ 不会影响小程序访问

**原因**：

1. **小程序只访问 API 接口**
   - 小程序不会访问 `/index.html` 等 H5 页面
   - 小程序只调用 `/auth/**`、`/public/**` 等 API 接口
   - 这些 API 接口都已经在 `permitAll()` 中配置

2. **认证机制相同**
   - 小程序和 H5 都使用 JWT Token 认证
   - 登录后获取 Token，后续请求携带 Token
   - 认证逻辑在 `CurrentUserInterceptor` 中统一处理

3. **跨域配置**
   - `WebMvcConfig` 中配置了 CORS，允许跨域访问
   - 小程序和 H5 都可以正常调用后端 API

---

## 📱 小程序访问流程

### 1. 登录
```
POST /auth/login
Body: { username, password }
Response: { token, userInfo }
```

### 2. 后续请求
```
GET /public/orders
Header: Authorization: Bearer {token}
```

### 3. 公开接口（无需 Token）
```
GET /public/agreements/xxx
GET /agreements/xxx
```

---

## 🌐 H5 访问流程

### 1. 访问首页
```
http://localhost:8081/
-> 转发到 /index.html
-> 加载 uni-app H5 应用
```

### 2. H5 应用内的路由
```
http://localhost:8081/#/pages/login/index
http://localhost:8081/#/pages/home/index
http://localhost:8081/#/pages/order/list/index
```

### 3. API 调用
```
与小程序相同，调用 /auth/**、/public/** 等接口
```

---

## 🔧 配置文件对比

### SecurityConfig.java
```java
// H5 前端资源
.antMatchers("/", "/index.html", "/static/**", "/hybrid/**").permitAll()

// 公开 API（小程序和 H5 共用）
.antMatchers("/auth/**", "/public/**", "/agreements/**").permitAll()

// 上传文件
.antMatchers("/uploads/**").permitAll()

// 其他请求需要认证
.anyRequest().authenticated()
```

### WebMvcConfig.java
```java
// 跨域配置（支持小程序和 H5）
.allowedOriginPatterns("*")
.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")

// 默认首页（仅 H5 使用）
registry.addViewController("/").setViewName("forward:/index.html");

// 静态资源映射（仅 H5 使用）
registry.addResourceHandler("/static/**")
        .addResourceLocations("classpath:/static/static/");
```

---

## ✅ 总结

### 对小程序的影响
- ✅ **无影响**
- ✅ 所有 API 接口正常访问
- ✅ 认证机制不变
- ✅ 跨域配置支持

### 对 H5 的影响
- ✅ 可以正常访问 `/index.html`
- ✅ 可以加载所有静态资源
- ✅ 可以调用所有 API 接口
- ✅ 与小程序共用相同的后端接口

### 已移除的配置
- ❌ `/login.html`（旧的静态登录页面，已不存在）
- ❌ `/orders.html`（旧的静态页面，已不存在）
- ❌ `/js/**`、`/css/**`（已统一到 `/static/**`）

---

## 🎯 最佳实践

### 1. 前后端分离
- 前端：uni-app（H5 + 小程序）
- 后端：Spring Boot（统一 API）

### 2. 认证统一
- 使用 JWT Token
- 小程序和 H5 共用相同的认证逻辑

### 3. 接口规范
- `/auth/**` - 认证相关（登录、注册）
- `/public/**` - 公开接口（无需认证）
- `/api/**` - 需要认证的接口

### 4. 静态资源
- H5 资源：`/static/**`
- 上传文件：`/uploads/**`

---

## 📝 测试清单

### H5 测试
- [ ] 访问 `http://localhost:8081/` 能看到 H5 页面
- [ ] 访问 `http://localhost:8081/index.html` 能看到 H5 页面
- [ ] H5 页面能正常加载 JS、CSS 等资源
- [ ] H5 页面能正常调用 API 接口

### 小程序测试
- [ ] 小程序能正常登录
- [ ] 小程序能正常调用 API 接口
- [ ] 小程序能正常上传文件
- [ ] 小程序能正常下载文件

---

## 🎉 结论

**当前配置不会影响小程序访问！**

- ✅ 小程序和 H5 共用相同的后端 API
- ✅ 认证机制统一（JWT Token）
- ✅ 接口权限配置合理
- ✅ 跨域配置支持所有客户端


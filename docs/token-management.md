# Token管理系统实现文档

## 功能概述

实现了基于Redis的JWT Token管理系统，支持：
- ✅ Token 30分钟有效期
- ✅ Token存储在Redis中，方便随时控制
- ✅ 单点登录（同一用户登录会踢出旧Token）
- ✅ 自动刷新Token（5分钟内过期自动续期）
- ✅ 强制用户下线功能
- ✅ 放款申请权限校验（需要 order:pay 权限）

## 实现文件

### 1. 后端文件

#### TokenService.java
- 位置：`src/main/java/com/example/loanminiapp/service/TokenService.java`
- 功能：
  - `generateAndStoreToken()` - 生成Token并存储到Redis
  - `validateToken()` - 验证Token是否有效
  - `refreshToken()` - 刷新Token过期时间
  - `removeToken()` - 删除Token（登出）
  - `forceLogout()` - 强制用户下线
  - `isTokenExpiringSoon()` - 检查Token是否即将过期

#### JwtUtil.java
- 位置：`src/main/java/com/example/loanminiapp/security/JwtUtil.java`
- 功能：JWT Token的生成和解析

#### JwtAuthenticationInterceptor.java
- 位置：`src/main/java/com/example/loanminiapp/security/JwtAuthenticationInterceptor.java`
- 功能：
  - 验证请求头中的Token
  - 从Redis获取Token信息
  - 自动刷新即将过期的Token
  - 设置当前用户上下文

#### AuthController.java
- 位置：`src/main/java/com/example/loanminiapp/controller/AuthController.java`
- 接口：
  - `POST /auth/login` - 登录（生成Token）
  - `POST /auth/logout` - 登出（删除Token）

#### OrderVoucherController.java
- 位置：`src/main/java/com/example/loanminiapp/controller/OrderVoucherController.java`
- 接口：
  - `POST /public/orders/{orderId}/vouchers/{voucherId}/apply` - 放款申请（需要 order:pay 权限）

### 2. 配置文件

#### application.yml
- 位置：`src/main/resources/application.yml`
- 添加了Redis配置：
```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: # 如果有密码请填写
    database: 0
    timeout: 3000ms
```

## Redis数据结构

### Token信息
- Key: `token:{jwt_token}`
- Type: Hash
- 过期时间: 30分钟
- 内容:
  ```json
  {
    "userId": 123,
    "username": "admin",
    "roles": ["admin"],
    "permissions": ["order:view", "order:pay"],
    "createTime": 1234567890
  }
  ```

### 用户Token映射
- Key: `user:token:{userId}`
- Type: String
- 过期时间: 30分钟
- 内容: JWT Token字符串

## 使用说明

### 1. 登录
```javascript
// 前端请求
POST /auth/login
{
  "username": "admin",
  "password": "password"
}

// 响应
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "roles": ["admin"],
  "permissions": ["order:view", "order:pay"],
  "menus": [...]
}
```

### 2. 携带Token请求
```javascript
// 请求头
X-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token自动刷新
- 当Token剩余有效期小于5分钟时，拦截器会自动刷新Token
- 刷新后Token有效期重置为30分钟

### 4. 登出
```javascript
POST /auth/logout
Headers: X-Token: xxx
```

### 5. 放款申请（需要权限）
```javascript
POST /public/orders/{orderId}/vouchers/{voucherId}/apply
Headers: X-Token: xxx
Body: {
  "paymentPassword": "123456"
}
```

## 权限控制

### 放款权限
- 权限代码：`order:pay`
- 需要在数据库 `sys_permission` 表中配置
- 需要分配给相应的角色

### 数据库配置示例
```sql
-- 添加放款权限
INSERT INTO sys_permission (code, name, type, path) 
VALUES ('order:pay', '订单打款', 'api', '/api/orders/**/pay');

-- 分配给管理员角色（假设角色ID为1）
INSERT INTO sys_role_permission (role_id, permission_id) 
VALUES (1, (SELECT id FROM sys_permission WHERE code = 'order:pay'));
```

## 管理功能

### 强制用户下线
```java
@Autowired
private TokenService tokenService;

// 强制用户下线
tokenService.forceLogout(userId);
```

### 查看Token剩余时间
```java
long expireTime = tokenService.getTokenExpireTime(token);
System.out.println("Token剩余时间: " + expireTime + "秒");
```

## 注意事项

1. **Redis必须启动**：确保Redis服务正常运行
2. **单点登录**：同一用户登录会自动踢出旧Token
3. **Token过期**：30分钟无操作Token会自动过期
4. **自动续期**：有操作时Token会自动续期
5. **权限校验**：放款申请需要 `order:pay` 权限

## 前端处理

前端需要处理Token过期的情况：

```javascript
// 请求拦截器
wx.$request.interceptors.request = (config) => {
  const token = wx.getStorageSync('token');
  if (token) {
    config.header['X-Token'] = token;
  }
  return config;
};

// 响应拦截器
wx.$request.interceptors.response = (response) => {
  if (response.statusCode === 401) {
    // Token过期，跳转到登录页
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    });
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/login/index'
      });
    }, 1500);
  }
  return response;
};
```

## 测试

1. 启动Redis服务
2. 启动后端应用
3. 登录获取Token
4. 使用Token访问需要权限的接口
5. 等待30分钟后Token自动过期
6. 或手动调用登出接口删除Token


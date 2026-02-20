# 订单权限和异常处理优化

## 优化内容

### 1. 统一异常处理

#### 修改文件
- `src/main/java/com/example/loanminiapp/config/GlobalExceptionHandler.java`

#### 功能说明
- **RuntimeException（业务异常）**：主动抛出的异常，将错误信息返回给前端
- **Exception（系统异常）**：未预期的异常，返回通用提示，不暴露具体错误

#### 示例

**业务异常（会返回给前端）：**
```java
// 后端代码
throw new RuntimeException("您没有权限访问此订单");

// 前端收到
{
  "code": 400,
  "message": "您没有权限访问此订单"
}
```

**系统异常（不暴露细节）：**
```java
// 后端代码
int result = 1 / 0; // 系统异常

// 前端收到
{
  "code": 500,
  "message": "系统开小差了，请稍后再试"
}
```

### 2. 订单权限过滤

#### 修改文件
- `src/main/java/com/example/loanminiapp/service/InMemoryOrderService.java`
- `src/main/java/com/example/loanminiapp/service/OrderAccessService.java`

#### 权限规则

| 角色 | 订单列表权限 | 订单详情权限 |
|------|-------------|-------------|
| ADMIN（管理员） | ✅ 查看所有订单 | ✅ 访问所有订单详情 |
| SALES（业务员） | ✅ 只看自己录入的订单 | ✅ 只能访问自己录入的订单 |
| APPLICANT（申请人） | ✅ 只看自己申请的订单 | ✅ 只能访问自己申请的订单 |

#### 实现逻辑

**订单列表过滤（filterOrderIdsByRole）：**
```java
// 1. ADMIN 角色 → 返回所有订单ID
if (cu.getRoles().contains("ADMIN")) {
    return orders.stream().map(Order::getId).collect(Collectors.toSet());
}

// 2. SALES 角色 → 查询 t_order_user_relation 表，relation_type='SALES_OWNER'
// 3. APPLICANT 角色 → 查询 t_order_user_relation 表，relation_type='APPLICANT_OWNER'
```

**订单详情权限校验（checkAccess）：**
```java
// 1. ADMIN 角色 → 直接通过
// 2. 其他角色 → 检查 t_order_user_relation 表中是否有对应关系
//    - SALES 必须有 SALES_OWNER 关系
//    - APPLICANT 必须有 APPLICANT_OWNER 关系
// 3. 无权限 → 抛出 RuntimeException("您没有权限访问此订单")
```

## 数据库关联表

### t_order_user_relation（订单-用户关联表）

| 字段 | 说明 | 示例 |
|------|------|------|
| order_id | 订单ID | 1 |
| user_id | 用户ID | 2 |
| relation_type | 关系类型 | SALES_OWNER / APPLICANT_OWNER |

**示例数据：**
```sql
-- 订单1的申请人是 user_id=3
INSERT INTO t_order_user_relation (order_id, user_id, relation_type)
VALUES (1, 3, 'APPLICANT_OWNER');

-- 订单1的业务员是 user_id=2
INSERT INTO t_order_user_relation (order_id, user_id, relation_type)
VALUES (1, 2, 'SALES_OWNER');
```

## 测试场景

### 场景1：管理员查看订单列表
```
用户：admin（角色：ADMIN）
请求：GET /public/orders?tab=manage
结果：✅ 返回所有订单（25条）
```

### 场景2：业务员查看订单列表
```
用户：sales（角色：SALES，user_id=2）
请求：GET /public/orders?tab=manage
查询：SELECT * FROM t_order_user_relation 
      WHERE user_id=2 AND relation_type='SALES_OWNER'
结果：✅ 只返回自己作为业务员的订单
```

### 场景3：申请人查看订单列表
```
用户：applicant（角色：APPLICANT，user_id=3）
请求：GET /public/orders?tab=manage
查询：SELECT * FROM t_order_user_relation 
      WHERE user_id=3 AND relation_type='APPLICANT_OWNER'
结果：✅ 只返回自己申请的订单
```

### 场景4：业务员访问其他人的订单详情
```
用户：sales（角色：SALES，user_id=2）
请求：GET /public/orders/999
查询：SELECT * FROM t_order_user_relation 
      WHERE order_id=999 AND user_id=2 AND relation_type='SALES_OWNER'
结果：❌ 抛出异常 "您没有权限访问此订单"
前端收到：
{
  "code": 400,
  "message": "您没有权限访问此订单"
}
```

### 场景5：申请人访问其他人的订单详情
```
用户：applicant（角色：APPLICANT，user_id=3）
请求：GET /public/orders/999
查询：SELECT * FROM t_order_user_relation 
      WHERE order_id=999 AND user_id=3 AND relation_type='APPLICANT_OWNER'
结果：❌ 抛出异常 "您没有权限访问此订单"
前端收到：
{
  "code": 400,
  "message": "您没有权限访问此订单"
}
```

### 场景6：管理员访问任意订单详情
```
用户：admin（角色：ADMIN）
请求：GET /public/orders/999
结果：✅ 直接通过，返回订单详情
```

## 前端处理

### 错误提示
前端的 `request.js` 已经统一处理了错误提示：

```javascript
// 400 业务异常
if (res.statusCode === 400) {
  wx.showToast({
    title: res.data?.message || '请求失败',
    icon: 'none'
  });
}

// 401 未登录
if (res.statusCode === 401) {
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  });
  // 跳转登录页
}

// 403 权限不足
if (res.statusCode === 403) {
  wx.showToast({
    title: res.data?.message || '您没有权限执行此操作',
    icon: 'none'
  });
}

// 500 系统异常
if (res.statusCode === 500) {
  wx.showToast({
    title: '系统开小差了，请稍后再试',
    icon: 'none'
  });
}
```

## 常见业务异常

### 订单相关
- `"订单不存在"`
- `"您没有权限访问此订单"`
- `"订单状态不允许提交"`
- `"订单状态不正确，无法通过审核"`
- `"借款人信息不完整，无法生成合同"`

### 权限相关
- `"未登录或登录已过期"`（401）
- `"您没有放款权限，请联系管理员"`（403）
- `"您没有权限访问此订单"`（400）

### 放款相关
- `"请输入支付密码"`
- `"支付密码错误"`
- `"账户余额不足"`

## 注意事项

1. **数据完整性**：确保 `t_order_user_relation` 表数据完整
   - 每个订单都应该有对应的申请人关系（APPLICANT_OWNER）
   - 如果有业务员录入，应该有业务员关系（SALES_OWNER）

2. **异常信息**：业务异常的错误信息会直接返回给前端，注意不要暴露敏感信息

3. **权限校验**：所有订单相关的接口都会调用 `checkAccess()` 进行权限校验

4. **日志记录**：
   - 业务异常：使用 `log.warn()` 记录
   - 系统异常：使用 `log.error()` 记录完整堆栈

## 相关文件

- 异常处理：`src/main/java/com/example/loanminiapp/config/GlobalExceptionHandler.java`
- 订单服务：`src/main/java/com/example/loanminiapp/service/InMemoryOrderService.java`
- 权限校验：`src/main/java/com/example/loanminiapp/service/OrderAccessService.java`
- 前端请求：`wx-miniapp/miniprogram/utils/request.js`


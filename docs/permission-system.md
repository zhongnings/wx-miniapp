# 权限系统配置说明

## 当前问题

根据数据库截图分析，权限表数据配置不完整，导致放款功能无法正常使用。

## 权限表结构

### 1. sys_permission（权限表）
存储所有的权限定义，包括API权限和菜单权限。

| 字段 | 说明 | 示例 |
|------|------|------|
| id | 权限ID | 1, 2, 3... |
| code | 权限代码（唯一） | order:view, order:pay |
| name | 权限名称 | 订单查看, 订单打款 |
| type | 权限类型 | api（接口权限）, menu（菜单权限） |
| path | 权限路径 | /api/orders/**/pay |

### 2. sys_role（角色表）
定义系统中的角色。

| 角色ID | 角色代码 | 角色名称 | 说明 |
|--------|----------|----------|------|
| 1 | APPLICANT | 申请人 | 只能查看和编辑自己的订单 |
| 2 | SALES | 业务员 | 可以查看和编辑订单，预览合同 |
| 3 | ADMIN | 管理员 | 拥有所有权限，包括放款 |

### 3. sys_role_permission（角色-权限关联表）
定义角色拥有哪些权限。

| role_id | permission_id | 说明 |
|---------|---------------|------|
| 3 | 1,2,3,4,5,6,7 | ADMIN拥有所有权限 |
| 2 | 1,2,4,5 | SALES拥有查看、编辑、合同预览权限 |
| 1 | 1,2,5 | APPLICANT拥有查看、编辑权限 |

### 4. sys_user_role（用户-角色关联表）
定义用户拥有哪些角色。

| user_id | role_id | 说明 |
|---------|---------|------|
| 1 | 3 | admin用户是管理员 |
| 2 | 2 | sales用户是业务员 |
| 3 | 1 | applicant用户是申请人 |

## 标准权限配置

### API权限（type='api'）

| code | name | path | 说明 |
|------|------|------|------|
| order:view | 订单查看 | /api/orders/** | 查看订单列表和详情 |
| order:edit | 订单编辑 | /api/orders/** | 创建和编辑订单 |
| order:pay | 订单打款 | /api/orders/**/pay | **放款申请（重要）** |
| contract:preview | 合同预览 | /api/contracts/** | 预览和下载合同 |

### 菜单权限（type='menu'）

| code | name | path | 说明 |
|------|------|------|------|
| menu:order | 订单列表 | /pages/order/list/index | 订单管理菜单 |
| menu:account | 资金账户管理 | /pages/account/list/index | 资金账户菜单 |
| menu:contract | 合同出证 | /pages/contract/list/index | 合同管理菜单 |

## 角色权限分配

### ADMIN（管理员）- 全部权限
```
✅ order:view      - 订单查看
✅ order:edit      - 订单编辑
✅ order:pay       - 订单打款（放款）⭐
✅ contract:preview - 合同预览
✅ menu:order      - 订单列表菜单
✅ menu:account    - 资金账户菜单
✅ menu:contract   - 合同出证菜单
```

### SALES（业务员）- 业务权限
```
✅ order:view      - 订单查看
✅ order:edit      - 订单编辑
❌ order:pay       - 订单打款（无权限）
✅ contract:preview - 合同预览
✅ menu:order      - 订单列表菜单
❌ menu:account    - 资金账户菜单（无权限）
❌ menu:contract   - 合同出证菜单（无权限）
```

### APPLICANT（申请人）- 基础权限
```
✅ order:view      - 订单查看
✅ order:edit      - 订单编辑
❌ order:pay       - 订单打款（无权限）
❌ contract:preview - 合同预览（无权限）
✅ menu:order      - 订单列表菜单
❌ menu:account    - 资金账户菜单（无权限）
❌ menu:contract   - 合同出证菜单（无权限）
```

## 权限验证流程

### 1. 登录时
```
用户登录 → 查询用户角色 → 查询角色权限 → 返回权限列表 → 存储到Redis
```

### 2. 请求时
```
前端请求 → 携带Token → 拦截器验证Token → 从Redis获取权限 → 检查权限 → 允许/拒绝
```

### 3. 放款申请流程
```
用户点击"放款申请" 
  ↓
前端发送请求（携带Token）
  ↓
后端拦截器验证Token
  ↓
从Redis获取用户权限列表
  ↓
检查是否包含 "order:pay" 权限
  ↓
有权限：执行放款逻辑
无权限：返回403错误
  ↓
前端显示错误提示
```

## 修复步骤

### 1. 执行修复SQL
```bash
# 在数据库中执行
mysql -u root -p loan_miniapp < docs/db/fix-permission-data.sql
```

### 2. 验证权限数据
```sql
-- 查看所有权限
SELECT * FROM sys_permission ORDER BY id;

-- 查看ADMIN角色的权限
SELECT p.code, p.name, p.type
FROM sys_role_permission rp
JOIN sys_permission p ON rp.permission_id = p.id
WHERE rp.role_id = 3;

-- 应该包含 order:pay 权限
```

### 3. 测试登录
```bash
# 使用admin账号登录
POST /auth/login
{
  "username": "admin",
  "password": "123456"
}

# 检查返回的permissions数组中是否包含 "order:pay"
```

### 4. 测试放款功能
```bash
# 使用admin账号的Token
POST /public/orders/{orderId}/vouchers/{voucherId}/apply
Headers: X-Token: xxx
Body: {
  "paymentPassword": "123456"
}

# 应该返回成功，而不是403错误
```

## 常见问题

### Q1: 为什么admin用户没有放款权限？
**A:** 检查以下几点：
1. sys_permission表中是否有 `order:pay` 权限
2. sys_role_permission表中role_id=3是否关联了order:pay的permission_id
3. 登录后返回的permissions数组中是否包含 "order:pay"
4. Redis中的Token信息是否包含 "order:pay" 权限

### Q2: 如何给其他角色添加放款权限？
**A:** 执行SQL：
```sql
-- 给SALES角色添加放款权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission WHERE code = 'order:pay';
```

### Q3: 如何查看当前用户的权限？
**A:** 
- 前端：查看登录接口返回的 `permissions` 数组
- 后端：查看Redis中的Token信息
- 数据库：执行验证SQL查询

### Q4: Token过期后权限会丢失吗？
**A:** 会的。Token过期后需要重新登录，系统会重新从数据库查询权限并存储到Redis。

## 安全建议

1. **最小权限原则**：只给用户分配必要的权限
2. **定期审计**：定期检查用户权限配置是否合理
3. **权限分离**：敏感操作（如放款）只给管理员
4. **操作日志**：记录所有敏感操作的日志
5. **密码保护**：放款操作需要输入支付密码二次确认

## 相关文件

- 权限验证：`src/main/java/com/example/loanminiapp/security/JwtAuthenticationInterceptor.java`
- 权限查询：`src/main/java/com/example/loanminiapp/service/UserService.java`
- Token管理：`src/main/java/com/example/loanminiapp/service/TokenService.java`
- 放款接口：`src/main/java/com/example/loanminiapp/controller/OrderVoucherController.java`
- 修复SQL：`docs/db/fix-permission-data.sql`


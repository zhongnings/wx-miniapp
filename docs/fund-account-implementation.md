# 资金账户管理功能实现文档

## 概述
实现了完整的资金账户管理功能，包括前端小程序页面和后端API接口。

## 数据库设计

### 表结构：t_fund_account

```sql
CREATE TABLE IF NOT EXISTS t_fund_account (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    assignee VARCHAR(128) NOT NULL COMMENT '受让方',
    payment_channel VARCHAR(64) COMMENT '支付渠道',
    microloan_org VARCHAR(128) COMMENT '小贷机构',
    bank_branch_number VARCHAR(64) COMMENT '开户行号',
    bound_bank VARCHAR(128) COMMENT '绑定银行',
    account_number VARCHAR(64) COMMENT '绑定银行账号',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_by VARCHAR(64) COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_assignee (assignee),
    INDEX idx_status (status)
) COMMENT='资金账户管理表';
```

**SQL文件位置**：`docs/db/fund-account-schema.sql`

## 后端实现

### 1. 实体类（Entity）

**文件**：`src/main/java/com/example/loanminiapp/entity/FundAccount.java`

- 使用 MyBatis-Plus 注解
- 包含所有字段的 getter/setter
- 使用 Lombok 简化代码

### 2. 数据访问层（Mapper）

**文件**：`src/main/java/com/example/loanminiapp/mapper/FundAccountMapper.java`

- 继承 MyBatis-Plus 的 BaseMapper
- 自动提供基础 CRUD 操作

### 3. 数据传输对象（DTO）

**文件**：`src/main/java/com/example/loanminiapp/dto/FundAccountDTO.java`

- 用于前后端数据传输
- 字段与实体类对应

### 4. 业务逻辑层（Service）

**文件**：`src/main/java/com/example/loanminiapp/service/FundAccountService.java`

**主要方法**：
- `list()` - 查询账户列表（只返回启用状态的账户）
- `getById(Long id)` - 根据ID查询账户详情
- `add(FundAccountDTO dto)` - 新增账户
- `update(Long id, FundAccountDTO dto)` - 更新账户
- `delete(Long id)` - 删除账户（软删除，设置状态为禁用）

**特性**：
- 事务管理
- 数据验证
- 自动记录创建人
- 软删除机制

### 5. 控制器（Controller）

**文件**：`src/main/java/com/example/loanminiapp/controller/FundAccountController.java`

**API接口**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /public/accounts/list | 查询账户列表 |
| GET | /public/accounts/{id} | 查询账户详情 |
| POST | /public/accounts | 新增账户 |
| PUT | /public/accounts/{id} | 更新账户 |
| DELETE | /public/accounts/{id} | 删除账户 |

**返回格式**：
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "message": "操作成功"
}
```

## 前端实现

### 1. 账户列表页面

**路径**：`pages/account/list/index`

**文件**：
- `index.js` - 页面逻辑
- `index.wxml` - 页面结构
- `index.wxss` - 页面样式
- `index.json` - 页面配置

**功能**：
- 空状态展示（参考 step3/step4 样式）
- 账户列表展示（卡片形式）
- 查看账户详情
- 编辑账户
- 删除账户
- 下拉刷新

**空状态设计**：
- 插图：建筑物 + 日历图标 + 箭头
- 提示文字："暂无资金账户"
- 新增按钮：虚线边框，红色主题

### 2. 账户新增/编辑页面

**路径**：`pages/account/add/index`

**文件**：
- `index.js` - 页面逻辑
- `index.wxml` - 页面结构
- `index.wxss` - 页面样式
- `index.json` - 页面配置

**功能**：

#### 基本信息部分
- 受让方（下拉选择，从字典加载）
- 支付渠道（下拉选择，从字典加载）
- 小贷机构（下拉选择，从字典加载）

#### 银行账户信息部分
- 开户行号（数字输入）
- 绑定银行（使用 bank-picker 组件）
- 绑定银行账号（数字输入，自动格式化，自动识别银行）

**特性**：
- 支持新增和编辑两种模式
- 自动加载字典数据
- 银行卡号自动格式化（每4位加空格）
- 输入6位后自动识别银行
- 完整的表单验证
- 友好的错误提示

### 3. 路由配置

**文件**：`app.json`

```json
{
  "pages": [
    ...
    "pages/account/list/index",
    "pages/account/add/index"
  ]
}
```

## 字段映射关系

| 前端字段 | 后端字段 | 说明 |
|---------|---------|------|
| assignee | assignee | 受让方 |
| paymentChannel | payment_channel | 支付渠道 |
| microloanOrg | microloan_org | 小贷机构 |
| bankBranchNumber | bank_branch_number | 开户行号 |
| boundBank | bound_bank | 绑定银行 |
| accountNumber | account_number | 绑定银行账号 |

## 使用流程

### 新增账户
1. 点击菜单"资金账户管理"进入列表页
2. 如果没有账户，显示空状态和"新增账户"按钮
3. 点击"新增账户"进入新增页面
4. 填写表单信息
5. 点击"提交"保存

### 编辑账户
1. 在列表页点击账户卡片的"编辑"按钮
2. 进入编辑页面，自动加载账户数据
3. 修改信息后点击"提交"保存

### 删除账户
1. 在列表页点击账户卡片右上角的删除图标
2. 确认删除
3. 账户状态设置为禁用（软删除）

## 数据验证

### 前端验证
- 所有字段必填
- 银行账号长度：16-19位
- 银行账号格式：纯数字

### 后端验证
- 受让方不能为空
- 银行账号不能为空
- 事务保证数据一致性

## 集成说明

### 依赖的字典接口
- `/public/dict/assignee_org` - 受让方选项
- `/public/dict/payment_channel` - 支付渠道选项
- `/public/dict/microloan_org` - 小贷机构选项

### 依赖的组件
- `bank-picker` - 银行选择器组件（已存在）

### 依赖的工具
- `utils/logger.js` - 日志工具
- `utils/bank-card-util.js` - 银行卡工具（格式化、识别）

## 部署步骤

### 1. 数据库初始化
```bash
# 执行 SQL 文件创建表
mysql -u root -p your_database < docs/db/fund-account-schema.sql
```

### 2. 后端部署
- 确保所有 Java 文件已编译
- 重启 Spring Boot 应用

### 3. 前端部署
- 小程序开发工具中编译
- 上传代码到微信平台

## 测试建议

### 功能测试
- [ ] 列表页空状态显示
- [ ] 新增账户功能
- [ ] 编辑账户功能
- [ ] 删除账户功能
- [ ] 表单验证
- [ ] 银行自动识别
- [ ] 下拉刷新

### 接口测试
```bash
# 查询列表
curl -X GET http://localhost:8080/public/accounts/list

# 新增账户
curl -X POST http://localhost:8080/public/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "assignee": "测试受让方",
    "paymentChannel": "宝付",
    "microloanOrg": "测试小贷机构",
    "bankBranchNumber": "123456789",
    "boundBank": "中国工商银行",
    "accountNumber": "6222021234567890123"
  }'

# 更新账户
curl -X PUT http://localhost:8080/public/accounts/1 \
  -H "Content-Type: application/json" \
  -d '{...}'

# 删除账户
curl -X DELETE http://localhost:8080/public/accounts/1
```

## 注意事项

1. **软删除机制**：删除操作只是将 status 设置为 0，不会真正删除数据
2. **权限控制**：当前接口路径为 `/public/accounts`，如需权限控制请调整路径
3. **字典数据**：确保字典接口返回正确的数据格式
4. **银行识别**：依赖 bank-card-util.js 的识别规则，可能需要更新规则库
5. **数据格式**：银行账号在前端显示时带空格，提交时会自动移除

## 扩展建议

1. **批量操作**：支持批量导入/导出账户
2. **审核流程**：新增账户需要审核后才能启用
3. **使用统计**：记录账户的使用次数和金额
4. **历史记录**：记录账户的修改历史
5. **权限管理**：不同角色有不同的操作权限

## 相关文档

- 数据库设计：`docs/db/fund-account-schema.sql`
- 后端代码：`src/main/java/com/example/loanminiapp/`
- 前端代码：`wx-miniapp/miniprogram/pages/account/`


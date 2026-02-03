# 担保人模块快速启动指南

## 1. 数据库配置

### 创建担保人表
```bash
# 连接到数据库
mysql -u root -p

# 选择数据库
use your_database_name;

# 执行建表SQL
source e:/workspace/miniapp/docs/db/co-borrower-independent-table.sql;

# 或者直接执行SQL语句
```

**担保人表SQL**:
```sql
CREATE TABLE IF NOT EXISTS t_order_guarantor (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    borrower_type VARCHAR(16) NOT NULL COMMENT '担保人类型：personal-个人，company-对公',
    
    -- 个人信息
    name VARCHAR(64) COMMENT '姓名',
    id_type VARCHAR(32) COMMENT '证件类型',
    id_no VARCHAR(32) COMMENT '证件号码',
    id_issue_date DATE COMMENT '证件生效日期',
    id_expire_date DATE COMMENT '证件有效期',
    id_address VARCHAR(255) COMMENT '证件地址',
    mobile VARCHAR(32) COMMENT '手机号',
    province_city VARCHAR(128) COMMENT '居住地省市区',
    address_detail VARCHAR(255) COMMENT '详细地址',
    relationship VARCHAR(32) COMMENT '与主借人关系',
    marital_status VARCHAR(16) COMMENT '婚姻状况',
    face_front_url VARCHAR(255) COMMENT '身份证正面图片URL',
    face_back_url VARCHAR(255) COMMENT '身份证反面图片URL',
    
    -- 对公信息
    business_license_url VARCHAR(255) COMMENT '营业执照图片URL',
    company_name VARCHAR(128) COMMENT '公司名称',
    company_credit_code VARCHAR(64) COMMENT '公司信用代码',
    company_area VARCHAR(128) COMMENT '公司注册地省市区',
    company_address VARCHAR(255) COMMENT '公司详细地址',
    
    -- 经办人信息
    agent_name VARCHAR(64) COMMENT '经办人姓名',
    agent_mobile VARCHAR(32) COMMENT '经办人手机号',
    agent_id_type VARCHAR(32) COMMENT '经办人证件类型',
    agent_id_no VARCHAR(32) COMMENT '经办人证件号码',
    agent_id_issue_date DATE COMMENT '经办人证件生效日期',
    agent_id_expire_date DATE COMMENT '经办人证件有效期',
    agent_id_address VARCHAR(255) COMMENT '经办人证件地址',
    agent_face_front_url VARCHAR(255) COMMENT '经办人身份证正面图片URL',
    agent_face_back_url VARCHAR(255) COMMENT '经办人身份证反面图片URL',
    
    -- 公证材料
    notary_documents_json TEXT COMMENT '公证材料JSON（存储文件列表）',
    
    -- 审核状态
    status TINYINT DEFAULT 0 COMMENT '状态：0-待审核，1-审核通过，2-审核拒绝',
    audit_remark VARCHAR(255) COMMENT '审核备注',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_order_id (order_id),
    INDEX idx_borrower_type (borrower_type),
    INDEX idx_company_name (company_name),
    INDEX idx_name (name),
    INDEX idx_mobile (mobile),
    INDEX idx_status (status),
    
    CONSTRAINT fk_guarantor_order FOREIGN KEY (order_id) REFERENCES t_order (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单担保人信息表';
```

## 2. 后端配置

### 重启后端服务
```bash
# 如果使用Maven
cd e:/workspace/miniapp
mvn clean package
java -jar target/loan-miniapp.jar

# 或者在IDE中重启Spring Boot应用
```

### 验证接口
```bash
# 测试担保人列表接口
curl http://localhost:8080/public/orders/1/guarantor/list

# 预期返回
{
  "success": true,
  "data": [],
  "total": 0
}
```

## 3. 前端配置

### 添加页面路由
编辑 `wx-miniapp/miniprogram/app.json`，添加以下页面路径：

```json
{
  "pages": [
    "pages/index/index",
    "pages/order/list/index",
    "pages/order/detail/index",
    "pages/order/create/step1/index",
    "pages/order/create/step2/index",
    "pages/order/create/step3/index",
    "pages/order/create/step4/index",          // ← 新增
    "pages/order/create/step5/index",
    "pages/order/create/step6/index",
    "pages/order/create/co-borrower/index",
    "pages/order/create/guarantor/index"       // ← 新增
  ]
}
```

### 编译小程序
1. 打开微信开发者工具
2. 导入项目：`e:/workspace/miniapp/wx-miniapp`
3. 点击"编译"按钮
4. 检查控制台是否有错误

## 4. 功能测试

### 测试步骤

#### 4.1 新建订单流程
1. 进入小程序首页
2. 点击"新建订单"
3. 填写Step1（借款信息）→ 下一步
4. 填写Step2（借款人信息）→ 下一步
5. Step3（共借人信息）→ 跳过或添加 → 下一步
6. **Step4（担保人信息）** ← 新增步骤
   - 查看空状态提示
   - 点击"添加担保人"
7. 继续完成后续步骤

#### 4.2 添加担保人（个人）
1. 在Step4点击"添加担保人"
2. 选择类型：个人
3. 上传身份证正反面（测试OCR识别）
4. 填写个人信息：
   - 姓名
   - 手机号
   - 证件号码
   - 证件生效日期
   - 证件有效期
   - 证件地址
   - 居住地省市区
   - 详细地址
   - 与主借人关系
   - 婚姻状况
5. 点击"保存"
6. 返回Step4，查看担保人卡片

#### 4.3 添加担保人（对公）
1. 在Step4点击"添加担保人"
2. 选择类型：对公
3. 上传营业执照
4. 填写公司信息：
   - 公司名称
   - 公司信用代码
   - 注册地省市区
   - 详细地址
   - 经办人手机号
5. 上传经办人身份证
6. 填写经办人信息
7. 上传公证材料（可选）
8. 点击"保存"

#### 4.4 编辑担保人
1. 在Step4担保人卡片上点击"编辑"
2. 修改信息
3. 点击"保存"
4. 返回Step4，查看更新后的信息

#### 4.5 删除担保人
1. 在Step4担保人卡片上点击"删除"
2. 确认删除
3. 查看空状态

#### 4.6 从订单详情进入
1. 创建一个完整订单（包含担保人）
2. 进入订单详情页
3. 点击导航栏的"担保人信息"tab
4. 查看担保人信息
5. 测试tab切换功能

## 5. 常见问题

### 5.1 页面找不到
**问题**: 点击"添加担保人"后提示页面不存在

**解决**:
1. 检查 `app.json` 是否添加了页面路径
2. 重新编译小程序
3. 清除缓存后重试

### 5.2 接口404
**问题**: 调用担保人接口返回404

**解决**:
1. 检查后端服务是否启动
2. 检查 `OrderGuarantorController` 是否被Spring扫描
3. 查看后端日志

### 5.3 数据库错误
**问题**: 保存担保人时提示数据库错误

**解决**:
1. 检查 `t_order_guarantor` 表是否创建
2. 检查表结构是否正确
3. 检查外键约束

### 5.4 OCR识别失败
**问题**: 上传身份证后无法识别

**解决**:
1. 检查图片质量
2. 检查OCR服务是否正常
3. 查看后端日志
4. 可以手动填写信息

### 5.5 日期选择无效
**问题**: 选择日期后不显示

**解决**:
需要在 `guarantor/index.js` 中添加日期选择器事件处理：

```javascript
// 证件生效日期
onIdStartDateChange(e) {
  this.setData({
    idStartDate: e.detail.value
  });
},

// 证件有效期
onIdEndDateChange(e) {
  this.setData({
    idEndDate: e.detail.value || '长期'
  });
},

// 经办人证件生效日期
onAgentIdStartDateChange(e) {
  this.setData({
    agentIdStartDate: e.detail.value
  });
},

// 经办人证件有效期
onAgentIdEndDateChange(e) {
  this.setData({
    agentIdEndDate: e.detail.value || '长期'
  });
}
```

## 6. API文档

### 6.1 获取担保人列表
```
GET /public/orders/{orderId}/guarantor/list
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "borrowerType": "personal",
      "name": "张三",
      "phone": "13800138000",
      "idNumber": "110101199001011234",
      "idStartDate": "2020-01-01",
      "idEndDate": "2030-01-01",
      "relationship": "配偶",
      "maritalStatus": "已婚"
    }
  ],
  "total": 1
}
```

### 6.2 新增担保人
```
POST /public/orders/{orderId}/guarantor/add
Content-Type: application/json
```

**请求体**:
```json
{
  "borrowerType": "personal",
  "name": "张三",
  "phone": "13800138000",
  "idNumber": "110101199001011234",
  "idCardFront": "https://example.com/front.jpg",
  "idCardBack": "https://example.com/back.jpg",
  "idStartDate": "2020-01-01",
  "idEndDate": "2030-01-01",
  "idAddress": "北京市朝阳区",
  "residenceArea": "北京市/朝阳区/建外街道",
  "detailAddress": "建国路1号",
  "relationship": "配偶",
  "maritalStatus": "已婚"
}
```

**响应**:
```json
{
  "success": true,
  "message": "新增成功",
  "data": {
    "id": 1,
    "borrowerType": "personal",
    "name": "张三"
  }
}
```

### 6.3 更新担保人
```
PUT /public/orders/{orderId}/guarantor/{id}
Content-Type: application/json
```

### 6.4 删除担保人
```
DELETE /public/orders/{orderId}/guarantor/{id}
```

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 7. 下一步

- [ ] 添加日期选择器事件处理
- [ ] 完善表单验证
- [ ] 添加单元测试
- [ ] 优化UI样式
- [ ] 添加加载动画
- [ ] 完善错误提示

## 8. 相关文档

- [担保人模块实现总结](./guarantor-implementation-summary.md)
- [数据库设计文档](./db/co-borrower-independent-table.sql)
- [API接口文档](./api-docs.md)

---

**创建时间**: 2026-02-01  
**最后更新**: 2026-02-01  
**版本**: v1.0


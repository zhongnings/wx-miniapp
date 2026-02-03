# 共借人信息管理功能文档

## 功能概述

共借人信息管理功能支持两种类型的共借人：
1. **个人共借人**：自然人作为共借人
2. **对公共借人**：企业/公司作为共借人

## 数据库更新

### 执行DDL语句

请执行以下SQL文件来更新数据库表结构：

```bash
mysql -u root -p your_database < docs/db/update-co-borrower-schema.sql
```

或者手动执行SQL语句：

```sql
-- 1. 添加借款人类型字段
ALTER TABLE t_order_borrower 
ADD COLUMN borrower_type VARCHAR(16) COMMENT '借款人类型：personal-个人，company-对公' AFTER role_type;

-- 2. 添加证件地址字段
ALTER TABLE t_order_borrower 
ADD COLUMN id_address VARCHAR(255) COMMENT '证件地址' AFTER id_expire_date;

-- 3. 添加与主借人关系字段
ALTER TABLE t_order_borrower 
ADD COLUMN relationship VARCHAR(32) COMMENT '与主借人关系' AFTER marital_status;

-- ... 其他字段（详见 update-co-borrower-schema.sql）
```

## 后端API接口

### 1. 获取共借人列表

**接口地址：** `GET /api/order/{orderId}/co-borrower/list`

**请求参数：**
- `orderId`：订单ID（路径参数）

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "borrowerType": "personal",
      "name": "张三",
      "idType": "身份证",
      "idNumber": "110101199001011234",
      "phone": "13800138000",
      "idCardFront": "/uploads/id_front.jpg",
      "idCardBack": "/uploads/id_back.jpg",
      "residenceArea": "北京市朝阳区",
      "detailAddress": "XX路XX号",
      "relationship": "配偶",
      "maritalStatus": "已婚"
    }
  ],
  "total": 1
}
```

### 2. 获取单个共借人信息

**接口地址：** `GET /api/order/{orderId}/co-borrower/{id}`

**请求参数：**
- `orderId`：订单ID（路径参数）
- `id`：共借人ID（路径参数）

### 3. 新增共借人

**接口地址：** `POST /api/order/{orderId}/co-borrower/add`

**请求体（个人类型）：**
```json
{
  "borrowerType": "personal",
  "name": "张三",
  "idType": "身份证",
  "idNumber": "110101199001011234",
  "phone": "13800138000",
  "idStartDate": "2020-01-01",
  "idEndDate": "2030-01-01",
  "idAddress": "北京市朝阳区XX街道",
  "residenceArea": "北京市朝阳区",
  "detailAddress": "XX路XX号",
  "relationship": "配偶",
  "maritalStatus": "已婚",
  "idCardFront": "/uploads/id_front.jpg",
  "idCardBack": "/uploads/id_back.jpg"
}
```

**请求体（对公类型）：**
```json
{
  "borrowerType": "company",
  "companyName": "XX科技有限公司",
  "companyCreditCode": "91110000MA01234567",
  "companyArea": "北京市海淀区",
  "companyAddress": "中关村大街1号",
  "businessLicense": "/uploads/license.jpg",
  "agentName": "李四",
  "agentPhone": "13900139000",
  "agentIdType": "身份证",
  "agentIdNumber": "110101199002021234",
  "agentIdStartDate": "2020-01-01",
  "agentIdEndDate": "2030-01-01",
  "agentIdAddress": "北京市海淀区XX街道",
  "agentIdCardFront": "/uploads/agent_front.jpg",
  "agentIdCardBack": "/uploads/agent_back.jpg",
  "companyRelationship": "合作伙伴",
  "notaryDocuments": [
    {
      "name": "法人证明书1",
      "path": "/uploads/notary1.jpg"
    },
    {
      "name": "法人证明书2",
      "path": "/uploads/notary2.jpg"
    }
  ]
}
```

### 4. 更新共借人

**接口地址：** `PUT /api/order/{orderId}/co-borrower/{id}`

**请求参数：** 同新增接口

### 5. 删除共借人

**接口地址：** `DELETE /api/order/{orderId}/co-borrower/{id}`

### 6. 批量保存共借人（兼容step3）

**接口地址：** `POST /api/order/{orderId}/co-borrower/batch-save`

**请求体：**
```json
{
  "coBorrowers": [
    {
      "borrowerType": "personal",
      "name": "张三",
      ...
    },
    {
      "borrowerType": "company",
      "companyName": "XX公司",
      ...
    }
  ]
}
```

## 前端集成

### 小程序端调用示例

```javascript
// 保存共借人信息
save() {
  const coBorrowerData = {
    borrowerType: this.data.borrowerType,
    // 个人信息
    name: this.data.name,
    phone: this.data.phone,
    idNumber: this.data.idNumber,
    idCardFront: this.data.idCardFront,
    idCardBack: this.data.idCardBack,
    // ... 其他字段
    
    // 对公信息
    companyName: this.data.companyName,
    companyCreditCode: this.data.companyCreditCode,
    businessLicense: this.data.businessLicense,
    // ... 其他字段
  };

  wx.request({
    url: `${API_BASE}/api/order/${orderId}/co-borrower/add`,
    method: 'POST',
    data: coBorrowerData,
    success: (res) => {
      if (res.data.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        wx.navigateBack();
      } else {
        wx.showToast({ title: res.data.message, icon: 'none' });
      }
    }
  });
}
```

## 数据字段说明

### 个人共借人必填字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| borrowerType | String | 固定值：personal |
| name | String | 姓名 |
| phone | String | 手机号 |
| idNumber | String | 证件号码 |
| idCardFront | String | 身份证正面图片URL |
| idCardBack | String | 身份证反面图片URL |

### 对公共借人必填字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| borrowerType | String | 固定值：company |
| companyName | String | 公司名称 |
| companyCreditCode | String | 公司信用代码 |
| businessLicense | String | 营业执照图片URL |
| agentName | String | 经办人姓名 |
| agentIdNumber | String | 经办人证件号码 |
| agentIdCardFront | String | 经办人身份证正面 |
| agentIdCardBack | String | 经办人身份证反面 |

### 可选字段

- **个人信息：** idType, idStartDate, idEndDate, idAddress, residenceArea, detailAddress, relationship, maritalStatus
- **对公信息：** companyArea, companyAddress, agentPhone, agentIdType, agentIdStartDate, agentIdEndDate, agentIdAddress, companyRelationship, notaryDocuments

## 业务逻辑说明

1. **类型判断：** 根据 `borrowerType` 字段判断是个人还是对公
   - `personal`：个人共借人
   - `company`：对公共借人

2. **数据验证：**
   - 个人类型：必须填写姓名、手机号、证件号码，上传身份证正反面
   - 对公类型：必须填写公司名称、信用代码、经办人信息，上传营业执照和经办人身份证

3. **存储方式：**
   - 所有共借人信息存储在 `t_order_borrower` 表中
   - `role_type` 字段固定为 `coBorrower`
   - `borrower_type` 字段区分个人/对公
   - 公证材料以JSON格式存储在 `notary_documents_json` 字段

4. **查询方式：**
   - 通过 `order_id` 和 `role_type='coBorrower'` 查询订单的所有共借人
   - 支持按 `borrower_type` 过滤个人或对公共借人

## 测试建议

### 1. 单元测试

```java
@Test
public void testAddPersonalCoBorrower() {
    Step3CoBorrowerDTO dto = new Step3CoBorrowerDTO();
    dto.setBorrowerType("personal");
    dto.setName("张三");
    dto.setPhone("13800138000");
    dto.setIdNumber("110101199001011234");
    dto.setIdCardFront("/uploads/front.jpg");
    dto.setIdCardBack("/uploads/back.jpg");
    
    Map<String, Object> result = coBorrowerController.addCoBorrower(1L, dto);
    assertTrue((Boolean) result.get("success"));
}

@Test
public void testAddCompanyCoBorrower() {
    Step3CoBorrowerDTO dto = new Step3CoBorrowerDTO();
    dto.setBorrowerType("company");
    dto.setCompanyName("XX科技有限公司");
    dto.setCompanyCreditCode("91110000MA01234567");
    dto.setBusinessLicense("/uploads/license.jpg");
    dto.setAgentName("李四");
    dto.setAgentIdNumber("110101199002021234");
    dto.setAgentIdCardFront("/uploads/agent_front.jpg");
    dto.setAgentIdCardBack("/uploads/agent_back.jpg");
    
    Map<String, Object> result = coBorrowerController.addCoBorrower(1L, dto);
    assertTrue((Boolean) result.get("success"));
}
```

### 2. 接口测试（使用Postman或curl）

```bash
# 新增个人共借人
curl -X POST http://localhost:8080/api/order/1/co-borrower/add \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerType": "personal",
    "name": "张三",
    "phone": "13800138000",
    "idNumber": "110101199001011234",
    "idCardFront": "/uploads/front.jpg",
    "idCardBack": "/uploads/back.jpg"
  }'

# 获取共借人列表
curl -X GET http://localhost:8080/api/order/1/co-borrower/list
```

## 常见问题

### Q1: 如何区分个人和对公共借人？
A: 通过 `borrowerType` 字段区分，值为 `personal` 表示个人，`company` 表示对公。

### Q2: 公证材料如何存储？
A: 公证材料以JSON数组格式存储在 `notary_documents_json` 字段中，每个元素包含 `name` 和 `path` 两个属性。

### Q3: 一个订单可以有多少个共借人？
A: 理论上没有限制，但建议根据业务需求设置合理的上限（如5个）。

### Q4: 如何处理共借人的编辑和删除？
A: 使用对应的更新和删除接口，通过共借人ID进行操作。

## 更新日志

- **2025-01-29**: 初始版本，支持个人和对公两种类型的共借人
  - 新增共借人管理接口
  - 更新数据库表结构
  - 完善前端数据结构

## 相关文件

- **DDL脚本**: `docs/db/update-co-borrower-schema.sql`
- **Controller**: `src/main/java/com/example/loanminiapp/controller/CoBorrowerController.java`
- **DTO**: `src/main/java/com/example/loanminiapp/dto/step/Step3CoBorrowerDTO.java`
- **Entity**: `src/main/java/com/example/loanminiapp/entity/OrderBorrower.java`
- **Service**: `src/main/java/com/example/loanminiapp/service/OrderStepService.java`
- **前端页面**: `wx-miniapp/miniprogram/pages/order/create/co-borrower/`


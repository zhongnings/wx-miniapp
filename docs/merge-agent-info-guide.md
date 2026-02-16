# 合并经办人信息到个人信息 - 调整指南

## 概述

将对公/房产类型中独立的经办人信息字段，合并到个人信息字段中，实现字段复用。

## 数据结构调整

### 字段映射关系

| 原字段（经办人） | 新字段（复用个人信息） | 说明 |
|---|---|---|
| `agentName` | `name` | 姓名 |
| `agentIdType` | `idType` | 证件类型 |
| `agentIdNo` | `idNumber` | 证件号码 |
| `agentIdIssueDate` | `idStartDate` | 证件生效日期 |
| `agentIdExpireDate` | `idEndDate` | 证件有效期 |
| `agentIdAddress` | `idAddress` | 证件地址 |
| `agentFaceFrontUrl` | `idCardFront` | 身份证正面 |
| `agentFaceBackUrl` | `idCardBack` | 身份证反面 |
| `agentPhone2` | `phone` | 手机号 |
| `agentMobile` | `agentPhone` | 经办人手机号（保留，在公司信息部分） |
| `companyRelationship` | `relationship` | 与主借人关系 |

### 保留字段

- `agentPhone` / `agentMobile`：经办人手机号，在公司信息部分显示

### 删除字段

所有 `agent` 开头的个人信息字段（除了 `agentPhone`/`agentMobile`）

## 前端调整（小程序）

### 1. WXML 调整

#### 共借人页面 (`co-borrower/index.wxml`)
- ✅ 已完成：添加房产类型选项
- ✅ 已完成：对公类型调整为使用个人信息字段
- ✅ 已完成：新增房产类型表单

#### 担保人页面 (`guarantor/index.wxml`)
- ✅ 已完成：添加房产类型选项
- ✅ 已完成：对公类型调整为使用个人信息字段
- ✅ 已完成：新增房产类型表单

### 2. JS 调整

#### 共借人页面 (`co-borrower/index.js`)

需要调整的部分：

1. **data 数据定义**
   - 删除：`agentName`, `agentIdType`, `agentIdNumber`, `agentIdStartDate`, `agentIdEndDate`, `agentIdAddress`, `agentIdCardFront`, `agentIdCardBack`, `agentPhone2`, `companyRelationship`
   - 保留：`agentPhone`（经办人手机号）

2. **事件处理方法**
   - 删除：`selectAgentIdType`, `onAgentNameInput`, `onAgentIdNumberInput`, `onAgentIdStartDateChange`, `onAgentIdEndDateChange`, `onAgentIdAddressInput`, `uploadAgentIdCardFront`, `uploadAgentIdCardBack`, `deleteAgentIdCardFront`, `deleteAgentIdCardBack`, `onAgentPhone2Input`, `selectCompanyRelationship`
   - 对公/房产类型使用：`selectIdType`, `onNameInput`, `onIdNumberInput`, `onIdStartDateChange`, `onIdEndDateChange`, `onIdAddressInput`, `uploadIdCardFront`, `uploadIdCardBack`, `deleteIdCardFront`, `deleteIdCardBack`, `onPhoneInput`, `selectRelationship`

3. **选择器配置**
   - 删除 `companyRelationship` 相关的选择器逻辑
   - 对公/房产类型使用 `relationship` 选择器

4. **数据加载方法 (`loadCoBorrowerFromServer`, `loadCoBorrowerFromLocal`)**
   ```javascript
   // 对公/房产类型数据映射
   if (data.borrowerType === 'company' || data.borrowerType === 'property') {
     this.setData({
       // 公司/房产信息
       businessLicense: data.businessLicenseUrl,
       companyName: data.companyName,
       companyCreditCode: data.companyCreditCode,
       companyArea: data.companyArea,
       companyAddress: data.companyAddress,
       agentPhone: data.agentMobile,
       
       // 个人信息（经办人）
       idCardFront: data.faceFrontUrl,
       idCardBack: data.faceBackUrl,
       idType: data.idType,
       name: data.name,
       phone: data.mobile,
       idNumber: data.idNo,
       idStartDate: data.idIssueDate,
       idEndDate: data.idExpireDate,
       idAddress: data.idAddress,
       relationship: data.relationship,
       
       // 公证材料
       notaryDocuments: JSON.parse(data.notaryDocumentsJson || '[]')
     });
   }
   ```

5. **数据保存方法 (`save`)**
   ```javascript
   // 对公/房产类型数据组装
   if (this.data.borrowerType === 'company' || this.data.borrowerType === 'property') {
     coBorrowerData = {
       borrowerType: this.data.borrowerType,
       
       // 公司/房产信息
       businessLicenseUrl: this.data.businessLicense,
       companyName: this.data.companyName,
       companyCreditCode: this.data.companyCreditCode,
       companyArea: this.data.companyArea,
       companyAddress: this.data.companyAddress,
       agentMobile: this.data.agentPhone,
       
       // 个人信息（经办人）
       faceFrontUrl: this.data.idCardFront,
       faceBackUrl: this.data.idCardBack,
       idType: this.data.idType,
       name: this.data.name,
       mobile: this.data.phone,
       idNo: this.data.idNumber,
       idIssueDate: this.data.idStartDate,
       idExpireDate: this.data.idEndDate,
       idAddress: this.data.idAddress,
       relationship: this.data.relationship,
       
       // 公证材料
       notaryDocumentsJson: JSON.stringify(this.data.notaryDocuments)
     };
   }
   ```

6. **表单验证方法 (`validateForm`)**
   - 对公/房产类型使用个人信息字段进行验证
   - 删除经办人字段的验证逻辑

7. **类型切换方法 (`selectType`)**
   - 切换类型时清空个人信息字段（不再需要清空经办人字段）

#### 担保人页面 (`guarantor/index.js`)

调整内容与共借人页面完全相同，只是变量名从 `coBorrower` 改为 `guarantor`。

### 3. WXSS 调整

无需调整，样式保持不变。

## 后端调整

### 1. 实体类

- ✅ 已完成：`OrderCoBorrower.java`
- ✅ 已完成：`OrderGuarantor.java`

### 2. 数据库迁移

- ✅ 已完成：`db-migration-merge-agent-info.sql`

### 3. Service/Controller 调整

需要检查以下文件，确保没有使用已删除的字段：

- `CoBorrowerService.java`
- `GuarantorService.java`
- `OrderController.java`

搜索并替换：
- `agentName` → `name`
- `agentIdType` → `idType`
- `agentIdNo` → `idNo`
- `agentIdIssueDate` → `idIssueDate`
- `agentIdExpireDate` → `idExpireDate`
- `agentIdAddress` → `idAddress`
- `agentFaceFrontUrl` → `faceFrontUrl`
- `agentFaceBackUrl` → `faceBackUrl`

## 测试要点

### 功能测试

1. **个人类型**
   - 填写个人信息
   - 上传身份证照片
   - 保存并验证数据

2. **对公类型**
   - 填写公司信息
   - 填写经办人手机号
   - 上传公证材料
   - 上传身份证照片（经办人）
   - 填写个人信息（经办人）
   - 保存并验证数据

3. **房产类型**
   - 填写房产信息
   - 上传房产证
   - 上传身份证照片
   - 填写个人信息
   - 保存并验证数据

4. **类型切换**
   - 个人 → 对公 → 房产
   - 验证数据清空逻辑

5. **数据回显**
   - 保存后返回，验证数据正确回显
   - 编辑模式下验证数据加载

### 数据验证

1. 验证后端接收到的数据结构正确
2. 验证数据库存储的字段正确
3. 验证文件上传路径正确

## 注意事项

1. **数据迁移**：执行 SQL 前请备份数据库
2. **兼容性**：确保旧数据能正确迁移到新结构
3. **文件清理**：删除字段后，对应的文件可能需要清理
4. **API 接口**：确保前后端字段映射一致

## 完成状态

- [x] 后端实体类调整
- [x] 数据库迁移 SQL
- [x] 共借人页面 WXML
- [x] 担保人页面 WXML
- [ ] 共借人页面 JS
- [ ] 担保人页面 JS
- [ ] 后端 Service/Controller
- [ ] 测试验证


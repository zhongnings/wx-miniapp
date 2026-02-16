# 合并经办人信息 - 完成进度

## ✅ 已完成

### 1. 后端实体类
- ✅ `OrderCoBorrower.java` - 删除经办人字段，添加房产类型
- ✅ `OrderGuarantor.java` - 删除经办人字段，添加房产类型

### 2. 后端 DTO
- ✅ `Step3CoBorrowerDTO.java` - 删除经办人字段，添加房产类型
- ✅ `Step4GuarantorDTO.java` - 删除经办人字段，添加房产类型

### 3. 后端 Controller
- ✅ `OrderCoBorrowerController.java`
  - 修改验证逻辑（支持房产类型）
  - 修改 Entity 转 DTO 逻辑
  - 修改 DTO 转 Entity 逻辑
  - 删除经办人文件删除逻辑
  
- ✅ `OrderGuarantorController.java`
  - 修改验证逻辑（支持房产类型）
  - 修改 Entity 转 DTO 逻辑
  - 修改 DTO 转 Entity 逻辑
  - 删除经办人文件删除逻辑

### 4. 数据库迁移
- ✅ `db-migration-merge-agent-info.sql` - 完整的迁移和回滚脚本

### 5. 前端 WXML
- ✅ `co-borrower/index.wxml` - 添加房产类型，调整表单结构
- ✅ `guarantor/index.wxml` - 添加房产类型，调整表单结构

### 6. 前端 JS (部分)
- ✅ `co-borrower/index.js` - data 数据定义已调整
- ✅ `guarantor/index.js` - data 数据定义已调整

## 🔄 待完成

### 前端 JS 文件（需要大量修改）

#### co-borrower/index.js
需要删除/修改的方法：
1. ❌ 删除经办人上传方法：`uploadAgentIdCardFront`, `uploadAgentIdCardBack`, `deleteAgentIdCardFront`, `deleteAgentIdCardBack`
2. ❌ 删除经办人输入方法：`onAgentNameInput`, `onAgentPhone2Input`, `onAgentIdNumberInput`, `onAgentIdAddressInput`
3. ❌ 删除经办人选择器：`selectAgentIdType`, `onAgentIdStartDateChange`, `onAgentIdEndDateChange`, `selectCompanyRelationship`
4. ❌ 修改 OCR 方法：`uploadIdCardImageWithOcr`, `parseOcrResult`（删除 personType 参数）
5. ❌ 修改类型切换：`selectType`
6. ❌ 修改数据加载：`loadCoBorrowerFromServer`, `loadCoBorrowerFromLocal`
7. ❌ 修改数据保存：`save`
8. ❌ 修改表单验证：`validateForm`
9. ❌ 修改选择器：`onPickerItemTap`

#### guarantor/index.js
与 co-borrower/index.js 相同的修改

## 📋 调整说明

### 字段映射关系

| 场景 | 前端字段 | 后端字段 | 说明 |
|------|---------|---------|------|
| 个人类型 | name | name | 姓名 |
| 个人类型 | phone | mobile | 手机号 |
| 个人类型 | idCardFront | faceFrontUrl | 身份证正面 |
| 对公/房产 | name | name | 经办人姓名 |
| 对公/房产 | phone | mobile | 经办人手机号 |
| 对公/房产 | idCardFront | faceFrontUrl | 经办人身份证正面 |
| 对公/房产 | agentPhone | agentMobile | 经办人手机号（公司信息部分） |

### 核心逻辑

1. **个人类型**：使用个人信息字段
2. **对公/房产类型**：
   - 公司/房产信息：companyName, businessLicense 等
   - 经办人手机号：agentPhone（在公司信息部分）
   - 经办人个人信息：复用个人信息字段（name, phone, idCardFront 等）

## 🎯 下一步

继续调整前端 JS 文件，按照 `docs/js-modification-checklist.md` 中的清单逐项修改。

## 📝 注意事项

1. 执行数据库迁移前请备份数据
2. 前端 JS 修改完成后需要全面测试
3. 确保前后端字段映射一致
4. 测试所有类型切换和数据保存功能


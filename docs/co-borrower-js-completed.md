# 共借人 JS 文件调整完成清单

## ✅ 已完成的修改

### 1. data 数据定义
- ✅ 删除了所有经办人字段
- ✅ 保留 `agentMobile`（经办人手机号）

### 2. 删除的方法（共 10 个）
- ✅ `deleteAgentIdCardFront()` - 删除经办人身份证正面
- ✅ `deleteAgentIdCardBack()` - 删除经办人身份证反面
- ✅ `uploadAgentIdCardFront()` - 上传经办人身份证正面
- ✅ `uploadAgentIdCardBack()` - 上传经办人身份证反面
- ✅ `onAgentNameInput()` - 经办人姓名输入
- ✅ `onAgentPhone2Input()` - 经办人手机号2输入
- ✅ `onAgentIdNumberInput()` - 经办人证件号码输入
- ✅ `onAgentIdAddressInput()` - 经办人证件地址输入
- ✅ `selectAgentIdType()` - 选择经办人证件类型
- ✅ `onAgentIdStartDateChange()` - 经办人证件生效日期
- ✅ `onAgentIdEndDateChange()` - 经办人证件有效期
- ✅ `selectCompanyRelationship()` - 选择对公关系

### 3. 修改的方法（共 8 个）
- ✅ `applyDictData()` - 删除经办人字段的默认值设置
- ✅ `loadData()` - 删除经办人字段的数据加载
- ✅ `chooseIdCardImage()` - 删除 `personType` 参数
- ✅ `uploadIdCardImageWithOcr()` - 删除 `personType` 参数
- ✅ `parseOcrResult()` - 删除 `personType` 参数和 prefix 逻辑
- ✅ `save()` - 修改验证逻辑和数据构建逻辑

### 4. 新增的方法
- ✅ `onAgentMobileInput()` - 经办人手机号输入（替换 onAgentPhoneInput）

## 📋 字段映射说明

### 个人类型
使用个人信息字段：`name`, `phone`, `idCardFront`, `idCardBack` 等

### 对公/房产类型
- **公司/房产信息**：`companyName`, `businessLicense`, `companyArea` 等
- **经办人手机号**：`agentMobile`（在公司信息部分）
- **经办人个人信息**：复用个人信息字段 `name`, `phone`, `idCardFront` 等

## 🔄 担保人 JS 文件需要同样的调整

担保人文件 `guarantor/index.js` 需要进行完全相同的修改，只需要将：
- `coBorrower` 替换为 `guarantor`
- `共借人` 替换为 `担保人`
- 其他逻辑完全一致

## ✅ 验证要点

1. ✅ 所有 `agent` 开头的字段已删除（除了 `agentMobile`）
2. ✅ 所有 `companyRelationship` 已删除，统一使用 `relationship`
3. ✅ OCR 方法不再区分 personType
4. ✅ 保存方法支持房产类型
5. ✅ 验证逻辑支持对公/房产类型的经办人信息验证

## 🎯 下一步

使用相同的方式调整 `guarantor/index.js` 文件。


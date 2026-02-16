# JS 文件调整清单 - 合并经办人信息

## 共借人页面 (co-borrower/index.js)

### 1. data 数据定义
✅ 已完成 - 删除了以下字段：
- `agentIdCardFront`
- `agentIdCardBack`
- `agentIdType`
- `agentName`
- `agentMobile`
- `agentIdNumber`
- `agentIdStartDate`
- `agentIdEndDate`
- `agentIdAddress`
- `companyRelationship`

保留字段：
- `agentPhone` - 经办人手机号

### 2. 需要删除的方法

搜索并删除以下方法：

```javascript
// 经办人身份证上传
uploadAgentIdCardFront() { ... }
uploadAgentIdCardBack() { ... }
deleteAgentIdCardFront() { ... }
deleteAgentIdCardBack() { ... }

// 经办人信息输入
onAgentNameInput(e) { ... }
onAgentPhone2Input(e) { ... }
onAgentIdNumberInput(e) { ... }
onAgentIdAddressInput(e) { ... }

// 经办人选择器
selectAgentIdType() { ... }
onAgentIdStartDateChange(e) { ... }
onAgentIdEndDateChange(e) { ... }
selectCompanyRelationship() { ... }
```

### 3. 需要修改的方法

#### 3.1 uploadIdCardImageWithOcr
删除 `personType` 参数相关逻辑，不再区分共借人和经办人：

```javascript
// 修改前
uploadIdCardImageWithOcr(imagePath, imageType, personType = 'coBorrower') {
  const idNumber = personType === 'agent' ? (this.data.agentIdNumber || '') : (this.data.idNumber || '');
  const finalPersonType = personType === 'agent' ? 'coBorrower-agent' : 'coBorrower';
  return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType, finalPersonType);
}

// 修改后
uploadIdCardImageWithOcr(imagePath, imageType) {
  const idNumber = this.data.idNumber || '';
  return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType, 'coBorrower');
}
```

#### 3.2 parseOcrResult
删除 `personType` 参数相关逻辑：

```javascript
// 修改前
parseOcrResult(ocrData, side, personType = 'coBorrower') {
  const prefix = personType === 'agent' ? 'agent' : '';
  if (ocrData.name) {
    updates[prefix ? `${prefix}Name` : 'name'] = name;
  }
  // ... 其他字段
}

// 修改后
parseOcrResult(ocrData, side) {
  if (ocrData.name) {
    updates.name = name;
  }
  // ... 其他字段，直接使用字段名，不需要 prefix
}
```

#### 3.3 uploadIdCardFront / uploadIdCardBack
删除 `personType` 参数：

```javascript
// 修改前
uploadIdCardFront() {
  // ... 选择图片
  this.uploadIdCardImageWithOcr(tempFilePath, 'front', 'coBorrower');
}

// 修改后（保持不变，因为默认就是 'coBorrower'）
uploadIdCardFront() {
  // ... 选择图片
  this.uploadIdCardImageWithOcr(tempFilePath, 'front');
}
```

#### 3.4 selectType (类型切换)
删除经办人字段的清空逻辑：

```javascript
// 修改前
selectType(e) {
  const type = e.currentTarget.dataset.type;
  this.setData({
    borrowerType: type,
    // 清空所有字段
    agentName: '',
    agentIdType: '',
    // ... 其他经办人字段
  });
}

// 修改后
selectType(e) {
  const type = e.currentTarget.dataset.type;
  this.setData({
    borrowerType: type,
    // 只清空个人信息字段和公司信息字段
    // 不需要清空经办人字段（因为已经删除）
  });
}
```

#### 3.5 loadCoBorrowerFromServer / loadCoBorrowerFromLocal
修改对公/房产类型的数据映射：

```javascript
// 修改前
if (data.borrowerType === 'company') {
  this.setData({
    // 公司信息
    businessLicense: data.businessLicenseUrl,
    companyName: data.companyName,
    // ...
    
    // 经办人信息
    agentIdCardFront: data.agentFaceFrontUrl,
    agentIdCardBack: data.agentFaceBackUrl,
    agentName: data.agentName,
    agentIdType: data.agentIdType,
    // ...
  });
}

// 修改后
if (data.borrowerType === 'company' || data.borrowerType === 'property') {
  this.setData({
    // 公司/房产信息
    businessLicense: data.businessLicenseUrl,
    companyName: data.companyName,
    companyCreditCode: data.companyCreditCode,
    companyArea: data.companyArea,
    companyAddress: data.companyAddress,
    agentPhone: data.agentMobile,
    
    // 个人信息（经办人）- 复用个人信息字段
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

#### 3.6 save (保存方法)
修改对公/房产类型的数据组装：

```javascript
// 修改前
if (this.data.borrowerType === 'company') {
  coBorrowerData = {
    borrowerType: 'company',
    // 公司信息
    businessLicenseUrl: this.data.businessLicense,
    // ...
    
    // 经办人信息
    agentName: this.data.agentName,
    agentIdType: this.data.agentIdType,
    agentFaceFrontUrl: this.data.agentIdCardFront,
    // ...
  };
}

// 修改后
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
    
    // 个人信息（经办人）- 映射到后端字段
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

#### 3.7 validateForm (表单验证)
修改对公/房产类型的验证逻辑：

```javascript
// 修改前
if (this.data.borrowerType === 'company') {
  if (!this.data.agentName) {
    wx.showToast({ title: '请填写经办人姓名', icon: 'none' });
    return false;
  }
  // ... 其他经办人字段验证
}

// 修改后
if (this.data.borrowerType === 'company' || this.data.borrowerType === 'property') {
  // 验证公司/房产信息
  if (!this.data.businessLicense) {
    const title = this.data.borrowerType === 'company' ? '请上传营业执照' : '请上传房产证';
    wx.showToast({ title, icon: 'none' });
    return false;
  }
  
  if (!this.data.companyName) {
    const title = this.data.borrowerType === 'company' ? '请填写公司名称' : '请填写房产证号码';
    wx.showToast({ title, icon: 'none' });
    return false;
  }
  
  if (!this.data.agentPhone) {
    wx.showToast({ title: '请填写经办人手机号', icon: 'none' });
    return false;
  }
  
  // 验证个人信息（经办人）- 使用个人信息字段
  if (!this.data.idCardFront || !this.data.idCardBack) {
    wx.showToast({ title: '请上传身份证照片', icon: 'none' });
    return false;
  }
  
  if (!this.data.name) {
    wx.showToast({ title: '请填写姓名', icon: 'none' });
    return false;
  }
  
  if (!this.data.phone) {
    wx.showToast({ title: '请填写手机号', icon: 'none' });
    return false;
  }
  
  // ... 其他个人信息字段验证
}
```

#### 3.8 onPickerItemTap (选择器确认)
删除 `companyRelationship` 相关逻辑：

```javascript
// 修改前
onPickerItemTap(e) {
  const index = e.currentTarget.dataset.index;
  const value = this.data.pickerOptions[index];
  const field = this.data.pickerField;
  
  if (field === 'companyRelationship') {
    this.setData({ companyRelationship: value });
  } else if (field === 'relationship') {
    this.setData({ relationship: value });
  }
  // ...
}

// 修改后
onPickerItemTap(e) {
  const index = e.currentTarget.dataset.index;
  const value = this.data.pickerOptions[index];
  const field = this.data.pickerField;
  
  // 对公/房产类型也使用 relationship 字段
  if (field === 'relationship') {
    this.setData({ relationship: value });
  }
  // ...
}
```

## 担保人页面 (guarantor/index.js)

完全相同的修改，只是变量名从 `coBorrower` 改为 `guarantor`。

## 修改步骤建议

1. 先备份原文件
2. 按照上述清单逐个修改
3. 搜索 `agent` 关键字，确保没有遗漏
4. 搜索 `companyRelationship`，全部替换为 `relationship`
5. 测试所有功能

## 快速搜索命令

在文件中搜索以下关键字，确保全部处理：
- `agentName`
- `agentIdType`
- `agentIdNumber`
- `agentIdCardFront`
- `agentIdCardBack`
- `agentPhone2`
- `agentIdStartDate`
- `agentIdEndDate`
- `agentIdAddress`
- `companyRelationship`
- `personType === 'agent'`
- `'coBorrower-agent'`


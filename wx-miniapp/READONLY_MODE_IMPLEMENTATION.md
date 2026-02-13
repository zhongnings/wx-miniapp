# 订单只读模式实现说明

## 功能概述
根据订单状态实现只读模式：当订单状态为 **0(待提交)** 或 **2(风控驳回)** 时，以下页面将进入只读模式，禁止用户编辑和保存。

## 实现的页面

### 1. step1 - 借款信息页面
**文件路径**: `miniprogram/pages/order/create/step1/index.js`

**实现内容**:
- 在 `data` 中添加 `orderStatus` 字段用于存储订单状态
- 在 `onLoad` 方法中获取 `orderStatus` 参数，判断是否为 0 或 2
- 如果订单状态为 0 或 2，设置 `readonly: true`
- 在 `loadLoanInfoFromOrder` 方法中同步订单状态并更新只读状态
- 在 `goNext` 方法中添加只读检查，禁止保存

**关键代码**:
```javascript
// 判断是否只读：订单状态为0(待提交)或2(风控驳回)时为只读
const isReadonlyByStatus = orderStatus === 0 || orderStatus === 2;
this.setData({
  readonly: mode === 'view' || isReadonlyByStatus,
  orderStatus
});
```

---

### 2. step2 - 借款人信息页面
**文件路径**: `miniprogram/pages/order/create/step2/index.js`

**实现内容**:
- 在 `data` 中添加 `orderStatus` 字段
- 在 `onLoad` 方法中获取并判断订单状态
- 在 `loadBorrowerInfoFromOrder` 方法中同步订单状态
- 在 `uploadIdFront`、`uploadIdBack` 方法中添加只读检查
- 在 `selectResidenceArea` 方法中添加只读检查
- 在 `goNext` 方法中添加只读检查，禁止保存

**关键功能**:
- 禁止上传身份证照片
- 禁止选择居住地
- 禁止保存表单

---

### 3. co-borrower - 共借人信息页面
**文件路径**: `miniprogram/pages/order/create/co-borrower/index.js`

**实现内容**:
- 在 `data` 中添加 `readonly` 和 `orderStatus` 字段
- 在 `onLoad` 方法中获取并判断订单状态
- 在 `uploadIdCardFront`、`uploadIdCardBack` 方法中添加只读检查
- 在 `uploadAgentIdCardFront`、`uploadAgentIdCardBack` 方法中添加只读检查
- 在 `uploadBusinessLicense` 方法中添加只读检查
- 在 `save` 方法中添加只读检查，禁止保存

**关键功能**:
- 禁止上传共借人身份证照片
- 禁止上传经办人身份证照片
- 禁止上传营业执照
- 禁止保存表单

---

### 4. guarantor - 担保人信息页面
**文件路径**: `miniprogram/pages/order/create/guarantor/index.js`

**实现内容**:
- 在 `data` 中添加 `readonly` 和 `orderStatus` 字段
- 在 `onLoad` 方法中获取并判断订单状态
- 在 `uploadIdCardFront`、`uploadIdCardBack` 方法中添加只读检查
- 在 `uploadAgentIdCardFront`、`uploadAgentIdCardBack` 方法中添加只读检查
- 在 `uploadBusinessLicense` 方法中添加只读检查
- 在 `save` 方法中添加只读检查，禁止保存

**关键功能**:
- 禁止上传担保人身份证照片
- 禁止上传经办人身份证照片
- 禁止上传营业执照/房产证
- 禁止保存表单

---

### 5. step5-edit - 银行卡编辑页面
**文件路径**: `miniprogram/pages/order/create/step5-edit/index.js`

**实现内容**:
- 在 `data` 中添加 `readonly` 和 `orderStatus` 字段
- 在 `onLoad` 方法中获取并判断订单状态
- 在 `chooseBankCardImage` 方法中添加只读检查
- 在 `save` 方法中添加只读检查，禁止保存

**关键功能**:
- 禁止上传银行卡照片
- 禁止保存银行卡信息

---

### 6. step6 - 资料上传页面
**文件路径**: `miniprogram/pages/order/create/step6/index.js`

**实现内容**:
- 在 `data` 中添加 `orderStatus` 字段
- 在 `onLoad` 方法中获取并判断订单状态
- 在 `uploadAttachment` 方法中添加只读检查
- 在 `deleteAttachment` 方法中添加只读检查

**关键功能**:
- 禁止上传附件
- 禁止删除附件

---

## 订单状态说明

| 状态值 | 状态名称 | 是否只读 |
|--------|---------|---------|
| 0      | 待提交   | ✅ 是    |
| 2      | 风控驳回 | ✅ 是    |
| 其他   | 其他状态 | ❌ 否    |

---

## 使用方式

### 从订单详情页跳转时传递订单状态

在跳转到各个 step 页面时，需要在 URL 参数中传递 `orderStatus`：

```javascript
// 示例：从订单详情页跳转到 step1
wx.navigateTo({
  url: `/pages/order/create/step1/index?mode=view&id=${orderId}&orderStatus=${orderStatus}`
});
```

### 页面接收参数

各个页面在 `onLoad` 方法中会自动接收并处理 `orderStatus` 参数：

```javascript
onLoad(options) {
  const orderStatus = options?.orderStatus ? parseInt(options.orderStatus) : null;
  const isReadonlyByStatus = orderStatus === 0 || orderStatus === 2;
  this.setData({
    readonly: isReadonlyByStatus,
    orderStatus: orderStatus
  });
}
```

---

## 只读模式的表现

当页面进入只读模式时：

1. **禁止上传文件/图片**
   - 点击上传按钮时显示提示："当前为只读模式"
   
2. **禁止保存/提交**
   - 点击保存/下一步按钮时显示提示："当前为只读模式，无法保存"

3. **禁止编辑操作**
   - 禁止选择地区
   - 禁止删除已上传的文件

4. **允许查看**
   - 可以查看所有已填写的信息
   - 可以预览已上传的图片和文件

---

## 注意事项

1. **参数传递**: 确保在页面跳转时正确传递 `orderStatus` 参数
2. **状态同步**: 从后端加载数据时，会同步更新订单状态和只读状态
3. **用户体验**: 只读模式下的操作会给出明确的提示信息
4. **兼容性**: 实现保持了向后兼容，不影响现有的 `mode=view` 只读逻辑

---

## 测试建议

1. **测试场景1**: 订单状态为 0（待提交）
   - 进入各个 step 页面，验证是否为只读模式
   - 尝试上传文件、保存表单，验证是否被阻止

2. **测试场景2**: 订单状态为 2（风控驳回）
   - 进入各个 step 页面，验证是否为只读模式
   - 尝试编辑操作，验证是否被阻止

3. **测试场景3**: 订单状态为其他值
   - 验证页面是否可以正常编辑和保存

4. **测试场景4**: 从订单详情页跳转
   - 验证 tab 导航是否可以正常切换
   - 验证各个页面的只读状态是否正确

---

## 实现日期
2025-02-09

## 实现人员
AI Assistant (Cursor)


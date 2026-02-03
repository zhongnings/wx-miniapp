# 底部按钮遮挡问题修复总结

## 问题描述
共借人和担保人详情页面的底部"保存"按钮遮挡了"婚姻状况"等表单字段，导致用户无法看到和操作这些字段。

## 问题原因
内容区域的 `padding-bottom` 设置不足，无法为固定定位的底部按钮预留足够空间。

## 底部按钮高度计算

### 按钮结构
```css
.footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.save-button {
  height: 88rpx;
}
```

### 高度计算
- 上内边距：`20rpx`
- 按钮高度：`88rpx`
- 下内边距：`20rpx` (不含安全区)
- **总计：128rpx** (不含安全区域)

## 解决方案

统一所有订单创建页面的底部内边距为 **128rpx**，与底部按钮的实际高度保持一致。

### 修改的文件

#### 1. 共借人详情页
**文件**: `wx-miniapp/miniprogram/pages/order/create/co-borrower/index.wxss`

```css
/* 内容区域 */
.content {
  height: calc(100vh - 128rpx);
  padding-bottom: 128rpx; /* 底部按钮高度：20rpx(上padding) + 88rpx(按钮) + 20rpx(下padding) = 128rpx */
}
```

#### 2. 担保人详情页
**文件**: `wx-miniapp/miniprogram/pages/order/create/guarantor/index.wxss`

```css
/* 内容区域 */
.content {
  height: calc(100vh - 128rpx);
  padding-bottom: 128rpx; /* 底部按钮高度：20rpx(上padding) + 88rpx(按钮) + 20rpx(下padding) = 128rpx */
}
```

#### 3. Step1 基础样式
**文件**: `wx-miniapp/miniprogram/pages/order/create/step1/index.wxss`

```css
.create-order-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 128rpx; /* 底部按钮高度：20rpx(上padding) + 88rpx(按钮) + 20rpx(下padding) = 128rpx */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  position: relative;
}
```

### 受影响的页面

由于 step2、step3、step4 都通过 `@import '../step1/index.wxss'` 引入基础样式，所以它们会自动继承修改后的 `padding-bottom: 128rpx`。

**自动修复的页面**：
- ✅ Step1 - 借款信息
- ✅ Step2 - 借款人信息
- ✅ Step3 - 共借人信息
- ✅ Step4 - 担保人信息

**手动修复的页面**：
- ✅ 共借人详情页 (co-borrower)
- ✅ 担保人详情页 (guarantor)

## 优势

### 1. 动态适配
使用固定值 `128rpx` 而不是盲目设置更大的值（如150rpx），确保：
- 不会浪费屏幕空间
- 与底部按钮高度精确匹配
- 适配不同设备的安全区域

### 2. 统一规范
所有订单创建相关页面使用统一的底部内边距值，保持一致的用户体验。

### 3. 易于维护
如果将来需要调整底部按钮高度，只需：
1. 修改按钮样式
2. 重新计算总高度
3. 更新 `padding-bottom` 值

## 计算公式

```
padding-bottom = 上内边距 + 按钮高度 + 下内边距
               = 20rpx + 88rpx + 20rpx
               = 128rpx
```

**注意**：不包含 `env(safe-area-inset-bottom)`，因为：
- 安全区域由系统自动处理
- `padding-bottom` 只需要覆盖按钮的固定部分
- 安全区域会额外添加在底部

## 测试步骤

1. 重新编译小程序
2. 进入共借人详情页（个人类型）
3. 滚动到页面底部
4. ✅ 确认"婚姻状况"字段完全可见
5. ✅ 确认可以正常点击和选择

6. 进入担保人详情页（个人类型）
7. 滚动到页面底部
8. ✅ 确认"婚姻状况"字段完全可见
9. ✅ 确认可以正常点击和选择

10. 测试其他步骤页面（step1-step4）
11. ✅ 确认底部内容不被按钮遮挡

## 其他页面检查

已检查以下页面，确认没有类似问题：
- ✅ Step5 - 银行卡信息
- ✅ Step6 - 资料上传

这些页面使用不同的布局方式，不受此问题影响。

## 总结

通过精确计算底部按钮的实际高度（128rpx），并统一设置所有相关页面的 `padding-bottom`，彻底解决了底部按钮遮挡表单字段的问题。这种方法既精确又易于维护，避免了盲目设置过大值导致的空间浪费。

---

**修复日期**: 2026-02-01  
**修改文件数**: 3  
**影响页面数**: 6


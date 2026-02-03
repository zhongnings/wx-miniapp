# 按钮样式统一修复总结

## 修复内容

### 1. ✅ 增加担保人/共借人详情页底部内边距
**问题**: 底部"保存"按钮遮挡了"婚姻状况"字段

**解决方案**: 将 `padding-bottom` 从 128rpx 增加到 180rpx

**修改文件**:
- `wx-miniapp/miniprogram/pages/order/create/co-borrower/index.wxss`
- `wx-miniapp/miniprogram/pages/order/create/guarantor/index.wxss`

```css
/* 内容区域 */
.content {
  height: calc(100vh - 128rpx);
  padding-bottom: 180rpx; /* 底部按钮高度 + 额外空间，确保最后一个字段不被遮挡 */
}
```

### 2. ✅ 统一Step1-Step6底部按钮样式
**目标**: 将双按钮样式改为与担保人/共借人详情页一致的渐变按钮样式

**修改文件**: `wx-miniapp/miniprogram/pages/order/create/step1/index.wxss`

**修改内容**:
```css
/* 底部按钮 */
.footer-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  z-index: 999;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.btn::after {
  border: none;
}

.btn-secondary {
  background: #ffffff;
  color: #ff6f6f;
  border: 2rpx solid #ff6f6f;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%); /* 渐变背景 */
  color: #ffffff;
}
```

**变化**:
- 移除了 `height: 130rpx`（让高度自适应）
- 添加了 `.btn::after { border: none; }` 去除按钮默认边框
- 将 `.btn-primary` 的背景从纯色改为渐变：`linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%)`

### 3. ✅ 统一订单详情页底部按钮样式
**目标**: 将订单详情页的按钮样式改为与担保人/共借人详情页一致

**修改文件**: 
- `wx-miniapp/miniprogram/pages/order/detail/index.wxss`
- `wx-miniapp/miniprogram/pages/order/detail/index.wxml`

**WXSS修改**:
```css
/* 底部提交按钮 - 统一样式 */
.submit-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-text {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.submit-text::after {
  border: none;
}
```

**WXML修改**:
```xml
<!-- 底部提交按钮 -->
<view class="submit-button">
  <button class="submit-text" bindtap="onSubmit">{{buttonText}}</button>
</view>
```

**变化**:
- 外层容器改为白色背景 + 上边框
- 按钮改为圆角渐变样式
- 按钮高度统一为 88rpx
- 添加内边距 20rpx + 安全区域
- 容器 padding-bottom 从 120rpx 改为 128rpx

## 统一后的按钮样式规范

### 单按钮样式（担保人/共借人/订单详情）
```css
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  z-index: 999;
}

.save-button {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-button::after {
  border: none;
}
```

### 双按钮样式（Step1-Step6）
```css
.footer-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  z-index: 999;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.btn::after {
  border: none;
}

.btn-secondary {
  background: #ffffff;
  color: #ff6f6f;
  border: 2rpx solid #ff6f6f;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%);
  color: #ffffff;
}
```

## 统一的设计规范

### 按钮尺寸
- 高度：**88rpx**
- 圆角：**44rpx**（完全圆角）
- 字体大小：**32rpx**
- 字体粗细：**500**

### 颜色规范
- 主按钮背景：`linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%)`
- 主按钮文字：`#ffffff`
- 次按钮背景：`#ffffff`
- 次按钮文字：`#ff6f6f`
- 次按钮边框：`2rpx solid #ff6f6f`

### 容器规范
- 背景色：`#ffffff`
- 上边框：`1rpx solid #f0f0f0`
- 内边距：`20rpx 30rpx`
- 底部内边距：`calc(20rpx + env(safe-area-inset-bottom))`
- z-index：`999`

### 底部内边距规范
- Step1-Step6：`padding-bottom: 128rpx`
- 共借人详情页：`padding-bottom: 180rpx`
- 担保人详情页：`padding-bottom: 180rpx`
- 订单详情页：`padding-bottom: 128rpx`

## 修改的文件清单

1. ✅ `wx-miniapp/miniprogram/pages/order/create/co-borrower/index.wxss`
2. ✅ `wx-miniapp/miniprogram/pages/order/create/guarantor/index.wxss`
3. ✅ `wx-miniapp/miniprogram/pages/order/create/step1/index.wxss`
4. ✅ `wx-miniapp/miniprogram/pages/order/detail/index.wxss`
5. ✅ `wx-miniapp/miniprogram/pages/order/detail/index.wxml`

## 受影响的页面

### 自动继承修改（通过@import）
- ✅ Step2 - 借款人信息
- ✅ Step3 - 共借人信息
- ✅ Step4 - 担保人信息

### 直接修改
- ✅ Step1 - 借款信息
- ✅ 共借人详情页
- ✅ 担保人详情页
- ✅ 订单详情页

## 测试步骤

### 1. 测试担保人/共借人详情页
1. 进入担保人详情页（个人类型）
2. 滚动到页面底部
3. ✅ 确认"婚姻状况"字段完全可见，不被按钮遮挡
4. ✅ 确认底部按钮为圆角渐变样式

### 2. 测试Step1-Step6
1. 依次进入Step1-Step6
2. ✅ 确认"下一步"按钮为圆角渐变样式
3. ✅ 确认"上一步"按钮为白色边框样式
4. ✅ 确认按钮高度和圆角一致

### 3. 测试订单详情页
1. 进入订单详情页
2. ✅ 确认底部按钮为圆角渐变样式
3. ✅ 确认按钮样式与担保人详情页一致

## 视觉效果

### 修改前
- Step1-Step6：纯色按钮 `background: #ff6f6f`
- 订单详情页：全屏渐变按钮 `background: linear-gradient(180deg, #ff6f6f 0%, #ff8e8e 100%)`

### 修改后
- 所有页面统一：圆角渐变按钮 `background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%)`
- 统一的白色容器背景 + 上边框
- 统一的内边距和圆角

## 总结

通过本次修复，实现了：
1. ✅ 解决了担保人/共借人详情页底部按钮遮挡问题
2. ✅ 统一了所有页面的按钮样式（渐变背景、圆角、尺寸）
3. ✅ 建立了统一的按钮设计规范
4. ✅ 提升了整体UI的一致性和美观度

---

**修复日期**: 2026-02-01  
**修改文件数**: 5  
**影响页面数**: 8


# 银行选择器组件 (bank-picker)

## 组件说明

银行选择器是一个自定义的弹窗选择组件，用于在微信小程序中选择银行。组件提供搜索功能、滚动列表和选中状态显示。

## 功能特性

- ✅ 弹窗式选择器，从底部弹出
- ✅ 支持搜索银行名称
- ✅ 支持滚动浏览银行列表
- ✅ 显示当前选中的银行（红色高亮 + 勾选图标）
- ✅ 防止滚动穿透（遮罩层和底层页面不会滚动）
- ✅ 清除搜索功能
- ✅ 取消和确定按钮

## 使用方法

### 1. 在页面 JSON 中引入组件

```json
{
  "usingComponents": {
    "bank-picker": "/components/bank-picker/bank-picker"
  }
}
```

### 2. 在页面 WXML 中使用组件

```xml
<bank-picker 
  show="{{showBankPicker}}"
  bankList="{{bankList}}"
  value="{{formData.bankName}}"
  bind:confirm="onBankPickerConfirm"
  bind:cancel="onBankPickerCancel"
/>
```

### 3. 在页面 JS 中处理事件

```javascript
Page({
  data: {
    showBankPicker: false,
    bankList: [
      '中国工商银行',
      '中国建设银行',
      '中国农业银行',
      '中国银行',
      // ... 更多银行
    ],
    formData: {
      bankName: ''
    }
  },

  // 显示银行选择器
  showBankPickerDialog() {
    this.setData({
      showBankPicker: true
    });
  },

  // 确认选择
  onBankPickerConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'formData.bankName': value,
      showBankPicker: false
    });
  },

  // 取消选择
  onBankPickerCancel() {
    this.setData({
      showBankPicker: false
    });
  }
});
```

### 4. 防止滚动穿透（重要！）

为了防止选择器显示时底层页面仍然可以滚动，需要在页面中添加以下配置：

#### 4.1 在页面 WXML 中

给页面容器添加动态 class，并禁用 scroll-view 的滚动：

```xml
<view class="page-container {{showBankPicker ? 'picker-open' : ''}}">
  <scroll-view 
    class="content" 
    scroll-y="{{!showBankPicker}}" 
    enhanced="true" 
    show-scrollbar="false"
  >
    <!-- 页面内容 -->
  </scroll-view>
</view>
```

#### 4.2 在页面 WXSS 中

添加 `.picker-open` 样式来禁用页面滚动：

```css
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-container.picker-open {
  overflow: hidden;
  height: 100vh;
  position: fixed;
  width: 100%;
  touch-action: none;
}
```

## 组件属性 (Properties)

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
| show | Boolean | false | 是 | 是否显示选择器 |
| bankList | Array | [] | 是 | 银行列表数组 |
| value | String | '' | 否 | 当前选中的银行名称 |

## 组件事件 (Events)

| 事件名 | 说明 | 返回参数 |
|--------|------|----------|
| confirm | 点击确定按钮时触发 | `{ value: '选中的银行名称' }` |
| cancel | 点击取消按钮或遮罩层时触发 | 无 |

## 技术实现要点

### 1. 显示/隐藏控制

使用 CSS 的 `display: none/block` 来控制显示，而不是 `opacity` 或 `visibility`，这样可以更好地防止滚动穿透。

```css
.bank-picker-overlay {
  display: none;
}

.bank-picker-overlay.show {
  display: block;
}
```

### 2. 防止滚动穿透

采用多层防护机制：

**组件层面：**
- 遮罩层：`touch-action: none` + `overflow: hidden`
- 容器：`touch-action: pan-y`（只允许垂直滚动）
- 使用 `catchtouchmove="stopScroll"` 阻止事件冒泡

**页面层面：**
- 容器添加 `picker-open` class
- 使用 `position: fixed` 固定页面
- 使用 `touch-action: none` 禁用所有触摸事件
- `scroll-view` 的 `scroll-y` 动态设置为 `{{!showBankPicker}}`

### 3. 搜索功能

实时过滤银行列表，支持模糊搜索：

```javascript
onSearchInput(e) {
  const keyword = e.detail.value.trim().toLowerCase();
  this.setData({ searchKeyword: keyword });
  
  if (keyword === '') {
    this.setData({ filteredBankList: this.properties.bankList });
  } else {
    const filtered = this.properties.bankList.filter(bank => {
      return bank.toLowerCase().includes(keyword);
    });
    this.setData({ filteredBankList: filtered });
  }
}
```

### 4. 清除搜索按钮

使用外层 `view` 包裹，增大点击区域：

```xml
<view class="search-clear-wrapper" wx:if="{{searchKeyword}}" catchtap="clearSearch">
  <text class="search-clear">×</text>
</view>
```

```css
.search-clear-wrapper {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
```

### 5. 事件处理

- 使用 `catchtap` 而不是 `bindtap`，防止事件冒泡
- 遮罩层点击关闭：`catchtap="hide"`
- 容器内部阻止冒泡：`catchtap="stopPropagation"`

## 样式定制

### 主题色

默认使用红色主题 (`#ff6f6f`)，可以通过修改以下 CSS 变量来定制：

```css
/* 选中状态背景色 */
.bank-item.selected {
  background-color: #fff5f5;
}

/* 选中状态文字颜色 */
.bank-item.selected .bank-name {
  color: #ff6f6f;
}

/* 勾选图标颜色 */
.check-icon {
  color: #ff6f6f;
}

/* 确定按钮背景色 */
.confirm-btn {
  background-color: #ff6f6f;
}
```

### 高度调整

选择器默认高度为 `70vh`，可以根据需要调整：

```css
.bank-picker-container {
  height: 70vh; /* 可调整为 60vh, 80vh 等 */
}
```

## 常见问题

### Q1: 选择器显示时，底层页面仍然可以滚动？

**A:** 确保已经按照"防止滚动穿透"章节的步骤配置页面。关键点：
1. 页面容器添加动态 class
2. `scroll-view` 的 `scroll-y` 设置为 `{{!showBankPicker}}`
3. 添加 `.picker-open` 样式

### Q2: 清除搜索按钮点击无反应？

**A:** 确保使用了 `catchtap` 而不是 `bindtap`，并且外层有 `view` 包裹增大点击区域。

### Q3: 列表无法滚动？

**A:** 检查以下几点：
1. `scroll-view` 上不要添加 `catchtouchmove`
2. 确保 `scroll-y="true"`
3. 确保 `.bank-picker-list` 有 `height: 100%`

### Q4: 在微信开发者工具中可以滚动，但真机上不行？

**A:** 确保：
1. 使用 `enhanced="true"` 属性
2. 添加 `touch-action: pan-y` 到容器
3. 移除不必要的 `catchtouchmove`

## 参考实现

本组件参考了 `region-picker`（省市区选择器）组件的实现，两者在以下方面保持一致：

- 显示/隐藏机制
- 滚动穿透防护
- 事件处理方式
- 样式结构

## 版本历史

### v1.0.0 (2026-02-10)
- ✅ 初始版本
- ✅ 支持搜索功能
- ✅ 支持滚动列表
- ✅ 防止滚动穿透
- ✅ 清除搜索功能
- ✅ 选中状态显示

## 许可证

MIT License


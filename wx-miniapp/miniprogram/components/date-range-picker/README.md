# 日期范围选择器组件使用说明

## 概述
日期范围选择器组件用于选择证件生效日期和有效期，支持长期有效选项。

## 文件结构
```
miniprogram/
├── components/
│   └── date-range-picker/
│       ├── date-range-picker.js            # 组件逻辑
│       ├── date-range-picker.wxml          # 组件结构
│       ├── date-range-picker.wxss          # 组件样式（自动加载）
│       ├── date-range-picker.json          # 组件配置
│       └── README.md                       # 使用文档
```

## 使用方法（3步集成）

### 1. 在页面JSON中注册组件

```json
{
  "usingComponents": {
    "date-range-picker": "../../components/date-range-picker/date-range-picker"
  }
}
```

### 2. 在页面WXML中使用组件

```xml
<date-range-picker 
  show="{{showDatePicker}}" 
  title="选择证件有效期"
  start-date="{{formData.idEffectiveDate}}"
  end-date="{{formData.idExpiryDate}}"
  is-long-term="{{formData.isLongTerm}}"
  required="{{true}}"
  show-long-term="{{true}}"
  tip="请选择证件的生效日期和有效期"
  bind:close="onDatePickerClose"
  bind:confirm="onDatePickerConfirm"
  bind:change="onDatePickerChange"
/>
```

### 3. 在页面JS中处理逻辑

```javascript
Page({
  data: {
    showDatePicker: false,
    formData: {
      idEffectiveDate: '',
      idExpiryDate: '',
      isLongTerm: false
    }
  },

  // 打开日期选择器
  selectIdValidPeriod() {
    this.setData({
      showDatePicker: true
    });
  },

  // 关闭选择器
  onDatePickerClose() {
    this.setData({
      showDatePicker: false
    });
  },

  // 日期改变（实时更新）
  onDatePickerChange(e) {
    const { startDate, endDate, isLongTerm } = e.detail;
    this.setData({
      'formData.idEffectiveDate': startDate,
      'formData.idExpiryDate': endDate,
      'formData.isLongTerm': isLongTerm
    });
  },

  // 确认选择
  onDatePickerConfirm(e) {
    const { startDate, endDate, isLongTerm } = e.detail;
    this.setData({
      'formData.idEffectiveDate': startDate,
      'formData.idExpiryDate': endDate,
      'formData.isLongTerm': isLongTerm,
      showDatePicker: false
    });
    
    // 保存到本地存储
    this.saveFormData();
  }
});
```

## 组件属性（Properties）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| show | Boolean | false | 是否显示选择器 |
| title | String | '选择证件有效期' | 选择器标题 |
| start-date | String | '' | 生效日期（格式：YYYY-MM-DD） |
| end-date | String | '' | 有效期（格式：YYYY-MM-DD） |
| required | Boolean | true | 是否必填 |
| show-long-term | Boolean | true | 是否显示"长期有效"选项 |
| is-long-term | Boolean | false | 是否长期有效 |
| min-date | String | '1900-01-01' | 最小日期 |
| max-date | String | 当前+50年 | 最大日期 |
| tip | String | '请选择证件的生效日期和有效期' | 提示信息 |

## 组件事件（Events）

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| bind:close | 关闭选择器时触发 | 无 |
| bind:change | 日期改变时触发（实时） | e.detail = { startDate, endDate, isLongTerm } |
| bind:confirm | 确认选择时触发 | e.detail = { startDate, endDate, isLongTerm } |

## 使用场景

### 场景1：身份证有效期选择
```xml
<date-range-picker 
  show="{{showIdDatePicker}}" 
  title="选择身份证有效期"
  start-date="{{formData.idEffectiveDate}}"
  end-date="{{formData.idExpiryDate}}"
  show-long-term="{{true}}"
  bind:confirm="onIdDateConfirm"
/>
```

### 场景2：营业执照有效期选择
```xml
<date-range-picker 
  show="{{showLicenseDatePicker}}" 
  title="选择营业执照有效期"
  start-date="{{formData.licenseEffectiveDate}}"
  end-date="{{formData.licenseExpiryDate}}"
  show-long-term="{{true}}"
  tip="请选择营业执照的生效日期和有效期"
  bind:confirm="onLicenseDateConfirm"
/>
```

### 场景3：合同有效期选择（不支持长期）
```xml
<date-range-picker 
  show="{{showContractDatePicker}}" 
  title="选择合同有效期"
  start-date="{{formData.contractStartDate}}"
  end-date="{{formData.contractEndDate}}"
  show-long-term="{{false}}"
  tip="请选择合同的起止日期"
  bind:confirm="onContractDateConfirm"
/>
```

## 特性说明

1. **日期验证**：自动验证生效日期不能晚于有效期
2. **长期有效**：勾选后自动清空有效期
3. **实时更新**：通过`bind:change`事件实时更新父组件数据
4. **样式隔离**：组件样式自动隔离，不影响页面样式
5. **动画效果**：淡入淡出和滑动动画，提升用户体验

## 注意事项

1. 日期格式必须为 `YYYY-MM-DD`
2. 如果选择"长期有效"，`endDate` 将为空字符串
3. 组件会自动验证必填项和日期逻辑
4. 建议在 `bind:confirm` 事件中保存数据到本地存储

## 已应用页面

- ✅ step2（借款人信息）- 身份证有效期
- ✅ step3（共借人信息）- 身份证有效期
- ✅ step4（担保人信息）- 身份证有效期
- ✅ co-borrower（共借人详情）- 身份证/营业执照有效期


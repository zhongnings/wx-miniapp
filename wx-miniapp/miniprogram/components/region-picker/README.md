# 省市区选择器组件使用说明

## 概述
省市区选择器已改为标准的微信小程序自定义组件，符合小程序规范，组件样式会自动加载，无需手动引入WXSS。

## 文件结构
```
miniprogram/
├── components/
│   └── region-picker/
│       ├── region-picker.js            # 组件逻辑
│       ├── region-picker.wxml          # 组件结构
│       ├── region-picker.wxss          # 组件样式（自动加载）
│       ├── region-picker.json          # 组件配置
│       └── README.md                   # 使用文档
```

## 使用方法（3步集成）

### 1. 在页面JSON中注册组件

```json
{
  "usingComponents": {
    "region-picker": "../../components/region-picker/region-picker"
  }
}
```

### 2. 在页面WXML中使用组件

```xml
<region-picker 
  show="{{showRegionPicker}}" 
  title="{{regionPickerTitle}}"
  current-value="{{regionCurrentValue}}"
  bind:close="onRegionPickerClose"
  bind:confirm="onRegionPickerConfirm"
/>
```

### 3. 在页面JS中处理逻辑

```javascript
Page({
  data: {
    showRegionPicker: false,
    regionPickerTitle: '选择地区',
    regionCurrentValue: '',
    currentRegionType: '',
    residenceArea: '',
  },

  // 打开选择器
  selectResidenceArea() {
    this.setData({
      showRegionPicker: true,
      regionPickerTitle: '选择居住地',
      regionCurrentValue: this.data.residenceArea,
      currentRegionType: 'residence'
    });
  },

  // 关闭选择器
  onRegionPickerClose() {
    this.setData({
      showRegionPicker: false
    });
  },

  // 选择完成回调
  onRegionPickerConfirm(e) {
    const { address } = e.detail;
    const type = this.data.currentRegionType;
    
    if (type === 'residence') {
      this.setData({ residenceArea: address });
    }
    
    this.setData({
      showRegionPicker: false
    });
  }
});
```

## 组件属性（Properties）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| show | Boolean | false | 是否显示选择器 |
| title | String | '选择地区' | 选择器标题 |
| current-value | String | '' | 当前已选值，如"广东省广州市天河区" |

## 组件事件（Events）

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| bind:close | 关闭选择器时触发 | 无 |
| bind:confirm | 选择完成时触发 | e.detail = { address: '完整地址' } |

## 已应用页面
- ✅ 共借人页面 (`pages/order/create/coBorrower/index`)
  - 个人：居住地省市区
  - 对公：注册地省市区

## 为什么改为组件方式？

### 问题：WXSS跨目录引用限制
微信小程序的WXSS文件**不支持**使用`../../`跨目录的`@import`引用，这是小程序的底层限制。

### 解决方案：自定义组件
使用自定义组件后：
1. ✅ **样式自动加载**：组件的WXSS会自动生效，无需手动`@import`
2. ✅ **符合规范**：这是微信小程序推荐的代码复用方式
3. ✅ **易于维护**：组件的结构、样式、逻辑完全封装
4. ✅ **跨目录支持**：JSON中的`usingComponents`支持`../../`路径

### 文件引用规则总结
| 文件类型 | 跨目录引用 | 说明 |
|---------|-----------|------|
| WXSS | ❌ 不支持 | 不能使用`../../` @import |
| JS | ✅ 支持 | require/import支持`../../` |
| WXML | ✅ 支持 | import/include支持`../../` |
| JSON | ✅ 支持 | usingComponents支持`../../` |

## 注意事项
1. 当前实现为简化版本，省市区数据是硬编码的
2. 实际项目中应该：
   - 使用完整的省市区数据文件
   - 实现拼音排序和搜索功能
   - 从后端API获取最新的行政区划数据
3. 组件样式会自动隔离，不会影响页面样式

## 扩展建议
1. 创建完整的省市区数据文件
2. 添加拼音库支持首字母索引
3. 实现搜索功能
4. 支持只选择省份或省市（不选区县）
5. 支持默认定位到当前城市
6. 将step2、step4等其他页面也改用此组件

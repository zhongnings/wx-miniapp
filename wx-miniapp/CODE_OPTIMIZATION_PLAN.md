# 代码体积优化方案

## 问题分析

当前代码存在以下问题：
1. **13,107 个调试器请求** - 说明代码量非常大
2. **大量重复代码** - 多个页面存在相同的逻辑

## 发现的重复代码

### 1. 内联 Logger（最严重）
**位置**: 所有 step1-step5、co-borrower、guarantor 页面
**重复次数**: 至少 7 次
**代码量**: 每次约 15 行

```javascript
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  // ... 更多方法
};
```

**问题**: 已经有 `utils/logger.js`，但各页面都重复定义

### 2. 导航栏滚动位置计算（重复度高）
**位置**: step1, step2, step3, step4 页面
**重复次数**: 4 次
**代码量**: 每次约 100+ 行

```javascript
calculateTabsScroll() {
  const currentStep = this.data.currentStep;
  const systemInfo = wx.getSystemInfoSync();
  const screenWidth = systemInfo.windowWidth;
  // ... 大量重复的计算逻辑
}

onTabsScroll(e) {
  const scrollLeft = e.detail.scrollLeft;
  // ... 大量重复的滚动处理逻辑
}
```

### 3. 字典选项加载（重复度高）
**位置**: step2, co-borrower, guarantor 页面
**重复次数**: 3 次
**代码量**: 每次约 20-30 行

```javascript
async loadDictOptions() {
  const idTypeOptions = dictManager.getDictOptions('id_type');
  const relationshipOptions = dictManager.getDictOptions('relationship');
  const maritalStatusOptions = dictManager.getDictOptions('marital_status');
  // ...
}
```

### 4. 地区选择器逻辑（重复度极高）
**位置**: step2 页面
**代码量**: 约 600+ 行
**问题**: 地区选择器的所有逻辑都在 step2 中，包括：
- 省市区数据处理
- 搜索功能
- 字母索引
- 选择逻辑

**应该**: 已有 `region-picker` 组件，但 step2 没有使用

### 5. 图片上传和 OCR 识别（重复度中）
**位置**: step2, co-borrower, guarantor 页面
**代码量**: 每次约 200+ 行

```javascript
chooseImage(side) {
  wx.chooseImage({
    success: (res) => {
      // 压缩图片
      // 上传图片
      // OCR 识别
      // 填充表单
    }
  });
}
```

### 6. 表单验证逻辑（重复度中）
**位置**: step1, step2 等页面
**代码量**: 每次约 30-50 行

```javascript
validateForm() {
  const { formData } = this.data;
  const requiredFields = [
    { field: 'name', label: '姓名' },
    { field: 'idNumber', label: '身份证号' },
    // ...
  ];
  // 验证逻辑
}
```

### 7. 订单上下文初始化（重复度中）
**位置**: 所有 step 页面
**代码量**: 每次约 10-20 行

```javascript
const context = navigation.initOrderContextFromOptions(options, false);
const readonly = navigation.calculateReadonly(context.mode, context.orderStatus);
this.setData({
  readonly: readonly,
  orderId: context.orderId,
  orderStatus: context.orderStatus
});
```

## 优化方案

### 方案 1: 统一使用 utils/logger.js（立即执行）

**影响文件**: 
- step1/index.js
- step2/index.js
- step3/index.js
- step4/index.js
- step5/index.js
- co-borrower/index.js
- guarantor/index.js

**操作**:
1. 删除所有内联的 logger 定义
2. 统一改为: `const logger = require('../../../../utils/logger.js');`

**预计减少**: 约 100+ 行代码

### 方案 2: 抽取导航栏滚动逻辑为 Mixin（推荐）

**创建文件**: `utils/tabs-scroll-mixin.js`

```javascript
// 导航栏滚动 Mixin
module.exports = {
  calculateTabsScroll() {
    // 统一的滚动计算逻辑
  },
  
  onTabsScroll(e) {
    // 统一的滚动处理逻辑
  },
  
  onTabClick(e) {
    // 统一的 tab 点击逻辑
  }
};
```

**使用方式**:
```javascript
const tabsScrollMixin = require('../../../../utils/tabs-scroll-mixin.js');

Page({
  ...tabsScrollMixin,
  
  data: {
    currentStep: 1,
    // ...
  },
  
  onLoad(options) {
    // 页面特定逻辑
    this.calculateTabsScroll();
  }
});
```

**预计减少**: 约 400+ 行代码

### 方案 3: 抽取表单验证为通用工具（推荐）

**创建文件**: `utils/form-validator.js`

```javascript
class FormValidator {
  static validate(formData, rules) {
    for (let rule of rules) {
      if (!formData[rule.field]) {
        wx.showToast({
          title: `请输入${rule.label}`,
          icon: 'none'
        });
        return false;
      }
      
      // 自定义验证规则
      if (rule.validator && !rule.validator(formData[rule.field])) {
        wx.showToast({
          title: rule.message || `${rule.label}格式不正确`,
          icon: 'none'
        });
        return false;
      }
    }
    return true;
  }
  
  static validateIdCard(idCard) {
    // 身份证验证逻辑
  }
  
  static validatePhone(phone) {
    // 手机号验证逻辑
  }
}

module.exports = FormValidator;
```

**使用方式**:
```javascript
const FormValidator = require('../../../../utils/form-validator.js');

onSubmit() {
  const rules = [
    { field: 'name', label: '姓名' },
    { field: 'idNumber', label: '身份证号', validator: FormValidator.validateIdCard }
  ];
  
  if (!FormValidator.validate(this.data.formData, rules)) {
    return;
  }
  
  // 提交逻辑
}
```

**预计减少**: 约 150+ 行代码

### 方案 4: 抽取图片上传和 OCR 为通用工具（推荐）

**创建文件**: `utils/image-ocr-helper.js`

```javascript
class ImageOcrHelper {
  /**
   * 选择并上传图片，支持 OCR 识别
   */
  static async chooseAndUploadImage(options = {}) {
    const {
      imageType = 'idCard',  // idCard, businessLicense
      side = 'front',        // front, back
      orderId,
      enableOcr = true
    } = options;
    
    // 1. 选择图片
    const tempFilePath = await this._chooseImage();
    
    // 2. 压缩图片
    const compressedPath = await this._compressImage(tempFilePath);
    
    // 3. 上传图片
    const uploadUrl = await this._uploadImage(compressedPath, imageType, orderId);
    
    // 4. OCR 识别（可选）
    let ocrData = null;
    if (enableOcr) {
      ocrData = await this._performOcr(compressedPath, side);
    }
    
    return {
      url: uploadUrl,
      ocrData: ocrData
    };
  }
  
  static async _chooseImage() { /* ... */ }
  static async _compressImage(path) { /* ... */ }
  static async _uploadImage(path, type, orderId) { /* ... */ }
  static async _performOcr(path, side) { /* ... */ }
}

module.exports = ImageOcrHelper;
```

**使用方式**:
```javascript
const ImageOcrHelper = require('../../../../utils/image-ocr-helper.js');

async onChooseIdCardFront() {
  try {
    const result = await ImageOcrHelper.chooseAndUploadImage({
      imageType: 'idCard',
      side: 'front',
      orderId: this.data.orderId,
      enableOcr: true
    });
    
    this.setData({
      'formData.idFrontImage': result.url,
      'formData.name': result.ocrData?.name,
      'formData.idNumber': result.ocrData?.idNumber
    });
  } catch (err) {
    wx.showToast({ title: '上传失败', icon: 'none' });
  }
}
```

**预计减少**: 约 600+ 行代码

### 方案 5: step2 使用 region-picker 组件（推荐）

**问题**: step2 有 600+ 行地区选择器代码，但已有 `region-picker` 组件

**操作**:
1. 在 step2/index.json 中引入组件
2. 删除 step2 中的地区选择器逻辑
3. 使用组件替代

**预计减少**: 约 600+ 行代码

### 方案 6: 创建订单页面基类 Mixin（高级）

**创建文件**: `utils/order-page-mixin.js`

```javascript
// 订单页面通用 Mixin
module.exports = {
  data: {
    orderId: null,
    orderStatus: null,
    readonly: false,
    fromOrderDetail: false
  },
  
  /**
   * 初始化订单上下文
   */
  initOrderContext(options) {
    const navigation = require('./navigation.js');
    const context = navigation.initOrderContextFromOptions(options, false);
    const readonly = navigation.calculateReadonly(context.mode, context.orderStatus);
    
    this.setData({
      readonly: readonly,
      orderId: context.orderId,
      orderStatus: context.orderStatus,
      fromOrderDetail: context.fromOrderDetail
    });
    
    return context;
  },
  
  /**
   * 保存并跳转到下一步
   */
  async saveAndNext(nextStep, saveMethod) {
    try {
      wx.showLoading({ title: '保存中...', mask: true });
      
      const result = await saveMethod.call(this);
      
      // 清除缓存
      this.clearCache();
      
      // 跳转
      wx.redirectTo({
        url: `/pages/order/create/step${nextStep}/index?orderId=${result.orderId}`
      });
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  
  /**
   * 清除缓存
   */
  clearCache() {
    // 清除逻辑
  }
};
```

**预计减少**: 约 200+ 行代码

## 优化效果预估

| 优化项 | 减少代码行数 | 优先级 | 难度 |
|--------|-------------|--------|------|
| 1. 统一使用 logger | 100+ | 高 | 低 |
| 2. 导航栏滚动 Mixin | 400+ | 高 | 中 |
| 3. 表单验证工具 | 150+ | 中 | 低 |
| 4. 图片上传 OCR 工具 | 600+ | 高 | 中 |
| 5. 使用 region-picker | 600+ | 高 | 低 |
| 6. 订单页面基类 | 200+ | 中 | 中 |
| **总计** | **2000+** | - | - |

## 实施建议

### 阶段 1: 快速优化（1-2小时）
- ✅ 方案 1: 统一使用 logger（立即见效）
- ✅ 方案 5: step2 使用 region-picker 组件

**预计减少**: 700+ 行代码

### 阶段 2: 核心优化（3-4小时）
- ✅ 方案 2: 导航栏滚动 Mixin
- ✅ 方案 4: 图片上传 OCR 工具

**预计减少**: 1000+ 行代码

### 阶段 3: 深度优化（2-3小时）
- ✅ 方案 3: 表单验证工具
- ✅ 方案 6: 订单页面基类

**预计减少**: 350+ 行代码

## 注意事项

1. **测试充分**: 每个优化后都要测试相关功能
2. **逐步进行**: 不要一次性修改所有文件
3. **保留备份**: 修改前备份原文件
4. **代码审查**: 优化后进行代码审查
5. **性能监控**: 关注优化后的性能变化

## 其他优化建议

### 1. 开启生产环境模式
在 `utils/logger.js` 中，根据环境动态设置 DEBUG：

```javascript
const config = require('../config/config.js');
const DEBUG = config.DEBUG && config.ENV !== 'production';
```

### 2. 移除未使用的代码
- 检查是否有未使用的方法
- 删除注释掉的代码
- 移除 console.log

### 3. 代码分割
- 将大文件拆分为多个小文件
- 按功能模块组织代码

### 4. 使用 ES6+ 特性
- 使用解构赋值减少代码
- 使用箭头函数简化语法
- 使用模板字符串

## 总结

通过以上优化，预计可以：
- **减少 2000+ 行重复代码**
- **降低包体积 20-30%**
- **提升代码可维护性**
- **减少 bug 风险**

建议优先执行阶段 1 和阶段 2 的优化，这些优化效果最明显，风险最低。


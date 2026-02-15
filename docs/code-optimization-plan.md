# 代码优化计划

## 优化目标
1. 清理过多的调试日志
2. 移除不必要的注释和备份代码
3. 优化代码结构和性能
4. 统一日志规范

## 一、日志优化

### 1.1 日志分类原则
- **保留**: `logger.error()` - 错误日志，用于排查问题
- **保留**: 关键业务节点的 `logger.info()` - 如订单创建、数据保存等
- **删除**: 过多的 `logger.debug()` 和 `logger.log()` - 调试日志
- **删除**: 详细的数据结构打印 - 如 `logger.info('数据详情', { ...大量字段 })`

### 1.2 需要清理的文件

#### step2/index.js (借款人信息页)
**问题**: 
- OCR 识别过程有大量详细日志（每个步骤都打印）
- 导航栏滚动计算有冗长的日志输出
- 数据加载、解析过程日志过多

**优化建议**:
```javascript
// 删除这类详细的调试日志
logger.debug('[OCR] 开始转换图片为base64', { imagePath });
logger.debug('[OCR] 图片转base64成功', { imagePath, base64Length: res.data?.length });

// 保留关键节点日志
logger.info('[OCR] 识别成功', { side });
logger.error('[OCR] 识别失败', { side, error });
```

**具体位置**:
- 第 73-77 行: 身份证图片上传相关日志
- 第 400-600 行: OCR 识别详细日志
- 第 150-250 行: 导航栏滚动计算日志（可以完全删除或简化）

#### region-picker.js (地区选择组件)
**问题**:
- 每次数据加载都打印详细日志
- 搜索、选择操作日志过多
- 数据解析过程日志冗余

**优化建议**:
```javascript
// 删除
logger.debug('[地区选择] 加载省份数据', { count: provinces.length });
logger.debug('[地区选择] 加载城市数据', { provinceCode, count: cities.length });

// 保留
logger.error('[地区选择] 加载失败', { error });
```

#### step5/index.js 和 step5-edit/index.js (银行卡信息页)
**问题**:
- 银行卡加载、保存过程日志详细
- 图片上传每个步骤都打印

**优化建议**:
- 只保留成功/失败的关键日志
- 删除中间步骤的详细日志

### 1.3 导航栏滚动日志（可完全删除）
所有 step 页面都有详细的导航栏滚动计算日志，这些是调试用的，可以完全删除：

```javascript
// 删除这整段
logger.info('========== 导航栏滚动位置计算 ==========');
logger.info('页面信息:', { ... });
logger.info('屏幕信息:', { ... });
logger.info('Tab尺寸信息:', { ... });
// ... 等等
logger.info('========================================');
```

**影响文件**:
- step1/index.js
- step2/index.js
- step3/index.js
- step4/index.js
- step5/index.js
- step6/index.js

## 二、代码结构优化

### 2.1 移除冗余注释

#### 过度注释的代码
```javascript
// 删除这类显而易见的注释
// 姓名输入
onNameInput(e) {
  this.setData({
    'formData.name': e.detail.value
  });
}

// 保留这类有价值的注释
// 注意：微信OCR的side定义与我们相反，需要转换
const ocrType = side === 'front' ? 'back' : 'front';
```

### 2.2 移除备份代码和注释掉的代码

搜索并删除：
- 被注释掉的大段代码
- `// TODO` 但已经完成的任务
- `// 旧逻辑` 等备份代码

### 2.3 统一错误处理

**当前问题**: 错误处理不统一，有的用 `wx.showToast`，有的只打印日志

**优化建议**: 创建统一的错误处理工具
```javascript
// utils/error-handler.js
function handleError(error, options = {}) {
  const { 
    showToast = true, 
    title = '操作失败',
    logLevel = 'error' 
  } = options;
  
  // 记录日志
  if (logLevel === 'error') {
    logger.error(title, error);
  }
  
  // 显示提示
  if (showToast) {
    wx.showToast({
      title: error.message || title,
      icon: 'none'
    });
  }
}
```

## 三、性能优化

### 3.1 图片缓存优化（已完成）
✅ 银行 logo 改为按需加载
✅ 图片缓存机制完善

### 3.2 数据缓存优化

**当前问题**: 
- 每次进入页面都从本地存储读取数据
- 没有内存缓存，频繁读写 Storage

**优化建议**:
```javascript
// 在 app.js 中添加内存缓存
globalData: {
  // 内存缓存（避免频繁读写 Storage）
  formDataCache: {
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null
  }
}

// 读取时先从内存缓存读取
function getFormData(step) {
  const app = getApp();
  if (app.globalData.formDataCache[step]) {
    return app.globalData.formDataCache[step];
  }
  const data = wx.getStorageSync(`orderFormData_${step}`);
  app.globalData.formDataCache[step] = data;
  return data;
}
```

### 3.3 地区数据优化（已完成）
✅ 改为从后端按需加载
✅ 移除前端硬编码数据

### 3.4 减少不必要的 setData

**当前问题**: 有些地方频繁调用 setData

**优化建议**:
```javascript
// 不好的做法
this.setData({ 'formData.name': name });
this.setData({ 'formData.idNumber': idNumber });
this.setData({ 'formData.phone': phone });

// 好的做法
this.setData({
  'formData.name': name,
  'formData.idNumber': idNumber,
  'formData.phone': phone
});
```

## 四、代码规范优化

### 4.1 统一命名规范

**当前问题**: 命名不统一
- 有的用 `orderId`，有的用 `order_id`
- 有的用 `bankCard`，有的用 `bank_card`

**优化建议**: 统一使用驼峰命名（camelCase）

### 4.2 统一函数注释

**当前问题**: 有的函数有注释，有的没有

**优化建议**: 关键函数添加 JSDoc 注释
```javascript
/**
 * 上传身份证图片到服务器
 * @param {string} imagePath - 图片本地路径
 * @param {string} imageType - 图片类型：'idFront' 或 'idBack'
 * @returns {Promise<Object>} 返回上传结果，包含url和ocr结果
 */
uploadIdCardImage(imagePath, imageType) {
  // ...
}
```

### 4.3 提取魔法数字

**当前问题**: 代码中有很多硬编码的数字

**优化建议**:
```javascript
// 不好
if (fileSize > 2 * 1024 * 1024) { ... }

// 好
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
if (fileSize > MAX_IMAGE_SIZE) { ... }
```

## 五、具体优化清单

### 高优先级（建议立即优化）

- [ ] **清理 step2/index.js 的 OCR 日志** - 删除详细的调试日志，只保留关键节点
- [ ] **删除所有页面的导航栏滚动计算日志** - 这些是调试用的，可以完全删除
- [ ] **清理 region-picker.js 的日志** - 删除数据加载、解析的详细日志
- [ ] **清理 step5/step5-edit 的日志** - 删除银行卡操作的详细日志

### 中优先级（可以逐步优化）

- [ ] **移除冗余注释** - 删除显而易见的注释
- [ ] **移除备份代码** - 删除注释掉的代码和 TODO
- [ ] **统一错误处理** - 创建统一的错误处理工具
- [ ] **优化 setData 调用** - 合并多次 setData

### 低优先级（后续优化）

- [ ] **添加内存缓存** - 减少 Storage 读写
- [ ] **统一命名规范** - 统一使用驼峰命名
- [ ] **添加函数注释** - 关键函数添加 JSDoc
- [ ] **提取魔法数字** - 定义常量

## 六、优化后的预期效果

### 代码质量
- ✅ 日志输出减少 70%，只保留关键日志
- ✅ 代码行数减少 10-15%
- ✅ 代码可读性提升

### 性能提升
- ✅ 减少不必要的日志输出，提升运行速度
- ✅ 优化 setData 调用，减少渲染次数
- ✅ 添加内存缓存，减少 Storage 读写

### 维护性
- ✅ 代码更简洁，易于维护
- ✅ 日志更清晰，易于排查问题
- ✅ 规范统一，易于团队协作

## 七、执行计划

### 第一阶段：日志清理（1-2小时）
1. 清理 step2/index.js 的 OCR 日志
2. 删除所有页面的导航栏滚动日志
3. 清理 region-picker.js 的日志
4. 清理 step5/step5-edit 的日志

### 第二阶段：代码优化（2-3小时）
1. 移除冗余注释和备份代码
2. 统一错误处理
3. 优化 setData 调用

### 第三阶段：性能优化（可选，3-4小时）
1. 添加内存缓存
2. 统一命名规范
3. 添加函数注释

## 八、注意事项

1. **保留错误日志**: 所有 `logger.error()` 都要保留
2. **保留关键业务日志**: 订单创建、数据保存等关键操作的日志要保留
3. **测试验证**: 优化后要充分测试，确保功能正常
4. **备份代码**: 优化前先备份代码或提交 Git

## 九、日志规范（优化后）

### 推荐的日志使用场景

```javascript
// ✅ 保留：关键业务操作
logger.info('[订单] 创建订单成功', { orderId });
logger.info('[上传] 图片上传成功', { url });
logger.info('[OCR] 识别成功', { side });

// ✅ 保留：错误日志
logger.error('[订单] 创建订单失败', { error });
logger.error('[上传] 图片上传失败', { error });

// ❌ 删除：详细的调试日志
logger.debug('[OCR] 开始转换图片为base64', { imagePath });
logger.debug('[OCR] 图片转base64成功', { base64Length });
logger.log('[数据] 表单数据', { formData });

// ❌ 删除：UI 相关的详细日志
logger.info('========== 导航栏滚动位置计算 ==========');
logger.info('屏幕信息:', { screenWidth, screenHeight });
```

### 日志格式规范

```javascript
// 统一格式：[模块] 操作描述
logger.info('[订单] 创建成功', { orderId });
logger.error('[上传] 失败', { error });

// 不推荐
logger.info('订单创建成功', orderId);
logger.error('上传失败:', error);
```


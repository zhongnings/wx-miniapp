# 小程序包体积优化指南

## 当前状态分析

### 1. 代码重复问题
- **内联 Logger**：9个页面文件都内联了相同的 logger 代码（约30行/文件）
  - `step1/index.js`, `step2/index.js`, `step3/index.js`, `step4/index.js`, `step5/index.js`, `step5-edit/index.js`, `step6/index.js`
  - `co-borrower/index.js`, `guarantor/index.js`
  
- **估算节省**：移除内联 logger 可节省约 **10-15KB**
- **详细指南**：参见 `docs/remove-inline-logger.md`

### 2. 图片资源
- ~~当前图片总大小：**147KB**（3个文件）~~ **已优化**
  - ~~`static/empty.png`~~
  - ~~`static/modify_icon.png`~~
  - ~~`static/delete_icon.png`~~
- **已移至后端**，从后端动态加载，节省 147KB

## 已完成的优化

### ✅ 1. 统一 DEBUG 配置
- 在 `config/config.js` 中添加了统一的 `DEBUG` 开关
- 修改 `utils/logger.js` 从配置文件读取 DEBUG 状态
- **生产环境部署时，只需将 `config.js` 中的 `DEBUG` 改为 `false`**

### ✅ 2. 图片资源移至后端
- 将 `empty.png`、`modify_icon.png`、`delete_icon.png` 移至后端 `/img` 目录
- 在 `config/placeholders.js` 中添加了这些图片的配置
- 修改共借人和担保人页面使用配置中的图片URL
- **节省包体积：147KB**
- **优化方式**：参照身份证占位图和银行Logo的加载逻辑，从后端动态加载

## 待优化项目

### 🔧 1. 移除内联 Logger（高优先级）

**影响文件**：
- `pages/order/create/step1/index.js`
- `pages/order/create/step2/index.js`
- `pages/order/create/step3/index.js`
- `pages/order/create/step4/index.js`
- `pages/order/create/step5/index.js`
- `pages/order/create/step5-edit/index.js`
- `pages/order/create/step6/index.js`
- `pages/order/create/co-borrower/index.js`
- `pages/order/create/guarantor/index.js`

**优化方案**：
```javascript
// 替换前（每个文件约30行）
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  // ... 更多方法
};

// 替换后（1行）
const logger = require('../../../../utils/logger.js');
```

**详细指南**：参见 `docs/remove-inline-logger.md`

**预计节省**：10-15KB

---

### ~~🔧 2. 图片优化（中优先级）~~ ✅ 已完成

**已完成优化**：
- ✅ 将 3 个图片（147KB）移至后端 `/img` 目录
- ✅ 在 `config/placeholders.js` 中添加配置
- ✅ 修改共借人和担保人页面使用配置中的图片URL
- ✅ 参照身份证占位图和银行Logo的加载逻辑实现

**实际节省**：147KB

---

### 🔧 3. 代码分包（中优先级）

**当前问题**：
- 所有页面都在主包中
- 订单创建流程（step1-6）占用较大空间

**优化方案**：
```json
// app.json
{
  "pages": [
    "pages/home/index",
    "pages/login/index",
    "pages/order/list/index"
  ],
  "subpackages": [
    {
      "root": "pages/order/create",
      "name": "orderCreate",
      "pages": [
        "step1/index",
        "step2/index",
        "step3/index",
        "step4/index",
        "step5/index",
        "step5-edit/index",
        "step6/index",
        "co-borrower/index",
        "guarantor/index"
      ]
    },
    {
      "root": "pages/order/detail",
      "name": "orderDetail",
      "pages": [
        "index",
        "fulldetail/index",
        "voucher-list/index",
        "voucher-confirm/index",
        "voucher-add/index",
        "payee-select/index",
        "progress/index",
        "contracts/index"
      ]
    }
  ]
}
```

**预计效果**：
- 主包体积减少 60-70%
- 首次加载速度提升 40-50%

---

### 🔧 4. 移除未使用的代码（低优先级）

**检查项**：
- `utils/getLogger.js` - 似乎未被使用
- `utils/region-picker-mixin.js` - 检查是否被使用
- 检查是否有未使用的组件

**优化方案**：
```bash
# 使用工具检查未使用的文件
# 可以使用微信开发者工具的"代码依赖分析"功能
```

**预计节省**：5-10KB

---

### 🔧 5. 压缩和混淆（低优先级）

**当前状态**：
- 代码中包含大量注释和日志
- 变量名较长，可读性好但体积大

**优化方案**：
1. **移除注释**：生产环境移除所有注释
2. **压缩代码**：使用 UglifyJS 或 Terser
3. **Tree Shaking**：移除未使用的导出

**预计节省**：20-30KB

---

### 🔧 6. 数据字典优化（低优先级）

**当前问题**：
- `dict-manager.js` 中包含大量本地默认值
- 这些默认值在有网络时不会被使用

**优化方案**：
```javascript
// 将默认值移到单独的文件，按需加载
// dict-manager.js
const defaultDict = require('./dict-defaults.js');

// 或者使用更精简的默认值
const defaultDict = {
  id_type: ['身份证'],
  marital_status: ['未婚'],
  // 只保留最常用的一个选项
};
```

**预计节省**：2-5KB

---

## 优化优先级总结

### 🔴 高优先级（立即执行）
1. **移除内联 Logger** - 节省 10-15KB，工作量小
2. **生产环境关闭 DEBUG** - 在 `config.js` 中设置 `DEBUG = false`

### 🟡 中优先级（近期执行）
3. **图片优化** - 节省 50-100KB，工作量中等
4. **代码分包** - 提升加载速度，工作量中等

### 🟢 低优先级（长期优化）
5. **移除未使用代码** - 节省 5-10KB
6. **压缩和混淆** - 节省 20-30KB
7. **数据字典优化** - 节省 2-5KB

---

## 实施步骤

### 第一阶段：快速优化（1-2小时）
1. ✅ 统一 DEBUG 配置（已完成）
2. ✅ 图片移至后端（已完成，节省 147KB）
3. 替换所有内联 logger 为 `require('../../../../utils/logger.js')`（详见 `docs/remove-inline-logger.md`）
4. 生产环境设置 `DEBUG = false`

**预期效果**：包体积减少 147KB + 10-15KB = **157-162KB**

### 第二阶段：分包优化（3-4小时）
1. 规划分包策略
2. 修改 `app.json` 配置
3. 测试分包加载
4. 优化分包预加载策略

**预期效果**：主包体积减少 60-70%，首屏加载速度提升 40-50%

### 第三阶段：深度优化（长期）
1. 移除未使用代码（5-10KB）
2. 压缩和混淆（20-30KB）
3. 数据字典优化（2-5KB）

---

## 监控和测试

### 包体积监控
```bash
# 使用微信开发者工具查看
# 工具 -> 构建 npm -> 查看包体积分析
```

### 性能测试
- 首屏加载时间
- 页面切换流畅度
- 网络请求数量
- 内存占用

---

## 注意事项

1. **备份代码**：优化前务必备份或提交代码
2. **充分测试**：每次优化后进行完整测试
3. **逐步优化**：不要一次性修改太多，便于定位问题
4. **保留日志**：生产环境虽然关闭 DEBUG，但 error 日志仍需保留
5. **监控效果**：记录优化前后的包体积和性能指标

---

## 长期建议

1. **建立代码规范**：避免重复代码
2. **定期清理**：定期检查和移除未使用的代码
3. **性能监控**：建立性能监控体系
4. **持续优化**：将优化作为日常开发的一部分

---

## 总结

通过以上优化，预计可以：
- **减少包体积**：157-200KB（约 25-35%）
  - ✅ 图片移至后端：147KB（已完成）
  - 移除内联 logger：10-15KB
  - 其他优化：30-40KB
- **提升加载速度**：40-50%（通过分包优化）
- **改善用户体验**：页面响应更快，操作更流畅

**当前进度**：
- ✅ 统一 DEBUG 配置
- ✅ 图片资源优化（147KB）
- 🔄 待完成：移除内联 logger（10-15KB）

**建议下一步**：执行第一阶段剩余优化（移除内联 logger），详见 `docs/remove-inline-logger.md`


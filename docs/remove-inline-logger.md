# 移除内联 Logger 优化指南

## 需要修改的文件列表

以下文件都包含内联的 logger 代码，需要替换为统一的 logger 模块：

1. `pages/order/create/step1/index.js`
2. `pages/order/create/step2/index.js`
3. `pages/order/create/step3/index.js`
4. `pages/order/create/step4/index.js`
5. `pages/order/create/step5/index.js`
6. `pages/order/create/step5-edit/index.js`
7. `pages/order/create/step6/index.js`
8. `pages/order/create/co-borrower/index.js`
9. `pages/order/create/guarantor/index.js`

## 替换步骤

### 1. 查找内联 Logger 代码

在每个文件的开头查找以下代码块：

```javascript
// 内联 logger，避免微信小程序预加载时路径解析问题（仅调试用）
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args),
  request: (url, method, data) => DEBUG && console.log('[REQUEST]', { url, method, data, time: new Date().toLocaleTimeString() }),
  response: (url, statusCode, data) => DEBUG && console.log('[RESPONSE]', { url, statusCode, data, time: new Date().toLocaleTimeString() }),
  table: (data) => DEBUG && console.table(data),
  group: (label, callback) => {
    if (DEBUG) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};
```

或者简化版本：

```javascript
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args)
};
```

### 2. 替换为统一 Logger

根据文件所在位置，使用正确的相对路径：

#### 对于 step1-6 和 co-borrower、guarantor 页面：
```javascript
const logger = require('../../../../utils/logger.js');
```

#### 对于 utils 目录下的文件：
```javascript
const logger = require('./logger.js');
```

### 3. 验证替换

替换后，确保：
1. 文件顶部只有一行 `const logger = require('...');`
2. 删除了所有 `const DEBUG = true;` 和内联的 logger 对象
3. 其他代码中使用 `logger.log()`, `logger.info()` 等方法的地方保持不变

## 自动化替换（推荐）

可以使用以下正则表达式进行批量替换：

### 查找模式：
```regex
// 内联 logger.*?\n(?:const DEBUG = true;\n)?const logger = \{[\s\S]*?\};
```

### 替换为：
```javascript
const logger = require('../../../../utils/logger.js');
```

**注意**：替换前请确认路径是否正确！

## 预期效果

- **代码行数减少**：每个文件减少约 15-30 行
- **包体积减少**：总计减少约 10-15KB
- **维护性提升**：统一管理日志配置，修改一处即可生效
- **生产优化**：在 `config.js` 中设置 `DEBUG = false` 即可关闭所有调试日志

## 测试清单

替换完成后，请测试以下功能：

- [ ] 页面正常加载
- [ ] 日志正常输出（开发环境）
- [ ] 错误日志始终输出
- [ ] 生产环境关闭 DEBUG 后，调试日志不再输出
- [ ] 所有页面功能正常

## 注意事项

1. **备份代码**：替换前务必备份或提交代码
2. **逐个测试**：建议逐个文件替换并测试，避免批量替换后难以定位问题
3. **路径检查**：确保 require 路径正确，否则会导致运行时错误
4. **保留注释**：如果有重要的注释，请保留


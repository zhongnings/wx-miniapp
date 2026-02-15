# API 地址统一管理说明

## 问题
之前 API 基础地址 `http://127.0.0.1:8081` 散落在多个文件中：
- `app.js` - globalData.apiBaseUrl
- `utils/request.js` - BASE_URL 常量
- `api/region.js` - getApiBaseUrl() 函数中的默认值
- `utils/region-cache.js` - CACHE_EXPIRE_TIME 常量

这导致：
1. 修改 API 地址需要改多个文件
2. 容易遗漏某个文件
3. 不同文件可能配置不一致

## 解决方案

### 1. 创建统一配置文件
**文件：** `config/config.js`

```javascript
const API_BASE_URL = 'http://127.0.0.1:8081';
const REQUEST_TIMEOUT = 30000;
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

module.exports = {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  CACHE_EXPIRE_TIME,
};
```

### 2. 所有文件统一引用配置

**修改的文件：**

#### `app.js`
```javascript
const config = require('/config/config');

App({
  globalData: {
    apiBaseUrl: config.API_BASE_URL,
    // ...
  }
});
```

#### `utils/request.js`
```javascript
const config = require('../config/config');
const BASE_URL = config.API_BASE_URL;
```

#### `api/region.js`
```javascript
const config = require('../config/config');

function getApiBaseUrl() {
  return config.API_BASE_URL;
}
```

#### `utils/region-cache.js`
```javascript
const config = require('../config/config');
const CACHE_EXPIRE_TIME = config.CACHE_EXPIRE_TIME;
```

## 使用方法

### 修改 API 地址
只需要修改 `config/config.js` 中的 `API_BASE_URL` 即可：

```javascript
// 开发环境
const API_BASE_URL = 'http://127.0.0.1:8081';

// 测试环境
// const API_BASE_URL = 'https://test-api.example.com';

// 生产环境
// const API_BASE_URL = 'https://api.example.com';
```

### 添加新配置
在 `config/config.js` 中添加新的配置项：

```javascript
module.exports = {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  CACHE_EXPIRE_TIME,
  
  // 新增配置
  IMAGE_BASE_URL: 'https://cdn.example.com',
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
};
```

然后在需要的地方引用：

```javascript
const config = require('../config/config');
const imageUrl = config.IMAGE_BASE_URL + '/avatar.jpg';
```

## 优势

1. **集中管理**
   - 所有配置集中在一个文件
   - 修改方便，不会遗漏

2. **环境切换**
   - 可以轻松切换开发/测试/生产环境
   - 只需注释/取消注释对应的配置

3. **可维护性**
   - 新增配置项统一在配置文件中
   - 代码更清晰，职责分明

4. **避免错误**
   - 不会出现不同文件配置不一致的问题
   - 减少硬编码，降低出错概率

## 验证

运行以下命令验证是否还有硬编码的 API 地址：

```bash
# Windows PowerShell
Get-ChildItem -Path 'wx-miniapp\miniprogram' -Recurse -Include *.js | Select-String -Pattern '127\.0\.0\.1'

# 应该只返回 config/config.js 这一个文件
```

## 注意事项

1. **不要在其他文件中硬编码 API 地址**
   - 始终使用 `config.API_BASE_URL`

2. **配置文件不要提交敏感信息**
   - 如果有敏感配置，使用环境变量或单独的配置文件
   - 将敏感配置文件加入 `.gitignore`

3. **保持配置文件简洁**
   - 只放全局通用的配置
   - 业务相关的配置放在对应的模块中

## 相关文件

- `config/config.js` - 全局配置文件（唯一配置源）
- `app.js` - 应用入口，读取配置
- `utils/request.js` - 请求工具，使用配置
- `api/region.js` - 地区 API，使用配置
- `utils/region-cache.js` - 缓存工具，使用配置


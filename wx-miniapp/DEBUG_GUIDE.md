# 微信小程序调试指南

## 一、环境准备

### 1. 安装微信开发者工具
- 下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 安装后使用微信扫码登录

### 2. 项目配置

#### 2.1 打开项目
1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择：`wx-miniapp` 文件夹
4. AppID：可以使用测试号（选择"测试号"）或填写自己的 AppID
5. 项目名称：`loan-miniapp`

#### 2.2 项目配置检查
检查 `project.config.json`：
```json
{
  "miniprogramRoot": "miniprogram/",
  "compileType": "miniprogram",
  "setting": {
    "urlCheck": false,  // 重要：开发时关闭域名校验
    "es6": true,
    "enhance": true
  }
}
```

**重要设置：**
- `urlCheck: false` - 允许访问本地开发服务器（localhost）
- `es6: true` - 启用 ES6 语法支持

## 二、调试面板使用

### 1. 打开调试面板
- 点击开发者工具底部的"调试器"标签
- 或使用快捷键：`Ctrl + Shift + I`（Windows）或 `Cmd + Option + I`（Mac）

### 2. 控制台调试

#### 2.1 查看日志
```javascript
// 在页面 JS 文件中使用
console.log('普通日志', data);
console.error('错误日志', error);
console.warn('警告日志', warning);
console.info('信息日志', info);
```

#### 2.2 断点调试
1. 在代码行号左侧点击，设置断点
2. 刷新页面或触发相应操作
3. 程序会在断点处暂停
4. 可以查看变量值、调用栈等

#### 2.3 调试技巧
```javascript
// 1. 使用 debugger 语句
debugger; // 程序会在这里暂停

// 2. 条件断点
if (condition) {
  debugger; // 只在满足条件时暂停
}

// 3. 查看变量
console.log('变量值:', variable);
console.table(arrayData); // 表格形式显示数组
```

### 3. 网络请求调试

#### 3.1 查看网络请求
1. 打开调试器 → Network 标签
2. 刷新页面或触发请求
3. 查看请求详情：
   - Request：请求头、请求体
   - Response：响应头、响应体
   - Timing：请求耗时

#### 3.2 常见网络问题排查

**问题1：请求失败，提示域名不在白名单**
```
解决方案：
1. 检查 project.config.json 中 urlCheck 是否为 false
2. 或者在小程序后台配置合法域名
```

**问题2：请求返回 404**
```
检查项：
1. 后端服务是否启动（http://localhost:8080）
2. 请求 URL 是否正确
3. 后端路由配置是否正确
```

**问题3：跨域问题**
```
解决方案：
1. 后端配置 CORS（已在 SecurityConfig 中配置）
2. 检查后端是否允许来自小程序的请求
```

#### 3.3 网络请求调试代码
在 `utils/request.js` 中添加日志：
```javascript
function request(options) {
  const { url, ...rest } = options;
  
  // 添加请求日志
  console.log('请求发送:', {
    url: `${BASE_URL}${url}`,
    method: rest.method || 'GET',
    data: rest.data
  });
  
  wx.request({
    url: `${BASE_URL}${url}`,
    ...rest,
    success: (res) => {
      console.log('请求成功:', res);
      rest.success && rest.success(res);
    },
    fail: (err) => {
      console.error('请求失败:', err);
      rest.fail && rest.fail(err);
    },
    complete: (res) => {
      console.log('请求完成:', res);
      rest.complete && rest.complete(res);
    }
  });
}
```

### 4. 页面调试

#### 4.1 查看页面结构
- 使用调试器的"Elements"标签（类似 Chrome DevTools）
- 可以查看 WXML 结构、样式等

#### 4.2 查看页面数据
- 在调试器 Console 中输入：
```javascript
// 获取当前页面实例
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];
console.log('页面数据:', currentPage.data);
```

#### 4.3 修改页面数据（实时预览）
```javascript
// 在 Console 中直接修改数据
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];
currentPage.setData({
  testData: '修改后的值'
});
```

### 5. 存储调试

#### 5.1 查看本地存储
- 调试器 → Storage 标签
- 可以查看 `wx.setStorageSync` 存储的数据

#### 5.2 清除存储
```javascript
// 在 Console 中执行
wx.clearStorageSync();
// 或清除特定 key
wx.removeStorageSync('TOKEN');
```

## 三、真机调试

### 1. 预览
1. 点击工具栏"预览"按钮
2. 用微信扫码
3. 在手机上查看效果

### 2. 真机调试
1. 点击工具栏"真机调试"按钮
2. 用微信扫码
3. 手机上会显示调试信息
4. 可以在开发者工具中查看手机端的日志

### 3. 远程调试
1. 点击工具栏"远程调试"按钮
2. 用微信扫码
3. 可以在开发者工具中完全控制手机端小程序

## 四、常见问题排查

### 1. 页面无法显示

**检查项：**
```javascript
// 1. 检查页面路径是否正确
// app.json 中的 pages 配置

// 2. 检查页面文件是否存在
// pages/login/index.js
// pages/login/index.wxml

// 3. 检查页面 JS 是否有语法错误
// 查看控制台错误信息
```

### 2. 数据不更新

**检查项：**
```javascript
// 1. 是否正确使用 setData
this.setData({
  key: value
});

// 2. 检查数据绑定
// WXML: {{dataKey}}
// JS: this.data.dataKey

// 3. 检查异步操作
// 确保在异步回调中使用 setData
```

### 3. 请求失败

**检查清单：**
- [ ] 后端服务是否启动
- [ ] BASE_URL 是否正确
- [ ] 请求 URL 是否正确
- [ ] 请求方法是否正确（GET/POST）
- [ ] 请求头是否正确
- [ ] 后端 CORS 配置是否正确
- [ ] 小程序域名校验是否关闭

### 4. 加密/解密问题

**调试步骤：**
```javascript
// 1. 检查 RSA 公钥是否加载
console.log('RSA 公钥:', rsaUtils.publicKey);
console.log('RSA 是否就绪:', rsaUtils.isReady());

// 2. 检查加密结果
const encrypted = rsaUtils.encrypt({ test: 'data' });
console.log('加密结果:', encrypted);

// 3. 检查响应解密
console.log('响应数据:', res.data);
console.log('是否包含加密字段:', res.data.encryptedData);
```

## 五、调试工具和技巧

### 1. 使用 vConsole（可选）
如果需要更强大的调试工具，可以集成 vConsole：
```javascript
// 在 app.js 中引入
const vConsole = require('./utils/vconsole.min.js');
// 开发环境显示，生产环境隐藏
if (process.env.NODE_ENV === 'development') {
  new vConsole();
}
```

### 2. 性能调试
- 调试器 → Performance 标签
- 可以查看页面渲染性能、内存使用等

### 3. 代码检查
- 调试器 → Sources 标签
- 可以查看源码、设置断点、单步调试

## 六、调试最佳实践

### 1. 使用环境变量
```javascript
// utils/config.js
const config = {
  dev: {
    BASE_URL: 'http://localhost:8080',
    DEBUG: true
  },
  prod: {
    BASE_URL: 'https://api.example.com',
    DEBUG: false
  }
};

const env = 'dev'; // 或从配置读取
module.exports = config[env];
```

### 2. 统一错误处理
```javascript
// utils/request.js
function request(options) {
  wx.request({
    ...options,
    fail: (err) => {
      console.error('请求错误:', err);
      // 统一错误处理
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
      options.fail && options.fail(err);
    }
  });
}
```

### 3. 日志分级
```javascript
// utils/logger.js
const DEBUG = true; // 开发环境为 true

const logger = {
  log: (...args) => DEBUG && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => DEBUG && console.warn(...args)
};

module.exports = logger;
```

## 七、快速调试清单

### 启动调试前检查：
- [ ] 微信开发者工具已安装并登录
- [ ] 项目已正确导入
- [ ] `urlCheck: false` 已设置
- [ ] 后端服务已启动（http://localhost:8080）
- [ ] 网络连接正常

### 调试步骤：
1. 打开微信开发者工具
2. 导入项目
3. 打开调试器（F12 或点击调试器标签）
4. 查看 Console 日志
5. 查看 Network 请求
6. 设置断点调试
7. 查看 Storage 数据

### 常见错误解决：
- **白屏**：检查页面路径、文件是否存在
- **请求失败**：检查后端服务、URL、CORS
- **数据不显示**：检查 setData、数据绑定
- **加密失败**：检查 RSA 公钥是否加载

## 八、调试命令速查

```javascript
// 在 Console 中执行

// 查看当前页面
getCurrentPages()

// 查看页面数据
getCurrentPages()[getCurrentPages().length - 1].data

// 修改页面数据
getCurrentPages()[getCurrentPages().length - 1].setData({ key: value })

// 清除存储
wx.clearStorageSync()

// 查看存储
wx.getStorageInfoSync()

// 触发页面方法
getCurrentPages()[getCurrentPages().length - 1].loadOrders()
```

## 九、联系支持

如果遇到无法解决的问题：
1. 查看微信开发者工具控制台错误信息
2. 查看网络请求详情
3. 检查代码逻辑
4. 参考微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/


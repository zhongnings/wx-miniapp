# 银行卡 Logo 优化方案

## 优化目标
将银行卡 logo 图片从小程序包中移除，改为从后端服务器加载，以减少小程序包体积。

## 优化前
- 银行 logo 图片打包在小程序包内（`/static/bank/` 目录）
- 约 27 个银行的 logo 图片，总大小约 195KB
- 每次发布小程序都需要上传这些图片

## 优化后
- 银行 logo 图片移动到后端服务器（`后端项目/img/bank/` 目录）
- 小程序通过 HTTP 请求加载图片
- 使用图片缓存机制，首次加载后缓存到本地（7天有效期）
- 小程序包体积减少约 195KB

## 实现方案

### 1. 创建银行配置文件
**文件路径**: `wx-miniapp/miniprogram/config/banks.js`

**功能**:
- 统一管理所有银行的配置信息（logo 路径、品牌色）
- 提供 `getBankConfig(bankName)` 方法获取银行配置
- 提供 `getBankIcon(bankName)` 方法获取银行图标文字（备用方案）
- 提供 `getAllBankLogos()` 方法获取所有银行 logo URL（用于预加载）

**关键代码**:
```javascript
// 获取 BASE_URL（运行时获取，避免循环依赖）
function getBaseUrl() {
  if (typeof wx !== 'undefined' && wx.$request && wx.$request.BASE_URL) {
    return wx.$request.BASE_URL;
  }
  return 'http://localhost:8081';
}

// 银行配置
const bankConfig = {
  '中国工商银行': { logoPath: '/img/bank/gongshang.png', color: '#C8161D' },
  '建设银行': { logoPath: '/img/bank/jianshe.png', color: '#0066B3' },
  // ... 其他银行
};

// 获取银行配置（返回完整 URL）
function getBankConfig(bankName) {
  const baseUrl = getBaseUrl();
  const config = bankConfig[bankName];
  return {
    logo: `${baseUrl}${config.logoPath}`,
    color: config.color
  };
}
```

### 2. 修改 app.js 全局配置
**文件路径**: `wx-miniapp/miniprogram/app.js`

**修改内容**:
1. 引入银行配置模块
2. 将银行配置挂载到全局 `wx.$banks`
3. ~~在 `onLaunch` 中预加载所有银行 logo~~（已取消，改为按需加载）
4. ~~将预加载的图片缓存到 `globalData.bankLogoImages`~~（已取消）

**关键代码**:
```javascript
// 引入银行配置
const banks = require('/config/banks');

App({
  onLaunch() {
    // 挂载银行配置到全局
    wx.$banks = banks;
    
    // 不再预加载图片，改为按需加载
    // 原因：预加载所有图片会超出小程序存储限制（10MB）
    // 图片会在首次使用时自动下载并缓存
    console.log('[App] 图片采用按需加载策略，首次使用时自动缓存');
  },
  
  globalData: {
    bankLogoImages: {}, // 银行 logo 缓存映射（运行时填充）
    // ... 其他配置
  }
});
```

### 3. 修改 step5 页面
**文件路径**: `wx-miniapp/miniprogram/pages/order/create/step5/index.js`

**修改内容**:
1. 移除本地 `bankConfig` 配置对象
2. 移除本地 `getBankConfig` 和 `getBankIcon` 函数
3. 使用全局 `wx.$banks.getBankConfig()` 和 `wx.$banks.getBankIcon()`

**修改前**:
```javascript
const bankConfig = {
  '中国工商银行': { logo: '/static/bank/gongshang.png', color: '#C8161D' },
  // ...
};

function getBankConfig(bankName) {
  // 本地实现
}
```

**修改后**:
```javascript
// 使用全局配置
const config = wx.$banks.getBankConfig(card.bankName);
const icon = wx.$banks.getBankIcon(card.bankName);
```

### 4. 修改 step5-edit 页面
**文件路径**: `wx-miniapp/miniprogram/pages/order/create/step5-edit/index.js`

**修改内容**: 与 step5 页面相同

### 5. 图片缓存机制
**文件路径**: `wx-miniapp/miniprogram/utils/imageCache.js`

**功能**:
- 从服务器下载图片并缓存到本地永久存储
- 缓存有效期 7 天
- 自动清理过期缓存
- 支持批量预加载

**使用方式**:
```javascript
// 获取单张图片（带缓存）
wx.$imageCache.getCachedImage(imageUrl).then(localPath => {
  // 使用本地路径
});

// 批量预加载
wx.$imageCache.preloadImages([url1, url2, ...]).then(imageMap => {
  // imageMap: { url: localPath }
});
```

## 后端配置

### 1. 图片存放位置
将所有银行 logo 图片移动到后端项目的 `img/bank/` 目录：
```
后端项目/
  └── img/
      └── bank/
          ├── gongshang.png    # 工商银行
          ├── jianshe.png      # 建设银行
          ├── nongye.png       # 农业银行
          ├── zhongguo.png     # 中国银行
          ├── jiaotong.png     # 交通银行
          ├── zhaoshang.png    # 招商银行
          ├── pufa.png         # 浦发银行
          ├── zhongxin.png     # 中信银行
          ├── guangda.png      # 光大银行
          ├── huaxia.png       # 华夏银行
          ├── minsheng.png     # 民生银行
          ├── guangfa.png      # 广发银行
          ├── pingan.png       # 平安银行
          ├── xingye.png       # 兴业银行
          ├── youchu.png       # 邮储银行
          ├── ningbo.png       # 宁波银行
          ├── jiangsu.png      # 江苏银行
          ├── nanjing.png      # 南京银行
          ├── shanghai.png     # 上海银行
          ├── shengjing.png    # 盛京银行
          ├── huifeng.png      # 汇丰银行
          ├── wangshang.png    # 网商银行
          └── none.png         # 默认银行图标
```

### 2. 静态资源访问配置
确保后端服务器配置了静态资源访问：
- 访问路径: `http://127.0.0.1:8081/img/bank/gongshang.png`
- 支持跨域访问（如果需要）
- 设置合适的缓存策略（如 Cache-Control）

## 优化效果

### 包体积优化
- **优化前**: 小程序包包含 ~195KB 银行 logo 图片
- **优化后**: 银行 logo 从后端加载，包体积减少 ~195KB

### 性能优化
- **首次加载**: 图片按需加载，只在使用时才下载
- **后续使用**: 从本地缓存读取，无需网络请求
- **缓存有效期**: 7 天，过期后自动重新下载
- **存储优化**: 如果存储空间不足，自动使用临时路径（不缓存）

### 维护优化
- **更新银行 logo**: 只需更新后端图片，无需重新发布小程序
- **新增银行**: 在 `config/banks.js` 中添加配置即可
- **统一管理**: 所有银行配置集中在一个文件中

## 注意事项

1. **按需加载策略**: 图片不会在启动时预加载，而是在首次使用时才下载
2. **存储限制**: 微信小程序本地存储限制为 10MB，如果空间不足会使用临时路径
3. **网络依赖**: 首次使用需要网络连接下载图片
4. **降级方案**: 如果图片加载失败，显示文字图标（如"工"、"建"等）
5. **缓存清理**: 用户可以通过清理小程序缓存来释放空间
6. **图片格式**: 建议使用 PNG 格式，支持透明背景
7. **图片大小**: 建议每个 logo 控制在 10KB 以内

## 后续优化建议

1. **CDN 加速**: 将银行 logo 上传到 CDN，提高加载速度
2. **WebP 格式**: 使用 WebP 格式进一步减小图片大小
3. **懒加载**: 只加载当前显示的银行 logo，而不是全部预加载
4. **图片压缩**: 对现有图片进行压缩优化

## 参考文档

- [微信小程序图片缓存](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html)
- [微信小程序下载文件](https://developers.weixin.qq.com/miniprogram/dev/api/network/download/wx.downloadFile.html)
- [微信小程序包大小优化](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/start_optimizeA.html)


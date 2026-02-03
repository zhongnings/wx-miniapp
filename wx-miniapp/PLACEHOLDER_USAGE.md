# 占位图使用说明

## 概述

为了减少小程序包体积，大尺寸的占位图已移至服务器，通过图片缓存工具按需加载。

## 已完成的工作

### 1. 文件移动
- ✅ 将以下文件从 `wx-miniapp/miniprogram/static/` 移至 `src/main/resources/static/placeholders/`：
  - `id-front-placeholder.png` (950 KB)
  - `id-back-placeholder.png` (1215 KB)
  - `business-license-placeholder.png` (940 KB)
  - `business-license-placeholder1.png` (778 KB)

- ✅ 保留小图标在本地：
  - `delete_icon.png` (127 KB)
  - `modify_icon.png` (235 KB)

### 2. 创建的工具文件
- ✅ `/utils/imageCache.js` - 图片缓存工具
- ✅ `/config/placeholders.js` - 占位图配置
- ✅ `/utils/placeholderHelper.js` - 占位图辅助函数
- ✅ 更新 `app.js` - 预加载占位图

## 使用方法

### 方法一：直接使用全局变量（推荐）⭐

**最简单的方式，无需 require，直接使用 `wx.$placeholders`**

```javascript
Page({
  data: {
    formData: {
      idFrontImage: '',
      idBackImage: ''
    }
  },

  onLoad(options) {
    // 直接使用全局挂载的占位图配置
    // 无需 require，避免路径问题
    this.setData({
      idFrontPlaceholder: wx.$placeholders.ID_FRONT,
      idBackPlaceholder: wx.$placeholders.ID_BACK,
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE
    });
  }
});
```

在 WXML 中使用：

```xml
<!-- 身份证正面 -->
<image 
  src="{{formData.idFrontImage || idFrontPlaceholder}}" 
  mode="aspectFit"
/>

<!-- 身份证反面 -->
<image 
  src="{{formData.idBackImage || idBackPlaceholder}}" 
  mode="aspectFit"
/>

<!-- 营业执照 -->
<image 
  src="{{formData.businessLicense || businessLicensePlaceholder}}" 
  mode="aspectFit"
/>
```

### 方法二：使用辅助函数（可选）

如果需要获取缓存的本地路径：

```javascript
Page({
  data: {
    idFrontPlaceholder: '',
    idBackPlaceholder: ''
  },

  onLoad(options) {
    // 使用辅助函数，会优先返回缓存的本地路径
    const app = getApp();
    const placeholderImages = app.globalData.placeholderImages || {};
    
    this.setData({
      idFrontPlaceholder: placeholderImages[wx.$placeholders.ID_FRONT] || wx.$placeholders.ID_FRONT,
      idBackPlaceholder: placeholderImages[wx.$placeholders.ID_BACK] || wx.$placeholders.ID_BACK
    });
  }
});
```

## 占位图类型

可用的占位图类型：

- `ID_FRONT` - 身份证正面
- `ID_BACK` - 身份证背面
- `BUSINESS_LICENSE` - 营业执照

## 工作原理

1. **预加载**：小程序启动时，`app.js` 会自动预加载常用占位图
2. **缓存**：下载的图片会缓存到本地，有效期 7 天
3. **自动清理**：每次启动时自动清理过期缓存

## 需要更新的页面

以下页面需要更新占位图引用：

### step2/index.wxml
```xml
<!-- 修改前 -->
<image src="{{formData.idFrontImage || '/static/id-front-placeholder.png'}}" />

<!-- 修改后 -->
<image src="{{formData.idFrontImage || idFrontPlaceholder}}" />
```

### co-borrower/index.wxml
类似修改，将所有 `/static/xxx-placeholder.png` 替换为对应的变量。

## 注意事项

1. **服务器配置**：确保后端已配置静态资源映射 `/static/placeholders/`
2. **网络依赖**：首次加载需要网络，之后使用缓存
3. **降级方案**：如果加载失败，会显示服务器 URL（微信会自动下载）

## 效果

- **包体积减少**：约 3.8 MB（从 4.2 MB 减少到 0.4 MB）
- **用户体验**：首次加载略慢，之后使用缓存，体验流畅
- **维护性**：占位图统一管理，易于更新

## 后续优化建议

1. **压缩图标**：将 `modify_icon.png` 和 `delete_icon.png` 压缩到 50 KB 以下
2. **CDN 加速**：将占位图上传到 CDN，提高加载速度
3. **WebP 格式**：将 PNG 转换为 WebP，进一步减小文件大小


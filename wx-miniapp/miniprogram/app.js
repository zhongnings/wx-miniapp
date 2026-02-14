// 全局应用入口
// 说明：在这里把通用的请求工具挂载到 wx.$request，方便所有页面直接使用

// 根目录 utils/request.js（使用绝对路径更稳定）
const request = require('/utils/request');
// 通用上传工具，全局挂载，避免各页面路径问题
const uploadUtil = require('/utils/upload');
// 图片缓存工具
const imageCache = require('/utils/imageCache');
// 占位图配置
const placeholders = require('/config/placeholders');

App({
  onLaunch() {
    // 挂载到 wx 全局对象
    // 使用方式示例：
    // wx.$request.get('/public/orders');
    wx.$request = request;
    // 上传工具统一挂载到 wx.$upload，避免各页面 require 路径差异
    wx.$upload = uploadUtil;
    // 图片缓存工具
    wx.$imageCache = imageCache;
    // 占位图配置（全局挂载，避免路径问题）
    wx.$placeholders = placeholders;
    
    // 清除过期的图片缓存
    imageCache.clearExpiredCache();
    
    // 预加载常用占位图（从服务器加载）
    const placeholderImages = [
      placeholders.ID_FRONT,
      placeholders.ID_BACK,
      placeholders.BUSINESS_LICENSE
    ];
    
    imageCache.preloadImages(placeholderImages).then(imageMap => {
      console.log('[App] 占位图预加载完成', imageMap);
      // 保存到全局数据
      this.globalData.placeholderImages = imageMap;
    }).catch(err => {
      console.error('[App] 占位图预加载失败', err);
    });
  },

  globalData: {
    // 预留全局数据
    uploadUtil,
    placeholderImages: {}, // 占位图缓存映射
    // 订单创建流程上下文（统一管理订单ID、状态等，避免参数传递遗漏）
    orderContext: {
      orderId: null,
      orderStatus: null,
      mode: null,
      fromOrderDetail: false
    }
  }
});



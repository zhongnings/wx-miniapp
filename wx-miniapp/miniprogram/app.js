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
// 银行配置
const banks = require('/config/banks');
// 地区数据缓存工具
const RegionCache = require('/utils/region-cache');
const regionCache = new RegionCache();
// 全局配置
const config = require('/config/config');

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
    // 银行配置（全局挂载，避免路径问题）
    wx.$banks = banks;
    // 地区数据缓存工具
    wx.$regionCache = regionCache;
    
    // 清除过期的图片缓存
    imageCache.clearExpiredCache();
    
    // 不再预加载图片，改为按需加载
    // 原因：预加载所有图片会超出小程序存储限制
    // 图片会在首次使用时自动下载并缓存
    console.log('[App] 图片采用按需加载策略，首次使用时自动缓存');
    
  },

  globalData: {
    // API 基础地址（从配置文件读取）
    apiBaseUrl: config.API_BASE_URL,
    // 预留全局数据
    uploadUtil,
    placeholderImages: {}, // 占位图缓存映射
    bankLogoImages: {}, // 银行 logo 缓存映射
    // 订单创建流程上下文（统一管理订单ID、状态等，避免参数传递遗漏）
    orderContext: {
      orderId: null,
      orderStatus: null,
      mode: null,
      fromOrderDetail: false
    }
  }
});



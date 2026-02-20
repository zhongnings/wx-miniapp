/**
 * 占位图配置
 * 从服务器加载，减少小程序包体积
 * 
 * 注意：不要在这里 require request.js，会导致循环依赖
 * BASE_URL 会在运行时从 wx.$request.BASE_URL 获取
 */

// 获取 BASE_URL 的函数（运行时获取，避免循环依赖）
function getBaseUrl() {
  // 如果 wx.$request 已经挂载，使用它的 BASE_URL
  if (typeof wx !== 'undefined' && wx.$request && wx.$request.BASE_URL) {
    return wx.$request.BASE_URL;
  }
  // 否则使用默认值
  return 'http://localhost:8081';
}

module.exports = {
  // 身份证正面占位图
  get ID_FRONT() {
    return `${getBaseUrl()}/img/id-front-placeholder.png`;
  },
  
  // 身份证背面占位图
  get ID_BACK() {
    return `${getBaseUrl()}/img/id-back-placeholder.png`;
  },
  
  // 营业执照占位图
  get BUSINESS_LICENSE() {
    return `${getBaseUrl()}/img/business-license-placeholder.png`;
  },
  
  // 营业执照占位图（备用）
  get BUSINESS_LICENSE_ALT() {
    return `${getBaseUrl()}/img/business-license-placeholder1.png`;
  },
  
  // 空状态图片
  get EMPTY() {
    return `${getBaseUrl()}/img/empty.png`;
  },
  
  // 修改图标
  get MODIFY_ICON() {
    return `${getBaseUrl()}/img/modify_icon.png`;
  },
  
  // 删除图标
  get DELETE_ICON() {
    return `${getBaseUrl()}/img/delete_icon.png`;
  },
  
  // 菜单图标
  get MENU_ICON() {
    return `${getBaseUrl()}/img/menu.png`;
  },
  
  // 设置图标
  get SETTING_ICON() {
    return `${getBaseUrl()}/img/setting.png`;
  },
  
  // 获取占位图（带缓存）
  getPlaceholder(type) {
    const app = getApp();
    const url = this[type];
    
    if (!url) {
      console.warn('[占位图] 未知类型:', type);
      return '';
    }
    
    // 优先从缓存获取
    if (app.globalData.placeholderImages && app.globalData.placeholderImages[url]) {
      return app.globalData.placeholderImages[url];
    }
    
    // 返回服务器URL（会自动下载）
    return url;
  }
};


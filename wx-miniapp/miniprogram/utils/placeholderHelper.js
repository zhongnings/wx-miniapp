/**
 * 占位图辅助函数
 * 在页面中使用：const { getPlaceholder } = require('/utils/placeholderHelper');
 */

const placeholders = require('/config/placeholders');

/**
 * 获取占位图路径（带缓存）
 * @param {string} type - 占位图类型：ID_FRONT, ID_BACK, BUSINESS_LICENSE
 * @returns {string} 占位图路径
 */
function getPlaceholder(type) {
  return placeholders.getPlaceholder(type);
}

/**
 * 在页面 data 中初始化占位图
 * 使用方法：在 onLoad 中调用 initPlaceholders(this)
 */
function initPlaceholders(page) {
  const app = getApp();
  
  // 如果已经预加载完成，直接使用缓存
  if (app.globalData.placeholderImages) {
    const images = app.globalData.placeholderImages;
    page.setData({
      idFrontPlaceholder: images[placeholders.ID_FRONT] || placeholders.ID_FRONT,
      idBackPlaceholder: images[placeholders.ID_BACK] || placeholders.ID_BACK,
      businessLicensePlaceholder: images[placeholders.BUSINESS_LICENSE] || placeholders.BUSINESS_LICENSE
    });
  } else {
    // 使用服务器URL（会自动下载）
    page.setData({
      idFrontPlaceholder: placeholders.ID_FRONT,
      idBackPlaceholder: placeholders.ID_BACK,
      businessLicensePlaceholder: placeholders.BUSINESS_LICENSE
    });
  }
}

module.exports = {
  getPlaceholder,
  initPlaceholders
};


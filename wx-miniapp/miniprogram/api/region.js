/**
 * 行政区划 API
 */

const config = require('../config/config');

/**
 * 获取 app 实例和 API 基础 URL
 */
function getApiBaseUrl() {
  return config.API_BASE_URL;
}

/**
 * 获取省份列表
 */
function getProvinces() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}/public/region/provinces`,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.message || '获取省份列表失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 获取城市列表
 * @param {string} provinceCode 省份代码
 */
function getCities(provinceCode) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}/public/region/cities/${provinceCode}`,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.message || '获取城市列表失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 获取区县列表
 * @param {string} cityCode 城市代码
 */
function getDistricts(cityCode) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}/public/region/districts/${cityCode}`,
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.message || '获取区县列表失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 搜索地区
 * @param {string} keyword 关键词
 */
function searchRegions(keyword) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}/public/region/search`,
      method: 'GET',
      data: { keyword },
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data.message || '搜索失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

// 导出所有函数
module.exports = {
  getProvinces,
  getCities,
  getDistricts,
  searchRegions
};

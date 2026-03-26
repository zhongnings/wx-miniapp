const config = require('../config/config');
const logger = require('./logger');

const BASE_URL = config.getApiBaseUrl();

/**
 * 统一的请求方法
 * 自动添加日志，方便调试
 * 自动处理Token失效，跳转登录页
 */
function request(options) {
  const { 
    url, 
    method = 'GET',
    data = null,
    skipAuthCheck = false, // 是否跳过认证检查（登录接口使用）
    ...rest 
  } = options;

  const fullUrl = `${BASE_URL}${url}`;

  // 从本地存储读取 token、userId、roles，透传给后端做简易鉴权
  const token = wx.getStorageSync('TOKEN') || '';
  const userId = wx.getStorageSync('USER_ID') || '';
  const roles = wx.getStorageSync('ROLES') || '';

  // 记录请求日志
  logger.request(fullUrl, method, data);

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'X-Token': token,
        'X-User-Id': userId,
        'X-Roles': Array.isArray(roles) ? roles.join(',') : roles,
        ...rest.header
      },
      success: (res) => {
        // 记录响应日志
        logger.response(fullUrl, res.statusCode, res.data);

        // 统一处理Token失效（401未授权）
        if (res.statusCode === 401 && !skipAuthCheck) {
          logger.warn('Token已失效，跳转登录页');
          
          // 清除本地存储的认证信息
          wx.removeStorageSync('TOKEN');
          wx.removeStorageSync('USER_ID');
          wx.removeStorageSync('ROLES');
          wx.removeStorageSync('PERMISSIONS');
          
          // 显示提示
          wx.showToast({
            title: res.data?.message || '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          
          // 延迟跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/index'
            });
          }, 2000);
          
          reject({
            statusCode: 401,
            message: '登录已过期',
            data: res.data
          });
          return;
        }

        // 统一处理权限不足（403禁止访问）
        if (res.statusCode === 403) {
          logger.warn('权限不足:', res.data);
          
          wx.showToast({
            title: res.data?.message || '您没有权限执行此操作',
            icon: 'none',
            duration: 2500
          });
          
          reject({
            statusCode: 403,
            message: res.data?.message || '权限不足',
            data: res.data
          });
          return;
        }

        // 统一处理响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          logger.error('请求失败:', {
            url: fullUrl,
            statusCode: res.statusCode,
            data: res.data
          });
          
          // 显示错误提示
          wx.showToast({
            title: res.data?.message || '请求失败',
            icon: 'none',
            duration: 2000
          });
          
          if (rest.fail) {
            rest.fail(res);
          }
          reject({
            statusCode: res.statusCode,
            message: res.data?.message || '请求失败',
            data: res.data
          });
        }
      },
      fail: (err) => {
        logger.error('网络错误:', {
          url: fullUrl,
          error: err
        });

        // 显示网络错误提示
        wx.showToast({
          title: '网络错误，请检查网络连接',
          icon: 'none',
          duration: 2000
        });

        if (rest.fail) {
          rest.fail(err);
        }
        reject({
          statusCode: 0,
          message: '网络错误',
          error: err
        });
      },
      complete: (res) => {
        logger.debug('请求完成:', fullUrl);
        if (rest.complete) {
          rest.complete(res);
        }
      },
      ...rest
    });
  });
}

/**
 * GET 请求便捷方法
 * 用法：wx.$request.get('/path', { data, ...options })
 */
function get(url, options = {}) {
  return request({
    url,
    method: 'GET',
    ...options
  });
}

/**
 * POST 请求便捷方法
 * 用法：wx.$request.post('/path', data, { ...options })
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
}

module.exports = {
  BASE_URL,
  request,
  get,
  post
};


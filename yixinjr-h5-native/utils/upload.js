/**
 * uni-app 文件上传工具
 * 兼容微信小程序和 H5
 */

// 根据环境自动切换 BASE_URL
// #ifdef H5
const BASE_URL = '/api'; // H5 使用代理
// #endif

// #ifdef MP-WEIXIN
const BASE_URL = 'http://localhost:8081'; // 微信小程序直接访问后端
// #endif

// #ifndef H5 || MP-WEIXIN
const BASE_URL = 'http://localhost:8081'; // 其他平台默认
// #endif

const logger = require('./logger.js');

/**
 * 上传文件
 * @param {String} filePath 文件路径
 * @param {String} uploadUrl 上传接口路径（相对路径）
 * @param {Object} formData 额外的表单数据
 * @returns {Promise}
 */
function uploadFile(filePath, uploadUrl = '/api/upload', formData = {}) {
  const fullUrl = `${BASE_URL}${uploadUrl}`;
  
  // 从本地存储读取 token
  const token = uni.getStorageSync('TOKEN') || '';
  const userId = uni.getStorageSync('USER_ID') || '';
  
  logger.info('开始上传文件:', { filePath, uploadUrl, formData });
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: fullUrl,
      filePath: filePath,
      name: 'file', // 后端接收的字段名
      formData: formData,
      header: {
        'X-Token': token,
        'X-User-Id': userId
      },
      success: (res) => {
        logger.info('文件上传成功:', res);
        
        if (res.statusCode === 200) {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            resolve(data);
          } catch (e) {
            logger.error('解析上传响应失败:', e);
            reject(e);
          }
        } else {
          logger.error('文件上传失败:', res);
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        logger.error('文件上传失败:', err);
        uni.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 选择并上传图片
 * @param {Object} options 配置项
 * @returns {Promise}
 */
function chooseAndUploadImage(options = {}) {
  const {
    count = 1,
    sizeType = ['compressed'],
    sourceType = ['album', 'camera'],
    uploadUrl = '/api/upload',
    formData = {}
  } = options;
  
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: count,
      sizeType: sizeType,
      sourceType: sourceType,
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        logger.info('选择图片成功:', tempFilePaths);
        
        // 上传第一张图片
        if (tempFilePaths.length > 0) {
          uploadFile(tempFilePaths[0], uploadUrl, formData)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('未选择图片'));
        }
      },
      fail: (err) => {
        logger.error('选择图片失败:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  uploadFile,
  chooseAndUploadImage
};


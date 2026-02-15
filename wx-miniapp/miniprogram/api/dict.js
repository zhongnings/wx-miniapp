/**
 * 数据字典 API
 */

const request = require('../utils/request.js');

/**
 * 获取指定分类的字典项列表
 * @param {string} categoryCode - 分类编码
 * @returns {Promise}
 */
function getDictItems(categoryCode) {
  return request.get(`/public/dict/items/${categoryCode}`).then(res => {
    // request.get 返回完整的 res 对象，需要提取 res.data
    return res.data;
  });
}

/**
 * 批量获取多个分类的字典项
 * @param {Array<string>} categoryCodes - 分类编码列表
 * @returns {Promise}
 */
function batchGetDictItems(categoryCodes) {
  return request.post('/public/dict/items/batch', {
    categoryCodes: categoryCodes
  }).then(res => {
    // request.post 返回完整的 res 对象，需要提取 res.data
    return res.data;
  });
}

module.exports = {
  getDictItems,
  batchGetDictItems
};


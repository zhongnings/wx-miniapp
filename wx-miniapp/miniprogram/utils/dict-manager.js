/**
 * 数据字典工具类
 * 统一管理所有下拉列表的数据加载和缓存
 */

const dictApi = require('../api/dict.js');

class DictManager {
  constructor() {
    // 本地默认值（作为后备方案）
    this.defaultDict = {
      // step1 借款信息
      assignee_org: ['广西云桂实业投资有限公司', '广西南宁投资有限公司', '广西桂林实业有限公司', '广西柳州投资集团'],
      microloan_org: ['南宁市益信小额贷款股份有限公司', '南宁市金信小额贷款有限公司', '南宁市银信小额贷款有限公司', '南宁市信合小额贷款有限公司'],
      payment_channel: ['宝付', '支付宝', '微信支付', '银联支付', '网银支付'],
      product_type: ['信用业务', '抵押业务', '担保业务', '质押业务'],
      loan_purpose: ['资金周转', '生产经营', '消费贷款', '购房贷款', '购车贷款', '其他'],
      repayment_method: ['等额本息', '等额本金', '先息后本', '一次性还本付息', '按月付息到期还本'],
      dispute_resolution: ['仲裁解决', '诉讼解决', '协商解决'],
      arbitration_org: ['南平国际仲裁院', '北京仲裁委员会', '上海仲裁委员会', '广州仲裁委员会', '深圳仲裁委员会'],
      notarization_type: ['赋强公证'],
      notarization_item: ['有抵押赋强', '无抵押赋强'],
      
      // step2/step3/step4 个人信息
      marital_status: ['未婚', '已婚', '离异', '丧偶'],
      id_type: ['身份证', '护照', '军官证', '其他'],
      relationship: ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '其他']
    };
  }
  
  /**
   * 获取字典数据（优先从全局缓存，其次从后端，最后使用本地默认值）
   * @param {string} categoryCode - 分类编码
   * @returns {Array<string>} 选项值数组
   */
  getDictOptions(categoryCode) {
    const app = getApp();
    const cachedDict = app.globalData.dictData || {};
    
    // 优先使用全局缓存
    if (cachedDict[categoryCode] && cachedDict[categoryCode].length > 0) {
      return cachedDict[categoryCode].map(item => item.itemValue);
    }
    
    // 使用本地默认值
    return this.defaultDict[categoryCode] || [];
  }
  
  /**
   * 批量获取字典数据
   * @param {Array<string>} categoryCodes - 分类编码数组
   * @returns {Object} { categoryCode: [options] }
   */
  batchGetDictOptions(categoryCodes) {
    const result = {};
    categoryCodes.forEach(code => {
      result[code] = this.getDictOptions(code);
    });
    return result;
  }
  
  /**
   * 从后端加载字典数据并更新全局缓存
   * @param {Array<string>} categoryCodes - 分类编码数组
   * @returns {Promise}
   */
  async loadDictFromServer(categoryCodes) {
    try {
      const res = await dictApi.batchGetDictItems(categoryCodes);
      if (res && res.data) {
        const app = getApp();
        // 合并到全局缓存
        app.globalData.dictData = Object.assign(app.globalData.dictData || {}, res.data);
        console.log('[字典工具] 从后端加载字典数据成功', categoryCodes);
        return res.data;
      }
    } catch (err) {
      console.error('[字典工具] 从后端加载字典数据失败', err);
      // 返回本地默认值
      const result = {};
      categoryCodes.forEach(code => {
        if (this.defaultDict[code]) {
          result[code] = this.defaultDict[code].map((value, index) => ({
            itemValue: value,
            sortOrder: index,
            isDefault: index === 0
          }));
        }
      });
      return result;
    }
  }
}

// 导出单例
module.exports = new DictManager();


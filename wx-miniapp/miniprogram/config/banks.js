/**
 * 银行配置
 * 银行 logo 从后端加载，减少小程序包体积
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

// 银行配置（包含 logo 路径和品牌色）
const bankConfig = {
  '中国工商银行': { logoPath: '/img/bank/gongshang.png', color: '#C8161D' },
  '工商银行': { logoPath: '/img/bank/gongshang.png', color: '#C8161D' },
  '中国建设银行': { logoPath: '/img/bank/jianshe.png', color: '#0066B3' },
  '建设银行': { logoPath: '/img/bank/jianshe.png', color: '#0066B3' },
  '中国农业银行': { logoPath: '/img/bank/nongye.png', color: '#00843D' },
  '农业银行': { logoPath: '/img/bank/nongye.png', color: '#00843D' },
  '中国银行': { logoPath: '/img/bank/zhongguo.png', color: '#B20838' },
  '交通银行': { logoPath: '/img/bank/jiaotong.png', color: '#0066B3' },
  '招商银行': { logoPath: '/img/bank/zhaoshang.png', color: '#E4002B' },
  '浦发银行': { logoPath: '/img/bank/pufa.png', color: '#003399' },
  '浦东发展银行': { logoPath: '/img/bank/pufa.png', color: '#003399' },
  '中信银行': { logoPath: '/img/bank/zhongxin.png', color: '#E4002B' },
  '光大银行': { logoPath: '/img/bank/guangda.png', color: '#6F2C91' },
  '华夏银行': { logoPath: '/img/bank/huaxia.png', color: '#E4002B' },
  '民生银行': { logoPath: '/img/bank/minsheng.png', color: '#006EB6' },
  '广发银行': { logoPath: '/img/bank/guangfa.png', color: '#E4002B' },
  '广东发展银行': { logoPath: '/img/bank/guangfa.png', color: '#E4002B' },
  '平安银行': { logoPath: '/img/bank/pingan.png', color: '#FF6600' },
  '兴业银行': { logoPath: '/img/bank/xingye.png', color: '#003399' },
  '邮储银行': { logoPath: '/img/bank/youchu.png', color: '#00843D' },
  '邮政储蓄银行': { logoPath: '/img/bank/youchu.png', color: '#00843D' },
  '宁波银行': { logoPath: '/img/bank/ningbo.png', color: '#F39800' },
  '江苏银行': { logoPath: '/img/bank/jiangsu.png', color: '#E4002B' },
  '南京银行': { logoPath: '/img/bank/nanjing.png', color: '#E4002B' },
  '上海银行': { logoPath: '/img/bank/shanghai.png', color: '#0066B3' },
  '盛京银行': { logoPath: '/img/bank/shengjing.png', color: '#E4002B' },
  '汇丰银行': { logoPath: '/img/bank/huifeng.png', color: '#DB0011' },
  '网商银行': { logoPath: '/img/bank/wangshang.png', color: '#FF6600' }
};

/**
 * 获取银行配置（logo URL 和颜色）
 * @param {string} bankName - 银行名称
 * @returns {Object} { logo: string, color: string }
 */
function getBankConfig(bankName) {
  const baseUrl = getBaseUrl();
  const defaultConfig = { 
    logo: `${baseUrl}/img/bank/none.png`, 
    color: '#4A90E2' 
  };
  
  if (!bankName) {
    return defaultConfig;
  }
  
  // 精确匹配
  if (bankConfig[bankName]) {
    return {
      logo: `${baseUrl}${bankConfig[bankName].logoPath}`,
      color: bankConfig[bankName].color
    };
  }
  
  // 模糊匹配（支持部分匹配）
  for (const key in bankConfig) {
    // 移除"中国"、"银行"等通用词后匹配
    const simplifiedKey = key.replace(/中国|银行/g, '');
    const simplifiedName = bankName.replace(/中国|银行/g, '');
    if (simplifiedName.includes(simplifiedKey) || simplifiedKey.includes(simplifiedName)) {
      return {
        logo: `${baseUrl}${bankConfig[key].logoPath}`,
        color: bankConfig[key].color
      };
    }
  }
  
  // 默认返回通用银行图标
  return defaultConfig;
}

/**
 * 银行图标映射（根据银行名称返回图标文本）
 * 用于向后兼容或作为 logo 加载失败时的备用方案
 */
function getBankIcon(bankName) {
  if (!bankName) return '🏦';
  
  const bankIconMap = {
    '中国工商银行': '工',
    '中国建设银行': '建',
    '中国农业银行': '农',
    '中国银行': '中',
    '交通银行': '交',
    '招商银行': '招',
    '浦发银行': '浦',
    '中信银行': '信',
    '光大银行': '光',
    '华夏银行': '华',
    '民生银行': '民',
    '广发银行': '广',
    '平安银行': '平',
    '兴业银行': '兴',
    '邮储银行': '邮',
    '其他银行': '🏦'
  };
  
  // 精确匹配
  if (bankIconMap[bankName]) {
    return bankIconMap[bankName];
  }
  
  // 模糊匹配（支持部分匹配）
  for (const key in bankIconMap) {
    // 移除"中国"、"银行"等通用词后匹配
    const simplifiedKey = key.replace(/中国|银行/g, '');
    const simplifiedName = bankName.replace(/中国|银行/g, '');
    if (simplifiedName.includes(simplifiedKey) || simplifiedKey.includes(simplifiedName)) {
      return bankIconMap[key];
    }
  }
  
  // 默认返回首字符（去除"中国"）
  const displayName = bankName.replace(/^中国/, '');
  return displayName.substring(0, 1);
}

/**
 * 获取所有银行的 logo URL 列表（用于预加载）
 * @returns {Array<string>} logo URL 列表
 */
function getAllBankLogos() {
  const baseUrl = getBaseUrl();
  const logos = new Set();
  
  // 添加所有银行的 logo
  Object.values(bankConfig).forEach(config => {
    logos.add(`${baseUrl}${config.logoPath}`);
  });
  
  // 添加默认 logo
  logos.add(`${baseUrl}/img/bank/none.png`);
  
  return Array.from(logos);
}

module.exports = {
  getBankConfig,
  getBankIcon,
  getAllBankLogos
};


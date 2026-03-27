/**
 * 全局配置文件
 * 统一管理 API 地址、超时时间等配置
 */

// 按环境配置 API 基础地址
const ENV_API_BASE_URL = {
  test: 'http://localhost:8081',
  prod: 'https://yixinjr.cn'
};

// 小程序环境到业务环境的映射
const ENV_MAP = {
  develop: 'test',
  trial: 'prod',
  release: 'prod'
};

/**
 * 获取 API 基础地址
 * 统一出口，避免业务侧分散硬编码默认值
 */
function getApiBaseUrl() {
  const envKey = ENV_MAP[ENV_VERSION] || 'prod';

  return ENV_API_BASE_URL[envKey] || ENV_API_BASE_URL.prod;
}

/**
 * 获取小程序环境标识
 */
function getMiniProgramEnvVersion() {
  try {
    if (typeof wx !== 'undefined' && wx.getAccountInfoSync) {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo && accountInfo.miniProgram
        ? accountInfo.miniProgram.envVersion
        : 'release';
    }
  } catch (e) {
    // 非小程序上下文或 API 不可用时，回退生产环境
  }
  return 'release';
}

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 30000;

// 缓存过期时间（毫秒）
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

// 小程序运行环境：develop | trial | release
const ENV_VERSION = getMiniProgramEnvVersion();
const IS_DEVELOP_ENV = ENV_VERSION === 'develop';

// 调试模式开关：仅本地开发环境开启
const DEBUG = IS_DEVELOP_ENV;
// vConsole 开关：仅本地开发环境开启
const ENABLE_VCONSOLE = IS_DEVELOP_ENV;

// 导出配置
module.exports = {
  // API 基础地址统一读取入口
  getApiBaseUrl,
  
  // 请求超时时间
  REQUEST_TIMEOUT,
  
  // 缓存过期时间
  CACHE_EXPIRE_TIME,
  
  // 调试模式
  DEBUG,

  // 当前运行环境
  ENV_VERSION,

  // 是否开发环境
  IS_DEVELOP_ENV,

  // vConsole 开关
  ENABLE_VCONSOLE,
  
  // 其他配置可以在这里添加
};


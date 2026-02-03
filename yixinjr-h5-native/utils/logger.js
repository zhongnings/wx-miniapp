/**
 * uni-app 日志工具类
 * 统一管理日志输出，方便调试和排查问题
 * 兼容微信小程序和 H5
 */

// 开发环境启用详细日志，生产环境关闭
const DEBUG = true; // 可以通过配置文件控制

const logger = {
  /**
   * 普通日志
   */
  log: (...args) => {
    if (DEBUG) {
      console.log('[LOG]', ...args);
    }
  },

  /**
   * 错误日志
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
    // 可以在这里添加错误上报逻辑
  },

  /**
   * 警告日志
   */
  warn: (...args) => {
    if (DEBUG) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * 信息日志
   */
  info: (...args) => {
    if (DEBUG) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * 调试日志（更详细的调试信息）
   */
  debug: (...args) => {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 网络请求日志
   */
  request: (url, method, data) => {
    if (DEBUG) {
      console.log('[REQUEST]', {
        url,
        method,
        data,
        time: new Date().toLocaleTimeString()
      });
    }
  },

  /**
   * 网络响应日志
   */
  response: (url, statusCode, data) => {
    if (DEBUG) {
      console.log('[RESPONSE]', {
        url,
        statusCode,
        data,
        time: new Date().toLocaleTimeString()
      });
    }
  },

  /**
   * 表格形式显示数据
   */
  table: (data) => {
    if (DEBUG) {
      console.table(data);
    }
  },

  /**
   * 分组日志
   */
  group: (label, callback) => {
    if (DEBUG) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};

module.exports = logger;


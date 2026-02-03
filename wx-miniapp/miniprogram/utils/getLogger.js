/**
 * 安全的 logger 加载工具
 * 解决微信小程序预加载时路径解析问题
 * 完全内联实现，不依赖其他模块
 */

// 开发环境启用详细日志，生产环境关闭
const DEBUG = true;

// 直接导出 logger 对象，不依赖 require
const logger = {
  log: (...args) => {
    if (DEBUG) {
      console.log('[LOG]', ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args) => {
    if (DEBUG) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args) => {
    if (DEBUG) {
      console.info('[INFO]', ...args);
    }
  },
  debug: (...args) => {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },
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
  table: (data) => {
    if (DEBUG) {
      console.table(data);
    }
  },
  group: (label, callback) => {
    if (DEBUG) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};

module.exports = logger;


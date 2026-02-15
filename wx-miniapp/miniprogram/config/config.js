/**
 * 全局配置文件
 * 统一管理 API 地址、超时时间等配置
 */

// API 基础地址配置
const API_BASE_URL = 'http://127.0.0.1:8081';

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 30000;

// 缓存过期时间（毫秒）
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天

// 导出配置
module.exports = {
  // API 基础地址
  API_BASE_URL,
  
  // 请求超时时间
  REQUEST_TIMEOUT,
  
  // 缓存过期时间
  CACHE_EXPIRE_TIME,
  
  // 其他配置可以在这里添加
};


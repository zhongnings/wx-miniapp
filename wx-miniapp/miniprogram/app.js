// 全局应用入口
// 说明：在这里把通用的请求工具挂载到 wx.$request，方便所有页面直接使用

// 根目录 utils/request.js（使用绝对路径更稳定）
const request = require('/utils/request');
// 通用上传工具，全局挂载，避免各页面路径问题
const uploadUtil = require('/utils/upload');

App({
  onLaunch() {
    // 挂载到 wx 全局对象
    // 使用方式示例：
    // wx.$request.get('/public/orders');
    wx.$request = request;
    // 上传工具统一挂载到 wx.$upload，避免各页面 require 路径差异
    wx.$upload = uploadUtil;
  },

  globalData: {
    // 预留全局数据
    uploadUtil
  }
});



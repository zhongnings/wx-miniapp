<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 挂载全局请求工具
    const request = require('./utils/request.js')
    const uploadUtil = require('./utils/upload.js')
    
    // uni-app 使用 uni 对象，兼容微信小程序的 wx 对象
    // #ifdef MP-WEIXIN
    wx.$request = request
    wx.$upload = uploadUtil
    // #endif
    
    // #ifndef MP-WEIXIN
    uni.$request = request
    uni.$upload = uploadUtil
    // #endif
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 引入H5样式修复 */
/* #ifdef H5 */
@import './common/h5-fix.css';
/* #endif */

/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 通用容器 */
.container {
  padding: 20rpx;
  box-sizing: border-box;
}

/* 通用按钮样式 */
.btn-primary {
  background-color: #ff6f6f;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 24rpx;
  text-align: center;
  font-size: 32rpx;
  border: none;
}

.btn-primary:active {
  opacity: 0.8;
}

.btn-disabled {
  background-color: #cccccc;
  color: #999999;
}

/* 通用输入框样式 */
.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 8rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  border: none;
  outline: none;
}

/* 通用卡片样式 */
.card {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 通用文本样式 */
.text-primary {
  color: #ff6f6f;
}

.text-secondary {
  color: #666666;
}

.text-muted {
  color: #999999;
}

/* 通用间距 */
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mt-30 { margin-top: 30rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.mb-30 { margin-bottom: 30rpx; }
.ml-10 { margin-left: 10rpx; }
.ml-20 { margin-left: 20rpx; }
.mr-10 { margin-right: 10rpx; }
.mr-20 { margin-right: 20rpx; }

/* 通用布局 */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}
</style>


<template>
  <view class="register-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @tap="goBack">
          <text class="navbar-icon">〈</text>
        </view>
        <view class="navbar-title">益信通</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- Logo 和欢迎区域 -->
    <view class="logo-background"></view>
    <view class="logo-section">
      <view class="logo-icon">☁️</view>
      <view class="app-title">益信通</view>
      <view class="welcome-text">欢迎注册账号信息</view>
    </view>

    <!-- 注册表单 -->
    <view class="register-form">
      <view class="form-title">账号注册</view>
      <view class="form-subtitle">请填写登录账号和密码</view>

      <form @submit="onSubmit">
        <!-- 用户名输入 -->
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">📧</text>
            <input
              class="form-input"
              name="reg_username"
              placeholder="请输入登录账号"
              v-model="username"
              maxlength="50"
              autocomplete="off"
            />
          </view>
        </view>

        <!-- 密码输入 -->
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input
              class="form-input"
              name="reg_password"
              password
              placeholder="请输入密码"
              v-model="password"
              maxlength="50"
              autocomplete="new-password"
            />
          </view>
        </view>

        <!-- 确认密码输入 -->
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input
              class="form-input"
              name="reg_confirmPassword"
              password
              placeholder="请再次输入密码"
              v-model="confirmPassword"
              maxlength="50"
              autocomplete="new-password"
            />
          </view>
        </view>

        <!-- 注册按钮 -->
        <button
          class="register-button"
          :class="{ active: !loading, disabled: loading }"
          form-type="submit"
          :disabled="loading"
          :loading="loading"
        >
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>
    </view>
  </view>
</template>

<script>
const logger = require('../../utils/logger.js');

export default {
  data() {
    return {
      loading: false,
      username: '',
      password: '',
      confirmPassword: ''
    };
  },
  
  onLoad() {
    logger.info('注册页面加载');
  },
  
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack({
        fail() {
          uni.redirectTo({ url: '/pages/login/index' });
        }
      });
    },
    
    /**
     * 提交注册
     */
    onSubmit(e) {
      const username = (this.username || '').trim();
      const password = this.password || '';
      const confirmPassword = this.confirmPassword || '';
      
      if (!username || !password || !confirmPassword) {
        uni.showToast({
          title: '请完整填写信息',
          icon: 'none'
        });
        return;
      }
      
      if (password !== confirmPassword) {
        uni.showToast({
          title: '两次密码不一致',
          icon: 'none'
        });
        return;
      }
      
      this.loading = true;
      
      // 获取请求工具
      const req = uni.$request || require('../../utils/request.js');
      
      req.request({
        url: '/auth/register',
        method: 'POST',
        data: { username, password, confirmPassword }
      }).then(() => {
        uni.showToast({
          title: '注册成功',
          icon: 'success'
        });
        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/login/index'
          });
        }, 1500);
      }).catch(err => {
        logger.error('注册失败:', err);
        uni.showToast({
          title: err.message || '注册失败',
          icon: 'none'
        });
      }).finally(() => {
        this.loading = false;
      });
    }
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

/* 自定义导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: transparent;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  height: 88rpx;
  position: relative;
}

.navbar-left {
  width: 60rpx;
  flex-shrink: 0;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.navbar-right {
  width: 60rpx;
  flex-shrink: 0;
}

.navbar-icon {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

/* Logo 区域 */
.logo-section {
  position: relative;
  padding: 100rpx 40rpx 40rpx;
  text-align: center;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.logo-background {
  position: absolute;
  top: 88rpx;
  left: 0;
  right: 0;
  height: 300rpx;
  z-index: 1;
  background: 
    linear-gradient(135deg, rgba(255, 111, 111, 0.1) 0%, transparent 50%),
    linear-gradient(225deg, rgba(255, 182, 193, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 20% 50%, rgba(255, 111, 111, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255, 182, 193, 0.08) 0%, transparent 50%);
  overflow: hidden;
}

.logo-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 60rpx,
      rgba(255, 111, 111, 0.03) 60rpx,
      rgba(255, 111, 111, 0.03) 120rpx
    );
  animation: slide 20s linear infinite;
}

@keyframes slide {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50rpx, 50rpx);
  }
}

.logo-icon {
  position: relative;
  font-size: 120rpx;
  color: #333;
  z-index: 3;
  margin-bottom: 10rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(255, 111, 111, 0.2));
}

.app-title {
  position: relative;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  z-index: 3;
}

.welcome-text {
  position: relative;
  font-size: 28rpx;
  color: #ff6f6f;
  z-index: 3;
  margin-top: 10rpx;
}

/* 注册表单区域 */
.register-form {
  flex: 1;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 10rpx 40rpx 40rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 2;
}

.form-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6f6f;
  margin-bottom: 16rpx;
  transition: all 0.3s ease;
  cursor: pointer;
}

.form-title.active {
  font-size: 48rpx;
  color: #ff6f6f;
  transform: scale(1.05);
}

.form-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 15rpx;
  display: flex;
  gap: 8rpx;
}

/* 表单组 */
.form-group {
  margin-bottom: 40rpx;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 2rpx solid #e0e0e0;
  padding: 0;
  height: 96rpx;
}

.input-icon {
  font-size: 36rpx;
  color: #ff6f6f;
  margin-right: 20rpx;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0;
}

/* #ifdef H5 */
/* 针对 uni-app 编译后的实际 input 元素 */
::v-deep .uni-input-input {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

::v-deep .uni-input-input:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

::v-deep .uni-input-placeholder {
  color: #999;
}
/* #endif */

/* 注册按钮 */
.register-button {
  width: 100%;
  height: 96rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-button.active {
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%);
  color: #ffffff;
}

.register-button.disabled {
  background: #e0e0e0;
  color: #999;
}

.register-button::after {
  border: none;
}
</style>


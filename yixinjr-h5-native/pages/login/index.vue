<template>
  <view class="login-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <!-- <view class="navbar-left" @tap="goBack">
          <text class="navbar-icon">〈</text>
        </view> -->
        <view class="navbar-title">益信通</view>
        <view class="navbar-right"></view>
      </view>
    </view>

    <!-- Logo 和欢迎区域 -->
    <view class="logo-background"></view>
    <view class="logo-section">
      <view class="logo-icon">☁️</view>
      <view class="app-title">益信通</view>
      <view class="welcome-text">欢迎登录益信通系统</view>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-title" :class="{ active: loginType === 'account' }" @tap="switchLoginType">账号登录</view>
      <view class="form-subtitle">
        <text class="subtitle-link" @tap="switchLoginType">点击切换</text>
        <text class="subtitle-text">账号登录</text>
      </view>

      <form @submit="onSubmit">
        <!-- 用户名输入 -->
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🆔</text>
            <input 
              class="form-input" 
              name="username" 
              placeholder="请输入用户名"
              v-model="username"
              maxlength="50"
            />
          </view>
        </view>

        <!-- 密码输入 -->
        <view class="form-group">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              class="form-input" 
              name="password" 
              :password="!showPassword"
              placeholder="请输入密码"
              v-model="password"
              maxlength="50"
            />
            <view class="password-toggle" @tap="togglePassword">
              <text class="toggle-icon">{{ showPassword ? '🙈' : '👁️' }}</text>
            </view>
          </view>
        </view>

        <!-- 忘记密码 / 注册 -->
        <view class="forgot-password">
          <text class="forgot-link" @tap="onForgotPassword">忘记密码</text>
          <text class="forgot-link register-link" @tap="goRegister">注册账号</text>
        </view>

        <!-- 用户协议 -->
        <view class="agreement-section">
          <checkbox-group @change="onAgreeChange">
            <label class="agreement-label">
              <checkbox value="agree" :checked="agreeTerms" class="agreement-checkbox"></checkbox>
              <text class="checkbox-icon" :class="{ checked: agreeTerms }">√</text>
              <text class="agreement-text">
                我已知晓并同意
                <text class="link-text" @tap.stop="onUserAgreement">《用户协议》</text>
                和
                <text class="link-text" @tap.stop="onPrivacyPolicy">《隐私协议》</text>
              </text>
            </label>
          </checkbox-group>
        </view>

        <!-- 登录按钮 -->
        <button 
          class="login-button"
          :class="{ active: agreeTerms && !loading, disabled: !agreeTerms || loading }"
          form-type="submit"
          :disabled="!agreeTerms || loading"
          :loading="loading"
        >
          {{ loading ? '登录中...' : '账号登录' }}
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
      publicKey: '',
      loading: false,
      showPassword: false,
      agreeTerms: false,
      loginType: 'account',
      username: '',
      password: '',
      userAgreementUrl: '/static/agreements/user-agreement.docx',
      privacyPolicyUrl: '/static/agreements/privacy-policy.docx',
      statusBarHeight: 0,
      navBarHeight: 0
    };
  },
  
  onLoad() {
    logger.info('登录页面加载');
    
    // 获取系统信息 - H5平台使用固定值
    // #ifdef H5
    this.statusBarHeight = 0;
    this.navBarHeight = 44;
    // #endif
    
    // #ifndef H5
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    this.navBarHeight = (systemInfo.statusBarHeight || 0) + 44;
    // #endif
    
    // 读取上次登录的用户名密码
    const lastLogin = uni.getStorageSync('LOGIN_LAST_CREDENTIAL') || {};
    this.username = lastLogin.username || '';
    this.password = lastLogin.password || '';
  },
  
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.redirectTo({ url: '/pages/home/index' });
      }
    },
    
    /**
     * 切换密码显示/隐藏
     */
    togglePassword() {
      this.showPassword = !this.showPassword;
      logger.debug('密码显示状态:', this.showPassword ? '显示' : '隐藏');
    },
    
    /**
     * 切换登录类型
     */
    switchLoginType() {
      this.loginType = 'account';
    },
    
    /**
     * 用户协议复选框变化
     */
    onAgreeChange(e) {
      const checked = e.detail.value.includes('agree');
      this.agreeTerms = checked;
    },
    
    /**
     * 忘记密码
     */
    onForgotPassword() {
      uni.showToast({
        title: '忘记密码功能待实现',
        icon: 'none'
      });
    },
    
    /**
     * 跳转到注册页面
     */
    goRegister() {
      uni.navigateTo({
        url: '/pages/register/index'
      });
    },
    
    /**
     * 预览协议通用方法
     */
    previewDocument(fileUrl, title) {
      if (!fileUrl) {
        uni.showToast({
          title: '协议文件地址未配置',
          icon: 'none'
        });
        return;
      }
      
      // #ifdef H5
      // H5 平台：直接在新窗口打开文档
      // 使用当前页面的协议和主机名
      const currentOrigin = window.location.origin;
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${currentOrigin}${fileUrl}`;
      
      logger.info(`打开协议文档: ${fullUrl}`);
      window.open(fullUrl, '_blank');
      // #endif
      
      // #ifndef H5
      // 小程序平台：下载并打开文档
      uni.showLoading({ title: '加载中...', mask: true });
      
      const req = uni.$request || require('../../utils/request.js');
      const baseUrl = req.BASE_URL || '';
      const isAbsolute = /^https?:\/\//i.test(fileUrl);
      const fullUrl = isAbsolute ? fileUrl : `${baseUrl}${fileUrl}`;
      
      uni.downloadFile({
        url: fullUrl,
        success: (res) => {
          const filePath = res.tempFilePath;
          uni.openDocument({
            filePath,
            fileType: 'docx',
            showMenu: true,
            success: () => {
              uni.hideLoading();
            },
            fail: (err) => {
              logger.error(`${title} 打开失败:`, err);
              uni.hideLoading();
              uni.showToast({
                title: '打开文档失败',
                icon: 'none'
              });
            }
          });
        },
        fail: (err) => {
          logger.error(`${title} 下载失败:`, err);
          uni.hideLoading();
          uni.showToast({
            title: '下载文档失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },
    
    /**
     * 用户协议
     */
    onUserAgreement() {
      this.previewDocument(this.userAgreementUrl, '用户协议');
    },
    
    /**
     * 隐私协议
     */
    onPrivacyPolicy() {
      this.previewDocument(this.privacyPolicyUrl, '隐私协议');
    },
    
    /**
     * 提交登录
     */
    onSubmit(e) {
      const username = (this.username || '').trim();
      const password = this.password || '';
      
      logger.debug('登录提交:', { username, password: '***' });
      
      if (!username || !password) {
        logger.warn('用户名或密码为空');
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        });
        return;
      }
      
      if (!this.agreeTerms) {
        uni.showToast({
          title: '请同意用户协议和隐私协议',
          icon: 'none'
        });
        return;
      }
      
      this.loading = true;
      
      // 获取请求工具
      const req = uni.$request || require('../../utils/request.js');
      
      // 直接传明文密码，后端使用 BCrypt 校验
      req.request({
        url: '/auth/login',
        method: 'POST',
        data: { username, password }
      }).then(res => {
        logger.info('登录成功:', res.data);
        
        const token = res.data.token || '';
        const userId = res.data.userId || '';
        const roles = res.data.roles || [];
        const permissions = res.data.permissions || [];
        const menus = res.data.menus || [];
        
        if (token) {
          uni.setStorageSync('TOKEN', token);
          uni.setStorageSync('USER_ID', userId);
          uni.setStorageSync('ROLES', roles);
          uni.setStorageSync('PERMISSIONS', permissions);
          uni.setStorageSync('MENUS', menus);
          logger.info('Token/用户信息已保存', { userId, roles });
        }
        
        // 保存本次登录用户名密码
        uni.setStorageSync('LOGIN_LAST_CREDENTIAL', { username, password });
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/order/list/index' });
        }, 1500);
      }).catch(err => {
        logger.error('登录失败:', err);
        uni.showToast({
          title: err.message || '登录失败',
          icon: 'none',
          duration: 2000
        });
      }).finally(() => {
        this.loading = false;
      });
    }
  }
};
</script>

<style scoped>
/* 登录页面样式 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
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
  padding-top: env(safe-area-inset-top);
}

/* #ifdef H5 */
.custom-navbar {
  padding-top: 0;
}
/* #endif */

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  height: 88rpx;
  position: relative;
}

/* #ifdef H5 */
.navbar-content {
  height: 44px;
  padding: 10px 15px;
}
/* #endif */

/* .navbar-left {
  width: 60rpx;
  flex-shrink: 0;
} */

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

/* 登录表单区域 */
.login-form {
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

.subtitle-link {
  color: #ff6f6f;
  cursor: pointer;
}

.subtitle-text {
  color: #999;
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

/* 深度选择器：确保样式作用到input组件内部 */
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

.password-toggle {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.toggle-icon {
  font-size: 36rpx;
  color: #999;
}

/* 忘记密码 */
.forgot-password {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 25rpx;
  gap: 20rpx;
}

.forgot-link {
  font-size: 28rpx;
  color: #ff6f6f;
}

.register-link {
  color: #999;
}

/* 用户协议 */
.agreement-section {
  margin-bottom: 100rpx;
}

.agreement-label {
  display: flex;
  align-items: flex-start;
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  position: relative;
}

.agreement-checkbox {
  margin-right: 16rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
  transform: scale(1.2);
}

.checkbox-icon {
  position: absolute;
  left: 2px;
  top: 6rpx;
  font-size: 24rpx;
  color: transparent;
  pointer-events: none;
  z-index: 1;
}

.checkbox-icon.checked {
  color: #ffffff;
}

/* 复选框选中状态样式 */
checkbox .wx-checkbox-input.wx-checkbox-input-checked::before,
checkbox .uni-checkbox-input.uni-checkbox-input-checked::before {
  color: transparent !important;
}

checkbox .wx-checkbox-input.wx-checkbox-input-checked,
checkbox .uni-checkbox-input.uni-checkbox-input-checked {
  background-color: #ff6f6f !important;
  border-color: #ff6f6f !important;
}

/* #ifdef H5 */
.agreement-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #ff6f6f;
  cursor: pointer;
}

/* H5 复选框样式强化 */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  background: #fff;
}

input[type="checkbox"]:checked {
  background-color: #ff6f6f;
  border-color: #ff6f6f;
}
/* #endif */

.agreement-text {
  flex: 1;
  word-wrap: break-word;
  white-space: normal;
}

.link-text {
  color: #ff6f6f;
  display: inline;
}

/* 登录按钮 */
.login-button {
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

.login-button.active {
  background: linear-gradient(135deg, #ff6f6f 0%, #ee5a6f 100%);
  color: #ffffff;
}

.login-button.disabled {
  background: #e0e0e0;
  color: #999;
}

.login-button::after {
  border: none;
}
</style>


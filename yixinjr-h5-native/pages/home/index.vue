<template>
  <view class="home-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="showMenu">
        <view class="navbar-icon-wrapper">
          <text class="navbar-icon">🏠</text>
        </view>
      </view>
      <view class="navbar-title">贷款管理</view>
      <view class="navbar-right">
        <view class="navbar-icon-wrapper">
          <text class="navbar-icon">⋯</text>
        </view>
        <view class="navbar-icon-wrapper">
          <text class="navbar-icon">○</text>
        </view>
      </view>
    </view>

    <!-- 主内容区域 -->
    <scroll-view class="content-area" scroll-y enhanced show-scrollbar="{{false}}">
      <view class="welcome-section">
        <text class="welcome-text">欢迎使用贷款管理系统</text>
      </view>
    </scroll-view>

    <!-- 菜单抽屉 -->
    <view class="menu-drawer" :class="{ show: showMenuDrawer }" @tap="hideMenu">
      <view class="menu-content" @tap.stop="stopPropagation">
        <view class="menu-header">
          <text class="menu-title">选择菜单</text>
          <text class="menu-close" @tap="hideMenu">×</text>
        </view>
        <view class="menu-list">
          <view 
            class="menu-item"
            :class="{ active: currentMenu === item.key }"
            v-for="item in menuList" 
            :key="item.key"
            :data-key="item.key"
            :data-path="item.path"
            @tap="onMenuClick"
          >
            <text class="menu-text">{{ item.label }}</text>
            <text class="menu-check" v-if="currentMenu === item.key">✓</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const logger = require('../../utils/logger.js');

export default {
  data() {
    return {
      showMenuDrawer: false,
      currentMenu: 'home',
      menuList: [],
      statusBarHeight: 0,
      navBarHeight: 0
    };
  },
  
  onLoad() {
    logger.info('首页加载');
    this.loadUserMenu();
    
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
  },
  
  methods: {
    /**
     * 加载用户菜单（根据权限）
     */
    loadUserMenu() {
      // 仅使用登录时缓存的菜单，避免重复请求
      const cached = uni.getStorageSync('MENUS') || [];
      if (cached && cached.length) {
        this.menuList = cached.map(item => ({
          key: item.code || item.key,
          label: item.name || item.label,
          path: item.path
        }));
        logger.info('用户菜单加载完成（缓存）:', cached);
      } else {
        // 默认菜单
        this.menuList = [
          { key: 'order:list', label: '订单列表', path: '/pages/order/list/index' }
        ];
        logger.info('未找到缓存菜单，使用默认菜单');
      }
    },
    
    /**
     * 显示菜单
     */
    showMenu() {
      this.showMenuDrawer = true;
    },
    
    /**
     * 隐藏菜单
     */
    hideMenu() {
      this.showMenuDrawer = false;
    },
    
    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡
    },
    
    /**
     * 菜单项点击
     */
    onMenuClick(e) {
      const key = e.currentTarget.dataset.key;
      const path = e.currentTarget.dataset.path;
      this.currentMenu = key;
      this.showMenuDrawer = false;
      
      if (path) {
        uni.redirectTo({ url: path });
      } else {
        uni.showToast({
          title: '功能待实现',
          icon: 'none'
        });
      }
    },
    
    /**
     * 跳转到订单列表
     */
    goOrderList() {
      uni.redirectTo({
        url: '/pages/order/list/index'
      });
    },
    
    /**
     * 资金账户管理
     */
    goAccount() {
      uni.showToast({
        title: '资金账户管理功能待实现',
        icon: 'none'
      });
    }
  }
};
</script>

<style scoped>
/* 首页样式 */
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #ff6f6f;
  padding: 0 30rpx;
  padding-top: env(safe-area-inset-top);
  color: #ffffff;
}

/* #ifdef H5 */
.navbar {
  height: 44px;
  padding: 0 15px;
  padding-top: 0;
}
/* #endif */

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 500;
  color: #ffffff;
}

.navbar-icon-wrapper {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.navbar-icon {
  font-size: 36rpx;
  color: #ffffff;
}

/* 主内容区域 */
.content-area {
  height: calc(100vh - 88rpx - env(safe-area-inset-top));
  padding: 40rpx 30rpx;
}

/* #ifdef H5 */
.content-area {
  height: calc(100vh - 44px);
  padding: 20px 15px;
}
/* #endif */

.welcome-section {
  text-align: center;
  padding: 100rpx 0;
}

.welcome-text {
  font-size: 32rpx;
  color: #666;
}

/* 菜单抽屉 */
.menu-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: none;
}

.menu-drawer.show {
  display: block;
}

.menu-content {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 70%;
  max-width: 500rpx;
  background: #ffffff;
  box-shadow: 2rpx 0 8rpx rgba(0, 0, 0, 0.1);
  animation: slideLeft 0.3s ease-out;
}

@keyframes slideLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #ff6f6f;
  color: #ffffff;
}

.menu-title {
  font-size: 32rpx;
  font-weight: 500;
}

.menu-close {
  font-size: 48rpx;
  line-height: 1;
}

.menu-list {
  padding: 20rpx 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  font-size: 28rpx;
  color: #333;
  border-left: 4rpx solid transparent;
}

.menu-item.active {
  color: #ff6f6f;
  background: #fff5f5;
  border-left-color: #ff6f6f;
}

.menu-check {
  color: #ff6f6f;
  font-size: 32rpx;
}
</style>


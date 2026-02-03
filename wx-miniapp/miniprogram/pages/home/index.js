const logger = require('../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    showMenuDrawer: false,
    currentMenu: 'home',
    menuList: []
  },

  onLoad() {
    logger.info('首页加载');
    this.loadUserMenu();
    
    // 获取系统信息，设置导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0,
      navBarHeight: (systemInfo.statusBarHeight || 0) + 44
    });
  },

  /**
   * 加载用户菜单（根据权限）
   */
  loadUserMenu() {
    // 仅使用登录时缓存的菜单，避免重复请求
    const cached = wx.getStorageSync('MENUS') || [];
    if (cached && cached.length) {
      this.setData({
        menuList: cached.map(item => ({
          key: item.code || item.key,
          label: item.name || item.label,
          path: item.path
        }))
      });
      logger.info('用户菜单加载完成（缓存）:', cached);
    } else {
      // 默认菜单
      this.setData({
        menuList: [
          { key: 'order:list', label: '订单列表', path: '/pages/order/list/index' }
        ]
      });
      logger.info('未找到缓存菜单，使用默认菜单');
    }
  },

  /**
   * 显示菜单
   */
  showMenu() {
    this.setData({ showMenuDrawer: true });
  },

  /**
   * 隐藏菜单
   */
  hideMenu() {
    this.setData({ showMenuDrawer: false });
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
    this.setData({ currentMenu: key, showMenuDrawer: false });
    
    if (path) {
      wx.redirectTo({ url: path });
    } else {
      wx.showToast({
        title: '功能待实现',
        icon: 'none'
      });
    }
  },

  /**
   * 跳转到订单列表（兼容旧代码）
   */
  goOrderList() {
    wx.redirectTo({
      url: '/pages/order/list/index'
    });
  },

  /**
   * 资金账户管理（兼容旧代码）
   */
  goAccount() {
    wx.showToast({
      title: '资金账户管理功能待实现',
      icon: 'none'
    });
  }
});



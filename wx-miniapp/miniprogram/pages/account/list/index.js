// 使用统一的 logger 工具
const logger = require('../../../utils/logger.js');

Page({
  data: {
    accountList: [], // 账户列表
    loading: false,
    hasAccounts: false,
    showMenuDrawer: false, // 是否显示菜单抽屉
    currentMenu: 'account', // 当前菜单
    deleteIconUrl: '', // 删除图标URL
    settingIconUrl: '', // 设置图标URL
    menuList: [
      { key: 'order', label: '订单列表', path: '/pages/order/list/index' },
      { key: 'account', label: '资金账户管理', path: '/pages/account/list/index' }
    ]
  },

  onLoad(options) {
    logger.info('资金账户列表页面加载', options);
    
    // 初始化图标URL
    this.setData({
      deleteIconUrl: wx.$placeholders.DELETE_ICON,
      settingIconUrl: wx.$placeholders.SETTING_ICON
    });
    
    this.loadAccountList();
  },

  onShow() {
    // 每次显示时重新加载列表
    this.loadAccountList();
  },

  // 加载账户列表
  async loadAccountList() {
    this.setData({ loading: true });
    
    try {
      const req = wx.$request;
      const result = await req.get('/public/accounts/list');
      
      logger.info('[账户列表] 后端返回数据', result);
      
      // 处理数据
      let dataList = [];
      if (result.data && Array.isArray(result.data)) {
        dataList = result.data;
      } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
        dataList = result.data.data;
      }
      
      this.setData({
        accountList: dataList,
        hasAccounts: dataList.length > 0,
        loading: false
      });
      
      logger.info('[账户列表] 加载成功', { count: dataList.length });
    } catch (err) {
      logger.error('[账户列表] 加载失败', err);
      this.setData({
        accountList: [],
        hasAccounts: false,
        loading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 添加账户
  addAccount() {
    wx.navigateTo({
      url: '/pages/account/add/index'
    });
  },

  // 查看账户详情
  viewAccount(e) {
    const accountId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/account/detail/index?id=${accountId}`
    });
  },

  // 编辑账户
  editAccount(e) {
    const accountId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/account/add/index?id=${accountId}`
    });
  },

  // 删除账户
  deleteAccount(e) {
    const accountId = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该账户吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const req = wx.$request;
            await req.delete(`/public/accounts/${accountId}`);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 重新加载列表
            that.loadAccountList();
          } catch (err) {
            logger.error('[账户列表] 删除失败', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 设置账户（暂时跳转到编辑页面，后续可以扩展为设置菜单）
  settingAccount(e) {
    const accountId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/account/add/index?id=${accountId}`
    });
  },

  // 显示菜单
  showMenu() {
    this.setData({
      showMenuDrawer: true
    });
  },

  // 隐藏菜单
  hideMenu() {
    this.setData({
      showMenuDrawer: false
    });
  },

  // 菜单项点击
  onMenuClick(e) {
    const key = e.currentTarget.dataset.key;
    const path = e.currentTarget.dataset.path;
    
    if (key === this.data.currentMenu) {
      // 当前菜单，关闭抽屉
      this.hideMenu();
      return;
    }
    
    // 跳转到对应页面 - 使用 navigateBack 返回上一页
    wx.navigateBack({
      delta: 1
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
});


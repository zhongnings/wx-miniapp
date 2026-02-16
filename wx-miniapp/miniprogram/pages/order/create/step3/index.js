// 内联 logger，避免微信小程序预加载时路径解析问题
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args),
  request: (url, method, data) => DEBUG && console.log('[REQUEST]', { url, method, data, time: new Date().toLocaleTimeString() }),
  response: (url, statusCode, data) => DEBUG && console.log('[RESPONSE]', { url, statusCode, data, time: new Date().toLocaleTimeString() }),
  table: (data) => DEBUG && console.table(data),
  group: (label, callback) => {
    if (DEBUG) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};

// 引入导航工具
const navigation = require('../../../../utils/navigation.js');

Page({
  data: {
    currentStep: 2, // 当前步骤（0-5，step3对应索引2）
    tabsScrollLeft: 0, // 导航栏滚动位置
    hasCoBorrower: false, // 是否有共借人
    coBorrower: null, // 共借人信息（单个）
    // 图标URL
    deleteIconUrl: '',
    // 是否只读（从订单详情进入查看模式时为 true，或订单状态为0/2时为true）
    readonly: false,
    // 是否从订单详情页进入（用于判断导航栏tab是否可点击）
    fromOrderDetail: false,
    // 当前订单ID（从订单详情进入时传入）
    orderId: null,
    // 订单状态（0-待提交，2-风控驳回时为只读）
    orderStatus: null
  },

  onLoad(options) {
    logger.info('订单创建步骤3：共借人信息页面加载', options);
    
    // 初始化图标URL
    this.setData({
      deleteIconUrl: wx.$placeholders.DELETE_ICON
    });
    
    // 标记首次显示，避免 onShow 重复加载
    this._isFirstShow = true;
    
    // 使用导航工具初始化订单上下文
    // step3 只读取全局上下文，不主动设置（除非从订单详情进入）
    const context = navigation.initOrderContextFromOptions(options, false);
    const readonly = navigation.calculateReadonly(context.mode, context.orderStatus);
    
    this.setData({
      readonly: readonly,
      fromOrderDetail: context.fromOrderDetail,
      orderId: context.orderId,
      orderStatus: context.orderStatus
    });
    
    // 加载共借人数据
    if (context.orderId) {
      // 从后端加载
      this.loadCoBorrowerFromServer(context.orderId);
    } else {
      // 从本地加载
      this.loadCoBorrowerFromLocal();
    }
    
    // 计算并设置导航栏滚动位置
    this.calculateTabsScroll();
  },

  onShow() {
    // 跳过首次显示（避免与 onLoad 重复加载）
    if (this._isFirstShow) {
      this._isFirstShow = false;
      return;
    }
    
    // 非首次显示，重新加载共借人数据
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    if (orderId) {
      this.loadCoBorrowerFromServer(orderId);
    } else {
      this.loadCoBorrowerFromLocal();
    }
  },

  // 从后端加载共借人数据
  async loadCoBorrowerFromServer(orderId) {
    logger.info('[共借人] 从后端加载', { orderId });
    
    try {
      const req = wx.$request;
      const result = await req.get(`/public/orders/${orderId}/coBorrower/list`);
      
      logger.info('[共借人] 后端返回完整数据', result);
      logger.info('[共借人] result.success =', result.success);
      logger.info('[共借人] result.data =', result.data);
      logger.info('[共借人] result.data 是否为数组 =', Array.isArray(result.data));
      
      // 处理数据：result 本身可能就包含 data、success、total
      let dataList = null;
      
      if (result.data && Array.isArray(result.data)) {
        // result.data 直接是数组
        dataList = result.data;
        logger.info('[共借人] 数据在 result.data 中（数组）');
      } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
        // result.data.data 是数组
        dataList = result.data.data;
        logger.info('[共借人] 数据在 result.data.data 中（数组）');
      }
      
      logger.info('[共借人] 解析后的数据列表', dataList);
      
      // 取第一个作为共借人（当前只支持一个共借人）
      const coBorrower = dataList && dataList.length > 0 ? dataList[0] : null;
      this.setData({
        hasCoBorrower: coBorrower !== null,
        coBorrower: coBorrower
      });
      logger.info('[共借人] 设置状态', { hasCoBorrower: coBorrower !== null, coBorrower });
    } catch (err) {
      logger.error('[共借人] 后端加载失败', err);
      // 加载失败时尝试从本地加载
      this.loadCoBorrowerFromLocal();
    }
  },

  // 从本地存储加载共借人数据
  loadCoBorrowerFromLocal() {
    const savedData = wx.getStorageSync('orderFormData_step3');
    if (savedData && savedData.coBorrower) {
      logger.info('[共借人] 从本地加载成功', savedData.coBorrower);
      this.setData({
        hasCoBorrower: true,
        coBorrower: savedData.coBorrower
      });
    } else {
      logger.info('[共借人] 本地无数据');
      this.setData({
        hasCoBorrower: false,
        coBorrower: null
      });
    }
  },

  /**
   * 计算导航栏滚动位置，让当前选中的tab居中或适当位置
   */
  calculateTabsScroll() {
    const currentStep = this.data.currentStep;
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    const screenHeight = systemInfo.windowHeight;
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    const totalWidth = tabWidthPx * 6;
    const screenCenter = screenWidth / 2;
    const currentTabStart = currentStep * tabWidthPx;
    const currentTabCenter = currentTabStart + tabWidthPx / 2;
    const currentTabEnd = currentTabStart + tabWidthPx;
    
    let scrollLeft = 0;
    let calculationRule = '';
    
    if (currentStep === 0 || currentStep === 1) {
      // 第1、2个：最左（不滚动，保持原样）
      scrollLeft = 0;
      calculationRule = `第${currentStep + 1}个：最左（scrollLeft = 0，不滚动）`;
    } else if (currentStep === 2) {
      // 第3个（共借人信息）：根据日志，scrollLeft = 50.15px左右
      scrollLeft = 50.15;
      calculationRule = '第3个（共借人信息）：固定位置（scrollLeft = 50.15px）';
    } else if (currentStep === 3) {
      // 第4个（担保人信息）：根据日志，scrollLeft = 154.15px左右
      scrollLeft = 154.15;
      calculationRule = '第4个（担保人信息）：固定位置（scrollLeft = 154.15px）';
    } else if (currentStep === 4 || currentStep === 5) {
      // 第5、6个：根据日志，scrollLeft = 221.16px左右
      scrollLeft = 221.16;
      calculationRule = `第${currentStep + 1}个：固定位置（scrollLeft = 221.16px）`;
    }
    
    const originalScrollLeft = scrollLeft;
    scrollLeft = Math.max(0, scrollLeft);
    const tabVisibleStart = currentTabStart - scrollLeft;
    const tabVisibleCenter = currentTabCenter - scrollLeft;
    const tabVisibleEnd = currentTabEnd - scrollLeft;
    
    logger.info('========== 导航栏滚动位置计算 ==========');
    logger.info('页面信息:', { page: 'step3', currentStep, stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep] });
    logger.info('屏幕信息:', { screenWidth: `${screenWidth}px`, screenHeight: `${screenHeight}px`, screenCenter: `${screenCenter.toFixed(2)}px` });
    logger.info('Tab尺寸信息:', { tabWidthRpx: `${tabWidthRpx}rpx`, tabWidthPx: `${tabWidthPx.toFixed(2)}px`, totalWidth: `${totalWidth.toFixed(2)}px`, tabCount: 6 });
    logger.info('当前Tab位置（滚动前）:', { tabStart: `${currentTabStart.toFixed(2)}px`, tabCenter: `${currentTabCenter.toFixed(2)}px`, tabEnd: `${currentTabEnd.toFixed(2)}px` });
    logger.info('计算规则:', calculationRule);
    logger.info('滚动位置计算:', { originalScrollLeft: `${originalScrollLeft.toFixed(2)}px`, finalScrollLeft: `${scrollLeft.toFixed(2)}px`, adjusted: originalScrollLeft !== scrollLeft ? '是（已调整为非负数）' : '否' });
    logger.info('当前Tab位置（滚动后）:', { visibleStart: `${tabVisibleStart.toFixed(2)}px`, visibleCenter: `${tabVisibleCenter.toFixed(2)}px`, visibleEnd: `${tabVisibleEnd.toFixed(2)}px`, isCentered: Math.abs(tabVisibleCenter - screenCenter) < 1 ? '是' : '否', centerOffset: `${(tabVisibleCenter - screenCenter).toFixed(2)}px` });
    logger.info('========================================');
    
    this.setData({ tabsScrollLeft: scrollLeft });
  },

  /**
   * 导航栏滚动事件监听
   */
  onTabsScroll(e) {
    const scrollLeft = e.detail.scrollLeft;
    const scrollWidth = e.detail.scrollWidth;
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    const scrollBarLeft = scrollLeft;
    const scrollBarRight = scrollLeft + screenWidth;
    const scrollBarCenter = scrollLeft + screenWidth / 2;
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    const visibleTabs = [];
    for (let i = 0; i < 6; i++) {
      const tabStart = i * tabWidthPx;
      const tabCenter = tabStart + tabWidthPx / 2;
      const tabEnd = tabStart + tabWidthPx;
      const tabVisibleStart = tabStart - scrollLeft;
      const tabVisibleCenter = tabCenter - scrollLeft;
      const tabVisibleEnd = tabEnd - scrollLeft;
      if (tabVisibleEnd >= 0 && tabVisibleStart <= screenWidth) {
        visibleTabs.push({
          index: i,
          name: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][i],
          visibleCenter: `${tabVisibleCenter.toFixed(2)}px`,
          distanceFromCenter: `${(tabVisibleCenter - screenWidth / 2).toFixed(2)}px`,
          isActive: i === this.data.currentStep
        });
      }
    }
    logger.info('========== 导航栏手动滚动 ==========');
    logger.info('滚动条位置:', { scrollBarLeft: `${scrollBarLeft.toFixed(2)}px`, scrollBarCenter: `${scrollBarCenter.toFixed(2)}px`, scrollBarRight: `${scrollBarRight.toFixed(2)}px`, screenCenter: `${(screenWidth / 2).toFixed(2)}px` });
    logger.info('可见Tab:', visibleTabs);
    logger.info('====================================');
  },

  /**
   * 导航栏tab点击事件
   * 如果从订单详情页进入，可以点击tab跳转到对应页面
   */
  onTabClick(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    navigation.navigateToStep(step, this.data.currentStep);
  },

  goBack() {
    wx.navigateBack();
  },

  goPrev() {
    wx.navigateBack();
  },

  // 添加/编辑共借人
  editCoBorrower() {
    // 只读模式下不允许编辑
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    const orderStatus = this.data.orderStatus;
    let url = '/pages/order/create/co-borrower/index';
    
    // 如果有orderId，传递给co-borrower页面
    if (orderId) {
      url += `?orderId=${orderId}`;
    }
    
    // 传递订单状态
    if (orderStatus != null) {
      url += (url.includes('?') ? '&' : '?') + `orderStatus=${orderStatus}`;
    }
    
    wx.navigateTo({
      url: url
    });
  },

  // 删除共借人
  deleteCoBorrower() {
    // 只读模式下不允许删除
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除共借人信息吗？',
      success: async (res) => {
        if (res.confirm) {
          const orderId = that.data.orderId || wx.getStorageSync('currentOrderId');
          
          // 清除本地数据
          wx.removeStorageSync('orderFormData_step3');
          that.setData({
            hasCoBorrower: false,
            coBorrower: null
          });
          
          // 如果有orderId，调用后端删除接口
          if (orderId) {
            try {
              const req = wx.$request;
              await req.delete(`/public/orders/${orderId}/coBorrower`);
              logger.info('[共借人] 删除成功');
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } catch (err) {
              logger.error('[共借人] 删除失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          } else {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      }
    });
  },

  // 下一步
  goNext() {
    // 共借人是可选的，直接进入下一步
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    
    if (!orderId) {
      wx.showToast({
        title: '请先完成前面的步骤',
        icon: 'none'
      });
      return;
    }
    
    // 直接跳转到下一步
    this.goNextInternal();
  },

  // 跳转到下一步（步骤4）
  goNextInternal() {
    navigation.goNext(this.data.currentStep);
  },

  // 上一步
  goPrev() {
    navigation.goPrev(this.data.currentStep);
  }
});


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

Page({
  data: {
    currentStep: 3, // 当前步骤（0-5，step4对应索引3）
    tabsScrollLeft: 0, // 导航栏滚动位置
    hasGuarantor: false, // 是否有担保人
    guarantor: null, // 担保人信息（单个）
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
    logger.info('订单创建步骤4：担保人信息页面加载', options);
    
    // 判断是否从订单详情页进入
    const mode = options?.mode || 'create';
    // 优先从 orderId 参数获取，其次从 id 参数获取（兼容旧逻辑）
    const orderId = options?.orderId || options?.id || null;
    // 获取订单状态（如果有）
    const orderStatus = options?.orderStatus || null;
    
    // 判断是否只读：
    // 1. 订单状态为0(待提交)或2(风控驳回)时，允许编辑（不是只读）
    // 2. 其他状态且mode为view时，为只读
    const isEditableByStatus = orderStatus === "0" || orderStatus === "2";
    const readonly = mode === 'view' && !isEditableByStatus;
    
    this.setData({
      readonly: readonly,
      fromOrderDetail: mode === 'view' && orderId !== null,
      orderId: orderId,
      orderStatus: orderStatus
    });
    
    // 加载担保人数据
    if (orderId) {
      // 从后端加载
      this.loadGuarantorFromServer(orderId);
    } else {
      // 从本地加载
      this.loadGuarantorFromLocal();
    }
    
    // 计算并设置导航栏滚动位置
    this.calculateTabsScroll();
  },

  onShow() {
    // 每次页面显示时重新加载担保人数据（但跳过首次加载，避免与 onLoad 重复）
    if (this.data.guarantor !== null || this.data.hasGuarantor) {
      const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
      if (orderId) {
        this.loadGuarantorFromServer(orderId);
      } else {
        this.loadGuarantorFromLocal();
      }
    }
  },

  // 从后端加载担保人数据
  async loadGuarantorFromServer(orderId) {
    logger.info('[担保人] 从后端加载', { orderId });
    
    try {
      const req = wx.$request;
      const result = await req.get(`/public/orders/${orderId}/guarantor/list`);
      
      logger.info('[担保人] 后端返回完整数据', result);
      logger.info('[担保人] result.success =', result.success);
      logger.info('[担保人] result.data =', result.data);
      logger.info('[担保人] result.data 是否为数组 =', Array.isArray(result.data));
      
      // 处理数据：result 本身可能就包含 data、success、total
      let dataList = null;
      
      if (result.data && Array.isArray(result.data)) {
        // result.data 直接是数组
        dataList = result.data;
        logger.info('[担保人] 数据在 result.data 中（数组）');
      } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
        // result.data.data 是数组
        dataList = result.data.data;
        logger.info('[担保人] 数据在 result.data.data 中（数组）');
      }
      
      logger.info('[担保人] 解析后的数据列表', dataList);
      
      // 取第一个作为担保人（当前只支持一个担保人）
      const guarantor = dataList && dataList.length > 0 ? dataList[0] : null;
      if (guarantor) {
        // 保存担保人ID，用于更新
        this._guarantorId = guarantor.id;
      }
      this.setData({
        hasGuarantor: guarantor !== null,
        guarantor: guarantor
      });
      logger.info('[担保人] 设置状态', { hasGuarantor: guarantor !== null, guarantor });
    } catch (err) {
      logger.error('[担保人] 后端加载失败', err);
      // 加载失败时尝试从本地加载
      this.loadGuarantorFromLocal();
    }
  },

  // 从本地存储加载担保人数据
  loadGuarantorFromLocal() {
    const savedData = wx.getStorageSync('orderFormData_step4');
    if (savedData && savedData.guarantor) {
      logger.info('[担保人] 从本地加载成功', savedData.guarantor);
      this.setData({
        hasGuarantor: true,
        guarantor: savedData.guarantor
      });
    } else {
      logger.info('[担保人] 本地无数据');
      this.setData({
        hasGuarantor: false,
        guarantor: null
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
    logger.info('页面信息:', { page: 'step4', currentStep, stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep] });
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
    logger.info('========== 导航栏tab点击事件 ==========');
    logger.info('当前页面数据:', {
      fromOrderDetail: this.data.fromOrderDetail,
      orderId: this.data.orderId,
      currentStep: this.data.currentStep
    });
    
    if (!this.data.fromOrderDetail) {
      logger.warn('不是从订单详情页进入，不允许跳转');
      return;
    }
    
    const step = parseInt(e.currentTarget.dataset.step);
    const currentStep = this.data.currentStep;
    
    logger.info('点击信息:', {
      clickedStep: step,
      currentStep: currentStep,
      stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][step]
    });
    
    if (step === currentStep) {
      logger.info('点击的是当前页面，不跳转');
      return;
    }
    
    const stepPages = [
      '/pages/order/create/step1/index',
      '/pages/order/create/step2/index',
      '/pages/order/create/step3/index',
      '/pages/order/create/step4/index',
      '/pages/order/create/step5/index',
      '/pages/order/create/step6/index'
    ];
    
    const orderId = this.data.orderId;
    if (!orderId) {
      logger.error('订单ID为空，无法跳转');
      wx.showToast({
        title: '订单ID缺失',
        icon: 'none'
      });
      return;
    }
    
    const orderStatus = this.data.orderStatus;
    const url = `${stepPages[step]}?mode=view&id=${orderId}${orderStatus ? '&orderStatus=' + orderStatus : ''}`;
    logger.info('准备跳转:', { from: currentStep, to: step, url, orderId, orderStatus });
    
    // 获取页面栈信息
    const pages = getCurrentPages();
    logger.info('当前页面栈:', {
      stackLength: pages.length,
      currentPage: pages[pages.length - 1]?.route,
      pages: pages.map(p => p.route)
    });
    
    wx.navigateTo({
      url: url,
      success: (res) => {
        logger.info('页面跳转成功:', res);
      },
      fail: (err) => {
        logger.error('页面跳转失败:', err);
        // 如果 navigateTo 失败，尝试使用 redirectTo
        logger.info('尝试使用 redirectTo 跳转');
        wx.redirectTo({
          url: url,
          success: (res) => {
            logger.info('redirectTo 跳转成功:', res);
          },
          fail: (err2) => {
            logger.error('redirectTo 也失败:', err2);
            wx.showToast({
              title: '跳转失败: ' + (err2.errMsg || '未知错误'),
              icon: 'none',
              duration: 3000
            });
          }
        });
      }
    });
    
    logger.info('====================================');
  },

  goBack() {
    wx.navigateBack();
  },

  goPrev() {
    wx.navigateBack();
  },

  // 添加/编辑担保人
  editGuarantor() {
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
    let url = '/pages/order/create/guarantor/index';
    
    // 如果有orderId，传递给guarantor页面
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

  // 删除担保人
  deleteGuarantor() {
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
      content: '确定要删除担保人信息吗？',
      success: async (res) => {
        if (res.confirm) {
          const orderId = that.data.orderId || wx.getStorageSync('currentOrderId');
          
          // 清除本地数据
          wx.removeStorageSync('orderFormData_step4');
          that.setData({
            hasGuarantor: false,
            guarantor: null
          });
          
          // 如果有orderId，调用后端删除接口
          if (orderId) {
            try {
              const req = wx.$request;
              await req.delete(`/public/orders/${orderId}/guarantor`);
              logger.info('[担保人] 删除成功');
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } catch (err) {
              logger.error('[担保人] 删除失败', err);
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
    // 担保人是可选的，直接进入下一步
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

  // 跳转到下一步（步骤5）
  goNextInternal() {
    let url = '/pages/order/create/step5/index';
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    if (orderId) {
      // 如果有 orderId，传递到下一步
      url += `?orderId=${orderId}`;
    }
    if (this.data.fromOrderDetail && orderId) {
      url += (url.includes('?') ? '&' : '?') + `mode=view&id=${orderId}`;
    }
    wx.navigateTo({ url });
  },

  // 上一步
  goPrev() {
    // 如果是从订单详情页进入，跳转到上一个step页面
    if (this.data.fromOrderDetail && this.data.orderId) {
      wx.redirectTo({
        url: `/pages/order/create/step3/index?mode=view&id=${this.data.orderId}`
      });
    } else {
      wx.navigateBack();
    }
  }
});

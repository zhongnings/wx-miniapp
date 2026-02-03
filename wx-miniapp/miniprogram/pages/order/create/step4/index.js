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
    formData: {
      guaranteeSignMethod: '否'
    },
    guarantors: [],
    // 是否只读（从订单详情进入查看模式时为 true）
    readonly: false,
    // 是否从订单详情页进入（用于判断导航栏tab是否可点击）
    fromOrderDetail: false,
    // 当前订单ID（从订单详情进入时传入）
    orderId: null
  },

  onLoad(options) {
    logger.info('订单创建步骤4：担保人信息页面加载', options);
    
    // 判断是否从订单详情页进入
    const mode = options?.mode || 'create';
    // 优先从 orderId 参数获取，其次从 id 参数获取（兼容旧逻辑）
    let orderId = options?.orderId || options?.id || null;
    
    // 如果 URL 参数中没有 orderId，尝试从缓存中获取
    if (!orderId) {
      orderId = wx.getStorageSync('currentOrderId') || null;
      logger.info('从缓存中获取 orderId:', orderId);
    }
    
    this.setData({
      readonly: mode === 'view',
      fromOrderDetail: mode === 'view' && orderId !== null,
      orderId: orderId
    });
    
    // 如果传递了 orderId，说明是从其他 step 页面跳转过来的，不加载本地缓存
    // 只有在没有 orderId 且不是查看模式时，才加载本地缓存
    if (!orderId && mode !== 'view') {
      const savedData = wx.getStorageSync('orderFormData_step4');
      if (savedData) {
        this.setData({
          formData: { ...this.data.formData, ...savedData.formData },
          guarantors: savedData.guarantors || []
        });
      }
    }
    
    // 计算并设置导航栏滚动位置
    this.calculateTabsScroll();
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
    
    const url = `${stepPages[step]}?mode=view&id=${orderId}`;
    logger.info('准备跳转:', { from: currentStep, to: step, url, orderId });
    
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

  // 选择保证合同签署方式
  selectGuaranteeSignMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      'formData.guaranteeSignMethod': method
    });
  },

  // 新增担保人
  addGuarantor() {
    // TODO: 跳转到担保人详情编辑页面
    wx.showToast({
      title: '新增担保人',
      icon: 'none'
    });
  },

  // 编辑担保人
  editGuarantor(e) {
    const index = e.currentTarget.dataset.index;
    // TODO: 跳转到担保人详情编辑页面
    wx.showToast({
      title: '编辑担保人',
      icon: 'none'
    });
  },

  // 删除担保人
  deleteGuarantor(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个担保人吗？',
      success: (res) => {
        if (res.confirm) {
          const guarantors = that.data.guarantors;
          guarantors.splice(index, 1);
          that.setData({
            guarantors: guarantors
          });
          that.saveData();
        }
      }
    });
  },

  // 保存数据
  saveData() {
    wx.setStorageSync('orderFormData_step4', {
      formData: this.data.formData,
      guarantors: this.data.guarantors
    });
  },

  // 下一步
  goNext() {
    this.saveData();

    const orderId = this.data.orderId;
    wx.showLoading({ title: '保存中...' });
    
    // 如果没有 orderId，调用创建订单接口；如果有 orderId，调用更新接口
    const savePromise = orderId 
      ? this.saveStep4ToServer(orderId).then(() => orderId)
      : this.createOrderAndSaveStep4();
    
    savePromise
      .then(newOrderId => {
        // 保存返回的 orderId 到页面数据，并传递到下一步
        this.setData({ orderId: newOrderId });
        wx.setStorageSync('currentOrderId', newOrderId);
        logger.info('步骤4保存成功，orderId:', newOrderId);
        wx.hideLoading();
        this.goNextInternal();
      })
      .catch(err => {
        logger.error('步骤4保存到后端失败', err);
        wx.hideLoading();
        // 提取错误信息
        let errorMsg = '保存失败';
        if (err && err.errMsg) {
          errorMsg = err.errMsg;
        } else if (err && err.message) {
          errorMsg = err.message;
        } else if (err && typeof err === 'string') {
          errorMsg = err;
        } else if (err && err.data && err.data.message) {
          errorMsg = err.data.message;
        }
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
        // 保存失败，不跳转
      });
  },

  // 调用后端创建订单并保存步骤4数据（新建订单）
  createOrderAndSaveStep4() {
    const req = wx.$request;
    return req.post('/public/orders/step4', {
      formData: this.data.formData,
      guarantors: this.data.guarantors
    }).then(res => {
      if (res && res.data && res.data.orderId) {
        return res.data.orderId;
      }
      throw new Error('创建订单失败：未返回 orderId');
    });
  },

  // 保存步骤4（担保人信息）到后端
  saveStep4ToServer(orderId) {
    const req = wx.$request;
    return req.post(`/public/orders/${orderId}/step4`, {
      formData: this.data.formData,
      guarantors: this.data.guarantors
    });
  },

  // 跳转到下一步（步骤5）
  goNextInternal() {
    let url = '/pages/order/create/step5/index';
    const orderId = this.data.orderId;
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


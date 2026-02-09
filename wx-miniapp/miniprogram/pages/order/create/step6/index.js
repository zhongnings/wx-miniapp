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
    currentStep: 5, // 当前步骤（0-5，step6对应索引5）
    tabsScrollLeft: 0, // 导航栏滚动位置
    attachments: [],
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
    logger.info('订单创建步骤6：资料上传页面加载', options);
    
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
    
    logger.info("订单状态：", orderStatus);
    logger.info("可编辑状态：", isEditableByStatus);
    logger.info("只读模式：", readonly);

    this.setData({
      readonly: readonly,
      fromOrderDetail: mode === 'view' && orderId !== null,
      orderId: orderId,
      orderStatus: orderStatus
    });
    
    // 如果传递了 orderId，说明是从其他 step 页面跳转过来的，从服务器加载数据
    // 只有在没有 orderId 且不是查看模式时，才加载本地缓存
    if (orderId) {
      this.loadAttachments(mode);
    } else {
      // 没有订单ID：从本地存储加载（首次创建模式）
      const savedData = wx.getStorageSync('orderFormData_step6');
      if (savedData) {
        this.setData({
          attachments: savedData.attachments || []
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
    logger.info('页面信息:', { page: 'step6', currentStep, stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep] });
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

  // 加载附件数据
  loadAttachments(mode) {
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    if (!orderId) {
      logger.warn('[附件] 无 orderId，跳过加载');
      return;
    }

    logger.info('[附件] 从后端加载附件数据', { orderId, mode });
    wx.showLoading({ title: '加载中...' });

    const req = wx.$request;
    req.get(`/public/orders/${orderId}/attachments`).then(res => {
      // 后端返回格式：{ success: true, data: [...] }
      const attachments = (res.data && res.data.data) || [];
      logger.info('[附件] 后端返回附件数据', { count: attachments.length, attachments });

      // 转换数据格式，匹配前端需要的字段名
      const formattedAttachments = attachments.map(att => {
        const url = att.url || '';
        const name = att.name || '未知文件';
        
        logger.info('[附件] 单个附件数据', { 
          id: att.id, 
          name: name, 
          url: url,
          urlIsEmpty: !url 
        });
        
        return {
          id: att.id,
          name: name,
          url: url,
          path: url, // 预览时使用 path 字段
          originalName: name,
          size: 0 // 后端没有返回 size，设为 0
        };
      });

      logger.info('[附件] 格式化后的附件数据', { count: formattedAttachments.length, formattedAttachments });
      
      this.setData({ attachments: formattedAttachments }, () => {
        logger.info('[附件] setData 完成，当前 attachments:', this.data.attachments);
        logger.info('[附件] attachments.length:', this.data.attachments.length);
      });
      
      wx.hideLoading();
    }).catch(err => {
      logger.error('[附件] 加载附件数据失败', { err });
      wx.hideLoading();

      // 如果后端加载失败，尝试从本地存储加载（兼容旧逻辑）
      const savedData = wx.getStorageSync('orderFormData_step6');
      if (savedData && savedData.attachments) {
        this.setData({
          attachments: savedData.attachments || []
        });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  goPrev() {
    // 如果是从订单详情页进入，跳转到上一个step页面
    if (this.data.fromOrderDetail && this.data.orderId) {
      wx.redirectTo({
        url: `/pages/order/create/step5/index?mode=view&id=${this.data.orderId}`
      });
    } else {
      wx.navigateBack();
    }
  },

  // 下一步（最后一步，保存订单）
  goNext() {
    this.saveOrder();
  },

  // 上传附件
  uploadAttachment() {
    // 只读模式下不允许上传
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    const that = this;
    wx.chooseMessageFile({
      count: 9,
      type: 'file',
      success: async (res) => {
        const files = res.tempFiles;
        logger.info('[附件] 选择文件成功:', files);
        
        // 获取当前订单ID
        const orderId = that.data.orderId || wx.getStorageSync('currentOrderId');
        if (!orderId) {
          wx.showToast({
            title: '请先完成前面的步骤',
            icon: 'none'
          });
          return;
        }
        
        wx.showLoading({ title: '上传中...', mask: true });
        
        try {
          // 逐个上传文件
          const attachments = that.data.attachments;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // 生成时间戳文件名
            const timestamp = Date.now() + i; // 加上索引避免重复
            const fileExtension = file.name.split('.').pop() || 'file';
            const timestampFileName = `资料-${timestamp}.${fileExtension}`;
            
            try {
              // 直接调用 upload.js 的 uploadOrderFile 方法
              const uploadResult = await wx.$upload.uploadOrderFile(file.path, 'attachment', orderId);
              
              logger.info('[附件] 文件上传成功:', { 
                fileName: timestampFileName, 
                url: uploadResult.url 
              });
              
              // 添加到附件列表（使用服务器返回的URL）
              attachments.push({
                name: timestampFileName,
                originalName: file.name,
                path: uploadResult.url, // 使用服务器URL
                url: uploadResult.url,  // 保存URL用于后续提交
                size: file.size
              });
            } catch (uploadErr) {
              logger.error('[附件] 文件上传失败:', { fileName: file.name, error: uploadErr });
              wx.showToast({
                title: `${file.name} 上传失败`,
                icon: 'none',
                duration: 2000
              });
            }
          }
          
          // 更新界面
          that.setData({
            attachments: attachments
          });
          that.saveData();
          
          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } catch (err) {
          logger.error('[附件] 上传过程出错:', err);
          wx.hideLoading();
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        logger.error('[附件] 选择文件失败:', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览附件（图片）
  previewAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const attachment = this.data.attachments[index];
    
    // 检查是否为图片文件
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = attachment.path.split('.').pop().toLowerCase();
    
    if (imageExtensions.includes(fileExtension)) {
      // 获取所有图片文件的路径列表
      const imageUrls = this.data.attachments
        .filter(item => {
          const ext = item.path.split('.').pop().toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(item => item.path);
      
      // 使用微信预览图片API
      wx.previewImage({
        current: attachment.path, // 当前显示图片的链接
        urls: imageUrls // 需要预览的图片http链接列表
      });
    } else {
      wx.showToast({
        title: '该文件不支持预览',
        icon: 'none'
      });
    }
  },

  // 删除附件
  deleteAttachment(e) {
    // 只读模式下不允许删除
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    const index = e.currentTarget.dataset.index;
    const attachment = this.data.attachments[index];
    const that = this;
    
    // 显示确认提示框
    wx.showModal({
      title: '确认删除',
      content: '你确认要删除该文件吗?',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#ff6f6f',
      success: (res) => {
        if (res.confirm) {
          // 用户确认删除
          const attachments = that.data.attachments;
          attachments.splice(index, 1);
          that.setData({
            attachments: attachments
          });
          that.saveData(); // 保存到本地存储

          // 调用通用删除方法
          wx.$upload.deleteOrderFile({
            file: attachment,
            fileType: 'attachments',
            orderId: that.data.orderId
          });
        }
      }
    });
  },

  // 保存数据
  saveData() {
    wx.setStorageSync('orderFormData_step6', {
      attachments: this.data.attachments
    });
  },

  // 收集所有步骤的数据
  collectAllData() {
    const step1 = wx.getStorageSync('orderFormData_step1') || {};
    const step2 = wx.getStorageSync('orderFormData_step2') || {};
    const step3 = wx.getStorageSync('orderFormData_step3') || {};
    const step4 = wx.getStorageSync('orderFormData_step4') || {};
    const step5 = wx.getStorageSync('orderFormData_step5') || {};
    const step6 = wx.getStorageSync('orderFormData_step6') || {};

    return {
      ...step1,
      borrower: step2,
      coBorrowers: step3.coBorrowers || [],
      guarantors: step4.guarantors || [],
      guaranteeSignMethod: step4.formData?.guaranteeSignMethod,
      bankCards: step5.bankCards || [],
      attachments: step6.attachments || []
    };
  },

  // 保存订单（步骤6：资料上传）
  saveOrder() {
    const that = this;
    wx.showLoading({ title: '保存中...' });

    // 先本地缓存附件
    this.saveData();

    const orderId = this.data.orderId;
    
    // 如果没有 orderId，调用创建订单接口；如果有 orderId，调用更新接口
    const savePromise = orderId 
      ? this.saveStep6ToServer(orderId).then(() => orderId)
      : this.createOrderAndSaveStep6();
    
    savePromise
      .then(newOrderId => {
        // 保存返回的 orderId 到页面数据
        if (newOrderId) {
          this.setData({ orderId: newOrderId });
          wx.setStorageSync('currentOrderId', newOrderId);
          logger.info('步骤6保存成功，orderId:', newOrderId);
        }
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        // 清除本地存储的临时数据
        ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].forEach(step => {
          wx.removeStorageSync(`orderFormData_${step}`);
        });
        // 跳转到订单列表
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/order/list/index'
          });
        }, 1500);
      })
      .catch(err => {
        logger.error('步骤6保存到后端失败', err);
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

  // 保存步骤6（附件上传）到后端，带文件上传
  // 调用后端创建订单并保存步骤6数据（新建订单）
  async createOrderAndSaveStep6() {
    const req = wx.$request;

    const attachments = this.data.attachments || [];
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    
    // 检查是否有未上传的文件（本地路径）
    const needUpload = attachments.filter(att => att.path && !/^https?:\/\//i.test(att.path));
    
    let uploadedAttachments = [];
    if (needUpload.length > 0) {
      // 有未上传的文件，批量上传
      logger.info('[附件] 发现未上传的文件，开始批量上传', { count: needUpload.length });
      uploadedAttachments = await wx.$upload.uploadFilesIfNeeded(
        attachments,
        (filePath) => wx.$upload.uploadOrderFile(filePath, 'attachment', orderId)
      );
    } else {
      // 所有文件都已上传，直接使用
      logger.info('[附件] 所有文件已上传，直接提交', { count: attachments.length });
      uploadedAttachments = attachments.map(att => ({
        name: att.name,
        originalName: att.originalName,
        url: att.url || att.path,
        size: att.size
      }));
    }

    return req.post('/public/orders/step6', {
      attachments: uploadedAttachments
    }).then(res => {
      if (res && res.data && res.data.orderId) {
        return res.data.orderId;
      }
      throw new Error('创建订单失败：未返回 orderId');
    });
  },

  async saveStep6ToServer(orderId) {
    const req = wx.$request;

    const attachments = this.data.attachments || [];
    
    // 检查是否有未上传的文件（本地路径）
    const needUpload = attachments.filter(att => att.path && !/^https?:\/\//i.test(att.path));
    
    let uploadedAttachments = [];
    if (needUpload.length > 0) {
      // 有未上传的文件，批量上传
      logger.info('[附件] 发现未上传的文件，开始批量上传', { count: needUpload.length });
      uploadedAttachments = await wx.$upload.uploadFilesIfNeeded(
        attachments,
        (filePath) => wx.$upload.uploadOrderFile(filePath, 'attachment', orderId)
      );
    } else {
      // 所有文件都已上传，直接使用
      logger.info('[附件] 所有文件已上传，直接提交', { count: attachments.length });
      uploadedAttachments = attachments.map(att => ({
        name: att.name,
        originalName: att.originalName,
        url: att.url || att.path,
        size: att.size
      }));
    }

    return req.post(`/public/orders/${orderId}/step6`, {
      attachments: uploadedAttachments
    });
  }
});


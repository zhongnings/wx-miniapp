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
    currentStep: 1, // 当前步骤（0-5，step2对应索引1）
    tabsScrollLeft: 0, // 导航栏滚动位置
    // 是否只读（从订单详情进入查看模式时为 true，或订单状态为0/2时为true）
    readonly: false,
    // 是否从订单详情页进入（用于判断导航栏tab是否可点击）
    fromOrderDetail: false,
    // 当前订单ID（从订单详情进入时传入）
    orderId: null,
    // 订单状态（0-待提交，2-风控驳回时为只读）
    orderStatus: null,
    formData: {
      idType: '身份证',
      name: '',
      idNumber: '',
      idEffectiveDate: '',
      idExpiryDate: '',
      idAddress: '',
      phone: '',
      residenceArea: '',
      residenceDetail: '',
      gender: '',
      birthDate: '',
      maritalStatus: '未婚',
      idFrontImage: '',
      idBackImage: ''
    },
    // 地区选择器相关数据（使用公共组件）
    showRegionPicker: false
  },

  onLoad(options) {
    logger.info('订单创建步骤2：借款人信息页面加载', options);
    
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

    // 直接使用全局挂载的占位图配置
    // 无需 require，避免路径问题
    this.setData({
      idFrontPlaceholder: wx.$placeholders.ID_FRONT,
      idBackPlaceholder: wx.$placeholders.ID_BACK,
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE
    });
    
    // 如果传递了 orderId，说明是从其他 step 页面跳转过来的，不加载本地缓存
    // 只有在没有 orderId 且不是查看模式时，才加载本地缓存
    if (!orderId && mode !== 'view') {
      const savedData = wx.getStorageSync('orderFormData_step2');
      if (savedData) {
        this.setData({
          formData: { ...this.data.formData, ...savedData }
        });
      }
    } else if (mode === 'view' && orderId) {
      // 从订单详情页进入，加载订单数据
      this.loadBorrowerInfoFromOrder(orderId);
    }
    
    // 计算并设置导航栏滚动位置
    this.calculateTabsScroll();
  },

  /**
   * 计算导航栏滚动位置，让当前选中的tab居中或适当位置
   * 规则：
   * - 第1个（索引0）：最左
   * - 第2个（索引1）：偏左
   * - 第3、4个（索引2、3）：居中
   * - 第5个（索引4）：偏右
   * - 第6个（索引5）：最右
   */
  calculateTabsScroll() {
    const currentStep = this.data.currentStep;
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth; // 屏幕宽度（px）
    const screenHeight = systemInfo.windowHeight; // 屏幕高度（px）
    
    // 每个tab的宽度（rpx转px，假设每个tab约150rpx）
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    
    // 计算总宽度
    const totalWidth = tabWidthPx * 6; // 6个tab的总宽度
    const screenCenter = screenWidth / 2; // 屏幕中心位置
    
    // 计算当前tab的位置信息
    const currentTabStart = currentStep * tabWidthPx; // 当前tab的起始位置
    const currentTabCenter = currentTabStart + tabWidthPx / 2; // 当前tab的中心位置
    const currentTabEnd = currentTabStart + tabWidthPx; // 当前tab的结束位置
    
    // 计算滚动位置
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
    
    // 确保scrollLeft不为负数
    const originalScrollLeft = scrollLeft;
    scrollLeft = Math.max(0, scrollLeft);
    
    // 计算当前tab在屏幕中的实际位置（滚动后）
    const tabVisibleStart = currentTabStart - scrollLeft; // tab在屏幕中的起始位置
    const tabVisibleCenter = currentTabCenter - scrollLeft; // tab在屏幕中的中心位置
    const tabVisibleEnd = currentTabEnd - scrollLeft; // tab在屏幕中的结束位置
    
    // 详细日志
    logger.info('========== 导航栏滚动位置计算 ==========');
    logger.info('页面信息:', {
      page: 'step2',
      currentStep: currentStep,
      stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep]
    });
    logger.info('屏幕信息:', {
      screenWidth: `${screenWidth}px`,
      screenHeight: `${screenHeight}px`,
      screenCenter: `${screenCenter.toFixed(2)}px`
    });
    logger.info('Tab尺寸信息:', {
      tabWidthRpx: `${tabWidthRpx}rpx`,
      tabWidthPx: `${tabWidthPx.toFixed(2)}px`,
      totalWidth: `${totalWidth.toFixed(2)}px`,
      tabCount: 6
    });
    logger.info('当前Tab位置（滚动前）:', {
      tabStart: `${currentTabStart.toFixed(2)}px`,
      tabCenter: `${currentTabCenter.toFixed(2)}px`,
      tabEnd: `${currentTabEnd.toFixed(2)}px`
    });
    logger.info('计算规则:', calculationRule);
    logger.info('滚动位置计算:', {
      originalScrollLeft: `${originalScrollLeft.toFixed(2)}px`,
      finalScrollLeft: `${scrollLeft.toFixed(2)}px`,
      adjusted: originalScrollLeft !== scrollLeft ? '是（已调整为非负数）' : '否'
    });
    logger.info('当前Tab位置（滚动后）:', {
      visibleStart: `${tabVisibleStart.toFixed(2)}px`,
      visibleCenter: `${tabVisibleCenter.toFixed(2)}px`,
      visibleEnd: `${tabVisibleEnd.toFixed(2)}px`,
      isCentered: Math.abs(tabVisibleCenter - screenCenter) < 1 ? '是' : '否',
      centerOffset: `${(tabVisibleCenter - screenCenter).toFixed(2)}px`
    });
    logger.info('========================================');
    
    this.setData({
      tabsScrollLeft: scrollLeft
    });
  },

  /**
   * 导航栏滚动事件监听
   * 记录滚动条的左边和右边位置，方便调试和调整
   */
  onTabsScroll(e) {
    const scrollLeft = e.detail.scrollLeft;
    const scrollWidth = e.detail.scrollWidth;
    const scrollHeight = e.detail.scrollHeight;
    
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    
    // 计算滚动条的左边和右边位置
    const scrollBarLeft = scrollLeft; // 滚动条左边位置（相对于内容开始位置）
    const scrollBarRight = scrollLeft + screenWidth; // 滚动条右边位置（相对于内容开始位置）
    const scrollBarCenter = scrollLeft + screenWidth / 2; // 滚动条中心位置
    
    // 计算可见区域内的tab范围
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    const visibleStartTabIndex = Math.floor(scrollBarLeft / tabWidthPx);
    const visibleEndTabIndex = Math.min(5, Math.ceil(scrollBarRight / tabWidthPx));
    
    // 计算每个tab在可见区域中的位置
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
          tabStart: `${tabStart.toFixed(2)}px`,
          tabCenter: `${tabCenter.toFixed(2)}px`,
          tabEnd: `${tabEnd.toFixed(2)}px`,
          visibleStart: `${tabVisibleStart.toFixed(2)}px`,
          visibleCenter: `${tabVisibleCenter.toFixed(2)}px`,
          visibleEnd: `${tabVisibleEnd.toFixed(2)}px`,
          isActive: i === this.data.currentStep,
          distanceFromCenter: `${(tabVisibleCenter - screenWidth / 2).toFixed(2)}px`
        });
      }
    }
    
    logger.info('========== 导航栏手动滚动 ==========');
    logger.info('滚动信息:', {
      scrollLeft: `${scrollLeft.toFixed(2)}px`,
      scrollWidth: `${scrollWidth}px`,
      scrollHeight: `${scrollHeight}px`,
      screenWidth: `${screenWidth}px`
    });
    logger.info('滚动条位置:', {
      scrollBarLeft: `${scrollBarLeft.toFixed(2)}px`,
      scrollBarCenter: `${scrollBarCenter.toFixed(2)}px`,
      scrollBarRight: `${scrollBarRight.toFixed(2)}px`,
      screenCenter: `${(screenWidth / 2).toFixed(2)}px`
    });
    logger.info('可见Tab范围:', {
      startIndex: visibleStartTabIndex,
      endIndex: visibleEndTabIndex,
      tabNames: visibleTabs.map(t => `${t.index}:${t.name}`).join(', ')
    });
    logger.info('可见Tab详细信息:', visibleTabs);
    logger.info('====================================');
  },

  goBack() {
    wx.navigateBack();
  },

  goPrev() {
    // 如果是从订单详情页进入，跳转到上一个step页面
    if (this.data.fromOrderDetail && this.data.orderId) {
      wx.redirectTo({
        url: `/pages/order/create/step1/index?mode=view&id=${this.data.orderId}`
      });
    } else {
      wx.navigateBack();
    }
  },

  // 上传身份证正面（国徽面）- 识别有效期
  uploadIdFront() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseImage('idFrontImage', 'front');
  },

  // 上传身份证反面（人像面）- 识别姓名、身份证号、出生年月、性别和证件地址
  uploadIdBack() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseImage('idBackImage', 'back');
  },

  // 处理身份证正面点击（如果已上传则预览，否则上传）
  handleIdFrontClick() {
    const imagePath = this.data.formData.idFrontImage;
    if (imagePath) {
      // 已上传，预览图片
      this.previewIdFront();
    } else {
      // 未上传，选择图片
      this.uploadIdFront();
    }
  },

  // 处理身份证反面点击（如果已上传则预览，否则上传）
  handleIdBackClick() {
    const imagePath = this.data.formData.idBackImage;
    if (imagePath) {
      // 已上传，预览图片
      this.previewIdBack();
    } else {
      // 未上传，选择图片
      this.uploadIdBack();
    }
  },

  // 预览身份证正面
  previewIdFront() {
    const imagePath = this.data.formData.idFrontImage;
    if (!imagePath) {
      wx.showToast({
        title: '请先上传身份证正面',
        icon: 'none'
      });
      return;
    }
    
    // 获取所有已上传的身份证图片
    const urls = [];
    if (this.data.formData.idFrontImage) {
      urls.push(this.data.formData.idFrontImage);
    }
    if (this.data.formData.idBackImage) {
      urls.push(this.data.formData.idBackImage);
    }
    
    wx.previewImage({
      current: imagePath,
      urls: urls.length > 0 ? urls : [imagePath]
    });
  },

  // 预览身份证反面
  previewIdBack() {
    const imagePath = this.data.formData.idBackImage;
    if (!imagePath) {
      wx.showToast({
        title: '请先上传身份证反面',
        icon: 'none'
      });
      return;
    }
    
    // 获取所有已上传的身份证图片
    const urls = [];
    if (this.data.formData.idFrontImage) {
      urls.push(this.data.formData.idFrontImage);
    }
    if (this.data.formData.idBackImage) {
      urls.push(this.data.formData.idBackImage);
    }
    
    wx.previewImage({
      current: imagePath,
      urls: urls.length > 0 ? urls : [imagePath]
    });
  },

  // 删除身份证正面（同时删除服务器上的图片文件）
  deleteIdFront(e) {
    // 注意：使用 catchtap 已经会自动阻止事件冒泡，不需要手动调用 stopPropagation
    const imageUrl = this.data.formData.idFrontImage;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除身份证正面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({
            'formData.idFrontImage': ''
          });
          // 清除相关的OCR识别数据
          this.setData({
            'formData.idEffectiveDate': '',
            'formData.idExpiryDate': ''
          });
          // 保存到本地存储
          this.saveFormData();
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除身份证反面（同时删除服务器上的图片文件）
  deleteIdBack(e) {
    // 注意：使用 catchtap 已经会自动阻止事件冒泡，不需要手动调用 stopPropagation
    const imageUrl = this.data.formData.idBackImage;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除身份证反面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({
            'formData.idBackImage': ''
          });
          // 清除相关的OCR识别数据
          this.setData({
            'formData.name': '',
            'formData.idNumber': '',
            'formData.birthDate': '',
            'formData.gender': '',
            'formData.idAddress': ''
          });
          // 保存到本地存储
          this.saveFormData();
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 选择图片并识别（若超过2MB则压缩后再识别）
  chooseImage(field, side) {
    const that = this;
    logger.info('[OCR] 开始选择身份证图片', { field, side });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const fileSize = res.tempFiles?.[0]?.size || 0;
        logger.info('[OCR] 选择图片成功', { 
          field, 
          side, 
          filePath: tempFilePath,
          fileSize 
        });

        // 如果大于2MB先压缩
        that.handleImageWithCompress(tempFilePath, fileSize)
          .then(({ path: finalPath, size: finalSize }) => {
            logger.info('[OCR] 处理后图片', { finalPath, finalSize });
            
            // 上传图片到服务器（后端会自动进行OCR识别）
            wx.showLoading({ title: '上传中...', mask: true });
            const imageType = side === 'front' ? 'idFront' : 'idBack';
            that.uploadIdCardImage(finalPath, imageType)
              .then((result) => {
                const uploadUrl = result.url || result;
                logger.info('[上传] 图片上传成功', { uploadUrl, hasOcr: !!result.ocr });
                
                // 显示上传后的图片URL
                that.setData({
                  [`formData.${field}`]: uploadUrl
                });
                
                // 如果后端返回了OCR结果，直接使用（后端已自动完成OCR识别）
                if (result.ocr && result.ocrSuccess) {
                  // 根据OCR返回的type字段判断是正面还是反面
                  // Front = 人像面（姓名、身份证号、地址），Back = 国徽面（有效期）
                  const ocrData = result.ocr;
                  const ocrType = ocrData.type;
                  const actualSide = (ocrType === 'Front' || ocrType === 'front') ? 'front' : 'back';
                  
                  logger.info('[OCR] 后端已返回OCR结果，开始解析', { 
                    ocrType, 
                    actualSide,
                    ocrDataKeys: Object.keys(ocrData || {})
                  });
                  wx.hideLoading();
                  
                  // 使用OCR返回的数据解析，根据actualSide判断
                  that.parseOcrResult(ocrData, actualSide);
                  wx.showToast({
                    title: '识别成功',
                    icon: 'success',
                    duration: 1500
                  });
                } else if (result.ocrSuccess === false) {
                  // OCR失败但上传成功
                  logger.warn('[OCR] 后端OCR识别失败，但文件已上传', { 
                    side, 
                    error: result.ocrError 
                  });
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，识别失败，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                } else {
                  // 后端没有进行OCR（可能是配置问题）
                  logger.warn('[OCR] 后端未返回OCR结果', { side });
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，未识别，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                }
              })
              .catch((err) => {
                logger.error('[上传] 图片上传失败', { err });
                wx.hideLoading();
                wx.showToast({
                  title: '图片上传失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              });
          })
          .catch((err) => {
            logger.error('[OCR] 图片处理失败', { err });
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        logger.error('[OCR] 选择图片失败', { field, side, error: err });
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 如果图片超过2MB，执行压缩；否则直接返回原图
   */
  handleImageWithCompress(imagePath, size) {
    const LIMIT = 2 * 1024 * 1024; // 2MB
    if (!size || size <= LIMIT) {
      return Promise.resolve({ path: imagePath, size });
    }

    logger.info('[OCR] 图片超过2MB，开始压缩', { imagePath, size });
    wx.showLoading({ title: '压缩中...', mask: true });

    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: imagePath,
        quality: 70,
        success: (res) => {
          const compressedPath = res.tempFilePath;
          const fs = wx.getFileSystemManager();
          fs.stat({
            path: compressedPath,
            success: (stat) => {
              logger.info('[OCR] 压缩完成', { compressedPath, size: stat.size });
              resolve({ path: compressedPath, size: stat.size });
            },
            fail: () => {
              logger.warn('[OCR] 无法读取压缩后大小，默认通过', { compressedPath });
              resolve({ path: compressedPath, size: LIMIT });
            }
          });
        },
        fail: (err) => {
          logger.error('[OCR] 压缩失败', err);
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    });
  },

  // 识别身份证OCR
  async recognizeIdCard(imagePath, side) {
    const that = this;
    const startTime = Date.now();
    
    logger.info('[OCR] 开始识别身份证', { side, imagePath, timestamp: startTime });
    
    // 显示识别中提示
    wx.showLoading({
      title: '正在识别身份证...',
      mask: true
    });

    try {
      // 调用OCR识别API
      logger.debug('[OCR] 准备调用OCR API', { side, imagePath });
      const ocrResult = await that.callOcrApi(imagePath, side);
      
      const duration = Date.now() - startTime;
      logger.info('[OCR] OCR识别完成', { 
        side, 
        success: ocrResult?.success, 
        duration: `${duration}ms`,
        hasData: !!ocrResult?.data
      });
      
      if (ocrResult && ocrResult.success) {
        logger.info('[OCR] OCR识别成功，开始解析结果', { 
          side, 
          dataKeys: Object.keys(ocrResult.data || {}) 
        });
        
        // 解析OCR结果并填充表单
        that.parseOcrResult(ocrResult.data, side);
        
        wx.hideLoading();
        wx.showToast({
          title: '识别成功',
          icon: 'success',
          duration: 1500
        });
        
        logger.info('[OCR] 表单填充完成', { side });
      } else {
        logger.warn('[OCR] OCR识别失败', { 
          side, 
          message: ocrResult?.message,
          result: ocrResult 
        });
        
        wx.hideLoading();
        logger.warn('[OCR] OCR识别失败', { side, message: ocrResult?.message });
        wx.showToast({
          title: '识别失败，请手动填写',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[OCR] OCR识别异常', { 
        side, 
        error: error.message || error,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '识别失败，请手动填写',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 调用OCR API（需要根据实际情况实现）
  async callOcrApi(imagePath, side) {
    logger.info('[OCR] 开始调用OCR API', { side, imagePath });
    
    // 方案1：优先尝试使用微信小程序OCR能力（如果可用）
    try {
      logger.debug('[OCR] 尝试使用微信小程序OCR能力');
      const wxOcrResult = await this.tryWxOcr(imagePath, side);
      if (wxOcrResult) {
        logger.info('[OCR] 微信小程序OCR识别成功', { side });
        return wxOcrResult;
      }
    } catch (error) {
      logger.warn('[OCR] 微信小程序OCR不可用', { error: error.message });
    }
    
    // 方案2：调用后端OCR接口
    try {
      logger.debug('[OCR] 尝试调用后端OCR接口');
      // 统一使用全局挂载的 wx.$request（在 app.js 中挂载）
      const req = wx.$request;
      
      // 将图片转换为base64
      logger.debug('[OCR] 开始转换图片为base64', { imagePath });
      const base64 = await this.imageToBase64(imagePath);
      logger.debug('[OCR] 图片转base64完成', { base64Length: base64?.length });
      
      // 调用后端OCR接口
      // 注意：需要后端提供 /api/ocr/idcard 接口
      logger.info('[OCR] 调用后端OCR接口', { url: '/api/ocr/idcard', side });
      const res = await req.post('/api/ocr/idcard', {
        image: base64,
        side: side // 'front' 或 'back'
      });
      
      logger.debug('[OCR] 后端OCR接口响应', { 
        statusCode: res.statusCode, 
        hasData: !!res.data,
        code: res.data?.code 
      });
      
      if (res.data && (res.data.code === 200 || res.statusCode === 200)) {
        logger.info('[OCR] 后端OCR识别成功', { side, dataKeys: Object.keys(res.data.data || {}) });
        return {
          success: true,
          data: res.data.data || res.data
        };
      } else {
        logger.warn('[OCR] 后端OCR识别失败', { 
          side, 
          code: res.data?.code,
          message: res.data?.message 
        });
        return {
          success: false,
          message: res.data?.message || '识别失败'
        };
      }
    } catch (error) {
      logger.error('[OCR] 后端OCR API调用失败', { 
        side, 
        error: error.message || error,
        stack: error.stack 
      });
      
      // 如果后端接口不存在，尝试使用微信云开发OCR能力
      try {
        logger.debug('[OCR] 尝试使用微信云开发OCR能力');
        const cloudResult = await this.tryCloudOcr(imagePath, side);
        if (cloudResult) {
          logger.info('[OCR] 云开发OCR识别成功', { side });
          return cloudResult;
        }
      } catch (cloudError) {
        logger.warn('[OCR] 云开发OCR调用失败', { error: cloudError.message });
      }
      
      // 如果所有OCR方案都失败，返回失败结果，不提供虚假数据
      logger.error('[OCR] 所有OCR方案都失败，返回失败结果', { side });
      return {
        success: false,
        message: '识别失败，请重新上传清晰的身份证照片'
      };
    }
  },

  // 尝试使用微信小程序OCR能力（推荐方案）
  async tryWxOcr(imagePath, side) {
    try {
      // 检查是否支持OCR能力
      // 注意：微信小程序OCR需要在小程序管理后台开通OCR能力
      if (typeof wx.ocr === 'undefined' && typeof wx.cloud === 'undefined') {
        logger.debug('[OCR] 微信OCR能力不可用');
        return null;
      }

      // 方案A：使用微信小程序OCR插件（如果已配置）
      if (typeof wx.ocr !== 'undefined' && wx.ocr.idCard) {
        logger.info('[OCR] 使用微信OCR插件识别身份证', { side });
        // 注意：我们的side定义：'front'是国徽面（识别有效期），'back'是人像面（识别姓名、身份证号等）
        // 微信OCR插件的ocrType：'front'表示人像面，'back'表示国徽面
        // 所以需要反转映射
        const ocrType = side === 'front' ? 'back' : 'front';
        const result = await new Promise((resolve, reject) => {
          wx.ocr.idCard({
            imagePath: imagePath,
            ocrType: ocrType,
            success: (res) => {
              logger.info('[OCR] 微信OCR插件识别成功', { side, result: res });
              resolve(res);
            },
            fail: (err) => {
              logger.error('[OCR] 微信OCR插件识别失败', { side, error: err });
              reject(err);
            }
          });
        });

        if (result && result.data) {
          return {
            success: true,
            data: this.formatWxOcrResult(result.data, side)
          };
        }
      }

      // 方案B：使用云开发OCR（如果已开通）
      if (typeof wx.cloud !== 'undefined') {
        logger.debug('[OCR] 尝试使用云开发OCR');
        return await this.tryCloudOcr(imagePath, side);
      }

      return null;
    } catch (error) {
      logger.error('[OCR] 微信OCR调用异常', { side, error: error.message });
      return null;
    }
  },

  // 格式化微信OCR结果为标准格式
  formatWxOcrResult(wxData, side) {
    logger.debug('[OCR] 格式化微信OCR结果', { side, wxDataKeys: Object.keys(wxData || {}) });
    
    if (side === 'front') {
      return {
        name: wxData.name || wxData.姓名,
        idNumber: wxData.idNumber || wxData.身份证号 || wxData.id,
        address: wxData.address || wxData.地址 || wxData.住址
      };
    } else {
      // 处理有效期格式
      let validPeriod = wxData.validPeriod || wxData.有效期 || wxData.validDate;
      if (wxData.startDate && wxData.endDate) {
        validPeriod = `${wxData.startDate}-${wxData.endDate}`;
      }
      
      return {
        validPeriod: validPeriod,
        issueAuthority: wxData.issueAuthority || wxData.签发机关 || wxData.authority
      };
    }
  },

  // 尝试使用微信云开发OCR能力（如果已开通云开发）
  async tryCloudOcr(imagePath, side) {
    try {
      logger.debug('[OCR] 检查云开发OCR能力', { side });
      
      // 检查是否开通了云开发
      if (typeof wx.cloud === 'undefined') {
        logger.debug('[OCR] 未开通云开发，无法使用云OCR能力');
        return null;
      }

      logger.info('[OCR] 开始上传图片到云存储', { side, imagePath });
      // 上传图片到云存储
      const cloudPath = `idcard/${Date.now()}_${side}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: imagePath
      });

      logger.info('[OCR] 图片上传成功', { side, fileID: uploadRes.fileID });

      // 调用云函数进行OCR识别
      // 注意：需要在云开发中创建 ocrIdCard 云函数
      logger.info('[OCR] 调用云函数进行OCR识别', { side, fileID: uploadRes.fileID });
      const ocrRes = await wx.cloud.callFunction({
        name: 'ocrIdCard',
        data: {
          fileID: uploadRes.fileID,
          side: side
        }
      });

      logger.debug('[OCR] 云函数OCR响应', { 
        side, 
        hasResult: !!ocrRes.result,
        success: ocrRes.result?.success 
      });

      if (ocrRes.result && ocrRes.result.success) {
        logger.info('[OCR] 云函数OCR识别成功', { side, dataKeys: Object.keys(ocrRes.result.data || {}) });
        return {
          success: true,
          data: ocrRes.result.data
        };
      }
      
      logger.warn('[OCR] 云函数OCR识别失败', { side, result: ocrRes.result });
      return null;
    } catch (error) {
      logger.error('[OCR] 云OCR调用失败', { 
        side, 
        error: error.message || error,
        stack: error.stack 
      });
      return null;
    }
  },

  // 图片转base64
  imageToBase64(imagePath) {
    logger.debug('[OCR] 开始转换图片为base64', { imagePath });
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          logger.debug('[OCR] 图片转base64成功', { 
            imagePath, 
            base64Length: res.data?.length 
          });
          resolve(res.data);
        },
        fail: (err) => {
          logger.error('[OCR] 图片转base64失败', { imagePath, error: err });
          reject(err);
        }
      });
    });
  },

  // 注意：已移除模拟数据方法，识别失败时提示用户重新上传，不使用虚假信息

  // 解析OCR结果并填充表单
  parseOcrResult(ocrData, side) {
    logger.info('[OCR] 开始解析OCR结果', { side, ocrDataKeys: Object.keys(ocrData || {}) });
    const updates = {};
    let hasValidData = false; // 标记是否有有效数据
    
    // 根据微信OCR标准：front=人像面（姓名、身份证号、地址），back=国徽面（有效期）
    if (side === 'front') {
      // 解析人像面信息：姓名、身份证号、地址、性别等
      logger.debug('[OCR] 解析身份证人像面信息', { ocrData });
      
      // 解析姓名
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates['formData.name'] = name;
          hasValidData = true;
          logger.info('[OCR] 识别到姓名', { name });
        }
      }
      
      // 解析身份证号（可能是id或idNumber字段）
      const idNumber = ocrData.id || ocrData.idNumber;
      if (idNumber) {
        // 清理身份证号中的空格和特殊字符
        const cleanIdNumber = String(idNumber).replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates['formData.idNumber'] = cleanIdNumber;
          hasValidData = true;
          logger.info('[OCR] 识别到身份证号', { 
            original: idNumber, 
            cleaned: cleanIdNumber 
          });
          
          // 自动解析身份证号中的信息（出生年月、性别）
          logger.debug('[OCR] 开始从身份证号解析出生年月和性别', { idNumber: cleanIdNumber });
          this.parseIdNumber(cleanIdNumber);
        } else {
          logger.warn('[OCR] 身份证号格式不正确', { 
            original: idNumber, 
            cleaned: cleanIdNumber,
            length: cleanIdNumber?.length 
          });
        }
      }
      
      // 解析证件地址（可能是addr或address字段）
      const address = ocrData.addr || ocrData.address;
      if (address && address.trim()) {
        const addr = address.trim();
        updates['formData.idAddress'] = addr;
        hasValidData = true;
        logger.info('[OCR] 识别到证件地址', { address: addr });
      } else {
        logger.debug('[OCR] 未识别到证件地址', { 
          hasAddr: !!ocrData.addr,
          hasAddress: !!ocrData.address,
          addrValue: ocrData.addr || ocrData.address 
        });
      }
      
      // 解析性别（可能是gender字段）
      if (ocrData.gender) {
        const gender = ocrData.gender.trim();
        if (gender === '男' || gender === 'M' || gender === 'male') {
          updates['formData.gender'] = '男';
        } else if (gender === '女' || gender === 'F' || gender === 'female') {
          updates['formData.gender'] = '女';
        }
        if (updates['formData.gender']) {
          hasValidData = true;
          logger.info('[OCR] 识别到性别', { gender: updates['formData.gender'] });
        }
      }
      
    } else if (side === 'back') {
      // 解析国徽面信息：只处理有效期
      logger.debug('[OCR] 解析身份证国徽面信息', { ocrData });
      
      // 解析有效期（可能是valid_date、validPeriod或validDate字段）
      const validPeriod = ocrData.valid_date || ocrData.validPeriod || ocrData.validDate;
      if (validPeriod) {
        logger.debug('[OCR] 解析有效期', { validPeriod });
        
        // 解析有效期，格式可能是：
        // "2020.01.01-2030.01.01"
        // "20200101-20300101"
        // "2020年01月01日-2030年01月01日"
        // "2020.01.01 至 2030.01.01"
        // "2020-01-01至2030-01-01"
        const periodMatch = validPeriod.match(/(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?\s*[-至]\s*(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?/);
        if (periodMatch) {
          const startMonth = periodMatch[2].padStart(2, '0');
          const startDay = periodMatch[3].padStart(2, '0');
          const endMonth = periodMatch[5].padStart(2, '0');
          const endDay = periodMatch[6].padStart(2, '0');
          updates['formData.idEffectiveDate'] = `${periodMatch[1]}-${startMonth}-${startDay}`;
          updates['formData.idExpiryDate'] = `${periodMatch[4]}-${endMonth}-${endDay}`;
          hasValidData = true;
          logger.info('[OCR] 识别到有效期', { 
            effectiveDate: updates['formData.idEffectiveDate'],
            expiryDate: updates['formData.idExpiryDate']
          });
        } else {
          // 尝试匹配单个日期（只有结束日期）
          const singleDateMatch = validPeriod.match(/(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?/);
          if (singleDateMatch) {
            const month = singleDateMatch[2].padStart(2, '0');
            const day = singleDateMatch[3].padStart(2, '0');
            updates['formData.idExpiryDate'] = `${singleDateMatch[1]}-${month}-${day}`;
            hasValidData = true;
            logger.info('[OCR] 识别到有效期（仅结束日期）', { 
              expiryDate: updates['formData.idExpiryDate']
            });
          } else {
            logger.warn('[OCR] 无法解析有效期格式', { validPeriod });
          }
        }
      } else {
        logger.warn('[OCR] 未识别到有效期', { ocrData });
      }
      
      // 如果有签发机关信息，记录日志（虽然表单中没有这个字段）
      if (ocrData.issueAuthority) {
        logger.info('[OCR] 识别到签发机关', { issueAuthority: ocrData.issueAuthority });
      }
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates['formData.name'] = name;
          hasValidData = true;
          logger.info('[OCR] 识别到姓名', { name });
        }
      }
      
      if (ocrData.idNumber) {
        // 清理身份证号中的空格和特殊字符
        const cleanIdNumber = ocrData.idNumber.replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates['formData.idNumber'] = cleanIdNumber;
          hasValidData = true;
          logger.info('[OCR] 识别到身份证号', { 
            original: ocrData.idNumber, 
            cleaned: cleanIdNumber 
          });
          
          // 自动解析身份证号中的信息（出生年月、性别）
          logger.debug('[OCR] 开始从身份证号解析出生年月和性别', { idNumber: cleanIdNumber });
          this.parseIdNumber(cleanIdNumber);
        } else {
          logger.warn('[OCR] 身份证号格式不正确', { 
            original: ocrData.idNumber, 
            cleaned: cleanIdNumber,
            length: cleanIdNumber?.length 
          });
        }
      }
      
      // 证件地址：只有识别到地址时才填充
      if (ocrData.address && ocrData.address.trim()) {
        const address = ocrData.address.trim();
        updates['formData.idAddress'] = address;
        hasValidData = true;
        logger.info('[OCR] 识别到证件地址', { address });
      } else {
        logger.debug('[OCR] 未识别到证件地址', { 
          hasAddress: !!ocrData.address,
          addressValue: ocrData.address 
        });
      }
    }
    
    // 批量更新表单数据
    if (Object.keys(updates).length > 0) {
      logger.info('[OCR] 准备填充表单数据', { 
        side, 
        updateCount: Object.keys(updates).length,
        updateFields: Object.keys(updates),
        hasValidData
      });
      this.setData(updates);
      logger.info('[OCR] 表单数据填充完成', { side, updates });
      
      // 如果没有识别到有效数据，提示用户
      if (!hasValidData) {
        logger.warn('[OCR] 识别结果中没有有效数据', { side, ocrData });
        wx.showToast({
          title: '识别失败，请手动填写',
          icon: 'none',
          duration: 2000
        });
      }
    } else {
      logger.warn('[OCR] 没有可填充的数据', { side, ocrData });
      wx.showToast({
        title: '识别失败，请手动填写',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
    this.saveFormData(); // 自动保存
  },

  // 证件号输入
  onIdNumberInput(e) {
    const idNumber = e.detail.value;
    this.setData({
      'formData.idNumber': idNumber
    });
    // 自动识别性别和出生日期
    this.parseIdNumber(idNumber);
    this.saveFormData(); // 自动保存
  },

  // 解析身份证号
  parseIdNumber(idNumber) {
    logger.debug('[OCR] 解析身份证号', { idNumber, length: idNumber.length });
    
    if (idNumber.length === 18) {
      // 提取出生日期
      const year = idNumber.substring(6, 10);
      const month = idNumber.substring(10, 12);
      const day = idNumber.substring(12, 14);
      const birthDate = `${year}-${month}-${day}`;
      
      // 提取性别（第17位，奇数为男，偶数为女）
      const genderCode = parseInt(idNumber.substring(16, 17));
      const gender = genderCode % 2 === 0 ? '女' : '男';
      
      logger.info('[OCR] 从身份证号解析出信息', { 
        idNumber, 
        birthDate, 
        gender, 
        genderCode 
      });
      
      this.setData({
        'formData.birthDate': birthDate,
        'formData.gender': gender
      });
    } else {
      logger.warn('[OCR] 身份证号长度不正确', { idNumber, length: idNumber.length });
    }
  },

  // 证件生效日期改变
  onIdEffectiveDateChange(e) {
    this.setData({
      'formData.idEffectiveDate': e.detail.value
    });
    this.saveFormData(); // 自动保存
  },

  // 证件有效期改变
  onIdExpiryDateChange(e) {
    this.setData({
      'formData.idExpiryDate': e.detail.value
    });
  },

  // 证件地址输入
  onIdAddressInput(e) {
    this.setData({
      'formData.idAddress': e.detail.value
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
  },

  // 选择居住地省市区（使用公共组件）
  selectResidenceArea() {
    if (this.data.readonly) return;
    logger.info('[居住地选择] 打开居住地省市区选择器');
    this.setData({
      showRegionPicker: true
    });
  },

  // 地区选择器关闭
  onRegionPickerClose() {
    this.setData({
      showRegionPicker: false
    });
  },

  // 地区选择器确认
  onRegionPickerConfirm(e) {
    const { address } = e.detail;
    this.setData({
      'formData.residenceArea': address,
      showRegionPicker: false
    });
    logger.info('[居住地选择] 完成选择', { address });
  },

  // 居住详细地址输入
  onResidenceDetailInput(e) {
    this.setData({
      'formData.residenceDetail': e.detail.value
    });
  },

  // 选择婚姻状况
  selectMaritalStatus() {
    const that = this;
    wx.showActionSheet({
      itemList: ['未婚', '已婚', '离异', '丧偶'],
      success: (res) => {
        const statusList = ['未婚', '已婚', '离异', '丧偶'];
        that.setData({
          'formData.maritalStatus': statusList[res.tapIndex]
        });
      }
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    const requiredFields = [
      { key: 'name', name: '姓名' },
      { key: 'idNumber', name: '证件号' },
      { key: 'idEffectiveDate', name: '证件生效日期' },
      { key: 'idExpiryDate', name: '证件有效期' },
      { key: 'idAddress', name: '证件地址' },
      { key: 'phone', name: '手机号码' },
      { key: 'residenceArea', name: '居住地省市区' },
      { key: 'residenceDetail', name: '居住详细地址' },
      { key: 'maritalStatus', name: '婚姻状况' }
    ];

    for (let field of requiredFields) {
      if (!formData[field.key]) {
        wx.showToast({
          title: `请填写${field.name}`,
          icon: 'none'
        });
        return false;
      }
    }

    // 验证手机号
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 保存表单数据到本地存储
  saveFormData() {
    wx.setStorageSync('orderFormData_step2', this.data.formData);
  },

  // 下一步
  goNext() {
    // 只读模式下不允许保存
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式，无法保存',
        icon: 'none'
      });
      return;
    }
    
    if (!this.validateForm()) {
      return;
    }

    // 先本地缓存，避免网络失败数据丢失
    wx.setStorageSync('orderFormData_step2', this.data.formData);

    const orderId = this.data.orderId;
    wx.showLoading({ title: '保存中...' });
    
    // 如果没有 orderId，调用创建订单接口；如果有 orderId，调用更新接口
    this.saveStep2ToServer(orderId)
    .then(newOrderId => {
        // 保存返回的 orderId 到页面数据，并传递到下一步
        this.setData({ orderId: newOrderId });
        wx.setStorageSync('currentOrderId', newOrderId);
        logger.info('步骤2保存成功，orderId:', newOrderId);
        wx.hideLoading();
        this.goNextInternal();
      })
      .catch(err => {
        logger.error('步骤2保存到后端失败', err);
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

  // 调用后端创建订单并保存步骤2数据（新建订单）
  async createOrderAndSaveStep2() {
    const req = wx.$request;
    
    const formData = { ...this.data.formData };

    // 身份证图片已经在选择时上传，这里不需要再次上传
    // 如果还有本地路径（可能是旧数据），尝试上传
    const uploadTasks = [];
    if (formData.idFrontImage && !/^https?:\/\//i.test(formData.idFrontImage)) {
      uploadTasks.push(
        this.uploadIdCardImage(formData.idFrontImage, 'idFront').then(url => {
          if (url) formData.idFrontImage = url;
        }).catch(err => {
          logger.warn('[保存] 身份证正面图片上传失败，使用原路径', err);
        })
      );
    }
    if (formData.idBackImage && !/^https?:\/\//i.test(formData.idBackImage)) {
      uploadTasks.push(
        this.uploadIdCardImage(formData.idBackImage, 'idBack').then(url => {
          if (url) formData.idBackImage = url;
        }).catch(err => {
          logger.warn('[保存] 身份证反面图片上传失败，使用原路径', err);
        })
      );
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    return req.post('/public/orders/step2', formData).then(res => {
      if (res && res.data && res.data.orderId) {
        return res.data.orderId;
      }
      throw new Error('创建订单失败：未返回 orderId');
    });
  },

  // 保存步骤2（借款人信息）到后端，包含身份证图片上传
  async saveStep2ToServer(orderId) {
    const req = wx.$request;

    const formData = { ...this.data.formData };
    // 如果有 orderId
    if (orderId) {
      // 更新已有订单
      formData.orderId = orderId;
    }

    // 身份证图片已经在选择时上传，这里不需要再次上传
    // 如果还有本地路径（可能是旧数据），尝试上传
    const uploadTasks = [];
    if (formData.idFrontImage && !/^https?:\/\//i.test(formData.idFrontImage)) {
      uploadTasks.push(
        this.uploadIdCardImage(formData.idFrontImage, 'idFront').then(url => {
          if (url) formData.idFrontImage = url;
        }).catch(err => {
          logger.warn('[保存] 身份证正面图片上传失败，使用原路径', err);
        })
      );
    }
    if (formData.idBackImage && !/^https?:\/\//i.test(formData.idBackImage)) {
      uploadTasks.push(
        this.uploadIdCardImage(formData.idBackImage, 'idBack').then(url => {
          if (url) formData.idBackImage = url;
        }).catch(err => {
          logger.warn('[保存] 身份证反面图片上传失败，使用原路径', err);
        })
      );
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    return req.post(`/public/orders/step2`, formData).then(res => {
      if (res && res.data && res.data.orderId) {
        return res.data.orderId;
      }
      throw new Error('保存步骤2失败：未返回 orderId');
    });
  },

  /**
   * 上传身份证图片到服务器（后端会自动进行OCR识别）
   * @param {string} imagePath 图片本地路径
   * @param {string} imageType 图片类型：'idFront' 或 'idBack'
   * @returns {Promise<Object>} 返回上传结果，包含url和ocr结果（如果有）
   */
  uploadIdCardImage(imagePath, imageType) {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    // 使用当前订单ID作为图片归属主键，不再强制要求身份证号
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    const idNumber = this.data.formData.idNumber || '';

    // 统一使用全局上传工具（在 app.js 中挂载到 wx.$upload）
    const uploadUtil = wx.$upload;

    return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType);
  },

  /**
   * 如果图片是本地路径则上传，返回可访问URL；已是URL则直接返回
   * （保留此方法用于向后兼容，但优先使用 uploadIdCardImage）
   */
  uploadImageIfNeeded(imagePath, bizType) {
    if (!imagePath) {
      return Promise.resolve('');
    }
    if (/^https?:\/\//i.test(imagePath)) {
      return Promise.resolve(imagePath);
    }

    const req = wx.$request;
    const uploadUrl = (req.BASE_URL || '') + '/public/upload';

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: uploadUrl,
        filePath: imagePath,
        name: 'file',
        formData: {
          bizType: bizType || 'idcard'
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data || '{}');
            const url = data.url || data.data?.url;
            if (url) {
              resolve(url);
            } else {
              reject(new Error('上传成功但未返回URL'));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 跳转到下一步（步骤3）
  goNextInternal() {
    let url = '/pages/order/create/step3/index';
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

  // ========== 居住地省市区选择器（复用step1的地区选择器逻辑） ==========
  
  /**
   * 显示居住地省市区选择器
   */
  showResidenceRegionPicker() {
    logger.info('[居住地选择] 显示居住地省市区选择器');
    
    // 阻止背景页面滚动
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
    
    // 禁用页面滚动
    this.setData({
      pageScrollDisabled: true
    });
    
    // 如果已有选中的地区，初始化选择器状态
    const residenceArea = this.data.formData.residenceArea || '';
    let currentLevel = 'province';
    let selectedProvince = '';
    let selectedCity = '';
    let selectedDistrict = '';
    
    // 尝试解析已选中的地区（格式：省市区，例如"广西壮族自治区南宁市青秀区"）
    if (residenceArea) {
      // 先清理可能的逗号、空格等
      const cleanResidenceArea = residenceArea.replace(/[,，\s]/g, '');
      
      // 获取所有省份名称列表，用于智能匹配
      const provinces = this.getProvinceData();
      const provinceNames = provinces.map(p => p.name);
      
      // 智能解析：先尝试匹配省份名称
      let matchedProvince = '';
      let matchedProvinceIndex = -1;
      
      // 按长度从长到短排序，优先匹配长名称（如"内蒙古"、"广西壮族自治区"）
      const sortedProvinces = provinceNames.sort((a, b) => b.length - a.length);
      
      for (let i = 0; i < sortedProvinces.length; i++) {
        const provinceName = sortedProvinces[i];
        if (cleanResidenceArea.startsWith(provinceName)) {
          matchedProvince = provinceName;
          matchedProvinceIndex = provinceName.length;
          break;
        }
      }
      
      if (matchedProvince) {
        selectedProvince = matchedProvince;
        const remaining = cleanResidenceArea.substring(matchedProvinceIndex);
        
        // 尝试匹配城市（以"市"、"特别行政区"、"省"结尾）
        const cityMatch = remaining.match(/^(.+?)(市|特别行政区|省)/);
        if (cityMatch) {
          selectedCity = cityMatch[0]; // 包含后缀的完整城市名
          const districtRemaining = remaining.substring(cityMatch[0].length);
          
          // 尝试匹配区县（以"区"、"县"结尾）
          const districtMatch = districtRemaining.match(/^(.+?)(区|县)/);
          if (districtMatch) {
            selectedDistrict = districtMatch[0]; // 包含后缀的完整区县名
            // 有三级，默认显示到市级（图一状态）
            currentLevel = 'city';
          } else {
            // 只有两级（省-市）
            currentLevel = 'city';
          }
        } else {
          // 没有匹配到城市，可能是特殊情况
          currentLevel = 'province';
        }
      } else {
        // 如果无法匹配省份，使用原来的正则方式作为后备
        const parts = cleanResidenceArea.match(/(.*?[省市区县])/g) || [];
        if (parts.length >= 3) {
          selectedProvince = parts[0];
          selectedCity = parts[1];
          selectedDistrict = parts[2];
          currentLevel = 'city';
        } else if (parts.length === 2) {
          selectedProvince = parts[0];
          selectedCity = parts[1];
          currentLevel = 'city';
        } else if (parts.length === 1) {
          selectedProvince = parts[0];
          currentLevel = 'province';
        }
      }
      
      logger.debug('[居住地选择] 解析结果:', {
        residenceArea,
        cleanResidenceArea,
        matchedProvince,
        selectedProvince,
        selectedCity,
        selectedDistrict,
        currentLevel
      });
    }
    
    // 先设置数据，确保selectedDistrict被设置
    // 同时清空列表，避免显示旧数据
    this.setData({
      showRegionPicker: true,
      regionCurrentLevel: currentLevel,
      selectedProvince,
      selectedCity,
      selectedDistrict,
      regionSearchKeyword: '',
      regionCityList: [], // 先清空，等待加载
      regionDistrictList: [], // 清空区县列表
      regionSearchResults: [] // 清空搜索结果
    }, () => {
      // 在setData回调中加载列表，确保数据已经设置完成
      if (currentLevel === 'city' && selectedProvince) {
        // 重新打开时，如果有已选城市，加载城市列表（显示市级选项）
        logger.debug('[居住地选择] 加载城市列表:', selectedProvince);
        this.loadCityList(selectedProvince);
      } else if (currentLevel === 'province') {
        // 如果没有已选省份，显示省份列表
        logger.debug('[居住地选择] 初始化省份列表');
        this.initRegionData();
      }
    });
  },

  /**
   * 隐藏居住地省市区选择器
   */
  hideResidenceRegionPicker() {
    logger.info('[居住地选择] 隐藏居住地省市区选择器');
    // 恢复页面滚动
    this.setData({
      showRegionPicker: false,
      regionSearchKeyword: '',
      regionSearchResults: [],
      pageScrollDisabled: false
    });
  },

  /**
   * 初始化地区数据
   */
  initRegionData() {
    logger.debug('[居住地选择] 初始化地区数据');
    const provinces = this.getProvinceData();
    const grouped = this.groupProvincesByLetter(provinces);
    const letters = grouped.map(g => g.letter);
    
    this.setData({
      regionProvinceGroups: grouped,
      regionIndexLetters: letters,
      regionData: provinces
    });
  },

  /**
   * 获取省份数据（静态数据，包含34个省级行政区）
   */
  getProvinceData() {
    return [
      { code: '110000', name: '北京', pinyin: 'beijing' },
      { code: '120000', name: '天津', pinyin: 'tianjin' },
      { code: '130000', name: '河北', pinyin: 'hebei' },
      { code: '140000', name: '山西', pinyin: 'shanxi' },
      { code: '150000', name: '内蒙古', pinyin: 'neimenggu' },
      { code: '210000', name: '辽宁', pinyin: 'liaoning' },
      { code: '220000', name: '吉林', pinyin: 'jilin' },
      { code: '230000', name: '黑龙江', pinyin: 'heilongjiang' },
      { code: '310000', name: '上海', pinyin: 'shanghai' },
      { code: '320000', name: '江苏', pinyin: 'jiangsu' },
      { code: '330000', name: '浙江', pinyin: 'zhejiang' },
      { code: '340000', name: '安徽', pinyin: 'anhui' },
      { code: '350000', name: '福建', pinyin: 'fujian' },
      { code: '360000', name: '江西', pinyin: 'jiangxi' },
      { code: '370000', name: '山东', pinyin: 'shandong' },
      { code: '410000', name: '河南', pinyin: 'henan' },
      { code: '420000', name: '湖北', pinyin: 'hubei' },
      { code: '430000', name: '湖南', pinyin: 'hunan' },
      { code: '440000', name: '广东', pinyin: 'guangdong' },
      { code: '450000', name: '广西', pinyin: 'guangxi' },
      { code: '460000', name: '海南', pinyin: 'hainan' },
      { code: '500000', name: '重庆', pinyin: 'chongqing' },
      { code: '510000', name: '四川', pinyin: 'sichuan' },
      { code: '520000', name: '贵州', pinyin: 'guizhou' },
      { code: '530000', name: '云南', pinyin: 'yunnan' },
      { code: '540000', name: '西藏', pinyin: 'xizang' },
      { code: '610000', name: '陕西', pinyin: 'shanxi' },
      { code: '620000', name: '甘肃', pinyin: 'gansu' },
      { code: '630000', name: '青海', pinyin: 'qinghai' },
      { code: '640000', name: '宁夏', pinyin: 'ningxia' },
      { code: '650000', name: '新疆', pinyin: 'xinjiang' },
      { code: '710000', name: '台湾', pinyin: 'taiwan' },
      { code: '810000', name: '香港', pinyin: 'xianggang' },
      { code: '820000', name: '澳门', pinyin: 'aomen' }
    ];
  },

  /**
   * 按首字母分组省份
   */
  groupProvincesByLetter(provinces) {
    const groups = {};
    const gaoTaiProvinces = []; // 港澳台单独处理
    
    // 按拼音首字母分组
    provinces.forEach(province => {
      // 港澳台单独处理
      if (province.name === '香港' || province.name === '澳门' || province.name === '台湾') {
        gaoTaiProvinces.push(province);
        return;
      }
      
      const firstChar = province.pinyin.charAt(0).toUpperCase();
      if (!groups[firstChar]) {
        groups[firstChar] = [];
      }
      groups[firstChar].push(province);
    });
    
    // 转换为数组并排序
    const result = Object.keys(groups)
      .sort()
      .map(letter => ({
        letter,
        provinces: groups[letter].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
      }));
    
    // 如果有港澳台，添加特殊分组
    if (gaoTaiProvinces.length > 0) {
      // 按顺序：香港、澳门、台湾
      const sortedGaoTai = gaoTaiProvinces.sort((a, b) => {
        const order = { '香港': 1, '澳门': 2, '台湾': 3 };
        return (order[a.name] || 0) - (order[b.name] || 0);
      });
      
      result.push({
        letter: '*',
        provinces: sortedGaoTai,
        isGaoTai: true // 标记为港澳台分组
      });
    }
    
    return result;
  },

  /**
   * 地区项点击（居住地选择）
   */
  onResidenceRegionItemTap(e) {
    const { code, name, fullName, level } = e.currentTarget.dataset;
    logger.info('[居住地选择] 点击地区项', { code, name, fullName, level });
    
    if (level === 'province') {
      // 选择省份后，清除搜索，切换到城市列表
      this.setData({
        selectedProvince: fullName || name,
        selectedProvinceCode: code,
        selectedCity: '',
        selectedDistrict: '',
        regionCurrentLevel: 'city',
        regionCityList: [], // 先清空，等待加载
        regionDistrictList: [], // 清空区县列表
        regionSearchKeyword: '', // 清除搜索关键词
        regionSearchResults: [] // 清除搜索结果
      });
      this.loadCityList(fullName || name);
    } else if (level === 'city') {
      const cityName = fullName || name;
      const cityNameForMatch = cityName.replace('市', '').replace('特别行政区', '').replace('省', '');
      
      // 检查是否有区县数据
      const hasDistrictData = this.hasDistrictData(cityNameForMatch);
      
      if (!hasDistrictData) {
        // 两层结构（省→市），自动勾选最后一层，直接完成选择
        const province = this.data.selectedProvince;
        const residenceArea = `${province}${cityName}`;
        this.setData({
          selectedCity: cityName,
          selectedCityCode: code,
          selectedDistrict: '',
          'formData.residenceArea': residenceArea
        });
        logger.info('[居住地选择] 完成选择（两层结构）', { residenceArea });
        this.hideResidenceRegionPicker();
      } else {
        // 有区县数据，进入区级选择
        this.setData({
          selectedCity: cityName,
          selectedCityCode: code,
          selectedDistrict: '',
          regionCurrentLevel: 'district',
          regionDistrictList: [] // 先清空，等待加载
        });
        this.loadDistrictList(cityNameForMatch);
      }
    } else if (level === 'district') {
      // 选择区级，自动完成选择
      const province = this.data.selectedProvince;
      const city = this.data.selectedCity;
      const district = fullName || name;
      const residenceArea = `${province}${city}${district}`;
      this.setData({
        selectedDistrict: district,
        selectedDistrictCode: code,
        'formData.residenceArea': residenceArea
      });
      logger.info('[居住地选择] 完成选择（三层结构）', { residenceArea });
      this.hideResidenceRegionPicker();
    }
  },

  /**
   * 加载城市列表（复用step1的逻辑）
   */
  loadCityList(provinceName) {
    logger.info('[居住地选择] 加载城市列表', { provinceName });
    // 清理省份名称，去掉"省"、"市"、"自治区"等后缀，以便匹配
    let provinceKey = provinceName;
    provinceKey = provinceKey.replace(/省$/, '')
                             .replace(/市$/, '')
                             .replace(/自治区$/, '')
                             .replace(/特别行政区$/, '')
                             .replace(/维吾尔自治区$/, '')
                             .replace(/壮族自治区$/, '')
                             .replace(/回族自治区$/, '')
                             .replace(/藏族自治区$/, '');
    
    // 这里需要从step1复制getCityMap方法，或者创建一个共享的工具函数
    // 为了简化，这里先使用step1的逻辑
    const cityMap = this.getCityMap();
    
    // 尝试多种匹配方式：清理后的key、原始名称
    const cities = cityMap[provinceKey] || 
                    cityMap[provinceName] || 
                    [];
    
    logger.debug('[居住地选择] 城市列表匹配结果', {
      provinceName,
      provinceKey,
      citiesCount: cities.length
    });
    
    if (cities.length === 0) {
      // 如果找不到匹配的城市，显示"暂无数据"
      this.setData({
        regionCityList: [
          { code: '000000', name: '暂无数据', fullName: '暂无数据', province: provinceName }
        ],
        regionDistrictList: [] // 清空区县列表
      });
    } else {
      this.setData({
        regionCityList: cities,
        regionDistrictList: [] // 清空区县列表
      });
    }
  },

  /**
   * 加载区县列表（复用step1的逻辑）
   */
  loadDistrictList(cityNameKey) {
    logger.info('[居住地选择] 加载区县列表', { cityNameKey });
    const districtMap = this.getDistrictMap();
    const cleanKey = cityNameKey.replace('市', '').replace('特别行政区', '').replace('省', '');
    
    let districts = districtMap[cleanKey] || 
                    districtMap[cityNameKey] ||
                    districtMap[cleanKey + '市'] ||
                    districtMap[cityNameKey + '市'] ||
                    [];
    
    logger.debug('[居住地选择] 区县列表匹配结果', {
      cityNameKey,
      cleanKey,
      districtsCount: districts.length
    });
    
    if (districts.length === 0) {
      this.setData({
        regionDistrictList: [
          { code: '000000', name: '暂无数据', fullName: '暂无数据' }
        ]
      });
    } else {
      this.setData({
        regionDistrictList: districts
      });
    }
  },

  /**
   * 检查城市是否有区县数据
   */
  hasDistrictData(cityName) {
    const cityNameKey = cityName.replace('市', '').replace('特别行政区', '').replace('省', '');
    const districtMap = this.getDistrictMap();
    const districts = districtMap[cityNameKey] || districtMap[cityName] || [];
    // 排除"暂无数据"的情况
    return districts.length > 0 && !(districts.length === 1 && districts[0].name === '暂无数据');
  },

  /**
   * 获取城市数据映射
   * 注意：由于代码量很大，这里只包含部分数据，完整数据请从step1/index.js的getCityMap方法复制
   * 或者将getCityMap方法提取为公共工具函数
   */
  getCityMap() {
    // 注意：完整数据请从 step1/index.js 的 loadCityList 方法中的 cityMap 复制
    // 这里只提供部分示例数据，实际使用时需要复制完整数据
    return {
      '北京': [
        { code: '110100', name: '北京市', fullName: '北京市', province: '北京' }
      ],
      '安徽': [
        { code: '340100', name: '合肥', fullName: '合肥市', province: '安徽' },
        { code: '340200', name: '芜湖', fullName: '芜湖市', province: '安徽' },
        { code: '340300', name: '蚌埠', fullName: '蚌埠市', province: '安徽' },
        { code: '340400', name: '淮南', fullName: '淮南市', province: '安徽' },
        { code: '340500', name: '马鞍山', fullName: '马鞍山市', province: '安徽' },
        { code: '340600', name: '淮北', fullName: '淮北市', province: '安徽' },
        { code: '340700', name: '铜陵', fullName: '铜陵市', province: '安徽' },
        { code: '340800', name: '安庆', fullName: '安庆市', province: '安徽' },
        { code: '341000', name: '黄山', fullName: '黄山市', province: '安徽' },
        { code: '341100', name: '滁州', fullName: '滁州市', province: '安徽' },
        { code: '341200', name: '阜阳', fullName: '阜阳市', province: '安徽' },
        { code: '341300', name: '宿州', fullName: '宿州市', province: '安徽' },
        { code: '341500', name: '六安', fullName: '六安市', province: '安徽' },
        { code: '341600', name: '亳州', fullName: '亳州市', province: '安徽' },
        { code: '341700', name: '池州', fullName: '池州市', province: '安徽' },
        { code: '341800', name: '宣城', fullName: '宣城市', province: '安徽' }
      ]
      // TODO: 请从 step1/index.js 的 loadCityList 方法中复制完整的 cityMap 数据
      // 或者将 getCityMap 方法提取为公共工具函数供两个页面共用
    };
  },

  /**
   * 获取区县数据映射
   * 注意：由于代码量很大，这里只包含部分数据，完整数据请从step1/index.js的getDistrictMap方法复制
   */
  getDistrictMap() {
    // 注意：完整数据请从 step1/index.js 的 getDistrictMap 方法复制
    // 这里只提供部分示例数据，实际使用时需要复制完整数据
    return {
      '北京': [
        { code: '110101', name: '东城区', fullName: '东城区', city: '北京' },
        { code: '110102', name: '西城区', fullName: '西城区', city: '北京' },
        { code: '110105', name: '朝阳区', fullName: '朝阳区', city: '北京' },
        { code: '110106', name: '丰台区', fullName: '丰台区', city: '北京' },
        { code: '110107', name: '石景山区', fullName: '石景山区', city: '北京' },
        { code: '110108', name: '海淀区', fullName: '海淀区', city: '北京' },
        { code: '110109', name: '门头沟区', fullName: '门头沟区', city: '北京' },
        { code: '110111', name: '房山区', fullName: '房山区', city: '北京' },
        { code: '110112', name: '通州区', fullName: '通州区', city: '北京' },
        { code: '110113', name: '顺义区', fullName: '顺义区', city: '北京' },
        { code: '110114', name: '昌平区', fullName: '昌平区', city: '北京' },
        { code: '110115', name: '大兴区', fullName: '大兴区', city: '北京' },
        { code: '110116', name: '怀柔区', fullName: '怀柔区', city: '北京' },
        { code: '110117', name: '平谷区', fullName: '平谷区', city: '北京' },
        { code: '110118', name: '密云区', fullName: '密云区', city: '北京' },
        { code: '110119', name: '延庆区', fullName: '延庆区', city: '北京' }
      ],
      '合肥': [
        { code: '340102', name: '瑶海区', fullName: '瑶海区', city: '合肥' },
        { code: '340103', name: '庐阳区', fullName: '庐阳区', city: '合肥' },
        { code: '340104', name: '蜀山区', fullName: '蜀山区', city: '合肥' },
        { code: '340111', name: '包河区', fullName: '包河区', city: '合肥' },
        { code: '340121', name: '长丰县', fullName: '长丰县', city: '合肥' },
        { code: '340122', name: '肥东县', fullName: '肥东县', city: '合肥' },
        { code: '340123', name: '肥西县', fullName: '肥西县', city: '合肥' },
        { code: '340124', name: '庐江县', fullName: '庐江县', city: '合肥' },
        { code: '340181', name: '巢湖市', fullName: '巢湖市', city: '合肥' }
      ]
      // TODO: 请从 step1/index.js 的 getDistrictMap 方法中复制完整数据
      // 或者将 getDistrictMap 方法提取为公共工具函数供两个页面共用
    };
  },

  /**
   * 搜索地区
   */
  onResidenceRegionSearchInput(e) {
    const keyword = e.detail.value.trim();
    logger.debug('[居住地选择] 搜索地区', { keyword });
    
    this.setData({
      regionSearchKeyword: keyword
    });
    
    if (!keyword) {
      this.setData({
        regionSearchResults: []
      });
      return;
    }
    
    // 搜索逻辑（需要从step1复制searchRegion方法）
    this.searchResidenceRegion(keyword);
  },

  /**
   * 搜索地区
   * 注意：完整搜索逻辑请从step1/index.js的searchRegion方法复制
   */
  searchResidenceRegion(keyword) {
    logger.info('[居住地选择] 执行搜索', { keyword });
    const results = [];
    const keywordLower = keyword.toLowerCase();
    
    // 搜索省份
    const provinces = this.getProvinceData();
    provinces.forEach(province => {
      if (province.name.includes(keyword) || 
          province.pinyin.toLowerCase().includes(keywordLower)) {
        results.push({
          code: province.code,
          name: province.name,
          fullName: province.name,
          level: 'province'
        });
      }
    });
    
    // 搜索城市
    const cityMap = this.getCityMap();
    Object.keys(cityMap).forEach(provinceKey => {
      cityMap[provinceKey].forEach(city => {
        if (city.name.includes(keyword) || 
            city.fullName.includes(keyword)) {
          results.push({
            code: city.code,
            name: city.name,
            fullName: city.fullName,
            level: 'city',
            province: city.province
          });
        }
      });
    });
    
    // 搜索区县
    const districtMap = this.getDistrictMap();
    Object.keys(districtMap).forEach(cityKey => {
      districtMap[cityKey].forEach(district => {
        if (district.name.includes(keyword) || 
            district.fullName.includes(keyword)) {
          results.push({
            code: district.code,
            name: district.name,
            fullName: district.fullName,
            level: 'district',
            city: district.city
          });
        }
      });
    });
    
    logger.debug('[居住地选择] 搜索结果', { keyword, count: results.length });
    this.setData({
      regionSearchResults: results
    });
  },

  /**
   * 滚动到指定首字母分组
   */
  scrollToResidenceRegionGroup(e) {
    const letter = e.currentTarget.dataset.letter;
    logger.debug('[居住地选择] 滚动到分组', { letter });
    const targetId = letter === '*' ? 'region-group-star' : `region-group-${letter}`;
    this.setData({
      regionScrollIntoView: targetId,
      regionIndexActive: letter
    });
    
    // 清除激活状态
    setTimeout(() => {
      this.setData({
        regionIndexActive: ''
      });
    }, 500);
  },

  /**
   * 清除搜索
   */
  clearResidenceRegionSearch() {
    logger.debug('[居住地选择] 清除搜索');
    this.setData({
      regionSearchKeyword: '',
      regionSearchResults: []
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 阻止滚动
   */
  stopScroll() {
    // 阻止滚动穿透
  },

  /**
   * 重置到省份选择
   */
  resetResidenceRegionToProvince() {
    logger.debug('[居住地选择] 重置到省份选择');
    this.setData({
      selectedProvince: '',
      selectedCity: '',
      selectedDistrict: '',
      regionCurrentLevel: 'province',
      regionCityList: [],
      regionDistrictList: [],
      regionSearchKeyword: '',
      regionSearchResults: []
    });
    this.initRegionData();
  },

  /**
   * 重置到城市选择
   */
  resetResidenceRegionToCity() {
    logger.debug('[居住地选择] 重置到城市选择');
    if (this.data.selectedProvince) {
      this.setData({
        selectedCity: '',
        selectedDistrict: '',
        regionCurrentLevel: 'city',
        regionDistrictList: [],
        regionSearchKeyword: '',
        regionSearchResults: []
      });
      this.loadCityList(this.data.selectedProvince);
    }
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

  /**
   * 从订单详情加载借款人信息（查看模式）
   */
  loadBorrowerInfoFromOrder(orderId) {
    if (!orderId) {
      return;
    }
    
    wx.showLoading({ title: '加载中...' });
    const req = wx.$request;
    
    req.request({
      url: `/public/orders/${orderId}/step2`,
      method: 'GET'
    }).then(res => {
      const borrowerInfo = res.data.data || {};
      
      // 映射后端数据到表单
      const formData = {
        idType: borrowerInfo.idType || '身份证',
        name: borrowerInfo.name || '',
        idNumber: borrowerInfo.idNo || '',
        idEffectiveDate: borrowerInfo.idIssueDate || '',
        idExpiryDate: borrowerInfo.idExpireDate || '',
        idAddress: borrowerInfo.addressDetail || '',
        phone: borrowerInfo.mobile || '',
        residenceArea: borrowerInfo.provinceCity || '',
        residenceDetail: borrowerInfo.addressDetail || '',
        gender: borrowerInfo.gender || '',
        birthDate: borrowerInfo.birthday || '',
        maritalStatus: borrowerInfo.maritalStatus || '未婚',
        idFrontImage: borrowerInfo.faceFrontUrl || '',
        idBackImage: borrowerInfo.faceBackUrl || ''
      };
      
      // 同时获取订单状态，判断是否需要设置为只读
      const orderStatus = borrowerInfo.orderStatus != null ? borrowerInfo.orderStatus : this.data.orderStatus;
      const isReadonlyByStatus = orderStatus === 0 || orderStatus === 2;
      
      this.setData({
        formData: { ...this.data.formData, ...formData },
        orderStatus,
        readonly: this.data.readonly || isReadonlyByStatus
      });
      
      logger.info('借款人信息加载成功:', { borrowerInfo, orderStatus, readonly: this.data.readonly });
    }).catch(err => {
      logger.error('加载借款人信息失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});


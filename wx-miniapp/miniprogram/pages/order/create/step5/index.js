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

// 引入通用上传工具：统一使用全局挂载的 wx.$upload（在 app.js 中挂载）
const uploadUtil = wx.$upload;

// 银行配置（包含 logo 路径和品牌色）
const bankConfig = {
  '中国工商银行': { logo: '/static/bank/gongshang.png', color: '#C8161D' },
  '工商银行': { logo: '/static/bank/gongshang.png', color: '#C8161D' },
  '中国建设银行': { logo: '/static/bank/jianshe.png', color: '#0066B3' },
  '建设银行': { logo: '/static/bank/jianshe.png', color: '#0066B3' },
  '中国农业银行': { logo: '/static/bank/nongye.png', color: '#00843D' },
  '农业银行': { logo: '/static/bank/nongye.png', color: '#00843D' },
  '中国银行': { logo: '/static/bank/zhongguo.png', color: '#B20838' },
  '交通银行': { logo: '/static/bank/jiaotong.png', color: '#0066B3' },
  '招商银行': { logo: '/static/bank/zhaoshang.png', color: '#E4002B' },
  '浦发银行': { logo: '/static/bank/pufa.png', color: '#003399' },
  '浦东发展银行': { logo: '/static/bank/pufa.png', color: '#003399' },
  '中信银行': { logo: '/static/bank/zhongxin.png', color: '#E4002B' },
  '光大银行': { logo: '/static/bank/guangda.png', color: '#6F2C91' },
  '华夏银行': { logo: '/static/bank/huaxia.png', color: '#E4002B' },
  '民生银行': { logo: '/static/bank/minsheng.png', color: '#006EB6' },
  '广发银行': { logo: '/static/bank/guangfa.png', color: '#E4002B' },
  '广东发展银行': { logo: '/static/bank/guangfa.png', color: '#E4002B' },
  '平安银行': { logo: '/static/bank/pingan.png', color: '#FF6600' },
  '兴业银行': { logo: '/static/bank/xingye.png', color: '#003399' },
  '邮储银行': { logo: '/static/bank/youchu.png', color: '#00843D' },
  '邮政储蓄银行': { logo: '/static/bank/youchu.png', color: '#00843D' },
  '宁波银行': { logo: '/static/bank/ningbo.png', color: '#F39800' },
  '江苏银行': { logo: '/static/bank/jiangsu.png', color: '#E4002B' },
  '南京银行': { logo: '/static/bank/nanjing.png', color: '#E4002B' },
  '上海银行': { logo: '/static/bank/shanghai.png', color: '#0066B3' },
  '盛京银行': { logo: '/static/bank/shengjing.png', color: '#E4002B' },
  '汇丰银行': { logo: '/static/bank/huifeng.png', color: '#DB0011' },
  '网商银行': { logo: '/static/bank/wangshang.png', color: '#FF6600' }
};

// 获取银行配置（logo 和颜色）
function getBankConfig(bankName) {
  if (!bankName) {
    return { logo: '/static/bank/none.png', color: '#4A90E2' };
  }
  
  // 精确匹配
  if (bankConfig[bankName]) {
    return bankConfig[bankName];
  }
  
  // 模糊匹配（支持部分匹配）
  for (const key in bankConfig) {
    // 移除"中国"、"银行"等通用词后匹配
    const simplifiedKey = key.replace(/中国|银行/g, '');
    const simplifiedName = bankName.replace(/中国|银行/g, '');
    if (simplifiedName.includes(simplifiedKey) || simplifiedKey.includes(simplifiedName)) {
      return bankConfig[key];
    }
  }
  
  // 默认返回通用银行图标
  return { logo: '/static/bank/none.png', color: '#4A90E2' };
}

// 银行图标映射（根据银行名称返回图标文本）- 保留用于向后兼容
function getBankIcon(bankName) {
  if (!bankName) return '🏦';
  
  const bankIconMap = {
    '中国工商银行': '工',
    '中国建设银行': '建',
    '中国农业银行': '农',
    '中国银行': '中',
    '交通银行': '交',
    '招商银行': '招',
    '浦发银行': '浦',
    '中信银行': '信',
    '光大银行': '光',
    '华夏银行': '华',
    '民生银行': '民',
    '广发银行': '广',
    '平安银行': '平',
    '兴业银行': '兴',
    '邮储银行': '邮',
    '其他银行': '🏦'
  };
  
  // 精确匹配
  if (bankIconMap[bankName]) {
    return bankIconMap[bankName];
  }
  
  // 模糊匹配（支持部分匹配）
  for (const key in bankIconMap) {
    // 移除"中国"、"银行"等通用词后匹配
    const simplifiedKey = key.replace(/中国|银行/g, '');
    const simplifiedName = bankName.replace(/中国|银行/g, '');
    if (simplifiedName.includes(simplifiedKey) || simplifiedKey.includes(simplifiedName)) {
      return bankIconMap[key];
    }
  }
  
  // 默认返回首字符（去除"中国"）
  const displayName = bankName.replace(/^中国/, '');
  return displayName.substring(0, 1);
}

// 持卡人类型转换：英文 -> 中文（用于显示）
function holderTypeToDisplay(holderType) {
  const map = {
    'borrower': '借款人',
    'coBorrower': '共借人',
    'guarantor': '担保人'
  };
  return map[holderType] || holderType || '借款人';
}

// 持卡人类型转换：中文 -> 英文（用于保存）
function holderTypeToValue(holderType) {
  const map = {
    '借款人': 'borrower',
    '共借人': 'coBorrower',
    '担保人': 'guarantor'
  };
  // 如果已经是英文，直接返回
  if (holderType === 'borrower' || holderType === 'coBorrower' || holderType === 'guarantor') {
    return holderType;
  }
  return map[holderType] || 'borrower';
}

Page({
  data: {
    currentStep: 4, // 当前步骤（0-5，step5对应索引4）
    tabsScrollLeft: 0, // 导航栏滚动位置
    bankCards: [],
    // 是否只读（从订单详情进入查看模式时为 true，或订单状态为0/2时为true）
    readonly: false,
    // 是否从订单详情页进入（用于判断导航栏tab是否可点击）
    fromOrderDetail: false,
    // 当前订单ID（从订单详情进入时传入）
    orderId: null,
    // 订单状态（0-待提交，2-风控驳回时为只读）
    orderStatus: null,
    // 是否隐藏导航栏（从制单页面查看收款卡时隐藏）
    hideNav: false
  },

  onLoad(options) {
    logger.info('订单创建步骤5：银行卡信息页面加载', options);
    
    // 使用导航工具初始化订单上下文
    // step5 只读取全局上下文，不主动设置（除非从订单详情进入）
    const context = navigation.initOrderContextFromOptions(options, false);
    
    // 是否隐藏导航栏
    const hideNav = options?.hideNav === 'true';
    // 是否只读
    const readonlyParam = options?.readonly === 'true';
    const readonly = readonlyParam || navigation.calculateReadonly(context.mode, context.orderStatus);
    
    this.setData({
      readonly: readonly,
      fromOrderDetail: context.fromOrderDetail,
      orderId: context.orderId,
      orderStatus: context.orderStatus,
      hideNav: hideNav
    });
    
    // 如果传递了 orderId，说明是从其他 step 页面跳转过来的，从服务器加载数据
    // 只有在没有 orderId 且不是查看模式时，才加载本地缓存
    if (context.orderId || context.mode === 'view') {
      this.loadBankCards(context.mode);
    } else {
      // 没有 orderId 且不是查看模式：从本地存储加载（首次创建）
      const savedData = wx.getStorageSync('orderFormData_step5');
      if (savedData) {
        this.setData({
          bankCards: savedData.bankCards || []
        });
      }
    }
    
    // 避免首次进入时 onShow 再次触发重复加载
    this._skipOnShowOnce = true;
    
    // 计算并设置导航栏滚动位置
    if (!hideNav) {
      this.calculateTabsScroll();
    }
  },

  onShow() {
    // 页面显示时重新加载银行卡列表（从编辑页面返回时会触发）
    logger.info('step5 页面显示，重新加载银行卡列表');
    if (this._skipOnShowOnce) {
      this._skipOnShowOnce = false;
      return;
    }
    if (this._needRefreshOnShow) {
      this._needRefreshOnShow = false;
      const mode = this.data.readonly ? 'view' : 'create';
      this.loadBankCards(mode);
    }
  },

  getRequest() {
    // 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
    return wx.$request;
  },

  // 将当前页面 bankCards 转成后端 step5 DTO
  buildStep5Payload() {
    const bankCards = (this.data.bankCards || []).map(card => {
      const c = { ...card };
      // 持久化时不需要 bankIcon
      delete c.bankIcon;
      // 兼容字段：后端 DTO 使用 cardholderName/idNumber/cardFrontImage
      return {
        holderType: holderTypeToValue(c.holderType), // 转换为英文保存
        cardholderName: c.cardholderName,
        idType: c.idType,
        idNumber: c.idNumber,
        bankName: c.bankName,
        cardNumber: c.cardNumber,
        reservedMobile: c.reservedMobile,
        cardFrontImage: c.cardFrontImage
      };
    });
    return { bankCards };
  },

  // 删除类操作需要立刻同步后端（下一步不保存不影响这里）
  persistStep5IfPossible() {
    if (this.data.readonly) return Promise.resolve();
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    if (!orderId) {
      logger.warn('[银行卡] 无 orderId，跳过后端同步（仅本地生效）');
      return Promise.resolve();
    }
    const req = this.getRequest();
    const payload = this.buildStep5Payload();
    logger.info('[银行卡] 同步后端 step5', { orderId, bankCardsCount: payload.bankCards?.length || 0 });
    // 显式走 request，避免某些环境 post 方法未挂载/被覆盖导致看不到网络请求
    return req.request({
      url: `/public/orders/${orderId}/step5`,
      method: 'POST',
      data: payload
    });
  },

  // 加载银行卡数据
  loadBankCards(mode) {
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    
    if (orderId) {
      // 有订单ID：从后端加载数据
      logger.info('[银行卡] 从后端加载银行卡数据', { orderId, mode });
      wx.showLoading({ title: '加载中...' });
      
      const req = wx.$request;
      req.get(`/public/orders/${orderId}/bankCards`).then(res => {
        const bankCards = res.data || [];
        logger.info('[银行卡] 后端返回银行卡数据', { count: bankCards.length, bankCards });
        
        // 转换数据格式，匹配前端需要的字段名
        const formattedCards = bankCards.map(card => {
          const config = getBankConfig(card.bankName);
          return {
            id: card.id,
            holderType: holderTypeToDisplay(card.holderType), // 转换为中文显示
            cardholderName: card.accountName || '',
            idType: card.idType || '身份证',
            idNumber: card.idNo || '',
            bankName: card.bankName || '',
            cardNumber: card.cardNo || '',
            reservedMobile: card.reservedMobile || '',
            cardFrontImage: card.cardFrontUrl || '',
            bankIcon: getBankIcon(card.bankName),
            bankLogo: config.logo,
            bankColor: config.color
          };
        });
        
        this.setData({
          bankCards: formattedCards
        });
        
        wx.hideLoading();
      }).catch(err => {
        logger.error('[银行卡] 加载银行卡数据失败', { err });
        wx.hideLoading();
        
        // 如果后端没有数据，尝试从本地存储加载（兼容旧逻辑）
        const savedData = wx.getStorageSync('orderFormData_step5');
        let bankCards = [];
        if (savedData && savedData.bankCards) {
          bankCards = savedData.bankCards || [];
        }
        
        // 为每个银行卡添加图标、logo 和颜色
        bankCards = bankCards.map(card => {
          const config = getBankConfig(card.bankName);
          return {
            ...card,
            bankIcon: getBankIcon(card.bankName),
            bankLogo: config.logo,
            bankColor: config.color
          };
        });
        
        this.setData({
          bankCards: bankCards
        });
      });
    } else {
      // 没有订单ID：从本地存储加载（创建模式）
      logger.info('[银行卡] 从本地存储加载银行卡数据', { mode });
      const savedData = wx.getStorageSync('orderFormData_step5');
      let bankCards = [];
      if (savedData && savedData.bankCards) {
        bankCards = savedData.bankCards || [];
      }
      
      // 为每个银行卡添加图标、logo 和颜色
      bankCards = bankCards.map(card => {
        const config = getBankConfig(card.bankName);
        return {
          ...card,
          bankIcon: getBankIcon(card.bankName),
          bankLogo: config.logo,
          bankColor: config.color
        };
      });
      
      this.setData({
        bankCards: bankCards
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
    logger.info('页面信息:', { page: 'step5', currentStep, stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep] });
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

  // 新增银行卡
  addBankCard() {
    // 只读模式下不允许新增
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    
    this._needRefreshOnShow = true;
    const orderStatus = this.data.orderStatus;
    let url = '/pages/order/create/step5-edit/index?mode=add';
    
    // 传递订单状态
    if (orderStatus != null) {
      url += `&orderStatus=${orderStatus}`;
    }
    
    wx.navigateTo({
      url: url
    });
  },

  // 编辑银行卡
  editBankCard(e) {
    // 只读模式下不允许编辑
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    this._needRefreshOnShow = true;
    const orderStatus = this.data.orderStatus;
    let url = `/pages/order/create/step5-edit/index?mode=edit&cardIndex=${index}`;
    
    // 传递订单状态
    if (orderStatus != null) {
      url += `&orderStatus=${orderStatus}`;
    }
    
    wx.navigateTo({
      url: url
    });
  },

  // 删除银行卡（后端会自动删除关联的图片）
  deleteBankCard(e) {
    // 只读模式下不允许删除
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张银行卡吗？',
      success: (res) => {
        if (res.confirm) {
          const bankCards = that.data.bankCards || [];
          const card = bankCards[index];
          
          bankCards.splice(index, 1);
          that.setData({ bankCards });
          that.saveData();

          const orderId = that.data.orderId || wx.getStorageSync('currentOrderId');
          const bankCardId = card && (card.id || card.bankCardId);
          
          // 如果有后端主键，走单条删除；否则仅本地删除（例如尚未落库的临时卡）
          if (orderId && bankCardId) {
            const req = wx.$request;
            wx.showLoading({ title: '删除中...', mask: true });
            req.request({
              url: `/public/orders/${orderId}/bankCards/${bankCardId}`,
              method: 'DELETE'
            })
              .then(() => {
                wx.hideLoading();
                wx.showToast({ title: '删除成功', icon: 'success' });
              })
              .catch((err) => {
                wx.hideLoading();
                logger.error('[银行卡] 删除失败', err);
                wx.showToast({ title: '已本地删除，后端删除失败', icon: 'none', duration: 2500 });
              });
          }
        }
      }
    });
  },

  // 保存数据
  saveData() {
    // 保存时移除 bankIcon（不需要持久化，每次加载时重新计算）
    const bankCardsToSave = this.data.bankCards.map(card => {
      const { bankIcon, ...cardWithoutIcon } = card;
      return cardWithoutIcon;
    });
    wx.setStorageSync('orderFormData_step5', {
      bankCards: bankCardsToSave
    });
  },

  // 下一步
  goNext() {
    // 校验银行卡数量
    if (this.data.bankCards.length === 0) {
      wx.showToast({
        title: '请至少添加一张银行卡',
        icon: 'none'
      });
      return;
    }
    // 下一步不调用保存接口，只做跳转
    // 仍保留本地存储，避免页面刷新导致临时数据丢失
    this.saveData();
    this.goNextInternal();
  },

  // 调用后端创建订单并保存步骤5数据（新建订单）
  createOrderAndSaveStep5() {
    const req = wx.$request;
    
    const bankCards = this.data.bankCards.map(card => ({ ...card }));
    
    // 检查是否有未上传的本地图片，如果有则先上传
    const uploadTasks = [];
    bankCards.forEach((card, index) => {
      if (card.cardFrontImage && !/^https?:\/\//i.test(card.cardFrontImage)) {
        uploadTasks.push(
          this.uploadBankCardImage(card.cardFrontImage, index)
            .then(url => {
              card.cardFrontImage = url;
            })
            .catch(err => {
              logger.warn('[保存] 银行卡图片上传失败，使用原路径', err);
            })
        );
      }
    });

    return Promise.all(uploadTasks).then(() => {
      return req.post('/public/orders/step5', {
        bankCards: bankCards
      }).then(res => {
        if (res && res.data && res.data.orderId) {
          return res.data.orderId;
        }
        throw new Error('创建订单失败：未返回 orderId');
      });
    });
  },

  // 上传银行卡图片（使用通用上传工具，按订单ID归档）
  uploadBankCardImage(imagePath, cardIndex) {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    // 使用当前订单ID作为图片归属主键，可选携带证件号
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    const step2Data = wx.getStorageSync('orderFormData_step2') || {};
    const idNumber = step2Data.idNumber || '';

    // 使用通用上传工具上传银行卡图片
    return uploadUtil.uploadBankCardImage(imagePath, orderId, idNumber)
      .then(result => {
        const url = result.url || result;
        logger.info('[上传] 银行卡图片上传成功', { 
          orderId,
          idNumber: idNumber ? idNumber.trim() : '',
          cardIndex,
          url 
        });
        return url;
      })
      .catch(err => {
        logger.error('[上传] 银行卡图片上传失败', { cardIndex, error: err });
        throw err;
      });
  },

  // 选择银行卡图片
  chooseBankCardImage(e) {
    const cardIndex = e.currentTarget.dataset.index;
    const that = this;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const fileSize = res.tempFiles?.[0]?.size || 0;
        logger.info('[银行卡] 选择图片成功', { cardIndex, filePath: tempFilePath, fileSize });

        // 如果大于2MB先压缩
        that.handleImageWithCompress(tempFilePath, fileSize)
          .then(({ path: finalPath, size: finalSize }) => {
            logger.info('[银行卡] 处理后图片', { finalPath, finalSize });
            
            // 上传图片到服务器
            wx.showLoading({ title: '上传中...', mask: true });
            that.uploadBankCardImage(finalPath, cardIndex)
              .then((uploadUrl) => {
                logger.info('[银行卡] 图片上传成功', { uploadUrl });
                // 更新银行卡数据中的图片URL
                const bankCards = [...that.data.bankCards];
                bankCards[cardIndex].cardFrontImage = uploadUrl;
                that.setData({ bankCards });
                that.saveData();
                wx.hideLoading();
                wx.showToast({
                  title: '上传成功',
                  icon: 'success',
                  duration: 1500
                });
              })
              .catch((err) => {
                logger.error('[银行卡] 图片上传失败', { err });
                wx.hideLoading();
                wx.showToast({
                  title: '图片上传失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              });
          })
          .catch((err) => {
            logger.error('[银行卡] 图片处理失败', { err });
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        logger.error('[银行卡] 选择图片失败', { cardIndex, error: err });
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览银行卡图片
  previewBankCardImage(e) {
    const cardIndex = e.currentTarget.dataset.index;
    const card = this.data.bankCards[cardIndex];
    const imagePath = card?.cardFrontImage;
    
    if (!imagePath) {
      wx.showToast({
        title: '请先上传银行卡图片',
        icon: 'none'
      });
      return;
    }
    
    wx.previewImage({
      current: imagePath,
      urls: [imagePath]
    });
  },

  // 删除银行卡图片
  deleteBankCardImage(e) {
    // 注意：使用 catchtap 已经会自动阻止事件冒泡，不需要手动调用 stopPropagation
    const index = e.currentTarget.dataset.index;
    const card = this.data.bankCards[index];
    
    if (!card || !card.cardFrontImage) {
      wx.showToast({
        title: '没有可删除的图片',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要删除银行卡照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 更新银行卡数据，清除图片
          const bankCards = this.data.bankCards;
          bankCards[index].cardFrontImage = '';
          this.setData({
            bankCards: bankCards
          });
          // 保存到本地存储（保持与 saveData 一致的数据结构）
          wx.setStorageSync('orderFormData_step5', { bankCards });
          const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
          const card = bankCards[index];
          const bankCardId = card && (card.id || card.bankCardId);
          if (orderId && bankCardId) {
            const req = wx.$request;
            const payload = {
              holderType: card.holderType,
              cardholderName: card.cardholderName,
              idType: card.idType,
              idNumber: card.idNumber,
              bankName: card.bankName,
              cardNumber: card.cardNumber,
              reservedMobile: card.reservedMobile,
              cardFrontImage: '' // 清空图片
            };
            wx.showLoading({ title: '处理中...', mask: true });
            req.request({
              url: `/public/orders/${orderId}/bankCards/${bankCardId}`,
              method: 'PUT',
              data: payload
            })
              .then(() => {
                wx.hideLoading();
                wx.showToast({ title: '已删除', icon: 'success' });
              })
              .catch((err) => {
                wx.hideLoading();
                logger.error('[银行卡] 删除图片后单条更新失败', err);
                wx.showToast({ title: '已本地删除，后端同步失败', icon: 'none', duration: 2500 });
              });
          } else {
            wx.showToast({ title: '已删除', icon: 'success' });
          }
        }
      }
    });
  },

  // 图片压缩处理（复用 step2 的逻辑）
  handleImageWithCompress(imagePath, size) {
    const LIMIT = 2 * 1024 * 1024; // 2MB
    if (!size || size <= LIMIT) {
      return Promise.resolve({ path: imagePath, size });
    }

    logger.info('[银行卡] 图片超过2MB，开始压缩', { imagePath, size });
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
              logger.info('[银行卡] 压缩完成', { compressedPath, size: stat.size });
              resolve({ path: compressedPath, size: stat.size });
            },
            fail: () => {
              logger.warn('[银行卡] 无法读取压缩后大小，默认通过', { compressedPath });
              resolve({ path: compressedPath, size: LIMIT });
            }
          });
        },
        fail: (err) => {
          logger.error('[银行卡] 压缩失败', err);
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    });
  },

  // 保存步骤5（银行卡信息）到后端
  saveStep5ToServer(orderId) {
    const req = wx.$request;
    
    const bankCards = this.data.bankCards.map(card => ({ ...card }));
    
    // 检查是否有未上传的本地图片，如果有则先上传
    const uploadTasks = [];
    bankCards.forEach((card, index) => {
      if (card.cardFrontImage && !/^https?:\/\//i.test(card.cardFrontImage)) {
        uploadTasks.push(
          this.uploadBankCardImage(card.cardFrontImage, index)
            .then(url => {
              card.cardFrontImage = url;
            })
            .catch(err => {
              logger.warn('[保存] 银行卡图片上传失败，使用原路径', err);
            })
        );
      }
    });

    return Promise.all(uploadTasks).then(() => {
      return req.post(`/public/orders/${orderId}/step5`, {
        bankCards: bankCards
      });
    });
  },

  // 跳转到下一步（步骤6）
  goNextInternal() {
    navigation.goNext(this.data.currentStep);
  },

  // 上一步
  goPrev() {
    navigation.goPrev(this.data.currentStep);
  }
});


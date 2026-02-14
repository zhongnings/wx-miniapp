/**
 * 订单创建流程导航工具
 * 统一管理订单上下文和页面跳转，避免参数遗漏
 */

const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[Navigation]', ...args),
  error: (...args) => console.error('[Navigation]', ...args),
  warn: (...args) => DEBUG && console.warn('[Navigation]', ...args),
  info: (...args) => DEBUG && console.info('[Navigation]', ...args)
};

// Step 页面路径配置
const STEP_PAGES = [
  '/pages/order/create/step1/index',
  '/pages/order/create/step2/index',
  '/pages/order/create/step3/index',
  '/pages/order/create/step4/index',
  '/pages/order/create/step5/index',
  '/pages/order/create/step6/index'
];

/**
 * 设置订单上下文到全局
 * @param {Object} context - 订单上下文
 * @param {String} context.orderId - 订单ID
 * @param {String} context.orderStatus - 订单状态
 * @param {String} context.mode - 模式（create/view）
 * @param {Boolean} context.fromOrderDetail - 是否从订单详情进入
 */
function setOrderContext(context) {
  const app = getApp();
  if (!app.globalData.orderContext) {
    app.globalData.orderContext = {};
  }
  
  // 合并更新
  Object.assign(app.globalData.orderContext, context);
  
  logger.info('设置订单上下文', app.globalData.orderContext);
}

/**
 * 获取订单上下文
 * @returns {Object} 订单上下文
 */
function getOrderContext() {
  const app = getApp();
  const context = app.globalData.orderContext || {};
  
  // 如果全局上下文中没有 orderId，尝试从本地存储获取（兼容旧逻辑）
  // 但要注意：本地存储可能是旧订单的数据，所以优先使用全局上下文
  if (!context.orderId) {
    const localOrderId = wx.getStorageSync('currentOrderId');
    if (localOrderId) {
      logger.warn('全局上下文中没有 orderId，从本地存储读取', { localOrderId });
      context.orderId = localOrderId;
    }
  }
  
  return context;
}

/**
 * 清除订单上下文
 * 使用场景：
 * 1. 用户退出订单创建流程返回订单列表时
 * 2. 订单提交成功后
 * 3. 用户取消订单创建时
 */
function clearOrderContext() {
  const app = getApp();
  app.globalData.orderContext = {
    orderId: null,
    orderStatus: null,
    mode: null,
    fromOrderDetail: false
  };
  
  // 同时清除本地存储（可选，根据业务需求决定）
  // wx.removeStorageSync('currentOrderId');
  
  logger.info('清除订单上下文');
}

/**
 * 构建带完整参数的 Step URL
 * @param {Number} stepIndex - 步骤索引（0-5）
 * @param {Object} customContext - 自定义上下文（可选，默认使用全局上下文）
 * @returns {String} 完整的 URL
 */
function buildStepUrl(stepIndex, customContext = null) {
  if (stepIndex < 0 || stepIndex >= STEP_PAGES.length) {
    logger.error('无效的步骤索引', stepIndex);
    return STEP_PAGES[0];
  }
  
  const context = customContext || getOrderContext();
  let url = STEP_PAGES[stepIndex];
  const params = [];
  
  // 添加 orderId 参数
  if (context.orderId) {
    params.push(`orderId=${context.orderId}`);
    // 兼容旧逻辑：同时添加 id 参数
    params.push(`id=${context.orderId}`);
  }
  
  // 添加 orderStatus 参数
  if (context.orderStatus != null && context.orderStatus !== undefined) {
    params.push(`orderStatus=${context.orderStatus}`);
  }
  
  // 添加 mode 参数
  if (context.mode) {
    params.push(`mode=${context.mode}`);
  }
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  logger.info('构建 URL', { stepIndex, url, context });
  return url;
}

/**
 * 从 URL options 初始化订单上下文
 * 在每个 step 页面的 onLoad 中调用
 * @param {Object} options - 页面 onLoad 的 options 参数
 * @param {Boolean} shouldSetContext - 是否设置全局上下文（默认 false，只读取）
 */
function initOrderContextFromOptions(options, shouldSetContext = false) {
  const context = {
    orderId: options.orderId || options.id || null,
    orderStatus: options.orderStatus || null,
    mode: options.mode || 'create',
    fromOrderDetail: (options.mode === 'view' && (options.orderId || options.id))
  };
  
  // 只在特定场景下设置全局上下文：
  // 1. 从订单详情进入时（mode === 'view'）
  // 2. 显式指定 shouldSetContext = true
  if (shouldSetContext || context.mode === 'view') {
    logger.info('设置全局上下文', { context, reason: context.mode === 'view' ? '从订单详情进入' : '显式设置' });
    setOrderContext(context);
    
    // 同时更新本地存储
    if (context.orderId) {
      wx.setStorageSync('currentOrderId', context.orderId);
    }
  } else {
    // 其他情况：只从全局上下文读取，不设置
    const globalContext = getOrderContext();
    logger.info('从全局上下文读取', { globalContext, urlParams: context });
    
    // 合并 URL 参数和全局上下文（URL 参数优先级更高）
    context.orderId = context.orderId || globalContext.orderId;
    context.orderStatus = context.orderStatus || globalContext.orderStatus;
    context.mode = context.mode || globalContext.mode || 'create';
  }
  
  return context;
}

/**
 * 上一步导航
 * @param {Number} currentStep - 当前步骤索引（0-5）
 */
function goPrev(currentStep) {
  const context = getOrderContext();
  
  logger.info('上一步导航', { currentStep, context });
  
  // 如果是从订单详情进入，需要跳转到上一个 step 页面
  if (context.fromOrderDetail && context.orderId) {
    if (currentStep > 0) {
      const url = buildStepUrl(currentStep - 1);
      wx.redirectTo({
        url: url,
        fail: (err) => {
          logger.error('redirectTo 失败，尝试 navigateBack', err);
          wx.navigateBack();
        }
      });
    } else {
      // 已经是第一步，返回订单详情
      wx.navigateBack();
    }
  } else {
    // 正常创建流程，直接返回
    wx.navigateBack();
  }
}

/**
 * 下一步导航
 * @param {Number} currentStep - 当前步骤索引（0-5）
 */
function goNext(currentStep) {
  const context = getOrderContext();
  
  logger.info('下一步导航', { currentStep, context });
  
  if (currentStep < STEP_PAGES.length - 1) {
    const url = buildStepUrl(currentStep + 1);
    wx.navigateTo({
      url: url,
      fail: (err) => {
        logger.error('navigateTo 失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  } else {
    logger.warn('已经是最后一步');
  }
}

/**
 * 导航栏 Tab 点击跳转
 * @param {Number} targetStep - 目标步骤索引（0-5）
 * @param {Number} currentStep - 当前步骤索引（0-5）
 */
function navigateToStep(targetStep, currentStep) {
  const context = getOrderContext();
  
  logger.info('导航栏跳转', { targetStep, currentStep, context });
  
  // 检查是否从订单详情进入
  if (!context.fromOrderDetail) {
    logger.warn('不是从订单详情页进入，不允许跳转');
    return false;
  }
  
  // 检查是否点击当前页面
  if (targetStep === currentStep) {
    logger.info('点击的是当前页面，不跳转');
    return false;
  }
  
  // 检查 orderId
  if (!context.orderId) {
    logger.error('订单ID为空，无法跳转');
    wx.showToast({
      title: '订单ID缺失',
      icon: 'none'
    });
    return false;
  }
  
  const url = buildStepUrl(targetStep);
  
  // 获取页面栈信息
  const pages = getCurrentPages();
  logger.info('当前页面栈', {
    stackLength: pages.length,
    currentPage: pages[pages.length - 1]?.route,
    pages: pages.map(p => p.route)
  });
  
  wx.navigateTo({
    url: url,
    success: (res) => {
      logger.info('页面跳转成功', res);
    },
    fail: (err) => {
      logger.error('navigateTo 失败，尝试 redirectTo', err);
      wx.redirectTo({
        url: url,
        success: (res) => {
          logger.info('redirectTo 跳转成功', res);
        },
        fail: (err2) => {
          logger.error('redirectTo 也失败', err2);
          wx.showToast({
            title: '跳转失败: ' + (err2.errMsg || '未知错误'),
            icon: 'none',
            duration: 3000
          });
        }
      });
    }
  });
  
  return true;
}

/**
 * 计算只读状态
 * @param {String} mode - 模式（create/view）
 * @param {String} orderStatus - 订单状态
 * @returns {Boolean} 是否只读
 */
function calculateReadonly(mode, orderStatus) {
  // 订单状态为0(待提交)或2(风控驳回)时，允许编辑（不是只读）
  // 注意：orderStatus 可能是字符串或数字，需要统一处理
  const status = orderStatus != null ? String(orderStatus) : null;
  const isEditableByStatus = status === "0" || status === "2";
  const readonly = mode === 'view' && !isEditableByStatus;
  
  logger.info('计算只读状态', { mode, orderStatus, status, isEditableByStatus, readonly });
  
  return readonly;
}

module.exports = {
  setOrderContext,
  getOrderContext,
  clearOrderContext,
  buildStepUrl,
  initOrderContextFromOptions,
  goPrev,
  goNext,
  navigateToStep,
  calculateReadonly,
  STEP_PAGES
};


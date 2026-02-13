const logger = require('../../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    orders: [],
    tab: 'manage',
    keyword: '',
    selectedStatus: 'all',
    currentStatusLabel: '所有', // 当前选择的状态标签
    showStatusPicker: false,
    showMenuDrawer: false,
    manageCount: 0,
    historyCount: 0,
    currentMenu: 'order',
    menuList: [],
    // 分页相关
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    hasMore: true,
    loading: false,
    hasLoadedOnce: false,
    statsLoaded: false, // 统计是否已加载
    statusOptions: [
      { label: '所有', value: 'all' },
      { label: '待提交', value: 'pending' },
      { label: '风控审核中', value: 'reviewing' },
      { label: '风控驳回', value: 'rejected' },
      { label: '待放款', value: 'pending_loan' },
      { label: '放款中', value: 'loaning' },
      { label: '待债转', value: 'pending_transfer' },
      { label: '签署中', value: 'signing' },
      { label: '待人脸识别', value: 'pending_face' },
      { label: '完成', value: 'completed' }
    ]
  },

  onLoad() {
    logger.info('订单列表页面加载');
    this.loadUserMenu();
    // 进入页面时加载统计和订单列表
    this.loadStats(() => {
      this.loadOrders(true, () => {
        this.setData({ hasLoadedOnce: true });
      });
    });
  },

  onShow() {
    // 返回页面时刷新，但避免与首次加载重复
    if (!this.data.hasLoadedOnce) {
      return;
    }
    this.setData({
      page: 1,
      orders: [],
      hasMore: true
    }, () => {
      this.loadOrders(true);
    });
  },

  /**
   * 加载用户菜单（根据权限）
   */
  loadUserMenu() {
    // 仅使用登录时缓存的菜单，避免重复请求
    const cached = wx.getStorageSync('MENUS') || [];
    let menuList = [];
    if (cached && cached.length) {
      menuList = cached.map(item => ({
        key: item.code || item.key,
        label: item.name || item.label,
        path: item.path
      }));
      logger.info('用户菜单加载完成（缓存）:', cached);
    } else {
      // 默认菜单
      menuList = [
        { key: 'order:list', label: '订单列表', path: '/pages/order/list/index' }
      ];
      logger.info('未找到缓存菜单，使用默认菜单');
    }
    
    // 识别当前页面对应的菜单项
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage ? currentPage.route : '';
    const currentPath = '/' + currentRoute;
    
    // 查找匹配的菜单项
    const matchedMenu = menuList.find(item => {
      if (item.path === currentPath) {
        return true;
      }
      // 兼容处理：如果 path 是相对路径，也尝试匹配
      if (item.path && currentRoute.includes(item.path.replace(/^\//, ''))) {
        return true;
      }
      return false;
    });
    
    // 设置菜单列表和当前菜单
    this.setData({
      menuList: menuList,
      currentMenu: matchedMenu ? matchedMenu.key : (menuList.length > 0 ? menuList[0].key : 'order')
    });
    
    logger.info('菜单初始化完成:', {
      menuList,
      currentRoute,
      currentPath,
      currentMenu: this.data.currentMenu
    });
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
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      tab,
      page: 1,
      orders: [],
      hasMore: true
    }, () => {
      // 切换选项卡时只加载订单列表，不加载统计
      this.loadOrders(true);
    });
  },

  /**
   * 搜索关键词输入
   */
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 搜索
   */
  onSearch() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true,
      statsLoaded: false // 搜索条件改变时，重新加载统计
    }, () => {
      // 搜索条件改变时，重新加载统计和订单列表
      this.loadStats(() => {
        this.loadOrders(true);
      });
    });
  },

  /**
   * 显示状态选择器
   */
  showStatusPicker() {
    this.setData({ showStatusPicker: true });
  },

  /**
   * 隐藏状态选择器
   */
  hideStatusPicker() {
    this.setData({ showStatusPicker: false });
  },

  /**
   * 选择状态
   */
  selectStatus(e) {
    const value = e.currentTarget.dataset.value;
    // 根据选择的值找到对应的标签
    const statusOption = this.data.statusOptions.find(opt => opt.value === value);
    const statusLabel = statusOption ? statusOption.label : '所有';
    this.setData({ 
      selectedStatus: value,
      currentStatusLabel: statusLabel
    });
  },

  /**
   * 确认状态选择
   */
  confirmStatus() {
    // 确保 currentStatusLabel 已更新（selectStatus 已经更新了）
    this.setData({ 
      showStatusPicker: false,
      page: 1,
      orders: [],
      hasMore: true,
      statsLoaded: false // 状态筛选改变时，重新加载统计
    }, () => {
      // 状态筛选改变时，重新加载统计和订单列表
      this.loadStats(() => {
        this.loadOrders(true);
      });
    });
  },

  /**
   * 状态映射：将订单状态值转换为中文显示
   * 支持数字状态（0-8）和字符串状态
   */
  getStatusLabel(orderStatus) {
    // 数字状态映射（0-8）- 订单状态
    const numberStatusMap = {
      0: '待提交',
      1: '签署中',
      2: '风控驳回',
      3: '待放款',
      4: '放款中',
      5: '完成'
    };
    
    // 字符串状态映射（兼容旧逻辑）
    const stringStatusMap = {
      'pending': '待提交',
      'signing': '签署中',
      'rejected': '风控驳回',
      'reviewing': '风控审核中',
      'pending_loan': '待放款',
      'loaning': '放款中',
      'completed': '完成'/*,
      'pending_transfer': '待债转',
      'pending_face': '待人脸识别'*/
    };
    
    // 如果是数字，使用数字映射
    if (typeof orderStatus === 'number' || (typeof orderStatus === 'string' && /^\d+$/.test(orderStatus))) {
      const numStatus = typeof orderStatus === 'number' ? orderStatus : parseInt(orderStatus);
      return numberStatusMap[numStatus] || '';
    }
    
    // 如果是字符串，使用字符串映射
    return stringStatusMap[orderStatus] || orderStatus || '';
  },

  /**
   * 加载统计数量（订单管理/历史订单）
   * @param {Function} callback - 可选，完成后回调
   */
  loadStats(callback) {
    // 如果已经加载过统计，不再重复加载
    if (this.data.statsLoaded) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    
    req.request({
      url: '/public/orders/stats',
      method: 'GET',
      data: {
        keyword: this.data.keyword,
        status: this.data.selectedStatus === 'all' ? "" : this.data.selectedStatus
      }
    }).then((statsRes) => {
      let manageCount = 0;
      let historyCount = 0;
      if (statsRes && statsRes.data) {
        manageCount = Number(statsRes.data.manageTotal || 0);
        historyCount = Number(statsRes.data.historyTotal || 0);
      }
      
      this.setData({
        manageCount,
        historyCount,
        statsLoaded: true
      });
      
      logger.info('统计数量加载成功:', { manageCount, historyCount });
      
      if (typeof callback === 'function') {
        callback();
      }
    }).catch(err => {
      logger.error('加载统计数量失败:', err);
      // 统计加载失败不影响订单列表加载
      if (typeof callback === 'function') {
        callback();
      }
    });
  },

  /**
   * 加载订单列表
   * @param {Boolean} reset - 是否重置分页（第一页）
   * @param {Function} callback - 可选，完成后回调
   */
  loadOrders(reset = false, callback) {
    // 如果正在加载或没有更多数据，则不加载
    if (this.data.loading || (!this.data.hasMore && !reset)) {
      return;
    }
    
    // 如果是重置，重置分页参数
    if (reset) {
      this.setData({
        page: 1,
        hasMore: true
      });
    }
    
    const page = reset ? 1 : this.data.page;
    
    this.setData({ loading: true });
    
    if (reset) {
      wx.showLoading({ title: '加载中...' });
    }
    
    // 只加载当前 tab 的订单列表（不加载统计）
    req.request({
      url: '/public/orders',
      method: 'GET',
      data: {
        tab: this.data.tab,
        keyword: this.data.keyword,
        status: this.data.selectedStatus === 'all' ? "" : this.data.selectedStatus,
        page: page,
        size: this.data.size
      }
    })
      .then((currentRes) => {
        // 调试：打印原始响应数据
        logger.info('当前tab响应数据:', JSON.stringify(currentRes.data, null, 2));
        
        // 后端返回的 res.data 就是 PageResult 对象
        // 但需要检查数据结构
        let pageResult = currentRes.data || {};
        let orders = [];
        
        // 处理不同的数据结构
        if (Array.isArray(currentRes.data)) {
          // 如果直接返回数组（兼容旧接口）
          orders = currentRes.data;
          pageResult = {
            data: orders,
            total: orders.length,
            page: 1,
            size: orders.length,
            totalPages: 1
          };
          logger.warn('检测到后端直接返回数组格式');
        } else if (currentRes.data && currentRes.data.data) {
          // 标准 PageResult 格式
          pageResult = currentRes.data;
          orders = pageResult.data || [];
        } else if (currentRes.data && Array.isArray(currentRes.data)) {
          // 可能是嵌套的数据结构
          orders = currentRes.data;
        }
        
        logger.info('解析后的订单数据:', {
          pageResult,
          ordersCount: orders.length,
          ordersSample: orders.slice(0, 2) // 只打印前2条作为示例
        });
        
        // 为每个订单添加状态标签并格式化数据
        orders = orders.map(order => {
          if (!order) return null;
          
          // 优先使用后端返回的 orderStatusName，否则使用 getStatusLabel 转换
          const statusLabel = order.orderStatusName || this.getStatusLabel(order.orderStatus);
          
          // 格式化日期（处理可能的日期格式）
          let loanDate = order.loanDate || '-';
          if (loanDate && typeof loanDate === 'string' && loanDate.length > 10) {
            // 如果日期包含时间部分，只取日期部分
            loanDate = loanDate.substring(0, 10);
          }
          
          // 格式化金额（确保是数字）
          let loanAmount = order.loanAmount;
          if (loanAmount && typeof loanAmount === 'string') {
            loanAmount = parseFloat(loanAmount);
          }
          
          return {
            id: order.id,
            borrowerName: order.borrowerName || '未填写',
            loanAmount: loanAmount || 0,
            loanDate: loanDate,
            orderNo: order.orderNo || '-',
            orderStatus: order.orderStatus,
            orderStatusName: order.orderStatusName, // 订单状态名称
            riskStatus: order.riskStatus,
            riskStatusName: order.riskStatusName, // 风控状态名称
            repaymentStatus: order.repaymentStatus,
            repaymentStatusName: order.repaymentStatusName, // 还款状态名称
            signStatus: order.signStatus,
            signStatusName: order.signStatusName, // 签署状态名称
            statusLabel: statusLabel || order.orderStatusName || ''
          };
        }).filter(order => order !== null); // 过滤掉空值
        
        // 合并订单列表（如果是加载更多）
        const allOrders = reset ? orders : [...this.data.orders, ...orders];
        
        // 判断是否还有更多数据
        const currentPage = pageResult.page || page;
        const totalPages = pageResult.totalPages || 1;
        const hasMore = currentPage < totalPages;
        
        logger.info('准备设置页面数据:', {
          ordersCount: orders.length,
          allOrdersCount: allOrders.length,
          currentPage,
          totalPages,
          hasMore
        });
        
        this.setData({
          orders: allOrders,
          total: pageResult.total || allOrders.length,
          totalPages: totalPages,
          page: currentPage,
          hasMore: hasMore,
          loading: false
        });
        
        logger.info('订单列表加载成功:', {
          current: orders.length,
          total: allOrders.length,
          page: currentPage,
          totalPages: totalPages,
          hasMore: hasMore
        });
      })
      .catch(err => {
        logger.error('加载订单列表失败:', err);
        logger.error('错误详情:', {
          message: err.message,
          data: err.data,
          statusCode: err.statusCode
        });
        this.setData({ loading: false });
        
        // 显示更详细的错误信息
        const errorMsg = err.data?.message || err.message || '加载失败';
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        if (reset) {
          wx.hideLoading();
        }
        if (typeof callback === 'function') {
          callback();
        }
      });
  },

  /**
   * 滚动到底部加载更多
   */
  onScrollToLower() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      }, () => {
        this.loadOrders(false);
      });
    }
  },

  /**
   * 跳转到订单详情
   */
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    
    wx.navigateTo({
      url: `/pages/order/detail/index?id=${id}`
    });
  },

  /**
   * 复制订单编号
   */
  copyOrderNo(e) {
    const orderNo = e.currentTarget.dataset.no;
    if (!orderNo) return;
    
    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 删除订单
   */
  deleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteOrder(id);
        }
      }
    });
  },

  /**
   * 执行删除订单
   */
  doDeleteOrder(id) {
    wx.showLoading({ title: '删除中...' });
    
    req.request({
      url: `/public/orders/${id}`,
      method: 'DELETE'
    }).then(() => {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      // 删除订单后，重新加载统计和订单列表
      this.setData({
        page: 1,
        orders: [],
        hasMore: true,
        statsLoaded: false
      }, () => {
        this.loadStats(() => {
          this.loadOrders(true);
        });
      });
    }).catch(err => {
      logger.error('删除订单失败:', err);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 新建订单
   */
  onCreateOrder() {
    logger.info('点击新建订单按钮');
    wx.navigateTo({
      url: '/pages/order/create/step1/index',
      success: () => {
        logger.info('跳转到订单创建页面成功');
      },
      fail: (err) => {
        logger.error('跳转到订单创建页面失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  }
});

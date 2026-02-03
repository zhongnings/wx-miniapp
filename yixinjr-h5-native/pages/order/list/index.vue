<template>
  <view class="order-list-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-title">订单列表</view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="menu-icon" @tap="showMenu">
        <text class="icon-text">🏠</text>
      </view>
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          placeholder="请输入搜索关键词" 
          v-model="keyword"
          confirm-type="search"
          @confirm="onSearch"
        />
      </view>
    </view>

    <!-- 标签页和状态筛选 -->
    <view class="tabs-section">
      <view class="tabs">
        <view 
          class="tab"
          :class="{ active: tab === 'manage' }"
          @tap="onTabChange('manage')"
        >
          订单管理
          <view class="badge">{{ manageCount }}</view>
        </view>
        <view 
          class="tab"
          :class="{ active: tab === 'history' }"
          @tap="onTabChange('history')"
        >
          历史订单
          <view class="badge">{{ historyCount }}</view>
        </view>
      </view>
      <view class="status-filter" @tap="showStatusPicker">
        <text>{{ currentStatusLabel }}</text>
        <text class="arrow">▼</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view 
      class="order-list" 
      scroll-y
      enhanced
      :show-scrollbar="false"
      @scrolltolower="onScrollToLower"
      :lower-threshold="100"
    >
      <view class="order-item" v-for="item in orders" :key="item.id">
        <view class="order-row">
          <text class="label">借款人：</text>
          <text class="value">{{ item.borrowerName || '未填写' }}</text>
          <view class="status-link" v-if="item.statusLabel" @tap="goDetail(item.id)">
            {{ item.statusLabel }} >
          </view>
        </view>
        <view class="order-row">
          <text class="label">借款金额：</text>
          <text class="amount">{{ item.loanAmount || '0.00' }}</text>
          <text class="unit">(元)</text>
        </view>
        <view class="order-row">
          <text class="label">借款时间：</text>
          <text class="value">{{ item.loanDate || '-' }}</text>
        </view>
        <view class="order-row order-no-row" @tap="goDetail(item.id)">
          <text class="label">订单编号：</text>
          <text class="value order-no">{{ item.orderNo || '-' }}</text>
          <view class="order-actions">
            <text class="action-icon copy-icon" @tap.stop="copyOrderNo(item.orderNo)">📋</text>
            <text class="action-icon delete-icon" @tap.stop="deleteOrder(item.id)">🗑️</text>
          </view>
        </view>
      </view>
      
      <view class="empty-tip" v-if="orders.length === 0 && !loading">没有更多啦~</view>
      <view class="loading-tip" v-if="loading">加载中...</view>
      <view class="no-more-tip" v-if="!hasMore && orders.length > 0">没有更多了</view>
    </scroll-view>

    <!-- 右下角浮动按钮 -->
    <view class="fab" @tap="onCreateOrder">
      <view class="fab-icon-wrapper">
        <view class="fab-icon-circle">
          <text class="fab-icon">✓</text>
        </view>
      </view>
      <text class="fab-divider">|</text>
      <text class="fab-text">新建订单</text>
    </view>

    <!-- 状态选择器 -->
    <view class="status-picker-mask" :class="{ show: showStatusPickerFlag }" @tap="hideStatusPicker">
      <view class="status-picker" @tap.stop="stopPropagation">
        <view class="picker-header">
          <text class="picker-cancel" @tap="hideStatusPicker">取消</text>
          <text class="picker-title">请选择状态</text>
          <text class="picker-confirm" @tap="confirmStatus">确认</text>
        </view>
        <view class="picker-content">
          <view 
            class="picker-item"
            :class="{ selected: selectedStatus === item.value }"
            v-for="item in statusOptions" 
            :key="item.value"
            @tap="selectStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </view>
    </view>

    <!-- 菜单抽屉 -->
    <view class="menu-drawer" :class="{ show: showMenuDrawer }" @tap="hideMenu">
      <view class="menu-content" @tap.stop="stopPropagation">
        <view class="menu-header">
          <text class="menu-title">选择菜单</text>
          <text class="menu-close" @tap="hideMenu">×</text>
        </view>
        <view class="menu-list">
          <view 
            class="menu-item"
            :class="{ active: currentMenu === item.key }"
            v-for="item in menuList" 
            :key="item.key"
            @tap="onMenuClick(item)"
          >
            <text class="menu-text">{{ item.label }}</text>
            <text class="menu-check" v-if="currentMenu === item.key">✓</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const logger = require('../../../utils/logger.js');

export default {
  data() {
    return {
      orders: [],
      tab: 'manage',
      keyword: '',
      selectedStatus: 'all',
      currentStatusLabel: '所有',
      showStatusPickerFlag: false,
      showMenuDrawer: false,
      manageCount: 0,
      historyCount: 0,
      currentMenu: 'order',
      menuList: [],
      page: 1,
      size: 10,
      total: 0,
      totalPages: 0,
      hasMore: true,
      loading: false,
      hasLoadedOnce: false,
      statsLoaded: false,
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
    };
  },
  
  onLoad() {
    logger.info('订单列表页面加载');
    this.loadUserMenu();
    this.loadStats(() => {
      this.loadOrders(true, () => {
        this.hasLoadedOnce = true;
      });
    });
  },
  
  onShow() {
    if (!this.hasLoadedOnce) {
      return;
    }
    this.page = 1;
    this.orders = [];
    this.hasMore = true;
    this.loadOrders(true);
  },
  
  methods: {
    /**
     * 加载用户菜单
     */
    loadUserMenu() {
      const cached = uni.getStorageSync('MENUS') || [];
      let menuList = [];
      if (cached && cached.length) {
        menuList = cached.map(item => ({
          key: item.code || item.key,
          label: item.name || item.label,
          path: item.path
        }));
        logger.info('用户菜单加载完成（缓存）:', cached);
      } else {
        menuList = [
          { key: 'order:list', label: '订单列表', path: '/pages/order/list/index' }
        ];
        logger.info('未找到缓存菜单，使用默认菜单');
      }
      
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const currentRoute = currentPage ? currentPage.route : '';
      const currentPath = '/' + currentRoute;
      
      const matchedMenu = menuList.find(item => {
        if (item.path === currentPath) return true;
        if (item.path && currentRoute.includes(item.path.replace(/^\//, ''))) return true;
        return false;
      });
      
      this.menuList = menuList;
      this.currentMenu = matchedMenu ? matchedMenu.key : (menuList.length > 0 ? menuList[0].key : 'order');
    },
    
    /**
     * 显示菜单
     */
    showMenu() {
      this.showMenuDrawer = true;
    },
    
    /**
     * 隐藏菜单
     */
    hideMenu() {
      this.showMenuDrawer = false;
    },
    
    /**
     * 菜单项点击
     */
    onMenuClick(item) {
      this.currentMenu = item.key;
      this.showMenuDrawer = false;
      
      if (item.path) {
        uni.redirectTo({ url: item.path });
      } else {
        uni.showToast({
          title: '功能待实现',
          icon: 'none'
        });
      }
    },
    
    /**
     * 阻止事件冒泡
     */
    stopPropagation() {},
    
    /**
     * 切换标签页
     */
    onTabChange(tab) {
      this.tab = tab;
      this.page = 1;
      this.orders = [];
      this.hasMore = true;
      this.loadOrders(true);
    },
    
    /**
     * 搜索
     */
    onSearch() {
      this.page = 1;
      this.orders = [];
      this.hasMore = true;
      this.statsLoaded = false;
      this.loadStats(() => {
        this.loadOrders(true);
      });
    },
    
    /**
     * 显示状态选择器
     */
    showStatusPicker() {
      this.showStatusPickerFlag = true;
    },
    
    /**
     * 隐藏状态选择器
     */
    hideStatusPicker() {
      this.showStatusPickerFlag = false;
    },
    
    /**
     * 选择状态
     */
    selectStatus(value) {
      const statusOption = this.statusOptions.find(opt => opt.value === value);
      const statusLabel = statusOption ? statusOption.label : '所有';
      this.selectedStatus = value;
      this.currentStatusLabel = statusLabel;
    },
    
    /**
     * 确认状态选择
     */
    confirmStatus() {
      this.showStatusPickerFlag = false;
      this.page = 1;
      this.orders = [];
      this.hasMore = true;
      this.statsLoaded = false;
      this.loadStats(() => {
        this.loadOrders(true);
      });
    },
    
    /**
     * 状态映射
     */
    getStatusLabel(orderStatus) {
      const numberStatusMap = {
        0: '待提交', 1: '风控审核中', 2: '风控驳回',
        3: '待放款', 4: '放款中', 5: '待债转',
        6: '签署中', 7: '待人脸识别', 8: '完成'
      };
      
      const stringStatusMap = {
        'pending': '待提交', 'reviewing': '风控审核中', 'rejected': '风控驳回',
        'pending_loan': '待放款', 'loaning': '放款中', 'pending_transfer': '待债转',
        'signing': '签署中', 'pending_face': '待人脸识别', 'completed': '完成'
      };
      
      if (typeof orderStatus === 'number' || (typeof orderStatus === 'string' && /^\d+$/.test(orderStatus))) {
        const numStatus = typeof orderStatus === 'number' ? orderStatus : parseInt(orderStatus);
        return numberStatusMap[numStatus] || '';
      }
      
      return stringStatusMap[orderStatus] || orderStatus || '';
    },
    
    /**
     * 加载统计数量
     */
    loadStats(callback) {
      if (this.statsLoaded) {
        if (typeof callback === 'function') callback();
        return;
      }
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: '/public/orders/stats',
        method: 'GET',
        data: {
          keyword: this.keyword,
          status: this.selectedStatus === 'all' ? "" : this.selectedStatus
        }
      }).then((statsRes) => {
        let manageCount = 0;
        let historyCount = 0;
        if (statsRes && statsRes.data) {
          manageCount = Number(statsRes.data.manageTotal || 0);
          historyCount = Number(statsRes.data.historyTotal || 0);
        }
        
        this.manageCount = manageCount;
        this.historyCount = historyCount;
        this.statsLoaded = true;
        
        logger.info('统计数量加载成功:', { manageCount, historyCount });
        
        if (typeof callback === 'function') callback();
      }).catch(err => {
        logger.error('加载统计数量失败:', err);
        if (typeof callback === 'function') callback();
      });
    },
    
    /**
     * 加载订单列表
     */
    loadOrders(reset = false, callback) {
      if (this.loading || (!this.hasMore && !reset)) {
        return;
      }
      
      if (reset) {
        this.page = 1;
        this.hasMore = true;
      }
      
      const page = reset ? 1 : this.page;
      
      this.loading = true;
      
      if (reset) {
        uni.showLoading({ title: '加载中...' });
      }
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: '/public/orders',
        method: 'GET',
        data: {
          tab: this.tab,
          keyword: this.keyword,
          status: this.selectedStatus === 'all' ? "" : this.selectedStatus,
          page: page,
          size: this.size
        }
      }).then((currentRes) => {
        logger.info('订单响应数据:', currentRes.data);
        
        let pageResult = currentRes.data || {};
        let orders = [];
        
        if (Array.isArray(currentRes.data)) {
          orders = currentRes.data;
          pageResult = {
            data: orders,
            total: orders.length,
            page: 1,
            size: orders.length,
            totalPages: 1
          };
        } else if (currentRes.data && currentRes.data.data) {
          pageResult = currentRes.data;
          orders = pageResult.data || [];
        }
        
        orders = orders.map(order => {
          if (!order) return null;
          
          const statusLabel = order.orderStatusName || this.getStatusLabel(order.orderStatus);
          
          let loanDate = order.loanDate || '-';
          if (loanDate && typeof loanDate === 'string' && loanDate.length > 10) {
            loanDate = loanDate.substring(0, 10);
          }
          
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
            statusLabel: statusLabel || ''
          };
        }).filter(order => order !== null);
        
        const allOrders = reset ? orders : [...this.orders, ...orders];
        
        const currentPage = pageResult.page || page;
        const totalPages = pageResult.totalPages || 1;
        const hasMore = currentPage < totalPages;
        
        this.orders = allOrders;
        this.total = pageResult.total || allOrders.length;
        this.totalPages = totalPages;
        this.page = currentPage;
        this.hasMore = hasMore;
        this.loading = false;
        
        logger.info('订单列表加载成功:', {
          current: orders.length,
          total: allOrders.length,
          page: currentPage,
          hasMore: hasMore
        });
      }).catch(err => {
        logger.error('加载订单列表失败:', err);
        this.loading = false;
        
        const errorMsg = err.data?.message || err.message || '加载失败';
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }).finally(() => {
        if (reset) {
          uni.hideLoading();
        }
        if (typeof callback === 'function') callback();
      });
    },
    
    /**
     * 滚动到底部加载更多
     */
    onScrollToLower() {
      if (this.hasMore && !this.loading) {
        this.page = this.page + 1;
        this.loadOrders(false);
      }
    },
    
    /**
     * 跳转到订单详情
     */
    goDetail(id) {
      if (!id) return;
      uni.navigateTo({
        url: `/pages/order/detail/index?id=${id}`
      });
    },
    
    /**
     * 复制订单编号
     */
    copyOrderNo(orderNo) {
      if (!orderNo) return;
      
      uni.setClipboardData({
        data: orderNo,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },
    
    /**
     * 删除订单
     */
    deleteOrder(id) {
      if (!id) return;
      
      uni.showModal({
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
      uni.showLoading({ title: '删除中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${id}`,
        method: 'DELETE'
      }).then(() => {
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.page = 1;
        this.orders = [];
        this.hasMore = true;
        this.statsLoaded = false;
        this.loadStats(() => {
          this.loadOrders(true);
        });
      }).catch(err => {
        logger.error('删除订单失败:', err);
        uni.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 新建订单
     */
    onCreateOrder() {
      logger.info('点击新建订单按钮');
      uni.navigateTo({
        url: '/pages/order/create/step1/index',
        success: () => {
          logger.info('跳转到订单创建页面成功');
        },
        fail: (err) => {
          logger.error('跳转到订单创建页面失败:', err);
          uni.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  }
};
</script>

<style scoped>
/* 由于样式代码过长，将在下一个文件中继续 */
@import './index.wxss';
</style>


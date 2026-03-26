const req = wx.$request;

Page({
  data: {
    orderId: null,
    voucherList: [],
    limitInfo: {
      singleLimit: 5000000,
      dailyLimit: 30000000,
      monthlyLimit: 100000000,
      usedAmount: 0
    },
    showApplyModal: false,
    currentVoucherId: null
  },

  onLoad(options) {
    this.setData({ orderId: options.id });
    this.loadVoucherList();
    this.loadLimitInfo();
  },

  onShow() {
    // 从新增/编辑页返回时刷新列表
    if (this.data.orderId) {
      this.loadVoucherList();
    }
  },

  /**
   * 加载制单列表
   */
  loadVoucherList() {
    wx.showLoading({ title: '加载中...' });
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers`,
      method: 'GET'
    }).then(res => {
      this.setData({ voucherList: res.data || [] });
    }).catch(err => {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 加载限额信息
   */
  loadLimitInfo() {
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers/limit`,
      method: 'GET'
    }).then(res => {
      this.setData({ limitInfo: res.data || this.data.limitInfo });
    });
  },

  /**
   * 查看收款卡
   */
  viewBankCards() {
    wx.navigateTo({
      url: `/pages/order/create/step5/index?orderId=${this.data.orderId}&hideNav=true&readonly=true`
    });
  },

  /**
   * 新增制单
   */
  addVoucher() {
    wx.navigateTo({
      url: `/pages/order/voucher-add/index?orderId=${this.data.orderId}`
    });
  },

  /**
   * 删除制单
   */
  deleteVoucher(e) {
    const voucherId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条制单信息吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          req.request({
            url: `/public/orders/${this.data.orderId}/vouchers/${voucherId}`,
            method: 'DELETE'
          }).then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadVoucherList();
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }).finally(() => {
            wx.hideLoading();
          });
        }
      }
    });
  },

  /**
   * 修改制单
   */
  editVoucher(e) {
    const voucherId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/voucher-add/index?orderId=${this.data.orderId}&voucherId=${voucherId}`
    });
  },

  /**
   * 放款申请
   */
  applyLoan(e) {
    const voucherId = e.currentTarget.dataset.id;
    this.setData({
      showApplyModal: true,
      currentVoucherId: voucherId
    });
  },

  /**
   * 关闭弹窗
   */
  closeApplyModal() {
    this.setData({
      showApplyModal: false,
      currentVoucherId: null
    });
  },

  /**
   * 确认放款申请
   */
  confirmApplyLoan() {
    const voucherId = this.data.currentVoucherId;
    const orderId = this.data.orderId;
    
    // 找到当前制单信息
    const voucher = this.data.voucherList.find(v => v.id === voucherId);
    if (!voucher) {
      wx.showToast({ title: '制单信息不存在', icon: 'none' });
      return;
    }
    
    // 关闭弹窗并跳转到放款信息确认页面，通过参数传递制单信息
    this.closeApplyModal();
    wx.navigateTo({
      url: `/pages/order/voucher-confirm/index?orderId=${orderId}&voucherId=${voucherId}&amount=${voucher.amount}&payee=${encodeURIComponent(voucher.payee)}&cardNo=${voucher.cardNo}&openBank=${encodeURIComponent(voucher.openBank)}`
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});


const req = wx.$request;

Page({
  data: {
    orderId: null,
    payeeList: [],
    selectedIndex: null
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId });
    this.loadPayeeList();
  },

  /**
   * 加载收款方列表
   */
  loadPayeeList() {
    wx.showLoading({ title: '加载中...' });
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers/payees`,
      method: 'GET'
    }).then(res => {
      this.setData({ payeeList: res.data || [] });
    }).catch(err => {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 选择收款方
   */
  selectPayee(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedIndex: index });
  },

  /**
   * 确认选择
   */
  confirmSelect() {
    if (this.data.selectedIndex === null) {
      wx.showToast({ title: '请选择收款方', icon: 'none' });
      return;
    }

    const payee = this.data.payeeList[this.data.selectedIndex];
    
    // 获取上一页面
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    // 设置上一页面的数据
    if (prevPage) {
      prevPage.setData({
        'formData.payee': payee.name,
        'formData.payeeType': payee.type,
        'formData.payeeTypeName': payee.typeName || '主借人',
        'formData.category': payee.category || '个人',
        'formData.openBank': payee.bankName,
        'formData.cardNo': payee.cardNo
      });
    }
    
    // 返回上一页
    wx.navigateBack();
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});


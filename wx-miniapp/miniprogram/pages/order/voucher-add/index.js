const req = wx.$request;

Page({
  data: {
    orderId: null,
    formData: {
      amount: '',
      payee: '',
      payeeType: '',
      payeeTypeName: '',
      category: '',
      openBank: '',
      cardNo: ''
    },
    loanAmount: 0
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId });
    this.loadOrderDetail();
  },

  /**
   * 加载订单详情（获取借款金额）
   */
  loadOrderDetail() {
    req.request({
      url: `/public/orders/${this.data.orderId}`,
      method: 'GET'
    }).then(res => {
      const detail = res.data || {};
      this.setData({
        loanAmount: detail.loanAmount || 0,
        'formData.amount': detail.loanAmount || ''
      });
    });
  },

  /**
   * 选择收款方
   */
  selectPayee() {
    wx.navigateTo({
      url: `/pages/order/payee-select/index?orderId=${this.data.orderId}`
    });
  },

  /**
   * 提交制单
   */
  submit() {
    const { amount, payee, payeeType, openBank, cardNo } = this.data.formData;

    // 验证必填项
    if (!amount) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!payee) {
      wx.showToast({ title: '请选择收款方', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers`,
      method: 'POST',
      data: {
        amount,
        payee,
        payeeType,
        openBank,
        cardNo
      }
    }).then(() => {
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.showToast({ title: '提交失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});


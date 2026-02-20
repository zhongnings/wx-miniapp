const req = wx.$request;

Page({
  data: {
    orderId: null,
    voucherId: null,
    voucherInfo: {
      amount: '',
      payee: '',
      cardNo: '',
      openBank: ''
    },
    paymentPassword: ''
  },

  onLoad(options) {
    // 从 URL 参数中获取制单信息
    this.setData({
      orderId: options.orderId,
      voucherId: options.voucherId,
      voucherInfo: {
        amount: options.amount || '',
        payee: decodeURIComponent(options.payee || ''),
        cardNo: options.cardNo || '',
        openBank: decodeURIComponent(options.openBank || '')
      }
    });
  },

  /**
   * 支付密码输入
   */
  onPasswordInput(e) {
    this.setData({ paymentPassword: e.detail.value });
  },

  /**
   * 提交放款申请
   */
  submitLoanApply() {
    if (!this.data.paymentPassword) {
      wx.showToast({
        title: '请输入支付密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '申请中...' });
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers/${this.data.voucherId}/apply`,
      method: 'POST',
      data: {
        paymentPassword: this.data.paymentPassword
      }
    }).then(res => {
      const data = res.data || res;
      wx.showToast({
        title: data.message || '申请成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack({ delta: 2 }); // 返回到制单列表
      }, 1500);
    }).catch(err => {
      // request.js已经统一处理了401和403错误
      // 这里只需要处理其他错误即可
      console.error('放款申请失败:', err);
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


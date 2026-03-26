const req = wx.$request;

Page({
  data: {
    orderId: null,
    voucherId: null,  // 有值则为编辑模式，null 为新增模式
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
    this.setData({
      orderId: options.orderId,
      voucherId: options.voucherId || null
    });
    this.loadOrderDetail();
    // 编辑模式：加载已有制单数据回填表单
    if (options.voucherId) {
      this.loadVoucherDetail(options.voucherId);
    }
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
        // 新增模式才用订单金额作为默认值，编辑模式保持原值
        'formData.amount': this.data.voucherId ? this.data.formData.amount : (detail.loanAmount || '')
      });
    });
  },

  /**
   * 加载制单详情（编辑模式回填）
   */
  loadVoucherDetail(voucherId) {
    req.request({
      url: `/public/orders/${this.data.orderId}/vouchers/${voucherId}`,
      method: 'GET'
    }).then(res => {
      const detail = res.data || {};
      this.setData({
        'formData.amount': detail.amount || '',
        'formData.payee': detail.payee || '',
        'formData.payeeType': detail.payeeType || '',
        'formData.payeeTypeName': detail.payeeTypeName || '',
        'formData.category': detail.category || '',
        'formData.openBank': detail.openBank || '',
        'formData.cardNo': detail.cardNo || ''
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
   * 提交制单（新增 POST / 编辑 PUT）
   */
  submit() {
    const { amount, payee, payeeType, openBank, cardNo } = this.data.formData;
    const { orderId, voucherId } = this.data;
    const isEdit = !!voucherId;

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
      url: isEdit
        ? `/public/orders/${orderId}/vouchers/${voucherId}`
        : `/public/orders/${orderId}/vouchers`,
      method: isEdit ? 'PUT' : 'POST',
      data: {
        amount,
        payee,
        payeeType,
        openBank,
        cardNo
      }
    }).then(() => {
      wx.showToast({ title: isEdit ? '修改成功' : '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(() => {
      wx.showToast({ title: isEdit ? '修改失败' : '提交失败', icon: 'none' });
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

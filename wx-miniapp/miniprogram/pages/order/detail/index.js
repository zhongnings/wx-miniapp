const logger = require('../../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    id: null,
    detail: {},
    attachments: [],
    contracts: [],
    basicInfoExpanded: true,
    formattedAmount: '0.00',
    infoStatus: {
      loanInfo: '未填写',
      borrowerInfo: '未填写',
      coBorrowerInfo: '未填写',
      guarantorInfo: '未填写',
      bankCardInfo: '未填写',
      attachment: '未上传'
    },
    buttonText: '立即提交',
    showContractList: false
  },

  onLoad(query) {
    this.setData({ id: query.id });
    this.loadDetail();
    // 合同列表改为进入合同页时再加载，避免切换页面时仍触发请求
  },

  onShow() {
    // 从其他页面返回时，重新加载订单详情以更新状态
    // 但要避免首次加载时重复调用（onLoad已经调用过了）
    if (this.data.id && this.data.detail && this.data.detail.id) {
      // 只有当detail已经加载过（不是首次进入）时才重新加载
      this.loadDetail();
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 切换基础信息展开/收起
   */
  toggleBasicInfo() {
    this.setData({
      basicInfoExpanded: !this.data.basicInfoExpanded
    });
  },

  /**
   * 加载订单详情
   */
  loadDetail() {
    wx.showLoading({ title: '加载中...' });
    
    req.request({
      url: `/public/orders/${this.data.id}`,
      method: 'GET'
    }).then(res => {
      const detail = res.data || {};
      // 格式化金额
      const formattedAmount = detail.loanAmount ? 
        parseFloat(detail.loanAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
        '0.00';
      
      // 计算基础信息状态（只有必填项显示*，其他不显示）
      const infoStatus = {
        loanInfo: detail.loanInfo ? '已完成' : '未填写',
        borrowerInfo: detail.borrowerInfo && detail.borrowerInfo.name && detail.borrowerInfo.name !== '未填写' ? '已完成' : '未填写',
        coBorrowerInfo: detail.coBorrowerInfo && detail.coBorrowerInfo.name && detail.coBorrowerInfo.name !== '未填写' ? '已完成' : '未填写',
        guarantorInfo: detail.guarantorInfo && detail.guarantorInfo.name && detail.guarantorInfo.name !== '未填写' ? '已完成' : '未填写',
        bankCardInfo: detail.bankCardInfo && detail.bankCardInfo.cardNo ? '已完成' : '未填写',
        attachment: (detail.attachments && detail.attachments.length > 0) ? '已上传' : '未上传'
      };
      
      // 判断必填项是否完成（借款信息、借款人信息、银行卡信息）
      const requiredFieldsComplete = 
        infoStatus.loanInfo === '已完成' && 
        infoStatus.borrowerInfo === '已完成' && 
        infoStatus.bankCardInfo === '已完成';
      
      // 判断订单是否已提交（状态不是待提交）
      const isSubmitted = detail.orderStatus !== null && detail.orderStatus !== 0;
      
      // 设置按钮文字和合同列表显示
      let buttonText = '立即提交';
      let showContractList = false;
      
      if (isSubmitted) {
        buttonText = '驳回';
        showContractList = true;
      } else if (!requiredFieldsComplete) {
        buttonText = '立即完善资料';
      }
      
      this.setData({
        detail,
        attachments: detail.attachments || [],
        formattedAmount,
        infoStatus,
        buttonText,
        showContractList
      });
      logger.info('订单详情加载成功:', detail);
    }).catch(err => {
      logger.error('加载订单详情失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 加载合同列表
   */
  loadContracts() {
    req.request({
      url: `/public/orders/${this.data.id}/contracts`,
      method: 'GET'
    }).then(res => {
      this.setData({ contracts: res.data || [] });
    }).catch(err => {
      logger.error('加载合同列表失败:', err);
    });
  },

  /**
   * 订单详情链接
   */
  goOrderDetail() {
    wx.navigateTo({
      url: `/pages/order/fulldetail/index?id=${this.data.id}`
    });
  },

  /**
   * 立即提交/立即完善资料/驳回
   */
  onSubmit() {
    const { buttonText, infoStatus } = this.data;
    
    // 如果是"立即完善资料"，跳转到第一个未完成的必填项
    if (buttonText === '立即完善资料') {
      this.goToFirstIncompleteRequiredField();
      return;
    }
    
    // 如果是"驳回"，执行驳回操作
    if (buttonText === '驳回') {
      wx.showModal({
        title: '确认驳回',
        content: '确定要驳回这个订单吗？驳回后将删除所有合同信息，订单状态将恢复为待提交。',
        success: (res) => {
          if (res.confirm) {
            this.rejectOrder();
          }
        }
      });
      return;
    }
    
    // 如果是"立即提交"，执行提交操作
    if (buttonText === '立即提交') {
      wx.showModal({
        title: '确认提交',
        content: '确定要提交这个订单吗？',
        success: (res) => {
          if (res.confirm) {
            this.submitOrder();
          }
        }
      });
    }
  },

  /**
   * 跳转到第一个未完成的必填项
   */
  goToFirstIncompleteRequiredField() {
    const { infoStatus } = this.data;
    
    // 按顺序检查：借款信息 -> 借款人信息 -> 银行卡信息
    if (infoStatus.loanInfo !== '已完成') {
      this.goLoanInfo();
    } else if (infoStatus.borrowerInfo !== '已完成') {
      this.goBorrowerInfo();
    } else if (infoStatus.bankCardInfo !== '已完成') {
      this.goBankCardInfo();
    }
  },

  /**
   * 提交订单
   */
  submitOrder() {
    wx.showLoading({ title: '提交中...' });
    
    req.request({
      url: `/public/orders/${this.data.id}/submit`,
      method: 'POST'
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      // 重新加载订单详情，更新状态
      this.loadDetail();
    }).catch(err => {
      wx.hideLoading();
      logger.error('提交订单失败:', err);
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      });
    });
  },

  /**
   * 驳回订单
   */
  rejectOrder() {
    wx.showLoading({ title: '驳回中...' });
    
    req.request({
      url: `/public/orders/${this.data.id}/reject`,
      method: 'POST'
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '驳回成功',
        icon: 'success'
      });
      // 重新加载订单详情，更新状态
      this.loadDetail();
    }).catch(err => {
      wx.hideLoading();
      logger.error('驳回订单失败:', err);
      wx.showToast({
        title: err.message || '驳回失败',
        icon: 'none'
      });
    });
  },

  goProgress() {
    wx.navigateTo({
      url: `/pages/order/progress/index?id=${this.data.id}`
    });
  },

  goContracts() {
    wx.navigateTo({
      url: `/pages/order/contracts/index?id=${this.data.id}`
    });
  },

  previewAttachment(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url]
    });
  },
  goLoanInfo() {
    // 从订单详情跳转到借款信息页面（复用创建页 step1，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step1/index?mode=view&id=${this.data.id}`
    });
  },
  goBorrowerInfo() {
    // 从订单详情跳转到借款人信息页面（复用创建页 step2，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step2/index?mode=view&id=${this.data.id}`
    });
  },
  goCoBorrowerInfo() {
    // 从订单详情跳转到共借人信息页面（复用创建页 step3，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step3/index?mode=view&id=${this.data.id}`
    });
  },
  goGuarantorInfo() {
    // 从订单详情跳转到担保人信息页面（复用创建页 step4，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step4/index?mode=view&id=${this.data.id}`
    });
  },
  goBankCardInfo() {
    // 从订单详情跳转到银行卡信息页面（复用创建页 step5，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step5/index?mode=view&id=${this.data.id}`
    });
  },
  goAttachment() {
    // 从订单详情跳转到资料上传页面（复用创建页 step6，只读模式）
    wx.navigateTo({
      url: `/pages/order/create/step6/index?mode=view&id=${this.data.id}`
    });
  },
  goContractList() {
    wx.navigateTo({
      url: `/pages/order/contracts/index?id=${this.data.id}`
    });
  },
  goVoucher() {
    wx.showToast({ title: '制单信息页面后续完善', icon: 'none' });
  }
});



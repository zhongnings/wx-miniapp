const logger = require('../../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    id: null,
    detail: {},
    attachments: [],
    contracts: [],
    vouchers: [],
    basicInfoExpanded: true,
    voucherInfoExpanded: true,
    formattedAmount: '0.00',
    infoStatus: {
      loanInfo: '未填写',
      borrowerInfo: '未填写',
      coBorrowerInfo: '未填写',
      guarantorInfo: '未填写',
      bankCardInfo: '未填写',
      attachment: '未上传'
    },
    voucherStatus: '未填写',
    buttonText: '立即提交',
    showContractList: false,
    showApproveButton: false,
    showVoucherInfo: false,
    showButton: true,  // 新增：控制是否显示底部按钮
    statusBarHeight: 0  // 状态栏高度
  },

  onLoad(query) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      id: query.id,
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
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
   * 切换制单信息展开/收起
   */
  toggleVoucherInfo() {
    this.setData({
      voucherInfoExpanded: !this.data.voucherInfoExpanded
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
        borrowerInfo: detail.borrowerInfo && detail.borrowerInfo.name ? '已完成' : '未填写',
        coBorrowerInfo: detail.coBorrowerInfo && detail.coBorrowerInfo.name ? '已完成' : '未填写',
        guarantorInfo: detail.guarantorInfo && detail.guarantorInfo.name ? '已完成' : '未填写',
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
      
      // 判断是否为风控审核中状态（状态3）
      const isRiskReviewing = detail.orderStatus === 3;
      
      // 判断是否为待放款状态（状态4）
      const isWaitLoan = detail.orderStatus === 4;
      
      // 设置按钮文字和合同列表显示
      let buttonText = '立即提交';
      let showContractList = false;
      let showApproveButton = false;
      let showVoucherInfo = false;
      let showButton = true;  // 默认显示按钮
      
      // 判断是否隐藏按钮（状态4、5、6等不显示按钮）
      if (detail.orderStatus >= 4) {
        showButton = false;  // 你可以后续根据需要修改这个逻辑
      }
      
      if (isRiskReviewing) {
        // 风控审核中：显示"驳回"和"通过"按钮
        buttonText = '驳回';
        showContractList = true;
        showApproveButton = true;
      } else if (isWaitLoan) {
        // 待放款：显示制单信息
        buttonText = '驳回';
        showContractList = true;
        showVoucherInfo = true;
        // 加载制单列表
        this.loadVouchers();
      } else if (isSubmitted) {
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
        showContractList,
        showApproveButton,
        showVoucherInfo,
        showButton
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
   * 加载制单列表
   */
  loadVouchers() {
    req.request({
      url: `/public/orders/${this.data.id}/vouchers`,
      method: 'GET'
    }).then(res => {
      const vouchers = res.data || [];
      const voucherStatus = vouchers.length > 0 ? '已填写' : '未填写';
      this.setData({ 
        vouchers,
        voucherStatus
      });
      logger.info('制单列表加载成功:', vouchers);
    }).catch(err => {
      logger.error('加载制单列表失败:', err);
      this.setData({ voucherStatus: '未填写' });
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
   * 提交订单（异步提交 + 轮询状态）
   */
  submitOrder() {
    const that = this;
    wx.showLoading({ title: '提交中...', mask: true });
    
    req.request({
      url: `/public/orders/${this.data.id}/submit`,
      method: 'POST'
    }).then((res) => {
      // 后端立即返回，开始轮询状态
      logger.info('订单提交请求已发送，开始轮询状态');
      that.pollSubmitStatus();
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
   * 轮询订单提交状态
   */
  pollSubmitStatus() {
    const that = this;
    let pollCount = 0;
    const maxPollCount = 60; // 最多轮询60次（60秒）
    const pollInterval = 1000; // 每1秒轮询一次
    
    const poll = () => {
      pollCount++;
      
      req.request({
        url: `/public/orders/${that.data.id}/submit-status`,
        method: 'GET'
      }).then((res) => {
        const statusData = res.data || {};
        const status = statusData.status;
        const message = statusData.message || '';
        
        logger.info(`轮询状态 (${pollCount}/${maxPollCount}):`, statusData);
        
        if (status === 'success') {
          // 提交成功
          wx.hideLoading();
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          });
          // 重新加载订单详情，更新状态
          setTimeout(() => {
            that.loadDetail();
          }, 1500);
        } else if (status === 'failed') {
          // 提交失败
          wx.hideLoading();
          wx.showToast({
            title: message || '提交失败',
            icon: 'none',
            duration: 3000
          });
        } else if (status === 'processing') {
          // 仍在处理中
          wx.showLoading({ 
            title: message || '提交中...', 
            mask: true 
          });
          
          // 继续轮询
          if (pollCount < maxPollCount) {
            setTimeout(poll, pollInterval);
          } else {
            // 超时
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '订单提交时间较长，请稍后在订单列表中查看提交结果',
              showCancel: false,
              success: () => {
                that.loadDetail();
              }
            });
          }
        } else {
          // 未知状态，继续轮询
          if (pollCount < maxPollCount) {
            setTimeout(poll, pollInterval);
          } else {
            wx.hideLoading();
            wx.showToast({
              title: '提交超时，请稍后查看',
              icon: 'none'
            });
            that.loadDetail();
          }
        }
      }).catch(err => {
        logger.error('轮询状态失败:', err);
        
        // 轮询失败，继续重试
        if (pollCount < maxPollCount) {
          setTimeout(poll, pollInterval);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '提交状态查询失败',
            icon: 'none'
          });
          that.loadDetail();
        }
      });
    };
    
    // 开始第一次轮询
    poll();
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

  /**
   * 通过审核
   */
  approveOrder() {
    wx.showModal({
      title: '确认通过',
      content: '确定要通过这个订单的风控审核吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          req.request({
            url: `/public/orders/${this.data.id}/approve`,
            method: 'POST'
          }).then(() => {
            wx.hideLoading();
            wx.showToast({
              title: '审核通过',
              icon: 'success'
            });
            // 重新加载订单详情，更新状态
            this.loadDetail();
          }).catch(err => {
            wx.hideLoading();
            logger.error('审核通过失败:', err);
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'none'
            });
          });
        }
      }
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
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step1/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goBorrowerInfo() {
    // 从订单详情跳转到借款人信息页面（复用创建页 step2，只读模式）
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step2/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goCoBorrowerInfo() {
    // 从订单详情跳转到共借人信息页面（复用创建页 step3，只读模式）
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step3/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goGuarantorInfo() {
    // 从订单详情跳转到担保人信息页面（复用创建页 step4，只读模式）
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step4/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goBankCardInfo() {
    // 从订单详情跳转到银行卡信息页面（复用创建页 step5，只读模式）
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step5/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goAttachment() {
    // 从订单详情跳转到资料上传页面（复用创建页 step6，只读模式）
    const orderStatus = this.data.detail.orderStatus;
    wx.navigateTo({
      url: `/pages/order/create/step6/index?mode=view&id=${this.data.id}&orderStatus=${orderStatus}`
    });
  },
  goContractList() {
    wx.navigateTo({
      url: `/pages/order/contracts/index?id=${this.data.id}`
    });
  },
  goVoucher() {
    wx.navigateTo({
      url: `/pages/order/voucher-list/index?id=${this.data.id}`
    });
  }
});



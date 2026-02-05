const logger = require('../../../utils/logger');
const req = wx.$request;

Page({
  data: {
    orderId: null,
    orderData: {},
    loanInfo: null,
    borrowerInfo: null,
    coBorrowerInfo: null,
    guarantorInfo: null,
    bankCards: [],
    attachments: [],
    contracts: [],
    vouchers: [],
    expandedSections: {
      summary: true,
      loanInfo: true,
      borrowerInfo: true,
      coBorrowerInfo: true,
      guarantorInfo: true,
      bankCards: true,
      attachments: true,
      contracts: true,
      vouchers: true
    }
  },

  onLoad(options) {
    const orderId = options.id;
    this.setData({ orderId });
    this.loadOrderFullDetail(orderId);
  },

  /**
   * 加载订单完整详情
   */
  async loadOrderFullDetail(orderId) {
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      // 1. 加载订单基本信息
      const orderRes = await req.get(`/public/orders/${orderId}`);
      const orderData = orderRes.data || {};

      // 2. 加载借款信息（step1）
      let loanInfo = null;
      try {
        const loanRes = await req.get(`/public/orders/${orderId}/loan-info`);
        loanInfo = loanRes.data;
      } catch (err) {
        logger.warn('借款信息加载失败:', err);
      }

      // 3. 加载借款人信息（step2）
      let borrowerInfo = null;
      try {
        const borrowerRes = await req.get(`/public/orders/${orderId}/borrower`);
        borrowerInfo = borrowerRes.data;
      } catch (err) {
        logger.warn('借款人信息加载失败:', err);
      }

      // 4. 加载共借人信息（step3）
      let coBorrowerInfo = null;
      try {
        const coBorrowerRes = await req.get(`/public/orders/${orderId}/coBorrower/list`);
        if (coBorrowerRes.data && coBorrowerRes.data.length > 0) {
          coBorrowerInfo = coBorrowerRes.data[0];
        }
      } catch (err) {
        logger.warn('共借人信息加载失败:', err);
      }

      // 5. 加载担保人信息（step4）
      let guarantorInfo = null;
      try {
        const guarantorRes = await req.get(`/public/orders/${orderId}/guarantor/list`);
        if (guarantorRes.data && guarantorRes.data.length > 0) {
          guarantorInfo = guarantorRes.data[0];
        }
      } catch (err) {
        logger.warn('担保人信息加载失败:', err);
      }

      // 6. 加载银行卡信息（step5）
      let bankCards = [];
      try {
        const bankRes = await req.get(`/public/orders/${orderId}/bank-cards`);
        bankCards = bankRes.data || [];
      } catch (err) {
        logger.warn('银行卡信息加载失败:', err);
      }

      // 7. 加载附件信息（step6）
      let attachments = [];
      try {
        const attachRes = await req.get(`/public/orders/${orderId}/attachments`);
        attachments = attachRes.data || [];
      } catch (err) {
        logger.warn('附件信息加载失败:', err);
      }

      // 8. 加载合同列表
      let contracts = [];
      try {
        const contractRes = await req.get(`/public/orders/${orderId}/contracts`);
        contracts = contractRes.data || [];
      } catch (err) {
        logger.warn('合同列表加载失败:', err);
      }

      // 9. 加载制单列表（如果订单已完成）
      let vouchers = [];
      if (orderData.orderStatus === 'completed' || orderData.orderStatus === 4) {
        try {
          const voucherRes = await req.get(`/public/orders/${orderId}/vouchers`);
          vouchers = voucherRes.data || [];
        } catch (err) {
          logger.warn('制单列表加载失败:', err);
        }
      }

      this.setData({
        orderData,
        loanInfo,
        borrowerInfo,
        coBorrowerInfo,
        guarantorInfo,
        bankCards,
        attachments,
        contracts,
        vouchers
      });

      logger.info('订单完整详情加载成功');
    } catch (err) {
      logger.error('加载订单详情失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 切换区块展开/收起
   */
  toggleSection(e) {
    const section = e.currentTarget.dataset.section;
    const key = `expandedSections.${section}`;
    this.setData({
      [key]: !this.data.expandedSections[section]
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = [];
    
    // 收集所有图片URL
    if (this.data.borrowerInfo) {
      if (this.data.borrowerInfo.idCardFront) urls.push(this.data.borrowerInfo.idCardFront);
      if (this.data.borrowerInfo.idCardBack) urls.push(this.data.borrowerInfo.idCardBack);
    }
    if (this.data.coBorrowerInfo) {
      if (this.data.coBorrowerInfo.idCardFront) urls.push(this.data.coBorrowerInfo.idCardFront);
      if (this.data.coBorrowerInfo.idCardBack) urls.push(this.data.coBorrowerInfo.idCardBack);
    }
    if (this.data.guarantorInfo) {
      if (this.data.guarantorInfo.idCardFront) urls.push(this.data.guarantorInfo.idCardFront);
      if (this.data.guarantorInfo.idCardBack) urls.push(this.data.guarantorInfo.idCardBack);
    }

    wx.previewImage({
      current: url,
      urls: urls.length > 0 ? urls : [url]
    });
  },

  /**
   * 预览附件
   */
  previewAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const attachment = this.data.attachments[index];
    
    if (!attachment || !attachment.path) {
      wx.showToast({
        title: '文件不存在',
        icon: 'none'
      });
      return;
    }

    // 判断文件类型
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = attachment.path.split('.').pop().toLowerCase();
    
    if (imageExtensions.includes(fileExtension)) {
      // 图片类型，使用预览图片
      const imageUrls = this.data.attachments
        .filter(item => {
          const ext = item.path.split('.').pop().toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(item => item.path);
      
      wx.previewImage({
        current: attachment.path,
        urls: imageUrls
      });
    } else {
      wx.showToast({
        title: '该文件类型不支持预览',
        icon: 'none'
      });
    }
  },

  /**
   * 预览合同
   */
  previewContract(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '加载中...' });
    
    const fullUrl = url.startsWith('http') ? url : (req.BASE_URL || '') + url;
    
    wx.downloadFile({
      url: fullUrl,
      success: (res) => {
        const filePath = res.tempFilePath;
        wx.openDocument({
          filePath,
          fileType: 'pdf',
          success: () => {
            wx.hideLoading();
          },
          fail: (err) => {
            wx.hideLoading();
            logger.error('打开文档失败:', err);
            wx.showToast({
              title: '预览失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        logger.error('下载合同失败:', err);
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  }
});


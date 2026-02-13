const logger = require('../../../utils/logger');
const req = wx.$request;

// 银行配置（包含 logo 路径和品牌色）- 完全复用 step5 的配置
const bankConfig = {
  '中国工商银行': { logo: '/static/bank/gongshang.png', color: '#C8161D' },
  '工商银行': { logo: '/static/bank/gongshang.png', color: '#C8161D' },
  '中国建设银行': { logo: '/static/bank/jianshe.png', color: '#0066B3' },
  '建设银行': { logo: '/static/bank/jianshe.png', color: '#0066B3' },
  '中国农业银行': { logo: '/static/bank/nongye.png', color: '#00843D' },
  '农业银行': { logo: '/static/bank/nongye.png', color: '#00843D' },
  '中国银行': { logo: '/static/bank/zhongguo.png', color: '#B20838' },
  '交通银行': { logo: '/static/bank/jiaotong.png', color: '#0066B3' },
  '招商银行': { logo: '/static/bank/zhaoshang.png', color: '#E4002B' },
  '浦发银行': { logo: '/static/bank/pufa.png', color: '#003399' },
  '浦东发展银行': { logo: '/static/bank/pufa.png', color: '#003399' },
  '中信银行': { logo: '/static/bank/zhongxin.png', color: '#E4002B' },
  '光大银行': { logo: '/static/bank/guangda.png', color: '#6F2C91' },
  '华夏银行': { logo: '/static/bank/huaxia.png', color: '#E4002B' },
  '民生银行': { logo: '/static/bank/minsheng.png', color: '#006EB6' },
  '广发银行': { logo: '/static/bank/guangfa.png', color: '#E4002B' },
  '广东发展银行': { logo: '/static/bank/guangfa.png', color: '#E4002B' },
  '平安银行': { logo: '/static/bank/pingan.png', color: '#FF6600' },
  '兴业银行': { logo: '/static/bank/xingye.png', color: '#003399' },
  '邮储银行': { logo: '/static/bank/youchu.png', color: '#00843D' },
  '邮政储蓄银行': { logo: '/static/bank/youchu.png', color: '#00843D' },
  '宁波银行': { logo: '/static/bank/ningbo.png', color: '#F39800' },
  '江苏银行': { logo: '/static/bank/jiangsu.png', color: '#E4002B' },
  '南京银行': { logo: '/static/bank/nanjing.png', color: '#E4002B' },
  '上海银行': { logo: '/static/bank/shanghai.png', color: '#0066B3' },
  '盛京银行': { logo: '/static/bank/shengjing.png', color: '#E4002B' },
  '汇丰银行': { logo: '/static/bank/huifeng.png', color: '#DB0011' },
  '网商银行': { logo: '/static/bank/wangshang.png', color: '#FF6600' }
};

// 获取银行配置（logo 和颜色）- 完全复用 step5 的逻辑
function getBankConfig(bankName) {
  if (!bankName) {
    return { logo: '/static/bank/none.png', color: '#4A90E2' };
  }
  
  // 精确匹配
  if (bankConfig[bankName]) {
    return bankConfig[bankName];
  }
  
  // 模糊匹配（支持部分匹配）
  for (const key in bankConfig) {
    // 移除"中国"、"银行"等通用词后匹配
    const simplifiedKey = key.replace(/中国|银行/g, '');
    const simplifiedName = bankName.replace(/中国|银行/g, '');
    if (simplifiedName.includes(simplifiedKey) || simplifiedKey.includes(simplifiedName)) {
      return bankConfig[key];
    }
  }
  
  // 默认返回通用银行图标
  return { logo: '/static/bank/none.png', color: '#4A90E2' };
}

Page({
  data: {
    orderId: null,
    detail: {},
    expandedSections: {
      summary: true,        // 订单信息 - 默认展开
      loanInfo: true,       // 借款信息 - 默认展开
      borrowerInfo: false,  // 借款人信息 - 默认收起
      coBorrowerInfo: false,// 共借人信息 - 默认收起
      guarantorInfo: false, // 担保人信息 - 默认收起
      bankCards: false,     // 银行卡信息 - 默认收起
      attachments: false,   // 附件材料 - 默认收起
      contracts: false,     // 合同 - 默认收起
      vouchers: false       // 制单列表 - 默认收起
    }
  },

  onLoad(options) {
    const orderId = options.id;
    this.setData({ orderId });
    this.loadOrderDetail(orderId);
  },

  /**
   * 加载订单详情（使用订单详情接口）
   */
  loadOrderDetail(orderId) {
    wx.showLoading({ title: '加载中...', mask: true });

    req.request({
      url: `/public/orders/${orderId}`,
      method: 'GET'
    }).then(res => {
      const detail = res.data || {};
      
      this.setData({ detail });
      
      // 加载银行卡列表（完全复用 step5 的逻辑）
      this.loadBankCards(orderId);
      
      // 如果有合同，加载合同列表
      if (detail.orderStatus && detail.orderStatus !== 0) {
        this.loadContracts(orderId);
      }
      
      // 如果是待放款状态，加载制单列表
      if (detail.orderStatus === 4) {
        this.loadVouchers(orderId);
      }
      
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
   * 加载银行卡列表（完全复用 step5 的逻辑）
   */
  loadBankCards(orderId) {
    logger.info('[银行卡] 从后端加载银行卡数据', { orderId });
    
    req.get(`/public/orders/${orderId}/bankCards`).then(res => {
      const bankCards = res.data || [];
      logger.info('[银行卡] 后端返回银行卡数据', { count: bankCards.length, bankCards });
      
      // 转换数据格式，匹配前端需要的字段名，并添加 logo 和颜色
      const formattedCards = bankCards.map(card => {
        const config = getBankConfig(card.bankName);
        return {
          id: card.id,
          holderType: card.holderType,
          cardholderName: card.accountName || '',
          idType: card.idType || '身份证',
          idNumber: card.idNo || '',
          bankName: card.bankName || '',
          cardNumber: card.cardNo || '',
          reservedMobile: card.reservedMobile || '',
          cardFrontImage: card.cardFrontUrl || '',
          bankLogo: config.logo,
          bankColor: config.color
        };
      });
      
      this.setData({
        'detail.bankCards': formattedCards
      });
    }).catch(err => {
      logger.error('[银行卡] 加载银行卡数据失败', { err });
    });
  },

  /**
   * 加载合同列表
   */
  loadContracts(orderId) {
    req.request({
      url: `/public/orders/${orderId}/contracts`,
      method: 'GET'
    }).then(res => {
      this.setData({
        'detail.contracts': res.data || []
      });
    }).catch(err => {
      logger.warn('加载合同列表失败:', err);
    });
  },

  /**
   * 加载制单列表
   */
  loadVouchers(orderId) {
    req.request({
      url: `/public/orders/${orderId}/vouchers`,
      method: 'GET'
    }).then(res => {
      this.setData({
        'detail.vouchers': res.data || []
      });
    }).catch(err => {
      logger.warn('加载制单列表失败:', err);
    });
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
   * 复制订单编号
   */
  copyOrderNo() {
    const orderNo = this.data.detail.orderNo;
    if (!orderNo) {
      wx.showToast({
        title: '订单编号为空',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 查看进度
   */
  viewProgress() {
    const orderId = this.data.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单ID为空',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到进度页面（根据实际路径调整）
    wx.navigateTo({
      url: `/pages/order/progress/index?orderId=${orderId}`
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = [];
    
    // 收集所有图片URL
    const detail = this.data.detail;
    if (detail.borrowerInfo) {
      if (detail.borrowerInfo.faceFrontUrl) urls.push(detail.borrowerInfo.faceFrontUrl);
      if (detail.borrowerInfo.faceBackUrl) urls.push(detail.borrowerInfo.faceBackUrl);
    }
    if (detail.coBorrowerInfo) {
      if (detail.coBorrowerInfo.faceFrontUrl) urls.push(detail.coBorrowerInfo.faceFrontUrl);
      if (detail.coBorrowerInfo.faceBackUrl) urls.push(detail.coBorrowerInfo.faceBackUrl);
    }
    if (detail.guarantorInfo) {
      if (detail.guarantorInfo.faceFrontUrl) urls.push(detail.guarantorInfo.faceFrontUrl);
      if (detail.guarantorInfo.faceBackUrl) urls.push(detail.guarantorInfo.faceBackUrl);
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
    const attachment = this.data.detail.attachments[index];
    
    // 后端返回的字段是 url，不是 path
    const fileUrl = attachment?.url || attachment?.path;
    
    if (!attachment || !fileUrl) {
      wx.showToast({
        title: '文件不存在',
        icon: 'none'
      });
      return;
    }

    logger.info('[附件预览]', { attachment, fileUrl });

    // 判断文件类型
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    if (imageExtensions.includes(fileExtension)) {
      // 图片类型，使用预览图片
      const imageUrls = this.data.detail.attachments
        .filter(item => {
          const url = item.url || item.path;
          if (!url) return false;
          const ext = url.split('.').pop().toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(item => item.url || item.path);
      
      wx.previewImage({
        current: fileUrl,
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


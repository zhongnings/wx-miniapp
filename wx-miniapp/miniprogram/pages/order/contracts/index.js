const logger = require('../../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    id: null,
    contracts: [],
    showQRCodeModal: false,
    qrCodeUrl: ''
  },

  onLoad(query) {
    this.setData({ id: query.id });
    this.loadContracts();
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 加载合同列表
   */
  loadContracts() {
    wx.showLoading({ title: '加载中...' });
    req.request({
      url: `/public/orders/${this.data.id}/contracts`,
      method: 'GET'
    }).then(res => {
      this.setData({ contracts: res.data || [] });
      logger.info('合同列表加载成功:', res.data);
    }).catch(err => {
      logger.error('加载合同列表失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  /**
   * 预览合同
   */
  onPreview(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '加载中...' });
    
    // 如果是相对路径，需要拼接完整URL
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
            logger.info('合同预览成功');
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
  },

  /**
   * 催签
   */
  onUrgeSign(e) {
    const contractId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认催签',
      content: '确定要向签署人发送催签提醒吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送中...' });
          // TODO: 调用后端催签接口
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '催签提醒已发送',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  /**
   * 显示签署二维码
   */
  onShowQRCode(e) {
    const contractId = e.currentTarget.dataset.id;
    const qrCodeUrl = e.currentTarget.dataset.url;
    
    if (!qrCodeUrl) {
      wx.showToast({
        title: '二维码生成失败',
        icon: 'none'
      });
      return;
    }
    
    // 调用后端接口获取二维码
    wx.showLoading({ title: '生成中...' });
    req.request({
      url: qrCodeUrl,
      method: 'GET'
    }).then(res => {
      wx.hideLoading();
      const qrCodeImageUrl = res.data?.qrCodeUrl || qrCodeUrl;
      // 如果是相对路径，需要拼接完整URL
      const fullUrl = qrCodeImageUrl.startsWith('http') ? qrCodeImageUrl : (req.BASE_URL || '') + qrCodeImageUrl;
      
      this.setData({
        showQRCodeModal: true,
        qrCodeUrl: fullUrl
      });
    }).catch(err => {
      wx.hideLoading();
      logger.error('获取二维码失败:', err);
      wx.showToast({
        title: '获取二维码失败',
        icon: 'none'
      });
    });
  },

  /**
   * 关闭二维码弹窗
   */
  closeQRCodeModal() {
    this.setData({
      showQRCodeModal: false,
      qrCodeUrl: ''
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 保存二维码到相册
   */
  saveQRCode() {
    const that = this;
    wx.downloadFile({
      url: that.data.qrCodeUrl,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: () => {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  }
});


const logger = require('../../utils/logger');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

Page({
  data: {
    loading: false,
    username: '',
    password: '',
    confirmPassword: ''
  },

  onLoad() {
    logger.info('注册页面加载');
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.redirectTo({ url: '/pages/login/index' });
      }
    });
  },

  onSubmit(e) {
    const { username: rawUsername, password: rawPassword, confirmPassword: rawConfirm } = e.detail.value;
    const username = (rawUsername || '').trim();
    const password = rawPassword || '';
    const confirmPassword = rawConfirm || '';

    if (!username || !password || !confirmPassword) {
      wx.showToast({
        title: '请完整填写信息',
        icon: 'none'
      });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    req.request({
      url: '/auth/register',
      method: 'POST',
      data: { username, password, confirmPassword }
    }).then(() => {
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/index'
        });
      }, 1500);
    }).catch(err => {
      logger.error('注册失败:', err);
      wx.showToast({
        title: err.message || '注册失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
});



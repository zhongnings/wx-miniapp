const logger = require('../../utils/logger');
const config = require('../../config/config');
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;
// 说明：密码加密统一移到后端（BCrypt），前端只负责传明文（依赖 HTTPS 保证传输安全）

Page({
  data: {
    publicKey: '',
    loading: false,
    showPassword: false,
    agreeTerms: false,
    loginType: 'account', // 登录类型：account-账号登录
    username: '',
    password: '',

    // 协议文档在后端 static 目录下的访问路径（请根据实际文件名调整）
    userAgreementUrl: '/agreements/user-agreement.docx',
    privacyPolicyUrl: '/agreements/privacy-policy.docx'
  },

  onLoad() {
    logger.info('登录页面加载');
    // 启动时拉取后端公钥（如果需要）
    // 注意：RSA 工具会自动加载公钥，这里可以省略
    // this.checkBackendConnection();
    
    // 获取系统信息，设置导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0,
      navBarHeight: (systemInfo.statusBarHeight || 0) + 44
    });

    // 读取上次登录的用户名密码
    const lastLogin = wx.getStorageSync('LOGIN_LAST_CREDENTIAL') || {};
    this.setData({
      username: lastLogin.username || '',
      password: lastLogin.password || ''
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({ url: '/pages/home/index' });
    }
  },

  /**
   * 检查后端连接
   */
  checkBackendConnection() {
    logger.debug('检查后端连接...');
    req.request({
      url: '/auth/public-key',
      method: 'GET'
    }).then(res => {
      logger.info('后端连接正常，公钥已获取');
      this.setData({ publicKey: res.data });
    }).catch(err => {
      logger.error('后端连接失败:', err);
      wx.showToast({
        title: '无法连接服务器',
        icon: 'none',
        duration: 2000
      });
    });
  },

  /**
   * 切换密码显示/隐藏
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    });
    logger.debug('密码显示状态:', this.data.showPassword ? '显示' : '隐藏');
  },

  /**
   * 切换登录类型
   */
  switchLoginType() {
    // 目前只有账号登录，后续可以扩展其他登录方式
    this.setData({
      loginType: 'account'
    });
  },

  /**
   * 用户协议复选框变化
   */
  onAgreeChange(e) {
    const checked = e.detail.value.includes('agree');
    this.setData({
      agreeTerms: checked
    });
  },

  /**
   * 忘记密码
   */
  onForgotPassword() {
    wx.showToast({
      title: '忘记密码功能待实现',
      icon: 'none'
    });
  },

  /**
   * 跳转到注册页面
   */
  goRegister() {
    wx.navigateTo({
      url: '/pages/register/index'
    });
  },

  /**
   * 预览协议通用方法
   */
  previewDocument(fileUrl, title) {
    if (!fileUrl) {
      wx.showToast({
        title: '协议文件地址未配置',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '加载中...', mask: true });

    // 组装完整 URL：支持相对路径或完整 http(s) 地址，BASE_URL 统一从 config 读取
    const baseUrl = config.getApiBaseUrl();
    const isAbsolute = /^https?:\/\//i.test(fileUrl);
    const fullUrl = isAbsolute ? fileUrl : `${baseUrl}${fileUrl}`;

    wx.downloadFile({
      url: fullUrl,
      success: (res) => {
        const filePath = res.tempFilePath;
        wx.openDocument({
          filePath,
          fileType: 'docx',
          showMenu: true,
          success: () => {
            wx.hideLoading();
          },
          fail: (err) => {
            logger.error(`${title} 打开失败:`, err);
            wx.hideLoading();
            wx.showToast({
              title: '打开文档失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        logger.error(`${title} 下载失败:`, err);
        wx.hideLoading();
        wx.showToast({
          title: '下载文档失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 用户协议
   */
  onUserAgreement() {
    this.previewDocument(this.data.userAgreementUrl, '用户协议');
  },

  /**
   * 隐私协议
   */
  onPrivacyPolicy() {
    this.previewDocument(this.data.privacyPolicyUrl, '隐私协议');
  },

  onSubmit(e) {
    const { username: rawUsername, password: rawPassword } = e.detail.value;
    const username = (rawUsername || '').trim();
    const password = rawPassword || '';
    
    logger.debug('登录提交:', { username, password: '***' }); // 不记录密码明文

    if (!username || !password) {
      logger.warn('用户名或密码为空');
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    if (!this.data.agreeTerms) {
      wx.showToast({
        title: '请同意用户协议和隐私协议',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 直接传明文密码，后端使用 BCrypt 校验（已开启 HTTPS）
    req.request({
      url: '/auth/login',
      method: 'POST',
      data: { username, password }
    }).then(res => {
      logger.info('登录成功:', res.data);
      
      const token = res.data.token || '';
      const userId = res.data.userId || '';
      const roles = res.data.roles || [];
      const permissions = res.data.permissions || [];
      const menus = res.data.menus || [];

      if (token) {
        wx.setStorageSync('TOKEN', token);
        wx.setStorageSync('USER_ID', userId);
        wx.setStorageSync('ROLES', roles);
        wx.setStorageSync('PERMISSIONS', permissions);
        wx.setStorageSync('MENUS', menus);
        logger.info('Token/用户信息已保存', { userId, roles });
      }

      // 保存本次登录用户名密码，便于下次自动填充（存明文仅用于输入回填）
      wx.setStorageSync('LOGIN_LAST_CREDENTIAL', { username, password });

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.redirectTo({ url: '/pages/order/list/index' });
      }, 1500);
    }).catch(err => {
      logger.error('登录失败:', err);
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
        duration: 2000
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
});



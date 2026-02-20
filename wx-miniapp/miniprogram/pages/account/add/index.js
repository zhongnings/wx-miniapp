// 使用统一的 logger 工具
const logger = require('../../../utils/logger.js');

// 引入银行卡工具
const bankCardUtil = require('../../../utils/bank-card-util.js');

Page({
  data: {
    // 表单数据
    formData: {
      assignee: '', // 受让方
      paymentChannel: '', // 支付渠道
      microloanOrg: '', // 小贷机构
      bankBranchNumber: '', // 开户行号
      boundBank: '', // 绑定银行
      accountNumber: '', // 绑定银行账号
      paymentPassword: '', // 支付密码
      confirmPassword: '' // 确认密码
    },
    // 选项数据（从后端字典加载）
    assigneeOrgOptions: [],
    paymentChannelOptions: [],
    microloanOrgOptions: [],
    // 银行选择器
    showBankPicker: false,
    bankList: [
      '中国工商银行', '中国建设银行', '中国农业银行', '中国银行',
      '交通银行', '招商银行', '浦发银行', '中信银行',
      '光大银行', '华夏银行', '民生银行', '广发银行',
      '平安银行', '兴业银行', '邮储银行', '其他银行'
    ],
    // 选择器相关数据
    showPicker: false,
    pickerType: '', // 当前选择器类型
    pickerOptions: [], // 当前选择器选项
    pickerTitle: '', // 选择器标题
    pickerCurrentValue: '', // 当前选中的值
    // 编辑模式
    isEditMode: false,
    accountId: null
  },

  onLoad(options) {
    logger.info('资金账户新增/编辑页面加载', options);
    
    // 判断是否为编辑模式
    if (options.id) {
      this.setData({
        isEditMode: true,
        accountId: options.id
      });
      wx.setNavigationBarTitle({
        title: '编辑账户'
      });
      // 加载账户数据
      this.loadAccountData(options.id);
    }
    
    // 加载下拉选项数据
    this.loadDropdownOptions();
  },

  /**
   * 加载账户数据（编辑模式）
   */
  loadAccountData(accountId) {
    wx.showLoading({ title: '加载中...', mask: true });
    
    const req = wx.$request;
    req.get(`/public/accounts/${accountId}`).then(res => {
      wx.hideLoading();
      
      // 处理不同的响应格式
      let account = null;
      if (res.data && res.data.data) {
        // 格式1: {data: {data: {...}}}
        account = res.data.data;
      } else if (res.data) {
        // 格式2: {data: {...}}
        account = res.data;
      } else {
        // 格式3: {...}
        account = res;
      }
      
      logger.info('账户数据加载成功', account);
      
      if (!account || !account.id) {
        wx.showToast({
          title: '账户数据为空',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        'formData.assignee': account.assignee || '',
        'formData.paymentChannel': account.paymentChannel || '',
        'formData.microloanOrg': account.microloanOrg || '',
        'formData.bankBranchNumber': account.bankBranchNumber || '',
        'formData.boundBank': account.boundBank || '',
        'formData.accountNumber': account.accountNumber || '',
        'formData.paymentPassword': '', // 编辑模式下密码留空，不显示原密码
        'formData.confirmPassword': ''
      });
      
      logger.info('表单数据已更新', this.data.formData);
    }).catch(err => {
      wx.hideLoading();
      logger.error('加载账户数据失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  /**
   * 加载下拉选项数据（从后端字典接口获取）
   */
  loadDropdownOptions() {
    logger.info('[字典] 开始加载下拉选项数据');
    
    // 使用字典管理器加载数据
    const dictManager = require('../../../utils/dict-manager.js');
    
    // 优先使用全局缓存的字典数据
    const app = getApp();
    const cachedDict = app.globalData.dictData || {};
    
    logger.info('[字典] 全局缓存数据:', cachedDict);
    
    // 检查缓存中是否有我们需要的数据
    const hasValidCache = cachedDict.assignee_org && cachedDict.assignee_org.length > 0;
    
    // 如果缓存中已有有效数据，直接使用
    if (hasValidCache) {
      logger.info('[字典] 使用全局缓存的字典数据');
      this.applyDictData(cachedDict);
      return;
    }
    
    logger.info('[字典] 缓存无效，从后端或本地加载');
    
    // 如果缓存中没有数据，从后端加载
    dictManager.loadDictFromServer([
      'assignee_org',
      'payment_channel',
      'microloan_org'
    ]).then(dictData => {
      logger.info('[字典] 字典数据加载完成', dictData);
      // 应用到当前页面
      this.applyDictData(dictData);
    }).catch(err => {
      logger.error('[字典] 加载失败，使用本地默认值:', err);
      // 使用本地默认值
      const localDict = dictManager.batchGetDictOptions([
        'assignee_org',
        'payment_channel',
        'microloan_org'
      ]);
      
      logger.info('[字典] 本地默认值:', localDict);
      
      // 转换为后端格式
      const formattedDict = {};
      Object.keys(localDict).forEach(key => {
        formattedDict[key] = localDict[key].map((value, index) => ({
          itemValue: value,
          sortOrder: index,
          isDefault: index === 0
        }));
      });
      
      logger.info('[字典] 格式化后的数据:', formattedDict);
      this.applyDictData(formattedDict);
    });
  },
  
  /**
   * 应用字典数据到页面
   */
  applyDictData(dictData) {
    const updates = {};
    const isEditMode = this.data.isEditMode;
    
    // 受让方
    if (dictData.assignee_org && dictData.assignee_org.length > 0) {
      updates.assigneeOrgOptions = dictData.assignee_org.map(item => item.itemValue);
      // 只在新增模式且当前没有选中值时，默认选中第一个
      if (!isEditMode && !this.data.formData.assignee) {
        updates['formData.assignee'] = dictData.assignee_org[0].itemValue;
      }
    }
    
    // 支付渠道
    if (dictData.payment_channel && dictData.payment_channel.length > 0) {
      updates.paymentChannelOptions = dictData.payment_channel.map(item => item.itemValue);
      if (!isEditMode && !this.data.formData.paymentChannel) {
        updates['formData.paymentChannel'] = dictData.payment_channel[0].itemValue;
      }
    }
    
    // 小贷机构
    if (dictData.microloan_org && dictData.microloan_org.length > 0) {
      updates.microloanOrgOptions = dictData.microloan_org.map(item => item.itemValue);
      if (!isEditMode && !this.data.formData.microloanOrg) {
        updates['formData.microloanOrg'] = dictData.microloan_org[0].itemValue;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      this.setData(updates);
      logger.info('[字典] 应用字典数据完成，更新字段数量:', Object.keys(updates).length);
    }
  },

  /**
   * 显示选择器
   */
  showPicker(type) {
    let options = [];
    let title = '';
    let currentValue = '';
    
    switch(type) {
      case 'assignee':
        options = this.data.assigneeOrgOptions;
        title = '选择受让方';
        currentValue = this.data.formData.assignee;
        break;
      case 'paymentChannel':
        options = this.data.paymentChannelOptions;
        title = '选择支付渠道';
        currentValue = this.data.formData.paymentChannel;
        break;
      case 'microloanOrg':
        options = this.data.microloanOrgOptions;
        title = '选择小贷机构';
        currentValue = this.data.formData.microloanOrg;
        break;
      default:
        return;
    }
    
    this.setData({
      showPicker: true,
      pickerType: type,
      pickerOptions: options,
      pickerTitle: title,
      pickerCurrentValue: currentValue
    });
  },

  /**
   * 隐藏选择器
   */
  hidePicker() {
    this.setData({
      showPicker: false,
      pickerType: '',
      pickerOptions: [],
      pickerTitle: '',
      pickerCurrentValue: ''
    });
  },

  /**
   * 选择器选项点击
   */
  onPickerItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const value = this.data.pickerOptions[index];
    const type = this.data.pickerType;
    
    const updateData = {};
    updateData[`formData.${type}`] = value;
    this.setData(updateData);
    
    this.hidePicker();
  },

  /**
   * 选择受让方
   */
  selectAssignee() {
    this.showPicker('assignee');
  },

  /**
   * 选择支付渠道
   */
  selectPaymentChannel() {
    this.showPicker('paymentChannel');
  },

  /**
   * 选择小贷机构
   */
  selectMicroloanOrg() {
    this.showPicker('microloanOrg');
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 阻止滚动穿透
   */
  stopScroll() {
    return false;
  },

  /**
   * 开户行号输入
   */
  onBankCodeInput(e) {
    this.setData({
      'formData.bankBranchNumber': e.detail.value
    });
  },

  /**
   * 显示银行选择器
   */
  showBankPickerDialog() {
    this.setData({
      showBankPicker: true
    });
  },

  /**
   * 银行选择器确认
   */
  onBankPickerConfirm(e) {
    const bankName = e.detail.value;
    if (bankName) {
      this.setData({
        'formData.boundBank': bankName,
        showBankPicker: false
      });
      logger.info('选择银行:', bankName);
    }
  },

  /**
   * 银行选择器取消
   */
  onBankPickerCancel() {
    this.setData({
      showBankPicker: false
    });
  },

  /**
   * 银行账号输入
   */
  onBankAccountInput(e) {
    let value = e.detail.value.replace(/\s/g, ''); // 移除空格
    
    // 每4位添加一个空格
    const formattedValue = bankCardUtil.formatCardNumber(value);
    
    // 当输入达到6位时，尝试识别银行
    if (value.length >= 6 && !this.data.formData.boundBank) {
      const bankName = bankCardUtil.identifyBank(value);
      if (bankName) {
        logger.info('自动识别银行:', { accountNumber: value.substring(0, 6) + '****', bankName });
        this.setData({
          'formData.boundBank': bankName
        });
        
        // 显示提示
        wx.showToast({
          title: `已识别：${bankName}`,
          icon: 'success',
          duration: 1500
        });
      }
    }
    
    this.setData({
      'formData.accountNumber': formattedValue
    });
  },

  /**
   * 支付密码输入
   */
  onPaymentPasswordInput(e) {
    this.setData({
      'formData.paymentPassword': e.detail.value
    });
  },

  /**
   * 确认密码输入
   */
  onConfirmPasswordInput(e) {
    this.setData({
      'formData.confirmPassword': e.detail.value
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const isEditMode = this.data.isEditMode;
    
    if (!formData.assignee) {
      wx.showToast({
        title: '请选择受让方',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.paymentChannel) {
      wx.showToast({
        title: '请选择支付渠道',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.microloanOrg) {
      wx.showToast({
        title: '请选择小贷机构',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.bankBranchNumber || formData.bankBranchNumber.trim() === '') {
      wx.showToast({
        title: '请填写开户行号',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.boundBank) {
      wx.showToast({
        title: '请选择绑定银行',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.accountNumber || formData.accountNumber.trim() === '') {
      wx.showToast({
        title: '请填写绑定银行账号',
        icon: 'none'
      });
      return false;
    }
    
    // 验证银行账号格式（移除空格后至少16位）
    const accountNumber = formData.accountNumber.replace(/\s/g, '');
    if (accountNumber.length < 16 || accountNumber.length > 19) {
      wx.showToast({
        title: '银行账号格式不正确',
        icon: 'none'
      });
      return false;
    }

    // 密码验证：新增模式必填，编辑模式可选
    const hasPassword = formData.paymentPassword && formData.paymentPassword.trim() !== '';
    
    if (!isEditMode && !hasPassword) {
      // 新增模式下密码必填
      wx.showToast({
        title: '请输入支付密码',
        icon: 'none'
      });
      return false;
    }

    // 如果填写了密码，则进行密码验证
    if (hasPassword) {
      // 验证密码长度（6-20位）
      if (formData.paymentPassword.length < 6 || formData.paymentPassword.length > 20) {
        wx.showToast({
          title: '支付密码长度为6-20位',
          icon: 'none'
        });
        return false;
      }

      // 验证确认密码
      if (!formData.confirmPassword || formData.confirmPassword.trim() === '') {
        wx.showToast({
          title: '请输入确认密码',
          icon: 'none'
        });
        return false;
      }

      // 验证两次密码是否一致
      if (formData.paymentPassword !== formData.confirmPassword) {
        wx.showToast({
          title: '两次密码输入不一致',
          icon: 'none'
        });
        return false;
      }
    }
    
    return true;
  },

  /**
   * 提交保存
   */
  submit() {
    if (!this.validateForm()) {
      return;
    }

    const formData = { ...this.data.formData };
    // 移除银行账号中的空格
    formData.accountNumber = formData.accountNumber.replace(/\s/g, '');
    // 移除确认密码字段（不需要提交到后端）
    delete formData.confirmPassword;

    wx.showLoading({ title: '提交中...', mask: true });

    const req = wx.$request;
    const isEditMode = this.data.isEditMode;
    const url = isEditMode ? `/public/accounts/${this.data.accountId}` : '/public/accounts';
    const method = isEditMode ? 'PUT' : 'POST';

    req.request({
      url: url,
      method: method,
      data: formData
    }).then(res => {
      wx.hideLoading();
      logger.info(`资金账户${isEditMode ? '更新' : '创建'}成功`, res);
      
      wx.showToast({
        title: `${isEditMode ? '更新' : '创建'}成功`,
        icon: 'success',
        duration: 1500
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      logger.error(`资金账户${isEditMode ? '更新' : '创建'}失败`, err);
      
      let errorMsg = `${isEditMode ? '更新' : '创建'}失败`;
      if (err && err.errMsg) {
        errorMsg = err.errMsg;
      } else if (err && err.message) {
        errorMsg = err.message;
      } else if (err && typeof err === 'string') {
        errorMsg = err;
      } else if (err && err.data && err.data.message) {
        errorMsg = err.data.message;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      });
    });
  }
});


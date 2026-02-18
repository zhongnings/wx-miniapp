// 使用统一的 logger 工具
const logger = require('../../../../utils/logger.js');

// 预留：后续如果后端提供选项字典接口，可以在这里统一替换为接口请求
// 当前仍使用静态默认选项，确保页面可用
// 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
const req = wx.$request;

// 引入导航工具
const navigation = require('../../../../utils/navigation.js');

Page({
  data: {
    currentStep: 0, // 当前步骤（0-5，step1对应索引0）
    tabsScrollLeft: 0, // 导航栏滚动位置
    formData: {
      assigneeOrg: '',
      channelOrg: '',
      payMethod: '',
      productType: '',
      borrowerCategory: '',
      contractSignMode: '在线签署',
      loanAmount: '',
      loanAmountUppercase: '',
      loanDays: '',
      startDate: '',
      endDate: '',
      annualRate: '',
      signPlace: '',
      usageDesc: '',
      repayMode: '',
      disputeWay: '',
      arbitrationOrg: '',
      isNotarization: '',
      penaltyRatio: '',
      notarizationType: '',
      notarizationItem: '',
      appointmentTime: '',
      certificateReceiveMethod: ''
    },
    // 地区选择器相关数据（使用公共组件）
    showRegionPicker: false,
    // 选择器相关数据
    showPicker: false,
    pickerType: '', // 当前选择器类型
    pickerOptions: [], // 当前选择器选项
    pickerTitle: '', // 选择器标题
    pickerCurrentValue: '', // 当前选中的值
    // 选项数据（从后端字典加载）
    assigneeOrgOptions: [],
    microloanOrgOptions: [],
    paymentChannelOptions: [],
    productTypeOptions: [],
    loanPurposeOptions: [],
    repaymentMethodOptions: [],
    disputeResolutionOptions: [],
    arbitrationOrgOptions: [],
    notarizationTypeOptions: [],
    notarizationItemOptions: [],
    // 预约时间选择器数据
    appointmentTimeIndex: [0, 0, 0, 0, 0], // [年, 月, 日, 时, 分]
    appointmentTimeRange: [[], [], [], [], []], // 年月日时分的范围
    loanTypeOptions: [
      { label: '个人', value: '个人' },
      { label: '对公', value: '对公' }
    ],
    // 预留：是否只读（从订单详情进入查看模式时为 true，或订单状态为0/2时为true）
    readonly: false,
    // 预留：当前订单ID（从订单详情进入时传入）
    orderId: null,
    // 订单状态（0-待提交，2-风控驳回时为只读）
    orderStatus: null,
    // 是否从订单详情页进入（用于判断导航栏tab是否可点击）
    fromOrderDetail: false
  },

  onLoad(options) {
    try {
      logger.info('订单创建步骤1：借款信息页面加载', options);
      
      // 使用导航工具初始化订单上下文
      // step1 不主动设置全局上下文，只在保存成功后设置
      const context = navigation.initOrderContextFromOptions(options, false);
      const readonly = navigation.calculateReadonly(context.mode, context.orderStatus);
      
      this.setData({
        readonly: readonly,
        fromOrderDetail: context.fromOrderDetail,
        orderId: context.orderId,
        orderStatus: context.orderStatus
      });
      
      // 计算并设置导航栏滚动位置
      this.calculateTabsScroll();
      
      // 加载下拉选项数据（从后端字典接口获取）
      this.loadDropdownOptions();
      
      // 确保数据初始化
      if (!this.data.formData) {
        this.setData({
          formData: {
            assigneeOrg: '',
            microloanOrg: '',
            paymentChannel: '',
            productType: '',
            borrowerType: '',
            signMethod: '在线签署',
            loanAmount: '',
            loanAmountUppercase: '',
            loanDays: '',
            startDate: '',
            endDate: '',
            annualRate: '',
            signPlace: '',
            loanPurpose: '',
            repaymentMethod: '',
            disputeResolution: '',
            arbitrationOrg: '',
            isNotarization: '',
            penaltyRatio: '',
            notarizationType: '',
            notarizationItem: '',
            appointmentTime: '',
            certificateReceiveMethod: ''
          }
        });
      }

      // 新建模式下，为下拉框和单选框设置默认选中第一个选项
      // 如果传递了 orderId，说明是从其他 step 页面跳转过来的，不设置默认值
      if (context.mode !== 'view' && !context.orderId) {
        const updates = {};
        const formData = this.data.formData || {};

        // 下拉框：默认选中第一个选项
        if (!formData.assigneeOrg && this.data.assigneeOrgOptions?.length > 0) {
          updates['formData.assigneeOrg'] = this.data.assigneeOrgOptions[0];
        }
        if (!formData.channelOrg && this.data.microloanOrgOptions?.length > 0) {
          updates['formData.channelOrg'] = this.data.microloanOrgOptions[0];
        }
        if (!formData.payMethod && this.data.paymentChannelOptions?.length > 0) {
          updates['formData.payMethod'] = this.data.paymentChannelOptions[0];
        }
        if (!formData.productType && this.data.productTypeOptions?.length > 0) {
          updates['formData.productType'] = this.data.productTypeOptions[0];
        }
        if (!formData.usageDesc && this.data.loanPurposeOptions?.length > 0) {
          updates['formData.usageDesc'] = this.data.loanPurposeOptions[0];
        }
        if (!formData.repayMode && this.data.repaymentMethodOptions?.length > 0) {
          updates['formData.repayMode'] = this.data.repaymentMethodOptions[0];
        }
        if (!formData.disputeWay && this.data.disputeResolutionOptions?.length > 0) {
          updates['formData.disputeWay'] = this.data.disputeResolutionOptions[0];
        }
        if (!formData.arbitrationOrg && this.data.arbitrationOrgOptions?.length > 0) {
          updates['formData.arbitrationOrg'] = this.data.arbitrationOrgOptions[0];
        }
        if (!formData.notarizationType && this.data.notarizationTypeOptions?.length > 0) {
          updates['formData.notarizationType'] = this.data.notarizationTypeOptions[0];
        }
        if (!formData.notarizationItem && this.data.notarizationItemOptions?.length > 0) {
          updates['formData.notarizationItem'] = this.data.notarizationItemOptions[0];
        }

        // 单选框：默认选中第一个
        if (!formData.borrowerCategory && this.data.loanTypeOptions?.length > 0) {
          updates['formData.borrowerCategory'] = this.data.loanTypeOptions[0].value;
        }
        if (!formData.isNotarization) {
          // “是否办理赋强公证”第一个选项是“是”
          updates['formData.isNotarization'] = '是';
        }
        if (!formData.certificateReceiveMethod) {
          // “证书接收方式”第一个选项是“电子版”
          updates['formData.certificateReceiveMethod'] = '电子版';
        }

        if (Object.keys(updates).length > 0) {
          this.setData(updates);
        }
      }

      // 初始化预约时间选择器
      this.initAppointmentTimePicker();

      // 如果从订单详情进入查看模式，则根据订单ID加载后端的借款信息并回显
      if (context.mode === 'view' && context.orderId) {
        this.loadLoanInfoFromOrder(context.orderId);
      }
    } catch (error) {
      logger.error('页面加载错误:', error);
      wx.showToast({
        title: '页面加载失败',
        icon: 'none'
      });
    }
  },

  onReady() {
    try {
      logger.info('订单创建步骤1：页面渲染完成');
    } catch (error) {
      logger.error('页面渲染错误:', error);
    }
  },

  onShow() {
    try {
      logger.info('订单创建步骤1：页面显示');
    } catch (error) {
      logger.error('页面显示错误:', error);
    }
  },

  /**
   * 加载下拉选项数据（从后端字典接口获取）
   */
  loadDropdownOptions() {
    logger.info('[字典] 开始加载下拉选项数据');
    
    // 使用字典管理器加载数据
    const dictManager = require('../../../../utils/dict-manager.js');
    
    // 优先使用全局缓存的字典数据
    const app = getApp();
    const cachedDict = app.globalData.dictData || {};
    
    logger.info('[字典] 全局缓存数据:', cachedDict);
    logger.info('[字典] 缓存数据键数量:', Object.keys(cachedDict).length);
    
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
      'microloan_org',
      'payment_channel',
      'product_type',
      'loan_purpose',
      'repayment_method',
      'dispute_resolution',
      'arbitration_org',
      'notarization_type',
      'notarization_item'
    ]).then(dictData => {
      logger.info('[字典] 字典数据加载完成', dictData);
      // 应用到当前页面
      this.applyDictData(dictData);
    }).catch(err => {
      logger.error('[字典] 加载失败，使用本地默认值:', err);
      // 使用本地默认值
      const localDict = dictManager.batchGetDictOptions([
        'assignee_org',
        'microloan_org',
        'payment_channel',
        'product_type',
        'loan_purpose',
        'repayment_method',
        'dispute_resolution',
        'arbitration_org',
        'notarization_type',
        'notarization_item'
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
    
    // 受让机构
    if (dictData.assignee_org && dictData.assignee_org.length > 0) {
      updates.assigneeOrgOptions = dictData.assignee_org.map(item => item.itemValue);
      // 如果当前没有选中值，默认选中第一个
      if (!this.data.formData.assigneeOrg) {
        updates['formData.assigneeOrg'] = dictData.assignee_org[0].itemValue;
      }
    }
    
    // 小贷机构
    if (dictData.microloan_org && dictData.microloan_org.length > 0) {
      updates.microloanOrgOptions = dictData.microloan_org.map(item => item.itemValue);
      if (!this.data.formData.channelOrg) {
        updates['formData.channelOrg'] = dictData.microloan_org[0].itemValue;
      }
    }
    
    // 支付渠道
    if (dictData.payment_channel && dictData.payment_channel.length > 0) {
      updates.paymentChannelOptions = dictData.payment_channel.map(item => item.itemValue);
      if (!this.data.formData.payMethod) {
        updates['formData.payMethod'] = dictData.payment_channel[0].itemValue;
      }
    }
    
    // 产品类型
    if (dictData.product_type && dictData.product_type.length > 0) {
      updates.productTypeOptions = dictData.product_type.map(item => item.itemValue);
      if (!this.data.formData.productType) {
        updates['formData.productType'] = dictData.product_type[0].itemValue;
      }
    }
    
    // 借款用途
    if (dictData.loan_purpose && dictData.loan_purpose.length > 0) {
      updates.loanPurposeOptions = dictData.loan_purpose.map(item => item.itemValue);
      if (!this.data.formData.usageDesc) {
        updates['formData.usageDesc'] = dictData.loan_purpose[0].itemValue;
      }
    }
    
    // 还款方式
    if (dictData.repayment_method && dictData.repayment_method.length > 0) {
      updates.repaymentMethodOptions = dictData.repayment_method.map(item => item.itemValue);
      if (!this.data.formData.repayMode) {
        updates['formData.repayMode'] = dictData.repayment_method[0].itemValue;
      }
    }
    
    // 解决争议方式
    if (dictData.dispute_resolution && dictData.dispute_resolution.length > 0) {
      updates.disputeResolutionOptions = dictData.dispute_resolution.map(item => item.itemValue);
      if (!this.data.formData.disputeWay) {
        updates['formData.disputeWay'] = dictData.dispute_resolution[0].itemValue;
      }
    }
    
    // 仲裁机构
    if (dictData.arbitration_org && dictData.arbitration_org.length > 0) {
      updates.arbitrationOrgOptions = dictData.arbitration_org.map(item => item.itemValue);
      if (!this.data.formData.arbitrationOrg) {
        updates['formData.arbitrationOrg'] = dictData.arbitration_org[0].itemValue;
      }
    }
    
    // 公证类型
    if (dictData.notarization_type && dictData.notarization_type.length > 0) {
      updates.notarizationTypeOptions = dictData.notarization_type.map(item => item.itemValue);
      if (!this.data.formData.notarizationType) {
        updates['formData.notarizationType'] = dictData.notarization_type[0].itemValue;
      }
    }
    
    // 公证事项
    if (dictData.notarization_item && dictData.notarization_item.length > 0) {
      updates.notarizationItemOptions = dictData.notarization_item.map(item => item.itemValue);
      if (!this.data.formData.notarizationItem) {
        updates['formData.notarizationItem'] = dictData.notarization_item[0].itemValue;
      }
    }
    
    // 单选框默认值
    if (!this.data.formData.borrowerCategory && this.data.loanTypeOptions?.length > 0) {
      updates['formData.borrowerCategory'] = this.data.loanTypeOptions[0].value;
    }
    if (!this.data.formData.contractSignMode) {
      updates['formData.contractSignMode'] = '在线签署';
    }
    if (!this.data.formData.isNotarization) {
      updates['formData.isNotarization'] = '是';
    }
    if (!this.data.formData.certificateReceiveMethod) {
      updates['formData.certificateReceiveMethod'] = '电子版';
    }
    
    if (Object.keys(updates).length > 0) {
      this.setData(updates);
      logger.info('[字典] 应用字典数据完成，更新字段数量:', Object.keys(updates).length);
    }
  },

  /**
   * 预留方法：从订单详情接口加载借款信息并回显到表单（只读模式）
   */
  loadLoanInfoFromOrder(orderId) {
    logger.info('========== 开始加载借款信息 ==========');
    logger.info('订单ID:', orderId);
    
    wx.showLoading({ title: '加载借款信息...' });
    req.request({
      url: `/public/orders/${orderId}/step1`,
      method: 'GET'
    }).then(res => {
      logger.info('接口返回原始数据:', res);
      logger.info('res.data:', res.data);
      
      // 后端返回格式：{ success: true, data: {...} }
      // 需要取 res.data.data 才是真正的借款信息
      const loanInfo = res.data.data || {};
      logger.info('解析后的 loanInfo:', loanInfo);

      // 将后端 LoanInfo 字段映射到本页面的 formData 字段
      const formData = {
        assigneeOrg: loanInfo.assigneeOrg || '',
        channelOrg: loanInfo.channelOrg || '',
        payMethod: loanInfo.payMethod || '',
        productType: loanInfo.productType || '',
        borrowerCategory: loanInfo.borrowerCategory || '',
        contractSignMode: loanInfo.contractSignMode || '在线签署',
        loanAmount: loanInfo.loanAmount != null ? String(loanInfo.loanAmount) : '',
        loanAmountUppercase: loanInfo.loanAmountUppercase || '',
        loanDays: loanInfo.loanDays != null ? String(loanInfo.loanDays) : '',
        startDate: loanInfo.startDate || '',
        endDate: loanInfo.endDate || '',
        annualRate: loanInfo.annualRate != null ? String(loanInfo.annualRate) : '',
        signPlace: loanInfo.signPlace || '',
        usageDesc: loanInfo.usageDesc || '',
        repayMode: loanInfo.repayMode || '',
        disputeWay: loanInfo.disputeWay || '',
        arbitrationOrg: loanInfo.arbitrationOrg || '',
        isNotarization: loanInfo.isNotarization || '',
        penaltyRatio: loanInfo.penaltyRatio != null ? String(loanInfo.penaltyRatio) : '',
        notarizationType: loanInfo.notarizationType || '',
        notarizationItem: loanInfo.notarizationItem || '',
        appointmentTime: loanInfo.appointmentTime || '',
        certificateReceiveMethod: loanInfo.certificateReceiveMethod || ''
      };

      logger.info('映射后的 formData:', formData);
      
      // 同时获取订单状态，判断是否需要设置为只读
      const orderStatus = loanInfo.orderStatus != null ? loanInfo.orderStatus : this.data.orderStatus;
      const isReadonlyByStatus = orderStatus === 0 || orderStatus === 2;
      
      this.setData({
        formData,
        orderStatus,
        readonly: this.data.readonly || isReadonlyByStatus
      });
      
      logger.info('订单详情借款信息加载并回显成功', { orderStatus, readonly: this.data.readonly });
      logger.info('========================================');
    }).catch(err => {
      logger.error('加载订单借款信息失败:', err);
      logger.error('错误详情:', JSON.stringify(err));
      wx.showToast({
        title: '借款信息加载失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  goBack() {
    wx.navigateBack();
  },

  // 上一步
  goPrev() {
    // 如果是从订单详情页进入，返回到订单详情页
    if (this.data.fromOrderDetail && this.data.orderId) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      wx.navigateBack();
    }
  },

  // 显示选择器
  showPicker(type) {
    if (this.data.readonly) {
      // 只读模式下不允许弹出选择器
      return;
    }
    let options = [];
    let title = '';
    let currentValue = '';
    
    switch(type) {
      case 'assigneeOrg':
        options = this.data.assigneeOrgOptions;
        title = '选择受让机构';
        currentValue = this.data.formData.assigneeOrg;
        break;
      case 'channelOrg':
        options = this.data.microloanOrgOptions;
        title = '选择小贷机构';
        currentValue = this.data.formData.channelOrg;
        break;
      case 'payMethod':
        options = this.data.paymentChannelOptions;
        title = '选择支付渠道';
        currentValue = this.data.formData.payMethod;
        break;
      case 'productType':
        options = this.data.productTypeOptions;
        title = '选择产品类型';
        currentValue = this.data.formData.productType;
        break;
      case 'usageDesc':
        options = this.data.loanPurposeOptions;
        title = '选择借款用途';
        currentValue = this.data.formData.usageDesc;
        break;
      case 'repayMode':
        options = this.data.repaymentMethodOptions;
        title = '选择还款方式';
        currentValue = this.data.formData.repayMode;
        break;
      case 'disputeWay':
        options = this.data.disputeResolutionOptions;
        title = '选择解决争议方式';
        currentValue = this.data.formData.disputeWay;
        break;
      case 'arbitrationOrg':
        options = this.data.arbitrationOrgOptions;
        title = '选择仲裁机构';
        currentValue = this.data.formData.arbitrationOrg;
        break;
      case 'notarizationType':
        options = this.data.notarizationTypeOptions;
        title = '选择公证类型';
        currentValue = this.data.formData.notarizationType;
        break;
      case 'notarizationItem':
        options = this.data.notarizationItemOptions;
        title = '选择公证事项';
        currentValue = this.data.formData.notarizationItem;
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

  // 隐藏选择器
  hidePicker() {
    this.setData({
      showPicker: false,
      pickerType: '',
      pickerOptions: [],
      pickerTitle: '',
      pickerCurrentValue: ''
    });
  },

  // 选择器选项点击
  onPickerItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const value = this.data.pickerOptions[index];
    const type = this.data.pickerType;
    
    const updateData = {};
    updateData[`formData.${type}`] = value;
    this.setData(updateData);
    
    this.hidePicker();
  },

  // 选择受让机构
  selectAssigneeOrg() {
    this.showPicker('assigneeOrg');
  },

  // 选择小贷机构
  selectMicroloanOrg() {
    this.showPicker('channelOrg');
  },

  // 选择支付渠道
  selectPaymentChannel() {
    this.showPicker('payMethod');
  },

  // 选择产品类型
  selectProductType() {
    this.showPicker('productType');
  },

  // 选择借款人类型
  selectBorrowerType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.borrowerCategory': type
    });
  },

  // 选择合同签署方式
  selectSignMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      'formData.contractSignMode': method
    });
  },

  // 借款金额输入
  onLoanAmountInput(e) {
    if (this.data.readonly) return;
    const amount = e.detail.value;
    this.setData({
      'formData.loanAmount': amount,
      'formData.loanAmountUppercase': this.convertToUppercase(amount)
    });
  },

  // 借款天数输入
  onLoanDaysInput(e) {
    if (this.data.readonly) return;
    const days = e.detail.value;
    this.setData({
      'formData.loanDays': days
    });
    // 自动计算结束日期
    this.calculateEndDate();
  },

  // 起始日期改变（在wxml中使用picker组件）
  onStartDateChange(e) {
    if (this.data.readonly) return;
    this.setData({
      'formData.startDate': e.detail.value
    });
    this.calculateEndDate();
  },

  // 计算结束日期
  calculateEndDate() {
    const startDate = this.data.formData.startDate;
    const days = parseInt(this.data.formData.loanDays) || 0;
    
    if (startDate && days > 0) {
      // 处理日期格式 YYYY-MM-DD
      const dateParts = startDate.split('-');
      const start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      start.setDate(start.getDate() + days);
      
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      const endDate = `${year}-${month}-${day}`;
      
      this.setData({
        'formData.endDate': endDate
      });
    } else {
      this.setData({
        'formData.endDate': ''
      });
    }
  },

  // 年利率输入
  onAnnualRateInput(e) {
    if (this.data.readonly) return;
    this.setData({
      'formData.annualRate': e.detail.value
    });
  },

  /**
   * 显示地区选择器（使用公共组件）
   */
  showRegionPicker() {
    if (this.data.readonly) return;
    this.setData({
      showRegionPicker: true
    });
  },

  /**
   * 关闭地区选择器
   */
  onRegionPickerClose() {
    this.setData({
      showRegionPicker: false
    });
  },

  /**
   * 地区选择完成
   */
  onRegionPickerConfirm(e) {
    const { address } = e.detail;
    this.setData({
      'formData.signPlace': address,
      showRegionPicker: false
    });
  },

  // 选择借款用途
  selectLoanPurpose() {
    if (this.data.readonly) return;
    this.showPicker('usageDesc');
  },

  // 选择还款方式
  selectRepaymentMethod() {
    if (this.data.readonly) return;
    this.showPicker('repayMode');
  },

  // 选择解决争议方式
  selectDisputeResolution() {
    if (this.data.readonly) return;
    this.showPicker('disputeWay');
  },

  // 选择仲裁机构
  selectArbitrationOrg() {
    if (this.data.readonly) return;
    this.showPicker('arbitrationOrg');
  },

  // 选择是否办理赋强公证
  selectNotarization(e) {
    if (this.data.readonly) return;
    const value = e.currentTarget.dataset.value;
      this.setData({
      'formData.isNotarization': value
    });
  },

  // 选择公证类型
  selectNotarizationType() {
    if (this.data.readonly) return;
    this.showPicker('notarizationType');
  },

  // 选择公证事项
  selectNotarizationItem() {
    if (this.data.readonly) return;
    this.showPicker('notarizationItem');
  },

  // 选择证书接收方式
  selectCertificateReceiveMethod(e) {
    if (this.data.readonly) return;
    const value = e.currentTarget.dataset.value;
    this.setData({
      'formData.certificateReceiveMethod': value
    });
  },

  // 初始化预约时间选择器
  initAppointmentTimePicker() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // 年份：当前年份到未来3年
    const years = [];
    for (let i = 0; i < 4; i++) {
      years.push(String(currentYear + i));
    }
    
    // 月份：01-12
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(String(i).padStart(2, '0'));
    }
    
    // 日期：01-31
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(String(i).padStart(2, '0'));
    }
    
    // 小时：00-23
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(String(i).padStart(2, '0'));
    }
    
    // 分钟：00-59
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(String(i).padStart(2, '0'));
    }
    
    this.setData({
      appointmentTimeRange: [years, months, days, hours, minutes],
      appointmentTimeIndex: [0, currentDate.getMonth(), currentDate.getDate() - 1, currentDate.getHours(), currentDate.getMinutes()]
    });
  },

  // 预约时间改变
  onAppointmentTimeChange(e) {
    if (this.data.readonly) return;
    const values = e.detail.value;
    const range = this.data.appointmentTimeRange;
    
    const year = range[0][values[0]];
    const month = range[1][values[1]];
    const day = range[2][values[2]];
    const hour = range[3][values[3]];
    const minute = range[4][values[4]];
    
    const appointmentTime = `${year}-${month}-${day} ${hour}:${minute}`;
    
    this.setData({
      'formData.appointmentTime': appointmentTime,
      appointmentTimeIndex: values
    });
  },

  // 提前还款违约金比例输入
  onPenaltyRatioInput(e) {
    if (this.data.readonly) return;
    this.setData({
      'formData.penaltyRatio': e.detail.value
    });
  },

  // 数字转大写
  convertToUppercase(num) {
    if (!num || num === '0' || num === '') return '';
    
    // 移除可能的非数字字符（除了小数点）
    let amount = String(num).replace(/[^\d.]/g, '');
    if (!amount || amount === '0') return '';
    
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿'];
    
    // 处理小数部分
    let integerPart = '';
    let decimalPart = '';
    
    if (amount.indexOf('.') !== -1) {
      const parts = amount.split('.');
      integerPart = parts[0];
      decimalPart = parts[1] || '';
      // 只保留两位小数
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
      }
    } else {
      integerPart = amount;
    }
    
    // 转换整数部分
    let result = '';
    if (integerPart === '0') {
      result = '零';
    } else {
      // 将整数部分按4位分组
      const groups = [];
      let temp = integerPart;
      while (temp.length > 0) {
        groups.unshift(temp.slice(-4));
        temp = temp.slice(0, -4);
      }
      
      groups.forEach((group, groupIndex) => {
        let groupStr = '';
        let hasValue = false;
        
        for (let i = 0; i < group.length; i++) {
          const digit = parseInt(group[i]);
          const pos = group.length - 1 - i;
          
          if (digit !== 0) {
            hasValue = true;
            // 处理零的情况
            if (i > 0 && parseInt(group[i - 1]) === 0 && groupStr !== '') {
              groupStr += '零';
            }
            // 添加数字
            groupStr += digits[digit];
            // 添加单位（如果有）
            if (pos > 0) {
              groupStr += units[pos];
            }
          } else if (hasValue && i < group.length - 1 && parseInt(group[i + 1]) !== 0) {
            groupStr += '零';
          }
        }
        
        if (groupStr !== '') {
          const bigUnitIndex = groups.length - 1 - groupIndex;
          if (bigUnitIndex > 0) {
            groupStr += bigUnits[bigUnitIndex];
          }
          result += groupStr;
        }
      });
    }
    
    // 添加"元"
    if (result !== '') {
      result += '元';
    }
    
    // 转换小数部分（角和分）
    if (decimalPart) {
      const jiao = parseInt(decimalPart[0]) || 0;
      const fen = parseInt(decimalPart[1]) || 0;
      
      if (jiao === 0 && fen === 0) {
        result += '整';
      } else {
        if (jiao > 0) {
          result += digits[jiao] + '角';
        }
        if (fen > 0) {
          result += digits[fen] + '分';
        }
      }
    } else {
      result += '整';
    }
    
    return result || '';
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    const requiredFields = [
      { key: 'assigneeOrg', name: '受让机构' },
      { key: 'channelOrg', name: '小贷机构' },
      { key: 'payMethod', name: '支付渠道' },
      { key: 'productType', name: '产品类型' },
      { key: 'borrowerCategory', name: '借款人类型' },
      { key: 'contractSignMode', name: '合同签署方式' },
      { key: 'loanAmount', name: '借款金额' },
      { key: 'loanDays', name: '借款天数' },
      { key: 'startDate', name: '借款起始日期' },
      { key: 'annualRate', name: '借款年利率' },
      { key: 'signPlace', name: '签约地' },
      { key: 'usageDesc', name: '借款用途' },
      { key: 'repayMode', name: '还款方式' },
      { key: 'disputeWay', name: '解决争议方式' },
      { key: 'arbitrationOrg', name: '仲裁机构' },
      { key: 'isNotarization', name: '是否办理赋强公证' },
      { key: 'penaltyRatio', name: '提前还款违约金比例' }
    ];

    for (let field of requiredFields) {
      if (!formData[field.key]) {
        wx.showToast({
          title: `请填写${field.name}`,
          icon: 'none'
        });
        return false;
      }
    }

    // 如果选择了办理赋强公证，验证公证相关字段
    if (formData.isNotarization === '是') {
      const notarizationFields = [
        { key: 'notarizationType', name: '公证类型' },
        { key: 'notarizationItem', name: '公证事项' },
        { key: 'certificateReceiveMethod', name: '证书接收方式' }
      ];

      for (let field of notarizationFields) {
        if (!formData[field.key]) {
          wx.showToast({
            title: `请填写${field.name}`,
            icon: 'none'
          });
          return false;
        }
      }

      // 单独校验预约时间（必填）
      if (!formData.appointmentTime) {
        wx.showToast({
          title: '请选择预约时间',
          icon: 'none'
        });
        return false;
      }
    }

    return true;
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 阻止滚动穿透
  stopScroll() {
    return false;
  },

  /**
   * 计算导航栏滚动位置，让当前选中的tab居中或适当位置
   * 规则：
   * - 第1个（索引0）：最左
   * - 第2个（索引1）：偏左
   * - 第3、4个（索引2、3）：居中
   * - 第5个（索引4）：偏右
   * - 第6个（索引5）：最右
   */
  calculateTabsScroll() {
    const currentStep = this.data.currentStep;
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth; // 屏幕宽度（px）
    const screenHeight = systemInfo.windowHeight; // 屏幕高度（px）
    
    // 每个tab的宽度（rpx转px，假设每个tab约150rpx）
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    
    // 计算总宽度
    const totalWidth = tabWidthPx * 6; // 6个tab的总宽度
    const screenCenter = screenWidth / 2; // 屏幕中心位置
    
    // 计算当前tab的位置信息
    const currentTabStart = currentStep * tabWidthPx; // 当前tab的起始位置
    const currentTabCenter = currentTabStart + tabWidthPx / 2; // 当前tab的中心位置
    const currentTabEnd = currentTabStart + tabWidthPx; // 当前tab的结束位置
    
    // 计算滚动位置
    let scrollLeft = 0;
    let calculationRule = '';
    
    if (currentStep === 0 || currentStep === 1) {
      // 第1、2个：最左（不滚动，保持原样）
      scrollLeft = 0;
      calculationRule = `第${currentStep + 1}个：最左（scrollLeft = 0，不滚动）`;
    } else if (currentStep === 2) {
      // 第3个（共借人信息）：根据日志，scrollLeft = 50.15px左右
      // 根据屏幕宽度动态计算，保持相对位置
      scrollLeft = 50.15;
      calculationRule = '第3个（共借人信息）：固定位置（scrollLeft = 50.15px）';
    } else if (currentStep === 3) {
      // 第4个（担保人信息）：根据日志，scrollLeft = 154.15px左右
      scrollLeft = 154.15;
      calculationRule = '第4个（担保人信息）：固定位置（scrollLeft = 154.15px）';
    } else if (currentStep === 4 || currentStep === 5) {
      // 第5、6个：根据日志，scrollLeft = 221.16px左右
      scrollLeft = 221.16;
      calculationRule = `第${currentStep + 1}个：固定位置（scrollLeft = 221.16px）`;
    }
    
    // 确保scrollLeft不为负数
    const originalScrollLeft = scrollLeft;
    scrollLeft = Math.max(0, scrollLeft);
    
    // 计算当前tab在屏幕中的实际位置（滚动后）
    const tabVisibleStart = currentTabStart - scrollLeft; // tab在屏幕中的起始位置
    const tabVisibleCenter = currentTabCenter - scrollLeft; // tab在屏幕中的中心位置
    const tabVisibleEnd = currentTabEnd - scrollLeft; // tab在屏幕中的结束位置
    
    // 详细日志
    logger.info('========== 导航栏滚动位置计算 ==========');
    logger.info('页面信息:', {
      page: 'step1',
      currentStep: currentStep,
      stepName: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][currentStep]
    });
    logger.info('屏幕信息:', {
      screenWidth: `${screenWidth}px`,
      screenHeight: `${screenHeight}px`,
      screenCenter: `${screenCenter.toFixed(2)}px`
    });
    logger.info('Tab尺寸信息:', {
      tabWidthRpx: `${tabWidthRpx}rpx`,
      tabWidthPx: `${tabWidthPx.toFixed(2)}px`,
      totalWidth: `${totalWidth.toFixed(2)}px`,
      tabCount: 6
    });
    logger.info('当前Tab位置（滚动前）:', {
      tabStart: `${currentTabStart.toFixed(2)}px`,
      tabCenter: `${currentTabCenter.toFixed(2)}px`,
      tabEnd: `${currentTabEnd.toFixed(2)}px`
    });
    logger.info('计算规则:', calculationRule);
    logger.info('滚动位置计算:', {
      originalScrollLeft: `${originalScrollLeft.toFixed(2)}px`,
      finalScrollLeft: `${scrollLeft.toFixed(2)}px`,
      adjusted: originalScrollLeft !== scrollLeft ? '是（已调整为非负数）' : '否'
    });
    logger.info('当前Tab位置（滚动后）:', {
      visibleStart: `${tabVisibleStart.toFixed(2)}px`,
      visibleCenter: `${tabVisibleCenter.toFixed(2)}px`,
      visibleEnd: `${tabVisibleEnd.toFixed(2)}px`,
      isCentered: Math.abs(tabVisibleCenter - screenCenter) < 1 ? '是' : '否',
      centerOffset: `${(tabVisibleCenter - screenCenter).toFixed(2)}px`
    });
    logger.info('========================================');
    
    this.setData({
      tabsScrollLeft: scrollLeft
    });
  },

  /**
   * 导航栏滚动事件监听
   * 记录滚动条的左边和右边位置，方便调试和调整
   */
  onTabsScroll(e) {
    const scrollLeft = e.detail.scrollLeft;
    const scrollWidth = e.detail.scrollWidth;
    const scrollHeight = e.detail.scrollHeight;
    
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    
    // 计算滚动条的左边和右边位置
    const scrollBarLeft = scrollLeft; // 滚动条左边位置（相对于内容开始位置）
    const scrollBarRight = scrollLeft + screenWidth; // 滚动条右边位置（相对于内容开始位置）
    const scrollBarCenter = scrollLeft + screenWidth / 2; // 滚动条中心位置
    
    // 计算可见区域内的tab范围
    const tabWidthRpx = 150;
    const tabWidthPx = (tabWidthRpx / 750) * screenWidth;
    const visibleStartTabIndex = Math.floor(scrollBarLeft / tabWidthPx);
    const visibleEndTabIndex = Math.min(5, Math.ceil(scrollBarRight / tabWidthPx));
    
    // 计算每个tab在可见区域中的位置
    const visibleTabs = [];
    for (let i = 0; i < 6; i++) {
      const tabStart = i * tabWidthPx;
      const tabCenter = tabStart + tabWidthPx / 2;
      const tabEnd = tabStart + tabWidthPx;
      const tabVisibleStart = tabStart - scrollLeft;
      const tabVisibleCenter = tabCenter - scrollLeft;
      const tabVisibleEnd = tabEnd - scrollLeft;
      
      if (tabVisibleEnd >= 0 && tabVisibleStart <= screenWidth) {
        visibleTabs.push({
          index: i,
          name: ['借款信息', '借款人信息', '共借人信息', '担保人信息', '银行卡信息', '资料上传'][i],
          tabStart: `${tabStart.toFixed(2)}px`,
          tabCenter: `${tabCenter.toFixed(2)}px`,
          tabEnd: `${tabEnd.toFixed(2)}px`,
          visibleStart: `${tabVisibleStart.toFixed(2)}px`,
          visibleCenter: `${tabVisibleCenter.toFixed(2)}px`,
          visibleEnd: `${tabVisibleEnd.toFixed(2)}px`,
          isActive: i === this.data.currentStep,
          distanceFromCenter: `${(tabVisibleCenter - screenWidth / 2).toFixed(2)}px`
        });
      }
    }
    
    logger.info('========== 导航栏手动滚动 ==========');
    logger.info('滚动信息:', {
      scrollLeft: `${scrollLeft.toFixed(2)}px`,
      scrollWidth: `${scrollWidth}px`,
      scrollHeight: `${scrollHeight}px`,
      screenWidth: `${screenWidth}px`
    });
    logger.info('滚动条位置:', {
      scrollBarLeft: `${scrollBarLeft.toFixed(2)}px`,
      scrollBarCenter: `${scrollBarCenter.toFixed(2)}px`,
      scrollBarRight: `${scrollBarRight.toFixed(2)}px`,
      screenCenter: `${(screenWidth / 2).toFixed(2)}px`
    });
    logger.info('可见Tab范围:', {
      startIndex: visibleStartTabIndex,
      endIndex: visibleEndTabIndex,
      tabNames: visibleTabs.map(t => `${t.index}:${t.name}`).join(', ')
    });
    logger.info('可见Tab详细信息:', visibleTabs);
    logger.info('====================================');
  },

  /**
   * 导航栏tab点击事件
   * 如果从订单详情页进入，可以点击tab跳转到对应页面
   */
  onTabClick(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    navigation.navigateToStep(step, this.data.currentStep);
  },

  // 下一步
  goNext() {
    // 只读模式下不允许保存
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式，无法保存',
        icon: 'none'
      });
      return;
    }
    
    if (!this.validateForm()) {
      return;
    }

    const formData = this.data.formData;
    const orderId = this.data.orderId;
    wx.showLoading({ title: '保存中...' });
    
    // 调用统一的保存接口（内部会根据是否有 orderId 判断新建还是更新）
    this.saveStep1ToServer(orderId, formData)
      .then(result => {
        // 保存返回的 orderId 和 orderStatus 到页面数据
        this.setData({ 
          orderId: result.orderId,
          orderStatus: result.orderStatus
        });
        wx.setStorageSync('currentOrderId', result.orderId);
        
        // 更新全局上下文（重要：保证后续页面能正确读取）
        navigation.setOrderContext({
          orderId: result.orderId,
          orderStatus: result.orderStatus,
          mode: 'create'
        });
        
        // 保存成功后清理本步骤的缓存，避免影响下一个订单
        wx.removeStorageSync('orderFormData_step1');
        
        logger.info('步骤1保存成功', result);
        wx.hideLoading();
        this.goNextInternal();
      })
      .catch(err => {
        logger.error('步骤1保存到后端失败', err);
        wx.hideLoading();
        // 提取错误信息
        let errorMsg = '保存失败';
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
        // 保存失败，不跳转
      });
  },

  // 调用后端保存步骤1数据（新建或更新订单）
  // 后端会根据 formData 中是否有 orderId 来判断是新建还是更新
  saveStep1ToServer(orderId, formData) {
    const req = wx.$request;
    
    // 如果有 orderId
    if (orderId) {
      // 更新已有订单
      formData.orderId = orderId;
    }

    // 处理预约时间：如果选择"否"，不传该字段或传 null
    const submitData = { ...formData };
    if (submitData.isNotarization === '否') {
      // 选择"否"时，删除预约时间字段，避免传空字符串导致数据库错误
      delete submitData.appointmentTime;
    } else if (submitData.appointmentTime === '') {
      // 如果是空字符串，也删除该字段
      delete submitData.appointmentTime;
    }

    return req.post(`/public/orders/step1`, submitData).then(res => {
      // 返回完整的订单信息（包括 orderId 和 orderStatus）
      const result = {
        orderId: null,
        orderStatus: null
      };
      
      if (res && res.data) {
        result.orderId = res.data.orderId || orderId;
        result.orderStatus = res.data.orderStatus != null ? String(res.data.orderStatus) : '0';
      }
      
      logger.info('step1 保存响应', { res: res.data, result });
      return result;
    });
  },

  // 执行页面跳转到步骤2
  goNextInternal() {
    navigation.goNext(this.data.currentStep);
  },

  /**
   * 导航栏tab点击事件
   * 如果从订单详情页进入，可以点击tab跳转到对应页面
   */
  onTabClick(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    navigation.navigateToStep(step, this.data.currentStep);
  }
});


// 内联 logger
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args)
};

Page({
  data: {
    // 共借人类型：personal-个人，company-对公
    borrowerType: 'personal',
    
    // 个人信息
    idCardFront: '',
    idCardBack: '',
    idType: '身份证',
    name: '',
    phone: '',
    idNumber: '',
    idStartDate: '',
    idEndDate: '长期',
    idAddress: '',
    residenceArea: '',
    detailAddress: '',
    relationship: '',
    maritalStatus: '',
    
    // 对公信息
    businessLicense: '',
    companyName: '',
    companyCreditCode: '',
    companyArea: '',
    companyAddress: '',
    agentPhone: '',
    agentIdCardFront: '',
    agentIdCardBack: '',
    agentIdType: '身份证',
    agentName: '',
    agentPhone2: '',
    agentIdNumber: '',
    agentIdStartDate: '',
    agentIdEndDate: '长期',
    agentIdAddress: '',
    companyRelationship: '',
    notaryDocuments: [], // 公证材料列表
    
    // 省市区选择器相关
    showRegionPicker: false,
    regionPickerTitle: '选择地区',
    regionCurrentValue: '',
    currentRegionType: '', // 'residence' 或 'company'
    
    // 编辑模式
    isEdit: false,
    editIndex: -1
  },

  onLoad(options) {
    logger.info('共借人页面加载', options);
    
    // 加载共借人数据（从后端或本地）
    this.loadData();
  },

  // 加载共借人数据
  async loadData() {
    const orderId = wx.getStorageSync('currentOrderId');
    if (!orderId) {
      logger.warn('[共借人] 订单ID缺失，尝试从本地加载');
      this.loadFromLocal();
      return;
    }

    wx.showLoading({ title: '加载中...', mask: true });

    try {
      const req = wx.$request;
      const result = await req.get(`/public/orders/${orderId}/coBorrower`);
      
      wx.hideLoading();
      
      if (result && result.success && result.data) {
        logger.info('[共借人] 从后端加载成功', result.data);
        // 映射后端数据到页面
        this.setData({
          borrowerType: result.data.borrowerType || 'personal',
          // 个人信息
          idCardFront: result.data.idCardFront || '',
          idCardBack: result.data.idCardBack || '',
          idType: result.data.idType || '身份证',
          name: result.data.name || '',
          phone: result.data.phone || '',
          idNumber: result.data.idNumber || '',
          idStartDate: result.data.idStartDate || '',
          idEndDate: result.data.idEndDate || '长期',
          idAddress: result.data.idAddress || '',
          residenceArea: result.data.residenceArea || '',
          detailAddress: result.data.detailAddress || '',
          relationship: result.data.relationship || '',
          maritalStatus: result.data.maritalStatus || '',
          // 对公信息
          businessLicense: result.data.businessLicense || '',
          companyName: result.data.companyName || '',
          companyCreditCode: result.data.companyCreditCode || '',
          companyArea: result.data.companyArea || '',
          companyAddress: result.data.companyAddress || '',
          agentPhone: result.data.agentPhone || '',
          agentIdCardFront: result.data.agentIdCardFront || '',
          agentIdCardBack: result.data.agentIdCardBack || '',
          agentIdType: result.data.agentIdType || '身份证',
          agentName: result.data.agentName || '',
          agentPhone2: result.data.agentPhone2 || '',
          agentIdNumber: result.data.agentIdNumber || '',
          agentIdStartDate: result.data.agentIdStartDate || '',
          agentIdEndDate: result.data.agentIdEndDate || '长期',
          agentIdAddress: result.data.agentIdAddress || '',
          companyRelationship: result.data.companyRelationship || '',
          notaryDocuments: result.data.notaryDocuments || []
        });
      } else {
        logger.info('[共借人] 后端无数据，尝试从本地加载');
        this.loadFromLocal();
      }
    } catch (err) {
      wx.hideLoading();
      logger.error('[共借人] 加载失败，尝试从本地加载', err);
      this.loadFromLocal();
    }
  },

  // 从本地存储加载
  loadFromLocal() {
    const savedData = wx.getStorageSync('orderFormData_step3');
    if (savedData && savedData.coBorrower) {
      const data = savedData.coBorrower;
      logger.info('[共借人] 从本地加载成功', data);
      this.setData({
        borrowerType: data.borrowerType || 'personal',
        ...data
      });
    }
  },

  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      borrowerType: type
    });
  },

  // 上传身份证正面
  uploadIdCardFront() {
    this.chooseImage((path) => {
      this.setData({ idCardFront: path });
    });
  },

  // 上传身份证反面
  uploadIdCardBack() {
    this.chooseImage((path) => {
      this.setData({ idCardBack: path });
    });
  },

  // 删除身份证正面
  deleteIdCardFront(e) {
    e.stopPropagation();
    this.setData({ idCardFront: '' });
  },

  // 删除身份证反面
  deleteIdCardBack(e) {
    e.stopPropagation();
    this.setData({ idCardBack: '' });
  },

  // 删除营业执照
  deleteBusinessLicense(e) {
    e.stopPropagation();
    this.setData({ businessLicense: '' });
  },

  // 删除经办人身份证正面
  deleteAgentIdCardFront(e) {
    e.stopPropagation();
    this.setData({ agentIdCardFront: '' });
  },

  // 删除经办人身份证反面
  deleteAgentIdCardBack(e) {
    e.stopPropagation();
    this.setData({ agentIdCardBack: '' });
  },

  // 上传营业执照
  uploadBusinessLicense() {
    this.chooseImage((path) => {
      this.setData({ businessLicense: path });
    });
  },

  // 上传经办人身份证正面
  uploadAgentIdCardFront() {
    this.chooseImage((path) => {
      this.setData({ agentIdCardFront: path });
    });
  },

  // 上传经办人身份证反面
  uploadAgentIdCardBack() {
    this.chooseImage((path) => {
      this.setData({ agentIdCardBack: path });
    });
  },

  // 上传公证材料（使用 step6 的逻辑）
  uploadNotaryDocument() {
    const that = this;
    const currentDocs = that.data.notaryDocuments || [];
    
    wx.chooseMessageFile({
      count: 9 - currentDocs.length, // 限制总数不超过9个
      type: 'file',
      success: (res) => {
        const files = res.tempFiles;
        const notaryDocuments = [...currentDocs];
        
        files.forEach(file => {
          // 生成时间戳文件名
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop() || 'file';
          const timestampFileName = `法人证明书-${timestamp}.${fileExtension}`;
          
          notaryDocuments.push({
            name: timestampFileName,
            originalName: file.name, // 保留原始文件名，以备后用
            path: file.path,
            size: file.size
          });
        });
        
        that.setData({
          notaryDocuments: notaryDocuments
        });
        logger.info('[公证材料] 选择文件成功:', { count: files.length, total: notaryDocuments.length });
      },
      fail: (err) => {
        logger.error('[公证材料] 选择文件失败:', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览公证材料（支持图片预览）
  previewNotaryDocument(e) {
    const index = e.currentTarget.dataset.index;
    const doc = this.data.notaryDocuments[index];
    
    // 检查是否为图片文件
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const fileExtension = doc.path.split('.').pop().toLowerCase();
    
    if (imageExtensions.includes(fileExtension)) {
      // 获取所有图片文件的路径列表
      const imageUrls = this.data.notaryDocuments
        .filter(item => {
          const ext = item.path.split('.').pop().toLowerCase();
          return imageExtensions.includes(ext);
        })
        .map(item => item.path);
      
      // 使用微信预览图片API
      wx.previewImage({
        current: doc.path, // 当前显示图片的链接
        urls: imageUrls // 需要预览的图片http链接列表
      });
    } else {
      wx.showToast({
        title: '该文件不支持预览',
        icon: 'none'
      });
    }
  },

  // 删除公证材料
  deleteNotaryDocument(e) {
    const index = e.currentTarget.dataset.index;
    const document = this.data.notaryDocuments[index];
    const that = this;
    
    // 显示确认提示框
    wx.showModal({
      title: '确认删除',
      content: '你确认要删除该文件吗?',
      confirmText: '确认',
      cancelText: '取消',
      confirmColor: '#ff6f6f',
      success: (res) => {
        if (res.confirm) {
          // 用户确认删除
          const docs = that.data.notaryDocuments;
          docs.splice(index, 1);
          that.setData({
            notaryDocuments: docs
          });
          
          // 调用通用删除方法
          wx.$upload.deleteOrderFile({
            file: document,
            fileType: 'notary-documents'
          });
        }
      }
    });
  },

  // 选择图片
  chooseImage(callback) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        callback(res.tempFilePaths[0]);
      }
    });
  },

  // 输入事件
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onIdNumberInput(e) {
    this.setData({ idNumber: e.detail.value });
  },

  onIdAddressInput(e) {
    this.setData({ idAddress: e.detail.value });
  },

  onDetailAddressInput(e) {
    this.setData({ detailAddress: e.detail.value });
  },

  onCompanyNameInput(e) {
    this.setData({ companyName: e.detail.value });
  },

  onCompanyCreditCodeInput(e) {
    this.setData({ companyCreditCode: e.detail.value });
  },

  onCompanyAddressInput(e) {
    this.setData({ companyAddress: e.detail.value });
  },

  onAgentPhoneInput(e) {
    this.setData({ agentPhone: e.detail.value });
  },

  onAgentNameInput(e) {
    this.setData({ agentName: e.detail.value });
  },

  onAgentPhone2Input(e) {
    this.setData({ agentPhone2: e.detail.value });
  },

  onAgentIdNumberInput(e) {
    this.setData({ agentIdNumber: e.detail.value });
  },

  onAgentIdAddressInput(e) {
    this.setData({ agentIdAddress: e.detail.value });
  },

  // 选择证件类型
  selectIdType() {
    wx.showActionSheet({
      itemList: ['身份证', '护照', '军官证', '其他'],
      success: (res) => {
        const types = ['身份证', '护照', '军官证', '其他'];
        this.setData({ idType: types[res.tapIndex] });
      }
    });
  },

  selectAgentIdType() {
    wx.showActionSheet({
      itemList: ['身份证', '护照', '军官证', '其他'],
      success: (res) => {
        const types = ['身份证', '护照', '军官证', '其他'];
        this.setData({ agentIdType: types[res.tapIndex] });
      }
    });
  },

  // 选择日期
  selectIdStartDate() {
    // TODO: 实现日期选择器
    wx.showToast({ title: '日期选择功能待实现', icon: 'none' });
  },

  selectIdEndDate() {
    // TODO: 实现日期选择器
    wx.showToast({ title: '日期选择功能待实现', icon: 'none' });
  },

  selectAgentIdStartDate() {
    // TODO: 实现日期选择器
    wx.showToast({ title: '日期选择功能待实现', icon: 'none' });
  },

  selectAgentIdEndDate() {
    // TODO: 实现日期选择器
    wx.showToast({ title: '日期选择功能待实现', icon: 'none' });
  },

  // 选择地区
  selectResidenceArea() {
    this.setData({
      showRegionPicker: true,
      regionPickerTitle: '选择居住地',
      regionCurrentValue: this.data.residenceArea,
      currentRegionType: 'residence'
    });
  },

  selectCompanyArea() {
    this.setData({
      showRegionPicker: true,
      regionPickerTitle: '选择注册地',
      regionCurrentValue: this.data.companyArea,
      currentRegionType: 'company'
    });
  },

  // 省市区选择器关闭
  onRegionPickerClose() {
    this.setData({
      showRegionPicker: false
    });
  },

  // 省市区选择完成回调
  onRegionPickerConfirm(e) {
    const { address } = e.detail;
    const type = this.data.currentRegionType;
    
    if (type === 'residence') {
      this.setData({ residenceArea: address });
    } else if (type === 'company') {
      this.setData({ companyArea: address });
    }
    
    this.setData({
      showRegionPicker: false
    });
  },

  // 选择关系
  selectRelationship() {
    const that = this;
    wx.showActionSheet({
      itemList: ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '其他'],
      success: (res) => {
        const relationships = ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '其他'];
        that.setData({ relationship: relationships[res.tapIndex] });
      }
    });
  },

  selectCompanyRelationship() {
    const that = this;
    wx.showActionSheet({
      itemList: ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '其他'],
      success: (res) => {
        const relationships = ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '其他'];
        that.setData({ companyRelationship: relationships[res.tapIndex] });
      }
    });
  },

  // 选择婚姻状况
  selectMaritalStatus() {
    const that = this;
    wx.showActionSheet({
      itemList: ['未婚', '已婚', '离异', '丧偶'],
      success: (res) => {
        const statusList = ['未婚', '已婚', '离异', '丧偶'];
        that.setData({ maritalStatus: statusList[res.tapIndex] });
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 保存
  async save() {
    // 验证必填项
    if (this.data.borrowerType === 'personal') {
      if (!this.data.idCardFront || !this.data.idCardBack) {
        wx.showToast({ title: '请上传身份证照片', icon: 'none' });
        return;
      }
      if (!this.data.name) {
        wx.showToast({ title: '请填写姓名', icon: 'none' });
        return;
      }
      if (!this.data.phone) {
        wx.showToast({ title: '请填写手机号', icon: 'none' });
        return;
      }
      if (!this.data.idNumber) {
        wx.showToast({ title: '请填写证件号码', icon: 'none' });
        return;
      }
    } else {
      if (!this.data.businessLicense) {
        wx.showToast({ title: '请上传营业执照', icon: 'none' });
        return;
      }
      if (!this.data.companyName) {
        wx.showToast({ title: '请填写公司名称', icon: 'none' });
        return;
      }
      if (!this.data.companyCreditCode) {
        wx.showToast({ title: '请填写公司信用代码', icon: 'none' });
        return;
      }
    }

    // 如果有法人证明书需要上传，先上传到服务器
    let uploadedNotaryDocs = [];
    if (this.data.notaryDocuments && this.data.notaryDocuments.length > 0) {
      wx.showLoading({ title: '上传文件中...', mask: true });
      try {
        const orderId = wx.getStorageSync('currentOrderId');
        uploadedNotaryDocs = await wx.$upload.uploadFilesIfNeeded(
          this.data.notaryDocuments,
          (filePath) => wx.$upload.uploadOrderFile(filePath, 'notaryDoc', orderId)
        );
        wx.hideLoading();
        logger.info('[公证材料] 文件上传完成', { count: uploadedNotaryDocs.length });
      } catch (err) {
        wx.hideLoading();
        logger.error('[公证材料] 文件上传失败', err);
        wx.showToast({ title: '文件上传失败', icon: 'none' });
        return;
      }
    }

    // 构建共借人数据
    const coBorrowerData = {
      borrowerType: this.data.borrowerType,
      // 个人信息
      idCardFront: this.data.idCardFront,
      idCardBack: this.data.idCardBack,
      idType: this.data.idType,
      name: this.data.name,
      phone: this.data.phone,
      idNumber: this.data.idNumber,
      idStartDate: this.data.idStartDate,
      idEndDate: this.data.idEndDate,
      idAddress: this.data.idAddress,
      residenceArea: this.data.residenceArea,
      detailAddress: this.data.detailAddress,
      relationship: this.data.relationship,
      maritalStatus: this.data.maritalStatus,
      // 对公信息
      businessLicense: this.data.businessLicense,
      companyName: this.data.companyName,
      companyCreditCode: this.data.companyCreditCode,
      companyArea: this.data.companyArea,
      companyAddress: this.data.companyAddress,
      agentPhone: this.data.agentPhone,
      agentIdCardFront: this.data.agentIdCardFront,
      agentIdCardBack: this.data.agentIdCardBack,
      agentIdType: this.data.agentIdType,
      agentName: this.data.agentName,
      agentPhone2: this.data.agentPhone2,
      agentIdNumber: this.data.agentIdNumber,
      agentIdStartDate: this.data.agentIdStartDate,
      agentIdEndDate: this.data.agentIdEndDate,
      agentIdAddress: this.data.agentIdAddress,
      companyRelationship: this.data.companyRelationship,
      notaryDocuments: uploadedNotaryDocs.length > 0 ? uploadedNotaryDocs : this.data.notaryDocuments
    };

    // 先保存到本地存储（作为备份）
    wx.setStorageSync('orderFormData_step3', { coBorrower: coBorrowerData });

    // 调用后端接口保存
    const orderId = wx.getStorageSync('currentOrderId');
    if (!orderId) {
      wx.showToast({ title: '订单ID缺失，请先完成前面步骤', icon: 'none', duration: 2000 });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      const req = wx.$request;
      const result = await req.post(`/public/orders/${orderId}/coBorrower/save`, coBorrowerData);
      
      wx.hideLoading();
      
      if (result && result.success) {
        logger.info('[共借人] 保存成功', result);
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        logger.error('[共借人] 保存失败', result);
        wx.showToast({
          title: result.message || '保存失败',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      wx.hideLoading();
      logger.error('[共借人] 保存异常', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

});


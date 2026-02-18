// 使用统一的 logger 工具
const logger = require('../../../../utils/logger.js');

const dictManager = require('../../../../utils/dict-manager');

Page({
  data: {
    // 共借人类型：personal-个人，company-对公
    borrowerType: 'personal',
    
    // 个人信息（个人类型使用，对公类型作为经办人信息使用）
    idCardFront: '',
    idCardBack: '',
    idType: '',
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
    agentMobile: '', // 经办人手机号
    
    // 省市区选择器相关
    showRegionPicker: false,
    regionPickerTitle: '选择地区',
    regionCurrentValue: '',
    currentRegionType: '', // 'residence' 或 'company'
    
    // 统一选择器相关
    showPicker: false,
    pickerTitle: '',
    pickerOptions: [],
    pickerCurrentValue: '',
    pickerField: '', // 当前选择器对应的字段
    
    // 下拉选项数据
    idTypeOptions: [],
    relationshipOptions: [],
    maritalStatusOptions: [],
    
    // 图标URL
    deleteIconUrl: '',
    
    // 编辑模式
    isEdit: false,
    editIndex: -1,
    
    // 是否只读（订单状态为0/2时为只读）
    readonly: false,
    // 订单状态（0-待提交，2-风控驳回时为只读）
    orderStatus: null
  },

  onLoad(options) {
    logger.info('共借人页面加载', options);
    
    // 获取模式和订单状态
    const mode = options?.mode || 'create';
    const orderStatus = options?.orderStatus || null;
    
    // 判断是否只读：
    // 1. 订单状态为0(待提交)或2(风控驳回)时，允许编辑（不是只读）
    // 2. 其他状态且mode为view时，为只读
    const isEditableByStatus = orderStatus === "0" || orderStatus === "2";
    const readonly = mode === 'view' && !isEditableByStatus;
    
    this.setData({
      orderStatus: orderStatus,
      readonly: readonly
    });
    
    // 加载下拉选项
    this.loadDictOptions();
    
    // 加载共借人数据（从后端或本地）
    this.loadData();

    this.setData({
      idFrontPlaceholder: wx.$placeholders.ID_FRONT,
      idBackPlaceholder: wx.$placeholders.ID_BACK,
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE,
      deleteIconUrl: wx.$placeholders.DELETE_ICON
    });
  },

  // 加载数据字典选项
  async loadDictOptions() {
    try {
      const categories = ['id_type', 'relationship', 'marital_status'];
      
      // 先尝试从后端加载
      await dictManager.loadDictFromServer(categories);
      
      // 然后获取数据（会优先使用缓存）
      const dictData = dictManager.batchGetDictOptions(categories);
      
      const updates = {
        idTypeOptions: dictData.id_type || [],
        relationshipOptions: dictData.relationship || [],
        maritalStatusOptions: dictData.marital_status || []
      };
      
      this.setData(updates);
      
      // 应用默认值（仅在新建且字段为空时）
      this.applyDictData(dictData);
      
      logger.info('[共借人] 数据字典加载完成', updates);
    } catch (err) {
      logger.error('[共借人] 数据字典加载失败', err);
    }
  },

  // 应用数据字典的默认值
  applyDictData(dictData) {
    const updates = {};
    
    // 证件类型默认选择第一个
    if (!this.data.idType && dictData.id_type && dictData.id_type.length > 0) {
      updates.idType = dictData.id_type[0];
    }
    
    if (Object.keys(updates).length > 0) {
      this.setData(updates);
      logger.info('[共借人] 应用默认值', updates);
    }
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
      const response = await req.get(`/public/orders/${orderId}/coBorrower/list`);
      
      wx.hideLoading();
      
      // 注意：request.js 返回的是完整的响应对象 { statusCode, data }
      // 后端返回的数据在 response.data 中
      const result = response.data;
      
      // 后端返回 { success: true, data: [...], total: 1 }
      // 取第一个共借人（当前只支持一个）
      if (result && result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const coBorrower = result.data[0];
        logger.info('[共借人] 从后端加载成功', coBorrower);
        // 映射后端数据到页面
        this.setData({
          borrowerType: coBorrower.borrowerType || 'personal',
          // 个人信息（个人类型使用，对公/房产类型作为经办人信息）
          idCardFront: coBorrower.idCardFront || '',
          idCardBack: coBorrower.idCardBack || '',
          idType: coBorrower.idType || '身份证',
          name: coBorrower.name || '',
          phone: coBorrower.phone || '',
          idNumber: coBorrower.idNumber || '',
          idStartDate: coBorrower.idStartDate || '',
          idEndDate: coBorrower.idEndDate || '长期',
          idAddress: coBorrower.idAddress || '',
          residenceArea: coBorrower.residenceArea || '',
          detailAddress: coBorrower.detailAddress || '',
          relationship: coBorrower.relationship || '',
          maritalStatus: coBorrower.maritalStatus || '',
          // 对公/房产信息
          businessLicense: coBorrower.businessLicense || '',
          companyName: coBorrower.companyName || '',
          companyCreditCode: coBorrower.companyCreditCode || '',
          companyArea: coBorrower.companyArea || '',
          companyAddress: coBorrower.companyAddress || '',
          agentMobile: coBorrower.agentMobile || ''
        });
        // 保存共借人ID，用于更新（必须在 setData 之后）
        this._coBorrowerId = coBorrower.id;
        logger.info('[共借人] 保存ID用于更新', { id: this._coBorrowerId });
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

  // 从本地存储加载（已废弃，不再使用缓存）
  loadFromLocal() {
    // 不再从本地缓存加载数据，避免业务员录入多个订单时数据混乱
    logger.info('[共借人] 跳过本地缓存加载');
  },

  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    const currentType = this.data.borrowerType;
    
    // 如果类型没有变化，不做任何操作
    if (type === currentType) {
      return;
    }
    
    // 切换类型时，清空不同类型的特有字段
    const updates = { borrowerType: type };
    
    if (type === 'personal') {
      // 切换到个人类型，清空对公特有字段
      updates.businessLicense = '';
      updates.companyName = '';
      updates.companyCreditCode = '';
      updates.companyArea = '';
      updates.companyAddress = '';
      updates.agentMobile = '';
      // 保留个人信息字段（可能已填写）
    } else if (type === 'company') {
      // 切换到对公类型，清空个人特有字段
      updates.residenceArea = '';
      updates.detailAddress = '';
      updates.maritalStatus = '';
      // 保留个人信息字段（作为经办人信息）
      // 保留公司信息字段（可能已填写）
    }
    
    this.setData(updates);
    logger.info('[共借人] 切换类型', { from: currentType, to: type, cleared: Object.keys(updates) });
  },

  // 上传身份证正面（复用step2逻辑：上传+OCR+预览）
  uploadIdCardFront() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseIdCardImage('idCardFront', 'idFront');
  },

  // 上传身份证反面（复用step2逻辑：上传+OCR+预览）
  uploadIdCardBack() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseIdCardImage('idCardBack', 'idBack');
  },

  // 选择身份证图片并上传+OCR识别
  chooseIdCardImage(field, imageType) {
    const that = this;
    logger.info('[共借人OCR] 开始选择身份证图片', { field, imageType });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const fileSize = res.tempFiles?.[0]?.size || 0;
        logger.info('[共借人OCR] 选择图片成功', { field, imageType, filePath: tempFilePath, fileSize });

        // 如果大于2MB先压缩
        that.handleImageWithCompress(tempFilePath, fileSize)
          .then(({ path: finalPath, size: finalSize }) => {
            logger.info('[共借人OCR] 处理后图片', { finalPath, finalSize });
            
            // 上传图片到服务器（后端会自动进行OCR识别）
            wx.showLoading({ title: '上传中...', mask: true });
            that.uploadIdCardImageWithOcr(finalPath, imageType)
              .then((result) => {
                const uploadUrl = result.url || result;
                logger.info('[共借人上传] 图片上传成功', { uploadUrl, hasOcr: !!result.ocr });
                
                // 显示上传后的图片URL
                that.setData({
                  [field]: uploadUrl
                });
                
                // 如果后端返回了OCR结果，直接使用
                if (result.ocr && result.ocrSuccess) {
                  const ocrData = result.ocr;
                  const ocrType = ocrData.type;
                  const actualSide = (ocrType === 'Front' || ocrType === 'front') ? 'front' : 'back';
                  
                  logger.info('[共借人OCR] 后端已返回OCR结果，开始解析', { 
                    ocrType, 
                    actualSide,
                    ocrDataKeys: Object.keys(ocrData || {})
                  });
                  wx.hideLoading();
                  
                  // 解析OCR结果并填充表单
                  that.parseOcrResult(ocrData, actualSide);
                  wx.showToast({
                    title: '识别成功',
                    icon: 'success',
                    duration: 1500
                  });
                } else if (result.ocrSuccess === false) {
                  logger.warn('[共借人OCR] 后端OCR识别失败，但文件已上传', { 
                    error: result.ocrError 
                  });
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，识别失败，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                } else {
                  logger.warn('[共借人OCR] 后端未返回OCR结果');
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，未识别，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                }
              })
              .catch((err) => {
                logger.error('[共借人上传] 图片上传失败', { err });
                wx.hideLoading();
                wx.showToast({
                  title: '图片上传失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              });
          })
          .catch((err) => {
            logger.error('[共借人OCR] 图片处理失败', { err });
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        logger.error('[共借人OCR] 选择图片失败', { field, imageType, error: err });
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 图片压缩处理
  handleImageWithCompress(imagePath, size) {
    const LIMIT = 2 * 1024 * 1024; // 2MB
    if (!size || size <= LIMIT) {
      return Promise.resolve({ path: imagePath, size });
    }

    logger.info('[共借人OCR] 图片超过2MB，开始压缩', { imagePath, size });
    wx.showLoading({ title: '压缩中...', mask: true });

    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: imagePath,
        quality: 70,
        success: (res) => {
          const compressedPath = res.tempFilePath;
          const fs = wx.getFileSystemManager();
          fs.stat({
            path: compressedPath,
            success: (stat) => {
              logger.info('[共借人OCR] 压缩完成', { compressedPath, size: stat.size });
              resolve({ path: compressedPath, size: stat.size });
            },
            fail: () => {
              logger.warn('[共借人OCR] 无法读取压缩后大小，默认通过', { compressedPath });
              resolve({ path: compressedPath, size: LIMIT });
            }
          });
        },
        fail: (err) => {
          logger.error('[共借人OCR] 压缩失败', err);
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    });
  },

  // 上传共借人身份证图片（带OCR识别）
  uploadIdCardImageWithOcr(imagePath, imageType) {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    const orderId = wx.getStorageSync('currentOrderId');
    const idNumber = this.data.idNumber || '';

    // 使用全局上传工具
    const uploadUtil = wx.$upload;
    return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType, 'coBorrower');
  },

  // 解析OCR结果并填充表单
  parseOcrResult(ocrData, side) {
    logger.info('[共借人OCR] 开始解析OCR结果', { side, ocrDataKeys: Object.keys(ocrData || {}) });
    const updates = {};
    let hasValidData = false;
    
    if (side === 'front') {
      // 解析人像面信息：姓名、身份证号、地址
      logger.debug('[共借人OCR] 解析身份证人像面信息', { ocrData });
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates.name = name;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到姓名', { name });
        }
      }
      
      const idNumber = ocrData.id || ocrData.idNumber;
      if (idNumber) {
        const cleanIdNumber = String(idNumber).replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates.idNumber = cleanIdNumber;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到身份证号', { 
            original: idNumber, 
            cleaned: cleanIdNumber
          });
        }
      }
      
      const address = ocrData.addr || ocrData.address;
      if (address && address.trim()) {
        const addr = address.trim();
        updates.idAddress = addr;
        hasValidData = true;
        logger.info('[共借人OCR] 识别到证件地址', { address: addr });
      }
      
    } else if (side === 'back') {
      // 解析国徽面信息：有效期
      logger.debug('[共借人OCR] 解析身份证国徽面信息', { ocrData });
      
      const validPeriod = ocrData.valid_date || ocrData.validPeriod || ocrData.validDate;
      if (validPeriod) {
        logger.debug('[共借人OCR] 解析有效期', { validPeriod });
        
        const periodMatch = validPeriod.match(/(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?\s*[-至]\s*(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?/);
        if (periodMatch) {
          const startMonth = periodMatch[2].padStart(2, '0');
          const startDay = periodMatch[3].padStart(2, '0');
          const endMonth = periodMatch[5].padStart(2, '0');
          const endDay = periodMatch[6].padStart(2, '0');
          updates.idStartDate = `${periodMatch[1]}-${startMonth}-${startDay}`;
          updates.idEndDate = `${periodMatch[4]}-${endMonth}-${endDay}`;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到有效期', { 
            startDate: updates.idStartDate,
            endDate: updates.idEndDate
          });
        }
      }
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates.name = name;
          hasValidData = true;
        }
      }
      
      if (ocrData.idNumber) {
        const cleanIdNumber = ocrData.idNumber.replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates.idNumber = cleanIdNumber;
          hasValidData = true;
        }
      }
      
      if (ocrData.address && ocrData.address.trim()) {
        updates.idAddress = ocrData.address.trim();
        hasValidData = true;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      logger.info('[共借人OCR] 准备填充表单数据', { 
        side, 
        updateCount: Object.keys(updates).length,
        hasValidData
      });
      this.setData(updates);
      logger.info('[共借人OCR] 表单数据填充完成', { side, updates });
      
      if (!hasValidData) {
        logger.warn('[共借人OCR] 识别结果中没有有效数据', { side, ocrData });
        wx.showToast({
          title: '识别失败，请手动填写',
          icon: 'none',
          duration: 2000
        });
      }
    } else {
      logger.warn('[共借人OCR] 没有可填充的数据', { side, ocrData });
      wx.showToast({
        title: '识别失败，请手动填写',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 预览身份证正面
  previewIdCardFront() {
    const imagePath = this.data.idCardFront;
    if (!imagePath) {
      wx.showToast({
        title: '请先上传身份证正面',
        icon: 'none'
      });
      return;
    }
    
    const urls = [];
    if (this.data.idCardFront) urls.push(this.data.idCardFront);
    if (this.data.idCardBack) urls.push(this.data.idCardBack);
    
    wx.previewImage({
      current: imagePath,
      urls: urls.length > 0 ? urls : [imagePath]
    });
  },

  // 预览身份证反面
  previewIdCardBack() {
    const imagePath = this.data.idCardBack;
    if (!imagePath) {
      wx.showToast({
        title: '请先上传身份证反面',
        icon: 'none'
      });
      return;
    }
    
    const urls = [];
    if (this.data.idCardFront) urls.push(this.data.idCardFront);
    if (this.data.idCardBack) urls.push(this.data.idCardBack);
    
    wx.previewImage({
      current: imagePath,
      urls: urls.length > 0 ? urls : [imagePath]
    });
  },

  // 删除身份证正面（同时删除服务器上的图片文件）
  deleteIdCardFront(e) {
    // catchtap 已经阻止冒泡，不需要再调用 stopPropagation
    const imageUrl = this.data.idCardFront;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除身份证正面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({ 
            idCardFront: '',
            // 清除相关OCR数据
            name: '',
            idNumber: '',
            idAddress: ''
          });
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除身份证反面（同时删除服务器上的图片文件）
  deleteIdCardBack(e) {
    // catchtap 已经阻止冒泡，不需要再调用 stopPropagation
    const imageUrl = this.data.idCardBack;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除身份证反面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({ 
            idCardBack: '',
            // 清除相关OCR数据
            idStartDate: '',
            idEndDate: '长期' // 恢复默认值
          });
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除营业执照（同时删除服务器上的图片文件）
  deleteBusinessLicense(e) {
    // catchtap 已经阻止冒泡，不需要再调用 stopPropagation
    const imageUrl = this.data.businessLicense;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除营业执照照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({ businessLicense: '' });
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 上传营业执照（使用通用上传接口）
  uploadBusinessLicense() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...', mask: true });
        
        // 使用通用上传接口上传营业执照
        const orderId = wx.getStorageSync('currentOrderId');
        wx.$upload.uploadOrderFile(tempFilePath, 'coBorrower-businessLicense', orderId)
          .then((result) => {
            wx.hideLoading();
            that.setData({ businessLicense: result.url });
            wx.showToast({ title: '上传成功', icon: 'success' });
          })
          .catch((err) => {
            wx.hideLoading();
            logger.error('[营业执照上传] 失败', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
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

  onAgentMobileInput(e) {
    this.setData({ agentMobile: e.detail.value });
  },

  // 选择证件类型
  selectIdType() {
    if (this.data.readonly) {
      return;
    }
    this.setData({
      showPicker: true,
      pickerTitle: '选择证件类型',
      pickerOptions: this.data.idTypeOptions,
      pickerCurrentValue: this.data.idType,
      pickerField: 'idType'
    });
  },

  // 个人证件生效日期改变
  onIdStartDateChange(e) {
    this.setData({
      idStartDate: e.detail.value
    });
  },

  // 个人证件有效期改变
  onIdEndDateChange(e) {
    this.setData({
      idEndDate: e.detail.value
    });
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
    if (this.data.readonly) {
      return;
    }
    this.setData({
      showPicker: true,
      pickerTitle: '选择与主借人关系',
      pickerOptions: this.data.relationshipOptions,
      pickerCurrentValue: this.data.relationship,
      pickerField: 'relationship'
    });
  },

  // 选择婚姻状况
  selectMaritalStatus() {
    if (this.data.readonly) {
      return;
    }
    this.setData({
      showPicker: true,
      pickerTitle: '选择婚姻状况',
      pickerOptions: this.data.maritalStatusOptions,
      pickerCurrentValue: this.data.maritalStatus,
      pickerField: 'maritalStatus'
    });
  },

  // 统一选择器相关方法
  hidePicker() {
    this.setData({ showPicker: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  stopScroll() {
    // 阻止滚动穿透
    return false;
  },

  onPickerItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const value = this.data.pickerOptions[index];
    const field = this.data.pickerField;
    
    this.setData({
      [field]: value,
      showPicker: false
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 删除共借人数据
  deleteData() {
    const that = this;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除共借人信息吗？删除后将无法恢复。',
      confirmText: '确认删除',
      cancelText: '取消',
      confirmColor: '#ff6f6f',
      success: (res) => {
        if (res.confirm) {
          const orderId = wx.getStorageSync('currentOrderId');
          if (!orderId) {
            wx.showToast({ title: '订单ID缺失', icon: 'none' });
            return;
          }

          wx.showLoading({ title: '删除中...', mask: true });

          // 调用后端删除接口
          const req = wx.$request;
          
          // 先查询共借人ID
          req.get(`/public/orders/${orderId}/coBorrower/list`)
            .then((response) => {
              const result = response.data;
              if (result && result.success && result.data && result.data.length > 0) {
                const coBorrowerId = result.data[0].id;
                
                // 调用删除接口
                return req.delete(`/public/orders/${orderId}/coBorrower/${coBorrowerId}`);
              } else {
                throw new Error('未找到共借人数据');
              }
            })
            .then((response) => {
              wx.hideLoading();
              const result = response.data;
              
              if (result && result.success) {
                logger.info('[共借人] 删除成功', result);
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                
                // 清空本地存储
                wx.removeStorageSync('orderFormData_step3');
                
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                logger.error('[共借人] 删除失败', result);
                wx.showToast({
                  title: result.message || '删除失败',
                  icon: 'none'
                });
              }
            })
            .catch((err) => {
              wx.hideLoading();
              logger.error('[共借人] 删除异常', err);
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 保存
  async save() {
    // 只读模式下不允许保存
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式，无法保存',
        icon: 'none'
      });
      return;
    }
    
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
    } else if (this.data.borrowerType === 'company') {
      // 对公类型验证
      if (!this.data.businessLicense) {
        wx.showToast({ title: '请上传营业执照', icon: 'none' });
        return;
      }
      if (!this.data.companyName) {
        wx.showToast({ title: '请填写公司名称', icon: 'none' });
        return;
      }
      // 验证经办人信息（使用个人信息字段）
      if (!this.data.idCardFront || !this.data.idCardBack) {
        wx.showToast({ title: '请上传经办人身份证照片', icon: 'none' });
        return;
      }
      if (!this.data.name) {
        wx.showToast({ title: '请填写经办人姓名', icon: 'none' });
        return;
      }
      if (!this.data.phone) {
        wx.showToast({ title: '请填写经办人手机号', icon: 'none' });
        return;
      }
      if (!this.data.idNumber) {
        wx.showToast({ title: '请填写经办人证件号码', icon: 'none' });
        return;
      }
    }

    // 构建共借人数据（根据类型只传递对应的字段）
    const coBorrowerData = {
      borrowerType: this.data.borrowerType
    };

    if (this.data.borrowerType === 'personal') {
      // 个人类型：只传递个人信息字段
      coBorrowerData.idCardFront = this.data.idCardFront;
      coBorrowerData.idCardBack = this.data.idCardBack;
      coBorrowerData.idType = this.data.idType;
      coBorrowerData.name = this.data.name;
      coBorrowerData.phone = this.data.phone;
      coBorrowerData.idNumber = this.data.idNumber;
      coBorrowerData.idStartDate = this.data.idStartDate;
      coBorrowerData.idEndDate = this.data.idEndDate;
      coBorrowerData.idAddress = this.data.idAddress;
      coBorrowerData.residenceArea = this.data.residenceArea;
      coBorrowerData.detailAddress = this.data.detailAddress;
      coBorrowerData.relationship = this.data.relationship;
      coBorrowerData.maritalStatus = this.data.maritalStatus;
    } else if (this.data.borrowerType === 'company') {
      // 对公类型：传递公司信息和个人信息（作为经办人信息）
      coBorrowerData.businessLicense = this.data.businessLicense;
      coBorrowerData.companyName = this.data.companyName;
      coBorrowerData.companyCreditCode = this.data.companyCreditCode;
      coBorrowerData.companyArea = this.data.companyArea;
      coBorrowerData.companyAddress = this.data.companyAddress;
      coBorrowerData.agentMobile = this.data.agentMobile;
      
      // 个人信息（经办人）
      coBorrowerData.idCardFront = this.data.idCardFront;
      coBorrowerData.idCardBack = this.data.idCardBack;
      coBorrowerData.idType = this.data.idType;
      coBorrowerData.name = this.data.name;
      coBorrowerData.phone = this.data.phone;
      coBorrowerData.idNumber = this.data.idNumber;
      coBorrowerData.idStartDate = this.data.idStartDate;
      coBorrowerData.idEndDate = this.data.idEndDate;
      coBorrowerData.idAddress = this.data.idAddress;
      coBorrowerData.relationship = this.data.relationship;
    }

    // 调用后端接口保存
    const orderId = wx.getStorageSync('currentOrderId');
    if (!orderId) {
      wx.showToast({ title: '订单ID缺失，请先完成前面步骤', icon: 'none', duration: 2000 });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      const req = wx.$request;
      // 统一调用 save 接口，后端会自动判断新增或更新
      const response = await req.post(`/public/orders/${orderId}/coBorrower/save`, coBorrowerData);
      
      wx.hideLoading();
      
      // 注意：request.js 返回的是完整的响应对象 { statusCode, data }
      // 后端返回的数据在 response.data 中
      const result = response.data;
      
      if (result && result.success) {
        logger.info('[共借人] 保存成功', result);
        // 保存返回的ID
        if (result.data && result.data.id) {
          this._coBorrowerId = result.data.id;
        }
        
        // 保存成功后清理本地缓存，避免影响下一个订单
        wx.removeStorageSync('orderFormData_step3');
        
        wx.showToast({
          title: result.message || '保存成功',
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


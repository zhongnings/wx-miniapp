// 内联 logger
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args)
};

const dictManager = require('../../../../utils/dict-manager');

Page({
  data: {
    // 共借人类型：personal-个人，company-对公
    borrowerType: 'personal',
    
    // 个人信息
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
    agentPhone: '',
    agentIdCardFront: '',
    agentIdCardBack: '',
    agentIdType: '',
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
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE
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
    if (!this.data.agentIdType && dictData.id_type && dictData.id_type.length > 0) {
      updates.agentIdType = dictData.id_type[0];
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
        // 保存共借人ID，用于更新
        this._coBorrowerId = coBorrower.id;
        // 映射后端数据到页面
        this.setData({
          borrowerType: coBorrower.borrowerType || 'personal',
          // 个人信息
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
          // 对公信息
          businessLicense: coBorrower.businessLicense || '',
          companyName: coBorrower.companyName || '',
          companyCreditCode: coBorrower.companyCreditCode || '',
          companyArea: coBorrower.companyArea || '',
          companyAddress: coBorrower.companyAddress || '',
          agentPhone: coBorrower.agentPhone || '',
          agentIdCardFront: coBorrower.agentIdCardFront || '',
          agentIdCardBack: coBorrower.agentIdCardBack || '',
          agentIdType: coBorrower.agentIdType || '身份证',
          agentName: coBorrower.agentName || '',
          agentPhone2: coBorrower.agentPhone2 || '',
          agentIdNumber: coBorrower.agentIdNumber || '',
          agentIdStartDate: coBorrower.agentIdStartDate || '',
          agentIdEndDate: coBorrower.agentIdEndDate || '长期',
          agentIdAddress: coBorrower.agentIdAddress || '',
          companyRelationship: coBorrower.companyRelationship || '',
          notaryDocuments: coBorrower.notaryDocuments || []
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
  // personType: 'coBorrower' 表示共借人，'agent' 表示经办人
  chooseIdCardImage(field, imageType, personType = 'coBorrower') {
    const that = this;
    logger.info('[共借人OCR] 开始选择身份证图片', { field, imageType, personType });
    
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
            that.uploadIdCardImageWithOcr(finalPath, imageType, personType)
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
                  
                  // 解析OCR结果并填充表单（经办人和共借人使用不同的字段前缀）
                  that.parseOcrResult(ocrData, actualSide, personType);
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
  // personType: 'coBorrower' 表示共借人本人，'agent' 表示经办人
  uploadIdCardImageWithOcr(imagePath, imageType, personType = 'coBorrower') {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    const orderId = wx.getStorageSync('currentOrderId');
    // 根据 personType 获取对应的身份证号
    const idNumber = personType === 'agent' ? (this.data.agentIdNumber || '') : (this.data.idNumber || '');

    // 使用全局上传工具，传入 personType 区分共借人和经办人
    const uploadUtil = wx.$upload;
    const finalPersonType = personType === 'agent' ? 'coBorrower-agent' : 'coBorrower';
    return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType, finalPersonType);
  },

  // 解析OCR结果并填充表单
  // personType: 'coBorrower' 表示共借人本人，'agent' 表示经办人
  parseOcrResult(ocrData, side, personType = 'coBorrower') {
    logger.info('[共借人OCR] 开始解析OCR结果', { side, personType, ocrDataKeys: Object.keys(ocrData || {}) });
    const updates = {};
    let hasValidData = false;
    
    // 根据 personType 确定字段前缀
    const prefix = personType === 'agent' ? 'agent' : '';
    
    if (side === 'front') {
      // 解析人像面信息：姓名、身份证号、地址
      logger.debug('[共借人OCR] 解析身份证人像面信息', { ocrData, personType });
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates[prefix ? `${prefix}Name` : 'name'] = name;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到姓名', { name, personType });
        }
      }
      
      const idNumber = ocrData.id || ocrData.idNumber;
      if (idNumber) {
        const cleanIdNumber = String(idNumber).replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates[prefix ? `${prefix}IdNumber` : 'idNumber'] = cleanIdNumber;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到身份证号', { 
            original: idNumber, 
            cleaned: cleanIdNumber,
            personType
          });
        }
      }
      
      const address = ocrData.addr || ocrData.address;
      if (address && address.trim()) {
        const addr = address.trim();
        updates[prefix ? `${prefix}IdAddress` : 'idAddress'] = addr;
        hasValidData = true;
        logger.info('[共借人OCR] 识别到证件地址', { address: addr, personType });
      }
      
    } else if (side === 'back') {
      // 解析国徽面信息：有效期
      logger.debug('[共借人OCR] 解析身份证国徽面信息', { ocrData, personType });
      
      const validPeriod = ocrData.valid_date || ocrData.validPeriod || ocrData.validDate;
      if (validPeriod) {
        logger.debug('[共借人OCR] 解析有效期', { validPeriod, personType });
        
        const periodMatch = validPeriod.match(/(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?\s*[-至]\s*(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?/);
        if (periodMatch) {
          const startMonth = periodMatch[2].padStart(2, '0');
          const startDay = periodMatch[3].padStart(2, '0');
          const endMonth = periodMatch[5].padStart(2, '0');
          const endDay = periodMatch[6].padStart(2, '0');
          updates[prefix ? `${prefix}IdStartDate` : 'idStartDate'] = `${periodMatch[1]}-${startMonth}-${startDay}`;
          updates[prefix ? `${prefix}IdEndDate` : 'idEndDate'] = `${periodMatch[4]}-${endMonth}-${endDay}`;
          hasValidData = true;
          logger.info('[共借人OCR] 识别到有效期', { 
            startDate: updates[prefix ? `${prefix}IdStartDate` : 'idStartDate'],
            endDate: updates[prefix ? `${prefix}IdEndDate` : 'idEndDate'],
            personType
          });
        }
      }
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates[prefix ? `${prefix}Name` : 'name'] = name;
          hasValidData = true;
        }
      }
      
      if (ocrData.idNumber) {
        const cleanIdNumber = ocrData.idNumber.replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates[prefix ? `${prefix}IdNumber` : 'idNumber'] = cleanIdNumber;
          hasValidData = true;
        }
      }
      
      if (ocrData.address && ocrData.address.trim()) {
        updates[prefix ? `${prefix}IdAddress` : 'idAddress'] = ocrData.address.trim();
        hasValidData = true;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      logger.info('[共借人OCR] 准备填充表单数据', { 
        side, 
        personType,
        updateCount: Object.keys(updates).length,
        hasValidData
      });
      this.setData(updates);
      logger.info('[共借人OCR] 表单数据填充完成', { side, personType, updates });
      
      if (!hasValidData) {
        logger.warn('[共借人OCR] 识别结果中没有有效数据', { side, personType, ocrData });
        wx.showToast({
          title: '识别失败，请手动填写',
          icon: 'none',
          duration: 2000
        });
      }
    } else {
      logger.warn('[共借人OCR] 没有可填充的数据', { side, personType, ocrData });
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
            idEndDate: ''
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

  // 删除经办人身份证正面（同时删除服务器上的图片文件）
  deleteAgentIdCardFront(e) {
    // catchtap 已经阻止冒泡，不需要再调用 stopPropagation
    const imageUrl = this.data.agentIdCardFront;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除经办人身份证正面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({ agentIdCardFront: '' });
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除经办人身份证反面（同时删除服务器上的图片文件）
  deleteAgentIdCardBack(e) {
    // catchtap 已经阻止冒泡，不需要再调用 stopPropagation
    const imageUrl = this.data.agentIdCardBack;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除经办人身份证反面照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 先删除服务器上的图片文件
          const orderId = wx.getStorageSync('currentOrderId');
          if (imageUrl && orderId) {
            wx.$upload.deleteImageByUrl(imageUrl, orderId);
          }
          
          // 清除页面数据
          this.setData({ agentIdCardBack: '' });
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

  // 上传经办人身份证正面（复用身份证上传逻辑）
  uploadAgentIdCardFront() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseIdCardImage('agentIdCardFront', 'idFront', 'agent');
  },

  // 上传经办人身份证反面（复用身份证上传逻辑）
  uploadAgentIdCardBack() {
    if (this.data.readonly) {
      wx.showToast({
        title: '当前为只读模式',
        icon: 'none'
      });
      return;
    }
    this.chooseIdCardImage('agentIdCardBack', 'idBack', 'agent');
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

  selectAgentIdType() {
    if (this.data.readonly) {
      return;
    }
    this.setData({
      showPicker: true,
      pickerTitle: '选择证件类型',
      pickerOptions: this.data.idTypeOptions,
      pickerCurrentValue: this.data.agentIdType,
      pickerField: 'agentIdType'
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

  // 经办人证件生效日期改变
  onAgentIdStartDateChange(e) {
    this.setData({
      agentIdStartDate: e.detail.value
    });
  },

  // 经办人证件有效期改变
  onAgentIdEndDateChange(e) {
    this.setData({
      agentIdEndDate: e.detail.value
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

  selectCompanyRelationship() {
    if (this.data.readonly) {
      return;
    }
    this.setData({
      showPicker: true,
      pickerTitle: '选择与主借人关系',
      pickerOptions: this.data.relationshipOptions,
      pickerCurrentValue: this.data.companyRelationship,
      pickerField: 'companyRelationship'
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
      // 对公类型：传递公司信息和经办人信息
      coBorrowerData.businessLicense = this.data.businessLicense;
      coBorrowerData.companyName = this.data.companyName;
      coBorrowerData.companyCreditCode = this.data.companyCreditCode;
      coBorrowerData.companyArea = this.data.companyArea;
      coBorrowerData.companyAddress = this.data.companyAddress;
      coBorrowerData.agentPhone = this.data.agentPhone;
      coBorrowerData.agentIdCardFront = this.data.agentIdCardFront;
      coBorrowerData.agentIdCardBack = this.data.agentIdCardBack;
      coBorrowerData.agentIdType = this.data.agentIdType;
      coBorrowerData.agentName = this.data.agentName;
      coBorrowerData.agentPhone2 = this.data.agentPhone2;
      coBorrowerData.agentIdNumber = this.data.agentIdNumber;
      coBorrowerData.agentIdStartDate = this.data.agentIdStartDate;
      coBorrowerData.agentIdEndDate = this.data.agentIdEndDate;
      coBorrowerData.agentIdAddress = this.data.agentIdAddress;
      coBorrowerData.companyRelationship = this.data.companyRelationship;
      coBorrowerData.notaryDocuments = uploadedNotaryDocs.length > 0 ? uploadedNotaryDocs : this.data.notaryDocuments;
    }

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
      let response;
      
      // 如果有 _coBorrowerId，说明是编辑模式，调用更新接口
      if (this._coBorrowerId) {
        response = await req.put(`/public/orders/${orderId}/coBorrower/${this._coBorrowerId}`, coBorrowerData);
      } else {
        // 否则是新增模式，调用新增接口
        response = await req.post(`/public/orders/${orderId}/coBorrower/add`, coBorrowerData);
      }
      
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


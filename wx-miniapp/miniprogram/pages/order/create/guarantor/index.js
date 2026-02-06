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
    // 担保人类型：personal-个人，company-对公
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
    logger.info('担保人页面加载', options);
    
    // 加载担保人数据（从后端或本地）
    this.loadData();

    this.setData({
      idFrontPlaceholder: wx.$placeholders.ID_FRONT,
      idBackPlaceholder: wx.$placeholders.ID_BACK,
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE
    });
  },

  // 加载担保人数据
  async loadData() {
    const orderId = wx.getStorageSync('currentOrderId');
    if (!orderId) {
      logger.warn('[担保人] 订单ID缺失，尝试从本地加载');
      this.loadFromLocal();
      return;
    }

    wx.showLoading({ title: '加载中...', mask: true });

    try {
      const req = wx.$request;
      const response = await req.get(`/public/orders/${orderId}/guarantor/list`);
      
      wx.hideLoading();
      
      // 注意：request.js 返回的是完整的响应对象 { statusCode, data }
      // 后端返回的数据在 response.data 中
      const result = response.data;
      
      // 后端返回 { success: true, data: [...], total: 1 }
      // 取第一个担保人（当前只支持一个）
      if (result && result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const guarantor = result.data[0];
        logger.info('[担保人] 从后端加载成功', guarantor);
        // 保存担保人ID，用于更新
        this._guarantorId = guarantor.id;
        // 映射后端数据到页面
        this.setData({
          borrowerType: guarantor.borrowerType || 'personal',
          // 个人信息
          idCardFront: guarantor.idCardFront || '',
          idCardBack: guarantor.idCardBack || '',
          idType: guarantor.idType || '身份证',
          name: guarantor.name || '',
          phone: guarantor.phone || '',
          idNumber: guarantor.idNumber || '',
          idStartDate: guarantor.idStartDate || '',
          idEndDate: guarantor.idEndDate || '长期',
          idAddress: guarantor.idAddress || '',
          residenceArea: guarantor.residenceArea || '',
          detailAddress: guarantor.detailAddress || '',
          relationship: guarantor.relationship || '',
          maritalStatus: guarantor.maritalStatus || '',
          // 对公信息
          businessLicense: guarantor.businessLicense || '',
          companyName: guarantor.companyName || '',
          companyCreditCode: guarantor.companyCreditCode || '',
          companyArea: guarantor.companyArea || '',
          companyAddress: guarantor.companyAddress || '',
          agentPhone: guarantor.agentPhone || '',
          agentIdCardFront: guarantor.agentIdCardFront || '',
          agentIdCardBack: guarantor.agentIdCardBack || '',
          agentIdType: guarantor.agentIdType || '身份证',
          agentName: guarantor.agentName || '',
          agentPhone2: guarantor.agentPhone2 || '',
          agentIdNumber: guarantor.agentIdNumber || '',
          agentIdStartDate: guarantor.agentIdStartDate || '',
          agentIdEndDate: guarantor.agentIdEndDate || '长期',
          agentIdAddress: guarantor.agentIdAddress || '',
          companyRelationship: guarantor.companyRelationship || '',
          notaryDocuments: guarantor.notaryDocuments || []
        });
      } else {
        logger.info('[担保人] 后端无数据，尝试从本地加载');
        this.loadFromLocal();
      }
    } catch (err) {
      wx.hideLoading();
      logger.error('[担保人] 加载失败，尝试从本地加载', err);
      this.loadFromLocal();
    }
  },

  // 从本地存储加载
  loadFromLocal() {
    const savedData = wx.getStorageSync('orderFormData_step4');
    if (savedData && savedData.guarantor) {
      const data = savedData.guarantor;
      logger.info('[担保人] 从本地加载成功', data);
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
    this.chooseIdCardImage('idCardFront', 'idFront');
  },

  // 上传身份证反面（复用step2逻辑：上传+OCR+预览）
  uploadIdCardBack() {
    this.chooseIdCardImage('idCardBack', 'idBack');
  },

  // 选择身份证图片并上传+OCR识别
  // personType: 'guarantor' 表示担保人，'agent' 表示经办人
  chooseIdCardImage(field, imageType, personType = 'guarantor') {
    const that = this;
    logger.info('[担保人OCR] 开始选择身份证图片', { field, imageType, personType });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const fileSize = res.tempFiles?.[0]?.size || 0;
        logger.info('[担保人OCR] 选择图片成功', { field, imageType, filePath: tempFilePath, fileSize });

        // 如果大于2MB先压缩
        that.handleImageWithCompress(tempFilePath, fileSize)
          .then(({ path: finalPath, size: finalSize }) => {
            logger.info('[担保人OCR] 处理后图片', { finalPath, finalSize });
            
            // 上传图片到服务器（后端会自动进行OCR识别）
            wx.showLoading({ title: '上传中...', mask: true });
            that.uploadIdCardImageWithOcr(finalPath, imageType, personType)
              .then((result) => {
                const uploadUrl = result.url || result;
                logger.info('[担保人上传] 图片上传成功', { uploadUrl, hasOcr: !!result.ocr });
                
                // 显示上传后的图片URL
                that.setData({
                  [field]: uploadUrl
                });
                
                // 如果后端返回了OCR结果，直接使用
                if (result.ocr && result.ocrSuccess) {
                  const ocrData = result.ocr;
                  const ocrType = ocrData.type;
                  const actualSide = (ocrType === 'Front' || ocrType === 'front') ? 'front' : 'back';
                  
                  logger.info('[担保人OCR] 后端已返回OCR结果，开始解析', { 
                    ocrType, 
                    actualSide,
                    ocrDataKeys: Object.keys(ocrData || {})
                  });
                  wx.hideLoading();
                  
                  // 解析OCR结果并填充表单（经办人和担保人使用不同的字段前缀）
                  that.parseOcrResult(ocrData, actualSide, personType);
                  wx.showToast({
                    title: '识别成功',
                    icon: 'success',
                    duration: 1500
                  });
                } else if (result.ocrSuccess === false) {
                  logger.warn('[担保人OCR] 后端OCR识别失败，但文件已上传', { 
                    error: result.ocrError 
                  });
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，识别失败，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                } else {
                  logger.warn('[担保人OCR] 后端未返回OCR结果');
                  wx.hideLoading();
                  wx.showToast({
                    title: '上传成功，未识别，请手动填写',
                    icon: 'none',
                    duration: 2000
                  });
                }
              })
              .catch((err) => {
                logger.error('[担保人上传] 图片上传失败', { err });
                wx.hideLoading();
                wx.showToast({
                  title: '图片上传失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              });
          })
          .catch((err) => {
            logger.error('[担保人OCR] 图片处理失败', { err });
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        logger.error('[担保人OCR] 选择图片失败', { field, imageType, error: err });
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

    logger.info('[担保人OCR] 图片超过2MB，开始压缩', { imagePath, size });
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
              logger.info('[担保人OCR] 压缩完成', { compressedPath, size: stat.size });
              resolve({ path: compressedPath, size: stat.size });
            },
            fail: () => {
              logger.warn('[担保人OCR] 无法读取压缩后大小，默认通过', { compressedPath });
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

  // 上传担保人身份证图片（带OCR识别）
  // personType: 'guarantor' 表示担保人本人，'agent' 表示经办人
  uploadIdCardImageWithOcr(imagePath, imageType, personType = 'guarantor') {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    const orderId = wx.getStorageSync('currentOrderId');
    // 根据 personType 获取对应的身份证号
    const idNumber = personType === 'agent' ? (this.data.agentIdNumber || '') : (this.data.idNumber || '');

    // 使用全局上传工具，传入 personType 区分担保人和经办人
    const uploadUtil = wx.$upload;
    const finalPersonType = personType === 'agent' ? 'guarantor-agent' : 'guarantor';
    return uploadUtil.uploadIdCardImage(imagePath, orderId, idNumber, imageType, finalPersonType);
  },

  // 解析OCR结果并填充表单
  // personType: 'guarantor' 表示担保人本人，'agent' 表示经办人
  parseOcrResult(ocrData, side, personType = 'guarantor') {
    logger.info('[担保人OCR] 开始解析OCR结果', { side, personType, ocrDataKeys: Object.keys(ocrData || {}) });
    const updates = {};
    let hasValidData = false;
    
    // 根据 personType 确定字段前缀
    const prefix = personType === 'agent' ? 'agent' : '';
    
    if (side === 'front') {
      // 解析人像面信息：姓名、身份证号、地址
      logger.debug('[担保人OCR] 解析身份证人像面信息', { ocrData, personType });
      
      if (ocrData.name) {
        const name = ocrData.name.trim();
        if (name) {
          updates[prefix ? `${prefix}Name` : 'name'] = name;
          hasValidData = true;
          logger.info('[担保人OCR] 识别到姓名', { name, personType });
        }
      }
      
      const idNumber = ocrData.id || ocrData.idNumber;
      if (idNumber) {
        const cleanIdNumber = String(idNumber).replace(/\s+/g, '').replace(/[^\dXx]/g, '');
        if (cleanIdNumber && cleanIdNumber.length === 18) {
          updates[prefix ? `${prefix}IdNumber` : 'idNumber'] = cleanIdNumber;
          hasValidData = true;
          logger.info('[担保人OCR] 识别到身份证号', { 
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
        logger.info('[担保人OCR] 识别到证件地址', { address: addr, personType });
      }
      
    } else if (side === 'back') {
      // 解析国徽面信息：有效期
      logger.debug('[担保人OCR] 解析身份证国徽面信息', { ocrData, personType });
      
      const validPeriod = ocrData.valid_date || ocrData.validPeriod || ocrData.validDate;
      if (validPeriod) {
        logger.debug('[担保人OCR] 解析有效期', { validPeriod, personType });
        
        const periodMatch = validPeriod.match(/(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?\s*[-至]\s*(\d{4})[年.\-/]?(\d{1,2})[月.\-/]?(\d{1,2})[日]?/);
        if (periodMatch) {
          const startMonth = periodMatch[2].padStart(2, '0');
          const startDay = periodMatch[3].padStart(2, '0');
          const endMonth = periodMatch[5].padStart(2, '0');
          const endDay = periodMatch[6].padStart(2, '0');
          updates[prefix ? `${prefix}IdStartDate` : 'idStartDate'] = `${periodMatch[1]}-${startMonth}-${startDay}`;
          updates[prefix ? `${prefix}IdEndDate` : 'idEndDate'] = `${periodMatch[4]}-${endMonth}-${endDay}`;
          hasValidData = true;
          logger.info('[担保人OCR] 识别到有效期', { 
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
      logger.info('[担保人OCR] 准备填充表单数据', { 
        side, 
        personType,
        updateCount: Object.keys(updates).length,
        hasValidData
      });
      this.setData(updates);
      logger.info('[担保人OCR] 表单数据填充完成', { side, personType, updates });
      
      if (!hasValidData) {
        logger.warn('[担保人OCR] 识别结果中没有有效数据', { side, personType, ocrData });
        wx.showToast({
          title: '识别失败，请手动填写',
          icon: 'none',
          duration: 2000
        });
      }
    } else {
      logger.warn('[担保人OCR] 没有可填充的数据', { side, personType, ocrData });
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
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...', mask: true });
        
        // 使用通用上传接口上传营业执照/房产证
        const orderId = wx.getStorageSync('currentOrderId');
        // 根据类型使用不同的 fileType
        const fileType = that.data.borrowerType === 'property' ? 'guarantor-propertyOwnershipCert' : 'guarantor-businessLicense';
        wx.$upload.uploadOrderFile(tempFilePath, fileType, orderId)
          .then((result) => {
            wx.hideLoading();
            that.setData({ businessLicense: result.url });
            wx.showToast({ title: '上传成功', icon: 'success' });
          })
          .catch((err) => {
            wx.hideLoading();
            logger.error('[营业执照/房产证上传] 失败', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          });
      }
    });
  },

  // 上传经办人身份证正面（复用身份证上传逻辑）
  uploadAgentIdCardFront() {
    this.chooseIdCardImage('agentIdCardFront', 'idFront', 'agent');
  },

  // 上传经办人身份证反面（复用身份证上传逻辑）
  uploadAgentIdCardBack() {
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
    } else if (this.data.borrowerType === 'company') {
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
    } else if (this.data.borrowerType === 'property') {
      if (!this.data.businessLicense) {
        wx.showToast({ title: '请上传房产证', icon: 'none' });
        return;
      }
      if (!this.data.companyCreditCode) {
        wx.showToast({ title: '请填写房产证号码', icon: 'none' });
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

    // 构建担保人数据（根据类型只传递对应的字段）
    const guarantorData = {
      borrowerType: this.data.borrowerType
    };

    if (this.data.borrowerType === 'personal') {
      // 个人类型：只传递个人信息字段
      guarantorData.idCardFront = this.data.idCardFront;
      guarantorData.idCardBack = this.data.idCardBack;
      guarantorData.idType = this.data.idType;
      guarantorData.name = this.data.name;
      guarantorData.phone = this.data.phone;
      guarantorData.idNumber = this.data.idNumber;
      guarantorData.idStartDate = this.data.idStartDate;
      guarantorData.idEndDate = this.data.idEndDate;
      guarantorData.idAddress = this.data.idAddress;
      guarantorData.residenceArea = this.data.residenceArea;
      guarantorData.detailAddress = this.data.detailAddress;
      guarantorData.relationship = this.data.relationship;
      guarantorData.maritalStatus = this.data.maritalStatus;
    } else if (this.data.borrowerType === 'company' || this.data.borrowerType === 'property') {
      // 对公/房产类型：传递公司信息和经办人信息
      guarantorData.businessLicense = this.data.businessLicense;
      guarantorData.companyName = this.data.companyName;
      guarantorData.companyCreditCode = this.data.companyCreditCode;
      guarantorData.companyArea = this.data.companyArea;
      guarantorData.companyAddress = this.data.companyAddress;
      guarantorData.agentPhone = this.data.agentPhone;
      guarantorData.agentIdCardFront = this.data.agentIdCardFront;
      guarantorData.agentIdCardBack = this.data.agentIdCardBack;
      guarantorData.agentIdType = this.data.agentIdType;
      guarantorData.agentName = this.data.agentName;
      guarantorData.agentPhone2 = this.data.agentPhone2;
      guarantorData.agentIdNumber = this.data.agentIdNumber;
      guarantorData.agentIdStartDate = this.data.agentIdStartDate;
      guarantorData.agentIdEndDate = this.data.agentIdEndDate;
      guarantorData.agentIdAddress = this.data.agentIdAddress;
      guarantorData.companyRelationship = this.data.companyRelationship;
      guarantorData.notaryDocuments = uploadedNotaryDocs.length > 0 ? uploadedNotaryDocs : this.data.notaryDocuments;
    }

    // 先保存到本地存储（作为备份）
    wx.setStorageSync('orderFormData_step4', { guarantor: guarantorData });

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
      
      // 如果有 _guarantorId，说明是编辑模式，调用更新接口
      if (this._guarantorId) {
        response = await req.put(`/public/orders/${orderId}/guarantor/${this._guarantorId}`, guarantorData);
      } else {
        // 否则是新增模式，调用新增接口
        response = await req.post(`/public/orders/${orderId}/guarantor/add`, guarantorData);
      }
      
      wx.hideLoading();
      
      // 注意：request.js 返回的是完整的响应对象 { statusCode, data }
      // 后端返回的数据在 response.data 中
      const result = response.data;
      
      if (result && result.success) {
        logger.info('[担保人] 保存成功', result);
        // 保存返回的ID
        if (result.data && result.data.id) {
          this._guarantorId = result.data.id;
        }
        wx.showToast({
          title: result.message || '保存成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        logger.error('[担保人] 保存失败', result);
        wx.showToast({
          title: result.message || '保存失败',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      wx.hideLoading();
      logger.error('[担保人] 保存异常', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

});


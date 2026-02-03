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

    this.setData({
      idFrontPlaceholder: wx.$placeholders.ID_FRONT,
      idBackPlaceholder: wx.$placeholders.ID_BACK,
      businessLicensePlaceholder: wx.$placeholders.BUSINESS_LICENSE
    });
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
      const result = await req.get(`/public/orders/${orderId}/coBorrower/list`);
      
      wx.hideLoading();
      
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
    this.chooseIdCardImage('idCardFront', 'idFront');
  },

  // 上传身份证反面（复用step2逻辑：上传+OCR+预览）
  uploadIdCardBack() {
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

    // 使用全局上传工具，传入 personType='coBorrower' 区分共借人
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
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
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
      let result;
      
      // 如果有 _coBorrowerId，说明是编辑模式，调用更新接口
      if (this._coBorrowerId) {
        result = await req.put(`/public/orders/${orderId}/coBorrower/${this._coBorrowerId}`, coBorrowerData);
      } else {
        // 否则是新增模式，调用新增接口
        result = await req.post(`/public/orders/${orderId}/coBorrower/add`, coBorrowerData);
      }
      
      wx.hideLoading();
      
      if (result && result.success) {
        logger.info('[共借人] 保存成功', result);
        // 保存返回的ID
        if (result.data && result.data.id) {
          this._coBorrowerId = result.data.id;
        }
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


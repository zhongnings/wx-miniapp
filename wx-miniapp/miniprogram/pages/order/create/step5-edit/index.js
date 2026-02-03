// 内联 logger，避免微信小程序预加载时路径解析问题
const DEBUG = true;
const logger = {
  log: (...args) => DEBUG && console.log('[LOG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => DEBUG && console.warn('[WARN]', ...args),
  info: (...args) => DEBUG && console.info('[INFO]', ...args),
  debug: (...args) => DEBUG && console.log('[DEBUG]', ...args),
  request: (url, method, data) => DEBUG && console.log('[REQUEST]', { url, method, data, time: new Date().toLocaleTimeString() }),
  response: (url, statusCode, data) => DEBUG && console.log('[RESPONSE]', { url, statusCode, data, time: new Date().toLocaleTimeString() }),
  table: (data) => DEBUG && console.table(data),
  group: (label, callback) => {
    if (DEBUG) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};

// 引入通用上传工具：统一使用全局挂载的 wx.$upload（在 app.js 中挂载）
const uploadUtil = wx.$upload;

Page({
  data: {
    // 编辑模式：'add' 新增, 'edit' 编辑
    mode: 'add',
    // 编辑时的银行卡索引（仅在编辑模式下使用）
    cardIndex: -1,
    // 表单数据
    formData: {
      holderType: '借款人', // 持卡人类型：借款人/共借人/担保人
      accountName: '', // 账户名（持卡人姓名）
      idType: '身份证', // 开户证件类型：身份证/其他证件
      idNumber: '', // 开户证件号
      bankName: '', // 开卡银行
      cardNumber: '', // 银行卡号
      reservedMobile: '', // 预留手机号
      cardFrontImage: '' // 银行卡正面图片URL
    },
    // 银行列表（常用银行）
    bankList: [
      '中国工商银行', '中国建设银行', '中国农业银行', '中国银行',
      '交通银行', '招商银行', '浦发银行', '中信银行',
      '光大银行', '华夏银行', '民生银行', '广发银行',
      '平安银行', '兴业银行', '邮储银行', '其他银行'
    ]
  },

  getRequest() {
    // 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
    return wx.$request;
  },

  getOrderId() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    return (prevPage && prevPage.data && prevPage.data.orderId)
      ? prevPage.data.orderId
      : wx.getStorageSync('currentOrderId');
  },

  onLoad(options) {
    logger.info('银行卡编辑页面加载', options);
    
    const mode = options.mode || 'add';
    const cardIndex = options.cardIndex ? parseInt(options.cardIndex) : -1;
    
    this.setData({
      mode: mode,
      cardIndex: cardIndex
    });

    // 如果是编辑模式，加载银行卡数据
    if (mode === 'edit' && cardIndex >= 0) {
      this.loadBankCardData(cardIndex);
    } else {
      // 新增模式，尝试从 step2 获取借款人信息
      this.loadBorrowerInfo();
    }
  },

  // 加载银行卡数据（编辑模式）
  loadBankCardData(cardIndex) {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; // 获取上一个页面（step5）
    
    if (prevPage && prevPage.data && prevPage.data.bankCards) {
      const bankCard = prevPage.data.bankCards[cardIndex];
      if (bankCard) {
        this.setData({
          formData: {
            holderType: bankCard.holderType || '借款人',
            accountName: bankCard.cardholderName || '',
            idType: bankCard.idType || '身份证',
            idNumber: bankCard.idNumber || '',
            bankName: bankCard.bankName || '',
            cardNumber: bankCard.cardNumber || '',
            reservedMobile: bankCard.reservedMobile || '',
            cardFrontImage: bankCard.cardFrontImage || ''
          }
        });
        // 保存后端主键，便于单条更新
        this._bankCardId = bankCard.id || bankCard.bankCardId || null;
        logger.info('加载银行卡数据成功', this.data.formData);
      }
    } else {
      // 如果无法从页面栈获取，尝试从本地存储获取
      const savedData = wx.getStorageSync('orderFormData_step5');
      if (savedData && savedData.bankCards && savedData.bankCards[cardIndex]) {
        const bankCard = savedData.bankCards[cardIndex];
        this.setData({
          formData: {
            holderType: bankCard.holderType || '借款人',
            accountName: bankCard.cardholderName || '',
            idType: bankCard.idType || '身份证',
            idNumber: bankCard.idNumber || '',
            bankName: bankCard.bankName || '',
            cardNumber: bankCard.cardNumber || '',
            reservedMobile: bankCard.reservedMobile || '',
            cardFrontImage: bankCard.cardFrontImage || ''
          }
        });
      }
    }
  },

  // 加载借款人信息（新增模式）
  loadBorrowerInfo() {
    const step2Data = wx.getStorageSync('orderFormData_step2') || {};
    if (step2Data.name) {
      this.setData({
        'formData.accountName': step2Data.name,
        'formData.idNumber': step2Data.idNumber || ''
      });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 持卡人类型选择
  onHolderTypeChange(e) {
    const holderType = e.detail.value;
    this.setData({
      'formData.holderType': holderType
    });
    
    // 根据持卡人类型，自动填充账户名和证件号
    if (holderType === '借款人') {
      this.loadBorrowerInfo();
    } else if (holderType === '共借人') {
      const step3Data = wx.getStorageSync('orderFormData_step3') || {};
      if (step3Data.name) {
        this.setData({
          'formData.accountName': step3Data.name,
          'formData.idNumber': step3Data.idNumber || ''
        });
      }
    } else if (holderType === '担保人') {
      const step4Data = wx.getStorageSync('orderFormData_step4') || {};
      if (step4Data.name) {
        this.setData({
          'formData.accountName': step4Data.name,
          'formData.idNumber': step4Data.idNumber || ''
        });
      }
    }
  },

  // 账户名输入
  onAccountNameInput(e) {
    this.setData({
      'formData.accountName': e.detail.value
    });
  },

  // 选择账户名（从已有数据中选择）
  selectAccountName() {
    const holderType = this.data.formData.holderType;
    let name = '';
    let idNumber = '';
    
    if (holderType === '借款人') {
      const step2Data = wx.getStorageSync('orderFormData_step2') || {};
      name = step2Data.name || '';
      idNumber = step2Data.idNumber || '';
    } else if (holderType === '共借人') {
      const step3Data = wx.getStorageSync('orderFormData_step3') || {};
      name = step3Data.name || '';
      idNumber = step3Data.idNumber || '';
    } else if (holderType === '担保人') {
      const step4Data = wx.getStorageSync('orderFormData_step4') || {};
      name = step4Data.name || '';
      idNumber = step4Data.idNumber || '';
    }
    
    if (name) {
      this.setData({
        'formData.accountName': name,
        'formData.idNumber': idNumber || this.data.formData.idNumber
      });
      wx.showToast({
        title: '已自动填充',
        icon: 'success',
        duration: 1500
      });
    } else {
      wx.showToast({
        title: `请先在${holderType}信息步骤填写姓名`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 证件类型选择
  onIdTypeChange(e) {
    const idType = e.detail.value;
    this.setData({
      'formData.idType': idType
    });
  },

  // 证件号输入
  onIdNumberInput(e) {
    this.setData({
      'formData.idNumber': e.detail.value
    });
  },

  // 选择银行
  onBankPickerChange(e) {
    const index = parseInt(e.detail.value);
    if (index >= 0 && index < this.data.bankList.length) {
      const bankName = this.data.bankList[index];
      this.setData({
        'formData.bankName': bankName
      });
    }
  },

  // 银行卡号输入
  onCardNumberInput(e) {
    let value = e.detail.value.replace(/\s/g, ''); // 移除空格
    // 每4位添加一个空格
    value = value.replace(/(.{4})/g, '$1 ').trim();
    this.setData({
      'formData.cardNumber': value
    });
  },

  // 预留手机号输入
  onReservedMobileInput(e) {
    this.setData({
      'formData.reservedMobile': e.detail.value
    });
  },

  // 选择银行卡图片
  chooseBankCardImage() {
    const that = this;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        const fileSize = res.tempFiles?.[0]?.size || 0;
        logger.info('[银行卡编辑] 选择图片成功', { filePath: tempFilePath, fileSize });

        // 如果大于2MB先压缩
        that.handleImageWithCompress(tempFilePath, fileSize)
          .then(({ path: finalPath, size: finalSize }) => {
            logger.info('[银行卡编辑] 处理后图片', { finalPath, finalSize });
            
            // 上传图片到服务器
            wx.showLoading({ title: '上传中...', mask: true });
            that.uploadBankCardImage(finalPath)
              .then((uploadUrl) => {
                logger.info('[银行卡编辑] 图片上传成功', { uploadUrl });
                that.setData({
                  'formData.cardFrontImage': uploadUrl
                });
                wx.hideLoading();
                wx.showToast({
                  title: '上传成功',
                  icon: 'success',
                  duration: 1500
                });
              })
              .catch((err) => {
                logger.error('[银行卡编辑] 图片上传失败', { err });
                wx.hideLoading();
                wx.showToast({
                  title: '图片上传失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              });
          })
          .catch((err) => {
            logger.error('[银行卡编辑] 图片处理失败', { err });
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            });
          });
      },
      fail: (err) => {
        logger.error('[银行卡编辑] 选择图片失败', { error: err });
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览银行卡图片
  previewBankCardImage() {
    const imagePath = this.data.formData.cardFrontImage;
    
    if (!imagePath) {
      wx.showToast({
        title: '请先上传银行卡图片',
        icon: 'none'
      });
      return;
    }
    
    wx.previewImage({
      current: imagePath,
      urls: [imagePath]
    });
  },

  // 图片压缩处理
  handleImageWithCompress(imagePath, size) {
    const LIMIT = 2 * 1024 * 1024; // 2MB
    if (!size || size <= LIMIT) {
      return Promise.resolve({ path: imagePath, size });
    }

    logger.info('[银行卡编辑] 图片超过2MB，开始压缩', { imagePath, size });
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
              logger.info('[银行卡编辑] 压缩完成', { compressedPath, size: stat.size });
              resolve({ path: compressedPath, size: stat.size });
            },
            fail: () => {
              logger.warn('[银行卡编辑] 无法读取压缩后大小，默认通过', { compressedPath });
              resolve({ path: compressedPath, size: LIMIT });
            }
          });
        },
        fail: (err) => {
          logger.error('[银行卡编辑] 压缩失败', err);
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    });
  },

  // 上传银行卡图片（使用通用上传工具，按订单ID归档）
  uploadBankCardImage(imagePath) {
    if (!imagePath) {
      return Promise.reject(new Error('图片路径为空'));
    }

    // 使用当前订单ID作为图片归属主键，可选携带证件号
    const orderId = this.data.orderId || wx.getStorageSync('currentOrderId');
    const step2Data = wx.getStorageSync('orderFormData_step2') || {};
    const idNumber = this.data.formData.idNumber || step2Data.idNumber || '';

    // 使用通用上传工具上传银行卡图片
    return uploadUtil.uploadBankCardImage(imagePath, orderId, idNumber)
      .then(result => {
        const url = result.url || result;
        logger.info('[上传] 银行卡图片上传成功', { 
          orderId,
          idNumber: idNumber ? idNumber.trim() : '',
          url 
        });
        return url;
      })
      .catch(err => {
        logger.error('[上传] 银行卡图片上传失败', { error: err });
        throw err;
      });
  },

  // 表单验证
  validateForm() {
    const formData = this.data.formData;
    
    if (!formData.holderType) {
      wx.showToast({
        title: '请选择持卡人类型',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.accountName || formData.accountName.trim() === '') {
      wx.showToast({
        title: '请填写账户名',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.idType) {
      wx.showToast({
        title: '请选择证件类型',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.idNumber || formData.idNumber.trim() === '') {
      wx.showToast({
        title: '请填写证件号',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.bankName || formData.bankName.trim() === '') {
      wx.showToast({
        title: '请选择开卡银行',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.cardNumber || formData.cardNumber.trim() === '') {
      wx.showToast({
        title: '请填写银行卡号',
        icon: 'none'
      });
      return false;
    }
    
    // 验证银行卡号格式（移除空格后至少16位）
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 16 || cardNumber.length > 19) {
      wx.showToast({
        title: '银行卡号格式不正确',
        icon: 'none'
      });
      return false;
    }
    
    if (!formData.reservedMobile || formData.reservedMobile.trim() === '') {
      wx.showToast({
        title: '请填写预留手机号',
        icon: 'none'
      });
      return false;
    }
    
    // 验证手机号格式
    const mobile = formData.reservedMobile.trim();
    if (!/^1[3-9]\d{9}$/.test(mobile)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 保存
  save() {
    if (!this.validateForm()) {
      return;
    }

    const formData = this.data.formData;
    const bankCard = {
      holderType: formData.holderType,
      cardholderName: formData.accountName,
      idType: formData.idType,
      idNumber: formData.idNumber,
      bankName: formData.bankName,
      cardNumber: formData.cardNumber.replace(/\s/g, ''), // 移除空格
      reservedMobile: formData.reservedMobile,
      cardFrontImage: formData.cardFrontImage
    };

    const orderId = this.getOrderId();
    if (!orderId) {
      wx.showToast({
        title: '缺少订单ID，请先完成前面步骤',
        icon: 'none'
      });
      return;
    }

    // 获取上一个页面（step5）
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.data) {
      let bankCards = prevPage.data.bankCards || [];
      
      if (this.data.mode === 'edit' && this.data.cardIndex >= 0) {
        // 编辑模式：更新指定索引的银行卡
        bankCards[this.data.cardIndex] = bankCard;
      } else {
        // 新增模式：添加到列表
        bankCards.push(bankCard);
      }
      
      // 更新上一个页面的数据
      prevPage.setData({
        bankCards: bankCards
      });
      
      // 保存到本地存储
      prevPage.saveData && prevPage.saveData();
      
      logger.info('银行卡保存成功', { mode: this.data.mode, bankCard });

      // 以 prevPage 最新列表为准写入本地缓存（避免重复 push 导致保存两条）
      const normalizedCards = (bankCards || []).map(c => ({ ...c }));
      wx.setStorageSync('orderFormData_step5', { bankCards: normalizedCards });

      // 单条新增/修改：直接通过全局 wx.$request 调用后端接口
      const req = wx.$request;
      const payload = {
        holderType: bankCard.holderType,
        cardholderName: bankCard.cardholderName,
        idType: bankCard.idType,
        idNumber: bankCard.idNumber,
        bankName: bankCard.bankName,
        cardNumber: bankCard.cardNumber,
        reservedMobile: bankCard.reservedMobile,
        cardFrontImage: bankCard.cardFrontImage
      };

      const doUpload = () => {
        if (payload.cardFrontImage && !/^https?:\/\//i.test(payload.cardFrontImage)) {
          const step2Data = wx.getStorageSync('orderFormData_step2') || {};
          const idNumber = step2Data.idNumber || '';
          return uploadUtil.uploadBankCardImage(payload.cardFrontImage, orderId, idNumber)
            .then(r => {
              payload.cardFrontImage = r.url || r;
            });
        }
        return Promise.resolve();
      };

      wx.showLoading({ title: '保存中...', mask: true });
      doUpload()
        .then(() => {
          if (this.data.mode === 'edit' && this._bankCardId) {
            return req.request({
              url: `/public/orders/${orderId}/bankCards/${this._bankCardId}`,
              method: 'PUT',
              data: payload
            }).then(() => ({ id: this._bankCardId }));
          }
          return req.request({
            url: `/public/orders/${orderId}/bankCards`,
            method: 'POST',
            data: payload
          }).then(res => ({ id: res.data?.id }));
        })
        .then((r) => {
          wx.hideLoading();
          // 将后端 id 回写到列表项，便于后续删除/修改
          const savedId = r && r.id ? r.id : null;
          if (savedId) {
            bankCard.id = savedId;
            this._bankCardId = savedId;
            // 同步回 prevPage 列表
            const pages2 = getCurrentPages();
            const prev2 = pages2[pages2.length - 2];
            if (prev2 && prev2.data && Array.isArray(prev2.data.bankCards)) {
              const list2 = prev2.data.bankCards;
              if (this.data.mode === 'edit' && this.data.cardIndex >= 0) {
                list2[this.data.cardIndex] = bankCard;
              } else {
                // 新增时我们刚才已经 push 过 bankCard，这里只确保带 id
                list2[list2.length - 1] = bankCard;
              }
              prev2.setData({ bankCards: list2 });
              prev2.saveData && prev2.saveData();
            }
          }
          wx.showToast({ title: '保存成功', icon: 'success', duration: 1200 });
          setTimeout(() => wx.navigateBack(), 1200);
        })
        .catch((err) => {
          wx.hideLoading();
          logger.error('保存银行卡到后端失败', err);
          let msg = '保存失败';
          if (err && err.errMsg) msg = err.errMsg;
          if (err && err.message) msg = err.message;
          if (err && err.data && err.data.message) msg = err.data.message;
          wx.showToast({ title: msg, icon: 'none', duration: 3000 });
        });
    } else {
      // 如果无法获取上一个页面，保存到本地存储
      const savedData = wx.getStorageSync('orderFormData_step5') || {};
      let bankCards = savedData.bankCards || [];
      
      if (this.data.mode === 'edit' && this.data.cardIndex >= 0) {
        bankCards[this.data.cardIndex] = bankCard;
      } else {
        bankCards.push(bankCard);
      }
      
      wx.setStorageSync('orderFormData_step5', {
        bankCards: bankCards
      });

      const req = wx.$request;
      const payload = {
        holderType: bankCard.holderType,
        cardholderName: bankCard.cardholderName,
        idType: bankCard.idType,
        idNumber: bankCard.idNumber,
        bankName: bankCard.bankName,
        cardNumber: bankCard.cardNumber,
        reservedMobile: bankCard.reservedMobile,
        cardFrontImage: bankCard.cardFrontImage
      };

      const doUpload = () => {
        if (payload.cardFrontImage && !/^https?:\/\//i.test(payload.cardFrontImage)) {
          const step2Data = wx.getStorageSync('orderFormData_step2') || {};
          const idNumber = step2Data.idNumber || '';
          return uploadUtil.uploadBankCardImage(payload.cardFrontImage, orderId, idNumber)
            .then(r => {
              payload.cardFrontImage = r.url || r;
            });
        }
        return Promise.resolve();
      };

      wx.showLoading({ title: '保存中...', mask: true });
      doUpload()
        .then(() => {
          if (this.data.mode === 'edit' && this._bankCardId) {
            return req.request({
              url: `/public/orders/${orderId}/bankCards/${this._bankCardId}`,
              method: 'PUT',
              data: payload
            }).then(() => ({ id: this._bankCardId }));
          }
          return req.request({
            url: `/public/orders/${orderId}/bankCards`,
            method: 'POST',
            data: payload
          }).then(res => ({ id: res.data?.id }));
        })
        .then((r) => {
          wx.hideLoading();
          const savedId = r && r.id ? r.id : null;
          if (savedId) {
            bankCard.id = savedId;
            this._bankCardId = savedId;
            // 回写本地缓存中最后一条或指定索引
            const savedData = wx.getStorageSync('orderFormData_step5') || {};
            const list = savedData.bankCards || [];
            if (this.data.mode === 'edit' && this.data.cardIndex >= 0) {
              if (list[this.data.cardIndex]) list[this.data.cardIndex].id = savedId;
            } else if (list.length > 0) {
              list[list.length - 1].id = savedId;
            }
            wx.setStorageSync('orderFormData_step5', { bankCards: list });
          }
          wx.showToast({ title: '保存成功', icon: 'success', duration: 1200 });
          setTimeout(() => wx.navigateBack(), 1200);
        })
        .catch((err) => {
          wx.hideLoading();
          logger.error('保存银行卡到后端失败', err);
          let msg = '保存失败';
          if (err && err.errMsg) msg = err.errMsg;
          if (err && err.message) msg = err.message;
          if (err && err.data && err.data.message) msg = err.data.message;
          wx.showToast({ title: msg, icon: 'none', duration: 3000 });
        });
    }
  }
});


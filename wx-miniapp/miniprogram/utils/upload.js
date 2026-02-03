/**
 * 通用文件上传工具
 * 支持身份证图片（自动OCR）、银行卡图片、合同文件等
 */

const logger = {
  info: (...args) => console.log('[上传工具]', ...args),
  error: (...args) => console.error('[上传工具]', ...args),
  warn: (...args) => console.warn('[上传工具]', ...args),
  debug: (...args) => console.log('[上传工具]', ...args)
};

/**
 * 上传文件到服务器
 * @param {Object} options 上传选项
 * @param {string} options.filePath 文件本地路径
 * @param {string} options.orderId 订单ID（用于订单文件上传，创建文件夹）
 * @param {string} options.idNumber 身份证号（可选，仅用于后端记录和OCR解析，不作为目录键）
 * @param {string} options.imageType 文件类型：'idFront'（身份证正面）、'idBack'（身份证反面）、'bankCard'（银行卡）、'contract'（合同）等
 * @param {string} options.bizType 业务类型（用于通用上传，可选）
 * @param {boolean} options.enableOcr 是否启用OCR（可选，默认根据imageType和文件类型自动判断）
 * @returns {Promise<Object>} 返回上传结果，包含url和ocr结果（如果有）
 */
function uploadFile(options) {
  const { filePath, orderId, idNumber, imageType, bizType, enableOcr } = options;

  if (!filePath) {
    return Promise.reject(new Error('文件路径为空'));
  }

  // 如果已经是后端返回的URL，直接返回
  // 注意：微信临时文件路径可能是 http://tmp/... 或 wxfile://...，这些仍需要上传到后端
  if (/^https?:\/\//i.test(filePath) && !/^https?:\/\/tmp\//i.test(filePath)) {
    return Promise.resolve({ url: filePath });
  }

  // 获取请求工具：统一使用全局挂载的 wx.$request（在 app.js 中挂载）
  const req = wx.$request;

  const uploadUrl = (req.BASE_URL || '') + '/public/upload';

  // 构建formData
  // 注意：微信小程序的 wx.uploadFile 的 formData 中所有值都会被转换为字符串
  // 因此布尔值需要显式转换为字符串 "true" 或 "false"
  const formData = {};
  
  // 如果是订单文件上传（有orderId和imageType）
  if (orderId && imageType) {
    formData.orderId = String(orderId);
    if (idNumber) {
      formData.idNumber = idNumber.trim();
    }
    formData.imageType = imageType;
    // 如果明确指定了enableOcr，传递该参数（转换为字符串）
    // 注意：微信小程序的 wx.uploadFile 会将 formData 中的值转换为字符串
    // 因此布尔值需要显式转换为字符串 "true" 或 "false"
    if (enableOcr !== undefined) {
      // 将布尔值或字符串转换为字符串 "true" 或 "false"
      const boolValue = enableOcr === true || enableOcr === 'true' || enableOcr === '1';
      formData.enableOcr = String(boolValue);
    }
  } else if (bizType) {
    // 通用上传（使用bizType）
    // 如果同时有 orderId，文件会保存在订单目录下，但不会触发 OCR
    formData.bizType = bizType;
    if (orderId) {
      formData.orderId = String(orderId);
    }
  }

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: uploadUrl,
      filePath: filePath,
      name: 'file',
      formData: formData,
      success: (res) => {
        try {
          const data = JSON.parse(res.data || '{}');
          // 检查是否有错误信息
          if (data.message) {
            logger.error('[上传] 上传失败', { message: data.message, data });
            reject(new Error(data.message));
            return;
          }
          const url = data.url || data.data?.url;
          if (url) {
            logger.info('[上传] 文件上传成功', { 
              imageType, 
              url,
              hasOcr: !!data.ocr,
              ocrSuccess: data.ocrSuccess
            });
            // 返回完整结果，包含url和ocr信息
            resolve({
              url: url,
              ocr: data.ocr,
              ocrSuccess: data.ocrSuccess,
              ocrError: data.ocrError,
              name: data.name,
              originalName: data.originalName,
              size: data.size
            });
          } else {
            logger.error('[上传] 上传成功但未返回URL', { data });
            reject(new Error('上传成功但未返回URL'));
          }
        } catch (e) {
          logger.error('[上传] 解析响应失败', { error: e, response: res.data });
          reject(new Error('解析上传响应失败: ' + e.message));
        }
      },
      fail: (err) => {
        logger.error('[上传] 上传失败', { error: err });
        const errorMsg = err.errMsg || '上传失败，请重试';
        reject(new Error(errorMsg));
      }
    });
  });
}

/**
 * 上传身份证图片（自动OCR）
 * @param {string} filePath 图片本地路径
 * @param {number|string} orderId 订单ID
 * @param {string} idNumber 身份证号（可选）
 * @param {string} imageType 'idFront' 或 'idBack'
 * @returns {Promise<Object>} 返回上传结果，包含url和ocr结果
 */
function uploadIdCardImage(filePath, orderId, idNumber, imageType) {
  if (!orderId) {
    return Promise.reject(new Error('订单ID缺失'));
  }

  const cleanIdNumber = idNumber ? idNumber.trim() : '';

  return uploadFile({
    filePath: filePath,
    orderId,
    idNumber: cleanIdNumber || undefined,
    imageType: imageType,
    enableOcr: true // 身份证图片明确启用OCR
  });
}

/**
 * 上传银行卡图片（不OCR）
 * @param {string} filePath 图片本地路径
 * @param {number|string} orderId 订单ID
 * @param {string} idNumber 身份证号（可选）
 * @returns {Promise<Object>} 返回上传结果
 */
function uploadBankCardImage(filePath, orderId, idNumber) {
  if (!orderId) {
    return Promise.reject(new Error('订单ID缺失'));
  }

  const cleanIdNumber = idNumber ? idNumber.trim() : '';

  return uploadFile({
    filePath: filePath,
    orderId,
    idNumber: cleanIdNumber || undefined,
    imageType: 'bankCard',
    enableOcr: false // 银行卡图片不进行OCR
  });
}

/**
 * 上传合同文件（PDF等，不OCR）
 * @param {string} filePath 文件本地路径
 * @param {number|string} orderId 订单ID（可选，用于订单目录；如果没有则走通用bizType上传）
 * @param {string} idNumber 身份证号（可选）
 * @returns {Promise<Object>} 返回上传结果
 */
function uploadContractFile(filePath, orderId, idNumber) {
  // 优先走订单目录，其次走通用上传
  if (orderId) {
    const cleanIdNumber = idNumber ? idNumber.trim() : '';
    return uploadFile({
      filePath: filePath,
      orderId,
      idNumber: cleanIdNumber || undefined,
      imageType: 'contract',
      enableOcr: false // 合同文件不进行OCR
    });
  }

  // 通用上传（不使用订单文件夹）
  return uploadFile({
    filePath: filePath,
    bizType: 'contract'
  });
}

/**
 * 通用文件上传（不OCR）
 * @param {string} filePath 文件本地路径
 * @param {string} bizType 业务类型
 * @returns {Promise<Object>} 返回上传结果
 */
function uploadGenericFile(filePath, bizType) {
  return uploadFile({
    filePath: filePath,
    bizType: bizType || 'file'
  });
}

/**
 * 上传订单文件（支持多个文件类型）
 * 使用 bizType 参数走通用上传逻辑，不会触发 OCR
 * @param {string} filePath 文件本地路径
 * @param {string} fileType 文件类型：'notaryDoc'（法人证明书）、'attachment'（附件）等
 * @param {number|string} orderId 订单ID（必需）
 * @returns {Promise<Object>} 返回上传结果
 */
function uploadOrderFile(filePath, fileType, orderId) {
  if (!orderId) {
    logger.error('[上传订单文件] orderId 缺失', { fileType });
    return Promise.reject(new Error('订单ID缺失'));
  }
  
  // 使用 orderId + bizType 组合
  // 后端会走通用上传逻辑：文件保存在订单目录下，文件名为 bizType-时间戳.ext
  // 不会触发 OCR 逻辑
  return uploadFile({
    filePath: filePath,
    orderId,
    bizType: fileType
  });
}

/**
 * 批量上传文件（如果文件还未上传）
 * @param {Array} files 文件列表，每个文件对象包含 {name, originalName, path, url, size}
 * @param {Function} uploadFn 上传函数，接收 filePath 参数
 * @returns {Promise<Array>} 返回上传后的文件列表
 */
async function uploadFilesIfNeeded(files, uploadFn) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadTasks = files.map(file => {
    // 如果文件已经有服务器URL，直接返回
    if (file.url && /^https?:\/\//i.test(file.url)) {
      return Promise.resolve({
        name: file.name,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        id: file.id
      });
    }

    // 否则上传文件
    const filePath = file.path || file.url;
    return uploadFn(filePath).then(result => ({
      name: file.name,
      originalName: file.originalName,
      url: result.url,
      size: file.size
    }));
  });

  return Promise.all(uploadTasks);
}

/**
 * 删除订单文件（通用方法）
 * @param {Object} options 删除选项
 * @param {Object} options.file 文件对象，包含 {id, url}
 * @param {string} options.fileType 文件类型：'notary-documents'（公证材料）、'attachments'（附件）等
 * @param {number|string} options.orderId 订单ID（可选，如果不传则从缓存读取）
 * @returns {Promise<void>}
 */
function deleteOrderFile(options) {
  const { file, fileType, orderId } = options;
  
  const currentOrderId = orderId || wx.getStorageSync('currentOrderId');
  const fileId = file && file.id;
  const hasServerUrl = file && file.url && /^https?:\/\//i.test(file.url);
  
  // 只有文件已上传到服务器时才调用后端删除接口
  if (!currentOrderId || !fileId || !hasServerUrl) {
    logger.info('[删除文件] 临时文件本地删除', { 
      hasUrl: !!file.url, 
      hasId: !!fileId, 
      orderId: currentOrderId 
    });
    return Promise.resolve();
  }
  
  // 文件已入库，调用后端删除接口
  const req = wx.$request;
  wx.showLoading({ title: '删除中...', mask: true });
  
  return req.request({
    url: `/public/orders/${currentOrderId}/${fileType}/${fileId}`,
    method: 'DELETE'
  })
    .then(() => {
      wx.hideLoading();
      logger.info('[删除文件] 后端删除成功', { orderId: currentOrderId, fileId, fileType });
    })
    .catch((err) => {
      wx.hideLoading();
      logger.error('[删除文件] 后端删除失败', { err, orderId: currentOrderId, fileId, fileType });
      wx.showToast({ title: '已本地删除，后端删除失败', icon: 'none', duration: 2500 });
    });
}

module.exports = {
  uploadFile,
  uploadIdCardImage,
  uploadBankCardImage,
  uploadContractFile,
  uploadGenericFile,
  uploadOrderFile,
  uploadFilesIfNeeded,
  deleteOrderFile
};


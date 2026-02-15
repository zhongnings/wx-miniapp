/**
 * 图片缓存工具
 * 用于从服务器加载静态资源并缓存到本地
 * 
 * 注意：由于微信小程序本地存储限制（10MB），不建议预加载大量图片
 * 建议采用按需加载策略，在使用时才下载并缓存
 */

const IMAGE_CACHE_KEY_PREFIX = 'image_cache_';
const CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7天过期

/**
 * 获取缓存的图片路径
 * @param {string} imageUrl - 服务器图片URL
 * @returns {Promise<string>} 本地图片路径
 */
function getCachedImage(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('图片URL为空'));
      return;
    }

    // 生成缓存key
    const cacheKey = IMAGE_CACHE_KEY_PREFIX + encodeURIComponent(imageUrl);
    
    // 检查缓存
    try {
      const cachedData = wx.getStorageSync(cacheKey);
      if (cachedData && cachedData.localPath && cachedData.expireTime > Date.now()) {
        // 验证本地文件是否存在
        const fs = wx.getFileSystemManager();
        try {
          fs.accessSync(cachedData.localPath);
          console.log('[图片缓存] 使用缓存:', imageUrl);
          resolve(cachedData.localPath);
          return;
        } catch (e) {
          // 文件不存在，清除缓存
          wx.removeStorageSync(cacheKey);
        }
      }
    } catch (e) {
      console.warn('[图片缓存] 读取缓存失败:', e);
    }

    // 下载图片
    console.log('[图片缓存] 下载图片:', imageUrl);
    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          const tempPath = res.tempFilePath;
          
          // 尝试保存到本地永久存储（如果失败则直接使用临时路径）
          const fs = wx.getFileSystemManager();
          const savedPath = `${wx.env.USER_DATA_PATH}/cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
          
          try {
            fs.saveFileSync(tempPath, savedPath);
            
            // 保存缓存信息
            try {
              wx.setStorageSync(cacheKey, {
                localPath: savedPath,
                expireTime: Date.now() + CACHE_EXPIRE_TIME
              });
              console.log('[图片缓存] 下载并缓存成功:', imageUrl);
              resolve(savedPath);
            } catch (storageErr) {
              // 存储空间不足，直接使用临时路径（不缓存）
              console.warn('[图片缓存] 存储空间不足，使用临时路径:', storageErr);
              resolve(tempPath);
            }
          } catch (saveErr) {
            // 保存失败，直接使用临时路径
            console.warn('[图片缓存] 保存失败，使用临时路径:', saveErr);
            resolve(tempPath);
          }
        } else {
          reject(new Error(`下载失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('[图片缓存] 下载失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 预加载图片列表
 * @param {Array<string>} imageUrls - 图片URL列表
 * @returns {Promise<Object>} 图片路径映射 { url: localPath }
 * 
 * 注意：不建议预加载大量图片，可能导致存储空间不足
 */
function preloadImages(imageUrls) {
  const promises = imageUrls.map(url => 
    getCachedImage(url)
      .then(localPath => ({ url, localPath, success: true }))
      .catch(err => ({ url, error: err, success: false }))
  );
  
  return Promise.all(promises).then(results => {
    const imageMap = {};
    results.forEach(result => {
      if (result.success) {
        imageMap[result.url] = result.localPath;
      }
    });
    return imageMap;
  });
}

/**
 * 清除过期缓存
 */
function clearExpiredCache() {
  try {
    const info = wx.getStorageInfoSync();
    const now = Date.now();
    let clearedCount = 0;
    
    info.keys.forEach(key => {
      if (key.startsWith(IMAGE_CACHE_KEY_PREFIX)) {
        try {
          const cachedData = wx.getStorageSync(key);
          if (cachedData && cachedData.expireTime < now) {
            // 删除过期文件
            if (cachedData.localPath) {
              const fs = wx.getFileSystemManager();
              try {
                fs.unlinkSync(cachedData.localPath);
              } catch (e) {
                // 文件可能已被删除
              }
            }
            // 删除缓存记录
            wx.removeStorageSync(key);
            clearedCount++;
          }
        } catch (e) {
          // 忽略单个缓存项的错误
        }
      }
    });
    
    if (clearedCount > 0) {
      console.log('[图片缓存] 清除过期缓存:', clearedCount, '项');
    }
  } catch (e) {
    console.error('[图片缓存] 清除缓存失败:', e);
  }
}

/**
 * 清除所有图片缓存
 */
function clearAllCache() {
  try {
    const info = wx.getStorageInfoSync();
    let clearedCount = 0;
    
    info.keys.forEach(key => {
      if (key.startsWith(IMAGE_CACHE_KEY_PREFIX)) {
        try {
          const cachedData = wx.getStorageSync(key);
          if (cachedData && cachedData.localPath) {
            const fs = wx.getFileSystemManager();
            try {
              fs.unlinkSync(cachedData.localPath);
            } catch (e) {
              // 忽略错误
            }
          }
          wx.removeStorageSync(key);
          clearedCount++;
        } catch (e) {
          // 忽略单个缓存项的错误
        }
      }
    });
    
    console.log('[图片缓存] 已清除所有缓存:', clearedCount, '项');
  } catch (e) {
    console.error('[图片缓存] 清除缓存失败:', e);
  }
}

module.exports = {
  getCachedImage,
  preloadImages,
  clearExpiredCache,
  clearAllCache
};


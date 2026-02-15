/**
 * 地区数据缓存管理
 * 在登录后自动预加载省份数据，按需加载城市和区县数据
 */

const regionApi = require('../api/region.js');
const config = require('../config/config');

const CACHE_KEY_PREFIX = 'region_cache_';
const CACHE_EXPIRE_TIME = config.CACHE_EXPIRE_TIME;

class RegionCache {
  constructor() {
    this.memoryCache = {
      provinces: null,
      cities: {},
      districts: {}
    };
  }

  /**
   * 获取缓存键
   */
  getCacheKey(type, code = '') {
    return `${CACHE_KEY_PREFIX}${type}${code ? '_' + code : ''}`;
  }

  /**
   * 从本地存储读取缓存
   */
  getFromStorage(key) {
    try {
      const data = wx.getStorageSync(key);
      if (data && data.expireTime > Date.now()) {
        return data.value;
      }
      // 过期则删除
      wx.removeStorageSync(key);
      return null;
    } catch (e) {
      console.error('读取缓存失败:', e);
      return null;
    }
  }

  /**
   * 保存到本地存储
   */
  saveToStorage(key, value) {
    try {
      wx.setStorageSync(key, {
        value: value,
        expireTime: Date.now() + CACHE_EXPIRE_TIME
      });
    } catch (e) {
      console.error('保存缓存失败:', e);
    }
  }

  /**
   * 预加载省份数据（登录后调用）
   */
  async preloadProvinces() {
    console.log('[RegionCache] 开始预加载省份数据...');
    try {
      const provinces = await this.getProvinces();
      console.log(`[RegionCache] 省份数据预加载完成，共 ${provinces.length} 个省份`);
      return provinces;
    } catch (e) {
      console.error('[RegionCache] 省份数据预加载失败:', e);
      return [];
    }
  }

  /**
   * 获取省份列表
   */
  async getProvinces() {
    // 1. 先从内存缓存读取
    if (this.memoryCache.provinces) {
      console.log('[RegionCache] 从内存缓存读取省份数据');
      return this.memoryCache.provinces;
    }

    // 2. 从本地存储读取
    const cacheKey = this.getCacheKey('provinces');
    const cached = this.getFromStorage(cacheKey);
    if (cached) {
      console.log('[RegionCache] 从本地存储读取省份数据');
      this.memoryCache.provinces = cached;
      return cached;
    }

    // 3. 从服务器加载
    console.log('[RegionCache] 从服务器加载省份数据');
    const provinces = await regionApi.getProvinces();
    
    // 保存到缓存
    this.memoryCache.provinces = provinces;
    this.saveToStorage(cacheKey, provinces);
    
    return provinces;
  }

  /**
   * 获取城市列表
   */
  async getCities(provinceCode) {
    if (!provinceCode) {
      return [];
    }

    // 1. 从内存缓存读取
    if (this.memoryCache.cities[provinceCode]) {
      console.log(`[RegionCache] 从内存缓存读取城市数据: ${provinceCode}`);
      return this.memoryCache.cities[provinceCode];
    }

    // 2. 从本地存储读取
    const cacheKey = this.getCacheKey('cities', provinceCode);
    const cached = this.getFromStorage(cacheKey);
    if (cached) {
      console.log(`[RegionCache] 从本地存储读取城市数据: ${provinceCode}`);
      this.memoryCache.cities[provinceCode] = cached;
      return cached;
    }

    // 3. 从服务器加载
    console.log(`[RegionCache] 从服务器加载城市数据: ${provinceCode}`);
    const cities = await regionApi.getCities(provinceCode);
    
    // 保存到缓存
    this.memoryCache.cities[provinceCode] = cities;
    this.saveToStorage(cacheKey, cities);
    
    return cities;
  }

  /**
   * 获取区县列表
   */
  async getDistricts(cityCode) {
    if (!cityCode) {
      return [];
    }

    // 1. 从内存缓存读取
    if (this.memoryCache.districts[cityCode]) {
      console.log(`[RegionCache] 从内存缓存读取区县数据: ${cityCode}`);
      return this.memoryCache.districts[cityCode];
    }

    // 2. 从本地存储读取
    const cacheKey = this.getCacheKey('districts', cityCode);
    const cached = this.getFromStorage(cacheKey);
    if (cached) {
      console.log(`[RegionCache] 从本地存储读取区县数据: ${cityCode}`);
      this.memoryCache.districts[cityCode] = cached;
      return cached;
    }

    // 3. 从服务器加载
    console.log(`[RegionCache] 从服务器加载区县数据: ${cityCode}`);
    const districts = await regionApi.getDistricts(cityCode);
    
    // 保存到缓存
    this.memoryCache.districts[cityCode] = districts;
    this.saveToStorage(cacheKey, districts);
    
    return districts;
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    console.log('[RegionCache] 清除所有缓存');
    this.memoryCache = {
      provinces: null,
      cities: {},
      districts: {}
    };
    
    // 清除本地存储
    try {
      const res = wx.getStorageInfoSync();
      res.keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          wx.removeStorageSync(key);
        }
      });
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  }

  /**
   * 清除指定省份的城市缓存
   */
  clearCities(provinceCode) {
    delete this.memoryCache.cities[provinceCode];
    const cacheKey = this.getCacheKey('cities', provinceCode);
    wx.removeStorageSync(cacheKey);
  }

  /**
   * 清除指定城市的区县缓存
   */
  clearDistricts(cityCode) {
    delete this.memoryCache.districts[cityCode];
    const cacheKey = this.getCacheKey('districts', cityCode);
    wx.removeStorageSync(cacheKey);
  }
}

// 导出类和单例实例
module.exports = RegionCache;


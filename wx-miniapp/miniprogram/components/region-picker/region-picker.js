/**
 * 省市区选择器组件
 * 使用后端 API 加载数据，支持缓存
 */

// 延迟加载 regionCache，避免在组件初始化时访问 getApp()
let regionCacheModule = null;

function getRegionCacheModule() {
  if (!regionCacheModule) {
    regionCacheModule = require('../../utils/region-cache');
  }
  return regionCacheModule;
}

Component({
  properties: {
    // 是否显示选择器
    show: {
      type: Boolean,
      value: false
    },
    // 选择器标题
    title: {
      type: String,
      value: '选择地区'
    },
    // 当前已选值
    currentValue: {
      type: String,
      value: ''
    }
  },

  data: {
    regionCurrentLevel: 'province',
    selectedProvince: '',
    selectedCity: '',
    selectedDistrict: '',
    selectedProvinceCode: '',
    selectedCityCode: '',
    selectedDistrictCode: '',
    regionSearchKeyword: '',
    regionSearchResults: [],
    regionProvinceGroups: [],
    regionCityList: [],
    regionDistrictList: [],
    regionIndexLetters: [],
    regionIndexActive: '',
    regionScrollIntoView: '',
  },

  lifetimes: {
    attached() {
      this.initProvinceList();
    }
  },

  observers: {
    'show': function(show) {
      if (show) {
        // 只在首次打开时解析当前值和初始化省份列表
        // 不要每次都重置，否则会影响用户的选择状态
        if (!this.data.regionProvinceGroups || this.data.regionProvinceGroups.length === 0) {
          this.parseCurrentValue();
          this.initProvinceList();
        }
      }
    }
  },

  methods: {
    /**
     * 解析当前值
     */
    parseCurrentValue() {
      const currentValue = this.properties.currentValue;
      if (currentValue) {
        // 简单解析
        const parts = currentValue.split(/[省市区县]/);
        let province = '', city = '', district = '';
        if (parts.length >= 1) province = parts[0] + (currentValue.includes('省') ? '省' : '');
        if (parts.length >= 2) city = parts[1] + (currentValue.includes('市') ? '市' : '');
        if (parts.length >= 3) district = parts[2];
        
        this.setData({
          selectedProvince: province,
          selectedCity: city,
          selectedDistrict: district,
          regionCurrentLevel: 'province',
          regionSearchKeyword: '',
        });
      }
    },

    /**
     * 隐藏选择器
     */
    hide() {
      this.triggerEvent('close');
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {},

    /**
     * 阻止滚动穿透
     */
    stopScroll() {
      return false;
    },

    /**
     * 获取地区缓存实例
     */
    getRegionCache() {
      // 优先使用全局缓存实例
      if (wx.$regionCache) {
        return wx.$regionCache;
      }
      // 否则使用本地模块
      const RegionCache = getRegionCacheModule();
      return new RegionCache();
    },

    /**
     * 初始化省份列表（从后端加载）
     */
    async initProvinceList() {
      // 如果已经有数据，不重复加载
      if (this.data.regionProvinceGroups && this.data.regionProvinceGroups.length > 0) {
        console.log('[RegionPicker] 省份数据已存在，跳过加载');
        return;
      }

      try {
        console.log('[RegionPicker] 开始加载省份列表...');
        wx.showLoading({ title: '加载中...', mask: true });
        
        const cache = this.getRegionCache();
        if (!cache) {
          throw new Error('缓存实例未初始化');
        }

        console.log('[RegionPicker] 调用 cache.getProvinces()...');
        const provinces = await cache.getProvinces();
        console.log('[RegionPicker] 获取到省份数据:', provinces);
        
        if (!provinces || provinces.length === 0) {
          throw new Error('省份数据为空');
        }

        console.log('[RegionPicker] 开始分组省份数据...');
        const groups = this.groupProvincesByLetter(provinces);
        const letters = groups.map(g => g.letter);

        console.log('[RegionPicker] 设置数据到页面...', { groups, letters });
        this.setData({
          regionProvinceGroups: groups,
          regionIndexLetters: letters,
        }, () => {
          console.log('[RegionPicker] setData 完成，当前数据:', this.data);
        });
        
        wx.hideLoading();
      } catch (error) {
        console.error('[RegionPicker] 加载省份列表失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    },

    /**
     * 按首字母分组省份
     */
    groupProvincesByLetter(provinces) {
      console.log('[RegionPicker] 开始分组省份，数据:', provinces);
      
      const groups = {};
      const gaoTaiProvinces = []; // 港澳台单独处理
      
      // 按拼音首字母分组
      provinces.forEach(province => {
        // 港澳台单独处理
        if (province.name === '香港' || province.name === '澳门' || province.name === '台湾') {
          gaoTaiProvinces.push(province);
          return;
        }
        
        // 检查 pinyin 字段是否存在
        if (!province.pinyin) {
          console.warn('[RegionPicker] 省份缺少拼音字段:', province);
          return;
        }
        
        const firstChar = province.pinyin.charAt(0).toUpperCase();
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push(province);
      });
      
      // 转换为数组并排序
      const result = Object.keys(groups)
        .sort()
        .map(letter => ({
          letter,
          provinces: groups[letter].sort((a, b) => {
            const pinyinA = a.pinyin || '';
            const pinyinB = b.pinyin || '';
            return pinyinA.localeCompare(pinyinB);
          })
        }));
      
      // 如果有港澳台，添加特殊分组
      if (gaoTaiProvinces.length > 0) {
        // 按顺序：香港、澳门、台湾
        const sortedGaoTai = gaoTaiProvinces.sort((a, b) => {
          const order = { '香港': 1, '澳门': 2, '台湾': 3 };
          return (order[a.name] || 0) - (order[b.name] || 0);
        });
        
        result.push({
          letter: '*',
          provinces: sortedGaoTai,
          isGaoTai: true // 标记为港澳台分组
        });
      }
      
      console.log('[RegionPicker] 分组完成，结果:', result);
      return result;
    },

    /**
     * 地区项点击
     */
    onRegionItemTap(e) {
      const { code, name, fullName, level } = e.currentTarget.dataset;
      console.log('[RegionPicker] 地区项点击:', { code, name, fullName, level });

      // 如果是从搜索结果点击的，先清除搜索关键词
      if (this.data.regionSearchKeyword) {
        this.setData({
          regionSearchKeyword: '',
          regionSearchResults: []
        });
      }

      if (level === 'province') {
        console.log('[RegionPicker] 选择省份:', name, code);
        console.log('[RegionPicker] 当前 regionCurrentLevel:', this.data.regionCurrentLevel);
        
        this.setData({
          selectedProvince: name,
          selectedProvinceCode: code,
          selectedCity: '',
          selectedDistrict: '',
          regionCurrentLevel: 'city',
        }, () => {
          console.log('[RegionPicker] 省份选择 setData 完成');
          console.log('[RegionPicker] 更新后 regionCurrentLevel:', this.data.regionCurrentLevel);
          console.log('[RegionPicker] 更新后完整数据:', this.data);
        });
        
        console.log('[RegionPicker] 开始加载城市...');
        this.loadCityList(code);
      } else if (level === 'city') {
        console.log('[RegionPicker] 选择城市:', name, code);
        this.setData({
          selectedCity: name,
          selectedCityCode: code,
          selectedDistrict: '',
          regionCurrentLevel: 'district',
        });
        this.loadDistrictList(code);
      } else if (level === 'district') {
        console.log('[RegionPicker] 选择区县:', name, code);
        this.setData({
          selectedDistrict: name,
          selectedDistrictCode: code,
        });
        this.onRegionSelected();
      }
    },

    /**
     * 加载城市列表（从后端加载）
     */
    async loadCityList(provinceCode) {
      console.log('[RegionPicker] loadCityList 被调用，provinceCode:', provinceCode);
      try {
        wx.showLoading({ title: '加载中...', mask: true });
        
        const cache = this.getRegionCache();
        console.log('[RegionPicker] 获取缓存实例:', cache);
        
        console.log('[RegionPicker] 调用 cache.getCities...');
        const cities = await cache.getCities(provinceCode);
        console.log('[RegionPicker] 获取到城市数据:', cities);
        
        if (cities.length === 0) {
          console.warn('[RegionPicker] 城市数据为空');
          // 如果没有城市数据，显示提示
          this.setData({
            regionCityList: [
              { code: '000000', name: '暂无数据', fullName: '暂无数据' }
            ]
          });
        } else {
          // 确保每个城市都有 fullName 字段
          const citiesWithFullName = cities.map(city => ({
            ...city,
            fullName: city.fullName || city.name
          }));
          
          console.log('[RegionPicker] 设置城市列表到页面，共', citiesWithFullName.length, '个城市');
          this.setData({
            regionCityList: citiesWithFullName
          }, () => {
            console.log('[RegionPicker] 城市列表 setData 完成');
          });
        }
        
        wx.hideLoading();
      } catch (error) {
        console.error('[RegionPicker] 加载城市列表失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },

    /**
     * 加载区县列表（从后端加载）
     */
    async loadDistrictList(cityCode) {
      try {
        wx.showLoading({ title: '加载中...', mask: true });
        
        const cache = this.getRegionCache();
        const districts = await cache.getDistricts(cityCode);
        
        if (districts.length === 0) {
          // 如果没有区县数据，显示提示
          this.setData({
            regionDistrictList: [
              { code: '000000', name: '暂无数据', fullName: '暂无数据' }
            ]
          });
        } else {
          // 确保每个区县都有 fullName 字段
          const districtsWithFullName = districts.map(district => ({
            ...district,
            fullName: district.fullName || district.name
          }));
          
          this.setData({
            regionDistrictList: districtsWithFullName
          });
        }
        
        wx.hideLoading();
      } catch (error) {
        console.error('[RegionPicker] 加载区县列表失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },

    /**
     * 地区选择完成
     */
    onRegionSelected() {
      const { selectedProvince, selectedCity, selectedDistrict } = this.data;
      const fullAddress = selectedProvince + selectedCity + selectedDistrict;

      this.triggerEvent('confirm', { address: fullAddress });
      this.hide();
    },

    /**
     * 搜索输入
     */
    onRegionSearchInput(e) {
      const keyword = e.detail.value.trim();
      this.setData({
        regionSearchKeyword: keyword,
      });
      
      // 如果关键词为空，清除搜索结果
      if (!keyword) {
        this.setData({
          regionSearchResults: [],
        });
        return;
      }
      
      // 从已加载的省份数据中搜索
      this.searchInLoadedData(keyword);
    },

    /**
     * 在已加载的数据中搜索
     */
    searchInLoadedData(keyword) {
      const results = [];
      const lowerKeyword = keyword.toLowerCase();
      
      // 搜索省份
      if (this.data.regionProvinceGroups && this.data.regionProvinceGroups.length > 0) {
        this.data.regionProvinceGroups.forEach(group => {
          group.provinces.forEach(province => {
            // 匹配名称或拼音
            if (province.name.includes(keyword) || 
                (province.pinyin && province.pinyin.toLowerCase().includes(lowerKeyword))) {
              results.push({
                ...province,
                fullName: province.name,
                level: 'province'
              });
            }
          });
        });
      }
      
      // 搜索城市（如果已加载）
      if (this.data.regionCityList && this.data.regionCityList.length > 0) {
        this.data.regionCityList.forEach(city => {
          if (city.name.includes(keyword) || 
              (city.pinyin && city.pinyin.toLowerCase().includes(lowerKeyword))) {
            results.push({
              ...city,
              fullName: city.fullName || city.name,
              level: 'city'
            });
          }
        });
      }
      
      // 搜索区县（如果已加载）
      if (this.data.regionDistrictList && this.data.regionDistrictList.length > 0) {
        this.data.regionDistrictList.forEach(district => {
          if (district.name.includes(keyword) || 
              (district.pinyin && district.pinyin.toLowerCase().includes(lowerKeyword))) {
            results.push({
              ...district,
              fullName: district.fullName || district.name,
              level: 'district'
            });
          }
        });
      }
      
      console.log('[RegionPicker] 搜索结果:', results);
      this.setData({
        regionSearchResults: results
      });
    },

    /**
     * 清除搜索
     */
    clearRegionSearch() {
      this.setData({
        regionSearchKeyword: '',
        regionSearchResults: [],
      });
    },

    /**
     * 重置到省份选择
     */
    resetRegionToProvince() {
      this.setData({
        regionCurrentLevel: 'province',
        selectedCity: '',
        selectedDistrict: '',
      });
    },

    /**
     * 重置到城市选择
     */
    resetRegionToCity() {
      this.setData({
        regionCurrentLevel: 'city',
        selectedDistrict: '',
      });
    },

    /**
     * 滚动到指定首字母分组
     */
    scrollToRegionGroup(e) {
      const letter = e.currentTarget.dataset.letter;
      this.setData({
        regionScrollIntoView: `region-group-${letter === '*' ? 'star' : letter}`,
        regionIndexActive: letter,
      });
    }
  }
});

/**
 * 省市区选择器混入
 * 使用方法：
 * 1. 在页面JS中引入：const regionPickerMixin = require('../../utils/region-picker-mixin.js');
 * 2. 在Page()中混入：Page({ ...regionPickerMixin, ... })
 * 3. 在WXML中引入选择器模板
 * 4. 在WXSS中引入选择器样式
 */

module.exports = {
  data: {
    // 省市区选择器相关数据
    showRegionPicker: false,
    regionPickerTitle: '选择地区',
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
    currentRegionType: '', // 用于区分不同的地区选择场景
  },

  /**
   * 显示省市区选择器
   * @param {String} title - 选择器标题
   * @param {String} type - 地区类型标识（用于回调时区分）
   * @param {String} currentValue - 当前已选值
   */
  showRegionPicker(title = '选择地区', type = '', currentValue = '') {
    // 解析当前值
    let province = '', city = '', district = '';
    if (currentValue) {
      // 简单解析，实际项目中可能需要更复杂的逻辑
      const parts = currentValue.split(/[省市区县]/);
      if (parts.length >= 1) province = parts[0] + (currentValue.includes('省') ? '省' : '');
      if (parts.length >= 2) city = parts[1] + (currentValue.includes('市') ? '市' : '');
      if (parts.length >= 3) district = parts[2];
    }

    this.setData({
      showRegionPicker: true,
      regionPickerTitle: title,
      currentRegionType: type,
      selectedProvince: province,
      selectedCity: city,
      selectedDistrict: district,
      regionCurrentLevel: 'province',
      regionSearchKeyword: '',
    });

    // 初始化省份列表
    this.initProvinceList();
  },

  /**
   * 隐藏省市区选择器
   */
  hideRegionPicker() {
    this.setData({
      showRegionPicker: false,
      regionSearchKeyword: '',
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {},

  /**
   * 阻止滚动穿透
   */
  stopScroll() {},

  /**
   * 初始化省份列表
   */
  initProvinceList() {
    // 简化的省份数据，实际项目中应该从完整的省市区数据中获取
    const provinces = [
      { code: '110000', name: '北京市' },
      { code: '120000', name: '天津市' },
      { code: '130000', name: '河北省' },
      { code: '140000', name: '山西省' },
      { code: '150000', name: '内蒙古自治区' },
      { code: '210000', name: '辽宁省' },
      { code: '220000', name: '吉林省' },
      { code: '230000', name: '黑龙江省' },
      { code: '310000', name: '上海市' },
      { code: '320000', name: '江苏省' },
      { code: '330000', name: '浙江省' },
      { code: '340000', name: '安徽省' },
      { code: '350000', name: '福建省' },
      { code: '360000', name: '江西省' },
      { code: '370000', name: '山东省' },
      { code: '410000', name: '河南省' },
      { code: '420000', name: '湖北省' },
      { code: '430000', name: '湖南省' },
      { code: '440000', name: '广东省' },
      { code: '450000', name: '广西壮族自治区' },
      { code: '460000', name: '海南省' },
      { code: '500000', name: '重庆市' },
      { code: '510000', name: '四川省' },
      { code: '520000', name: '贵州省' },
      { code: '530000', name: '云南省' },
      { code: '540000', name: '西藏自治区' },
      { code: '610000', name: '陕西省' },
      { code: '620000', name: '甘肃省' },
      { code: '630000', name: '青海省' },
      { code: '640000', name: '宁夏回族自治区' },
      { code: '650000', name: '新疆维吾尔自治区' },
    ];

    // 按首字母分组
    const groups = this.groupProvincesByLetter(provinces);
    const letters = groups.map(g => g.letter);

    this.setData({
      regionProvinceGroups: groups,
      regionIndexLetters: letters,
    });
  },

  /**
   * 按首字母分组省份
   */
  groupProvincesByLetter(provinces) {
    // 简化实现，实际项目中需要使用拼音库
    const letterMap = {
      '北京市': 'B', '天津市': 'T', '河北省': 'H', '山西省': 'S', '内蒙古自治区': 'N',
      '辽宁省': 'L', '吉林省': 'J', '黑龙江省': 'H', '上海市': 'S', '江苏省': 'J',
      '浙江省': 'Z', '安徽省': 'A', '福建省': 'F', '江西省': 'J', '山东省': 'S',
      '河南省': 'H', '湖北省': 'H', '湖南省': 'H', '广东省': 'G', '广西壮族自治区': 'G',
      '海南省': 'H', '重庆市': 'C', '四川省': 'S', '贵州省': 'G', '云南省': 'Y',
      '西藏自治区': 'X', '陕西省': 'S', '甘肃省': 'G', '青海省': 'Q', '宁夏回族自治区': 'N',
      '新疆维吾尔自治区': 'X',
    };

    const grouped = {};
    provinces.forEach(p => {
      const letter = letterMap[p.name] || 'Q';
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(p);
    });

    return Object.keys(grouped).sort().map(letter => ({
      letter,
      provinces: grouped[letter],
    }));
  },

  /**
   * 地区项点击
   */
  onRegionItemTap(e) {
    const { code, name, fullName, level } = e.currentTarget.dataset;

    if (level === 'province') {
      this.setData({
        selectedProvince: name,
        selectedProvinceCode: code,
        selectedCity: '',
        selectedDistrict: '',
        regionCurrentLevel: 'city',
      });
      // 加载城市列表
      this.loadCityList(code);
    } else if (level === 'city') {
      this.setData({
        selectedCity: name,
        selectedCityCode: code,
        selectedDistrict: '',
        regionCurrentLevel: 'district',
      });
      // 加载区县列表
      this.loadDistrictList(code);
    } else if (level === 'district') {
      this.setData({
        selectedDistrict: name,
        selectedDistrictCode: code,
      });
      // 选择完成，回调
      this.onRegionSelected();
    }
  },

  /**
   * 加载城市列表（简化实现）
   */
  loadCityList(provinceCode) {
    // 简化的城市数据，实际项目中应该从完整数据中获取
    const cities = [
      { code: provinceCode + '01', name: '市辖区', fullName: this.data.selectedProvince + '市辖区' },
    ];
    this.setData({
      regionCityList: cities,
    });
  },

  /**
   * 加载区县列表（简化实现）
   */
  loadDistrictList(cityCode) {
    // 简化的区县数据
    const districts = [
      { code: cityCode + '01', name: '区县1', fullName: '区县1' },
      { code: cityCode + '02', name: '区县2', fullName: '区县2' },
    ];
    this.setData({
      regionDistrictList: districts,
    });
  },

  /**
   * 地区选择完成回调
   */
  onRegionSelected() {
    const { selectedProvince, selectedCity, selectedDistrict, currentRegionType } = this.data;
    const fullAddress = selectedProvince + selectedCity + selectedDistrict;

    // 触发自定义回调
    if (this.onRegionPickerConfirm) {
      this.onRegionPickerConfirm(fullAddress, currentRegionType);
    }

    this.hideRegionPicker();
  },

  /**
   * 搜索输入
   */
  onRegionSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({
      regionSearchKeyword: keyword,
    });
    // 实际项目中应该实现搜索逻辑
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
  },
};


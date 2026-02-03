/**
 * 省市区选择器组件
 */
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
        this.parseCurrentValue();
        this.initProvinceList();
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
     * 初始化省份列表
     */
    initProvinceList() {
      const provinces = [
        { code: '110000', name: '北京', pinyin: 'beijing' },
        { code: '120000', name: '天津', pinyin: 'tianjin' },
        { code: '130000', name: '河北', pinyin: 'hebei' },
        { code: '140000', name: '山西', pinyin: 'shanxi' },
        { code: '150000', name: '内蒙古', pinyin: 'neimenggu' },
        { code: '210000', name: '辽宁', pinyin: 'liaoning' },
        { code: '220000', name: '吉林', pinyin: 'jilin' },
        { code: '230000', name: '黑龙江', pinyin: 'heilongjiang' },
        { code: '310000', name: '上海', pinyin: 'shanghai' },
        { code: '320000', name: '江苏', pinyin: 'jiangsu' },
        { code: '330000', name: '浙江', pinyin: 'zhejiang' },
        { code: '340000', name: '安徽', pinyin: 'anhui' },
        { code: '350000', name: '福建', pinyin: 'fujian' },
        { code: '360000', name: '江西', pinyin: 'jiangxi' },
        { code: '370000', name: '山东', pinyin: 'shandong' },
        { code: '410000', name: '河南', pinyin: 'henan' },
        { code: '420000', name: '湖北', pinyin: 'hubei' },
        { code: '430000', name: '湖南', pinyin: 'hunan' },
        { code: '440000', name: '广东', pinyin: 'guangdong' },
        { code: '450000', name: '广西', pinyin: 'guangxi' },
        { code: '460000', name: '海南', pinyin: 'hainan' },
        { code: '500000', name: '重庆', pinyin: 'chongqing' },
        { code: '510000', name: '四川', pinyin: 'sichuan' },
        { code: '520000', name: '贵州', pinyin: 'guizhou' },
        { code: '530000', name: '云南', pinyin: 'yunnan' },
        { code: '540000', name: '西藏', pinyin: 'xizang' },
        { code: '610000', name: '陕西', pinyin: 'shanxi' },
        { code: '620000', name: '甘肃', pinyin: 'gansu' },
        { code: '630000', name: '青海', pinyin: 'qinghai' },
        { code: '640000', name: '宁夏', pinyin: 'ningxia' },
        { code: '650000', name: '新疆', pinyin: 'xinjiang' },
        { code: '710000', name: '台湾', pinyin: 'taiwan' },
        { code: '810000', name: '香港', pinyin: 'xianggang' },
        { code: '820000', name: '澳门', pinyin: 'aomen' }
      ];

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
      const groups = {};
      const gaoTaiProvinces = []; // 港澳台单独处理
      
      // 按拼音首字母分组
      provinces.forEach(province => {
        // 港澳台单独处理
        if (province.name === '香港' || province.name === '澳门' || province.name === '台湾') {
          gaoTaiProvinces.push(province);
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
          provinces: groups[letter].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
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
      
      return result;
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
        this.loadCityList(code);
      } else if (level === 'city') {
        this.setData({
          selectedCity: name,
          selectedCityCode: code,
          selectedDistrict: '',
          regionCurrentLevel: 'district',
        });
        this.loadDistrictList(code);
      } else if (level === 'district') {
        this.setData({
          selectedDistrict: name,
          selectedDistrictCode: code,
        });
        this.onRegionSelected();
      }
    },

    /**
     * 加载城市列表
     */
    loadCityList(provinceCode) {
      const provinceName = this.data.selectedProvince;
      console.log('[region-picker] 加载城市列表', { provinceName, provinceCode });
      
      // 清理省份名称，去掉"省"、"市"、"自治区"等后缀
      let provinceKey = provinceName;
      provinceKey = provinceKey.replace(/省$/, '')
                               .replace(/市$/, '')
                               .replace(/自治区$/, '')
                               .replace(/特别行政区$/, '')
                               .replace(/维吾尔自治区$/, '')
                               .replace(/壮族自治区$/, '')
                               .replace(/回族自治区$/, '')
                               .replace(/藏族自治区$/, '');
      
      // 完整的城市数据映射（从step1复制）
      const cityMap = this.getCityMap();
      
      // 尝试多种匹配方式：清理后的key、原始名称
      const cities = cityMap[provinceKey] || 
                      cityMap[provinceName] || 
                      [];
      
      console.log('[region-picker] 城市列表匹配结果', {
        provinceName,
        provinceKey,
        citiesCount: cities.length
      });
      
      if (cities.length === 0) {
        // 如果找不到匹配的城市，显示"暂无数据"
        this.setData({
          regionCityList: [
            { code: '000000', name: '暂无数据', fullName: '暂无数据', province: provinceName }
          ]
        });
      } else {
        this.setData({
          regionCityList: cities
        });
      }
    },

    /**
     * 加载区县列表
     */
    loadDistrictList(cityCode) {
      const cityName = this.data.selectedCity;
      console.log('[region-picker] 加载区县列表', { cityName, cityCode });
      
      // 清理城市名key
      const cityNameKey = cityName.replace('市', '').replace('特别行政区', '').replace('省', '');
      
      // 从getDistrictMap获取完整的区县数据
      const districtMap = this.getDistrictMap();
      const cleanKey = cityNameKey.replace('市', '').replace('特别行政区', '').replace('省', '');
      
      let districts = districtMap[cleanKey] || 
                      districtMap[cityNameKey] ||
                      districtMap[cleanKey + '市'] ||
                      districtMap[cityNameKey + '市'] ||
                      [];
      
      console.log('[region-picker] 区县列表匹配结果', {
        cityName,
        cityNameKey,
        cleanKey,
        districtsCount: districts.length
      });
      
      if (districts.length === 0) {
        districts = [
          { code: cityCode + '01', name: '市辖区', fullName: '市辖区' },
          { code: cityCode + '02', name: '县', fullName: '县' }
        ];
      }

      this.setData({
        regionDistrictList: districts,
      });
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
      const keyword = e.detail.value;
      this.setData({
        regionSearchKeyword: keyword,
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
    },

    getCityMap() {
      return {
        '北京': [
          { code: '110100', name: '北京市', fullName: '北京市', province: '北京' }
        ],
        '天津': [
          { code: '120100', name: '天津市', fullName: '天津市', province: '天津' }
        ],
        '河北': [
          { code: '130100', name: '石家庄', fullName: '石家庄市', province: '河北' },
          { code: '130200', name: '唐山', fullName: '唐山市', province: '河北' },
          { code: '130300', name: '秦皇岛', fullName: '秦皇岛市', province: '河北' },
          { code: '130400', name: '邯郸', fullName: '邯郸市', province: '河北' },
          { code: '130500', name: '邢台', fullName: '邢台市', province: '河北' },
          { code: '130600', name: '保定', fullName: '保定市', province: '河北' },
          { code: '130700', name: '张家口', fullName: '张家口市', province: '河北' },
          { code: '130800', name: '承德', fullName: '承德市', province: '河北' },
          { code: '130900', name: '沧州', fullName: '沧州市', province: '河北' },
          { code: '131000', name: '廊坊', fullName: '廊坊市', province: '河北' },
          { code: '131100', name: '衡水', fullName: '衡水市', province: '河北' }
        ],
        '山西': [
          { code: '140100', name: '太原', fullName: '太原市', province: '山西' },
          { code: '140200', name: '大同', fullName: '大同市', province: '山西' },
          { code: '140300', name: '阳泉', fullName: '阳泉市', province: '山西' },
          { code: '140400', name: '长治', fullName: '长治市', province: '山西' },
          { code: '140500', name: '晋城', fullName: '晋城市', province: '山西' },
          { code: '140600', name: '朔州', fullName: '朔州市', province: '山西' },
          { code: '140700', name: '晋中', fullName: '晋中市', province: '山西' },
          { code: '140800', name: '运城', fullName: '运城市', province: '山西' },
          { code: '140900', name: '忻州', fullName: '忻州市', province: '山西' },
          { code: '141000', name: '临汾', fullName: '临汾市', province: '山西' },
          { code: '141100', name: '吕梁', fullName: '吕梁市', province: '山西' }
        ],
        '内蒙古': [
          { code: '150100', name: '呼和浩特', fullName: '呼和浩特市', province: '内蒙古' },
          { code: '150200', name: '包头', fullName: '包头市', province: '内蒙古' },
          { code: '150300', name: '乌海', fullName: '乌海市', province: '内蒙古' },
          { code: '150400', name: '赤峰', fullName: '赤峰市', province: '内蒙古' },
          { code: '150500', name: '通辽', fullName: '通辽市', province: '内蒙古' },
          { code: '150600', name: '鄂尔多斯', fullName: '鄂尔多斯市', province: '内蒙古' },
          { code: '150700', name: '呼伦贝尔', fullName: '呼伦贝尔市', province: '内蒙古' },
          { code: '150800', name: '巴彦淖尔', fullName: '巴彦淖尔市', province: '内蒙古' },
          { code: '150900', name: '乌兰察布', fullName: '乌兰察布市', province: '内蒙古' }
        ],
        '辽宁': [
          { code: '210100', name: '沈阳', fullName: '沈阳市', province: '辽宁' },
          { code: '210200', name: '大连', fullName: '大连市', province: '辽宁' },
          { code: '210300', name: '鞍山', fullName: '鞍山市', province: '辽宁' },
          { code: '210400', name: '抚顺', fullName: '抚顺市', province: '辽宁' },
          { code: '210500', name: '本溪', fullName: '本溪市', province: '辽宁' },
          { code: '210600', name: '丹东', fullName: '丹东市', province: '辽宁' },
          { code: '210700', name: '锦州', fullName: '锦州市', province: '辽宁' },
          { code: '210800', name: '营口', fullName: '营口市', province: '辽宁' },
          { code: '210900', name: '阜新', fullName: '阜新市', province: '辽宁' },
          { code: '211000', name: '辽阳', fullName: '辽阳市', province: '辽宁' },
          { code: '211100', name: '盘锦', fullName: '盘锦市', province: '辽宁' },
          { code: '211200', name: '铁岭', fullName: '铁岭市', province: '辽宁' },
          { code: '211300', name: '朝阳', fullName: '朝阳市', province: '辽宁' },
          { code: '211400', name: '葫芦岛', fullName: '葫芦岛市', province: '辽宁' }
        ],
        '吉林': [
          { code: '220100', name: '长春', fullName: '长春市', province: '吉林' },
          { code: '220200', name: '吉林', fullName: '吉林市', province: '吉林' },
          { code: '220300', name: '四平', fullName: '四平市', province: '吉林' },
          { code: '220400', name: '辽源', fullName: '辽源市', province: '吉林' },
          { code: '220500', name: '通化', fullName: '通化市', province: '吉林' },
          { code: '220600', name: '白山', fullName: '白山市', province: '吉林' },
          { code: '220700', name: '松原', fullName: '松原市', province: '吉林' },
          { code: '220800', name: '白城', fullName: '白城市', province: '吉林' },
          { code: '222400', name: '延边', fullName: '延边朝鲜族自治州', province: '吉林' }
        ],
        '黑龙江': [
          { code: '230100', name: '哈尔滨', fullName: '哈尔滨市', province: '黑龙江' },
          { code: '230200', name: '齐齐哈尔', fullName: '齐齐哈尔市', province: '黑龙江' },
          { code: '230300', name: '鸡西', fullName: '鸡西市', province: '黑龙江' },
          { code: '230400', name: '鹤岗', fullName: '鹤岗市', province: '黑龙江' },
          { code: '230500', name: '双鸭山', fullName: '双鸭山市', province: '黑龙江' },
          { code: '230600', name: '大庆', fullName: '大庆市', province: '黑龙江' },
          { code: '230700', name: '伊春', fullName: '伊春市', province: '黑龙江' },
          { code: '230800', name: '佳木斯', fullName: '佳木斯市', province: '黑龙江' },
          { code: '230900', name: '七台河', fullName: '七台河市', province: '黑龙江' },
          { code: '231000', name: '牡丹江', fullName: '牡丹江市', province: '黑龙江' },
          { code: '231100', name: '黑河', fullName: '黑河市', province: '黑龙江' },
          { code: '231200', name: '绥化', fullName: '绥化市', province: '黑龙江' }
        ],
        '上海': [
          { code: '310100', name: '上海市', fullName: '上海市', province: '上海' }
        ],
        '江苏': [
          { code: '320100', name: '南京', fullName: '南京市', province: '江苏' },
          { code: '320200', name: '苏州', fullName: '苏州市', province: '江苏' },
          { code: '320300', name: '无锡', fullName: '无锡市', province: '江苏' },
          { code: '320400', name: '徐州', fullName: '徐州市', province: '江苏' },
          { code: '320500', name: '常州', fullName: '常州市', province: '江苏' },
          { code: '320600', name: '南通', fullName: '南通市', province: '江苏' },
          { code: '320700', name: '连云港', fullName: '连云港市', province: '江苏' },
          { code: '320800', name: '淮安', fullName: '淮安市', province: '江苏' },
          { code: '320900', name: '盐城', fullName: '盐城市', province: '江苏' },
          { code: '321000', name: '扬州', fullName: '扬州市', province: '江苏' },
          { code: '321100', name: '镇江', fullName: '镇江市', province: '江苏' },
          { code: '321200', name: '泰州', fullName: '泰州市', province: '江苏' },
          { code: '321300', name: '宿迁', fullName: '宿迁市', province: '江苏' }
        ],
        '浙江': [
          { code: '330100', name: '杭州', fullName: '杭州市', province: '浙江' },
          { code: '330200', name: '宁波', fullName: '宁波市', province: '浙江' },
          { code: '330300', name: '温州', fullName: '温州市', province: '浙江' },
          { code: '330400', name: '嘉兴', fullName: '嘉兴市', province: '浙江' },
          { code: '330500', name: '湖州', fullName: '湖州市', province: '浙江' },
          { code: '330600', name: '绍兴', fullName: '绍兴市', province: '浙江' },
          { code: '330700', name: '金华', fullName: '金华市', province: '浙江' },
          { code: '330800', name: '衢州', fullName: '衢州市', province: '浙江' },
          { code: '330900', name: '舟山', fullName: '舟山市', province: '浙江' },
          { code: '331000', name: '台州', fullName: '台州市', province: '浙江' },
          { code: '331100', name: '丽水', fullName: '丽水市', province: '浙江' }
        ],
        '安徽': [
          { code: '340100', name: '合肥', fullName: '合肥市', province: '安徽' },
          { code: '340200', name: '芜湖', fullName: '芜湖市', province: '安徽' },
          { code: '340300', name: '蚌埠', fullName: '蚌埠市', province: '安徽' },
          { code: '340400', name: '淮南', fullName: '淮南市', province: '安徽' },
          { code: '340500', name: '马鞍山', fullName: '马鞍山市', province: '安徽' },
          { code: '340600', name: '淮北', fullName: '淮北市', province: '安徽' },
          { code: '340700', name: '铜陵', fullName: '铜陵市', province: '安徽' },
          { code: '340800', name: '安庆', fullName: '安庆市', province: '安徽' },
          { code: '341000', name: '黄山', fullName: '黄山市', province: '安徽' },
          { code: '341100', name: '滁州', fullName: '滁州市', province: '安徽' },
          { code: '341200', name: '阜阳', fullName: '阜阳市', province: '安徽' },
          { code: '341300', name: '宿州', fullName: '宿州市', province: '安徽' },
          { code: '341500', name: '六安', fullName: '六安市', province: '安徽' },
          { code: '341600', name: '亳州', fullName: '亳州市', province: '安徽' },
          { code: '341700', name: '池州', fullName: '池州市', province: '安徽' },
          { code: '341800', name: '宣城', fullName: '宣城市', province: '安徽' }
        ],
        '福建': [
          { code: '350100', name: '福州', fullName: '福州市', province: '福建' },
          { code: '350200', name: '厦门', fullName: '厦门市', province: '福建' },
          { code: '350300', name: '莆田', fullName: '莆田市', province: '福建' },
          { code: '350400', name: '三明', fullName: '三明市', province: '福建' },
          { code: '350500', name: '泉州', fullName: '泉州市', province: '福建' },
          { code: '350600', name: '漳州', fullName: '漳州市', province: '福建' },
          { code: '350700', name: '南平', fullName: '南平市', province: '福建' },
          { code: '350800', name: '龙岩', fullName: '龙岩市', province: '福建' },
          { code: '350900', name: '宁德', fullName: '宁德市', province: '福建' }
        ],
        '江西': [
          { code: '360100', name: '南昌', fullName: '南昌市', province: '江西' },
          { code: '360200', name: '九江', fullName: '九江市', province: '江西' },
          { code: '360300', name: '景德镇', fullName: '景德镇市', province: '江西' },
          { code: '360400', name: '萍乡', fullName: '萍乡市', province: '江西' },
          { code: '360500', name: '新余', fullName: '新余市', province: '江西' },
          { code: '360600', name: '鹰潭', fullName: '鹰潭市', province: '江西' },
          { code: '360700', name: '赣州', fullName: '赣州市', province: '江西' },
          { code: '360800', name: '吉安', fullName: '吉安市', province: '江西' },
          { code: '360900', name: '宜春', fullName: '宜春市', province: '江西' },
          { code: '361000', name: '抚州', fullName: '抚州市', province: '江西' },
          { code: '361100', name: '上饶', fullName: '上饶市', province: '江西' }
        ],
        '山东': [
          { code: '370100', name: '济南', fullName: '济南市', province: '山东' },
          { code: '370200', name: '青岛', fullName: '青岛市', province: '山东' },
          { code: '370300', name: '淄博', fullName: '淄博市', province: '山东' },
          { code: '370400', name: '枣庄', fullName: '枣庄市', province: '山东' },
          { code: '370500', name: '东营', fullName: '东营市', province: '山东' },
          { code: '370600', name: '烟台', fullName: '烟台市', province: '山东' },
          { code: '370700', name: '潍坊', fullName: '潍坊市', province: '山东' },
          { code: '370800', name: '济宁', fullName: '济宁市', province: '山东' },
          { code: '370900', name: '泰安', fullName: '泰安市', province: '山东' },
          { code: '371000', name: '威海', fullName: '威海市', province: '山东' },
          { code: '371100', name: '日照', fullName: '日照市', province: '山东' },
          { code: '371300', name: '临沂', fullName: '临沂市', province: '山东' },
          { code: '371400', name: '德州', fullName: '德州市', province: '山东' },
          { code: '371500', name: '聊城', fullName: '聊城市', province: '山东' },
          { code: '371600', name: '滨州', fullName: '滨州市', province: '山东' },
          { code: '371700', name: '菏泽', fullName: '菏泽市', province: '山东' }
        ],
        '河南': [
          { code: '410100', name: '郑州', fullName: '郑州市', province: '河南' },
          { code: '410200', name: '开封', fullName: '开封市', province: '河南' },
          { code: '410300', name: '洛阳', fullName: '洛阳市', province: '河南' },
          { code: '410400', name: '平顶山', fullName: '平顶山市', province: '河南' },
          { code: '410500', name: '安阳', fullName: '安阳市', province: '河南' },
          { code: '410600', name: '鹤壁', fullName: '鹤壁市', province: '河南' },
          { code: '410700', name: '新乡', fullName: '新乡市', province: '河南' },
          { code: '410800', name: '焦作', fullName: '焦作市', province: '河南' },
          { code: '410900', name: '濮阳', fullName: '濮阳市', province: '河南' },
          { code: '411000', name: '许昌', fullName: '许昌市', province: '河南' },
          { code: '411100', name: '漯河', fullName: '漯河市', province: '河南' },
          { code: '411200', name: '三门峡', fullName: '三门峡市', province: '河南' },
          { code: '411300', name: '南阳', fullName: '南阳市', province: '河南' },
          { code: '411400', name: '商丘', fullName: '商丘市', province: '河南' },
          { code: '411500', name: '信阳', fullName: '信阳市', province: '河南' },
          { code: '411600', name: '周口', fullName: '周口市', province: '河南' },
          { code: '411700', name: '驻马店', fullName: '驻马店市', province: '河南' },
          { code: '419001', name: '济源', fullName: '济源市', province: '河南' }
        ],
        '湖北': [
          { code: '420100', name: '武汉', fullName: '武汉市', province: '湖北' },
          { code: '420200', name: '黄石', fullName: '黄石市', province: '湖北' },
          { code: '420300', name: '十堰', fullName: '十堰市', province: '湖北' },
          { code: '420500', name: '宜昌', fullName: '宜昌市', province: '湖北' },
          { code: '420600', name: '襄阳', fullName: '襄阳市', province: '湖北' },
          { code: '420700', name: '鄂州', fullName: '鄂州市', province: '湖北' },
          { code: '420800', name: '荆门', fullName: '荆门市', province: '湖北' },
          { code: '420900', name: '孝感', fullName: '孝感市', province: '湖北' },
          { code: '421000', name: '荆州', fullName: '荆州市', province: '湖北' },
          { code: '421100', name: '黄冈', fullName: '黄冈市', province: '湖北' },
          { code: '421200', name: '咸宁', fullName: '咸宁市', province: '湖北' },
          { code: '421300', name: '随州', fullName: '随州市', province: '湖北' },
          { code: '422800', name: '恩施', fullName: '恩施土家族苗族自治州', province: '湖北' },
          { code: '429004', name: '仙桃', fullName: '仙桃市', province: '湖北' },
          { code: '429005', name: '潜江', fullName: '潜江市', province: '湖北' },
          { code: '429006', name: '天门', fullName: '天门市', province: '湖北' },
          { code: '429021', name: '神农架', fullName: '神农架林区', province: '湖北' }
        ],
        '湖南': [
          { code: '430100', name: '长沙', fullName: '长沙市', province: '湖南' },
          { code: '430200', name: '株洲', fullName: '株洲市', province: '湖南' },
          { code: '430300', name: '湘潭', fullName: '湘潭市', province: '湖南' },
          { code: '430400', name: '衡阳', fullName: '衡阳市', province: '湖南' },
          { code: '430500', name: '邵阳', fullName: '邵阳市', province: '湖南' },
          { code: '430600', name: '岳阳', fullName: '岳阳市', province: '湖南' },
          { code: '430700', name: '常德', fullName: '常德市', province: '湖南' },
          { code: '430800', name: '张家界', fullName: '张家界市', province: '湖南' },
          { code: '430900', name: '益阳', fullName: '益阳市', province: '湖南' },
          { code: '431000', name: '郴州', fullName: '郴州市', province: '湖南' },
          { code: '431100', name: '永州', fullName: '永州市', province: '湖南' },
          { code: '431200', name: '怀化', fullName: '怀化市', province: '湖南' },
          { code: '431300', name: '娄底', fullName: '娄底市', province: '湖南' },
          { code: '433100', name: '湘西', fullName: '湘西土家族苗族自治州', province: '湖南' }
        ],
        '广东': [
          { code: '440100', name: '广州', fullName: '广州市', province: '广东' },
          { code: '440200', name: '韶关', fullName: '韶关市', province: '广东' },
          { code: '440300', name: '深圳', fullName: '深圳市', province: '广东' },
          { code: '440400', name: '珠海', fullName: '珠海市', province: '广东' },
          { code: '440500', name: '汕头', fullName: '汕头市', province: '广东' },
          { code: '440600', name: '佛山', fullName: '佛山市', province: '广东' },
          { code: '440700', name: '江门', fullName: '江门市', province: '广东' },
          { code: '440800', name: '湛江', fullName: '湛江市', province: '广东' },
          { code: '440900', name: '茂名', fullName: '茂名市', province: '广东' },
          { code: '441200', name: '肇庆', fullName: '肇庆市', province: '广东' },
          { code: '441300', name: '惠州', fullName: '惠州市', province: '广东' },
          { code: '441400', name: '梅州', fullName: '梅州市', province: '广东' },
          { code: '441500', name: '汕尾', fullName: '汕尾市', province: '广东' },
          { code: '441600', name: '河源', fullName: '河源市', province: '广东' },
          { code: '441700', name: '阳江', fullName: '阳江市', province: '广东' },
          { code: '441800', name: '清远', fullName: '清远市', province: '广东' },
          { code: '441900', name: '东莞', fullName: '东莞市', province: '广东' },
          { code: '442000', name: '中山', fullName: '中山市', province: '广东' },
          { code: '445100', name: '潮州', fullName: '潮州市', province: '广东' },
          { code: '445200', name: '揭阳', fullName: '揭阳市', province: '广东' },
          { code: '445300', name: '云浮', fullName: '云浮市', province: '广东' }
        ],
        '广西': [
          { code: '450100', name: '南宁', fullName: '南宁市', province: '广西' },
          { code: '450200', name: '柳州', fullName: '柳州市', province: '广西' },
          { code: '450300', name: '桂林', fullName: '桂林市', province: '广西' },
          { code: '450400', name: '梧州', fullName: '梧州市', province: '广西' },
          { code: '450500', name: '北海', fullName: '北海市', province: '广西' },
          { code: '450600', name: '防城港', fullName: '防城港市', province: '广西' },
          { code: '450700', name: '钦州', fullName: '钦州市', province: '广西' },
          { code: '450800', name: '贵港', fullName: '贵港市', province: '广西' },
          { code: '450900', name: '玉林', fullName: '玉林市', province: '广西' },
          { code: '451000', name: '百色', fullName: '百色市', province: '广西' },
          { code: '451100', name: '贺州', fullName: '贺州市', province: '广西' },
          { code: '451200', name: '河池', fullName: '河池市', province: '广西' },
          { code: '451300', name: '来宾', fullName: '来宾市', province: '广西' },
          { code: '451400', name: '崇左', fullName: '崇左市', province: '广西' }
        ],
        '海南': [
          { code: '460100', name: '海口', fullName: '海口市', province: '海南' },
          { code: '460200', name: '三亚', fullName: '三亚市', province: '海南' }
        ],
        '重庆': [
          { code: '500100', name: '重庆市', fullName: '重庆市', province: '重庆' }
        ],
        '四川': [
          { code: '510100', name: '成都', fullName: '成都市', province: '四川' },
          { code: '510300', name: '自贡', fullName: '自贡市', province: '四川' },
          { code: '510400', name: '攀枝花', fullName: '攀枝花市', province: '四川' },
          { code: '510500', name: '泸州', fullName: '泸州市', province: '四川' },
          { code: '510600', name: '德阳', fullName: '德阳市', province: '四川' },
          { code: '510700', name: '绵阳', fullName: '绵阳市', province: '四川' },
          { code: '510800', name: '广元', fullName: '广元市', province: '四川' },
          { code: '510900', name: '遂宁', fullName: '遂宁市', province: '四川' },
          { code: '511000', name: '内江', fullName: '内江市', province: '四川' },
          { code: '511100', name: '乐山', fullName: '乐山市', province: '四川' },
          { code: '511300', name: '南充', fullName: '南充市', province: '四川' },
          { code: '511400', name: '眉山', fullName: '眉山市', province: '四川' },
          { code: '511500', name: '宜宾', fullName: '宜宾市', province: '四川' },
          { code: '511600', name: '广安', fullName: '广安市', province: '四川' },
          { code: '511700', name: '达州', fullName: '达州市', province: '四川' },
          { code: '511800', name: '雅安', fullName: '雅安市', province: '四川' },
          { code: '511900', name: '巴中', fullName: '巴中市', province: '四川' },
          { code: '512000', name: '资阳', fullName: '资阳市', province: '四川' },
          { code: '513200', name: '阿坝', fullName: '阿坝藏族羌族自治州', province: '四川' },
          { code: '513300', name: '甘孜', fullName: '甘孜藏族自治州', province: '四川' },
          { code: '513400', name: '凉山', fullName: '凉山彝族自治州', province: '四川' }
        ],
        '贵州': [
          { code: '520100', name: '贵阳', fullName: '贵阳市', province: '贵州' },
          { code: '520200', name: '六盘水', fullName: '六盘水市', province: '贵州' },
          { code: '520300', name: '遵义', fullName: '遵义市', province: '贵州' },
          { code: '520400', name: '安顺', fullName: '安顺市', province: '贵州' },
          { code: '520500', name: '毕节', fullName: '毕节市', province: '贵州' },
          { code: '520600', name: '铜仁', fullName: '铜仁市', province: '贵州' },
          { code: '522300', name: '黔西南', fullName: '黔西南布依族苗族自治州', province: '贵州' },
          { code: '522600', name: '黔东南', fullName: '黔东南苗族侗族自治州', province: '贵州' },
          { code: '522700', name: '黔南', fullName: '黔南布依族苗族自治州', province: '贵州' }
        ],
        '云南': [
          { code: '530100', name: '昆明', fullName: '昆明市', province: '云南' },
          { code: '530300', name: '曲靖', fullName: '曲靖市', province: '云南' },
          { code: '530400', name: '玉溪', fullName: '玉溪市', province: '云南' },
          { code: '530500', name: '保山', fullName: '保山市', province: '云南' },
          { code: '530600', name: '昭通', fullName: '昭通市', province: '云南' },
          { code: '530700', name: '丽江', fullName: '丽江市', province: '云南' },
          { code: '530800', name: '普洱', fullName: '普洱市', province: '云南' },
          { code: '530900', name: '临沧', fullName: '临沧市', province: '云南' },
          { code: '532300', name: '楚雄', fullName: '楚雄彝族自治州', province: '云南' },
          { code: '532500', name: '红河', fullName: '红河哈尼族彝族自治州', province: '云南' },
          { code: '532600', name: '文山', fullName: '文山壮族苗族自治州', province: '云南' },
          { code: '532800', name: '西双版纳', fullName: '西双版纳傣族自治州', province: '云南' },
          { code: '532900', name: '大理', fullName: '大理白族自治州', province: '云南' },
          { code: '533100', name: '德宏', fullName: '德宏傣族景颇族自治州', province: '云南' },
          { code: '533300', name: '怒江', fullName: '怒江傈僳族自治州', province: '云南' },
          { code: '533400', name: '迪庆', fullName: '迪庆藏族自治州', province: '云南' }
        ],
        '西藏': [
          { code: '540100', name: '拉萨', fullName: '拉萨市', province: '西藏' },
          { code: '540200', name: '日喀则', fullName: '日喀则市', province: '西藏' },
          { code: '540300', name: '昌都', fullName: '昌都市', province: '西藏' },
          { code: '540400', name: '林芝', fullName: '林芝市', province: '西藏' },
          { code: '540500', name: '山南', fullName: '山南市', province: '西藏' },
          { code: '540600', name: '那曲', fullName: '那曲市', province: '西藏' },
          { code: '542500', name: '阿里', fullName: '阿里地区', province: '西藏' }
        ],
        '陕西': [
          { code: '610100', name: '西安', fullName: '西安市', province: '陕西' },
          { code: '610200', name: '铜川', fullName: '铜川市', province: '陕西' },
          { code: '610300', name: '宝鸡', fullName: '宝鸡市', province: '陕西' },
          { code: '610400', name: '咸阳', fullName: '咸阳市', province: '陕西' },
          { code: '610500', name: '渭南', fullName: '渭南市', province: '陕西' },
          { code: '610600', name: '延安', fullName: '延安市', province: '陕西' },
          { code: '610700', name: '汉中', fullName: '汉中市', province: '陕西' },
          { code: '610800', name: '榆林', fullName: '榆林市', province: '陕西' },
          { code: '610900', name: '安康', fullName: '安康市', province: '陕西' },
          { code: '611000', name: '商洛', fullName: '商洛市', province: '陕西' }
        ],
        '甘肃': [
          { code: '620100', name: '兰州', fullName: '兰州市', province: '甘肃' },
          { code: '620200', name: '嘉峪关', fullName: '嘉峪关市', province: '甘肃' },
          { code: '620300', name: '金昌', fullName: '金昌市', province: '甘肃' },
          { code: '620400', name: '白银', fullName: '白银市', province: '甘肃' },
          { code: '620500', name: '天水', fullName: '天水市', province: '甘肃' },
          { code: '620600', name: '武威', fullName: '武威市', province: '甘肃' },
          { code: '620700', name: '张掖', fullName: '张掖市', province: '甘肃' },
          { code: '620800', name: '平凉', fullName: '平凉市', province: '甘肃' },
          { code: '620900', name: '酒泉', fullName: '酒泉市', province: '甘肃' },
          { code: '621000', name: '庆阳', fullName: '庆阳市', province: '甘肃' },
          { code: '621100', name: '定西', fullName: '定西市', province: '甘肃' },
          { code: '621200', name: '陇南', fullName: '陇南市', province: '甘肃' },
          { code: '622900', name: '临夏', fullName: '临夏回族自治州', province: '甘肃' },
          { code: '623000', name: '甘南', fullName: '甘南藏族自治州', province: '甘肃' }
        ],
        '青海': [
          { code: '630100', name: '西宁', fullName: '西宁市', province: '青海' },
          { code: '630200', name: '海东', fullName: '海东市', province: '青海' },
          { code: '632200', name: '海北', fullName: '海北藏族自治州', province: '青海' },
          { code: '632300', name: '黄南', fullName: '黄南藏族自治州', province: '青海' },
          { code: '632500', name: '海南', fullName: '海南藏族自治州', province: '青海' },
          { code: '632600', name: '果洛', fullName: '果洛藏族自治州', province: '青海' },
          { code: '632700', name: '玉树', fullName: '玉树藏族自治州', province: '青海' },
          { code: '632800', name: '海西', fullName: '海西蒙古族藏族自治州', province: '青海' }
        ],
        '宁夏': [
          { code: '640100', name: '银川', fullName: '银川市', province: '宁夏' },
          { code: '640200', name: '石嘴山', fullName: '石嘴山市', province: '宁夏' },
          { code: '640300', name: '吴忠', fullName: '吴忠市', province: '宁夏' },
          { code: '640400', name: '固原', fullName: '固原市', province: '宁夏' },
          { code: '640500', name: '中卫', fullName: '中卫市', province: '宁夏' }
        ],
        '新疆': [
          { code: '650100', name: '乌鲁木齐', fullName: '乌鲁木齐市', province: '新疆' },
          { code: '650200', name: '克拉玛依', fullName: '克拉玛依市', province: '新疆' },
          { code: '650400', name: '吐鲁番', fullName: '吐鲁番市', province: '新疆' },
          { code: '650500', name: '哈密', fullName: '哈密市', province: '新疆' },
          { code: '652300', name: '昌吉', fullName: '昌吉回族自治州', province: '新疆' },
          { code: '652700', name: '博尔塔拉', fullName: '博尔塔拉蒙古自治州', province: '新疆' },
          { code: '652800', name: '巴音郭楞', fullName: '巴音郭楞蒙古自治州', province: '新疆' },
          { code: '652900', name: '阿克苏', fullName: '阿克苏地区', province: '新疆' },
          { code: '653000', name: '克孜勒苏', fullName: '克孜勒苏柯尔克孜自治州', province: '新疆' },
          { code: '653100', name: '喀什', fullName: '喀什地区', province: '新疆' },
          { code: '653200', name: '和田', fullName: '和田地区', province: '新疆' },
          { code: '654000', name: '伊犁', fullName: '伊犁哈萨克自治州', province: '新疆' },
          { code: '654200', name: '塔城', fullName: '塔城地区', province: '新疆' },
          { code: '654300', name: '阿勒泰', fullName: '阿勒泰地区', province: '新疆' },
          { code: '659001', name: '石河子', fullName: '石河子市', province: '新疆' },
          { code: '659002', name: '阿拉尔', fullName: '阿拉尔市', province: '新疆' },
          { code: '659003', name: '图木舒克', fullName: '图木舒克市', province: '新疆' },
          { code: '659004', name: '五家渠', fullName: '五家渠市', province: '新疆' },
          { code: '659005', name: '北屯', fullName: '北屯市', province: '新疆' },
          { code: '659006', name: '铁门关', fullName: '铁门关市', province: '新疆' },
          { code: '659007', name: '双河', fullName: '双河市', province: '新疆' },
          { code: '659008', name: '可克达拉', fullName: '可克达拉市', province: '新疆' },
          { code: '659009', name: '昆玉', fullName: '昆玉市', province: '新疆' },
          { code: '659010', name: '胡杨河', fullName: '胡杨河市', province: '新疆' }
        ],
        '香港': [
          { code: '810000', name: '香港', fullName: '香港特别行政区', province: '香港' }
        ],
        '澳门': [
          { code: '820000', name: '澳门', fullName: '澳门特别行政区', province: '澳门' }
        ],
        '台湾': [
          { code: '710000', name: '台湾', fullName: '台湾省', province: '台湾' }
        ]
      };
    },

    /**
     * 获取区县数据映射表
     */
    getDistrictMap() {
      return {
        // 直辖市
        '北京': [
          { code: '110101', name: '东城区', fullName: '东城区', city: '北京' },
          { code: '110102', name: '西城区', fullName: '西城区', city: '北京' },
          { code: '110105', name: '朝阳区', fullName: '朝阳区', city: '北京' },
          { code: '110106', name: '丰台区', fullName: '丰台区', city: '北京' },
          { code: '110107', name: '石景山区', fullName: '石景山区', city: '北京' },
          { code: '110108', name: '海淀区', fullName: '海淀区', city: '北京' },
          { code: '110109', name: '门头沟区', fullName: '门头沟区', city: '北京' },
          { code: '110111', name: '房山区', fullName: '房山区', city: '北京' },
          { code: '110112', name: '通州区', fullName: '通州区', city: '北京' },
          { code: '110113', name: '顺义区', fullName: '顺义区', city: '北京' },
          { code: '110114', name: '昌平区', fullName: '昌平区', city: '北京' },
          { code: '110115', name: '大兴区', fullName: '大兴区', city: '北京' },
          { code: '110116', name: '怀柔区', fullName: '怀柔区', city: '北京' },
          { code: '110117', name: '平谷区', fullName: '平谷区', city: '北京' },
          { code: '110118', name: '密云区', fullName: '密云区', city: '北京' },
          { code: '110119', name: '延庆区', fullName: '延庆区', city: '北京' }
        ],
        '上海': [
          { code: '310101', name: '黄浦区', fullName: '黄浦区', city: '上海' },
          { code: '310104', name: '徐汇区', fullName: '徐汇区', city: '上海' },
          { code: '310105', name: '长宁区', fullName: '长宁区', city: '上海' },
          { code: '310106', name: '静安区', fullName: '静安区', city: '上海' },
          { code: '310107', name: '普陀区', fullName: '普陀区', city: '上海' },
          { code: '310109', name: '虹口区', fullName: '虹口区', city: '上海' },
          { code: '310110', name: '杨浦区', fullName: '杨浦区', city: '上海' },
          { code: '310112', name: '闵行区', fullName: '闵行区', city: '上海' },
          { code: '310113', name: '宝山区', fullName: '宝山区', city: '上海' },
          { code: '310114', name: '嘉定区', fullName: '嘉定区', city: '上海' },
          { code: '310115', name: '浦东新区', fullName: '浦东新区', city: '上海' },
          { code: '310116', name: '金山区', fullName: '金山区', city: '上海' },
          { code: '310117', name: '松江区', fullName: '松江区', city: '上海' },
          { code: '310118', name: '青浦区', fullName: '青浦区', city: '上海' },
          { code: '310120', name: '奉贤区', fullName: '奉贤区', city: '上海' },
          { code: '310151', name: '崇明区', fullName: '崇明区', city: '上海' }
        ],
        '天津': [
          { code: '120101', name: '和平区', fullName: '和平区', city: '天津' },
          { code: '120102', name: '河东区', fullName: '河东区', city: '天津' },
          { code: '120103', name: '河西区', fullName: '河西区', city: '天津' },
          { code: '120104', name: '南开区', fullName: '南开区', city: '天津' },
          { code: '120105', name: '河北区', fullName: '河北区', city: '天津' },
          { code: '120106', name: '红桥区', fullName: '红桥区', city: '天津' },
          { code: '120110', name: '东丽区', fullName: '东丽区', city: '天津' },
          { code: '120111', name: '西青区', fullName: '西青区', city: '天津' },
          { code: '120112', name: '津南区', fullName: '津南区', city: '天津' },
          { code: '120113', name: '北辰区', fullName: '北辰区', city: '天津' },
          { code: '120114', name: '武清区', fullName: '武清区', city: '天津' },
          { code: '120115', name: '宝坻区', fullName: '宝坻区', city: '天津' },
          { code: '120116', name: '滨海新区', fullName: '滨海新区', city: '天津' },
          { code: '120117', name: '宁河区', fullName: '宁河区', city: '天津' },
          { code: '120118', name: '静海区', fullName: '静海区', city: '天津' },
          { code: '120119', name: '蓟州区', fullName: '蓟州区', city: '天津' }
        ],
        '重庆': [
          { code: '500101', name: '万州区', fullName: '万州区', city: '重庆' },
          { code: '500102', name: '涪陵区', fullName: '涪陵区', city: '重庆' },
          { code: '500103', name: '渝中区', fullName: '渝中区', city: '重庆' },
          { code: '500104', name: '大渡口区', fullName: '大渡口区', city: '重庆' },
          { code: '500105', name: '江北区', fullName: '江北区', city: '重庆' },
          { code: '500106', name: '沙坪坝区', fullName: '沙坪坝区', city: '重庆' },
          { code: '500107', name: '九龙坡区', fullName: '九龙坡区', city: '重庆' },
          { code: '500108', name: '南岸区', fullName: '南岸区', city: '重庆' },
          { code: '500109', name: '北碚区', fullName: '北碚区', city: '重庆' },
          { code: '500110', name: '綦江区', fullName: '綦江区', city: '重庆' },
          { code: '500111', name: '大足区', fullName: '大足区', city: '重庆' },
          { code: '500112', name: '渝北区', fullName: '渝北区', city: '重庆' },
          { code: '500113', name: '巴南区', fullName: '巴南区', city: '重庆' },
          { code: '500114', name: '黔江区', fullName: '黔江区', city: '重庆' },
          { code: '500115', name: '长寿区', fullName: '长寿区', city: '重庆' },
          { code: '500116', name: '江津区', fullName: '江津区', city: '重庆' },
          { code: '500117', name: '合川区', fullName: '合川区', city: '重庆' },
          { code: '500118', name: '永川区', fullName: '永川区', city: '重庆' },
          { code: '500119', name: '南川区', fullName: '南川区', city: '重庆' },
          { code: '500120', name: '璧山区', fullName: '璧山区', city: '重庆' },
          { code: '500151', name: '铜梁区', fullName: '铜梁区', city: '重庆' },
          { code: '500152', name: '潼南区', fullName: '潼南区', city: '重庆' },
          { code: '500153', name: '荣昌区', fullName: '荣昌区', city: '重庆' },
          { code: '500154', name: '开州区', fullName: '开州区', city: '重庆' },
          { code: '500155', name: '梁平区', fullName: '梁平区', city: '重庆' },
          { code: '500156', name: '武隆区', fullName: '武隆区', city: '重庆' }
        ],
        // 主要城市
        '广州': [
          { code: '440103', name: '荔湾区', fullName: '荔湾区', city: '广州' },
          { code: '440104', name: '越秀区', fullName: '越秀区', city: '广州' },
          { code: '440105', name: '海珠区', fullName: '海珠区', city: '广州' },
          { code: '440106', name: '天河区', fullName: '天河区', city: '广州' },
          { code: '440111', name: '白云区', fullName: '白云区', city: '广州' },
          { code: '440112', name: '黄埔区', fullName: '黄埔区', city: '广州' },
          { code: '440113', name: '番禺区', fullName: '番禺区', city: '广州' },
          { code: '440114', name: '花都区', fullName: '花都区', city: '广州' },
          { code: '440115', name: '南沙区', fullName: '南沙区', city: '广州' },
          { code: '440117', name: '从化区', fullName: '从化区', city: '广州' },
          { code: '440118', name: '增城区', fullName: '增城区', city: '广州' }
        ],
        '深圳': [
          { code: '440303', name: '罗湖区', fullName: '罗湖区', city: '深圳' },
          { code: '440304', name: '福田区', fullName: '福田区', city: '深圳' },
          { code: '440305', name: '南山区', fullName: '南山区', city: '深圳' },
          { code: '440306', name: '宝安区', fullName: '宝安区', city: '深圳' },
          { code: '440307', name: '龙岗区', fullName: '龙岗区', city: '深圳' },
          { code: '440308', name: '盐田区', fullName: '盐田区', city: '深圳' },
          { code: '440309', name: '龙华区', fullName: '龙华区', city: '深圳' },
          { code: '440310', name: '坪山区', fullName: '坪山区', city: '深圳' },
          { code: '440311', name: '光明区', fullName: '光明区', city: '深圳' }
        ],
        '南宁': [
          { code: '450102', name: '兴宁区', fullName: '兴宁区', city: '南宁' },
          { code: '450103', name: '青秀区', fullName: '青秀区', city: '南宁' },
          { code: '450105', name: '江南区', fullName: '江南区', city: '南宁' },
          { code: '450107', name: '西乡塘区', fullName: '西乡塘区', city: '南宁' },
          { code: '450108', name: '良庆区', fullName: '良庆区', city: '南宁' },
          { code: '450109', name: '邕宁区', fullName: '邕宁区', city: '南宁' },
          { code: '450110', name: '武鸣区', fullName: '武鸣区', city: '南宁' },
          { code: '450123', name: '隆安县', fullName: '隆安县', city: '南宁' },
          { code: '450124', name: '马山县', fullName: '马山县', city: '南宁' },
          { code: '450125', name: '上林县', fullName: '上林县', city: '南宁' },
          { code: '450126', name: '宾阳县', fullName: '宾阳县', city: '南宁' },
          { code: '450127', name: '横县', fullName: '横县', city: '南宁' }
        ],
        '柳州': [
          { code: '450202', name: '城中区', fullName: '城中区', city: '柳州' },
          { code: '450203', name: '鱼峰区', fullName: '鱼峰区', city: '柳州' },
          { code: '450204', name: '柳南区', fullName: '柳南区', city: '柳州' },
          { code: '450205', name: '柳北区', fullName: '柳北区', city: '柳州' },
          { code: '450206', name: '柳江区', fullName: '柳江区', city: '柳州' },
          { code: '450222', name: '柳城县', fullName: '柳城县', city: '柳州' },
          { code: '450223', name: '鹿寨县', fullName: '鹿寨县', city: '柳州' },
          { code: '450224', name: '融安县', fullName: '融安县', city: '柳州' },
          { code: '450225', name: '融水苗族自治县', fullName: '融水苗族自治县', city: '柳州' },
          { code: '450226', name: '三江侗族自治县', fullName: '三江侗族自治县', city: '柳州' }
        ],
        '桂林': [
          { code: '450302', name: '秀峰区', fullName: '秀峰区', city: '桂林' },
          { code: '450303', name: '叠彩区', fullName: '叠彩区', city: '桂林' },
          { code: '450304', name: '象山区', fullName: '象山区', city: '桂林' },
          { code: '450305', name: '七星区', fullName: '七星区', city: '桂林' },
          { code: '450311', name: '雁山区', fullName: '雁山区', city: '桂林' },
          { code: '450312', name: '临桂区', fullName: '临桂区', city: '桂林' },
          { code: '450321', name: '阳朔县', fullName: '阳朔县', city: '桂林' },
          { code: '450323', name: '灵川县', fullName: '灵川县', city: '桂林' },
          { code: '450324', name: '全州县', fullName: '全州县', city: '桂林' },
          { code: '450325', name: '兴安县', fullName: '兴安县', city: '桂林' },
          { code: '450326', name: '永福县', fullName: '永福县', city: '桂林' },
          { code: '450327', name: '灌阳县', fullName: '灌阳县', city: '桂林' },
          { code: '450328', name: '龙胜各族自治县', fullName: '龙胜各族自治县', city: '桂林' },
          { code: '450329', name: '资源县', fullName: '资源县', city: '桂林' },
          { code: '450330', name: '平乐县', fullName: '平乐县', city: '桂林' },
          { code: '450332', name: '恭城瑶族自治县', fullName: '恭城瑶族自治县', city: '桂林' },
          { code: '450381', name: '荔浦市', fullName: '荔浦市', city: '桂林' }
        ],
        '杭州': [
          { code: '330102', name: '上城区', fullName: '上城区', city: '杭州' },
          { code: '330105', name: '拱墅区', fullName: '拱墅区', city: '杭州' },
          { code: '330106', name: '西湖区', fullName: '西湖区', city: '杭州' },
          { code: '330108', name: '滨江区', fullName: '滨江区', city: '杭州' },
          { code: '330109', name: '萧山区', fullName: '萧山区', city: '杭州' },
          { code: '330110', name: '余杭区', fullName: '余杭区', city: '杭州' },
          { code: '330111', name: '富阳区', fullName: '富阳区', city: '杭州' },
          { code: '330112', name: '临安区', fullName: '临安区', city: '杭州' },
          { code: '330113', name: '临平区', fullName: '临平区', city: '杭州' },
          { code: '330114', name: '钱塘区', fullName: '钱塘区', city: '杭州' },
          { code: '330122', name: '桐庐县', fullName: '桐庐县', city: '杭州' },
          { code: '330127', name: '淳安县', fullName: '淳安县', city: '杭州' },
          { code: '330182', name: '建德市', fullName: '建德市', city: '杭州' }
        ],
        '南京': [
          { code: '320102', name: '玄武区', fullName: '玄武区', city: '南京' },
          { code: '320104', name: '秦淮区', fullName: '秦淮区', city: '南京' },
          { code: '320105', name: '建邺区', fullName: '建邺区', city: '南京' },
          { code: '320106', name: '鼓楼区', fullName: '鼓楼区', city: '南京' },
          { code: '320111', name: '浦口区', fullName: '浦口区', city: '南京' },
          { code: '320113', name: '栖霞区', fullName: '栖霞区', city: '南京' },
          { code: '320114', name: '雨花台区', fullName: '雨花台区', city: '南京' },
          { code: '320115', name: '江宁区', fullName: '江宁区', city: '南京' },
          { code: '320116', name: '六合区', fullName: '六合区', city: '南京' },
          { code: '320117', name: '溧水区', fullName: '溧水区', city: '南京' },
          { code: '320118', name: '高淳区', fullName: '高淳区', city: '南京' }
        ],
        '成都': [
          { code: '510104', name: '锦江区', fullName: '锦江区', city: '成都' },
          { code: '510105', name: '青羊区', fullName: '青羊区', city: '成都' },
          { code: '510106', name: '金牛区', fullName: '金牛区', city: '成都' },
          { code: '510107', name: '武侯区', fullName: '武侯区', city: '成都' },
          { code: '510108', name: '成华区', fullName: '成华区', city: '成都' },
          { code: '510112', name: '龙泉驿区', fullName: '龙泉驿区', city: '成都' },
          { code: '510113', name: '青白江区', fullName: '青白江区', city: '成都' },
          { code: '510114', name: '新都区', fullName: '新都区', city: '成都' },
          { code: '510115', name: '温江区', fullName: '温江区', city: '成都' },
          { code: '510116', name: '双流区', fullName: '双流区', city: '成都' },
          { code: '510117', name: '郫都区', fullName: '郫都区', city: '成都' },
          { code: '510118', name: '新津区', fullName: '新津区', city: '成都' },
          { code: '510121', name: '金堂县', fullName: '金堂县', city: '成都' },
          { code: '510129', name: '大邑县', fullName: '大邑县', city: '成都' },
          { code: '510131', name: '蒲江县', fullName: '蒲江县', city: '成都' },
          { code: '510181', name: '都江堰市', fullName: '都江堰市', city: '成都' },
          { code: '510182', name: '彭州市', fullName: '彭州市', city: '成都' },
          { code: '510183', name: '邛崃市', fullName: '邛崃市', city: '成都' },
          { code: '510184', name: '崇州市', fullName: '崇州市', city: '成都' },
          { code: '510185', name: '简阳市', fullName: '简阳市', city: '成都' }
        ],
        '武汉': [
          { code: '420102', name: '江岸区', fullName: '江岸区', city: '武汉' },
          { code: '420103', name: '江汉区', fullName: '江汉区', city: '武汉' },
          { code: '420104', name: '硚口区', fullName: '硚口区', city: '武汉' },
          { code: '420105', name: '汉阳区', fullName: '汉阳区', city: '武汉' },
          { code: '420106', name: '武昌区', fullName: '武昌区', city: '武汉' },
          { code: '420107', name: '青山区', fullName: '青山区', city: '武汉' },
          { code: '420111', name: '洪山区', fullName: '洪山区', city: '武汉' },
          { code: '420112', name: '东西湖区', fullName: '东西湖区', city: '武汉' },
          { code: '420113', name: '汉南区', fullName: '汉南区', city: '武汉' },
          { code: '420114', name: '蔡甸区', fullName: '蔡甸区', city: '武汉' },
          { code: '420115', name: '江夏区', fullName: '江夏区', city: '武汉' },
          { code: '420116', name: '黄陂区', fullName: '黄陂区', city: '武汉' },
          { code: '420117', name: '新洲区', fullName: '新洲区', city: '武汉' }
        ],
        '西安': [
          { code: '610102', name: '新城区', fullName: '新城区', city: '西安' },
          { code: '610103', name: '碑林区', fullName: '碑林区', city: '西安' },
          { code: '610104', name: '莲湖区', fullName: '莲湖区', city: '西安' },
          { code: '610111', name: '灞桥区', fullName: '灞桥区', city: '西安' },
          { code: '610112', name: '未央区', fullName: '未央区', city: '西安' },
          { code: '610113', name: '雁塔区', fullName: '雁塔区', city: '西安' },
          { code: '610114', name: '阎良区', fullName: '阎良区', city: '西安' },
          { code: '610115', name: '临潼区', fullName: '临潼区', city: '西安' },
          { code: '610116', name: '长安区', fullName: '长安区', city: '西安' },
          { code: '610117', name: '高陵区', fullName: '高陵区', city: '西安' },
          { code: '610118', name: '鄠邑区', fullName: '鄠邑区', city: '西安' },
          { code: '610122', name: '蓝田县', fullName: '蓝田县', city: '西安' },
          { code: '610124', name: '周至县', fullName: '周至县', city: '西安' }
        ],
        '合肥': [
          { code: '340102', name: '瑶海区', fullName: '瑶海区', city: '合肥' },
          { code: '340103', name: '庐阳区', fullName: '庐阳区', city: '合肥' },
          { code: '340104', name: '蜀山区', fullName: '蜀山区', city: '合肥' },
          { code: '340111', name: '包河区', fullName: '包河区', city: '合肥' },
          { code: '340121', name: '长丰县', fullName: '长丰县', city: '合肥' },
          { code: '340122', name: '肥东县', fullName: '肥东县', city: '合肥' },
          { code: '340123', name: '肥西县', fullName: '肥西县', city: '合肥' },
          { code: '340124', name: '庐江县', fullName: '庐江县', city: '合肥' },
          { code: '340181', name: '巢湖市', fullName: '巢湖市', city: '合肥' }
        ],
        '石家庄': [
          { code: '130102', name: '长安区', fullName: '长安区', city: '石家庄' },
          { code: '130104', name: '桥西区', fullName: '桥西区', city: '石家庄' },
          { code: '130105', name: '新华区', fullName: '新华区', city: '石家庄' },
          { code: '130107', name: '井陉矿区', fullName: '井陉矿区', city: '石家庄' },
          { code: '130108', name: '裕华区', fullName: '裕华区', city: '石家庄' },
          { code: '130109', name: '藁城区', fullName: '藁城区', city: '石家庄' },
          { code: '130110', name: '鹿泉区', fullName: '鹿泉区', city: '石家庄' },
          { code: '130111', name: '栾城区', fullName: '栾城区', city: '石家庄' },
          { code: '130121', name: '井陉县', fullName: '井陉县', city: '石家庄' },
          { code: '130123', name: '正定县', fullName: '正定县', city: '石家庄' },
          { code: '130125', name: '行唐县', fullName: '行唐县', city: '石家庄' },
          { code: '130126', name: '灵寿县', fullName: '灵寿县', city: '石家庄' },
          { code: '130127', name: '高邑县', fullName: '高邑县', city: '石家庄' },
          { code: '130128', name: '深泽县', fullName: '深泽县', city: '石家庄' },
          { code: '130129', name: '赞皇县', fullName: '赞皇县', city: '石家庄' },
          { code: '130130', name: '无极县', fullName: '无极县', city: '石家庄' },
          { code: '130131', name: '平山县', fullName: '平山县', city: '石家庄' },
          { code: '130132', name: '元氏县', fullName: '元氏县', city: '石家庄' },
          { code: '130133', name: '赵县', fullName: '赵县', city: '石家庄' },
          { code: '130181', name: '辛集市', fullName: '辛集市', city: '石家庄' },
          { code: '130183', name: '晋州市', fullName: '晋州市', city: '石家庄' },
          { code: '130184', name: '新乐市', fullName: '新乐市', city: '石家庄' }
        ],
        '太原': [
          { code: '140105', name: '小店区', fullName: '小店区', city: '太原' },
          { code: '140106', name: '迎泽区', fullName: '迎泽区', city: '太原' },
          { code: '140107', name: '杏花岭区', fullName: '杏花岭区', city: '太原' },
          { code: '140108', name: '尖草坪区', fullName: '尖草坪区', city: '太原' },
          { code: '140109', name: '万柏林区', fullName: '万柏林区', city: '太原' },
          { code: '140110', name: '晋源区', fullName: '晋源区', city: '太原' },
          { code: '140121', name: '清徐县', fullName: '清徐县', city: '太原' },
          { code: '140122', name: '阳曲县', fullName: '阳曲县', city: '太原' },
          { code: '140123', name: '娄烦县', fullName: '娄烦县', city: '太原' },
          { code: '140181', name: '古交市', fullName: '古交市', city: '太原' }
        ],
        '沈阳': [
          { code: '210102', name: '和平区', fullName: '和平区', city: '沈阳' },
          { code: '210103', name: '沈河区', fullName: '沈河区', city: '沈阳' },
          { code: '210104', name: '大东区', fullName: '大东区', city: '沈阳' },
          { code: '210105', name: '皇姑区', fullName: '皇姑区', city: '沈阳' },
          { code: '210106', name: '铁西区', fullName: '铁西区', city: '沈阳' },
          { code: '210111', name: '苏家屯区', fullName: '苏家屯区', city: '沈阳' },
          { code: '210112', name: '浑南区', fullName: '浑南区', city: '沈阳' },
          { code: '210113', name: '沈北新区', fullName: '沈北新区', city: '沈阳' },
          { code: '210114', name: '于洪区', fullName: '于洪区', city: '沈阳' },
          { code: '210115', name: '辽中区', fullName: '辽中区', city: '沈阳' },
          { code: '210123', name: '康平县', fullName: '康平县', city: '沈阳' },
          { code: '210124', name: '法库县', fullName: '法库县', city: '沈阳' },
          { code: '210181', name: '新民市', fullName: '新民市', city: '沈阳' }
        ],
        '大连': [
          { code: '210202', name: '中山区', fullName: '中山区', city: '大连' },
          { code: '210203', name: '西岗区', fullName: '西岗区', city: '大连' },
          { code: '210204', name: '沙河口区', fullName: '沙河口区', city: '大连' },
          { code: '210211', name: '甘井子区', fullName: '甘井子区', city: '大连' },
          { code: '210212', name: '旅顺口区', fullName: '旅顺口区', city: '大连' },
          { code: '210213', name: '金州区', fullName: '金州区', city: '大连' },
          { code: '210214', name: '普兰店区', fullName: '普兰店区', city: '大连' },
          { code: '210224', name: '长海县', fullName: '长海县', city: '大连' },
          { code: '210281', name: '瓦房店市', fullName: '瓦房店市', city: '大连' },
          { code: '210283', name: '庄河市', fullName: '庄河市', city: '大连' }
        ],
        '苏州': [
          { code: '320505', name: '虎丘区', fullName: '虎丘区', city: '苏州' },
          { code: '320506', name: '吴中区', fullName: '吴中区', city: '苏州' },
          { code: '320507', name: '相城区', fullName: '相城区', city: '苏州' },
          { code: '320508', name: '姑苏区', fullName: '姑苏区', city: '苏州' },
          { code: '320509', name: '吴江区', fullName: '吴江区', city: '苏州' },
          { code: '320581', name: '常熟市', fullName: '常熟市', city: '苏州' },
          { code: '320582', name: '张家港市', fullName: '张家港市', city: '苏州' },
          { code: '320583', name: '昆山市', fullName: '昆山市', city: '苏州' },
          { code: '320585', name: '太仓市', fullName: '太仓市', city: '苏州' }
        ],
        '无锡': [
          { code: '320205', name: '锡山区', fullName: '锡山区', city: '无锡' },
          { code: '320206', name: '惠山区', fullName: '惠山区', city: '无锡' },
          { code: '320211', name: '滨湖区', fullName: '滨湖区', city: '无锡' },
          { code: '320213', name: '梁溪区', fullName: '梁溪区', city: '无锡' },
          { code: '320214', name: '新吴区', fullName: '新吴区', city: '无锡' },
          { code: '320281', name: '江阴市', fullName: '江阴市', city: '无锡' },
          { code: '320282', name: '宜兴市', fullName: '宜兴市', city: '无锡' }
        ],
        '宁波': [
          { code: '330203', name: '海曙区', fullName: '海曙区', city: '宁波' },
          { code: '330205', name: '江北区', fullName: '江北区', city: '宁波' },
          { code: '330206', name: '北仑区', fullName: '北仑区', city: '宁波' },
          { code: '330211', name: '镇海区', fullName: '镇海区', city: '宁波' },
          { code: '330212', name: '鄞州区', fullName: '鄞州区', city: '宁波' },
          { code: '330213', name: '奉化区', fullName: '奉化区', city: '宁波' },
          { code: '330225', name: '象山县', fullName: '象山县', city: '宁波' },
          { code: '330226', name: '宁海县', fullName: '宁海县', city: '宁波' },
          { code: '330281', name: '余姚市', fullName: '余姚市', city: '宁波' },
          { code: '330282', name: '慈溪市', fullName: '慈溪市', city: '宁波' }
        ],
        '温州': [
          { code: '330302', name: '鹿城区', fullName: '鹿城区', city: '温州' },
          { code: '330303', name: '龙湾区', fullName: '龙湾区', city: '温州' },
          { code: '330304', name: '瓯海区', fullName: '瓯海区', city: '温州' },
          { code: '330305', name: '洞头区', fullName: '洞头区', city: '温州' },
          { code: '330324', name: '永嘉县', fullName: '永嘉县', city: '温州' },
          { code: '330326', name: '平阳县', fullName: '平阳县', city: '温州' },
          { code: '330327', name: '苍南县', fullName: '苍南县', city: '温州' },
          { code: '330328', name: '文成县', fullName: '文成县', city: '温州' },
          { code: '330329', name: '泰顺县', fullName: '泰顺县', city: '温州' },
          { code: '330381', name: '瑞安市', fullName: '瑞安市', city: '温州' },
          { code: '330382', name: '乐清市', fullName: '乐清市', city: '温州' },
          { code: '330383', name: '龙港市', fullName: '龙港市', city: '温州' }
        ],
        '福州': [
          { code: '350102', name: '鼓楼区', fullName: '鼓楼区', city: '福州' },
          { code: '350103', name: '台江区', fullName: '台江区', city: '福州' },
          { code: '350104', name: '仓山区', fullName: '仓山区', city: '福州' },
          { code: '350105', name: '马尾区', fullName: '马尾区', city: '福州' },
          { code: '350111', name: '晋安区', fullName: '晋安区', city: '福州' },
          { code: '350112', name: '长乐区', fullName: '长乐区', city: '福州' },
          { code: '350121', name: '闽侯县', fullName: '闽侯县', city: '福州' },
          { code: '350122', name: '连江县', fullName: '连江县', city: '福州' },
          { code: '350123', name: '罗源县', fullName: '罗源县', city: '福州' },
          { code: '350124', name: '闽清县', fullName: '闽清县', city: '福州' },
          { code: '350125', name: '永泰县', fullName: '永泰县', city: '福州' },
          { code: '350128', name: '平潭县', fullName: '平潭县', city: '福州' },
          { code: '350181', name: '福清市', fullName: '福清市', city: '福州' }
        ],
        '厦门': [
          { code: '350203', name: '思明区', fullName: '思明区', city: '厦门' },
          { code: '350205', name: '海沧区', fullName: '海沧区', city: '厦门' },
          { code: '350206', name: '湖里区', fullName: '湖里区', city: '厦门' },
          { code: '350211', name: '集美区', fullName: '集美区', city: '厦门' },
          { code: '350212', name: '同安区', fullName: '同安区', city: '厦门' },
          { code: '350213', name: '翔安区', fullName: '翔安区', city: '厦门' }
        ],
        '济南': [
          { code: '370102', name: '历下区', fullName: '历下区', city: '济南' },
          { code: '370103', name: '市中区', fullName: '市中区', city: '济南' },
          { code: '370104', name: '槐荫区', fullName: '槐荫区', city: '济南' },
          { code: '370105', name: '天桥区', fullName: '天桥区', city: '济南' },
          { code: '370112', name: '历城区', fullName: '历城区', city: '济南' },
          { code: '370113', name: '长清区', fullName: '长清区', city: '济南' },
          { code: '370114', name: '章丘区', fullName: '章丘区', city: '济南' },
          { code: '370115', name: '济阳区', fullName: '济阳区', city: '济南' },
          { code: '370116', name: '莱芜区', fullName: '莱芜区', city: '济南' },
          { code: '370117', name: '钢城区', fullName: '钢城区', city: '济南' },
          { code: '370124', name: '平阴县', fullName: '平阴县', city: '济南' },
          { code: '370126', name: '商河县', fullName: '商河县', city: '济南' }
        ],
        '青岛': [
          { code: '370202', name: '市南区', fullName: '市南区', city: '青岛' },
          { code: '370203', name: '市北区', fullName: '市北区', city: '青岛' },
          { code: '370211', name: '黄岛区', fullName: '黄岛区', city: '青岛' },
          { code: '370212', name: '崂山区', fullName: '崂山区', city: '青岛' },
          { code: '370213', name: '李沧区', fullName: '李沧区', city: '青岛' },
          { code: '370214', name: '城阳区', fullName: '城阳区', city: '青岛' },
          { code: '370215', name: '即墨区', fullName: '即墨区', city: '青岛' },
          { code: '370281', name: '胶州市', fullName: '胶州市', city: '青岛' },
          { code: '370283', name: '平度市', fullName: '平度市', city: '青岛' },
          { code: '370285', name: '莱西市', fullName: '莱西市', city: '青岛' }
        ],
        '郑州': [
          { code: '410102', name: '中原区', fullName: '中原区', city: '郑州' },
          { code: '410103', name: '二七区', fullName: '二七区', city: '郑州' },
          { code: '410104', name: '管城回族区', fullName: '管城回族区', city: '郑州' },
          { code: '410105', name: '金水区', fullName: '金水区', city: '郑州' },
          { code: '410106', name: '上街区', fullName: '上街区', city: '郑州' },
          { code: '410108', name: '惠济区', fullName: '惠济区', city: '郑州' },
          { code: '410122', name: '中牟县', fullName: '中牟县', city: '郑州' },
          { code: '410181', name: '巩义市', fullName: '巩义市', city: '郑州' },
          { code: '410182', name: '荥阳市', fullName: '荥阳市', city: '郑州' },
          { code: '410183', name: '新密市', fullName: '新密市', city: '郑州' },
          { code: '410184', name: '新郑市', fullName: '新郑市', city: '郑州' },
          { code: '410185', name: '登封市', fullName: '登封市', city: '郑州' }
        ],
        '长沙': [
          { code: '430102', name: '芙蓉区', fullName: '芙蓉区', city: '长沙' },
          { code: '430103', name: '天心区', fullName: '天心区', city: '长沙' },
          { code: '430104', name: '岳麓区', fullName: '岳麓区', city: '长沙' },
          { code: '430105', name: '开福区', fullName: '开福区', city: '长沙' },
          { code: '430111', name: '雨花区', fullName: '雨花区', city: '长沙' },
          { code: '430112', name: '望城区', fullName: '望城区', city: '长沙' },
          { code: '430121', name: '长沙县', fullName: '长沙县', city: '长沙' },
          { code: '430124', name: '宁乡市', fullName: '宁乡市', city: '长沙' },
          { code: '430181', name: '浏阳市', fullName: '浏阳市', city: '长沙' }
        ],
        '香港': [
          { code: '810000', name: '香港', fullName: '香港特别行政区', city: '香港' }
        ],
        '澳门': [
          { code: '820000', name: '澳门', fullName: '澳门特别行政区', city: '澳门' }
        ],
        '台湾': [
          { code: '710000', name: '台湾', fullName: '台湾省', city: '台湾' }
        ]
      };
    },
  }
});


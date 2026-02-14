Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 银行列表
    bankList: {
      type: Array,
      value: []
    },
    // 当前选中的银行
    value: {
      type: String,
      value: ''
    }
  },

  data: {
    searchKeyword: '', // 搜索关键词
    filteredBankList: [], // 过滤后的银行列表
    selectedBank: '' // 临时选中的银行
  },

  observers: {
    'show': function(show) {
      if (show) {
        // 显示时初始化
        this.setData({
          searchKeyword: '',
          filteredBankList: this.properties.bankList,
          selectedBank: this.properties.value
        });
      }
    }
  },

  methods: {
    /**
     * 搜索输入
     */
    onSearchInput(e) {
      const keyword = e.detail.value.trim().toLowerCase();
      this.setData({
        searchKeyword: keyword
      });
      
      // 过滤银行列表
      if (keyword === '') {
        this.setData({
          filteredBankList: this.properties.bankList
        });
      } else {
        const filtered = this.properties.bankList.filter(bank => {
          return bank.toLowerCase().includes(keyword);
        });
        this.setData({
          filteredBankList: filtered
        });
      }
    },

    /**
     * 清除搜索
     */
    clearSearch() {
      this.setData({
        searchKeyword: '',
        filteredBankList: this.properties.bankList
      });
    },

    /**
     * 选择银行（点击后直接确认并关闭）
     */
    onBankSelect(e) {
      const bank = e.currentTarget.dataset.bank;
      this.setData({
        selectedBank: bank
      });
      
      // 直接触发确认事件并关闭选择器
      this.triggerEvent('confirm', {
        value: bank
      });
      this.hide();
    },

    /**
     * 确认选择
     */
    onConfirm() {
      this.triggerEvent('confirm', {
        value: this.data.selectedBank
      });
      this.hide();
    },

    /**
     * 隐藏选择器
     */
    hide() {
      this.triggerEvent('cancel');
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation(e) {
      // 阻止点击容器时关闭
      return true;
    },

    /**
     * 阻止滚动穿透
     */
    stopScroll(e) {
      return false;
    }
  }
});


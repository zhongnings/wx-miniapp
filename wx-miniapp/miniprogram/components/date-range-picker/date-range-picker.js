// components/date-range-picker/date-range-picker.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示选择器
    show: {
      type: Boolean,
      value: false
    },
    // 标题
    title: {
      type: String,
      value: '选择证件有效期'
    },
    // 生效日期
    startDate: {
      type: String,
      value: ''
    },
    // 有效期（结束日期）
    endDate: {
      type: String,
      value: ''
    },
    // 是否必填
    required: {
      type: Boolean,
      value: true
    },
    // 是否显示"长期有效"选项
    showLongTerm: {
      type: Boolean,
      value: true
    },
    // 是否长期有效
    isLongTerm: {
      type: Boolean,
      value: false
    },
    // 最小日期（默认为1900-01-01）
    minDate: {
      type: String,
      value: '1900-01-01'
    },
    // 最大日期（默认为当前日期+50年）
    maxDate: {
      type: String,
      value: ''
    },
    // 提示信息
    tip: {
      type: String,
      value: '请选择证件的生效日期和有效期'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    tempStartDate: '',
    tempEndDate: '',
    tempIsLongTerm: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 阻止事件冒泡
    stopPropagation() {},

    // 阻止滚动穿透
    stopScroll() {},

    // 点击遮罩层关闭
    onMaskTap() {
      this.onClose();
    },

    // 关闭选择器
    onClose() {
      this.triggerEvent('close');
    },

    // 生效日期改变
    onStartDateChange(e) {
      const startDate = e.detail.value;
      this.setData({
        tempStartDate: startDate
      });
      
      // 触发change事件，实时更新父组件
      this.triggerEvent('change', {
        startDate: startDate,
        endDate: this.data.tempEndDate || this.data.endDate,
        isLongTerm: this.data.tempIsLongTerm
      });
    },

    // 有效期改变
    onEndDateChange(e) {
      const endDate = e.detail.value;
      this.setData({
        tempEndDate: endDate,
        tempIsLongTerm: false // 选择了具体日期，取消长期有效
      });
      
      // 触发change事件，实时更新父组件
      this.triggerEvent('change', {
        startDate: this.data.tempStartDate || this.data.startDate,
        endDate: endDate,
        isLongTerm: false
      });
    },

    // 长期有效改变
    onLongTermChange(e) {
      const isLongTerm = !this.data.tempIsLongTerm;
      this.setData({
        tempIsLongTerm: isLongTerm
      });
      
      // 如果选择长期有效，清空有效期
      if (isLongTerm) {
        this.setData({
          tempEndDate: ''
        });
      }
      
      // 触发change事件，实时更新父组件
      this.triggerEvent('change', {
        startDate: this.data.tempStartDate || this.data.startDate,
        endDate: isLongTerm ? '' : (this.data.tempEndDate || this.data.endDate),
        isLongTerm: isLongTerm
      });
    },

    // 确认选择
    onConfirm() {
      const startDate = this.data.tempStartDate || this.data.startDate;
      const endDate = this.data.tempEndDate || this.data.endDate;
      const isLongTerm = this.data.tempIsLongTerm;

      // 验证
      if (this.data.required && !startDate) {
        wx.showToast({
          title: '请选择生效日期',
          icon: 'none'
        });
        return;
      }

      if (this.data.required && !endDate && !isLongTerm) {
        wx.showToast({
          title: '请选择有效期或勾选长期有效',
          icon: 'none'
        });
        return;
      }

      // 验证日期逻辑
      if (startDate && endDate && startDate > endDate) {
        wx.showToast({
          title: '生效日期不能晚于有效期',
          icon: 'none'
        });
        return;
      }

      // 触发确认事件
      this.triggerEvent('confirm', {
        startDate: startDate,
        endDate: endDate,
        isLongTerm: isLongTerm
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 设置默认最大日期（当前日期+50年）
      if (!this.data.maxDate) {
        const now = new Date();
        const maxYear = now.getFullYear() + 50;
        const maxDate = `${maxYear}-12-31`;
        this.setData({
          maxDate: maxDate
        });
      }
    },

    ready() {
      // 初始化临时数据
      this.setData({
        tempStartDate: this.data.startDate,
        tempEndDate: this.data.endDate,
        tempIsLongTerm: this.data.isLongTerm
      });
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // 页面显示时重置临时数据
      this.setData({
        tempStartDate: this.data.startDate,
        tempEndDate: this.data.endDate,
        tempIsLongTerm: this.data.isLongTerm
      });
    }
  }
});


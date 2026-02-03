<template>
  <view class="create-container">
    <!-- 顶部标签页导航 -->
    <scroll-view class="tabs-nav" scroll-x enhanced :show-scrollbar="false">
      <view class="tabs-nav-inner">
        <view class="tab" :class="{ active: currentStep === 0 }">借款信息</view>
        <view class="tab" :class="{ active: currentStep === 1 }">借款人信息</view>
        <view class="tab" :class="{ active: currentStep === 2 }">共借人信息</view>
        <view class="tab" :class="{ active: currentStep === 3 }">担保人信息</view>
        <view class="tab" :class="{ active: currentStep === 4 }">银行卡信息</view>
        <view class="tab" :class="{ active: currentStep === 5 }">资料上传</view>
      </view>
    </scroll-view>

    <!-- 表单内容 -->
    <scroll-view class="form-content" scroll-y enhanced :show-scrollbar="false">
      <view class="form-section">
        <!-- 受让机构 -->
        <picker :range="assigneeOrgOptions" @change="onAssigneeOrgChange">
          <view class="form-item">
            <text class="label required">受让机构</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.assigneeOrg }">
                {{ formData.assigneeOrg || '请选择受让机构' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 小贷机构 -->
        <picker :range="microloanOrgOptions" @change="onMicroloanOrgChange">
          <view class="form-item">
            <text class="label required">小贷机构</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.microloanOrg }">
                {{ formData.microloanOrg || '请选择小贷机构' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 支付渠道 -->
        <picker :range="paymentChannelOptions" @change="onPaymentChannelChange">
          <view class="form-item">
            <text class="label required">支付渠道</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.paymentChannel }">
                {{ formData.paymentChannel || '请选择支付渠道' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 产品类型 -->
        <picker :range="productTypeOptions" @change="onProductTypeChange">
          <view class="form-item">
            <text class="label required">产品类型</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.productType }">
                {{ formData.productType || '请选择产品类型' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 借款人类型 -->
        <view class="form-item">
          <text class="label required">借款人类型</text>
          <view class="radio-group">
            <view class="radio-item" :class="{ active: formData.borrowerType === '个人' }" @tap="selectBorrowerType('个人')">
              <view class="radio-circle">
                <view class="radio-dot" v-if="formData.borrowerType === '个人'"></view>
              </view>
              <text>个人</text>
            </view>
            <view class="radio-item" :class="{ active: formData.borrowerType === '对公' }" @tap="selectBorrowerType('对公')">
              <view class="radio-circle">
                <view class="radio-dot" v-if="formData.borrowerType === '对公'"></view>
              </view>
              <text>对公</text>
            </view>
          </view>
        </view>

        <!-- 借款金额 -->
        <view class="form-item">
          <text class="label required">借款金额</text>
          <view class="input-wrapper">
            <input 
              class="input" 
              type="digit" 
              placeholder="请填写借款金额" 
              v-model="formData.loanAmount"
              @input="onLoanAmountInput"
            />
            <text class="unit">元</text>
          </view>
        </view>

        <!-- 借款天数 -->
        <view class="form-item">
          <text class="label required">借款天数</text>
          <view class="input-wrapper">
            <input 
              class="input" 
              type="number" 
              placeholder="请填写借款天数"
              v-model="formData.loanDays"
              @input="onLoanDaysInput"
            />
            <text class="unit">天</text>
          </view>
        </view>

        <!-- 借款起始日期 -->
        <picker mode="date" :value="formData.startDate" @change="onStartDateChange">
          <view class="form-item">
            <text class="label required">借款起始日期</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.startDate }">
                {{ formData.startDate || '请选择借款起始日期' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 借款结束日期（自动计算） -->
        <view class="form-item">
          <text class="label required">借款结束日期</text>
          <text class="value" :class="{ placeholder: !formData.endDate }">
            {{ formData.endDate || '自动计算' }}
          </text>
        </view>

        <!-- 借款年利率 -->
        <view class="form-item">
          <text class="label required">借款年利率</text>
          <view class="input-wrapper">
            <input 
              class="input" 
              type="digit" 
              placeholder="请填写年利率"
              v-model="formData.annualRate"
            />
            <text class="unit">%</text>
          </view>
        </view>

        <!-- 签约地（使用系统地区选择器） -->
        <picker mode="region" @change="onRegionChange">
          <view class="form-item">
            <text class="label required">签约地</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.signPlace }">
                {{ formData.signPlace || '请选择签约地' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 借款用途 -->
        <picker :range="loanPurposeOptions" @change="onLoanPurposeChange">
          <view class="form-item">
            <text class="label required">借款用途</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.loanPurpose }">
                {{ formData.loanPurpose || '请选择借款用途' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 还款方式 -->
        <picker :range="repaymentMethodOptions" @change="onRepaymentMethodChange">
          <view class="form-item">
            <text class="label required">还款方式</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.repaymentMethod }">
                {{ formData.repaymentMethod || '请选择还款方式' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer-buttons">
      <button class="btn btn-secondary" @tap="goBack">返回</button>
      <button class="btn btn-primary" @tap="goNext">下一步</button>
    </view>
  </view>
</template>

<script>
const logger = require('@/utils/logger.js');

export default {
  data() {
    return {
      currentStep: 0,
      orderId: null,
      formData: {
        assigneeOrg: '',
        microloanOrg: '',
        paymentChannel: '',
        productType: '',
        borrowerType: '个人',
        loanAmount: '',
        loanDays: '',
        startDate: '',
        endDate: '',
        annualRate: '',
        signPlace: '',
        loanPurpose: '',
        repaymentMethod: ''
      },
      // 选项数据
      assigneeOrgOptions: ['机构A', '机构B', '机构C'],
      microloanOrgOptions: ['小贷机构A', '小贷机构B', '小贷机构C'],
      paymentChannelOptions: ['支付宝', '微信支付', '银行转账'],
      productTypeOptions: ['产品类型A', '产品类型B', '产品类型C'],
      loanPurposeOptions: ['经营周转', '消费', '其他'],
      repaymentMethodOptions: ['等额本息', '等额本金', '一次性还本付息']
    };
  },
  
  onLoad(query) {
    this.orderId = query.id;
    if (this.orderId) {
      this.loadOrderData();
    }
  },
  
  methods: {
    /**
     * 加载订单数据
     */
    loadOrderData() {
      uni.showLoading({ title: '加载中...' });
      
      const req = uni.$request || require('@/utils/request.js');
      
      req.request({
        url: `/public/orders/${this.orderId}`,
        method: 'GET'
      }).then(res => {
        const data = res.data || {};
        if (data.loanInfo) {
          this.formData = { ...this.formData, ...data.loanInfo };
        }
        logger.info('订单数据加载成功');
      }).catch(err => {
        logger.error('加载订单数据失败:', err);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 选择器变化事件
     */
    onAssigneeOrgChange(e) {
      this.formData.assigneeOrg = this.assigneeOrgOptions[e.detail.value];
    },
    
    onMicroloanOrgChange(e) {
      this.formData.microloanOrg = this.microloanOrgOptions[e.detail.value];
    },
    
    onPaymentChannelChange(e) {
      this.formData.paymentChannel = this.paymentChannelOptions[e.detail.value];
    },
    
    onProductTypeChange(e) {
      this.formData.productType = this.productTypeOptions[e.detail.value];
    },
    
    onLoanPurposeChange(e) {
      this.formData.loanPurpose = this.loanPurposeOptions[e.detail.value];
    },
    
    onRepaymentMethodChange(e) {
      this.formData.repaymentMethod = this.repaymentMethodOptions[e.detail.value];
    },
    
    /**
     * 选择借款人类型
     */
    selectBorrowerType(type) {
      this.formData.borrowerType = type;
    },
    
    /**
     * 借款金额输入
     */
    onLoanAmountInput(e) {
      this.formData.loanAmount = e.detail.value;
    },
    
    /**
     * 借款天数输入
     */
    onLoanDaysInput(e) {
      this.formData.loanDays = e.detail.value;
      this.calculateEndDate();
    },
    
    /**
     * 起始日期变化
     */
    onStartDateChange(e) {
      this.formData.startDate = e.detail.value;
      this.calculateEndDate();
    },
    
    /**
     * 地区选择
     */
    onRegionChange(e) {
      const region = e.detail.value;
      this.formData.signPlace = region.join(' ');
    },
    
    /**
     * 计算结束日期
     */
    calculateEndDate() {
      if (this.formData.startDate && this.formData.loanDays) {
        const startDate = new Date(this.formData.startDate);
        const days = parseInt(this.formData.loanDays);
        startDate.setDate(startDate.getDate() + days);
        this.formData.endDate = startDate.toISOString().split('T')[0];
      }
    },
    
    /**
     * 验证表单
     */
    validateForm() {
      const required = [
        { field: 'assigneeOrg', label: '受让机构' },
        { field: 'microloanOrg', label: '小贷机构' },
        { field: 'paymentChannel', label: '支付渠道' },
        { field: 'productType', label: '产品类型' },
        { field: 'loanAmount', label: '借款金额' },
        { field: 'loanDays', label: '借款天数' },
        { field: 'startDate', label: '借款起始日期' },
        { field: 'annualRate', label: '借款年利率' },
        { field: 'signPlace', label: '签约地' },
        { field: 'loanPurpose', label: '借款用途' },
        { field: 'repaymentMethod', label: '还款方式' }
      ];
      
      for (let item of required) {
        if (!this.formData[item.field]) {
          uni.showToast({
            title: `请填写${item.label}`,
            icon: 'none'
          });
          return false;
        }
      }
      
      return true;
    },
    
    /**
     * 保存数据
     */
    saveData() {
      if (!this.validateForm()) {
        return Promise.reject('验证失败');
      }
      
      uni.showLoading({ title: '保存中...' });
      
      const req = uni.$request || require('@/utils/request.js');
      
      // 如果没有订单ID，先创建订单
      if (!this.orderId) {
        return req.request({
          url: '/public/orders',
          method: 'POST',
          data: { loanInfo: this.formData }
        }).then(res => {
          this.orderId = res.data.id;
          logger.info('订单创建成功:', this.orderId);
          return res;
        }).finally(() => {
          uni.hideLoading();
        });
      } else {
        // 更新订单
        return req.request({
          url: `/public/orders/${this.orderId}/loan-info`,
          method: 'PUT',
          data: this.formData
        }).finally(() => {
          uni.hideLoading();
        });
      }
    },
    
    /**
     * 返回
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 下一步
     */
    goNext() {
      this.saveData().then(() => {
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/order/create/step2/index?id=${this.orderId}`
          });
        }, 1000);
      }).catch(err => {
        logger.error('保存失败:', err);
        if (err !== '验证失败') {
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      });
    }
  }
};
</script>

<style scoped>
.create-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 标签页导航 */
.tabs-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  z-index: 100;
  border-bottom: 1rpx solid #eee;
  white-space: nowrap;
}

.tabs-nav-inner {
  display: inline-flex;
  height: 100%;
  align-items: center;
  padding: 0 20rpx;
}

.tab {
  padding: 24rpx 30rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  white-space: nowrap;
}

.tab.active {
  color: #ff6f6f;
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30rpx;
  right: 30rpx;
  height: 4rpx;
  background: #ff6f6f;
}

/* 表单内容 */
.form-content {
  margin-top: 100rpx;
  padding: 20rpx 0;
  height: calc(100vh - 220rpx);
}

.form-section {
  background: #ffffff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  min-height: 90rpx;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #333;
  min-width: 200rpx;
}

.label.required::before {
  content: '*';
  color: #ff6f6f;
  margin-right: 4rpx;
}

.value-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 16rpx;
}

.value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.value.placeholder {
  color: #999;
}

.arrow {
  font-size: 32rpx;
  color: #999;
}

.input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 8rpx;
}

.input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #333;
}

.unit {
  font-size: 28rpx;
  color: #666;
}

.radio-group {
  display: flex;
  gap: 40rpx;
  flex: 1;
  justify-content: flex-end;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #666;
}

.radio-item.active {
  color: #ff6f6f;
}

.radio-circle {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-item.active .radio-circle {
  border-color: #ff6f6f;
}

.radio-dot {
  width: 20rpx;
  height: 20rpx;
  background: #ff6f6f;
  border-radius: 50%;
}

/* 底部按钮 */
.footer-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  z-index: 999;
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.btn-secondary {
  background: #ffffff;
  color: #ff6f6f;
  border: 2rpx solid #ff6f6f;
}

.btn-primary {
  background: #ff6f6f;
  color: #ffffff;
}
</style>


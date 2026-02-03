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
        <view class="section-title">银行卡信息</view>
        
        <!-- 持卡人姓名 -->
        <view class="form-item">
          <text class="label required">持卡人姓名</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入持卡人姓名" 
            v-model="formData.cardholderName"
          />
        </view>

        <!-- 银行卡号 -->
        <view class="form-item">
          <text class="label required">银行卡号</text>
          <input 
            class="input" 
            type="number" 
            placeholder="请输入银行卡号" 
            v-model="formData.cardNumber"
            @input="onCardNumberInput"
            @blur="onCardNumberBlur"
          />
        </view>

        <!-- 银行卡号显示（格式化） -->
        <view class="form-item" v-if="formattedCardNumber">
          <text class="label">卡号格式</text>
          <text class="value card-number">{{ formattedCardNumber }}</text>
        </view>

        <!-- 银行卡类型 -->
        <view class="form-item">
          <text class="label required">银行卡类型</text>
          <view class="radio-group">
            <view class="radio-item" :class="{ active: formData.cardType === '储蓄卡' }" @tap="selectCardType('储蓄卡')">
              <view class="radio-circle">
                <view class="radio-dot" v-if="formData.cardType === '储蓄卡'"></view>
              </view>
              <text>储蓄卡</text>
            </view>
            <view class="radio-item" :class="{ active: formData.cardType === '信用卡' }" @tap="selectCardType('信用卡')">
              <view class="radio-circle">
                <view class="radio-dot" v-if="formData.cardType === '信用卡'"></view>
              </view>
              <text>信用卡</text>
            </view>
          </view>
        </view>

        <!-- 开户银行 -->
        <picker :range="bankOptions" @change="onBankChange">
          <view class="form-item">
            <text class="label required">开户银行</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.bankName }">
                {{ formData.bankName || '请选择开户银行' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 开户支行 -->
        <view class="form-item">
          <text class="label required">开户支行</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入开户支行名称" 
            v-model="formData.branchName"
          />
        </view>

        <!-- 开户行所在地 -->
        <picker mode="region" @change="onBankRegionChange">
          <view class="form-item">
            <text class="label required">开户行所在地</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.bankRegion }">
                {{ formData.bankRegion || '请选择省市区' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 银行预留手机号 -->
        <view class="form-item">
          <text class="label required">银行预留手机号</text>
          <input 
            class="input" 
            type="number" 
            maxlength="11"
            placeholder="请输入银行预留手机号" 
            v-model="formData.reservedMobile"
          />
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="tips-section">
        <view class="tips-title">
          <text class="tips-icon">💡</text>
          <text class="tips-title-text">温馨提示</text>
        </view>
        <view class="tips-content">
          <text class="tips-item">• 请确保银行卡信息准确无误，用于放款和还款</text>
          <text class="tips-item">• 持卡人姓名必须与借款人姓名一致</text>
          <text class="tips-item">• 建议使用储蓄卡，部分银行信用卡可能无法使用</text>
          <text class="tips-item">• 银行预留手机号用于接收银行验证码</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer-buttons">
      <button class="btn btn-secondary" @tap="goBack">上一步</button>
      <button class="btn btn-primary" @tap="goNext">下一步</button>
    </view>
  </view>
</template>

<script>
const logger = require('@/utils/logger.js');

export default {
  data() {
    return {
      currentStep: 4,
      orderId: null,
      formData: {
        cardholderName: '',
        cardNumber: '',
        cardType: '储蓄卡',
        bankName: '',
        branchName: '',
        bankRegion: '',
        reservedMobile: ''
      },
      formattedCardNumber: '',
      // 银行选项
      bankOptions: [
        '中国工商银行',
        '中国农业银行',
        '中国银行',
        '中国建设银行',
        '交通银行',
        '招商银行',
        '中国邮政储蓄银行',
        '中信银行',
        '中国光大银行',
        '华夏银行',
        '中国民生银行',
        '广发银行',
        '平安银行',
        '兴业银行',
        '浦发银行',
        '其他银行'
      ]
    };
  },
  
  onLoad(query) {
    this.orderId = query.id;
    if (!this.orderId) {
      uni.showToast({
        title: '请先完成担保人信息',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
      return;
    }
    this.loadOrderData();
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
        if (data.bankCardInfo) {
          this.formData = { ...this.formData, ...data.bankCardInfo };
          // 格式化银行卡号
          if (this.formData.cardNumber) {
            this.formatCardNumber(this.formData.cardNumber);
          }
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
     * 银行卡号输入事件
     */
    onCardNumberInput(e) {
      this.formData.cardNumber = e.detail.value;
    },
    
    /**
     * 银行卡号失焦事件
     */
    onCardNumberBlur() {
      this.formatCardNumber(this.formData.cardNumber);
    },
    
    /**
     * 格式化银行卡号（每4位加空格）
     */
    formatCardNumber(cardNumber) {
      if (!cardNumber) {
        this.formattedCardNumber = '';
        return;
      }
      
      // 移除所有空格
      const cleaned = cardNumber.replace(/\s/g, '');
      
      // 每4位添加一个空格
      const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
      this.formattedCardNumber = formatted;
    },
    
    /**
     * 选择银行卡类型
     */
    selectCardType(type) {
      this.formData.cardType = type;
    },
    
    /**
     * 选择开户银行
     */
    onBankChange(e) {
      this.formData.bankName = this.bankOptions[e.detail.value];
    },
    
    /**
     * 选择开户行所在地
     */
    onBankRegionChange(e) {
      const region = e.detail.value;
      this.formData.bankRegion = region.join(' ');
    },
    
    /**
     * 验证银行卡号（Luhn算法）
     */
    validateCardNumber(cardNumber) {
      if (!cardNumber) return false;
      
      // 移除空格
      const cleaned = cardNumber.replace(/\s/g, '');
      
      // 银行卡号长度一般为16-19位
      if (cleaned.length < 16 || cleaned.length > 19) {
        return false;
      }
      
      // 简单验证：只包含数字
      if (!/^\d+$/.test(cleaned)) {
        return false;
      }
      
      // Luhn算法验证
      let sum = 0;
      let isEven = false;
      
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i));
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      return sum % 10 === 0;
    },
    
    /**
     * 验证手机号
     */
    validateMobile(mobile) {
      if (!mobile) return false;
      const reg = /^1[3-9]\d{9}$/;
      return reg.test(mobile);
    },
    
    /**
     * 验证表单
     */
    validateForm() {
      const required = [
        { field: 'cardholderName', label: '持卡人姓名' },
        { field: 'cardNumber', label: '银行卡号' },
        { field: 'cardType', label: '银行卡类型' },
        { field: 'bankName', label: '开户银行' },
        { field: 'branchName', label: '开户支行' },
        { field: 'bankRegion', label: '开户行所在地' },
        { field: 'reservedMobile', label: '银行预留手机号' }
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
      
      // 验证银行卡号
      if (!this.validateCardNumber(this.formData.cardNumber)) {
        uni.showToast({
          title: '请输入正确的银行卡号',
          icon: 'none'
        });
        return false;
      }
      
      // 验证手机号
      if (!this.validateMobile(this.formData.reservedMobile)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return false;
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
      
      return req.request({
        url: `/public/orders/${this.orderId}/bank-card-info`,
        method: 'PUT',
        data: this.formData
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 上一步
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
            url: `/pages/order/create/step6/index?id=${this.orderId}`
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

.section-title {
  padding: 24rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  border-bottom: 1rpx solid #f0f0f0;
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
  min-width: 240rpx;
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

.value.card-number {
  font-family: 'Courier New', monospace;
  letter-spacing: 2rpx;
  color: #ff6f6f;
  font-weight: 500;
}

.arrow {
  font-size: 32rpx;
  color: #999;
}

.input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #333;
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

/* 提示信息 */
.tips-section {
  background: #fff9f0;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #ffe8cc;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tips-icon {
  font-size: 32rpx;
}

.tips-title-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #ff9800;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
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


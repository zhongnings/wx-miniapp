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
        <view class="section-title">基本信息</view>
        
        <!-- 姓名 -->
        <view class="form-item">
          <text class="label required">姓名</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入借款人姓名" 
            v-model="formData.name"
          />
        </view>

        <!-- 身份证号 -->
        <view class="form-item">
          <text class="label required">身份证号</text>
          <input 
            class="input" 
            type="idcard" 
            placeholder="请输入身份证号" 
            v-model="formData.idCard"
            @blur="onIdCardBlur"
          />
        </view>

        <!-- 性别（自动识别） -->
        <view class="form-item">
          <text class="label">性别</text>
          <text class="value" :class="{ placeholder: !formData.gender }">
            {{ formData.gender || '根据身份证自动识别' }}
          </text>
        </view>

        <!-- 出生日期（自动识别） -->
        <view class="form-item">
          <text class="label">出生日期</text>
          <text class="value" :class="{ placeholder: !formData.birthDate }">
            {{ formData.birthDate || '根据身份证自动识别' }}
          </text>
        </view>

        <!-- 手机号 -->
        <view class="form-item">
          <text class="label required">手机号</text>
          <input 
            class="input" 
            type="number" 
            maxlength="11"
            placeholder="请输入手机号" 
            v-model="formData.mobile"
          />
        </view>

        <!-- 婚姻状况 -->
        <picker :range="maritalStatusOptions" @change="onMaritalStatusChange">
          <view class="form-item">
            <text class="label required">婚姻状况</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.maritalStatus }">
                {{ formData.maritalStatus || '请选择婚姻状况' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 学历 -->
        <picker :range="educationOptions" @change="onEducationChange">
          <view class="form-item">
            <text class="label required">学历</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.education }">
                {{ formData.education || '请选择学历' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 职业 -->
        <picker :range="occupationOptions" @change="onOccupationChange">
          <view class="form-item">
            <text class="label required">职业</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.occupation }">
                {{ formData.occupation || '请选择职业' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 月收入 -->
        <view class="form-item">
          <text class="label required">月收入</text>
          <view class="input-wrapper">
            <input 
              class="input" 
              type="digit" 
              placeholder="请输入月收入" 
              v-model="formData.monthlyIncome"
            />
            <text class="unit">元</text>
          </view>
        </view>
      </view>

      <!-- 户籍地址 -->
      <view class="form-section">
        <view class="section-title">户籍地址</view>

        <!-- 户籍省市区 -->
        <picker mode="region" @change="onHouseholdRegionChange">
          <view class="form-item">
            <text class="label required">省/市/区</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.householdRegion }">
                {{ formData.householdRegion || '请选择省市区' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 户籍详细地址 -->
        <view class="form-item">
          <text class="label required">详细地址</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入详细地址" 
            v-model="formData.householdAddress"
          />
        </view>
      </view>

      <!-- 现居地址 -->
      <view class="form-section">
        <view class="section-title">现居地址</view>

        <!-- 与户籍地址相同 -->
        <view class="form-item">
          <text class="label">与户籍地址相同</text>
          <switch 
            :checked="sameAsHousehold" 
            @change="onSameAsHouseholdChange"
            color="#ff6f6f"
          />
        </view>

        <!-- 现居省市区 -->
        <picker mode="region" @change="onCurrentRegionChange" :disabled="sameAsHousehold">
          <view class="form-item" :class="{ disabled: sameAsHousehold }">
            <text class="label required">省/市/区</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.currentRegion }">
                {{ formData.currentRegion || '请选择省市区' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 现居详细地址 -->
        <view class="form-item" :class="{ disabled: sameAsHousehold }">
          <text class="label required">详细地址</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入详细地址" 
            v-model="formData.currentAddress"
            :disabled="sameAsHousehold"
          />
        </view>
      </view>

      <!-- 紧急联系人 -->
      <view class="form-section">
        <view class="section-title">紧急联系人</view>

        <!-- 联系人姓名 -->
        <view class="form-item">
          <text class="label required">姓名</text>
          <input 
            class="input" 
            type="text" 
            placeholder="请输入联系人姓名" 
            v-model="formData.emergencyContactName"
          />
        </view>

        <!-- 联系人关系 -->
        <picker :range="relationshipOptions" @change="onRelationshipChange">
          <view class="form-item">
            <text class="label required">关系</text>
            <view class="value-wrapper">
              <text class="value" :class="{ placeholder: !formData.emergencyContactRelation }">
                {{ formData.emergencyContactRelation || '请选择关系' }}
              </text>
              <text class="arrow">›</text>
            </view>
          </view>
        </picker>

        <!-- 联系人手机号 -->
        <view class="form-item">
          <text class="label required">手机号</text>
          <input 
            class="input" 
            type="number" 
            maxlength="11"
            placeholder="请输入联系人手机号" 
            v-model="formData.emergencyContactMobile"
          />
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
      currentStep: 1,
      orderId: null,
      sameAsHousehold: false,
      formData: {
        name: '',
        idCard: '',
        gender: '',
        birthDate: '',
        mobile: '',
        maritalStatus: '',
        education: '',
        occupation: '',
        monthlyIncome: '',
        householdRegion: '',
        householdAddress: '',
        currentRegion: '',
        currentAddress: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactMobile: ''
      },
      // 选项数据
      maritalStatusOptions: ['未婚', '已婚', '离异', '丧偶'],
      educationOptions: ['小学', '初中', '高中/中专', '大专', '本科', '硕士', '博士'],
      occupationOptions: ['企业职员', '个体经营', '自由职业', '学生', '退休', '其他'],
      relationshipOptions: ['父母', '配偶', '子女', '兄弟姐妹', '朋友', '同事', '其他']
    };
  },
  
  onLoad(query) {
    this.orderId = query.id;
    if (!this.orderId) {
      uni.showToast({
        title: '请先完成借款信息',
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
        if (data.borrowerInfo) {
          this.formData = { ...this.formData, ...data.borrowerInfo };
          // 检查现居地址是否与户籍地址相同
          if (this.formData.currentRegion === this.formData.householdRegion &&
              this.formData.currentAddress === this.formData.householdAddress) {
            this.sameAsHousehold = true;
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
     * 身份证号失焦事件 - 自动识别性别和出生日期
     */
    onIdCardBlur() {
      const idCard = this.formData.idCard;
      if (idCard && idCard.length === 18) {
        // 提取出生日期
        const year = idCard.substring(6, 10);
        const month = idCard.substring(10, 12);
        const day = idCard.substring(12, 14);
        this.formData.birthDate = `${year}-${month}-${day}`;
        
        // 提取性别（倒数第二位，奇数为男，偶数为女）
        const genderCode = parseInt(idCard.substring(16, 17));
        this.formData.gender = genderCode % 2 === 0 ? '女' : '男';
      }
    },
    
    /**
     * 选择器变化事件
     */
    onMaritalStatusChange(e) {
      this.formData.maritalStatus = this.maritalStatusOptions[e.detail.value];
    },
    
    onEducationChange(e) {
      this.formData.education = this.educationOptions[e.detail.value];
    },
    
    onOccupationChange(e) {
      this.formData.occupation = this.occupationOptions[e.detail.value];
    },
    
    onRelationshipChange(e) {
      this.formData.emergencyContactRelation = this.relationshipOptions[e.detail.value];
    },
    
    /**
     * 地区选择
     */
    onHouseholdRegionChange(e) {
      const region = e.detail.value;
      this.formData.householdRegion = region.join(' ');
      
      // 如果现居地址与户籍地址相同，同步更新
      if (this.sameAsHousehold) {
        this.formData.currentRegion = this.formData.householdRegion;
      }
    },
    
    onCurrentRegionChange(e) {
      const region = e.detail.value;
      this.formData.currentRegion = region.join(' ');
    },
    
    /**
     * 现居地址与户籍地址相同开关
     */
    onSameAsHouseholdChange(e) {
      this.sameAsHousehold = e.detail.value;
      if (this.sameAsHousehold) {
        // 复制户籍地址到现居地址
        this.formData.currentRegion = this.formData.householdRegion;
        this.formData.currentAddress = this.formData.householdAddress;
      }
    },
    
    /**
     * 验证身份证号
     */
    validateIdCard(idCard) {
      if (!idCard) return false;
      const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      return reg.test(idCard);
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
        { field: 'name', label: '姓名' },
        { field: 'idCard', label: '身份证号' },
        { field: 'mobile', label: '手机号' },
        { field: 'maritalStatus', label: '婚姻状况' },
        { field: 'education', label: '学历' },
        { field: 'occupation', label: '职业' },
        { field: 'monthlyIncome', label: '月收入' },
        { field: 'householdRegion', label: '户籍省市区' },
        { field: 'householdAddress', label: '户籍详细地址' },
        { field: 'currentRegion', label: '现居省市区' },
        { field: 'currentAddress', label: '现居详细地址' },
        { field: 'emergencyContactName', label: '紧急联系人姓名' },
        { field: 'emergencyContactRelation', label: '紧急联系人关系' },
        { field: 'emergencyContactMobile', label: '紧急联系人手机号' }
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
      
      // 验证身份证号
      if (!this.validateIdCard(this.formData.idCard)) {
        uni.showToast({
          title: '请输入正确的身份证号',
          icon: 'none'
        });
        return false;
      }
      
      // 验证手机号
      if (!this.validateMobile(this.formData.mobile)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return false;
      }
      
      // 验证紧急联系人手机号
      if (!this.validateMobile(this.formData.emergencyContactMobile)) {
        uni.showToast({
          title: '请输入正确的紧急联系人手机号',
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
        url: `/public/orders/${this.orderId}/borrower-info`,
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
            url: `/pages/order/create/step3/index?id=${this.orderId}`
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

.form-item.disabled {
  opacity: 0.5;
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


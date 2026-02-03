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
      <!-- 必传资料 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">必传资料</text>
          <text class="title-badge required">必填</text>
        </view>

        <!-- 身份证正面 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label required">身份证正面</text>
            <text class="upload-count">{{ formData.idCardFront.length }}/1</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.idCardFront" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.idCardFront, index)" />
              <view class="image-delete" @tap="deleteImage('idCardFront', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.idCardFront.length < 1" @tap="chooseImage('idCardFront', 1)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>

        <!-- 身份证反面 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label required">身份证反面</text>
            <text class="upload-count">{{ formData.idCardBack.length }}/1</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.idCardBack" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.idCardBack, index)" />
              <view class="image-delete" @tap="deleteImage('idCardBack', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.idCardBack.length < 1" @tap="chooseImage('idCardBack', 1)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>

        <!-- 银行卡照片 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label required">银行卡照片</text>
            <text class="upload-count">{{ formData.bankCard.length }}/1</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.bankCard" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.bankCard, index)" />
              <view class="image-delete" @tap="deleteImage('bankCard', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.bankCard.length < 1" @tap="chooseImage('bankCard', 1)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 选传资料 -->
      <view class="form-section">
        <view class="section-title">
          <text class="title-text">选传资料</text>
          <text class="title-badge optional">选填</text>
        </view>

        <!-- 户口本 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label">户口本</text>
            <text class="upload-count">{{ formData.householdRegister.length }}/5</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.householdRegister" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.householdRegister, index)" />
              <view class="image-delete" @tap="deleteImage('householdRegister', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.householdRegister.length < 5" @tap="chooseImage('householdRegister', 5)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>

        <!-- 收入证明 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label">收入证明</text>
            <text class="upload-count">{{ formData.incomeProof.length }}/5</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.incomeProof" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.incomeProof, index)" />
              <view class="image-delete" @tap="deleteImage('incomeProof', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.incomeProof.length < 5" @tap="chooseImage('incomeProof', 5)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>

        <!-- 其他资料 -->
        <view class="upload-item">
          <view class="upload-header">
            <text class="upload-label">其他资料</text>
            <text class="upload-count">{{ formData.others.length }}/9</text>
          </view>
          <view class="upload-grid">
            <view class="image-item" v-for="(img, index) in formData.others" :key="index">
              <image class="image" :src="img" mode="aspectFill" @tap="previewImage(formData.others, index)" />
              <view class="image-delete" @tap="deleteImage('others', index)">
                <text class="delete-icon">×</text>
              </view>
            </view>
            <view class="upload-btn" v-if="formData.others.length < 9" @tap="chooseImage('others', 9)">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传照片</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="tips-section">
        <view class="tips-title">
          <text class="tips-icon">📸</text>
          <text class="tips-title-text">拍照提示</text>
        </view>
        <view class="tips-content">
          <text class="tips-item">• 请确保照片清晰，信息完整可见</text>
          <text class="tips-item">• 身份证照片需包含四角，避免反光</text>
          <text class="tips-item">• 银行卡照片需清晰显示卡号和持卡人姓名</text>
          <text class="tips-item">• 支持 JPG、PNG 格式，单张不超过 5MB</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="footer-buttons">
      <button class="btn btn-secondary" @tap="goBack">上一步</button>
      <button class="btn btn-primary" @tap="submitOrder">完成并提交</button>
    </view>
  </view>
</template>

<script>
const logger = require('@/utils/logger.js');

export default {
  data() {
    return {
      currentStep: 5,
      orderId: null,
      formData: {
        idCardFront: [],      // 身份证正面
        idCardBack: [],       // 身份证反面
        bankCard: [],         // 银行卡照片
        householdRegister: [], // 户口本
        incomeProof: [],      // 收入证明
        others: []            // 其他资料
      }
    };
  },
  
  onLoad(query) {
    this.orderId = query.id;
    if (!this.orderId) {
      uni.showToast({
        title: '请先完成银行卡信息',
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
        if (data.documents) {
          this.formData = { ...this.formData, ...data.documents };
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
     * 选择图片
     */
    chooseImage(field, maxCount) {
      const currentCount = this.formData[field].length;
      const remainCount = maxCount - currentCount;
      
      uni.chooseImage({
        count: remainCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          this.uploadImages(field, tempFilePaths);
        }
      });
    },
    
    /**
     * 上传图片
     */
    uploadImages(field, filePaths) {
      uni.showLoading({ title: '上传中...' });
      
      const uploadPromises = filePaths.map(filePath => {
        return this.uploadSingleImage(filePath);
      });
      
      Promise.all(uploadPromises).then(urls => {
        this.formData[field] = [...this.formData[field], ...urls];
        uni.hideLoading();
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
        logger.info(`上传${urls.length}张图片成功`);
      }).catch(err => {
        uni.hideLoading();
        logger.error('上传图片失败:', err);
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        });
      });
    },
    
    /**
     * 上传单张图片
     */
    uploadSingleImage(filePath) {
      return new Promise((resolve, reject) => {
        const upload = uni.$upload || require('@/utils/upload.js');
        
        upload.uploadFile({
          filePath: filePath,
          name: 'file'
        }).then(res => {
          resolve(res.url);
        }).catch(err => {
          reject(err);
        });
      });
    },
    
    /**
     * 删除图片
     */
    deleteImage(field, index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这张照片吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData[field].splice(index, 1);
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    },
    
    /**
     * 预览图片
     */
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: current
      });
    },
    
    /**
     * 验证表单
     */
    validateForm() {
      // 验证必传资料
      const required = [
        { field: 'idCardFront', label: '身份证正面' },
        { field: 'idCardBack', label: '身份证反面' },
        { field: 'bankCard', label: '银行卡照片' }
      ];
      
      for (let item of required) {
        if (this.formData[item.field].length === 0) {
          uni.showToast({
            title: `请上传${item.label}`,
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
      
      return req.request({
        url: `/public/orders/${this.orderId}/documents`,
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
     * 提交订单
     */
    submitOrder() {
      this.saveData().then(() => {
        // 保存成功后，提交订单
        uni.showLoading({ title: '提交中...' });
        
        const req = uni.$request || require('@/utils/request.js');
        
        return req.request({
          url: `/public/orders/${this.orderId}/submit`,
          method: 'POST'
        });
      }).then(() => {
        uni.hideLoading();
        
        // 提交成功
        uni.showModal({
          title: '提交成功',
          content: '订单已提交，请等待审核',
          showCancel: false,
          success: () => {
            // 跳转到订单详情页
            uni.redirectTo({
              url: `/pages/order/detail/index?id=${this.orderId}`
            });
          }
        });
        
        logger.info('订单提交成功:', this.orderId);
      }).catch(err => {
        uni.hideLoading();
        logger.error('提交订单失败:', err);
        
        if (err !== '验证失败') {
          uni.showToast({
            title: '提交失败',
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.title-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.title-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.title-badge.required {
  background: #ffebee;
  color: #ff6f6f;
}

.title-badge.optional {
  background: #e3f2fd;
  color: #2196f3;
}

/* 上传项 */
.upload-item {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.upload-item:last-child {
  border-bottom: none;
}

.upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.upload-label {
  font-size: 28rpx;
  color: #333;
}

.upload-label.required::before {
  content: '*';
  color: #ff6f6f;
  margin-right: 4rpx;
}

.upload-count {
  font-size: 24rpx;
  color: #999;
}

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #ffffff;
  font-size: 36rpx;
  line-height: 1;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.upload-icon {
  font-size: 60rpx;
  color: #999;
  line-height: 1;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

/* 提示信息 */
.tips-section {
  background: #f0f7ff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #d0e8ff;
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
  color: #2196f3;
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


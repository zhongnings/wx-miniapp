<template>
  <view class="detail-container">
    <!-- 顶部导航栏 -->
    <view class="navbar fixed-navbar">
      <view class="navbar-left" @tap="goBack">
        <text class="navbar-icon">&lt;</text>
      </view>
      <view class="navbar-title">订单详情</view>
    </view>

    <scroll-view class="content-area" scroll-y enhanced :show-scrollbar="false">
      <!-- 订单摘要卡片 -->
      <view class="summary-card">
        <view class="summary-row">
          <text class="summary-label">借款人员：</text>
          <text class="summary-value">{{ detail.borrowerName || '-' }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">借款金额：</text>
          <text class="summary-amount">¥ {{ formattedAmount }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">订单编号：</text>
          <text class="summary-value">{{ detail.orderNo || '-' }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">订单状态：</text>
          <text class="summary-value">{{ detail.orderStatus || '-' }}</text>
          <text class="detail-link" @tap="goOrderDetail">订单详情 ></text>
        </view>
        <view class="summary-row">
          <text class="summary-label">债转状态：</text>
          <text class="summary-value">{{ detail.debtTransferStatus || '-' }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">还款状态：</text>
          <text class="summary-value">{{ detail.repaymentStatus || '-' }}</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="separator">
        <text class="separator-text">———<text class="asterisk">*</text>标记为必填选项——</text>
      </view>

      <!-- 基础信息部分 -->
      <view class="basic-info-section">
        <view class="section-header" @tap="toggleBasicInfo">
          <view class="section-indicator"></view>
          <text class="section-title">基础信息</text>
          <text class="section-arrow" :class="{ expanded: basicInfoExpanded }">^</text>
        </view>
        
        <view class="info-list" v-if="basicInfoExpanded">
          <!-- 借款信息（必填） -->
          <view class="info-item" @tap="goLoanInfo">
            <view class="info-icon loan-icon">📄</view>
            <text class="info-label">借款信息</text>
            <text class="info-status" :class="{ completed: infoStatus.loanInfo === '已完成', 'not-filled': infoStatus.loanInfo !== '已完成' }">
              <text class="required-mark">*</text>{{ infoStatus.loanInfo }}
            </text>
          </view>

          <!-- 借款人信息（必填） -->
          <view class="info-item" @tap="goBorrowerInfo">
            <view class="info-icon borrower-icon">👤</view>
            <text class="info-label">借款人信息</text>
            <text class="info-status" :class="{ completed: infoStatus.borrowerInfo === '已完成', 'not-filled': infoStatus.borrowerInfo !== '已完成' }">
              <text class="required-mark">*</text>{{ infoStatus.borrowerInfo }}
            </text>
          </view>

          <!-- 共借人信息 -->
          <view class="info-item" @tap="goCoBorrowerInfo">
            <view class="info-icon co-borrower-icon">👥</view>
            <text class="info-label">共借人信息</text>
            <text class="info-status" :class="{ completed: infoStatus.coBorrowerInfo === '已完成', 'not-filled': infoStatus.coBorrowerInfo !== '已完成' }">
              {{ infoStatus.coBorrowerInfo }}
            </text>
          </view>

          <!-- 担保人信息 -->
          <view class="info-item" @tap="goGuarantorInfo">
            <view class="info-icon guarantor-icon">🤝</view>
            <text class="info-label">担保人信息</text>
            <text class="info-status" :class="{ completed: infoStatus.guarantorInfo === '已完成', 'not-filled': infoStatus.guarantorInfo !== '已完成' }">
              {{ infoStatus.guarantorInfo }}
            </text>
          </view>

          <!-- 银行卡信息（必填） -->
          <view class="info-item" @tap="goBankCardInfo">
            <view class="info-icon bank-icon">💳</view>
            <text class="info-label">银行卡信息</text>
            <text class="info-status" :class="{ completed: infoStatus.bankCardInfo === '已完成', 'not-filled': infoStatus.bankCardInfo !== '已完成' }">
              <text class="required-mark">*</text>{{ infoStatus.bankCardInfo }}
            </text>
          </view>

          <!-- 资料上传 -->
          <view class="info-item" @tap="goAttachment">
            <view class="info-icon attachment-icon">📎</view>
            <text class="info-label">资料上传</text>
            <text class="info-status" :class="{ completed: infoStatus.attachment === '已上传', 'not-uploaded': infoStatus.attachment !== '已上传' }">
              {{ infoStatus.attachment }}
            </text>
          </view>

          <!-- 合同列表（提交后显示） -->
          <view class="info-item" v-if="showContractList" @tap="goContractList">
            <view class="info-icon contract-icon">📋</view>
            <text class="info-label">合同列表</text>
            <text class="info-status view-status">查看</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="submit-button" @tap="onSubmit">
      <text class="submit-text">{{ buttonText }}</text>
    </view>
  </view>
</template>

<script>
const logger = require('../../../utils/logger.js');

export default {
  data() {
    return {
      id: null,
      detail: {},
      attachments: [],
      contracts: [],
      basicInfoExpanded: true,
      formattedAmount: '0.00',
      infoStatus: {
        loanInfo: '未填写',
        borrowerInfo: '未填写',
        coBorrowerInfo: '未填写',
        guarantorInfo: '未填写',
        bankCardInfo: '未填写',
        attachment: '未上传'
      },
      buttonText: '立即提交',
      showContractList: false
    };
  },
  
  onLoad(query) {
    this.id = query.id;
    this.loadDetail();
  },
  
  onShow() {
    if (this.id) {
      this.loadDetail();
    }
  },
  
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 切换基础信息展开/收起
     */
    toggleBasicInfo() {
      this.basicInfoExpanded = !this.basicInfoExpanded;
    },
    
    /**
     * 加载订单详情
     */
    loadDetail() {
      uni.showLoading({ title: '加载中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${this.id}`,
        method: 'GET'
      }).then(res => {
        const detail = res.data || {};
        
        // 格式化金额
        const formattedAmount = detail.loanAmount ? 
          parseFloat(detail.loanAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
          '0.00';
        
        // 计算基础信息状态
        const infoStatus = {
          loanInfo: detail.loanInfo ? '已完成' : '未填写',
          borrowerInfo: detail.borrowerInfo && detail.borrowerInfo.name && detail.borrowerInfo.name !== '未填写' ? '已完成' : '未填写',
          coBorrowerInfo: detail.coBorrowerInfo && detail.coBorrowerInfo.name && detail.coBorrowerInfo.name !== '未填写' ? '已完成' : '未填写',
          guarantorInfo: detail.guarantorInfo && detail.guarantorInfo.name && detail.guarantorInfo.name !== '未填写' ? '已完成' : '未填写',
          bankCardInfo: detail.bankCardInfo && detail.bankCardInfo.cardNo ? '已完成' : '未填写',
          attachment: (detail.attachments && detail.attachments.length > 0) ? '已上传' : '未上传'
        };
        
        // 判断必填项是否完成
        const requiredFieldsComplete = 
          infoStatus.loanInfo === '已完成' && 
          infoStatus.borrowerInfo === '已完成' && 
          infoStatus.bankCardInfo === '已完成';
        
        // 判断订单是否已提交
        const isSubmitted = detail.orderStatus !== null && detail.orderStatus !== 0;
        
        // 设置按钮文字和合同列表显示
        let buttonText = '立即提交';
        let showContractList = false;
        
        if (isSubmitted) {
          buttonText = '驳回';
          showContractList = true;
        } else if (!requiredFieldsComplete) {
          buttonText = '立即完善资料';
        }
        
        this.detail = detail;
        this.attachments = detail.attachments || [];
        this.formattedAmount = formattedAmount;
        this.infoStatus = infoStatus;
        this.buttonText = buttonText;
        this.showContractList = showContractList;
        
        logger.info('订单详情加载成功:', detail);
      }).catch(err => {
        logger.error('加载订单详情失败:', err);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 订单详情链接
     */
    goOrderDetail() {
      uni.showToast({
        title: '订单详情功能待实现',
        icon: 'none'
      });
    },
    
    /**
     * 立即提交/立即完善资料/驳回
     */
    onSubmit() {
      const { buttonText } = this;
      
      // 如果是"立即完善资料"，跳转到第一个未完成的必填项
      if (buttonText === '立即完善资料') {
        this.goToFirstIncompleteRequiredField();
        return;
      }
      
      // 如果是"驳回"，执行驳回操作
      if (buttonText === '驳回') {
        uni.showModal({
          title: '确认驳回',
          content: '确定要驳回这个订单吗？驳回后将删除所有合同信息，订单状态将恢复为待提交。',
          success: (res) => {
            if (res.confirm) {
              this.rejectOrder();
            }
          }
        });
        return;
      }
      
      // 如果是"立即提交"，执行提交操作
      if (buttonText === '立即提交') {
        uni.showModal({
          title: '确认提交',
          content: '确定要提交这个订单吗？',
          success: (res) => {
            if (res.confirm) {
              this.submitOrder();
            }
          }
        });
      }
    },
    
    /**
     * 跳转到第一个未完成的必填项
     */
    goToFirstIncompleteRequiredField() {
      const { infoStatus } = this;
      
      if (infoStatus.loanInfo !== '已完成') {
        this.goLoanInfo();
      } else if (infoStatus.borrowerInfo !== '已完成') {
        this.goBorrowerInfo();
      } else if (infoStatus.bankCardInfo !== '已完成') {
        this.goBankCardInfo();
      }
    },
    
    /**
     * 提交订单
     */
    submitOrder() {
      uni.showLoading({ title: '提交中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${this.id}/submit`,
        method: 'POST'
      }).then(() => {
        uni.hideLoading();
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        });
        this.loadDetail();
      }).catch(err => {
        uni.hideLoading();
        logger.error('提交订单失败:', err);
        uni.showToast({
          title: err.message || '提交失败',
          icon: 'none'
        });
      });
    },
    
    /**
     * 驳回订单
     */
    rejectOrder() {
      uni.showLoading({ title: '驳回中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${this.id}/reject`,
        method: 'POST'
      }).then(() => {
        uni.hideLoading();
        uni.showToast({
          title: '驳回成功',
          icon: 'success'
        });
        this.loadDetail();
      }).catch(err => {
        uni.hideLoading();
        logger.error('驳回订单失败:', err);
        uni.showToast({
          title: err.message || '驳回失败',
          icon: 'none'
        });
      });
    },
    
    goLoanInfo() {
      uni.navigateTo({
        url: `/pages/order/create/step1/index?mode=view&id=${this.id}`
      });
    },
    
    goBorrowerInfo() {
      uni.navigateTo({
        url: `/pages/order/create/step2/index?mode=view&id=${this.id}`
      });
    },
    
    goCoBorrowerInfo() {
      uni.navigateTo({
        url: `/pages/order/create/step3/index?mode=view&id=${this.id}`
      });
    },
    
    goGuarantorInfo() {
      uni.navigateTo({
        url: `/pages/order/create/step4/index?mode=view&id=${this.id}`
      });
    },
    
    goBankCardInfo() {
      uni.navigateTo({
        url: `/pages/order/create/step5/index?mode=view&id=${this.id}`
      });
    },
    
    goAttachment() {
      uni.navigateTo({
        url: `/pages/order/create/step6/index?mode=view&id=${this.id}`
      });
    },
    
    goContractList() {
      uni.navigateTo({
        url: `/pages/order/contracts/index?id=${this.id}`
      });
    }
  }
};
</script>

<style scoped>
@import './index.wxss';
</style>


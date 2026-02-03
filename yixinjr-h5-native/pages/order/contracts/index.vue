<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="navbar-left" @tap="goBack">
        <text class="navbar-icon">&lt;</text>
      </view>
      <view class="navbar-title">合同协议</view>
    </view>

    <scroll-view class="content-area" scroll-y enhanced :show-scrollbar="false">
      <!-- 签署列表标题 -->
      <view class="section-title">签署列表</view>
      
      <!-- 合同列表 -->
      <view class="contract-card" v-for="item in contracts" :key="item.id">
        <!-- 合同名称和状态 -->
        <view class="contract-header">
          <text class="contract-name">{{ item.name }}</text>
          <text class="status-badge" :class="{ signed: item.status === '已签', unsigned: item.status !== '已签' }">
            {{ item.status }}
          </text>
        </view>
        
        <!-- 签署人信息 -->
        <view class="signer-info">签署人：{{ item.signer }}</view>
        
        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button class="action-btn preview-btn" @tap="onPreview(item.pdfUrl)">预览</button>
          <button class="action-btn urge-btn" @tap="onUrgeSign(item.id)">催签</button>
          <button class="action-btn qrcode-btn" @tap="onShowQRCode(item.id, item.qrCodeUrl)">签署二维码</button>
        </view>
      </view>
      
      <view v-if="!contracts.length" class="empty">暂无合同</view>
    </scroll-view>

    <!-- 二维码弹窗 -->
    <view class="qrcode-modal" :class="{ hide: !showQRCodeModal }" @tap="closeQRCodeModal">
      <view class="qrcode-content" @tap.stop="stopPropagation">
        <text class="qrcode-title">签署二维码</text>
        <image class="qrcode-image" :src="qrCodeUrl" mode="aspectFit" v-if="qrCodeUrl"></image>
        <text class="qrcode-tip">请使用微信扫描二维码进行签署</text>
        <view class="qrcode-actions">
          <button class="qrcode-btn cancel" @tap="closeQRCodeModal">关闭</button>
          <button class="qrcode-btn save" @tap="saveQRCode">保存到相册</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const logger = require('../../../utils/logger.js');

export default {
  data() {
    return {
      id: null,
      contracts: [],
      showQRCodeModal: false,
      qrCodeUrl: ''
    };
  },
  
  onLoad(query) {
    this.id = query.id;
    this.loadContracts();
  },
  
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 加载合同列表
     */
    loadContracts() {
      uni.showLoading({ title: '加载中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${this.id}/contracts`,
        method: 'GET'
      }).then(res => {
        this.contracts = res.data || [];
        logger.info('合同列表加载成功:', res.data);
      }).catch(err => {
        logger.error('加载合同列表失败:', err);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 预览合同
     */
    onPreview(url) {
      if (!url) {
        uni.showToast({
          title: '合同文件不存在',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({ title: '加载中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      const fullUrl = url.startsWith('http') ? url : (req.BASE_URL || '') + url;
      
      // #ifdef H5
      // H5 直接打开链接
      uni.hideLoading();
      window.open(fullUrl, '_blank');
      // #endif
      
      // #ifndef H5
      // 小程序下载并打开文档
      uni.downloadFile({
        url: fullUrl,
        success: (res) => {
          const filePath = res.tempFilePath;
          uni.openDocument({
            filePath,
            fileType: 'pdf',
            success: () => {
              uni.hideLoading();
              logger.info('合同预览成功');
            },
            fail: (err) => {
              uni.hideLoading();
              logger.error('打开文档失败:', err);
              uni.showToast({
                title: '预览失败',
                icon: 'none'
              });
            }
          });
        },
        fail: (err) => {
          uni.hideLoading();
          logger.error('下载合同失败:', err);
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },
    
    /**
     * 催签
     */
    onUrgeSign(contractId) {
      uni.showModal({
        title: '确认催签',
        content: '确定要向签署人发送催签提醒吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '发送中...' });
            // TODO: 调用后端催签接口
            setTimeout(() => {
              uni.hideLoading();
              uni.showToast({
                title: '催签提醒已发送',
                icon: 'success'
              });
            }, 1000);
          }
        }
      });
    },
    
    /**
     * 显示签署二维码
     */
    onShowQRCode(contractId, qrCodeUrl) {
      if (!qrCodeUrl) {
        uni.showToast({
          title: '二维码生成失败',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({ title: '生成中...' });
      
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: qrCodeUrl,
        method: 'GET'
      }).then(res => {
        uni.hideLoading();
        const qrCodeImageUrl = res.data?.qrCodeUrl || qrCodeUrl;
        const fullUrl = qrCodeImageUrl.startsWith('http') ? qrCodeImageUrl : (req.BASE_URL || '') + qrCodeImageUrl;
        
        this.showQRCodeModal = true;
        this.qrCodeUrl = fullUrl;
      }).catch(err => {
        uni.hideLoading();
        logger.error('获取二维码失败:', err);
        uni.showToast({
          title: '获取二维码失败',
          icon: 'none'
        });
      });
    },
    
    /**
     * 关闭二维码弹窗
     */
    closeQRCodeModal() {
      this.showQRCodeModal = false;
      this.qrCodeUrl = '';
    },
    
    /**
     * 阻止事件冒泡
     */
    stopPropagation() {},
    
    /**
     * 保存二维码到相册
     */
    saveQRCode() {
      uni.downloadFile({
        url: this.qrCodeUrl,
        success: (res) => {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.showToast({
                title: '保存成功',
                icon: 'success'
              });
            },
            fail: () => {
              uni.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          });
        },
        fail: () => {
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
    }
  }
};
</script>

<style scoped>
@import './index.wxss';
</style>


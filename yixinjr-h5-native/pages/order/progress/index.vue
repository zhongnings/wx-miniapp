<template>
  <scroll-view class="container" scroll-y enhanced :show-scrollbar="false">
    <view class="title">订单进度</view>
    <view class="item" v-for="item in timeline" :key="item.stage">
      <view class="stage">{{ item.stage }}</view>
      <view class="row">操作人：{{ item.operator }}</view>
      <view class="row">时间：{{ item.time }}</view>
      <view class="row">备注：{{ item.remark }}</view>
    </view>
  </scroll-view>
</template>

<script>
export default {
  data() {
    return {
      id: null,
      timeline: []
    };
  },
  
  onLoad(query) {
    this.id = query.id;
    this.loadTimeline();
  },
  
  methods: {
    loadTimeline() {
      const req = uni.$request || require('../../../utils/request.js');
      
      req.request({
        url: `/public/orders/${this.id}/progress`,
        method: 'GET'
      }).then(res => {
        this.timeline = res.data || [];
      }).catch(err => {
        console.error('加载订单进度失败:', err);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
    }
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.stage {
  font-size: 32rpx;
  font-weight: 500;
  color: #ff6f6f;
  margin-bottom: 16rpx;
}

.row {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
  line-height: 1.5;
}

.row:last-child {
  margin-bottom: 0;
}
</style>


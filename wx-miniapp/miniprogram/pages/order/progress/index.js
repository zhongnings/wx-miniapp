Page({
  data: {
    id: null,
    timeline: []
  },

  onLoad(query) {
    this.setData({ id: query.id });
    this.loadTimeline();
  },

  loadTimeline() {
    // 统一请求工具：直接使用全局挂载的 wx.$request（在 app.js 中挂载）
    const req = wx.$request;
    req.request({
      url: `/public/orders/${this.data.id}/progress`,
      method: 'GET',
      success: (res) => {
        this.setData({ timeline: res.data || [] });
      }
    });
  }
});


const app = getApp();

Page({
  data: {
    venue: null
  },

  onLoad(options) {
    if (options?.id) {
      const id = options.id;
      const found = (app.globalData.venues || []).find(v => v._id === id || String(v.id) === String(id));
      if (found) {
        this.setData({ venue: found });
        return;
      }

      // 回退：请求场地列表并查找
      app.request({ url: '/venues/list', data: { page: 1, pageSize: app.globalData.pageSize || 10 } }).then(res => {
        const arr = res.data?.venues || [];
        const v = arr.find(x => x._id === id || String(x.id) === String(id));
        if (v) this.setData({ venue: v });
        else wx.showToast({ title: '场地未找到', icon: 'none' });
      }).catch(() => wx.showToast({ title: '加载场地失败', icon: 'none' }));
    }
  },

  onBook() {
    if (!this.data.venue) return wx.showToast({ title: '场地数据缺失', icon: 'none' });
    // 跳转到预约页并尝试带上场地 id 供预选
    wx.navigateTo({ url: `/pages/book-venue/book-venue?selectedVenueId=${this.data.venue._id}` }).catch(() => {
      wx.showToast({ title: '无法打开预约页', icon: 'none' });
    });
  }
});

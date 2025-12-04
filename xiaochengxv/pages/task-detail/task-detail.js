const app = getApp();

Page({
  data: {
    task: null
  },

  onLoad(options) {
    if (options?.id) {
      const id = options.id;
      const found = (app.globalData.myTasks || []).find(t => t._id === id);
      if (found) {
        this.setData({ task: found });
        return;
      }

      // 尝试从任务列表接口查找
      app.request({ url: '/tasks/list', data: { page: 1, pageSize: app.globalData.pageSize || 10 } }).then(res => {
        const all = res.data?.tasks || [];
        const t = all.find(x => x._id === id);
        if (t) this.setData({ task: t });
        else wx.showToast({ title: '任务未找到', icon: 'none' });
      }).catch(() => {
        wx.showToast({ title: '加载任务失败', icon: 'none' });
      });
    }
  },

  onContactTap() {
    wx.showToast({ title: '联系发布者功能开发中', icon: 'none' });
  },

  onApplyTap() {
    wx.showToast({ title: '申请任务功能开发中', icon: 'none' });
  }
});

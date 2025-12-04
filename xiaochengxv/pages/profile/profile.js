const app = getApp();

Page({
  data: {
    userInfo: null
  },

  onLoad(options) {
    console.log('个人中心页面加载');
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },

  onShow() {
    console.log('个人中心页面显示');
    // 每次页面显示时更新用户信息
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除全局数据
          app.globalData.token = '';
          app.globalData.userInfo = null;
          
          // 清除本地存储
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          // 更新页面数据
          this.setData({ userInfo: null });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 其他菜单项点击处理
  goToMyTasks() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/my-tasks/my-tasks'
    });
  },

  goToMyBookings() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/my-bookings/my-bookings'
    });
  },

  goToMyResources() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/my-resources/my-resources'
    });
  },

  // 发布新任务
  postNewTask() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/post-task/post-task'
    });
  },

  // 预约新场地
  bookNewVenue() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/book-venue/book-venue'
    });
  },

  // 分享新资源
  uploadNewResource() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/upload-resource/upload-resource'
    });
  },

  goToSettings() {
    if (!this.checkAuth()) return;
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  // 检查认证状态
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      
      return false;
    }
    return true;
  }
});
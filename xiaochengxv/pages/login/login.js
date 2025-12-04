// pages/login/login.js
const app = getApp();

Page({
  data: {
    userName: '',
    password: '',
    isLoggingIn: false
  },

  onInputUserName(e) {
    this.setData({ userName: e.detail.value });
  },

  onInputPassword(e) {
    this.setData({ password: e.detail.value });
  },

  async onLogin() {
    const { userName, password } = this.data;

    if (!userName || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    this.setData({ isLoggingIn: true });

    try {
      const res = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: { userName: userName.trim(), password }
      });

      if (res && (res.success || res.code === 200)) {
        // 假设后端返回 token 和 userInfo
        const token = res.token || res.data?.token;
        const userInfo = res.user || res.data || {};

        if (token) wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', userInfo);
        app.globalData.userInfo = userInfo;

        wx.showToast({ title: '登录成功', icon: 'success' });

        // 导航到 tab 页面（例如个人页或首页）
        setTimeout(() => {
          wx.switchTab({ url: '/pages/profile/profile' });
        }, 800);
      } else {
        throw new Error(res?.message || '登录失败');
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ isLoggingIn: false });
    }
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  useTestAccount() {
    this.setData({ userName: 'test', password: 'test' }, () => {
      this.onLogin();
    });
  }
});
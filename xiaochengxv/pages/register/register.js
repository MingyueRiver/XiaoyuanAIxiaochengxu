// pages/register/register.js
const app = getApp();

Page({
  data: {
    userName: '',
    password: '',
    confirmPassword: '',
    email: '',
    isRegistering: false
  },

  onInputUserName(e) {
    this.setData({ userName: e.detail.value });
  },

  onInputPassword(e) {
    this.setData({ password: e.detail.value });
  },

  onInputConfirmPassword(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onInputEmail(e) {
    this.setData({ email: e.detail.value });
  },

  async onRegister() {
    const { userName, password, confirmPassword, email } = this.data;

    if (!userName || !password || !confirmPassword || !email) {
      wx.showToast({ title: '请填写所有必填项', icon: 'none' });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }

    this.setData({ isRegistering: true });

    try {
      const res = await app.request({
        url: '/auth/register',
        method: 'POST',
        data: {
          userName: userName.trim(),
          password,
          email: email.trim()
        }
      });

      if (res && (res.success || res.code === 200)) {
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/login/login' });
        }, 1200);
      } else {
        throw new Error(res?.message || '注册失败');
      }
    } catch (err) {
      console.error('注册失败:', err);
      wx.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      this.setData({ isRegistering: false });
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
});

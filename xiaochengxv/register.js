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

    // 验证输入
    if (!userName || !password || !confirmPassword || !email) {
      wx.showToast({
        title: '请填写所有必填项',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    this.setData({ isRegistering: true });

    try {
      // 注册请求
      const result = await this.registerUser({
        userName: userName.trim(),
        password,
        email: email.trim()
      });

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });

      // 自动登录
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);

    } catch (error) {
      console.error('注册失败:', error);
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isRegistering: false });
    }
  },

  // 注册用户
  registerUser(registerData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.baseURL + '/auth/register',
        method: 'POST',
        data: registerData,
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message));
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败'));
        }
      });
    });
  },

  goToLogin() {
    wx.navigateBack();
  }
});
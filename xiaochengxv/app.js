// app.js
App({
  onLaunch() {
    console.log('【小程序启动】初始化中...');

    // 尝试从本地缓存恢复用户登录信息（适配你的 index.js 中的 checkLoginStatus）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo?.userName) {
      this.globalData.userInfo = userInfo;
      console.log('【用户已登录】', userInfo.userName);
    } else {
      console.log('【用户未登录】');
    }
  },

  globalData: {
    userInfo: null,  // 全局用户信息，供 pages/index/index.js 等页面使用
    baseURL: 'https://api.example.com',  // ⚠️ 替换为你实际的后端地址，需在微信开发者后台配置
    useMock: true,  // 【开发模式】设为 true 使用模拟数据，设为 false 使用真实后端
    myTasks: []  // 用户发布的任务列表
  },

  request(options) {
    // 【开发模式】如果启用 MOCK，直接返回模拟数据
    if (this.globalData.useMock) {
      return this.mockRequest(options);
    }

    // 你可以在这里统一添加 token、loading、错误处理等
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') || '',
          ...options.header
        },
        success: (res) => {
          console.log('【网络请求成功】', options.url, res);
          // 假设你的 API 成功时返回 { code: 200, data: ... } 或 { success: true, data: ... }
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            wx.showToast({ title: '请求失败：' + res.statusCode, icon: 'none' });
            reject(new Error('HTTP ' + res.statusCode));
          }
        },
        fail: (err) => {
          console.error('【网络请求失败】', options.url, err);
          wx.showToast({ title: '网络错误，请检查后端地址配置', icon: 'none' });
          reject(err);
        }
      });
    });
  },

  /**
   * 模拟后端请求（开发测试用）
   */
  mockRequest(options) {
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        const { url, data } = options;

        console.log('【MOCK 请求】', url, data);

        // 任务创建接口
        if (url === '/tasks/create') {
          const newTask = {
            _id: Math.random().toString(36).substring(2, 11),
            ...data,
            status: '招募中',
            applicants: 0,
            acceptedBy: null,
            postDate: new Date().toISOString().split('T')[0],
            createdBy: this.globalData.userInfo?.userId || 'user123'
          };
          this.globalData.myTasks.push(newTask);
          resolve({
            success: true,
            code: 200,
            message: '任务发布成功',
            data: newTask
          });
          return;
        }

        // 获取我的任务接口
        if (url === '/tasks/my-tasks') {
          resolve({
            success: true,
            code: 200,
            data: {
              tasks: this.globalData.myTasks
            }
          });
          return;
        }

        // 注册接口
          if (url === '/auth/register') {
            resolve({
              success: true,
              code: 200,
              message: '注册成功',
              data: {
                userId: Math.random().toString(36).substring(2, 11),
                userName: data.userName,
                email: data.email
              }
            });
            return;
          }        // 登录接口
        if (url === '/auth/login') {
          // 简单的测试账号验证
          if (data.userName === 'test' && data.password === 'test') {
            resolve({
              success: true,
              code: 200,
              message: '登录成功',
              token: 'mock-token-' + Date.now(),
              data: {
                userId: '123456',
                userName: data.userName,
                email: 'test@example.com',
                avatarUrl: '/images/avatar-default.png'
              }
            });
          } else {
            resolve({
              success: false,
              code: 401,
              message: '用户名或密码错误'
            });
          }
          return;
        }

        // 其他接口返回默认成功
        resolve({
          success: true,
          code: 200,
          data: {}
        });
      }, 800);
    });
  }
});
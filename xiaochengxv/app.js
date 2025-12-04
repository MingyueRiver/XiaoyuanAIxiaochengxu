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
    myTasks: [],  // 用户发布的任务列表
    // 全局分页默认值
    pageSize: 10,
    venues: [
      { _id: '1', name: '图书馆研讨室A', type: '讨论室', location: '图书馆3楼', image: '/images/venue-default.png', pricePerHour: 20, capacity: 8, rating: 4.8, reviews: 156, facilities: ['空调','白板','投影仪','WIFI'], description: '宽敞明亮的讨论室，配备现代化设施，非常适合学习讨论和小组活动', available: true },
      { _id: '2', name: '教学楼101教室', type: '教室', location: '1号楼1层', image: '/images/venue-default.png', pricePerHour: 15, capacity: 30, rating: 4.5, reviews: 203, facilities: ['空调','投影仪','WIFI','讲台'], description: '标准教室，设施齐全，适合举办讲座、课程培训、班级活动等', available: true },
      { _id: '3', name: '体育馆羽毛球场', type: '运动场', location: '体育馆2楼', image: '/images/venue-default.png', pricePerHour: 50, capacity: 4, rating: 4.9, reviews: 89, facilities: ['网线','照明灯','更衣室','淋浴间'], description: '专业羽毛球场地，配备完善的运动设施和安全措施', available: true }
    ],
    resources: [
      { _id: 'r1', title: '大学英语四级备考攻略', desc: '听力+阅读+写作+翻译全题型技巧，附高频词汇', coverUrl: '/images/article1.png', type: 'article', isFree: true, author: '英语老师', views: 1286, collectCount: 326, updateTime: '2025-10-15', fileName: 'cet4_guide.pdf', price: 0 },
      { _id: 'r2', title: '数据结构笔记', desc: '包含链表、栈、队列、树与图的详细讲解', coverUrl: '/images/note-default.png', type: 'note', isFree: false, author: 'CS同学', views: 654, collectCount: 120, updateTime: '2025-11-10', fileName: 'ds_notes.zip', price: 12 }
    ],
    bookings: []
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
    const self = this;
    return new Promise((resolve) => {
      setTimeout(() => {
        const { url, data } = options;
        console.log('【MOCK 请求】', url, data);

        const send = (payload) => resolve(payload);

        const paginate = (arr, page = 1, pageSize = 20) => {
          const p = Number.parseInt(page, 10) || 1;
          const s = Number.parseInt(pageSize, 10) || 20;
          const start = (p - 1) * s;
          return { items: arr.slice(start, start + s), total: arr.length };
        };

        const handlers = {
          '/venues/list': () => {
            const p = paginate(self.globalData.venues, data?.page, data?.pageSize);
            send({ success: true, code: 200, data: { venues: p.items, total: p.total } });
          },
          '/venues/book': () => {
            const booking = Object.assign({
              _id: Math.random().toString(36).substring(2, 9),
              createdBy: self.globalData.userInfo?.userId || 'user123',
              status: '待确认',
              createdAt: new Date().toISOString()
            }, data);
            self.globalData.bookings.push(booking);
            send({ success: true, code: 200, message: '预约成功', data: booking });
          },
          '/venues/my-bookings': () => {
            const userId = self.globalData.userInfo?.userId || 'user123';
            const p = paginate(self.globalData.bookings.filter(b => b.createdBy === userId), data?.page, data?.pageSize);
            send({ success: true, code: 200, data: { bookings: p.items, total: p.total } });
          },
          '/venues/cancel-booking': () => {
            const bookingId = data.bookingId;
            const idx = self.globalData.bookings.findIndex(b => b._id === bookingId);
            if (idx > -1) {
              self.globalData.bookings[idx].status = '已取消';
              send({ success: true, code: 200, message: '取消成功' });
            } else {
              send({ success: false, code: 404, message: '预约不存在' });
            }
          },
          '/resources/list': () => {
            const p = paginate(self.globalData.resources, data?.page, data?.pageSize);
            send({ success: true, code: 200, data: { resources: p.items, total: p.total } });
          },
          '/resources/upload': () => {
            const newRes = Object.assign({
              _id: Math.random().toString(36).substring(2, 9),
              author: self.globalData.userInfo?.userName || '匿名',
              views: 0,
              collectCount: 0,
              updateTime: new Date().toISOString().split('T')[0]
            }, data);
            self.globalData.resources.unshift(newRes);
            send({ success: true, code: 200, message: '资源发布成功', data: newRes });
          },
          '/tasks/create': () => {
            const newTask = Object.assign({
              _id: Math.random().toString(36).substring(2, 11),
              status: '招募中',
              applicants: 0,
              acceptedBy: null,
              postDate: new Date().toISOString().split('T')[0],
              createdBy: self.globalData.userInfo?.userId || 'user123'
            }, data);
            self.globalData.myTasks.unshift(newTask);
            send({ success: true, code: 200, message: '任务发布成功', data: newTask });
          },
          '/tasks/my-tasks': () => {
            const p = paginate(self.globalData.myTasks, data?.page, data?.pageSize);
            send({ success: true, code: 200, data: { tasks: p.items, total: p.total } });
          },
          '/tasks/list': () => {
            const mockTasks = [
              { _id: '201', title: '帮忙取快递', description: '快递在西门快递点', location: '西门快递点', reward: 5, status: '招募中', urgency: 'medium', urgencyText: '中等', applicants: 3, acceptedBy: null, postDate: '2025-12-04', deadline: '2025-12-05' }
            ];
            const combined = [...self.globalData.myTasks, ...mockTasks];
            const p = paginate(combined, data?.page, data?.pageSize);
            send({ success: true, code: 200, data: { tasks: p.items, total: p.total } });
          },
          '/auth/register': () => send({ success: true, code: 200, message: '注册成功', data: { userId: Math.random().toString(36).substring(2, 11), userName: data.userName, email: data.email } }),
          '/auth/login': () => {
            if (data.userName === 'test' && data.password === 'test') send({ success: true, code: 200, message: '登录成功', token: 'mock-token-' + Date.now(), data: { userId: '123456', userName: data.userName, email: 'test@example.com', avatarUrl: '/images/avatar-default.png' } });
            else send({ success: false, code: 401, message: '用户名或密码错误' });
          }
        };

        if (handlers[url]) return handlers[url]();

        // 默认返回空成功
        send({ success: true, code: 200, data: {} });
      }, 500);
    });
  }
});
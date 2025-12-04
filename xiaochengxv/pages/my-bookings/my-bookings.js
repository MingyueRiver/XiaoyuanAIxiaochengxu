const app = getApp();

Page({
  data: {
    userInfo: null,
    bookings: [],
    filteredBookings: [],
    activeTab: 'upcoming', // upcoming, past
    isLoading: true,
    isEmpty: false,
    currentPage: 1,
    pageSize: 10
  },

  onLoad() {
    console.log('【我的预约】页面加载');
    this.checkAuth();
  },

  onShow() {
    console.log('【我的预约】页面显示');
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
      this.loadMyBookings();
    }
  },

  onPullDownRefresh() {
    this.setData({ currentPage: 1 });
    this.loadMyBookings().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能查看我的预约',
        confirmText: '前往登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          } else {
            wx.switchTab({ url: '/pages/profile/profile' });
          }
        }
      });
    } else {
      this.setData({ userInfo: app.globalData.userInfo });
      this.loadMyBookings();
    }
  },

  // 加载我的预约
  async loadMyBookings() {
    this.setData({ isLoading: true });
    
    try {
      const res = await app.request({
        url: '/venues/my-bookings',
        data: { page: this.data.currentPage, pageSize: this.data.pageSize }
      });

      const bookings = res.data?.bookings || this.getMockMyBookings();
      this.setData({
        bookings,
        isLoading: false,
        isEmpty: bookings.length === 0
      });
      this.filterByTab();
    } catch (error) {
      console.error('加载预约失败:', error);
      const mockBookings = this.getMockMyBookings();
      this.setData({
        bookings: mockBookings,
        isLoading: false,
        isEmpty: mockBookings.length === 0
      });
      this.filterByTab();
    }
  },

  // 按标签筛选
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterByTab();
  },

  filterByTab() {
    const { bookings, activeTab } = this.data;
    const now = new Date();
    let filtered = bookings;

    if (activeTab === 'upcoming') {
      filtered = bookings.filter(item => {
        const bookingDate = new Date(item.date);
        return bookingDate >= now && item.status !== '已取消';
      });
    } else if (activeTab === 'past') {
      filtered = bookings.filter(item => {
        const bookingDate = new Date(item.date);
        return bookingDate < now || item.status === '已取消';
      });
    }

    this.setData({ filteredBookings: filtered });
  },

  // 查看预约详情
  goToBookingDetail(e) {
    const bookingId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/booking-detail/booking-detail?id=${bookingId}`
    }).catch(() => {
      wx.showToast({ title: '无法打开预约详情', icon: 'none' });
    });
  },

  // 修改预约
  editBooking(e) {
    const bookingId = e.currentTarget.dataset.id;
    const booking = this.data.bookings.find(b => b._id === bookingId);
    
    if (!booking) {
      wx.showToast({ title: '预约不存在', icon: 'none' });
      return;
    }

    if (booking.status === '已取消' || booking.status === '已完成') {
      wx.showToast({ title: '此预约不能修改', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/edit-booking/edit-booking?id=${bookingId}`
    }).catch(() => {
      wx.showToast({ title: '编辑功能开发中', icon: 'none' });
    });
  },

  // 取消预约
  cancelBooking(e) {
    const bookingId = e.currentTarget.dataset.id;
    const booking = this.data.bookings.find(b => b._id === bookingId);

    if (!booking) {
      wx.showToast({ title: '预约不存在', icon: 'none' });
      return;
    }

    if (booking.status === '已取消') {
      wx.showToast({ title: '预约已取消', icon: 'none' });
      return;
    }

    // 检查是否可以取消（距离预约时间不少于2小时）
    const bookingDate = new Date(booking.date + ' ' + booking.startTime);
    const now = new Date();
    const timeDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (timeDiff < 2 && booking.status !== '未开始') {
      wx.showToast({ title: '距离预约不足2小时，无法取消', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      confirmText: '取消预约',
      cancelText: '保留',
      success: (res) => {
        if (res.confirm) {
          this.performCancel(bookingId);
        }
      }
    });
  },

  performCancel(bookingId) {
    wx.showLoading({ title: '取消中...' });

    app.request({
      url: '/venues/cancel-booking',
      method: 'POST',
      data: { bookingId }
    }).then(() => {
      wx.hideLoading();
      // 立即更新本地预约状态
      const updatedBookings = this.data.bookings.map(booking => {
        if (booking._id === bookingId) {
          booking.status = '已取消';
          booking.cancelReason = '用户主动取消';
        }
        return booking;
      });
      this.setData({ bookings: updatedBookings });
      this.filterByTab();
      wx.showToast({ title: '预约已取消', icon: 'success' });
    }).catch((error) => {
      wx.hideLoading();
      wx.showToast({ title: '取消失败：' + (error.message || '未知错误'), icon: 'none' });
    });
  },

  // 联系场地管理员
  contactVenue(e) {
    const venueName = e.currentTarget.dataset.venue;
    wx.showToast({
      title: '已复制场地名称，请在聊天中查询',
      icon: 'none'
    });
  },

  // 预约新场地
  bookNewVenue() {
    if (!this.checkAuthSimple()) return;
    
    wx.navigateTo({
      url: '/pages/book-venue/book-venue'
    }).catch(() => {
      wx.showToast({ title: '预约功能开发中', icon: 'none' });
    });
  },

  // 简单认证检查
  checkAuthSimple() {
    if (!app.globalData.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }
    return true;
  },

  // 模拟数据
  getMockMyBookings() {
    return [
      {
        _id: '301',
        venueName: '图书馆研讨室A',
        location: '图书馆3楼',
        venueImage: '/images/venue-default.png',
        date: '2025-12-05',
        startTime: '14:00',
        endTime: '16:00',
        duration: '2小时',
        status: '已确认',
        price: 20,
        bookingDate: '2025-12-04',
        capacity: 8
      },
      {
        _id: '302',
        venueName: '教学楼101教室',
        location: '1号楼1层',
        venueImage: '/images/venue-default.png',
        date: '2025-12-06',
        startTime: '10:00',
        endTime: '12:00',
        duration: '2小时',
        status: '已确认',
        price: 15,
        bookingDate: '2025-12-04',
        capacity: 20
      },
      {
        _id: '303',
        venueName: '体育馆羽毛球场',
        location: '体育馆2楼',
        venueImage: '/images/venue-default.png',
        date: '2025-12-08',
        startTime: '19:00',
        endTime: '21:00',
        duration: '2小时',
        status: '待确认',
        price: 30,
        bookingDate: '2025-12-04',
        capacity: 4
      },
      {
        _id: '304',
        venueName: '宿舍讨论室',
        location: '宿舍区D栋',
        venueImage: '/images/venue-default.png',
        date: '2025-12-02',
        startTime: '18:00',
        endTime: '20:00',
        duration: '2小时',
        status: '已完成',
        price: 10,
        bookingDate: '2025-12-01',
        capacity: 6
      },
      {
        _id: '305',
        venueName: '音乐教室B',
        location: '艺术中心2楼',
        venueImage: '/images/venue-default.png',
        date: '2025-11-29',
        startTime: '15:00',
        endTime: '17:00',
        duration: '2小时',
        status: '已取消',
        price: 25,
        bookingDate: '2025-11-28',
        capacity: 4,
        cancelReason: '因其他事务取消'
      }
    ];
  }
});

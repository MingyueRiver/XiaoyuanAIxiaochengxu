const app = getApp();

Page({
  data: {
    // 场地列表
    venues: [],
    filteredVenues: [],
    searchKeyword: '',
    
    // 选中的场地和预约信息
    selectedVenue: null,
    selectedVenueId: null,
    bookingDate: '',
    startTime: '10:00',
    endTime: '12:00',
    notes: '',
    
    // UI状态
    isLoading: true,
    isEmpty: false,
    showVenueDetail: false,
    isSubmitting: false,
    activeTabIndex: 0,
    
    // 时间选项
    timeSlots: [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ],

    // 过滤选项
    selectedFilters: {
      type: 'all',
      priceRange: 'all',
      rating: 'all'
    },
    filterTypes: ['全部', '教室', '讨论室', '运动场', '其他'],
    filterPrices: ['全部', '0-20元', '20-50元', '50+元']
  },

  onLoad() {
    console.log('【预约场地】页面加载');
    this.checkAuth();
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.loadVenues();
    }
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能预约场地',
        confirmText: '前往登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return false;
    }
    return true;
  },

  // 加载场地列表
  async loadVenues() {
    this.setData({ isLoading: true });

    try {
      const res = await app.request({
        url: '/venues/list',
        data: { page: 1, pageSize: 20 }
      });

      const venues = res.data?.venues || this.getMockVenues();
      this.setData({
        venues,
        isLoading: false,
        isEmpty: venues.length === 0
      });
      this.filterVenues();
    } catch (error) {
      console.error('加载场地失败:', error);
      const mockVenues = this.getMockVenues();
      this.setData({
        venues: mockVenues,
        isLoading: false,
        isEmpty: mockVenues.length === 0
      });
      this.filterVenues();
    }
  },

  // 搜索场地
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.filterVenues();
  },

  // 筛选场地
  filterVenues() {
    let filtered = this.data.venues;

    // 搜索过滤
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(keyword) ||
        v.location.toLowerCase().includes(keyword)
      );
    }

    // 类型过滤
    if (this.data.selectedFilters.type !== 'all') {
      filtered = filtered.filter(v => v.type === this.data.selectedFilters.type);
    }

    // 价格过滤
    if (this.data.selectedFilters.priceRange !== 'all') {
      filtered = filtered.filter(v => {
        const price = v.pricePerHour;
        if (this.data.selectedFilters.priceRange === '0-20') return price <= 20;
        if (this.data.selectedFilters.priceRange === '20-50') return price > 20 && price <= 50;
        if (this.data.selectedFilters.priceRange === '50+') return price > 50;
        return true;
      });
    }

    // 评分过滤
    if (this.data.selectedFilters.rating !== 'all') {
      const minRating = parseFloat(this.data.selectedFilters.rating);
      filtered = filtered.filter(v => v.rating >= minRating);
    }

    this.setData({ filteredVenues: filtered });
  },

  onFilterChange(e) {
    const { type, value } = e.currentTarget.dataset;
    const filters = this.data.selectedFilters;
    filters[type] = value;
    this.setData({ selectedFilters: filters });
    this.filterVenues();
  },

  // 选择场地
  selectVenue(e) {
    const venueId = e.currentTarget.dataset.id;
    const venue = this.data.venues.find(v => v._id === venueId);

    this.setData({
      selectedVenue: venue,
      selectedVenueId: venueId,
      showVenueDetail: true,
      bookingDate: this.getDefaultDate()
    });
  },

  // 关闭详情
  closeVenueDetail() {
    this.setData({ showVenueDetail: false });
  },

  // 获取默认日期
  getDefaultDate() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return this.formatDate(date);
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ bookingDate: e.detail.value });
  },

  // 时间选择
  onStartTimeChange(e) {
    const idx = e.detail.value;
    const startTime = this.data.timeSlots[idx];
    // 自动设置结束时间为开始时间后1小时
    const startHour = parseInt(startTime);
    const endHour = startHour + 1;
    const endTime = String(endHour).padStart(2, '0') + ':00';
    
    this.setData({ startTime, endTime });
  },

  onEndTimeChange(e) {
    const idx = e.detail.value;
    this.setData({ endTime: this.data.timeSlots[idx] });
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  // 计算费用
  calculateTotal() {
    if (!this.data.selectedVenue || !this.data.startTime || !this.data.endTime) {
      return 0;
    }

    const startHour = parseInt(this.data.startTime);
    const endHour = parseInt(this.data.endTime);
    const hours = Math.max(1, endHour - startHour);
    const pricePerHour = this.data.selectedVenue.pricePerHour;

    return hours * pricePerHour;
  },

  // 表单验证
  validateBooking() {
    if (!this.data.bookingDate) {
      wx.showToast({ title: '请选择预约日期', icon: 'none' });
      return false;
    }

    const bookingDate = new Date(this.data.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      wx.showToast({ title: '预约日期不能早于今天', icon: 'none' });
      return false;
    }

    const startHour = parseInt(this.data.startTime);
    const endHour = parseInt(this.data.endTime);

    if (endHour <= startHour) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交预约
  async onSubmitBooking() {
    if (!this.validateBooking()) return;

    this.setData({ isSubmitting: true });

    const payload = {
      venueId: this.data.selectedVenueId,
      date: this.data.bookingDate,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      notes: this.data.notes.trim(),
      totalPrice: this.calculateTotal()
    };

    try {
      const res = await app.request({
        url: '/venues/book',
        method: 'POST',
        data: payload
      });

      wx.showToast({ title: '预约成功！', icon: 'success' });

      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/booking-confirmation/booking-confirmation'
        }).catch(() => {
          wx.navigateBack();
        });
      }, 1500);
    } catch (error) {
      console.error('预约失败:', error);
      wx.showToast({ title: '预约失败，请重试', icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 模拟数据
  getMockVenues() {
    return [
      {
        _id: '1',
        name: '图书馆研讨室A',
        type: '讨论室',
        location: '图书馆3楼',
        image: '/images/venue-default.png',
        pricePerHour: 20,
        capacity: 8,
        rating: 4.8,
        reviews: 156,
        facilities: ['空调', '白板', '投影仪', 'WIFI'],
        description: '宽敞明亮的讨论室，配备现代化设施，非常适合学习讨论和小组活动',
        available: true
      },
      {
        _id: '2',
        name: '教学楼101教室',
        type: '教室',
        location: '1号楼1层',
        image: '/images/venue-default.png',
        pricePerHour: 15,
        capacity: 30,
        rating: 4.5,
        reviews: 203,
        facilities: ['空调', '投影仪', 'WIFI', '讲台'],
        description: '标准教室，设施齐全，适合举办讲座、课程培训、班级活动等',
        available: true
      },
      {
        _id: '3',
        name: '体育馆羽毛球场',
        type: '运动场',
        location: '体育馆2楼',
        image: '/images/venue-default.png',
        pricePerHour: 50,
        capacity: 4,
        rating: 4.9,
        reviews: 89,
        facilities: ['网线', '照明灯', '更衣室', '淋浴间'],
        description: '专业羽毛球场地，配备完善的运动设施和安全措施',
        available: true
      },
      {
        _id: '4',
        name: '多功能报告厅',
        type: '教室',
        location: '学生活动中心',
        image: '/images/venue-default.png',
        pricePerHour: 80,
        capacity: 200,
        rating: 4.7,
        reviews: 142,
        facilities: ['音响系统', '投影仪', 'LED屏幕', '舞台灯光'],
        description: '大型报告厅，配备完整的演讲和表演设备，适合举办讲座和文艺活动',
        available: true
      },
      {
        _id: '5',
        name: '音乐教室B',
        type: '其他',
        location: '艺术中心2楼',
        image: '/images/venue-default.png',
        pricePerHour: 30,
        capacity: 6,
        rating: 4.6,
        reviews: 67,
        facilities: ['钢琴', '音响', '空调', 'WIFI'],
        description: '专业音乐教室，配备高质量乐器和音响系统',
        available: true
      },
      {
        _id: '6',
        name: '宿舍讨论室',
        type: '讨论室',
        location: '宿舍区D栋',
        image: '/images/venue-default.png',
        pricePerHour: 10,
        capacity: 6,
        rating: 4.4,
        reviews: 95,
        facilities: ['空调', '白板', 'WIFI'],
        description: '舒适的宿舍讨论室，价格实惠，适合宿舍舍友聚会和学习',
        available: true
      }
    ];
  }
});

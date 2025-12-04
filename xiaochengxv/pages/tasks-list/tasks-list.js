const app = getApp();

Page({
  data: {
    tasks: [],
    filteredTasks: [],
    isLoading: true,
    keyword: '',
    activeCategory: '',
    currentPage: 1,
    pageSize: 10,
    totalTasks: 0
  },

  onLoad(options) {
    if (options?.category) {
      this.setData({ activeCategory: options.category });
    }
  },

  onShow() {
    this.loadTasks(1);
  },

  async loadTasks(page = 1) {
    this.setData({ isLoading: true });
    try {
      const res = await app.request({ url: '/tasks/list', data: { page, pageSize: getApp().globalData.pageSize || this.data.pageSize } });
      const tasks = res.data?.tasks || [];
      const pageSize = getApp().globalData.pageSize || this.data.pageSize;
      const total = res.data?.total || (tasks.length + (page - 1) * pageSize);

      if (page === 1) {
        this.setData({ tasks, currentPage: 1, totalTasks: total, isLoading: false }, () => this.applyFilters());
      } else {
        this.setData({ tasks: [...this.data.tasks, ...tasks], currentPage: page, totalTasks: total, isLoading: false }, () => this.applyFilters());
      }
    } catch (err) {
      console.error('加载任务列表失败', err);
      this.setData({ tasks: [], isLoading: false }, () => this.applyFilters());
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value }, () => this.applyFilters());
  },

  applyFilters() {
    const { tasks, keyword, activeCategory } = this.data;
    let filtered = tasks.slice();

    if (keyword) {
      const k = keyword.toLowerCase();
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(k) || (t.description || '').toLowerCase().includes(k));
    }

    if (activeCategory) {
      filtered = filtered.filter(t => t.category === activeCategory || t.location === activeCategory);
    }

    this.setData({ filteredTasks: filtered });
  },

  goToTaskDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${id}` }).catch(() => {
      wx.showToast({ title: '无法打开任务详情', icon: 'none' });
    });
  }
  ,
  onReachBottom() {
    const next = this.data.currentPage + 1;
    if (this.data.tasks.length >= this.data.totalTasks && this.data.totalTasks > 0) {
      wx.showToast({ title: '已加载全部任务', icon: 'none' });
      return;
    }
    this.loadTasks(next);
  }
});

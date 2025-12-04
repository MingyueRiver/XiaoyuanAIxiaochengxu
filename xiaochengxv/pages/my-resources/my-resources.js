const app = getApp();

Page({
  data: {
    userInfo: null,
    resources: [],
    filteredResources: [],
    activeTab: 'all', // all, notes, videos, documents
    isLoading: true,
    isEmpty: false,
    currentPage: 1,
    pageSize: 10
  },

  onLoad() {
    console.log('【我的资源】页面加载');
    this.checkAuth();
  },

  onShow() {
    console.log('【我的资源】页面显示');
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
      this.loadMyResources();
    }
  },

  onPullDownRefresh() {
    this.setData({ currentPage: 1 });
    this.loadMyResources().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能查看我的资源',
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
      this.loadMyResources();
    }
  },

  // 加载我的资源
  async loadMyResources() {
    this.setData({ isLoading: true });
    
    try {
      const res = await app.request({
        url: '/resources/my-resources',
        data: { page: this.data.currentPage, pageSize: this.data.pageSize }
      });

      const resources = res.data?.resources || this.getMockMyResources();
      this.setData({
        resources,
        isLoading: false,
        isEmpty: resources.length === 0
      });
      this.filterByTab();
    } catch (error) {
      console.error('加载资源失败:', error);
      const mockResources = this.getMockMyResources();
      this.setData({
        resources: mockResources,
        isLoading: false,
        isEmpty: mockResources.length === 0
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
    const { resources, activeTab } = this.data;
    let filtered = resources;

    if (activeTab !== 'all') {
      filtered = resources.filter(item => {
        if (activeTab === 'notes') return item.type === '笔记';
        if (activeTab === 'videos') return item.type === '视频';
        if (activeTab === 'documents') return item.type === '文档';
        return true;
      });
    }

    this.setData({ filteredResources: filtered });
  },

  // 查看资源详情
  goToResourceDetail(e) {
    const resourceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/resource-detail/resource-detail?id=${resourceId}`
    }).catch(() => {
      wx.showToast({ title: '无法打开资源详情', icon: 'none' });
    });
  },

  // 编辑资源
  editResource(e) {
    const resourceId = e.currentTarget.dataset.id;
    const resource = this.data.resources.find(r => r._id === resourceId);
    
    if (!resource) {
      wx.showToast({ title: '资源不存在', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/edit-resource/edit-resource?id=${resourceId}`
    }).catch(() => {
      wx.showToast({ title: '编辑功能开发中', icon: 'none' });
    });
  },

  // 删除资源
  deleteResource(e) {
    const resourceId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个资源吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(resourceId);
        }
      }
    });
  },

  performDelete(resourceId) {
    wx.showLoading({ title: '删除中...' });

    app.request({
      url: '/resources/delete',
      method: 'POST',
      data: { resourceId }
    }).then(() => {
      wx.hideLoading();
      // 立即从本地列表中移除该资源
      const updatedResources = this.data.resources.filter(r => r._id !== resourceId);
      this.setData({ resources: updatedResources });
      this.filterByTab();
      wx.showToast({ title: '删除成功', icon: 'success' });
    }).catch((error) => {
      wx.hideLoading();
      wx.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' });
    });
  },

  // 上传新资源
  uploadNewResource() {
    if (!this.checkAuthSimple()) return;
    
    wx.navigateTo({
      url: '/pages/upload-resource/upload-resource'
    }).catch(() => {
      wx.showToast({ title: '上传功能开发中', icon: 'none' });
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
  getMockMyResources() {
    return [
      {
        _id: '101',
        title: '微积分完整笔记',
        type: '笔记',
        coverUrl: '/images/resource-default.png',
        description: '涵盖极限、导数、积分等核心内容，包含详细推导过程',
        isFree: true,
        downloads: 156,
        views: 428,
        stats: { rating: 4.8 },
        uploadDate: '2025-11-20',
        size: '3.2MB'
      },
      {
        _id: '102',
        title: '线性代数思维导图',
        type: '文档',
        coverUrl: '/images/resource-default.png',
        description: '矩阵、特征值、线性变换等概念的思维导图总结',
        isFree: true,
        downloads: 203,
        views: 521,
        stats: { rating: 4.9 },
        uploadDate: '2025-11-18',
        size: '5.1MB'
      },
      {
        _id: '103',
        title: 'JavaScript ES6+ 视频教程',
        type: '视频',
        coverUrl: '/images/resource-default.png',
        description: '40分钟详细讲解异步编程、Promise、async/await',
        isFree: false,
        price: 12.99,
        downloads: 87,
        views: 312,
        stats: { rating: 4.7 },
        uploadDate: '2025-11-15',
        duration: '40分钟'
      },
      {
        _id: '104',
        title: '英语四级高频词汇',
        type: '笔记',
        coverUrl: '/images/resource-default.png',
        description: '1500个核心词汇 + 用法例句，按难度分级',
        isFree: false,
        price: 9.99,
        downloads: 342,
        views: 1024,
        stats: { rating: 4.6 },
        uploadDate: '2025-11-10',
        size: '2.8MB'
      },
      {
        _id: '105',
        title: 'Python爬虫项目实战',
        type: '文档',
        coverUrl: '/images/resource-default.png',
        description: '完整的电商网站爬虫代码 + 详细注释说明',
        isFree: false,
        price: 19.99,
        downloads: 156,
        views: 562,
        stats: { rating: 4.9 },
        uploadDate: '2025-11-05',
        size: '8.5MB'
      }
    ];
  }
});

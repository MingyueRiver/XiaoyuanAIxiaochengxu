const app = getApp();

Page({
  data: {
    allResources: [
      // 你的资源数据（保持原有数据不变）
      {
        id: 1,
        title: '大学英语四级备考攻略',
        desc: '听力+阅读+写作+翻译全题型技巧，附高频词汇',
        coverUrl: '/images/article1.png',
        type: 'article',
        isFree: true,
        author: '英语老师',
        views: 1286,
        collectCount: 326,
        updateTime: '2025-10-15',
        content: '...'
      },
      // 其他资源数据...
    ],
    filteredResources: [],
    isLoading: false,
    isGrid: true,
    activeType: 'all',
    activeStatus: 'all',
    currentTab: 'resource', // 核心修复：定义底部导航当前选中项（默认资源中心）
    typeMap: {
      all: '全部',
      article: '文章',
      note: '笔记',
      template: '模板',
      tool: '工具'
    },
    // 核心修复：添加类型筛选列表数据
    typeFilterList: [
      { key: 'all', name: '全部' },
      { key: 'article', name: '文章' },
      { key: 'note', name: '笔记' },
      { key: 'template', name: '模板' },
      { key: 'tool', name: '工具' }
    ],
    // 核心修复：添加状态筛选列表数据
    statusFilterList: [
      { key: 'all', name: '全部' },
      { key: 'free', name: '免费' },
      { key: 'paid', name: '付费' },
      { key: 'hot', name: '热门' }
    ]
  },

  onLoad(options) {
    this.filterResources();
    this.checkResourceCovers();
  },

  onShow() {
    // 修复：页面显示时更新底部导航选中项
    this.setData({ currentTab: 'resource' });
  },

  // 检查资源封面图（无图时用默认图）
  checkResourceCovers() {
    const allResources = this.data.allResources.map(resource => {
      if (!resource.coverUrl) {
        switch (resource.type) {
          case 'article':
            resource.coverUrl = '/images/article-default.png';
            break;
          case 'note':
            resource.coverUrl = '/images/note-default.png';
            break;
          case 'template':
            resource.coverUrl = '/images/template-default.png';
            break;
          case 'tool':
            resource.coverUrl = '/images/tool-default.png';
            break;
          default:
            resource.coverUrl = '/images/resource-default.png';
        }
      }
      return resource;
    });
    this.setData({ allResources });
  },

  // 筛选资源（保持原有逻辑不变）
  filterResources() {
    const { allResources, activeType, activeStatus } = this.data;
    this.setData({ isLoading: true });

    setTimeout(() => {
      let filtered = [...allResources];

      // 类型筛选
      if (activeType !== 'all') {
        filtered = filtered.filter(item => item.type === activeType);
      }

      // 状态筛选
      switch (activeStatus) {
        case 'free':
          filtered = filtered.filter(item => item.isFree);
          break;
        case 'paid':
          filtered = filtered.filter(item => !item.isFree);
          break;
        case 'hot':
          filtered = filtered.filter(item => item.views > 800).sort((a, b) => b.views - a.views);
          break;
        default:
          filtered = filtered.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
          break;
      }

      this.setData({
        filteredResources: filtered,
        isLoading: false
      });

      if (filtered.length === 0) {
        wx.showToast({ title: '暂无符合条件的资源', icon: 'none' });
      }
    }, 300);
  },

  // 切换筛选条件（保持原有逻辑不变）
  switchFilter(e) {
    const { type, value } = e.currentTarget.dataset;
    if ((type === 'type' && this.data.activeType === value) || (type === 'status' && this.data.activeStatus === value)) {
      return;
    }

    if (type === 'type') {
      this.setData({ activeType: value }, () => this.filterResources());
    } else if (type === 'status') {
      this.setData({ activeStatus: value }, () => this.filterResources());
    }

    const filterName = type === 'type' ? this.data.typeMap[value] : (value === 'free' ? '免费' : value === 'paid' ? '付费' : value === 'hot' ? '热门' : '全部');
    wx.showToast({ title: `已筛选${filterName}资源`, icon: 'none', duration: 500 });
  },

  // 切换布局（保持原有逻辑不变）
  toggleLayout() {
    const isGrid = !this.data.isGrid;
    this.setData({ isGrid });
    wx.showToast({ title: isGrid ? '已切换为网格布局' : '已切换为列表布局', icon: 'none' });
  },

  // 跳转资源详情（保持原有逻辑不变）
  goToDetail(e) {
    const resourceId = e.currentTarget.dataset.id;
    const resource = this.data.allResources.find(item => item.id === resourceId);
    if (resource) {
      try {
        const resourceStr = encodeURIComponent(JSON.stringify(resource));
        wx.navigateTo({ url: `/pages/resource-detail/resource-detail?resource=${resourceStr}` });
      } catch (error) {
        console.error('资源跳转失败:', error);
        wx.showToast({ title: '无法打开资源详情', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '资源不存在', icon: 'none' });
    }
  },

  // 跳转搜索页（保持原有逻辑不变）
  goToSearch() {
    wx.navigateTo({ url: '/pages/search/search?type=resource' }).catch(() => {
      wx.showToast({ title: '搜索功能开发中', icon: 'none' });
    });
  },

  // 底部导航切换（保持原有逻辑不变）
  switchTab(e) {
    const path = e.currentTarget.dataset.path;
    const tab = e.currentTarget.dataset.tab;
    if (!path) return;
    wx.switchTab({ url: path });
    this.setData({ currentTab: tab });
  },

  // 排序资源（保持原有逻辑不变）
  sortResources(e) {
    const sortType = e.currentTarget.dataset.type;
    const { filteredResources } = this.data;
    let sortedResources = [...filteredResources];

    if (sortType === 'views') {
      sortedResources.sort((a, b) => b.views - a.views);
      wx.showToast({ title: '按浏览量排序', icon: 'none' });
    } else if (sortType === 'time') {
      sortedResources.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
      wx.showToast({ title: '按更新时间排序', icon: 'none' });
    }

    this.setData({ filteredResources: sortedResources });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.checkResourceCovers();
    this.filterResources();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    wx.showToast({ title: '已加载全部资源', icon: 'none' });
  }
});
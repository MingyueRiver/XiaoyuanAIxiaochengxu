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
    currentPage: 1,
    pageSize: 10,
    totalResources: 0,
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
    // 如果从分类页跳转可带入 type 参数（例如 ?type=学习笔记）
    if (options?.type) {
      // 这里保持 activeType 为 key（尽量匹配 typeMap 的 key），支持中文名称与 key 映射
      const raw = decodeURIComponent(options.type);
      const map = {
        '文章': 'article', '笔记': 'note', '模板': 'template', '工具': 'tool',
        '学习笔记': 'note', '办公模板': 'template', '视频教程': 'article', '工具软件': 'tool',
        '文献资料': 'article', '素材资源': 'tool'
      };
      const key = map[raw] || (this.data.typeMap && Object.keys(this.data.typeMap).includes(raw) ? raw : (this.data.typeMap && this.data.typeMap[raw]) || 'all');
      // 如果 key 看起来是中文（在 typeMap 中没有对应），尝试通过 reverse mapping
      const finalKey = map[raw] || (Object.keys(this.data.typeMap).includes(raw) ? raw : (map[raw] || 'all'));
      this.setData({ activeType: finalKey });
    }

    // 支持 activities 标识（好物）
    if (options?.activities) {
      this.setData({ isActivities: true });
    }
    this.filterResources();
    this.checkResourceCovers();
  },

  onShow() {
    // 修复：页面显示时更新底部导航选中项
    this.setData({ currentTab: 'resource' });
    // 从后端或 mock 加载资源列表，确保发布后能同步显示
    if (getApp().globalData.useMock) {
      this.loadResources();
    }
  },

  // 从接口加载资源，支持分页
  async loadResources(page = 1) {
    this.setData({ isLoading: true });
    try {
      const res = await getApp().request({ url: '/resources/list', data: { page, pageSize: getApp().globalData.pageSize || this.data.pageSize } });
      const resources = res.data?.resources || [];
      const pageSize = getApp().globalData.pageSize || this.data.pageSize;
      const total = res.data?.total || (resources.length + (page - 1) * pageSize);

      if (page === 1) {
        this.setData({ allResources: resources, currentPage: 1, totalResources: total });
      } else {
        this.setData({ allResources: [...this.data.allResources, ...resources], currentPage: page, totalResources: total });
      }

      this.setData({ isLoading: false });
      this.checkResourceCovers();
      this.filterResources();
    } catch (err) {
      console.error('加载资源失败', err);
      this.setData({ isLoading: false });
      this.checkResourceCovers();
      this.filterResources();
    }
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

    let filterName = '全部';
    if (type === 'type') {
      filterName = this.data.typeMap[value] || '全部';
    } else {
      if (value === 'free') filterName = '免费';
      else if (value === 'paid') filterName = '付费';
      else if (value === 'hot') filterName = '热门';
      else filterName = '全部';
    }
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
    const next = this.data.currentPage + 1;
    if (this.data.allResources.length >= this.data.totalResources && this.data.totalResources > 0) {
      wx.showToast({ title: '已加载全部资源', icon: 'none' });
      return;
    }
    this.loadResources(next);
  }
});
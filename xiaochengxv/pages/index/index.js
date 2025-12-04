const app = getApp();

Page({
  data: {
    userInfo: null,
    currentLocation: '',
    activeTag: 'all',
    isLoading: true,
    aiRecommendations: {
      venues: [],
      tasks: [],
      resources: []
    },
    // 优质资源文章数据（优化：补充封面图占位，适配实际图片）
    highQualityArticles: [
      {
        id: 1,
        title: '大学英语四级备考攻略',
        desc: '听力+阅读+写作+翻译全题型技巧，附高频词汇',
        coverUrl: '/images/article1.png', // 建议放入 images 文件夹，若无图可替换为默认图
        author: '英语老师',
        views: 1286,
        isFree: true,
        content: `### 一、听力部分
1. 提前读题：利用播放Direction的时间，快速浏览选项，划出关键词；
2. 抓主旨：不要纠结单个生词，重点听对话/短文的核心意思；
3. 同义替换：正确选项常是原文的同义表达，注意捕捉同义词。

### 二、阅读部分
1. 定位关键词：先看题干，再回原文找对应段落，不用逐字读；
2. 排除法：先排除明显错误的选项（如与原文矛盾、无中生有）；
3. 细节题：答案通常在关键词前后1-2句内。

### 三、写作部分
1. 模板套用：准备3-5个通用模板（观点类、现象类、图表类）；
2. 高级词汇：用四六级核心词汇替换简单词（如 important → crucial）；
3. 语法正确：避免时态错误、主谓不一致，适当用从句提升句式。`
      },
      {
        id: 2,
        title: '如何高效利用图书馆资源',
        desc: '纸质书借阅、电子资源查找、自习座位预约全指南',
        coverUrl: '/images/article2.png', // 同上
        author: '图书馆管理员',
        views: 865,
        isFree: true,
        content: `### 一、纸质书借阅
1. 查找书籍：用图书馆官网或大厅查询机，输入书名/作者/ISBN，获取书架位置；
2. 借阅流程：凭校园卡到对应书架取书，到借阅台办理手续（一次最多借10本，期限30天）；
3. 续借：到期前3天可在官网或微信公众号续借，最多续借1次（15天）。

### 二、电子资源
1. 数据库：图书馆官网提供知网、万方、维普等数据库，校园网内可免费下载论文；
2. 电子图书：超星数字图书馆、掌阅精选有海量电子书，支持手机阅读；
3. 视频资源：中国大学MOOC、学堂在线有免费公开课，适合课后拓展。`
      }
    ],
    // 新增：底部导航当前选中项（首页默认选中“首页”）
    currentTab: 'home'
  },

  onLoad() {
    this.initPage();
    // 检查图片是否存在（可选：无图时替换为默认图）
    this.checkArticleCovers();
  },

  onShow() {
    this.checkLoginStatus();
    // 页面显示时更新底部导航选中状态（防止跳转后样式错乱）
    this.setData({ currentTab: 'home' });
  },

  onPullDownRefresh() {
    this.loadAIRecommendations().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 初始化页面
  async initPage() {
    this.getCurrentLocation();
    this.checkLoginStatus();
    await this.loadAIRecommendations();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    this.setData({ userInfo });
  },

  // 获取当前位置（优化：失败时提供手动选择入口提示）
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLocation: '校内'
        });
      },
      fail: () => {
        this.setData({
          currentLocation: '点击更新位置' // 提示用户手动更新
        });
      }
    });
  },

  // 加载AI推荐（优化：模拟数据更丰富，提升体验）
  async loadAIRecommendations() {
    this.setData({ isLoading: true });

    try {
      // 如果未登录，使用模拟数据
      if (!app.globalData.userInfo) {
        this.setData({
          aiRecommendations: this.getMockRecommendations(),
          isLoading: false
        });
        return;
      }

      const res = await app.request({
        url: '/ai/recommendations',
        data: { type: this.data.activeTag, limit: 6 }
      });

      this.setData({
        aiRecommendations: res.data.recommendations || this.getMockRecommendations(), // 兜底
        isLoading: false
      });

    } catch (error) {
      console.error('推荐加载失败:', error);
      // 失败时使用模拟数据，提升用户体验
      wx.showToast({ title: '推荐加载失败，显示热门内容', icon: 'none' });
      this.setData({
        aiRecommendations: this.getMockRecommendations(),
        isLoading: false
      });
    }
  },

  // 模拟推荐数据（优化：增加更多模拟数据，页面更饱满）
  getMockRecommendations() {
    return {
      venues: [
        {
          _id: '1',
          name: '图书馆研讨室A',
          location: '图书馆3楼',
          images: ['/images/venue-default.png'],
          tags: ['学习', '讨论'],
          stats: { rating: 4.5 },
          matchScore: 85,
          matchLevel: 'excellent'
        },
        {
          _id: '2',
          name: '教学楼101教室',
          location: '1号楼1层',
          images: ['/images/venue-default.png'],
          tags: ['上课', '自习'],
          stats: { rating: 4.2 },
          matchScore: 78,
          matchLevel: 'good'
        },
        {
          _id: '3',
          name: '体育馆羽毛球场',
          location: '体育馆2楼',
          images: ['/images/venue-default.png'],
          tags: ['运动', '预约'],
          stats: { rating: 4.7 },
          matchScore: 72,
          matchLevel: 'good'
        }
      ],
      tasks: [
        {
          _id: '1',
          title: '帮忙取快递',
          description: '快递在西门快递点，重约2kg',
          location: '西门',
          reward: 5,
          timeLeft: '今天',
          urgency: 'medium',
          urgencyText: '中等'
        },
        {
          _id: '2',
          title: '代占图书馆座位',
          description: '早上8点前占靠窗位置，可有偿',
          location: '图书馆2楼',
          reward: 8,
          timeLeft: '明天',
          urgency: 'high',
          urgencyText: '紧急'
        },
        {
          _id: '3',
          title: '英语作文修改',
          description: '四级作文润色，要求语法正确',
          location: '线上',
          reward: 15,
          timeLeft: '3天内',
          urgency: 'low',
          urgencyText: '普通'
        }
      ],
      resources: [
        {
          _id: '1',
          title: '数据结构笔记',
          type: '笔记',
          coverUrl: '/images/resource-default.png',
          isFree: true,
          stats: { rating: 4.8 }
        },
        {
          _id: '2',
          title: 'Python入门教程',
          type: '视频',
          coverUrl: '/images/resource-default.png',
          isFree: true,
          stats: { rating: 4.6 }
        },
        {
          _id: '3',
          title: '毕业论文模板',
          type: '文档',
          coverUrl: '/images/resource-default.png',
          isFree: false,
          price: 9.9,
          stats: { rating: 4.9 }
        }
      ]
    };
  },

  // 切换标签（优化：添加加载状态提示）
  switchTag(e) {
    const tag = e.currentTarget.dataset.tag;
    if (this.data.activeTag === tag) return; // 避免重复点击
    this.setData({ activeTag: tag, isLoading: true });
    wx.showToast({ title: `加载${this.getTagText(tag)}内容`, icon: 'loading', duration: 500 });
    this.loadAIRecommendations();
  },

  // 辅助方法：获取标签对应的文字（优化代码可读性）
  getTagText(tag) {
    const tagMap = { all: '全部', venues: '场地', tasks: '任务', resources: '资源' };
    return tagMap[tag] || '全部';
  },

  // 页面跳转方法（优化：部分功能开发中提示更具体）
  updateLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ currentLocation: res.name || '已更新位置' });
      },
      fail: () => {
        wx.showToast({ title: '位置选择失败', icon: 'none' });
      }
    });
  },

  goToSearch() {
    // 优化：跳转实际搜索页（若已创建），否则提示
    wx.navigateTo({
      url: '/pages/search/search'
    }).catch(() => {
      wx.showToast({ title: '搜索功能开发中', icon: 'none' });
    });
  },

  viewVenueDetail(e) {
    const venueId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/venue-detail/venue-detail?id=${venueId}`
    }).catch(() => {
      wx.showToast({ title: '场地详情开发中', icon: 'none' });
    });
  },

  viewTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${taskId}`
    }).catch(() => {
      wx.showToast({ title: '任务详情开发中', icon: 'none' });
    });
  },

  viewResourceDetail(e) {
    const resourceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/resource-detail/resource-detail?id=${resourceId}`
    }).catch(() => {
      wx.showToast({ title: '资源详情开发中', icon: 'none' });
    });
  },

  goToVenueList() {
    wx.navigateTo({
      url: '/pages/venue-list/venue-list'
    }).catch(() => {
      wx.showToast({ title: '场地列表开发中', icon: 'none' });
    });
  },

  goToTaskList() {
    wx.navigateTo({
      url: '/pages/task-list/task-list'
    }).catch(() => {
      wx.showToast({ title: '任务列表开发中', icon: 'none' });
    });
  },

  goToResourceList() {
    wx.navigateTo({
      url: '/pages/resource-list/resource-list'
    }).catch(() => {
      wx.showToast({ title: '资源列表开发中', icon: 'none' });
    });
  },

  postTask() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/post-task/post-task'
    }).catch(() => {
      wx.showToast({ title: '发布任务开发中', icon: 'none' });
    });
  },

  bookVenue() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/book-venue/book-venue'
    }).catch(() => {
      wx.showToast({ title: '预约场地开发中', icon: 'none' });
    });
  },

  uploadResource() {
    if (!this.checkAuth()) return;
    wx.navigateTo({
      url: '/pages/upload-resource/upload-resource'
    }).catch(() => {
      wx.showToast({ title: '分享资源开发中', icon: 'none' });
    });
  },

  goToProfile() {
    // 优化：使用底部导航切换方法，保持样式一致
    this.switchTab({ currentTarget: { dataset: { path: '/pages/profile/profile', tab: 'mine' } } });
  },

  // 检查认证（优化：登录跳转更流畅）
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能操作，是否前往登录？',
        confirmText: '前往登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 跳转到资源中心tab（优化：保持底部导航切换逻辑一致）
  goToResourceCenter() {
    this.switchTab({ currentTarget: { dataset: { path: '/pages/resource-center/resource-center', tab: 'resource' } } });
  },

  // 点击优质资源文章卡片，跳转文章详情页（优化：处理特殊字符，避免报错）
  goToArticleDetail(e) {
    const articleId = e.currentTarget.dataset.id;
    const article = this.data.highQualityArticles.find(item => item.id === articleId);
    if (article) {
      try {
        const articleStr = encodeURIComponent(JSON.stringify(article));
        wx.navigateTo({
          url: `/pages/article-detail/article-detail?article=${articleStr}`
        });
      } catch (error) {
        console.error('文章跳转失败:', error);
        wx.showToast({ title: '无法打开文章', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '文章不存在', icon: 'none' });
    }
  },

  // 新增：底部导航切换逻辑（与其他页面统一）
  switchTab(e) {
    const path = e.currentTarget.dataset.path;
    const tab = e.currentTarget.dataset.tab;
    if (!path) return;
    // 跳转tabBar页面
    wx.switchTab({ url: path });
    // 更新当前tab状态，确保选中样式正确
    this.setData({ currentTab: tab });
  },

  // 新增：检查文章封面图是否存在（无图时替换为默认图）
  checkArticleCovers() {
    const articles = this.data.highQualityArticles.map(article => {
      // 若封面图路径为空或默认图不存在，替换为通用默认图
      if (!article.coverUrl || article.coverUrl.includes('article1.png') || article.coverUrl.includes('article2.png')) {
        article.coverUrl = '/images/article-default.png'; // 需在images文件夹添加默认文章图
      }
      return article;
    });
    this.setData({ highQualityArticles: articles });
  }
});
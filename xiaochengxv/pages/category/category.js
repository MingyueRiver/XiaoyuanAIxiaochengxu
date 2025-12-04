// pages/category/category.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 一级分类数据（场地/任务/资源/活动）
    firstCategories: [
      { type: 'venues', icon: '🏢', name: '场地' },
      { type: 'tasks', icon: '📋', name: '任务' },
      { type: 'resources', icon: '📚', name: '资源' },
      { type: 'activities', icon: '🎉', name: '好物' }
    ],
    activeFirst: '', // 默认选中「场地」分类
    // 二级分类数据（和一级分类一一对应）
    secondCategories: {
      venues: [ // 场地的二级分类
        { id: 1, icon: '🏫', name: '教学楼教室' },
        { id: 2, icon: '📚', name: '图书馆研讨室' },
        { id: 3, icon: '🏟️', name: '体育场馆' }, 
      ],
      tasks: [ // 任务的二级分类
        { id: 4, icon: '✍️', name: '文案写作' },
        { id: 5, icon: '🎨', name: '设计制作' },
        { id: 6, icon: '💻', name: '技术开发' },
        { id: 7, icon: '📢', name: '答疑解惑' },
        { id: 8, icon: '📦', name: '跑腿代办' },
        { id: 9, icon: '📚', name: '学习辅导' }
      ],
      resources: [ // 资源的二级分类
        { id: 10, icon: '📝', name: '学习笔记' },
        { id: 11, icon: '📊', name: '办公模板' },
        { id: 12, icon: '🎥', name: '视频教程' },
        { id: 13, icon: '🔧', name: '工具软件' },
        { id: 14, icon: '📜', name: '文献资料' },
        { id: 15, icon: '🎵', name: '素材资源' }
      ],
      activities: [ // 好物的二级分类
        { id: 19, icon: '🎤', name: '闲置百货' },
        { id: 20, icon: '📚', name: '图书资料' },
        { id: 21, icon: '🏀', name: '运动用品' },
        { id: 22, icon: '🎨', name: '学习用具' },
        { id: 23, icon: '🤝', name: '电子设备' },
      ]
    },
    currentSecondCategories: [] // 用来存储当前显示的二级分类
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // ② 关键：删除初始化赋值代码（不默认加载任何二级分类）
    // 原来的代码：this.setData({ currentSecondCategories: secondCategories[activeFirst] });
    // 现在清空，什么都不写
  },

  switchFirstCategory(e) {
    // 获取点击的一级分类类型（如：venues/tasks/resources）
    const type = e.currentTarget.dataset.type;
    const { secondCategories } = this.data;

    // 更新「选中的一级分类」和「对应的二级分类」
    this.setData({
      activeFirst: type, // 选中当前点击的一级分类
      currentSecondCategories: secondCategories[type] // 切换显示对应的二级分类
    });
  },

  /**
   * 点击二级分类（如「教学楼教室」），跳转至对应列表页
   */
  goToDetail(e) {
    // 获取点击的二级分类ID和名称（从wxml的data-id和data-name中获取）
    const { id, name } = e.currentTarget.dataset;

    // 根据一级分类类型跳转到不同的列表页（通过 dataset.type 传入）
    const firstType = e.currentTarget.dataset.type || this.data.activeFirst || '';

    if (firstType === 'venues') {
      wx.navigateTo({ url: `/pages/book-venue/book-venue?filterType=${encodeURIComponent(name)}` }).catch(() => {
        wx.showToast({ title: '无法打开场地列表', icon: 'none' });
      });
      return;
    }

    if (firstType === 'tasks') {
      wx.navigateTo({ url: `/pages/tasks-list/tasks-list?category=${encodeURIComponent(name)}` }).catch(() => {
        wx.showToast({ title: '无法打开任务列表', icon: 'none' });
      });
      return;
    }

    if (firstType === 'resources') {
      wx.navigateTo({ url: `/pages/resource-center/resource-center?type=${encodeURIComponent(name)}` }).catch(() => {
        wx.showToast({ title: '无法打开资源列表', icon: 'none' });
      });
      return;
    }

    if (firstType === 'activities') {
      // 好物（活动/二手/好物）暂时复用资源中心显示，可以根据 name 带上标识
      wx.navigateTo({ url: `/pages/resource-center/resource-center?type=${encodeURIComponent(name)}&activities=1` }).catch(() => {
        wx.showToast({ title: '无法打开好物列表', icon: 'none' });
      });
      return;
    }

    wx.showToast({ title: `进入「${name}」列表`, icon: 'none', duration: 1500 });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});
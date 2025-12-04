const app = getApp();

Page({
  data: {
    userInfo: null,
    tasks: [],
    filteredTasks: [],
    activeTab: 'posted', // posted, accepted, completed
    isLoading: true,
    isEmpty: false,
    currentPage: 1,
    pageSize: 10
  },

  onLoad() {
    console.log('【我的任务】页面加载');
    this.checkAuth();
  },

  onShow() {
    console.log('【我的任务】页面显示');
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo });
      this.loadMyTasks();
    }
  },

  onPullDownRefresh() {
    this.setData({ currentPage: 1 });
    this.loadMyTasks().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能查看我的任务',
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
      this.loadMyTasks();
    }
  },

  // 加载我的任务
  async loadMyTasks() {
    this.setData({ isLoading: true });
    
    try {
      const res = await app.request({
        url: '/tasks/my-tasks',
        data: { page: this.data.currentPage, pageSize: this.data.pageSize }
      });

      const tasks = res.data?.tasks || this.getMockMyTasks();
      this.setData({
        tasks,
        isLoading: false,
        isEmpty: tasks.length === 0
      });
      this.filterByTab();
    } catch (error) {
      console.error('加载任务失败:', error);
      const mockTasks = this.getMockMyTasks();
      this.setData({
        tasks: mockTasks,
        isLoading: false,
        isEmpty: mockTasks.length === 0
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
    const { tasks, activeTab } = this.data;
    let filtered = tasks;

    if (activeTab === 'posted') {
      filtered = tasks.filter(item => item.status === '招募中' || item.status === '进行中');
    } else if (activeTab === 'accepted') {
      filtered = tasks.filter(item => item.status === '进行中' && item.acceptedBy);
    } else if (activeTab === 'completed') {
      filtered = tasks.filter(item => item.status === '已完成');
    }

    this.setData({ filteredTasks: filtered });
  },

  // 查看任务详情
  goToTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${taskId}`
    }).catch(() => {
      wx.showToast({ title: '无法打开任务详情', icon: 'none' });
    });
  },

  // 编辑任务（仅限状态为招募中）
  editTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t._id === taskId);
    
    if (!task) {
      wx.showToast({ title: '任务不存在', icon: 'none' });
      return;
    }

    if (task.status !== '招募中') {
      wx.showToast({ title: '只能编辑招募中的任务', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/edit-task/edit-task?id=${taskId}`
    }).catch(() => {
      wx.showToast({ title: '编辑功能开发中', icon: 'none' });
    });
  },

  // 取消任务
  cancelTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t._id === taskId);

    if (!task) {
      wx.showToast({ title: '任务不存在', icon: 'none' });
      return;
    }

    if (task.status !== '招募中') {
      wx.showToast({ title: '只能取消招募中的任务', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个任务吗？',
      confirmText: '取消任务',
      cancelText: '保留',
      success: (res) => {
        if (res.confirm) {
          this.performCancel(taskId);
        }
      }
    });
  },

  performCancel(taskId) {
    wx.showLoading({ title: '取消中...' });

    app.request({
      url: '/tasks/cancel',
      method: 'POST',
      data: { taskId }
    }).then(() => {
      wx.hideLoading();
      // 立即更新本地任务状态
      const updatedTasks = this.data.tasks.map(task => {
        if (task._id === taskId) {
          task.status = '已取消';
        }
        return task;
      });
      this.setData({ tasks: updatedTasks });
      this.filterByTab();
      wx.showToast({ title: '任务已取消', icon: 'success' });
    }).catch((error) => {
      wx.hideLoading();
      wx.showToast({ title: '取消失败：' + (error.message || '未知错误'), icon: 'none' });
    });
  },

  // 标记任务完成
  completeTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(t => t._id === taskId);

    if (!task) {
      wx.showToast({ title: '任务不存在', icon: 'none' });
      return;
    }

    if (task.status !== '进行中') {
      wx.showToast({ title: '只能完成进行中的任务', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认完成',
      content: '任务已完成？请确认后无法更改。',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performComplete(taskId);
        }
      }
    });
  },

  performComplete(taskId) {
    wx.showLoading({ title: '完成中...' });

    app.request({
      url: '/tasks/complete',
      method: 'POST',
      data: { taskId }
    }).then(() => {
      wx.hideLoading();
      // 立即更新本地任务状态
      const updatedTasks = this.data.tasks.map(task => {
        if (task._id === taskId) {
          task.status = '已完成';
        }
        return task;
      });
      this.setData({ tasks: updatedTasks });
      this.filterByTab();
      wx.showToast({ title: '任务已完成', icon: 'success' });
    }).catch((error) => {
      wx.hideLoading();
      wx.showToast({ title: '操作失败：' + (error.message || '未知错误'), icon: 'none' });
    });
  },

  // 发布新任务
  postNewTask() {
    if (!this.checkAuthSimple()) return;
    
    wx.navigateTo({
      url: '/pages/post-task/post-task'
    }).catch(() => {
      wx.showToast({ title: '发布功能开发中', icon: 'none' });
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
  getMockMyTasks() {
    const mockTasks = [
      {
        _id: '201',
        title: '帮忙取快递',
        description: '快递在西门快递点，重约2kg，取件时间自由',
        location: '西门快递点',
        reward: 5,
        status: '招募中',
        urgency: 'medium',
        urgencyText: '中等',
        applicants: 3,
        acceptedBy: null,
        postDate: '2025-12-04',
        deadline: '2025-12-05'
      },
      {
        _id: '202',
        title: '代占图书馆座位',
        description: '早上8点前占靠窗位置，需要保持到下午2点',
        location: '图书馆2楼',
        reward: 8,
        status: '进行中',
        urgency: 'high',
        urgencyText: '紧急',
        applicants: 5,
        acceptedBy: '张三',
        postDate: '2025-12-03',
        deadline: '2025-12-04'
      },
      {
        _id: '203',
        title: '英语作文修改',
        description: '四级作文润色，要求语法正确、表达自然',
        location: '线上',
        reward: 15,
        status: '进行中',
        urgency: 'low',
        urgencyText: '普通',
        applicants: 2,
        acceptedBy: '李四',
        postDate: '2025-12-02',
        deadline: '2025-12-08'
      },
      {
        _id: '204',
        title: '帮写社团活动策划书',
        description: '需要写学科研究社2025年度活动计划，约2000字',
        location: '线上',
        reward: 25,
        status: '已完成',
        urgency: 'low',
        urgencyText: '普通',
        applicants: 1,
        acceptedBy: '王五',
        postDate: '2025-11-30',
        deadline: '2025-12-02',
        completedDate: '2025-12-02'
      },
      {
        _id: '205',
        title: '调研问卷发放',
        description: '帮助发放心理学问卷100份，大约2小时',
        location: '宿舍区',
        reward: 12,
        status: '已完成',
        urgency: 'medium',
        urgencyText: '中等',
        applicants: 4,
        acceptedBy: '赵六',
        postDate: '2025-11-28',
        deadline: '2025-11-30',
        completedDate: '2025-11-30'
      }
    ];
    
    // 合并用户发布的任务和模拟任务
    const allTasks = [
      ...app.globalData.myTasks,
      ...mockTasks
    ];
    
    return allTasks;
  }
});

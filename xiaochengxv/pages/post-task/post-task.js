const app = getApp();

Page({
  data: {
    // 表单数据
    title: '',
    description: '',
    location: '',
    reward: 10,
    urgency: 'low',
    category: '其他',
    deadline: '',
    
    // UI状态
    isSubmitting: false,
    selectedLocations: [
      '图书馆', '教学楼', '食堂', '宿舍区', '体育馆', '西门', '东门', '其他'
    ],
    selectedCategories: [
      '跑腿代办', '学习辅导', '文案写作', '数据整理', '技术支持', '设计制作', '问卷调查', '其他'
    ],
    urgencyOptions: [
      { text: '普通', value: 'low' },
      { text: '中等', value: 'medium' },
      { text: '紧急', value: 'high' }
    ],
    selectedLocation: '',
    showLocationPicker: false
  },

  onLoad() {
    console.log('【发布任务】页面加载');
    this.checkAuth();
    // 设置默认截止日期为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineStr = this.formatDate(tomorrow);
    this.setData({ deadline: deadlineStr });
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能发布任务',
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

  // 表单输入处理
  onInputTitle(e) {
    this.setData({ title: e.detail.value });
  },

  onInputDescription(e) {
    this.setData({ description: e.detail.value });
  },

  onInputReward(e) {
    const reward = parseInt(e.detail.value) || 0;
    this.setData({ reward: Math.max(1, Math.min(reward, 999)) });
  },

  // 位置选择
  showLocationPicker() {
    this.setData({ showLocationPicker: true });
  },

  onLocationChange(e) {
    const idx = e.detail.value;
    const location = this.data.selectedLocations[idx];
    this.setData({
      location,
      selectedLocation: location,
      showLocationPicker: false
    });
  },

  // 分类选择
  onCategoryChange(e) {
    const category = e.detail.value;
    this.setData({ category });
  },

  // 紧急度选择
  onUrgencyChange(e) {
    const urgency = e.detail.value;
    this.setData({ urgency });
  },

  // 截止日期选择
  onDeadlineChange(e) {
    this.setData({ deadline: e.detail.value });
  },

  // 获取最小日期（今天）
  getMinDate() {
    const today = new Date();
    return this.formatDate(today);
  },

  // 格式化日期 YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 字符计数
  getTitleCount() {
    return this.data.title.length;
  },

  getDescriptionCount() {
    return this.data.description.length;
  },

  // 表单验证
  validateForm() {
    const { title, description, location, reward, deadline } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入任务标题', icon: 'none' });
      return false;
    }

    if (title.length < 5) {
      wx.showToast({ title: '任务标题至少5个字', icon: 'none' });
      return false;
    }

    if (title.length > 50) {
      wx.showToast({ title: '任务标题不超过50个字', icon: 'none' });
      return false;
    }

    if (!description.trim()) {
      wx.showToast({ title: '请输入任务描述', icon: 'none' });
      return false;
    }

    if (description.length < 10) {
      wx.showToast({ title: '任务描述至少10个字', icon: 'none' });
      return false;
    }

    if (description.length > 500) {
      wx.showToast({ title: '任务描述不超过500个字', icon: 'none' });
      return false;
    }

    if (!location.trim()) {
      wx.showToast({ title: '请选择任务地点', icon: 'none' });
      return false;
    }

    if (reward < 1 || reward > 999) {
      wx.showToast({ title: '报酬金额1-999元', icon: 'none' });
      return false;
    }

    if (!deadline) {
      wx.showToast({ title: '请选择截止日期', icon: 'none' });
      return false;
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      wx.showToast({ title: '截止日期不能早于今天', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交表单
  async onSubmit() {
    if (!this.validateForm()) return;

    this.setData({ isSubmitting: true });

    const payload = {
      title: this.data.title.trim(),
      description: this.data.description.trim(),
      location: this.data.location,
      reward: this.data.reward,
      urgency: this.data.urgency,
      urgencyText: this.data.urgencyOptions.find(o => o.value === this.data.urgency)?.text || '普通',
      category: this.data.category,
      deadline: this.data.deadline
    };

    try {
      const res = await app.request({
        url: '/tasks/create',
        method: 'POST',
        data: payload
      });

      wx.showToast({ title: '任务发布成功！', icon: 'success' });

      // 尝试通知上一个页面刷新（兼容多种页面名称）
      try {
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prev = pages[pages.length - 2];
          // 常见刷新方法
          if (prev.loadMyTasks) prev.loadMyTasks();
          if (prev.loadTasks) prev.loadTasks();
          if (prev.onShow) prev.onShow();
        }
      } catch (e) {
        console.warn('刷新上页失败', e);
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (error) {
      console.error('发布失败:', error);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 草稿保存
  saveDraft() {
    const draft = {
      title: this.data.title,
      description: this.data.description,
      location: this.data.location,
      reward: this.data.reward,
      urgency: this.data.urgency,
      category: this.data.category,
      deadline: this.data.deadline,
      savedAt: new Date().toLocaleString()
    };
    
    wx.setStorageSync('postTaskDraft', draft);
    wx.showToast({ title: '草稿已保存', icon: 'success', duration: 1000 });
  },

  // 加载草稿
  loadDraft() {
    const draft = wx.getStorageSync('postTaskDraft');
    if (draft) {
      this.setData(draft);
    }
  },

  // 清空表单
  clearForm() {
    wx.showModal({
      title: '清空表单',
      content: '确定要清空所有内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            title: '',
            description: '',
            location: '',
            reward: 10,
            urgency: 'low',
            category: '其他',
            deadline: this.formatDate(new Date(Date.now() + 86400000))
          });
          wx.showToast({ title: '已清空', icon: 'success', duration: 1000 });
        }
      }
    });
  }
});

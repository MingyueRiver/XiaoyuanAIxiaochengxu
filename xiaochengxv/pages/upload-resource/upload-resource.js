const app = getApp();

Page({
  data: {
    // 表单数据
    title: '',
    description: '',
    category: '笔记',
    resourceType: '笔记',
    isFree: true,
    price: 9.99,
    tags: [],
    selectedTags: [],
    
    // 文件上传
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    coverImage: '',
    
    // UI状态
    isSubmitting: false,
    selectedCategories: [
      '笔记', '视频', '文档', '代码', '模板', '其他'
    ],
    selectedTypes: [
      '笔记', '视频', 'PDF', '文档', '图片', '代码', '压缩包'
    ],
    suggestedTags: [
      '数学', '英语', '计算机', '编程', '设计', '写作',
      '四级', '六级', '考研', '面试', '项目'
    ]
  },

  onLoad() {
    console.log('【分享资源】页面加载');
    this.checkAuth();
  },

  // 检查认证
  checkAuth() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '未登录',
        content: '需要登录后才能分享资源',
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

  // 表单输入
  onInputTitle(e) {
    this.setData({ title: e.detail.value });
  },

  onInputDescription(e) {
    this.setData({ description: e.detail.value });
  },

  onInputPrice(e) {
    const price = parseFloat(e.detail.value) || 0;
    this.setData({ price: Math.max(0.01, Math.min(price, 999)) });
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({ category: e.detail.value });
  },

  // 资源类型选择
  onTypeChange(e) {
    this.setData({ resourceType: e.detail.value });
  },

  // 免费/付费切换
  onFreeToggle(e) {
    this.setData({ isFree: e.detail });
  },

  // 标签选择
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = this.data.selectedTags;
    const idx = selectedTags.indexOf(tag);

    if (idx > -1) {
      selectedTags.splice(idx, 1);
    } else {
      if (selectedTags.length < 5) {
        selectedTags.push(tag);
      } else {
        wx.showToast({ title: '最多选择5个标签', icon: 'none' });
        return;
      }
    }

    this.setData({ selectedTags });
  },

  // 上传文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        if (file.size > 100 * 1024 * 1024) {
          wx.showToast({ title: '文件不能超过100MB', icon: 'none' });
          return;
        }

        this.setData({
          fileUrl: file.path,
          fileName: file.name,
          fileSize: file.size
        });
        wx.showToast({ title: '文件已选择', icon: 'success', duration: 1000 });
      }
    });
  },

  // 上传封面图
  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFilePaths[0]
        });
        wx.showToast({ title: '封面已选择', icon: 'success', duration: 1000 });
      }
    });
  },

  // 移除文件
  removeFile() {
    this.setData({
      fileUrl: '',
      fileName: '',
      fileSize: 0
    });
  },

  // 移除封面
  removeCover() {
    this.setData({ coverImage: '' });
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // 表单验证
  validateForm() {
    const { title, description, fileUrl, coverImage, category } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入资源标题', icon: 'none' });
      return false;
    }

    if (title.length < 5) {
      wx.showToast({ title: '资源标题至少5个字', icon: 'none' });
      return false;
    }

    if (title.length > 100) {
      wx.showToast({ title: '资源标题不超过100个字', icon: 'none' });
      return false;
    }

    if (!description.trim()) {
      wx.showToast({ title: '请输入资源描述', icon: 'none' });
      return false;
    }

    if (description.length < 10) {
      wx.showToast({ title: '资源描述至少10个字', icon: 'none' });
      return false;
    }

    if (description.length > 500) {
      wx.showToast({ title: '资源描述不超过500个字', icon: 'none' });
      return false;
    }

    if (!fileUrl) {
      wx.showToast({ title: '请选择资源文件', icon: 'none' });
      return false;
    }

    if (!this.data.isFree && (this.data.price < 0.01 || this.data.price > 999)) {
      wx.showToast({ title: '价格范围：0.01-999元', icon: 'none' });
      return false;
    }

    if (this.data.selectedTags.length === 0) {
      wx.showToast({ title: '请至少选择一个标签', icon: 'none' });
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
      category: this.data.category,
      resourceType: this.data.resourceType,
      isFree: this.data.isFree,
      price: this.data.isFree ? 0 : this.data.price,
      tags: this.data.selectedTags,
      fileName: this.data.fileName,
      fileSize: this.data.fileSize
    };

    try {
      await app.request({
        url: '/resources/upload',
        method: 'POST',
        data: payload
      });

      wx.showToast({ title: '资源发布成功！', icon: 'success' });

      // 尝试通知上一个页面刷新资源列表
      try {
        const pages = getCurrentPages();
        if (pages.length >= 2) {
          const prev = pages[pages.length - 2];
          if (prev.loadResources) prev.loadResources();
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

  // 保存草稿
  saveDraft() {
    const draft = {
      title: this.data.title,
      description: this.data.description,
      category: this.data.category,
      resourceType: this.data.resourceType,
      isFree: this.data.isFree,
      price: this.data.price,
      selectedTags: this.data.selectedTags,
      fileName: this.data.fileName,
      savedAt: new Date().toLocaleString()
    };

    wx.setStorageSync('uploadResourceDraft', draft);
    wx.showToast({ title: '草稿已保存', icon: 'success', duration: 1000 });
  }
});

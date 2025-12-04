Page({
  data: {
    resource: {},
    parsedContent: ''
  },

  onLoad(options) {
    // 支持两种调用形式：1) ?resource=<encodeURIComponent(JSON)> 2) ?id=<resourceId>
    try {
      if (options.resource) {
        const resource = JSON.parse(decodeURIComponent(options.resource));
        this.setData({ resource, parsedContent: this.parseContent(resource.content, resource.type) });
        return;
      }

      if (options.id) {
        const app = getApp();
        const rid = options.id;
        // 优先从全局 mock 数据查找
        const found = (app.globalData.resources || []).find(r => r._id === rid || String(r.id) === String(rid));
        if (found) {
          this.setData({ resource: found, parsedContent: this.parseContent(found.content || found.desc || '', found.type || 'article') });
          return;
        }

        // 回退：尝试请求接口获取（若后端实现）
        app.request({ url: '/resources/list', data: { page: 1, pageSize: app.globalData.pageSize || 10 } }).then(res => {
          const all = res.data?.resources || [];
          const r = all.find(x => x._id === rid || String(x.id) === String(rid));
          if (r) this.setData({ resource: r, parsedContent: this.parseContent(r.content || r.desc || '', r.type || 'article') });
          else wx.showToast({ title: '资源未找到', icon: 'none' });
        }).catch(() => {
          wx.showToast({ title: '加载资源失败', icon: 'none' });
        });
        return;
      }

      wx.showToast({ title: '资源参数缺失', icon: 'none' });
    } catch (err) {
      console.error('解析资源失败', err);
      wx.showToast({ title: '资源解析失败', icon: 'none' });
    }
  },

  // 解析不同类型资源的内容
  parseContent(content, type) {
    if (!content) {
      return type === 'template' || type === 'tool' ? '<div style="font-size:24rpx;color:#666;">该资源为实用工具/模板，下载后即可使用</div>' : '';
    }

    // 文章/笔记：解析Markdown格式
    let parsed = content.replace(/\n/g, '<br/>');
    parsed = parsed.replace(/### (.*?)<br\/>/g, '<h3 style="font-size:28rpx;margin:30rpx 0 15rpx 0;color:#333;font-weight:bold;">$1</h3>');
    parsed = parsed.replace(/(\d+)\. (.*?)<br\/>/g, '<div style="margin-left:40rpx;margin-bottom:15rpx;font-size:24rpx;color:#666;">$1. $2</div>');
    parsed = `<div style="font-size:24rpx;color:#666;line-height:1.8;">${parsed}</div>`;
    return parsed;
  },

  // 处理下载/购买操作
  handleAction(e) {
    const { isFree, title } = this.data.resource;
    if (isFree) {
      wx.showToast({ title: `《${title}》下载成功`, icon: 'success' });
      // 后续扩展：调用下载接口，获取文件链接
    } else {
      wx.showToast({ title: `《${title}》购买功能开发中`, icon: 'none' });
      // 后续扩展：调用支付接口
    }
  }
});
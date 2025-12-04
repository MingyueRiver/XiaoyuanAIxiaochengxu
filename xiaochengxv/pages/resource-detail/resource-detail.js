Page({
  data: {
    resource: {},
    parsedContent: ''
  },

  onLoad(options) {
    // 接收资源数据
    const resource = JSON.parse(decodeURIComponent(options.resource));
    this.setData({
      resource,
      parsedContent: this.parseContent(resource.content, resource.type)
    });
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
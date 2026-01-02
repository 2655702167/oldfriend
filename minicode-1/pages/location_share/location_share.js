Page({
  data: {
    latitude: 0,
    longitude: 0,
    address: '',
    markers: []
  },

  onLoad(options) {
    if (options.latitude && options.longitude) {
      const lat = parseFloat(options.latitude);
      const lng = parseFloat(options.longitude);
      // 解码地址参数，防止乱码
      const addr = options.address ? decodeURIComponent(options.address) : '未知位置';

      this.setData({
        latitude: lat,
        longitude: lng,
        address: addr,
        markers: [{
          id: 1,
          latitude: lat,
          longitude: lng,
          title: '我的位置',
          iconPath: '/images/Location.png', // 确保有这个图标，或者使用默认
          width: 30,
          height: 30
        }]
      });
    }
  },

  // 处理分享按钮点击（替代方案）
  handleShare() {
    const info = `【紧急求助】我的当前位置：${this.data.address}\n(经度:${this.data.longitude}, 纬度:${this.data.latitude})`;
    
    wx.setClipboardData({
      data: info,
      success: () => {
        wx.showModal({
          title: '位置已复制',
          content: '由于小程序分享功能暂时受限，请手动粘贴位置信息发送给紧急联系人。',
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    });
  },

  // 分享给朋友 (保留此方法以支持右上角菜单分享)
  onShareAppMessage() {
    console.log('onShareAppMessage triggered'); // 添加日志
    return {
      title: '【紧急求助】这是我的当前位置，请查看！',
      path: `/pages/location_share/location_share?latitude=${this.data.latitude}&longitude=${this.data.longitude}&address=${encodeURIComponent(this.data.address)}`
    };
  }
});
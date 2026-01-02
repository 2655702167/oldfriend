Page({
  data: {
    fontSizes: {},
    userInfo: {
      name: '',
      phone: '',
      address: ''
    },
    isEditing: false
  },

  onLoad() {
    const savedInfo = wx.getStorageSync('userInfoDetail') || {};
    this.setData({
      userInfo: savedInfo
    });
  },

  onShow() {
    this.calcFontSizes();
  },

  calcFontSizes() {
    const app = getApp();
    this.setData({
      fontSizes: {
        title: app.calcFontSize('title'),
        content: app.calcFontSize('content'),
        button: app.calcFontSize('button'),
        time: app.calcFontSize('time')
      }
    });
  },

  // 开始编辑
  startEditing() {
    this.setData({ isEditing: true });
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ 'userInfo.name': e.detail.value });
  },
  onPhoneInput(e) {
    this.setData({ 'userInfo.phone': e.detail.value });
  },
  onAddressInput(e) {
    this.setData({ 'userInfo.address': e.detail.value });
  },

  // 保存信息
  saveInfo() {
    wx.setStorageSync('userInfoDetail', this.data.userInfo);
    this.setData({ isEditing: false });
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },
});

Page({
  data: {
    fontSizes: {},
    addresses: {
      home: '',
      hospital: '',
      supermarket: ''
    },
    isEditing: false
  },

  onLoad() {
    const savedAddresses = wx.getStorageSync('commonAddresses') || {
      home: '',
      hospital: '',
      supermarket: ''
    };
    this.setData({
      addresses: savedAddresses
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

  startEditing() {
    this.setData({ isEditing: true });
  },

  onInput(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;
    const key = `addresses.${type}`;
    this.setData({
      [key]: value
    });
  },

  saveAddresses() {
    wx.setStorageSync('commonAddresses', this.data.addresses);
    this.setData({ isEditing: false });
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  }
});

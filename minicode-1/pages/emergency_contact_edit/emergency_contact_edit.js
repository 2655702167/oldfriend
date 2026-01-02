Page({
  data: {
    fontSizes: {},
    contacts: [],
    isEditing: false
  },

  onLoad() {
    const savedContacts = wx.getStorageSync('emergencyContacts') || [];
    // 如果没有联系人，默认添加一个空的
    if (savedContacts.length === 0) {
      savedContacts.push({ name: '', phone: '' });
    }
    this.setData({
      contacts: savedContacts
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
    const contacts = this.data.contacts;
    if (contacts.length === 0) {
        contacts.push({ name: '', phone: '' });
        this.setData({ contacts });
    }
    this.setData({ isEditing: true });
  },

  onInputName(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const key = `contacts[${index}].name`;
    this.setData({ [key]: value });
  },

  onInputPhone(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const key = `contacts[${index}].phone`;
    this.setData({ [key]: value });
  },

  addContact() {
    const contacts = this.data.contacts;
    contacts.push({ name: '', phone: '' });
    this.setData({ contacts });
  },

  deleteContact(e) {
    const index = e.currentTarget.dataset.index;
    const contacts = this.data.contacts;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      success: (res) => {
        if (res.confirm) {
          contacts.splice(index, 1);
          this.setData({ contacts });
        }
      }
    });
  },

  saveContacts() {
    // 过滤掉空数据
    const validContacts = this.data.contacts.filter(c => c.name && c.phone);
    
    if (validContacts.length === 0 && this.data.contacts.length > 0) {
       wx.showToast({
        title: '请填写联系人信息',
        icon: 'none'
      });
      return;
    }

    wx.setStorageSync('emergencyContacts', validContacts);
    
    // 同时更新旧的单联系人存储，保持兼容
    if (validContacts.length > 0) {
        wx.setStorageSync('emergencyContact', validContacts[0]);
    }

    this.setData({ 
        contacts: validContacts,
        isEditing: false 
    });
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  }
});

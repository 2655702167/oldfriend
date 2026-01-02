const app = getApp();
Page({
  data: {
    // 字体大小（3档：标准/大号/超大号）
    fontSizeOptions: [
      { label: '标准', value: 28 },
      { label: '大号', value: 32 },
      { label: '超大号', value: 36 }
    ],
    selectedSize: app.globalData.baseFontSize || 28, // 当前选中的基准值
    currentFontLabel: '标准', // 当前字体的文字描述
    fontSizes: {}, // 动态计算的字体大小

    // 音量设置
    volumeValue: 80, // 音量值（0-100）
    volumeLevel: '最大音量', // 音量文字描述

    // 方言选择
    dialectList: ['普通话', '四川话', '粤语', '英语', '上海话', '东北话', '陕西话', '河南话', '杭州话', '闽南话', '客家话'], // 方言列表
    dialectIndex: 0, // 默认选中普通话
    selectedDialect: '普通话',

    // 亲人音色选择
    selectedVoices: [] // 选中的音色（孙子/女儿）
  },

  onLoad() {
    // 初始化字体和当前选中字体的文字描述
    this.calcAllFonts();
    this.setCurrentFontLabel();
    // 读取本地存储的设置（如果有）
    this.loadSavedSettings();
  },
  goToIndex(){
    app.playText('返回首页');
    wx.navigateBack({
    })
},

  onShow() {
    // 页面显示时刷新字体
    this.calcAllFonts();
    app.playText('设置');
  },

  // 计算所有字体大小（按比例）
  calcAllFonts() {
    const baseSize = this.data.selectedSize;
    this.setData({
      fontSizes: {
        title: `${baseSize * 1.4}rpx`, // 标题放大1.4倍
        content: `${baseSize * 1.0}rpx`, // 正文基准
        button: `${baseSize * 1.1}rpx`, // 按钮放大1.1倍
        time: `${baseSize * 0.8}rpx` // 辅助文字缩小0.8倍
      }
    });
  },

  // 设置当前字体的文字描述（如“标准”）
  setCurrentFontLabel() {
    const target = this.data.fontSizeOptions.find(
      item => item.value === this.data.selectedSize
    );
    this.setData({ currentFontLabel: target ? target.label : '标准' });
  },

  // 选择字体大小
  selectFontSize(e) {
    const newSize = Number(e.currentTarget.dataset.value);
    this.setData({ selectedSize: newSize });
    this.calcAllFonts(); // 实时更新字体
    this.setCurrentFontLabel(); // 更新文字描述
    
    const label = this.data.fontSizeOptions.find(i => i.value === newSize).label;
    app.playText(`已切换到${label}字体`);
  },

  // 调整音量
  changeVolume(e) {
    const value = e.detail.value;
    let level = '静音';
    if (value > 0 && value <= 30) level = '小音量';
    else if (value > 30 && value <= 70) level = '中音量';
    else if (value > 70) level = '最大音量';
    
    this.setData({
      volumeValue: value,
      volumeLevel: level
    });
    
    // 节流播放，避免滑动时频繁触发
    if (!this.lastVolumeTime || Date.now() - this.lastVolumeTime > 1000) {
        app.playText(`当前音量${value}`);
        this.lastVolumeTime = Date.now();
    }
  },

  // 切换方言
  changeDialect(e) {
    const index = e.detail.value;
    this.setData({
      dialectIndex: index,
      selectedDialect: this.data.dialectList[index]
    });
  },

  // 直接选择方言（新增）
  selectDialectDirect(e) {
    const dialect = e.currentTarget.dataset.dialect;
    const index = this.data.dialectList.indexOf(dialect);
    this.setData({
      dialectIndex: index,
      selectedDialect: dialect
    });
    app.playText(`已选择${dialect}`);
  },

  // 选择亲人音色
  selectVoice(e) {
    const value = e.detail.value;
    this.setData({ selectedVoices: value });
    if (value.length > 0) {
        app.playText('已更新音色设置');
    }
  },

  // 恢复默认设置
  resetDefault() {
    this.setData({
      selectedSize: 28, // 标准字体
      volumeValue: 80,
      volumeLevel: '最大音量',
      dialectIndex: 0,
      selectedDialect: '普通话',
      selectedVoices: []
    });
    this.calcAllFonts();
    this.setCurrentFontLabel();
    app.playText('已恢复默认设置');
    wx.showToast({ title: '已恢复默认设置', icon: 'none' });
  },

  // 保存设置到全局和本地存储
  saveSetting() {
    // 更新全局变量
    app.globalData.baseFontSize = this.data.selectedSize;
    app.globalData.setting = {
      fontSize: this.data.selectedSize,
      volume: this.data.volumeValue,
      dialect: this.data.selectedDialect,
      voices: this.data.selectedVoices
    };

    // 保存到本地存储
    wx.setStorageSync('appSetting', app.globalData.setting);

    app.playText('设置已保存');
    wx.showToast({ title: '设置已保存', icon: 'none' });
    // 延迟返回，确保提示显示
    setTimeout(() => wx.navigateBack(), 500);
  },

  // 读取本地存储的设置
  loadSavedSettings() {
    const saved = wx.getStorageSync('appSetting');
    if (saved) {
      this.setData({
        selectedSize: saved.fontSize || 28,
        volumeValue: saved.volume || 80,
        dialectIndex: this.data.dialectList.indexOf(saved.dialect) || 0,
        selectedDialect: saved.dialect || '普通话',
        selectedVoices: saved.voices || []
      });
      this.setCurrentFontLabel();
      this.changeVolume({ detail: { value: saved.volume || 80 } }); // 更新音量描述
    }
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  }
})
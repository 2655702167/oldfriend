// 小程序全局应用实例
const voice = require('./utils/voice.js');

App({
    // 全局语音播报方法 - 暂时禁用
    playText: function(text) {
        // 空函数，防止调用时报错
        console.log('[Voice Disabled]', text);
    },

    // 全局共享数据（所有页面可访问）
    globalData: {
      hasWelcomed: false, // 是否已播放欢迎语
      // 字体基准值（对应三档：标准28/大号32/超大号36）
      baseFontSize: 28, 
      // 存储所有设置项（字体/音量/方言/音色）
      setting: {
        fontSize: 28,       // 默认标准字体
        volume: 80,         // 默认音量80%
        dialect: '普通话',  // 默认方言
        voices: []          // 默认无选中音色
      }
    },
  
    // 小程序启动时执行
    onLaunch() {
      // 读取本地存储的设置，恢复上次配置
      this.loadSavedSettings();
      
      // 禁用语音预加载，避免后端不可用时持续报错
      // this.preloadCommonVoices();
    },
    
    // 预下载常用语音
    preloadCommonVoices() {
      const commonTexts = [
        '欢迎使用老友助手',
        '返回',
        '打车',
        '缴费',
        '挂号',
        '问答',
        '呼救',
        '设置',
        '正在录音',
        '识别成功',
        '识别失败，请重试',
        '没有听清，请再说一次',
        '请输入症状或科室',
        '正在为您搜索',
        '识别成功，已为您填入',
        '开始预约',
        '内科', '外科', '眼科', '中医科', '牙科', '皮肤科'
      ];
      
      // 延迟执行，避免影响启动速度
      setTimeout(() => {
        voice.preloadVoices(commonTexts);
      }, 2000);
    },
  
    // 全局方法：读取本地存储的设置
    loadSavedSettings() {
      try {
        const savedSetting = wx.getStorageSync('appSetting');
        if (savedSetting) {
          // 恢复字体基准值
          this.globalData.baseFontSize = savedSetting.fontSize || 28;
          // 恢复所有设置
          this.globalData.setting = {
            fontSize: savedSetting.fontSize || 28,
            volume: savedSetting.volume || 80,
            dialect: savedSetting.dialect || '普通话',
            voices: savedSetting.voices || []
          };
        }
      } catch (e) {
        // 异常时使用默认值
        console.error('读取设置失败：', e);
        this.globalData.baseFontSize = 28;
      }
    },
  
    // 全局方法：保存设置到本地
    saveGlobalSetting(newSetting) {
      try {
        // 更新全局数据（使用Object.assign兼容旧版本）
        this.globalData.setting = Object.assign({}, this.globalData.setting, newSetting);
        this.globalData.baseFontSize = newSetting.fontSize || this.globalData.baseFontSize;
        // 持久化到本地存储
        wx.setStorageSync('appSetting', this.globalData.setting);
      } catch (e) {
        console.error('保存设置失败：', e);
      }
    },
  
    // 全局方法：计算字体大小（所有页面可调用）
    calcFontSize(type) {
      const baseSize = this.globalData.baseFontSize;
      // 字体比例（和setting页保持一致）
      const fontRatio = {
        title: 1.4,    // 标题 = 基准 × 1.4
        content: 1.0,  // 正文 = 基准 × 1.0
        button: 1.1,   // 按钮 = 基准 × 1.1
        time: 0.8      // 时间戳 = 基准 × 0.8
      };
      return `${baseSize * (fontRatio[type] || 1.0)}rpx`;
    }
  })
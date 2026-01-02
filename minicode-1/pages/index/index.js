// index.js
const app = getApp();
const voiceUtil = require('../../utils/voice.js');

Page({
    data: {
      fontSizes: {},
      isRecording: false  // 是否正在录音
    },
  
    onLoad() {
      console.log('首页加载完成');
      // 请求录音权限
      this.requestRecordPermission();
    },
    
    goToCar(){
        wx.navigateTo({
          url: '/pages/Voice_taxi/Voice_taxi'
        })
    },
    
    onShow() {
        this.calcFontSizes();
        // 页面显示时播报欢迎语（仅首次）
        if (!app.globalData.hasWelcomed) {
            app.playText('欢迎使用老友助手');
            app.globalData.hasWelcomed = true;
        }
    },
    
    calcFontSizes() {
        this.setData({
          fontSizes: {
            title: app.calcFontSize('title'),
            content: app.calcFontSize('content'),
            button: app.calcFontSize('button'),
            time: app.calcFontSize('time')
          }
        });
    },
    
    /**
     * 请求录音权限
     */
    requestRecordPermission() {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            wx.authorize({
              scope: 'scope.record',
              success: () => {
                console.log('录音权限授权成功');
              },
              fail: () => {
                console.log('用户拒绝录音权限');
              }
            });
          }
        }
      });
    },
   
    /**
     * 语音输入 - 长按开始
     */
    onVoiceStart() {
      console.log('主页：开始语音识别');
      
      // 震动反馈
      wx.vibrateShort();
      
      this.setData({ isRecording: true });
      
      wx.showToast({
        title: '正在录音...',
        icon: 'none',
        duration: 60000
      });
      
      voiceUtil.startRecord();
    },
    
    /**
     * 语音输入 - 松开结束
     */
    onVoiceEnd() {
      console.log('主页：停止录音');
      this.setData({ isRecording: false });
      
      wx.hideToast();
      voiceUtil.stopRecord();
      
      // 识别语音
      setTimeout(() => {
        voiceUtil.recognizeAudio(
          (text) => {
            if (text && text.trim() !== '') {
              console.log('识别到内容：', text);
              app.playText('识别成功');
              this.handleVoiceCommand(text);
            } else {
              app.playText('没有听清，请再说一次');
              wx.showModal({
                title: '识别失败',
                content: '没有识别到内容，请重新尝试',
                showCancel: false
              });
            }
          },
          (err) => {
            console.error('语音识别失败:', err);
            app.playText('识别失败，请重试');
            wx.showToast({
              title: '识别失败，请重试',
              icon: 'none'
            });
          }
        );
      }, 300);
    },
    
    /**
     * 智能处理语音指令 - 支持目的地识别
     */
    handleVoiceCommand(text) {
      const command = text.toLowerCase();
      
      // 提取目的地关键词（去哪里）
      const destinationMatch = text.match(/(去|到|前往)(.{2,})/);
      
      // 打车相关 - 智能识别目的地
      if (command.includes('打车') || command.includes('叫车') || command.includes('出租车') || 
          command.includes('去') || command.includes('到') || destinationMatch) {
        
        let destination = '';
        if (destinationMatch && destinationMatch[2]) {
          destination = destinationMatch[2].trim();
        } else {
          // 尝试提取常见地点
          const places = ['医院', '超市', '银行', '公园', '车站', '机场', '商场', '学校', '大学'];
          for (let place of places) {
            if (command.includes(place)) {
              destination = place;
              break;
            }
          }
        }
        
        if (destination) {
          wx.showModal({
            title: '智能打车助手',
            content: `识别到您要去：${destination}\n\n将为您自动跳转打车并填写目的地`,
            confirmText: '确定',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 跳转到打车页面并传递目的地
                wx.navigateTo({
                  url: `/pages/Voice_taxi/Voice_taxi?destination=${encodeURIComponent(destination)}`
                });
              }
            }
          });
        } else {
          wx.showModal({
            title: '语音指令',
            content: `识别到：${text}\n\n准备跳转到打车页面`,
            confirmText: '确定',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                this.navigateToTaxi();
              }
            }
          });
        }
      }
      // 缴费相关
      else if (command.includes('缴费') || command.includes('交费') || command.includes('电费') || 
               command.includes('水费') || command.includes('网费')) {
        wx.showModal({
          title: '语音指令',
          content: `识别到：${text}\n\n准备跳转到生活缴费页面`,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.navigateToPayment();
            }
          }
        });
      }
      // 挂号相关
      else if (command.includes('挂号') || command.includes('看病') || command.includes('医院') || 
               command.includes('预约')) {
        wx.showModal({
          title: '语音指令',
          content: `识别到：${text}\n\n准备跳转到医院挂号页面`,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.navigateToRegistration();
            }
          }
        });
      }
      // 问答聊天相关
      else if (command.includes('聊天') || command.includes('说话') || command.includes('问答')) {
        wx.showModal({
          title: '语音指令',
          content: `识别到：${text}\n\n准备跳转到智能问答页面`,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.navigateToQA();
            }
          }
        });
      }
      // 呼救相关
      else if (command.includes('呼救') || command.includes('救命') || command.includes('紧急') || 
               command.includes('帮助')) {
        wx.showModal({
          title: '语音指令',
          content: `识别到：${text}\n\n准备跳转到紧急呼救页面`,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.navigateToSOS();
            }
          }
        });
      }
      // 设置相关
      else if (command.includes('设置') || command.includes('调整')) {
        wx.showModal({
          title: '语音指令',
          content: `识别到：${text}\n\n准备跳转到设置页面`,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.navigateToSettings();
            }
          }
        });
      }
      // 未识别的指令
      else {
        wx.showModal({
          title: '语音识别结果',
          content: `您说的是："${text}"\n\n暂时无法理解该指令，请尝试说：\n• "我要打车"\n• "生活缴费"\n• "医院挂号"\n• "智能问答"\n• "紧急呼救"`,
          showCancel: false
        });
      }
    },

    // 功能按钮点击事件
    navigateToTaxi() {
      app.playText('打车');
      wx.navigateTo({
        url: '/pages/Voice_taxi/Voice_taxi'
      });
    },
  
    navigateToPayment() {
      app.playText('缴费');
      wx.navigateTo({
        url: '/pages/Living_payment/Living_payment'
      });
    },
  
    navigateToRegistration() {
      app.playText('挂号');
      wx.navigateTo({
        url: '/pages/Hospital_registration/Hospital_registration'
      });
    },
  
    navigateToQA() {
      app.playText('问答');
      wx.navigateTo({
        url: '/pages/Olds_chatting/Olds_chatting'
      });
    },
  
    navigateToSOS() {
      app.playText('呼救');
      wx.navigateTo({
        url: '/pages/Emergency_safety/Emergency_safety'
      });
    },
  
    navigateToSettings() {
      app.playText('设置');
      wx.navigateTo({
        url: '/pages/Setting/Setting'
      });
    },
  
    // 底部导航栏点击事件
    navigateToProfile() {
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    },
  
    navigateToHelp() {
      wx.switchTab({
        url: '/pages/help/help'
      });
    },
  
    navigateToEmergency() {
      wx.switchTab({
        url: '/pages/emergency/emergency'
      });
    }
  });
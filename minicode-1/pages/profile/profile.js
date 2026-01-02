// profile.js
const app = getApp();
const { post } = require('../../utils/request.js');

Page({
    data: {
      fontSize: 'medium' // 默认字体大小
    },
  
    onLoad() {
        // 页面加载时，尝试从本地存储获取用户信息
        const savedUserInfo = wx.getStorageSync('userInfo');
        const savedFontSize = wx.getStorageSync('fontSize');
        
        if (savedUserInfo) {
          this.setData({
            userInfo: savedUserInfo
          });
        }
        
        if (savedFontSize) {
          this.setData({
            fontSize: savedFontSize
          });
          this.applyFontSize(savedFontSize);
        }
      },
    
      // 昵称填写回调
      onNicknameChange(e) {
        const nickName = e.detail.value;
        if (!nickName) return;

        const newUserInfo = Object.assign({}, this.data.userInfo, {
          nickName: nickName
        });
        
        this.setData({
          userInfo: newUserInfo
        });
        
        wx.setStorageSync('userInfo', newUserInfo);
      },

      // 微信号填写回调
      onWechatIdChange(e) {
        const wechatId = e.detail.value;
        const newUserInfo = Object.assign({}, this.data.userInfo, {
          wechatId: wechatId
        });
        
        this.setData({
          userInfo: newUserInfo
        });
        
        wx.setStorageSync('userInfo', newUserInfo);
      },

      // 手动绑定手机号
      showPhoneInput() {
        wx.showModal({
          title: '绑定手机号',
          // content: '请输入您的手机号码', // 移除 content，避免显示为不可编辑的提示文本
          editable: true,
          placeholderText: '请输入11位手机号',
          success: (res) => {
            if (res.confirm) {
              const phoneNumber = res.content;
              if (!/^1\d{10}$/.test(phoneNumber)) {
                wx.showToast({
                  title: '手机号格式不正确',
                  icon: 'none'
                });
                return;
              }
              
              const newUserInfo = Object.assign({}, this.data.userInfo, {
                phoneNumber: phoneNumber
              });
              
              this.setData({
                userInfo: newUserInfo
              });
              
              wx.setStorageSync('userInfo', newUserInfo);
              
              wx.showToast({
                title: '绑定成功',
                icon: 'success'
              });
            }
          }
        });
      },

      // 选择头像事件（单独获取头像）
      onChooseAvatar(e) {
        const avatarUrl = e.detail.avatarUrl;
        const newUserInfo = Object.assign({}, this.data.userInfo, {
          avatarUrl: avatarUrl
        });
        
        this.setData({
          userInfo: newUserInfo
        });
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', newUserInfo);
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 1500
        });
      },
    


      // 获取手机号事件 (一键绑定)
      onGetPhoneNumber(e) {
        if (e.detail.code) {
          // 用户允许授权
          console.log('获取到的code:', e.detail.code);
          
          wx.showLoading({
            title: '绑定中...',
          });

          // 调用后端接口进行绑定
          post('/user/bindPhone', {
            code: e.detail.code
          }).then(res => {
             wx.hideLoading();
             // res should contain the phone number
             const phoneNumber = res.phoneNumber || "13800138000";
             
             const newUserInfo = Object.assign({}, this.data.userInfo, {
                phoneNumber: phoneNumber
             });
            
             this.setData({
                userInfo: newUserInfo
             });
            
             wx.setStorageSync('userInfo', newUserInfo);
            
             wx.showToast({
                title: '绑定成功',
                icon: 'success'
             });
          }).catch(err => {
             wx.hideLoading();
             console.error('绑定失败', err);
             // 如果后端未实现或失败，降级为模拟成功（为了演示）
             // 或者提示用户手动输入
             wx.showToast({
                title: '绑定失败，请重试',
                icon: 'none'
             });
          });

        } else {
          // 用户拒绝授权 或 个人账号无权限
          console.log('获取手机号失败或被拒绝', e.detail);
          
          // 检测是否为个人账号权限问题 (errno 102)
          if (e.detail.errno === 102 || (e.detail.errMsg && e.detail.errMsg.includes('no permission'))) {
             wx.showModal({
                title: '权限提示',
                content: '由于当前小程序是个人主体，微信限制无法使用"一键获取手机号"功能。是否使用模拟数据演示绑定效果？',
                confirmText: '演示绑定',
                cancelText: '取消',
                success: (res) => {
                   if (res.confirm) {
                      // 模拟绑定成功
                      const mockPhone = "13800138000";
                      const newUserInfo = Object.assign({}, this.data.userInfo, {
                        phoneNumber: mockPhone
                      });
                      
                      this.setData({
                        userInfo: newUserInfo
                      });
                      
                      wx.setStorageSync('userInfo', newUserInfo);
                      
                      wx.showToast({
                        title: '演示绑定成功',
                        icon: 'success'
                      });
                   }
                }
             });
             return;
          }

          // 其他失败情况，引导使用手动输入
          wx.showToast({
            title: '请尝试手动输入',
            icon: 'none',
            duration: 2000
          });
        }
      },

      // 手动绑定手机号
      showPhoneInput() {
        wx.showModal({
          title: '手机号登录',
          editable: true,
          placeholderText: '请输入11位手机号',
          success: (res) => {
            if (res.confirm) {
              const phoneNumber = res.content;
              if (!/^1\d{10}$/.test(phoneNumber)) {
                wx.showToast({
                  title: '手机号格式不正确',
                  icon: 'none'
                });
                return;
              }
              
              const newUserInfo = Object.assign({}, this.data.userInfo, {
                phoneNumber: phoneNumber
              });
              
              this.setData({
                userInfo: newUserInfo
              });
              
              wx.setStorageSync('userInfo', newUserInfo);
              
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
            }
          }
        });
      },

    // 应用字体大小到全局
    applyFontSize(size) {
      // 这里可以实现全局字体大小设置
      // 例如通过全局变量或事件通知其他页面
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.fontSize = size;
      }
    },
  
    // 设置字体大小
    setFontSize(e) {
      const size = e.currentTarget.dataset.size;
      this.setData({
        fontSize: size
      });
      
      // 保存到本地存储
      wx.setStorageSync('fontSize', size);
      
      // 应用字体大小
      this.applyFontSize(size);
      
      // 提示用户
      wx.showToast({
        title: '字体大小已设置',
        icon: 'success',
        duration: 1000
      });
    },
  
    // 导航到我的信息页面
    navigateToMyInfo() {
      app.playText('我的信息');
      wx.navigateTo({
        url: '/pages/my_info/my_info'
      });
    },
  
    // 导航到紧急联系人页面
    navigateToEmergencyContact() {
      app.playText('紧急联系人');
      wx.navigateTo({
        url: '/pages/emergency_contact_edit/emergency_contact_edit'
      });
    },
  
    // 导航到常用地址页面
    navigateToCommonAddress() {
      app.playText('常用地址');
      wx.navigateTo({
        url: '/pages/address_book/address_book'
      });
    },
  
    // 导航到缴费记录页面
    navigateToPaymentRecord() {
      app.playText('缴费记录');
      wx.navigateTo({
        url: '/pages/payment_history/payment_history'
      });
    },
  
    onShow() {
        this.calcFontSizes(); // 调用字体计算方法
        app.playText('个人中心');
      },
      calcFontSizes() {
        // 调用 app.js 中的全局方法，按比例计算各类型字体
        this.setData({
          fontSizes: {
            title: app.calcFontSize('title'),    // 标题字体（基准×1.4）
            content: app.calcFontSize('content'),// 正文字体（基准×1.0）
            button: app.calcFontSize('button'),  // 按钮字体（基准×1.1）
            time: app.calcFontSize('time')       // 辅助文字（基准×0.8）
          }
        });
      },
    // 导航到挂号记录页面
    navigateToRegistrationRecord() {
      app.playText('挂号记录');
      wx.navigateTo({
        url: '/pages/registration_history/registration_history'
      });
    },
  
    // 导航到语音设置页面
    navigateToVoiceSettings() {
      app.playText('语音设置');
      wx.navigateTo({
        url: '/pages/Setting/Setting'
      });
    },
  
      // 导航到方言设置页面
    navigateToDialectSettings() {
      app.playText('方言设置');
      wx.navigateTo({
        url: '/pages/Setting/Setting'
      });
    },

    // 退出登录/重置数据
    handleLogout() {
      wx.showModal({
        title: '确认重置',
        content: '这将清除当前绑定的所有用户信息，确定吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            wx.removeStorageSync('userInfo');
            
            // 重置页面数据
            this.setData({
              userInfo: {}
            });
            
            wx.showToast({
              title: '已重置',
              icon: 'success'
            });
          }
        }
      });
    }  });
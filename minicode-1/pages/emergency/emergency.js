// emergency.js
const app = getApp();
Page({
    data: {
      isEditing: false, // 是否正在编辑
      emergencyContact: {
        name: '',
        phone: '',
        avatar: '' // 头像URL
      },
      tempContact: { // 临时存储编辑中的联系人信息
        name: '',
        phone: ''
      },
      contacts: [
        { name: '120急救中心', phone: '120', realPhone: '120' },
        { name: '110报警中心', phone: '110', realPhone: '110' }
      ]
    },
  
    onLoad() {
      // 页面加载时，尝试从本地存储获取紧急联系人信息
      const savedContact = wx.getStorageSync('emergencyContact');
      if (savedContact) {
        this.setData({
          emergencyContact: savedContact
        });
      }
      
      // 获取其他联系人信息
      const savedContacts = wx.getStorageSync('emergencyContacts');
      if (savedContacts && savedContacts.length > 0) {
        this.setData({
          contacts: savedContacts
        });
      }
    },
  
    onShow() {
        this.calcFontSizes(); // 调用字体计算方法
        app.playText('紧急联系人');
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
  
    // 选择头像
    chooseAvatar() {
      wx.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 从相册选择
            this.selectImage(['album']);
          } else if (res.tapIndex === 1) {
            // 拍照
            this.selectImage(['camera']);
          }
        },
        fail: (err) => {
          console.error('选择头像失败:', err);
          wx.showToast({
            title: '选择头像失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
  
    // 选择图片
    selectImage(sourceType) {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'], // 压缩图片
        sourceType: sourceType,
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          
          // 显示加载提示
          wx.showLoading({
            title: '处理图片中...',
            mask: true
          });
          
          // 这里可以添加图片压缩或裁剪功能
          // 为了简化，我们直接使用原图
          setTimeout(() => {
            wx.hideLoading();
            
            // 更新头像
            const updatedContact = Object.assign({}, this.data.emergencyContact, {
              avatar: tempFilePath
            });
            
            this.setData({
              emergencyContact: updatedContact
            });
            
            // 保存到本地存储
            wx.setStorageSync('emergencyContact', updatedContact);
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success',
              duration: 1500
            });
          }, 500);
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none',
            duration: 2000
          });
          
          // 处理权限拒绝的情况
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            setTimeout(() => {
              wx.showModal({
                title: '权限提示',
                content: '需要相册/相机权限才能设置头像，请在设置中开启权限',
                showCancel: false
              });
            }, 1500);
          }
        }
      });
    },
  
    // 开始编辑联系人
    startEditing() {
      // 将当前联系人信息复制到临时存储
      this.setData({
        isEditing: true,
        tempContact: {
          name: this.data.emergencyContact.name,
          phone: this.data.emergencyContact.phone
        }
      });
    },
  
    // 取消编辑
    cancelEditing() {
      this.setData({
        isEditing: false,
        tempContact: {
          name: '',
          phone: ''
        }
      });
    },
  
    // 保存联系人
    saveContact() {
      const { name, phone } = this.data.tempContact;
      
      // 简单验证
      if (!name || !name.trim()) {
        wx.showToast({
          title: '请输入联系人姓名',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      if (!phone || !phone.trim()) {
        wx.showToast({
          title: '请输入电话号码',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 验证电话号码格式（简单验证）
      const phoneRegex = /^1[3-9]\d{9}$/; // 简单的手机号验证
      if (!phoneRegex.test(phone.trim())) {
        wx.showToast({
          title: '请输入正确的手机号码',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 更新联系人信息
      const updatedContact = Object.assign({}, this.data.emergencyContact, {
        name: name.trim(),
        phone: phone.trim()
      });
      
      this.setData({
        emergencyContact: updatedContact,
        isEditing: false,
        tempContact: {
          name: '',
          phone: ''
        }
      });
      
      // 保存到本地存储
      wx.setStorageSync('emergencyContact', updatedContact);
      
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
    },
  
    // 姓名输入处理
    onNameInput(e) {
      this.setData({
        'tempContact.name': e.detail.value
      });
    },
  
    // 电话输入处理
    onPhoneInput(e) {
      this.setData({
        'tempContact.phone': e.detail.value
      });
    },
  
    // 呼叫儿子/紧急联系人
    callSon() {
      if (!this.data.emergencyContact.phone) {
        wx.showToast({
          title: '请先设置联系人电话',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.makePhoneCall(this.data.emergencyContact.phone, this.data.emergencyContact.name || '紧急联系人');
    },
  
    // 呼叫120
    call120() {
      this.makePhoneCall('120', '120急救中心');
    },
  
    // 呼叫110
    call110() {
      this.makePhoneCall('110', '110报警中心');
    },
  
    // 通用的拨打电话方法
    makePhoneCall(phoneNumber, contactName) {
      wx.showModal({
        title: '确认呼叫',
        content: `确定要呼叫${contactName}吗？`,
        confirmText: '呼叫',
        confirmColor: '#ff6b6b',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: phoneNumber,
              success: () => {
                console.log(`成功呼叫${contactName}`);
                // 可以在这里记录呼叫历史
              },
              fail: (err) => {
                console.error(`呼叫${contactName}失败:`, err);
                wx.showToast({
                  title: '呼叫失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            });
          }
        }
      });
    },
  
    // 一键发送位置给所有联系人
    sendLocationToAll() {
      wx.showLoading({
        title: '获取位置中...',
        mask: true
      });
  
      // 先检查位置权限
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          // 已授权，获取位置
          this.getCurrentLocation();
        },
        fail: () => {
          wx.hideLoading();
          // 未授权，提示用户授权
          wx.showModal({
            title: '位置权限提示',
            content: '需要获取您的位置信息才能发送位置给紧急联系人',
            confirmText: '去授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户授权了，重新获取位置
                      this.getCurrentLocation();
                    }
                  }
                });
              }
            }
          });
        }
      });
    },
  
    // 获取当前位置
    getCurrentLocation() {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          wx.hideLoading();
          
          const latitude = res.latitude;
          const longitude = res.longitude;
          
          // 根据经纬度获取详细地址
          this.getAddress(latitude, longitude);
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('获取位置失败:', err);
          
          let errorMsg = '无法获取您的位置信息';
          if (err.errMsg.includes('auth deny')) {
            errorMsg = '位置权限被拒绝，请在设置中开启权限';
          }
          
          wx.showModal({
            title: '位置获取失败',
            content: errorMsg,
            showCancel: false
          });
        }
      });
    },
  
    // 根据经纬度获取详细地址
    getAddress(latitude, longitude) {
      // 显示加载提示
      wx.showLoading({
        title: '获取地址中...',
        mask: true
      });
      
      // 这里需要使用微信小程序的逆地理编码功能
      // 注意：需要在小程序管理后台配置位置接口权限
      // 由于需要后端支持，这里简化处理，直接使用经纬度
      
      setTimeout(() => {
        wx.hideLoading();
        this.shareLocation(latitude, longitude, '');
      }, 1000);
      
    },
  
    // 分享位置信息
    shareLocation(latitude, longitude, address) {
      // 1. 复制位置文本到剪贴板（作为备选）
      const locationMessage = `【紧急求助】我当前的位置：${address || '未知地址'} (经度:${longitude}, 纬度:${latitude})，请尽快联系我！`;
      wx.setClipboardData({
        data: locationMessage,
        success: () => {
          wx.hideToast(); // 隐藏复制成功的提示
        }
      });

      // 2. 跳转到自定义的位置分享页面
      wx.navigateTo({
        url: `/pages/location_share/location_share?latitude=${latitude}&longitude=${longitude}&address=${encodeURIComponent(address || '紧急求助位置')}`
      });
    },
  
    // 尝试打开微信
    openWechat() {
      // 注意：打开其他应用需要用户手动操作，这里只是提示
      wx.showModal({
        title: '打开微信',
        content: '请手动打开微信，然后将位置信息粘贴发送给紧急联系人',
        showCancel: false,
        confirmText: '知道了'
      });
    },
  
    // 生成位置消息
    generateLocationMessage(latitude, longitude, address) {
      let message = `【紧急位置分享】\n`;
      message += `我正在紧急求助！\n`;
      
      if (address) {
        message += `我的位置：${address}\n`;
      }
      
      message += `经纬度：${latitude}, ${longitude}\n`;
      
      // 生成地图链接
      const mapUrl = `https://map.baidu.com/?latlng=${latitude},${longitude}&title=我的位置`;
      message += `地图链接：${mapUrl}`;
      
      // 如果有设置紧急联系人，可以添加称呼
      if (this.data.emergencyContact.name) {
        message = `致${this.data.emergencyContact.name}：\n` + message;
      }
      
      return message;
    },
  
    // 清除联系人数据（用于调试）
    clearContactData() {
      wx.showModal({
        title: '清除数据',
        content: '确定要清除所有联系人数据吗？',
        confirmColor: '#ff6b6b',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('emergencyContact');
            this.setData({
              emergencyContact: {
                name: '',
                phone: '',
                avatar: ''
              }
            });
            wx.showToast({
              title: '数据已清除',
              icon: 'success'
            });
          }
        }
      });
    },
  
    // 页面卸载时清理
    onUnload() {
      // 可以在这里保存数据或清理资源
    },
  
    // 分享功能
    onShareAppMessage() {
      return {
        title: '紧急呼叫 - 老友助手',
        path: '/pages/emergency/emergency',
        imageUrl: '/images/share-cover.png'
      };
    }
  });
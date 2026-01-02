const app = getApp();
const voiceUtil = require('../../utils/voice.js');
// 高德地图 Web 服务 Key（来自高德开放平台 Web服务应用）
const AMAP_KEY = '6ae20c2110d12ccb52809d461d71899f';

Page({
    data: {
      fontSizes: {},
      isRecording: false,      // 是否正在录音
      destinationInput: '',    // 手动输入的目的地
      currentLocation: '正在定位...', // 当前位置（地址名称）
      latitude: null,          // 当前纬度
      longitude: null,         // 当前经度
      // 快捷目的地预设
      quickDestinations: {
        home: '北京市朝阳区xx小区',
        hospital: '第一人民医院',
        supermarket: '华联超市'
      }
    },
    
    goToIndex(){
        // app.playText('返回首页'); // 语音功能已禁用
        wx.navigateBack({})
    },
    
    onLoad(options) {
      // 页面加载时请求录音权限
      this.requestRecordPermission();
      // 获取当前位置
      this.getCurrentLocation();
      
      // 接收从主页传来的目的地参数
      if (options.destination) {
        const destination = decodeURIComponent(options.destination);
        this.setData({
          destinationInput: destination
        });
        
        // 自动触发打车
        setTimeout(() => {
          wx.showModal({
            title: '确认打车',
            content: `目的地：${destination}\n\n将自动为您叫车`,
            confirmText: '确认',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                this.callTaxi(destination);
              }
            }
          });
        }, 800);
      }
    },
    
    onShow() {
      this.calcFontSizes(); // 调用字体计算方法
      // app.playText('语音打车'); // 语音功能已禁用
      
      // 每次显示页面时，重新加载常用地址
      const savedAddresses = wx.getStorageSync('commonAddresses');
      if (savedAddresses) {
        this.setData({
          quickDestinations: savedAddresses
        });
      }
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
                wx.showModal({
                  title: '需要录音权限',
                  content: '语音打车功能需要使用麦克风，请授权',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              }
            });
          }
        }
      });
    },

    /**
     * 使用高德地理编码 + 系统地图进行打车
     * 输入目的地后，将目的地转换为经纬度并用 wx.openLocation 打开地图
     */
    openAmapTaxi() {
      const destination = (this.data.destinationInput || '').trim();
      if (!destination) {
        wx.showToast({
          title: '请先输入目的地',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({ title: '正在查询位置...' });

      // 构建请求参数
      const requestData = {
        key: AMAP_KEY,
        keywords: destination,
        offset: 10, // 获取更多结果以便排序（虽然API支持sortrule，但多获取一些更保险）
        page: 1,
        citylimit: false,
      };

      // 如果有当前位置，加入位置参数以按距离排序
      if (this.data.longitude && this.data.latitude) {
        requestData.location = `${this.data.longitude},${this.data.latitude}`;
        requestData.sortrule = 'distance'; // 按距离排序
      }

      // 优先使用高德地点搜索（对楼栋/小区等POI更友好）
      wx.request({
        url: 'https://restapi.amap.com/v3/place/text',
        method: 'GET',
        data: requestData,
        success: (res) => {
          const data = res.data || {};
          if (data.status === '1' && data.pois && data.pois.length > 0) {
            // 由于使用了 sortrule=distance，第一个结果即为最近的
            const poi = data.pois[0];
            const loc = (poi.location || '').split(',');
            const lng = Number(loc[0]);
            const lat = Number(loc[1]);

            if (!isNaN(lat) && !isNaN(lng)) {
              wx.openLocation({
                latitude: lat,
                longitude: lng,
                name: poi.name || destination,
                address: poi.address || poi.name || destination,
                scale: 17
              });
              wx.hideLoading();
              return;
            }
          }

          wx.showToast({
            title: '未找到该位置，请换个描述',
            icon: 'none'
          });
        },
        fail: () => {
          wx.showToast({
            title: '查询位置失败，请检查网络',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    },
    
    /**
     * 获取当前位置
     */
    getCurrentLocation() {
      this.setData({
        currentLocation: '正在定位...'
      });
      
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const latitude = res.latitude;
          const longitude = res.longitude;
          
          console.log('定位成功，经纬度:', latitude, longitude);
          // 先尝试调用高德地图逆地理编码，获取更精确的楼栋级地址
          this.setData({
            latitude,
            longitude,
            currentLocation: '正在获取详细地址...'
          });

          wx.request({
            url: 'https://restapi.amap.com/v3/geocode/regeo',
            method: 'GET',
            data: {
              key: AMAP_KEY,
              // 高德要求顺序为 经度,纬度
              location: `${longitude},${latitude}`,
              radius: 50,
              extensions: 'all'
            },
            success: (apiRes) => {
              const data = apiRes.data || {};
              if (data.status === '1' && data.regeocode) {
                const regeocode = data.regeocode;
                const poiName =
                  (regeocode.pois && regeocode.pois[0] && regeocode.pois[0].name) || '';
                const formatted = regeocode.formatted_address || '';
                const address = poiName || formatted || '定位成功，但未获取到详细地址';

                this.setData({
                  currentLocation: address,
                  latitude,
                  longitude
                });
              } else {
                console.warn('高德逆地理返回异常，将使用本地模拟地址:', data);
                this.useMockAddress(latitude, longitude);
              }
            },
            fail: (err) => {
              console.error('高德逆地理请求失败，将使用本地模拟地址:', err);
              this.useMockAddress(latitude, longitude);
            }
          });
        },
        fail: (err) => {
          console.error('定位失败:', err);
          // 定位失败也使用一个默认地址，而不是显示错误
          this.setData({
            currentLocation: '福建省福州市鼓楼区（模拟位置）',
            latitude: 26.0745,
            longitude: 119.2965
          });
        }
      });
    },
    
    /**
     * 使用模拟地址（根据实际经纬度智能生成）
     */
    useMockAddress(latitude, longitude) {
      console.log('=====================================');
      console.log('【开始生成模拟地址】');
      console.log('纬度(latitude):', latitude);
      console.log('经度(longitude):', longitude);
      console.log('-------------------------------------');
      
      let mockAddress = '';
      let matchInfo = '未匹配到任何区域';
      
      // 福建省漳州市（经度: 117.6-117.7, 纬度: 24.5-24.6）
      if (latitude >= 24.5 && latitude <= 24.6 && longitude >= 117.6 && longitude <= 117.7) {
        mockAddress = '福建省漳州市芗城区胜利路';
      }
      // 福建省漳州市漳浦县（经度: 117.6-117.8, 纬度: 24.1-24.3）
      else if (latitude >= 24.1 && latitude <= 24.3 && longitude >= 117.6 && longitude <= 117.8) {
        mockAddress = '福建省漳州市漳浦县绥安镇';
      }
      // 福建省漳州市云霄县（经度: 117.3-117.5, 纬度: 23.9-24.0）
      else if (latitude >= 23.9 && latitude <= 24.0 && longitude >= 117.3 && longitude <= 117.5) {
        mockAddress = '福建省漳州市云霄县云陵镇';
      }
      // 福建省漳州市诏安县（经度: 117.1-117.2, 纬度: 23.7-23.8）
      else if (latitude >= 23.7 && latitude <= 23.8 && longitude >= 117.1 && longitude <= 117.2) {
        mockAddress = '福建省漳州市诏安县南诏镇';
      }
      // 福建省漳州市平和县（经度: 117.3-117.4, 纬度: 24.3-24.4）
      else if (latitude >= 24.3 && latitude <= 24.4 && longitude >= 117.3 && longitude <= 117.4) {
        mockAddress = '福建省漳州市平和县小溪镇';
      }
      // 福建省漳州市南靖县（经度: 117.3-117.4, 纬度: 24.5-24.6）
      else if (latitude >= 24.5 && latitude <= 24.6 && longitude >= 117.3 && longitude <= 117.4) {
        mockAddress = '福建省漳州市南靖县山城镇';
      }
      // 福建省漳州市华安县（经度: 117.5-117.6, 纬度: 25.0-25.1）
      else if (latitude >= 25.0 && latitude <= 25.1 && longitude >= 117.5 && longitude <= 117.6) {
        mockAddress = '福建省漳州市华安县华丰镇';
      }
      // 福建省漳州市龙海区（经度: 117.8-117.9, 纬度: 24.4-24.5）
      else if (latitude >= 24.4 && latitude <= 24.5 && longitude >= 117.8 && longitude <= 117.9) {
        mockAddress = '福建省漳州市龙海区石码镇';
      }
      // 福建省漳州市长泰区（经度: 117.7-117.8, 纬度: 24.6-24.7）
      else if (latitude >= 24.6 && latitude <= 24.7 && longitude >= 117.7 && longitude <= 117.8) {
        mockAddress = '福建省漳州市长泰区武安镇';
      }
      // 福建省漳州市周边（经度: 117.0-118.0, 纬度: 23.5-25.5）
      else if (latitude >= 23.5 && latitude <= 25.5 && longitude >= 117.0 && longitude <= 118.0) {
        mockAddress = '福建省漳州市';
      }
      // 福建省龙岩市（经度: 116.8-117.5, 纬度: 25.0-25.5）
      else if (latitude >= 25.0 && latitude <= 25.5 && longitude >= 116.8 && longitude <= 117.5) {
        mockAddress = '福建省龙岩市新罗区';
      }
      // 福建省三明市（经度: 117.5-117.8, 纬度: 26.2-26.4）
      else if (latitude >= 26.2 && latitude <= 26.4 && longitude >= 117.5 && longitude <= 117.8) {
        mockAddress = '福建省三明市梅列区';
      }
      // 福建省南平市（经度: 118.1-118.3, 纬度: 26.6-26.8）
      else if (latitude >= 26.6 && latitude <= 26.8 && longitude >= 118.1 && longitude <= 118.3) {
        mockAddress = '福建省南平市延平区';
      }
      // 福建省宁德市（经度: 119.5-119.7, 纬度: 26.6-26.8）
      else if (latitude >= 26.6 && latitude <= 26.8 && longitude >= 119.5 && longitude <= 119.7) {
        mockAddress = '福建省宁德市蕉城区';
      }
      // 福建省福州市及周边县区（经度: 118.8-119.8, 纬度: 25.8-26.5）
      else if (latitude >= 25.8 && latitude <= 26.5 && longitude >= 118.8 && longitude <= 119.8) {
        console.log('√ 匹配到福州市区域范围');
        mockAddress = '福建省福州市';
        
        // 闽侯县（经度: 118.8-119.3, 纬度: 26.0-26.3）
        if (longitude >= 118.8 && longitude <= 119.3 && latitude >= 26.0 && latitude <= 26.3) {
          console.log('  → 判断为闽侯县范围');

          // 福州大学旗山校区（更精确到楼栋）
          if (latitude >= 26.05 && latitude <= 26.07 && longitude >= 119.18 && longitude <= 119.22) {
            mockAddress += '闽侯县福州大学旗山校区30号楼';
          }
          else if (longitude <= 119.15) {
            mockAddress += '闽侯县甘蔗街道';
          } else if (longitude <= 119.22) {
            mockAddress += '闽侯县上街镇（大学城）';
          } else {
            mockAddress += '闽侯县荆溪镇';
          }
        }
        // 闽清县（经度: 118.8-119.0, 纬度: 26.2-26.4）
        else if (longitude >= 118.8 && longitude <= 119.0 && latitude >= 26.2 && latitude <= 26.4) {
          mockAddress += '闽清县梅城镇';
        }
        // 永泰县（经度: 118.9-119.1, 纬度: 25.8-26.0）
        else if (longitude >= 118.9 && longitude <= 119.1 && latitude >= 25.8 && latitude <= 26.0) {
          mockAddress += '永泰县樟城镇';
        }
        // 罗源县（经度: 119.5-119.7, 纬度: 26.4-26.6）
        else if (longitude >= 119.5 && longitude <= 119.7 && latitude >= 26.4 && latitude <= 26.6) {
          mockAddress += '罗源县凤山镇';
        }
        // 鼓楼区（经度: 119.28-119.32, 纬度: 26.08-26.12）
        else if (latitude >= 26.08 && latitude <= 26.12 && longitude >= 119.28 && longitude <= 119.32) {
          mockAddress += '鼓楼区五四路万达广场';
        }
        // 台江区（经度: 119.28-119.32, 纬度: 26.04-26.08）
        else if (latitude >= 26.04 && latitude < 26.08 && longitude >= 119.28 && longitude <= 119.32) {
          mockAddress += '台江区宝龙广场';
        }
        // 仓山区（经度: 119.25-119.35, 纬度: 25.95-26.05）
        else if (latitude >= 25.95 && latitude < 26.05 && longitude >= 119.25 && longitude <= 119.35) {
          mockAddress += '仓山区金山万达广场';
        }
        // 晋安区（经度: 119.32-119.4, 纬度: 26.08-26.15）
        else if (latitude >= 26.08 && latitude <= 26.15 && longitude >= 119.32 && longitude <= 119.4) {
          mockAddress += '晋安区东二环泰禾广场';
        }
        // 马尾区（经度: 119.4-119.5, 纬度: 25.98-26.08）
        else if (latitude >= 25.98 && latitude <= 26.08 && longitude >= 119.4 && longitude <= 119.5) {
          mockAddress += '马尾区君竹路';
        }
        // 福州市区通用
        else if (longitude >= 119.25 && longitude <= 119.4 && latitude >= 26.0 && latitude <= 26.15) {
          mockAddress += '市中心三坊七巷';
        }
        // 其他福州区域
        else {
          mockAddress += '郊区';
        }
      }
      // 福建省厦门市（经度: 118.0-118.3, 纬度: 24.4-24.6）
      else if (latitude >= 24.4 && latitude <= 24.6 && longitude >= 118.0 && longitude <= 118.3) {
        mockAddress = '福建省厦门市';
        if (latitude >= 24.48 && longitude <= 118.1) {
          mockAddress += '思明区中山路';
        } else if (latitude >= 24.5 && longitude > 118.1) {
          mockAddress += '湖里区万达广场';
        } else if (latitude < 24.48 && longitude <= 118.1) {
          mockAddress += '思明区厦门大学';
        } else {
          mockAddress += '海沧区';
        }
      }
      // 福建省泉州市（经度: 118.5-118.7, 纬度: 24.8-25.2）
      else if (latitude >= 24.8 && latitude <= 25.2 && longitude >= 118.5 && longitude <= 118.7) {
        if (latitude >= 25.0) {
          mockAddress = '福建省泉州市丰泽区东海大街';
        } else if (latitude >= 24.9) {
          mockAddress = '福建省泉州市鲤城区中山路';
        } else {
          mockAddress = '福建省泉州市晋江市';
        }
      }
      // 福建省莆田市（经度: 118.9-119.2, 纬度: 25.3-25.6）
      else if (latitude >= 25.3 && latitude <= 25.6 && longitude >= 118.9 && longitude <= 119.2) {
        if (longitude >= 119.0) {
          mockAddress = '福建省莆田市城厢区';
        } else {
          mockAddress = '福建省莆田市涵江区';
        }
      }
      // 福建省福清市（经度: 119.3-119.5, 纬度: 25.6-25.8）
      else if (latitude >= 25.6 && latitude <= 25.8 && longitude >= 119.3 && longitude <= 119.5) {
        mockAddress = '福建省福州市福清市';
      }
      // 福建省长乐区（经度: 119.5-119.7, 纬度: 25.9-26.0）
      else if (latitude >= 25.9 && latitude <= 26.0 && longitude >= 119.5 && longitude <= 119.7) {
        mockAddress = '福建省福州市长乐区';
      }
      // 福建省连江县（经度: 119.5-119.7, 纬度: 26.1-26.3）
      else if (latitude >= 26.1 && latitude <= 26.3 && longitude >= 119.5 && longitude <= 119.7) {
        mockAddress = '福建省福州市连江县';
      }
      // 浙江省温州市（经度: 120.6-120.7, 纬度: 27.9-28.1）
      else if (latitude >= 27.9 && latitude <= 28.1 && longitude >= 120.6 && longitude <= 120.7) {
        mockAddress = '浙江省温州市鹿城区';
      }
      // 浙江省杭州市（经度: 120.1-120.3, 纬度: 30.2-30.4）
      else if (latitude >= 30.2 && latitude <= 30.4 && longitude >= 120.1 && longitude <= 120.3) {
        mockAddress = '浙江省杭州市西湖区';
      }
      // 江西省南昌市（经度: 115.8-116.0, 纬度: 28.6-28.7）
      else if (latitude >= 28.6 && latitude <= 28.7 && longitude >= 115.8 && longitude <= 116.0) {
        mockAddress = '江西省南昌市东湖区';
      }
      // 广东省广州市（经度: 113.2-113.4, 纬度: 23.1-23.2）
      else if (latitude >= 23.1 && latitude <= 23.2 && longitude >= 113.2 && longitude <= 113.4) {
        mockAddress = '广东省广州市天河区';
      }
      // 广东省深圳市（经度: 114.0-114.1, 纬度: 22.5-22.6）
      else if (latitude >= 22.5 && latitude <= 22.6 && longitude >= 114.0 && longitude <= 114.1) {
        mockAddress = '广东省深圳市福田区';
      }
      // 北京市（经度: 116.3-116.5, 纬度: 39.8-40.0）
      else if (latitude >= 39.8 && latitude <= 40.0 && longitude >= 116.3 && longitude <= 116.5) {
        mockAddress = '北京市朝阳区';
      }
      // 上海市（经度: 121.4-121.5, 纬度: 31.2-31.3）
      else if (latitude >= 31.2 && latitude <= 31.3 && longitude >= 121.4 && longitude <= 121.5) {
        mockAddress = '上海市浦东新区';
      }
      // 其他地区，使用经纬度构建通用地址
      else {
        // 根据纬度判断大致方位
        let province = '当前位置';
        if (latitude >= 35) {
          province = '华北地区';
        } else if (latitude >= 30) {
          province = '华东地区';
        } else if (latitude >= 25) {
          province = '华南地区';
        } else if (latitude >= 20) {
          province = '南方沿海';
        }
        mockAddress = province + '附近';
      }
      
      if (!mockAddress) {
        mockAddress = `当前位置 (纬度:${latitude.toFixed(4)}, 经度:${longitude.toFixed(4)})`;
        matchInfo = '未匹配到精确地址，显示经纬度';
      } else {
        matchInfo = '成功匹配地址';
      }
      
      console.log('-------------------------------------');
      console.log('匹配结果:', matchInfo);
      console.log('生成的地址:', mockAddress);
      console.log('=====================================');
      
      this.setData({
        currentLocation: mockAddress,
        latitude: latitude,
        longitude: longitude
      });
      
      console.log('✓ 地址已更新到页面');
    },
    
    /**
     * 语音识别 - 长按开始
     */
    onVoiceStart() {
      console.log('开始语音识别');
      this.setData({ isRecording: true });
      
      wx.showToast({
        title: '正在录音...',
        icon: 'none',
        duration: 60000
      });
      
      voiceUtil.startRecord();
    },
    
    /**
     * 语音识别 - 松开结束
     */
    onVoiceEnd() {
      console.log('停止录音，开始识别');
      this.setData({ isRecording: false });
      
      wx.hideToast();
      voiceUtil.stopRecord();

      // 等待录音文件生成后，调用后端进行语音识别
      setTimeout(() => {
        voiceUtil.recognizeAudio(
          (text) => {
            if (text && text.trim() !== '') {
              console.log('识别到原始文本：', text);
              this.handleVoiceDestination(text);
            } else {
              wx.showModal({
                title: '识别失败',
                content: '没有识别到内容，请重新尝试',
                showCancel: false
              });
            }
          },
          (err) => {
            console.error('语音识别失败:', err);
            wx.showToast({
              title: '语音识别失败，请稍后重试',
              icon: 'none'
            });
          }
        );
      }, 300);
    },
    
    /**
     * 处理语音识别的目的地
     */
    handleVoiceDestination(destination) {
      // 提取关键词（去除"我要去"、"到"等词）
      let cleanDest = destination
        .replace(/我要去|我想去|去|到/g, '')
        .trim();

      if (!cleanDest) {
        wx.showModal({
          title: '识别失败',
          content: '没有识别到有效的目的地，请重新尝试',
          showCancel: false
        });
        return;
      }

      // 将结果先填入输入框，方便用户查看/修改
      this.setData({
        destinationInput: cleanDest
      });

      wx.showModal({
        title: '识别成功',
        content: `已识别到目的地：${cleanDest}\n\n如有需要可以修改后点击下方“打车”按钮。`,
        showCancel: false
      });
    },
    
    /**
     * 输入框内容变化
     */
    onInputChange(e) {
      this.setData({
        destinationInput: e.detail.value
      });
    },
    
    /**
     * 输入框确认（回车）
     */
    onInputConfirm(e) {
      const destination = e.detail.value.trim();
      if (destination) {
        this.callTaxi(destination);
      } else {
        wx.showToast({
          title: '请输入目的地',
          icon: 'none'
        });
      }
    },
    
    /**
     * 快捷目的地点击
     */
    onQuickDestination(e) {
      const type = e.currentTarget.dataset.type;
      const destination = this.data.quickDestinations[type];
      
      if (destination) {
        // 自动填充到输入框
        this.setData({
          destinationInput: destination
        });

        wx.showToast({
          title: '目的地已填入',
          icon: 'success',
          duration: 1000
        });
      } else {
        wx.showToast({
          title: '请先在个人中心设置常用地址',
          icon: 'none'
        });
      }
    },
    
    /**
     * 调用打车服务
     * 优先级：滴滴小程序 > 高德打车 > 微信内置地图 > 手动引导
     */
    callTaxi(destination) {
      console.log('准备打车到:', destination);
      
      // 复制目的地到剪贴板（方便用户粘贴）
      wx.setClipboardData({
        data: destination,
        success: () => {
          console.log('目的地已复制到剪贴板');
        }
      });
      
      // 优先尝试滴滴小程序
      this.tryDidi(destination);
    },
    
    /**
     * 尝试跳转滴滴小程序 - 增强版支持目的地自动填充
     */
    tryDidi(destination) {
      // 先复制目的地到剪贴板（备用方案）
      wx.setClipboardData({
        data: destination,
        success: () => {
          console.log('目的地已复制到剪贴板');
        }
      });
      
      // 尝试跳转滴滴（传递多种可能的参数字段）
      wx.navigateToMiniProgram({
        appId: 'wxaf35009675aa0b2a', // 滴滴出行小程序AppID
        path: 'pages/index/index',
        extraData: {
          end_address: destination,
          end_name: destination,
          endAddress: destination,
          endName: destination,
          destination: destination,
          to: destination
        },
        envVersion: 'release',
        success: () => {
          console.log('成功跳转到滴滴小程序');
          wx.showModal({
            title: '温馨提示',
            content: `目的地"${destination}"已复制到剪贴板\n\n如果滴滴未自动填写，请在目的地输入框长按粘贴即可`,
            showCancel: false,
            confirmText: '知道了'
          });
        },
        fail: (err) => {
          console.error('跳转滴滴失败:', err);
          // 尝试高德打车小程序
          this.tryGaodeTaxi(destination);
        }
      });
    },
    
    /**
     * 尝试跳转高德打车小程序
     */
    tryGaodeTaxi(destination) {
      wx.navigateToMiniProgram({
        appId: 'wxd86ff8fa0e018134', // 高德打车小程序AppID
        path: 'pages/index/index',
        extraData: {
          destination: destination
        },
        envVersion: 'release',
        success: () => {
          console.log('成功跳转到高德打车');
        },
        fail: (err) => {
          console.error('跳转高德打车失败:', err);
          // 尝试打开微信内置地图
          this.tryWechatMap(destination);
        }
      });
    },
    
    /**
     * 尝试调用微信内置地图
     */
    tryWechatMap(destination) {
      wx.openLocation({
        name: destination,
        address: destination,
        scale: 15,
        success: () => {
          console.log('成功打开微信地图');
          wx.showToast({
            title: '目的地已复制，可在打车应用中粘贴',
            icon: 'none',
            duration: 3000
          });
        },
        fail: (err) => {
          console.error('打开地图失败:', err);
          // 最后的备选方案
          this.showManualGuide(destination);
        }
      });
    },
    
    /**
     * 显示手动指引
     */
    showManualGuide(destination) {
      wx.showModal({
        title: '打车提示',
        content: `目的地"${destination}"已复制到剪贴板\n\n请手动打开滴滴、高德等打车应用，在目的地输入框中长按粘贴`,
        confirmText: '我知道了',
        showCancel: false
      });
    }
  })
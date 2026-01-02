const app = getApp();
// 高德地图 Web 服务 Key（来自高德开放平台 Web服务应用）
const AMAP_KEY = '6ae20c2110d12ccb52809d461d71899f';
Page({
    data: {
      fontSizes: {},
      currentLocation: '正在定位...',
      latitude: null,
      longitude: null,
      isRecording: false // 是否正在录像
      // 页面其他业务数据(示例:可替换成你的数据)
    },
    onLoad() {
      this.getCurrentLocation();
    },
    onShow() {
      this.calcFontSizes(); // 调用字体计算方法
      // app.playText('安全警报');
    },

    // 页面初次渲染完成
    onReady() {
      // 摄像头仅在用户点击后开始录像
    },

    onHide() {
      this.stopSafetyRecording();
    },

    onUnload() {
      this.stopSafetyRecording();
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

    callPolice() {
      // app.playText('正在呼叫110');
      wx.makePhoneCall({
        phoneNumber: '110'
      });
    },

    // 用户手动点击开启/停止安全录像
    onToggleRecord() {
      if (this.data.isRecording) {
        this.stopSafetyRecording();
        return;
      }

      // 依次申请相机和相册写入权限
      wx.authorize({
        scope: 'scope.camera',
        success: () => {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.startSafetyRecording();
            },
            fail: (err) => {
              console.error('相册写入权限拒绝:', err);
              wx.showToast({
                title: '请开启相册权限',
                icon: 'none'
              });
            }
          });
        },
        fail: (err) => {
          console.error('相机权限拒绝:', err);
          wx.showToast({
            title: '请开启相机权限',
            icon: 'none'
          });
        }
      });
    },

    onWrongTrigger() {
      this.stopSafetyRecording();
      // app.playText('误触报警，已取消');
      wx.showToast({
        title: '已取消报警',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    },

    onResolved() {
      this.stopSafetyRecording();
      // app.playText('情况已解决，注意安全');
      wx.showToast({
        title: '已解除警报',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    },

    // 获取当前位置：优先真机实时定位，失败时回退到模拟坐标
    getCurrentLocation() {
      console.log('开始获取实时位置信息...');
      this.setData({
        currentLocation: '正在定位...'
      });

      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: (res) => {
          const latitude = res.latitude;
          const longitude = res.longitude;
          console.log('实时定位成功，经纬度:', latitude, longitude);

          this.setData({
            latitude,
            longitude,
            currentLocation: '正在获取详细地址...'
          });

          // 调用高德地图逆地理编码，获取更精确的地址
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
                console.warn('高德逆地理返回异常，使用模拟地址:', data);
                this.useMockAddress(latitude, longitude);
              }
            },
            fail: (err) => {
              console.error('高德逆地理请求失败，使用模拟地址:', err);
              this.useMockAddress(latitude, longitude);
            }
          });
        },
        fail: (err) => {
          console.error('实时定位失败，改用模拟坐标:', err);

          // 回退到之前的固定经纬度，保证界面有地址
          const latitude = 26.10821;
          const longitude = 119.13191;
          this.setData({
            latitude,
            longitude,
            currentLocation: '定位失败，已使用附近位置'
          });

          this.useMockAddress(latitude, longitude);
        }
      });
    },

    // 使用模拟地址（基于经纬度范围）
    useMockAddress(lat, lng) {
      console.log('开始使用模拟地址，经纬度:', lat, lng);
      let address = '';

      // 福建省漳州市各区县范围
      if (lat >= 24.3 && lat <= 24.7 && lng >= 117.5 && lng <= 118.0) {
        address = '福建省漳州市芗城区胜利西路';
      } else if (lat >= 24.4 && lat <= 24.6 && lng >= 117.8 && lng <= 118.2) {
        address = '福建省漳州市龙文区水仙大街';
      } else if (lat >= 23.8 && lat <= 24.4 && lng >= 117.2 && lng <= 117.8) {
        address = '福建省漳州市龙海区港尾镇';
      } else if (lat >= 24.5 && lat <= 25.2 && lng >= 117.0 && lng <= 117.6) {
        address = '福建省漳州市长泰区武安镇';
      } else if (lat >= 23.5 && lat <= 24.2 && lng >= 117.3 && lng <= 117.9) {
        address = '福建省漳州市漳浦县绥安镇';
      } else if (lat >= 23.2 && lat <= 23.8 && lng >= 117.1 && lng <= 117.7) {
        address = '福建省漳州市云霄县云陵镇';
      } else if (lat >= 24.0 && lat <= 24.6 && lng >= 116.8 && lng <= 117.4) {
        address = '福建省漳州市平和县小溪镇';
      } else if (lat >= 24.3 && lat <= 24.9 && lng >= 116.6 && lng <= 117.2) {
        address = '福建省漳州市南靖县山城镇';
      } else if (lat >= 23.6 && lat <= 24.2 && lng >= 117.0 && lng <= 117.6) {
        address = '福建省漳州市诏安县南诏镇';
      }
      // 福建省龙岩市
      else if (lat >= 25.0 && lat <= 25.2 && lng >= 116.8 && lng <= 117.1) {
        address = '福建省龙岩市新罗区';
      } else if (lat >= 24.7 && lat <= 25.0 && lng >= 116.5 && lng <= 116.8) {
        address = '福建省龙岩市永定区';
      }
      // 福建省三明市
      else if (lat >= 26.2 && lat <= 26.4 && lng >= 117.5 && lng <= 117.8) {
        address = '福建省三明市三元区';
      } else if (lat >= 26.1 && lat <= 26.3 && lng >= 117.4 && lng <= 117.6) {
        address = '福建省三明市梅列区';
      }
      // 福建省南平市
      else if (lat >= 26.6 && lat <= 26.8 && lng >= 118.1 && lng <= 118.3) {
        address = '福建省南平市延平区';
      }
      // 福建省宁德市
      else if (lat >= 26.6 && lat <= 26.8 && lng >= 119.4 && lng <= 119.7) {
        address = '福建省宁德市蕉城区';
      }
      // 福建省福州市鼓楼区（市中心）
      else if (lat >= 26.08 && lat <= 26.12 && lng >= 119.28 && lng <= 119.32) {
        address = '福建省福州市鼓楼区五一广场';
      } 
      // 福建省福州市台江区
      else if (lat >= 26.04 && lat <= 26.08 && lng >= 119.30 && lng <= 119.34) {
        address = '福建省福州市台江区';
      }
      // 福建省福州市仓山区
      else if (lat >= 26.02 && lat <= 26.06 && lng >= 119.27 && lng <= 119.32) {
        address = '福建省福州市仓山区';
      }
      // 福建省福州市晋安区
      else if (lat >= 26.06 && lat <= 26.12 && lng >= 119.32 && lng <= 119.38) {
        address = '福建省福州市晋安区';
      }
      // 福建省福州市马尾区
      else if (lat >= 25.98 && lat <= 26.04 && lng >= 119.42 && lng <= 119.48) {
        address = '福建省福州市马尾区';
      }
      // 福建省福州市长乐区
      else if (lat >= 25.92 && lat <= 25.98 && lng >= 119.48 && lng <= 119.58) {
        address = '福建省福州市长乐区';
      }
      // 福州大学旗山校区（更精确到楼栋）
      else if (lat >= 26.05 && lat <= 26.07 && lng >= 119.18 && lng <= 119.22) {
        address = '福建省福州市闽侯县福州大学旗山校区30号楼';
      }
      // 福建省福州市闽侯县（具体到街道）
      else if (lat >= 26.10 && lat <= 26.14 && lng >= 119.10 && lng <= 119.16) {
        address = '福建省福州市闽侯县甘蔗街道';
      } else if (lat >= 26.12 && lat <= 26.18 && lng >= 119.05 && lng <= 119.12) {
        address = '福建省福州市闽侯县上街镇';
      } else if (lat >= 26.08 && lat <= 26.14 && lng >= 119.00 && lng <= 119.08) {
        address = '福建省福州市闽侯县南通镇';
      } else if (lat >= 26.04 && lat <= 26.10 && lng >= 119.08 && lng <= 119.15) {
        address = '福建省福州市闽侯县祥谦镇';
      } else if (lat >= 26.00 && lat <= 26.20 && lng >= 118.80 && lng <= 119.40) {
        address = '福建省福州市闽侯县';
      }
      // 福建省福州市连江县
      else if (lat >= 26.15 && lat <= 26.30 && lng >= 119.50 && lng <= 119.70) {
        address = '福建省福州市连江县';
      }
      // 福建省福州市罗源县
      else if (lat >= 26.45 && lat <= 26.60 && lng >= 119.50 && lng <= 119.65) {
        address = '福建省福州市罗源县';
      }
      // 福建省福州市闽清县
      else if (lat >= 26.15 && lat <= 26.35 && lng >= 118.80 && lng <= 119.00) {
        address = '福建省福州市闽清县';
      }
      // 福建省福州市（其他区域）
      else if (lat >= 25.85 && lat <= 26.40 && lng >= 118.70 && lng <= 119.70) {
        address = '福建省福州市';
      }
      // 福建省厦门市思明区
      else if (lat >= 24.43 && lat <= 24.48 && lng >= 118.07 && lng <= 118.12) {
        address = '福建省厦门市思明区';
      }
      // 福建省厦门市湖里区
      else if (lat >= 24.50 && lat <= 24.55 && lng >= 118.08 && lng <= 118.13) {
        address = '福建省厦门市湖里区';
      }
      // 福建省厦门市集美区
      else if (lat >= 24.55 && lat <= 24.62 && lng >= 118.08 && lng <= 118.15) {
        address = '福建省厦门市集美区';
      }
      // 福建省厦门市海沧区
      else if (lat >= 24.47 && lat <= 24.53 && lng >= 118.00 && lng <= 118.08) {
        address = '福建省厦门市海沧区';
      }
      // 福建省厦门市（其他区域）
      else if (lat >= 24.30 && lat <= 24.70 && lng >= 117.90 && lng <= 118.30) {
        address = '福建省厦门市';
      }
      // 福建省泉州市鲤城区
      else if (lat >= 24.88 && lat <= 24.93 && lng >= 118.57 && lng <= 118.62) {
        address = '福建省泉州市鲤城区';
      }
      // 福建省泉州市丰泽区
      else if (lat >= 24.88 && lat <= 24.93 && lng >= 118.58 && lng <= 118.65) {
        address = '福建省泉州市丰泽区';
      }
      // 福建省泉州市洛江区
      else if (lat >= 24.93 && lat <= 24.98 && lng >= 118.63 && lng <= 118.70) {
        address = '福建省泉州市洛江区';
      }
      // 福建省泉州市（其他区域）
      else if (lat >= 24.50 && lat <= 25.30 && lng >= 118.30 && lng <= 119.00) {
        address = '福建省泉州市';
      }
      // 福建省莆田市城厢区
      else if (lat >= 25.42 && lat <= 25.46 && lng >= 119.00 && lng <= 119.04) {
        address = '福建省莆田市城厢区';
      }
      // 福建省莆田市涵江区
      else if (lat >= 25.44 && lat <= 25.48 && lng >= 119.10 && lng <= 119.15) {
        address = '福建省莆田市涵江区';
      }
      // 福建省莆田市（其他区域）
      else if (lat >= 25.20 && lat <= 25.60 && lng >= 118.80 && lng <= 119.20) {
        address = '福建省莆田市';
      }
      // 福建省其他地区
      else if (lat >= 23.5 && lat <= 28.3 && lng >= 115.8 && lng <= 120.5) {
        address = '福建省';
      }
      // 浙江省杭州市
      else if (lat >= 30.14 && lat <= 30.40 && lng >= 120.00 && lng <= 120.30) {
        address = '浙江省杭州市';
      }
      // 浙江省温州市
      else if (lat >= 27.90 && lat <= 28.10 && lng >= 120.60 && lng <= 120.80) {
        address = '浙江省温州市';
      }
      // 浙江省
      else if (lat >= 27.0 && lat <= 31.0 && lng >= 118.0 && lng <= 123.0) {
        address = '浙江省';
      }
      // 江西省南昌市
      else if (lat >= 28.60 && lat <= 28.75 && lng >= 115.80 && lng <= 116.00) {
        address = '江西省南昌市';
      }
      // 江西省
      else if (lat >= 24.5 && lat <= 30.0 && lng >= 113.5 && lng <= 118.5) {
        address = '江西省';
      }
      // 广东省广州市
      else if (lat >= 23.05 && lat <= 23.25 && lng >= 113.15 && lng <= 113.45) {
        address = '广东省广州市';
      }
      // 广东省深圳市
      else if (lat >= 22.45 && lat <= 22.70 && lng >= 113.80 && lng <= 114.30) {
        address = '广东省深圳市';
      }
      // 广东省
      else if (lat >= 20.0 && lat <= 25.5 && lng >= 109.5 && lng <= 117.5) {
        address = '广东省';
      }
      // 北京市
      else if (lat >= 39.80 && lat <= 40.10 && lng >= 116.30 && lng <= 116.50) {
        address = '北京市';
      }
      // 上海市
      else if (lat >= 31.10 && lat <= 31.35 && lng >= 121.35 && lng <= 121.60) {
        address = '上海市';
      }
      // 其他地区 - 按纬度大致判断
      else if (lat >= 35.0) {
        address = '中国北方地区';
      } else if (lat >= 30.0) {
        address = '中国中部地区';
      } else if (lat >= 20.0) {
        address = '中国南方地区';
      } else {
        address = '未知位置';
      }

      console.log('模拟地址生成结果:', address);
      this.setData({
        currentLocation: address
      });
    },

    // 开始安全录像并在结束后保存到相册
    startSafetyRecording() {
      if (this.data.isRecording) {
        return;
      }

      console.log('尝试开始安全录像');
      const cameraContext = wx.createCameraContext();
      this.cameraContext = cameraContext;

      cameraContext.startRecord({
        success: () => {
          console.log('安全录像已开始');
          this.setData({ isRecording: true });

          // 默认录制 30 秒后自动停止并保存
          this._recordTimer = setTimeout(() => {
            this.stopSafetyRecording();
          }, 30000);
        },
        fail: (err) => {
          console.error('开始安全录像失败:', err);
          this.setData({ isRecording: false });
        }
      });
    },

    // 停止录像并保存到系统相册
    stopSafetyRecording() {
      if (!this.data.isRecording || !this.cameraContext) {
        return;
      }

      console.log('准备停止安全录像并保存');
      if (this._recordTimer) {
        clearTimeout(this._recordTimer);
        this._recordTimer = null;
      }

      this.cameraContext.stopRecord({
        success: (res) => {
          console.log('安全录像停止成功:', res);
          const filePath = res.tempVideoPath;
          if (!filePath) {
            console.warn('未获取到录像文件路径');
            return;
          }

          wx.saveVideoToPhotosAlbum({
            filePath,
            success: () => {
              console.log('安全录像已保存到相册');
              wx.showToast({
                title: '录像已保存',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('保存录像到相册失败:', err);
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          });
        },
        fail: (err) => {
          console.error('停止安全录像失败:', err);
        },
        complete: () => {
          this.setData({ isRecording: false });
          this.cameraContext = null;
        }
      });
    }
  })
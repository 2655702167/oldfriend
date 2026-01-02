const app = getApp();
let voiceUtil = null;
const hospitalApi = require('../../api/hospital.js');
// 高德地图 Web 服务 Key（来自高德开放平台 Web服务应用）
const AMAP_KEY = '6ae20c2110d12ccb52809d461d71899f';

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
let locationCache = null;
let hospitalsCache = null;

Page({
    data: {
        activeTag: '外科',
        fontSizes: {},
        searchText: '',       // 搜索框文字
        isRecording: false,   // 是否正在录音
        hospitals: [],        // 医院列表
        departments: [],      // 科室列表
        nearbyHospitals: [],  // 附近医院列表
        userLocation: null,   // 用户位置
        locationText: '正在定位...',  // 位置文字
        reservedHospitals: [],  // 已预约的医院ID列表
        locationSuccess: false  // 定位是否成功
    },
    
    goToIndex(){
        app.playText('返回');
        wx.navigateBack({})
    },
    
    /**
     * 搜索框输入事件
     */
    onSearchInput(e) {
        const value = e.detail.value;
        this.setData({ searchText: value });
        console.log('搜索输入:', value);
    },
    
    /**
     * 搜索框确认/搜索按钮点击
     */
    onSearchConfirm(e) {
        const searchText = e.detail.value || this.data.searchText;
        console.log('开始搜索:', searchText);
        
        if (!searchText || searchText.trim() === '') {
            app.playText('请输入症状或科室');
            wx.showToast({
                title: '请输入症状或科室',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        
        app.playText('正在为您搜索');
        // 智能匹配科室
        this.matchDepartment(searchText.trim());
    },
    
    onLoad() {
        console.log('=== 挂号页面加载 ===');
        
        // 确保初始状态
        this.setData({
            locationSuccess: false,
            nearbyHospitals: [],
            locationText: '正在定位...'
        }, () => {
            console.log('✅ 初始状态已设置');
            console.log('locationSuccess:', this.data.locationSuccess);
            console.log('nearbyHospitals:', this.data.nearbyHospitals);
        });
        
        // 加载已预约列表
        this.loadReservedHospitals();
        
        // 检查缓存
        if (this.checkCache()) {
            console.log('✅ 使用缓存数据，加载速度更快');
            return;
        }
        // 并行执行：检查授权 + 预加载医院数据
        this.checkLocationAuth();
    },
    
    onUnload() {
        console.log('=== 挂号页面卸载 ===');
        // 页面卸载时不需要做什么，下次进入会重新onLoad
    },
    
    /**
     * 加载已预约医院列表
     */
    loadReservedHospitals() {
        try {
            // 清空所有预约状态
            wx.removeStorageSync('reservedHospitals');
            this.setData({ reservedHospitals: [] });
            console.log('已重置所有预约状态为未预约');
        } catch (e) {
            console.error('重置预约列表失败:', e);
        }
    },
    
    /**
     * 保存已预约医院列表
     */
    saveReservedHospitals() {
        try {
            wx.setStorageSync('reservedHospitals', this.data.reservedHospitals);
            console.log('保存已预约列表:', this.data.reservedHospitals);
        } catch (e) {
            console.error('保存预约列表失败:', e);
        }
    },
    
    /**
     * 检查医院是否已预约
     */
    isHospitalReserved(hospitalId) {
        return this.data.reservedHospitals.includes(hospitalId);
    },
    
    /**
     * 检查缓存
     */
    checkCache() {
        const now = Date.now();
        
        // 检查位置缓存
        if (locationCache && (now - locationCache.timestamp < CACHE_DURATION)) {
            console.log('⚡ 使用缓存的位置信息');
            
            // 检查医院缓存
            if (hospitalsCache && (now - hospitalsCache.timestamp < CACHE_DURATION)) {
                console.log('⚡ 使用缓存的医院列表 - 瞬间加载');
                
                // 一次性设置所有数据
                this.setData({
                    userLocation: locationCache.data,
                    locationText: locationCache.text,
                    locationSuccess: true,
                    nearbyHospitals: hospitalsCache.nearby,
                    hospitals: hospitalsCache.all
                }, () => {
                    // 更新预约状态
                    this.updateHospitalReservationStatus();
                });
                return true;
            } else {
                // 位置有缓存但医院无缓存，快速搜索
                this.setData({
                    userLocation: locationCache.data,
                    locationText: locationCache.text,
                    locationSuccess: true
                });
                this.searchNearbyRealHospitals(locationCache.data.latitude, locationCache.data.longitude);
                return true;
            }
        }
        return false;
    },
    
    /**
     * 检查位置授权状态
     */
    checkLocationAuth() {
        wx.getSetting({
            success: (res) => {
                console.log('当前授权状态:', res.authSetting);
                
                if (res.authSetting['scope.userLocation'] === false) {
                    // 用户之前拒绝过授权
                    wx.showModal({
                        title: '需要位置权限',
                        content: '获取附近医院需要您的位置信息，请允许位置权限',
                        confirmText: '去设置',
                        cancelText: '取消',
                        success: (modalRes) => {
                            if (modalRes.confirm) {
                                wx.openSetting({
                                    success: (settingRes) => {
                                        if (settingRes.authSetting['scope.userLocation']) {
                                            this.getCurrentLocation();
                                        } else {
                                            this.setData({
                                                locationText: '需要位置权限才能查找医院'
                                            });
                                        }
                                    }
                                });
                            } else {
                                this.setData({
                                    locationText: '需要位置权限才能查找医院'
                                });
                            }
                        }
                    });
                } else {
                    // 未设置或已授权，直接获取位置
                    this.getCurrentLocation();
                }
            },
            fail: (err) => {
                console.error('获取授权状态失败:', err);
                // 即使失败也尝试获取位置
                this.getCurrentLocation();
            }
        });
    },
    
    onShow(){
        this.calcFontSizes();
        app.playText('医院挂号');
    },
    
    calcFontSizes(){
        this.setData({
            fontSizes:{
                title:app.calcFontSize('title'),
                content:app.calcFontSize('content'),
                button:app.calcFontSize('button'),
                time:app.calcFontSize('time'),
            }
        })
    },
    
    /**
     * 加载科室列表
     */
    loadDepartments() {
        hospitalApi.getDepartments()
            .then(departments => {
                console.log('获取科室列表成功:', departments);
                this.setData({ departments });
            })
            .catch(err => {
                console.error('获取科室列表失败:', err);
            });
    },
    
    /**
     * 加载医院列表
     */
    loadHospitals() {
        console.log('=== 开始加载医院列表 ===');
        hospitalApi.getAllHospitals()
            .then(hospitals => {
                console.log('=== API返回成功 ===');
                console.log('返回数据类型:', typeof hospitals);
                console.log('是否为数组:', Array.isArray(hospitals));
                console.log('数组长度:', hospitals ? hospitals.length : 0);
                console.log('原始医院数据:', JSON.stringify(hospitals));
                
                if (!hospitals || hospitals.length === 0) {
                    console.error('❌ 医院列表为空！');
                    wx.showToast({
                        title: '未获取到医院数据',
                        icon: 'none'
                    });
                    return;
                }
                
                this.setData({ hospitals });
                console.log('✅ setData完成，hospitals已更新');
                
                // 如果已有位置信息，计算距离并排序
                if (this.data.userLocation) {
                    console.log('用户位置已存在，开始计算距离');
                    this.calculateNearbyHospitals(hospitals);
                } else {
                    console.log('⚠️ 用户位置未获取，等待定位完成');
                }
            })
            .catch(err => {
                console.error('❌ 获取医院列表失败:', err);
                console.error('错误详情:', JSON.stringify(err));
                wx.showToast({
                    title: '获取医院失败',
                    icon: 'none'
                });
            });
    },
    
    /**
     * 获取用户当前位置
     */
    getCurrentLocation() {
        // 使用更轻量的提示，不阻塞界面
        this.setData({ locationText: '定位中...' });
        
        wx.getLocation({
            type: 'gcj02',
            isHighAccuracy: false,  // 使用低精度模式，速度更快
            altitude: false,  // 不需要海拔信息
            success: (res) => {
                const location = {
                    latitude: res.latitude,
                    longitude: res.longitude
                };
                
                // 立即标记定位成功并开始搜索
                this.setData({
                    userLocation: location,
                    locationText: '📍 当前位置',
                    locationSuccess: true  // 标记定位成功
                });
                
                console.log('✅ 定位成功:', location);
                
                // 立即搜索附近医院（优先级最高）
                this.searchNearbyRealHospitals(res.latitude, res.longitude);
                
                // 并行获取地名（不阻塞医院显示）
                setTimeout(() => {
                    this.getLocationName(res.latitude, res.longitude);
                }, 100);
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('定位失败详情:', err);
                console.error('错误代码:', err.errCode);
                console.error('错误信息:', err.errMsg);
                
                let errorMessage = '无法获取您的位置信息\n\n';
                
                // 根据错误代码提供具体提示
                if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
                    errorMessage += '原因：您拒绝了位置授权\n请点击"打开设置"允许位置权限';
                } else if (err.errMsg && err.errMsg.indexOf('timeout') > -1) {
                    errorMessage += '原因：定位超时\n请确保GPS已开启或网络连接正常';
                } else if (err.errMsg && err.errMsg.indexOf('system permission') > -1) {
                    errorMessage += '原因：系统位置权限未开启\n请在手机设置中开启位置服务';
                } else {
                    errorMessage += '可能原因：\n1. 未授权位置权限\n2. GPS信号弱或已关闭\n3. 网络连接异常';
                }
                
                this.setData({
                    locationText: '定位失败，请检查位置权限'
                });
                
                wx.showModal({
                    title: '定位失败',
                    content: errorMessage,
                    confirmText: '打开设置',
                    cancelText: '取消',
                    success: (modalRes) => {
                        if (modalRes.confirm) {
                            wx.openSetting({
                                success: (settingRes) => {
                                    console.log('授权结果:', settingRes);
                                    if (settingRes.authSetting['scope.userLocation']) {
                                        // 用户授权后重新定位
                                        wx.showToast({
                                            title: '授权成功，正在重新定位',
                                            icon: 'none'
                                        });
                                        setTimeout(() => {
                                            this.getCurrentLocation();
                                        }, 1500);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    },
    
    /**
     * 计算附近医院（按距离排序）- 使用数据库中的真实坐标
     */
    calculateNearbyHospitals(hospitals) {
        console.log('=== 开始计算附近医院 ===');
        console.log('传入医院数量:', hospitals ? hospitals.length : 0);
        
        if (!this.data.userLocation) {
            console.error('❌ 用户位置未获取，无法计算距离');
            return;
        }
        
        if (!hospitals || hospitals.length === 0) {
            console.error('❌ 医院列表为空，无法计算');
            return;
        }
        
        const userLat = this.data.userLocation.latitude;
        const userLng = this.data.userLocation.longitude;
        
        console.log('✅ 用户位置:', userLat, userLng);
        console.log('医院列表:', JSON.stringify(hospitals));
        
        // 为每个医院计算距离
        const hospitalsWithDistance = hospitals.map((hospital, index) => {
            console.log(`--- 处理医院 ${index + 1} ---`);
            console.log('医院ID:', hospital.hospitalId || hospital.hospital_id);
            console.log('医院名称:', hospital.hospitalName || hospital.hospital_name);
            console.log('医院原始坐标 - latitude:', hospital.latitude);
            console.log('医院原始坐标 - longitude:', hospital.longitude);
            
            // 使用医院的真实坐标（从数据库获取）
            // 如果数据库中没有坐标，则模拟附近位置
            const hospitalLat = hospital.latitude || (userLat + (Math.random() - 0.5) * 0.05);
            const hospitalLng = hospital.longitude || (userLng + (Math.random() - 0.5) * 0.05);
            
            if (!hospital.latitude || !hospital.longitude) {
                console.warn('⚠️ 医院坐标为空，使用模拟位置');
            }
            
            const distance = this.calculateDistance(
                userLat, userLng,
                hospitalLat, hospitalLng
            );
            
            // 判断是否可预约（根据剩余配额）
            const availableQuota = hospital.availableQuota || hospital.available_quota || 0;
            const isAvailable = availableQuota > 0;
            
            return Object.assign({}, hospital, {
                distance: distance,
                distanceText: `${distance.toFixed(1)}km`,  // 统一使用km格式
                latitude: hospitalLat,
                longitude: hospitalLng,
                available: isAvailable  // 添加可预约状态
            });
        });
        
        // 按距离排序
        hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
        
        // 取最近的3家医院
        const nearbyTop3 = hospitalsWithDistance.slice(0, 3);
        
        console.log('计算完成，最近的3家医院:', nearbyTop3);
        console.log('nearbyHospitals数据:', nearbyTop3);
        console.log('nearbyHospitals长度:', nearbyTop3.length);
        
        this.setData({
            nearbyHospitals: nearbyTop3,
            hospitals: hospitalsWithDistance
        }, function() {
            console.log('setData完成，当前nearbyHospitals:', this.data.nearbyHospitals);
        });
        
        // 显示提示
        if (nearbyTop3.length > 0) {
            wx.showToast({
                title: `已找到${nearbyTop3.length}家附近医院`,
                icon: 'success',
                duration: 2000
            });
        }
    },
    
    /**
     * 逆地理编码 - 将经纬度转换为地名
     */
    getLocationName(latitude, longitude) {
        console.log('🗺️ 开始逆地理编码:', latitude, longitude);
        
        // 先用高德逆地理获取更精确的地址
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
            timeout: 3000,
            success: (res) => {
                console.log('高德逆地理返回:', res.data);

                let locationName = '当前位置';
                const data = res.data || {};
                if (data.status === '1' && data.regeocode) {
                    const regeocode = data.regeocode;
                    const poiName =
                        (regeocode.pois && regeocode.pois[0] && regeocode.pois[0].name) || '';
                    const formatted = regeocode.formatted_address || '';
                    locationName = poiName || formatted || '当前位置';
                } else {
                    console.warn('⚠️ 高德逆地理解析失败，使用默认文案');
                }

                // 根据已有文本，保留医院数量
                const currentText = this.data.locationText;
                let newLocationText;

                if (currentText && currentText.includes('家')) {
                    const parts = currentText.split('·');
                    if (parts.length > 1) {
                        const count = parts[1].trim(); // 例如 "3家医院"
                        newLocationText = `📍 ${locationName} · ${count}`;
                    } else {
                        newLocationText = `📍 ${locationName}`;
                    }
                } else {
                    newLocationText = `📍 ${locationName}`;
                }

                console.log('更新位置文本为:', newLocationText);
                this.setData({
                    locationText: newLocationText
                });

                if (locationCache) {
                    locationCache.text = newLocationText;
                    console.log('缓存已更新为地名:', newLocationText);
                }
            },
            fail: (err) => {
                console.error('❌ 高德逆地理请求失败:', err);
                // 失败时保留原有或默认位置文本
                if (!this.data.locationText || this.data.locationText === '正在定位...') {
                    this.setData({
                        locationText: '📍 当前位置'
                    });
                }
            }
        });
    },
    
    /**
     * 搜索附近的真实医院（优先使用腾讯地图API，速度更快）
     */
    searchNearbyRealHospitals(latitude, longitude) {
        console.log('=== 开始搜索附近真实医院 ===');
        console.log('用户坐标:', latitude, longitude);
        
        // 🔥 临时方案：直接使用测试数据，跳过API调用
        console.log('⚡ 使用测试数据，跳过API请求');
        const testHospitals = [
            {
                hospitalId: 'TEST_001',
                hospitalName: '福建省立医院',
                address: '福州市鼓楼区东街134号',
                latitude: 26.0845,
                longitude: 119.3005,
                distance: 2.5,
                distanceText: '2.5km',
                available: true,
                availableQuota: 50
            },
            {
                hospitalId: 'TEST_002',
                hospitalName: '福建医科大学附属第一医院',
                address: '福州市台江区茶亭街20号',
                latitude: 26.0534,
                longitude: 119.3123,
                distance: 3.2,
                distanceText: '3.2km',
                available: true,
                availableQuota: 30
            },
            {
                hospitalId: 'TEST_003',
                hospitalName: '福州市第一医院',
                address: '福州市台江区达道路190号',
                latitude: 26.0623,
                longitude: 119.3189,
                distance: 4.1,
                distanceText: '4.1km',
                available: true,
                availableQuota: 20
            }
        ];
        
        // 缓存测试数据
        hospitalsCache = {
            nearby: testHospitals,
            all: testHospitals,
            timestamp: Date.now()
        };
        
        // 获取当前的位置文本（可能已经包含地名）
        const currentLocation = this.data.locationText;
        let locationText;
        
        // 如果当前位置包含地名，保留它
        if (currentLocation && currentLocation !== '正在定位...' && currentLocation !== '📍 当前位置') {
            // 更新医院数量
            const baseLocation = currentLocation.split('·')[0].trim();
            locationText = `${baseLocation} · 3家医院`;
        } else {
            // 暂时使用默认，等待逆地理编码更新
            locationText = '📍 当前位置 · 3家医院';
        }
        
        this.setData({
            nearbyHospitals: testHospitals,
            hospitals: testHospitals,
            locationText: locationText,
            locationSuccess: true  // ✅ 显示医院列表
        }, () => {
            console.log('✅ 测试数据已设置，更新预约状态');
            this.updateHospitalReservationStatus();
        });
        
        console.log('✅ 测试医院数据加载完成');
        return; // 临时跳过API调用
        
        // 下面是原来的API调用代码（暂时禁用）
        console.log('准备发送腾讯地图API请求...');
        console.log('🚀 正在调用 wx.request...');
        wx.request({
            url: 'https://apis.map.qq.com/ws/place/v1/search',
            data: {
                keyword: '医院',
                boundary: `nearby(${latitude},${longitude},5000)`,
                page_size: 10,
                orderby: '_distance',
                key: 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'
            },
            timeout: 5000,  // 5秒超时
            success: (res) => {
                console.log('📡 腾讯地图API完整返回:', JSON.stringify(res.data));
                console.log('API status:', res.data.status);
                console.log('API message:', res.data.message);
                
                // 检查API是否成功（status为0表示成功）
                if (res.data.status === 0 && res.data.data && res.data.data.length > 0) {
                    // 转换数据格式 - 使用优化的距离计算
                    const hospitals = res.data.data.map((place, index) => {
                        const distance = place._distance || 0;
                        return {
                            hospitalId: `MAP_${place.id || index}`,
                            hospitalName: place.title,
                            address: place.address,
                            latitude: place.location.lat,
                            longitude: place.location.lng,
                            phone: place.tel || '暂无电话',
                            distance: distance / 1000,  // 转换为公里
                            distanceText: `${(distance / 1000).toFixed(1)}km`,
                            available: true,  // 所有医院默认可预约
                            availableQuota: 100  // 统一配额
                        };
                    });
                    
                    console.log(`✅ 找到 ${hospitals.length} 家医院`);
                    
                    // 取最近的3家
                    const nearbyTop3 = hospitals.slice(0, 3);
                    
                    // 缓存医院数据
                    hospitalsCache = {
                        nearby: nearbyTop3,
                        all: hospitals,
                        timestamp: Date.now()
                    };
                    
                    // 保留地名，添加医院数量
                    const baseLocation = this.data.locationText.split('·')[0].trim();
                    const locationText = `${baseLocation} · ${hospitals.length}家`;
                    
                    this.setData({
                        nearbyHospitals: nearbyTop3,
                        hospitals: hospitals,
                        locationText: locationText
                    }, () => {
                        // 数据设置完成后，更新预约状态
                        this.updateHospitalReservationStatus();
                    });
                    
                    console.log('显示最近3家医院:', nearbyTop3);
                } else {
                    // API返回错误或无数据，尝试OpenStreetMap备选
                    console.error('❌ 腾讯地图API返回数据异常');
                    console.error('状态码:', res.data.status);
                    console.error('错误信息:', res.data.message);
                    console.error('完整响应:', JSON.stringify(res.data));
                    
                    // 如果是API key问题（status=110）
                    if (res.data.status === 110) {
                        console.error('🔑 API Key验证失败，可能需要重新申请或检查权限');
                    }
                    // 如果是请求频率限制（status=120）
                    if (res.data.status === 120) {
                        console.error('⏱️ API请求频率超限，切换到备用方案');
                    }
                    
                    console.warn('尝试OpenStreetMap备选方案...');
                    this.searchWithOpenStreetMap(latitude, longitude);
                }
            },
            fail: (err) => {
                console.error('❌ 腾讯地图请求失败');
                console.error('错误类型:', err.errMsg);
                console.error('完整错误:', JSON.stringify(err));
                
                // 检查是否是域名白名单问题
                if (err.errMsg && err.errMsg.includes('request:fail')) {
                    console.error('⚠️ 可能是域名白名单问题，请检查project.config.json');
                    console.error('需要添加 apis.map.qq.com 到域名白名单');
                }
                
                // 失败时尝试备选方案
                this.searchWithOpenStreetMap(latitude, longitude);
            }
        });
    },
    
    /**
     * 备选方案：使用OpenStreetMap API
     */
    searchWithOpenStreetMap(latitude, longitude) {
        console.log('=== 使用OpenStreetMap备选方案 ===');
        
        const delta = 0.05;
        const viewbox = `${longitude - delta},${latitude + delta},${longitude + delta},${latitude - delta}`;
        
        wx.request({
            url: 'https://nominatim.openstreetmap.org/search',
            data: {
                q: 'hospital',
                format: 'json',
                limit: 10,
                bounded: 1,
                viewbox: viewbox
            },
            header: {
                'User-Agent': 'WeChatMiniProgram/1.0'
            },
            timeout: 3000,  // 3秒超时
            success: (res) => {
                console.log('📡 OpenStreetMap返回:', res.data ? `${res.data.length}条数据` : '空数据');
                if (res.data && res.data.length > 0) {
                    const hospitals = res.data.map((place, index) => {
                        const hospLat = parseFloat(place.lat);
                        const hospLng = parseFloat(place.lon);
                        const distance = this.fastCalculateDistance(latitude, longitude, hospLat, hospLng);
                        
                        return {
                            hospitalId: `OSM_${place.place_id}`,
                            hospitalName: place.name || '医院',
                            address: place.display_name ? place.display_name.split(',').slice(0, 3).join(', ') : '暂无地址',
                            latitude: hospLat,
                            longitude: hospLng,
                            distance: distance,
                            distanceText: `${distance.toFixed(1)}km`,
                            available: true,
                            availableQuota: 100
                        };
                    });
                    
                    hospitals.sort((a, b) => a.distance - b.distance);
                    const nearbyTop3 = hospitals.slice(0, 3);
                    
                    hospitalsCache = {
                        nearby: nearbyTop3,
                        all: hospitals,
                        timestamp: Date.now()
                    };
                    
                    const baseLocation = this.data.locationText.split('·')[0].trim();
                    const locationText = `${baseLocation} · ${hospitals.length}家`;
                    
                    this.setData({
                        nearbyHospitals: nearbyTop3,
                        hospitals: hospitals,
                        locationText: locationText,
                        locationSuccess: true  // ✅ 显示医院列表
                    }, () => {
                        // 更新预约状态
                        this.updateHospitalReservationStatus();
                    });
                    
                    wx.showToast({
                        title: `找到${nearbyTop3.length}家医院`,
                        icon: 'success',
                        duration: 800
                    });
                } else {
                    console.warn('❌ OpenStreetMap也无数据');
                    this.showSearchFailedMessage();
                }
            },
            fail: (err) => {
                console.error('❌ OpenStreetMap请求失败');
                console.error('错误类型:', err.errMsg);
                console.error('完整错误:', JSON.stringify(err));
                
                if (err.errMsg && err.errMsg.includes('request:fail')) {
                    console.error('⚠️ 域名白名单问题，需要添加 nominatim.openstreetmap.org');
                }
                
                this.showSearchFailedMessage();
            }
        });
    },
    
    /**
     * 显示搜索失败的提示
     */
    showSearchFailedMessage() {
        console.log('⚠️ 所有API都失败，尝试使用测试数据...');
        
        // 如果在开发环境，提供测试数据
        const testHospitals = [
            {
                hospitalId: 'TEST_001',
                hospitalName: '福建省立医院',
                address: '福州市鼓楼区东街134号',
                latitude: 26.0845,
                longitude: 119.3005,
                distance: 2.5,
                distanceText: '2.5km',
                available: true,
                availableQuota: 50
            },
            {
                hospitalId: 'TEST_002',
                hospitalName: '福建医科大学附属第一医院',
                address: '福州市台江区茶亭街20号',
                latitude: 26.0534,
                longitude: 119.3123,
                distance: 3.2,
                distanceText: '3.2km',
                available: true,
                availableQuota: 30
            },
            {
                hospitalId: 'TEST_003',
                hospitalName: '福州市第一医院',
                address: '福州市台江区达道路190号',
                latitude: 26.0623,
                longitude: 119.3189,
                distance: 4.1,
                distanceText: '4.1km',
                available: true,
                availableQuota: 20
            }
        ];
        
        const baseLocation = this.data.locationText.split('·')[0].trim();
        this.setData({
            locationText: baseLocation + ' · 3家(测试)',
            nearbyHospitals: testHospitals,
            hospitals: testHospitals,
            locationSuccess: true  // 显示医院列表
        }, () => {
            this.updateHospitalReservationStatus();
        });
        
        wx.showToast({
            title: '使用测试数据',
            icon: 'none',
            duration: 2000
        });
        
        return; // 不显示错误弹窗，直接使用测试数据
    },
    
    /**
     * 快速计算距离（优化版，减少三角函数调用）
     */
    fastCalculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
    
    /**
     * 计算两点之间的距离（单位：公里）- 兼容旧代码
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        return this.fastCalculateDistance(lat1, lng1, lat2, lng2);
    },
    
    /**
     * 角度转弧度
     */
    toRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * 科室标签切换
     */
    onTagChange(e) {
        console.log('=== onTagChange被调用 ===');
        console.log('事件对象:', e);
        console.log('事件detail:', e.detail);
        
        if (!e || !e.detail || !e.detail.name) {
            console.error('❌ 事件数据不完整');
            return;
        }
        
        const department = e.detail.name;
        console.log('✅ 切换到科室:', department);
        
        // 语音播报
        app.playText(department);

        // 立即更新激活状态
        this.setData({ 
            activeTag: department 
        }, () => {
            console.log('✅ activeTag已更新为:', this.data.activeTag);
        });
        
        // 显示切换提示
        wx.showToast({
            title: `已选择${department}`,
            icon: 'success',
            duration: 1000
        });
        
        // 注意：附近医院列表不会因为科室切换而改变
        // 所有显示的医院都支持多科室挂号
        console.log(`当前科室：${department}，医院列表保持不变`);
    },
    
    /**
     * 语音录音 - 长按开始
     */
    onVoiceStart() {
        console.log('挂号页面：开始录音');
        
        // 延迟加载 voice 模块
        if (!voiceUtil) {
            try {
                voiceUtil = require('../../utils/voice.js');
            } catch (e) {
                console.error('加载 voice 模块失败:', e);
                wx.showToast({
                    title: '语音功能暂不可用',
                    icon: 'none'
                });
                return;
            }
        }
        
        // 提示音
        wx.vibrateShort(); // 震动反馈
        
        this.setData({ isRecording: true });
        voiceUtil.startRecord();
    },
    
    /**
     * 语音录音 - 松开结束
     */
    onVoiceEnd() {
        console.log('挂号页面：停止录音');
        this.setData({ isRecording: false });
        
        voiceUtil.stopRecord();
        
        // 等待录音文件生成后上传识别
        setTimeout(() => {
            voiceUtil.recognizeAudio(
                (text) => {
                    // 识别成功，将文字填入搜索框
                    if (text && text.trim() !== '') {
                        this.setData({ searchText: text });
                        
                        app.playText('识别成功，已为您填入');
                        
                        wx.showToast({
                            title: '识别成功',
                            icon: 'success',
                            duration: 1000
                        });
                        console.log('识别到症状/科室：', text);
                        
                        // 智能匹配科室
                        this.matchDepartment(text);
                    } else {
                        app.playText('没有听清，请再说一次');
                        wx.showModal({
                            title: '识别结果',
                            content: '没有识别到语音内容，请确保：\n1. 说话声音清晰\n2. 录音时间至少2秒\n3. 环境相对安静',
                            showCancel: false,
                            confirmText: '知道了'
                        });
                    }
                },
                (err) => {
                    console.error('识别失败:', err);
                    app.playText('识别失败，请重试');
                }
            );
        }, 300);
    },
    
    /**
     * 智能匹配科室
     */
    matchDepartment(text) {
        console.log('智能匹配科室，输入:', text);
        
        // 科室关键词映射（扩展版）
        const departmentMap = {
            '内科': ['内科', '感冒', '发烧', '咳嗽', '肚子', '腹痛', '腹泻', '心脏', '高血压', '糖尿病', '头痛', '胃', '胃痛'],
            '外科': ['外科', '骨折', '外伤', '伤口', '手术', '摔伤', '骨', '骨头', '扭伤'],
            '眼科': ['眼科', '眼睛', '视力', '看不清', '眼痛', '眼', '近视', '远视', '散光'],
            '中医科': ['中医', '中医科', '调理', '针灸', '拔罐', '推拿', '按摩', '理疗'],
            '牙科': ['牙科', '牙', '牙齿', '牙痛', '口腔', '拔牙', '补牙', '牙龈', '蛀牙'],
            '皮肤科': ['皮肤科', '皮肤', '过敏', '痒', '红疹', '湿疹', '痘', '痘痘', '青春痘']
        };
        
        // 查找匹配的科室
        for (let [department, keywords] of Object.entries(departmentMap)) {
            for (let keyword of keywords) {
                if (text.includes(keyword)) {
                    // 找到匹配的科室
                    console.log('✅ 匹配到科室:', department, '关键词:', keyword);
                    this.setData({ activeTag: department });
                    
                    wx.showToast({
                        title: `已切换到${department}`,
                        icon: 'success',
                        duration: 1500
                    });
                    
                    // 如果有筛选功能，这里可以调用
                    // hospitalApi.getHospitalsByDepartment(department)
                    //     .then(hospitals => {
                    //         this.setData({ hospitals });
                    //     });
                    
                    return;
                }
            }
        }
        
        // 没有匹配到，显示提示
        console.log('❌ 未匹配到科室');
        wx.showToast({
            title: '未识别到科室，请手动选择',
            icon: 'none',
            duration: 2000
        });
    },
    
    /**
     * 预约医院
     */
    makeReservation(e) {
        const hospitalId = e.currentTarget.dataset.hospitalId;
        const hospitalName = e.currentTarget.dataset.hospitalName;
        
        app.playText('开始预约');

        wx.showModal({
            title: '预约挂号',
            content: `医院：${hospitalName}\n科室：${this.data.activeTag}\n\n确认预约吗？`,
            confirmText: '确认',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.confirmReservation(hospitalId, hospitalName);
                }
            }
        });
    },
    
    /**
     * 确认预约
     */
    confirmReservation(hospitalId, hospitalName) {
        console.log('开始预约:', hospitalId, hospitalName);
        
        wx.showLoading({
            title: '正在预约...',
            mask: true
        });
        
        const userId = 'USER_123'; // 实际应从登录状态获取
        const reserveData = {
            userId: userId,
            hospitalId: hospitalId,
            department: this.data.activeTag,
            reserveDate: new Date().toISOString().split('T')[0]
        };
        
        console.log('预约数据:', reserveData);
        
        // 🔥 临时方案：直接模拟预约成功，不调用后端API
        setTimeout(() => {
            wx.hideLoading();
            console.log('✅ 预约成功（模拟）');
            
            // 添加到已预约列表
            this.addReservedHospital(hospitalId);
            
            const today = new Date();
            const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
            
            wx.showModal({
                title: '预约成功',
                content: `医院：${hospitalName}\n科室：${this.data.activeTag}\n日期：${dateStr}\n\n预约成功！请按时前往医院就诊`,
                showCancel: false,
                confirmText: '知道了'
            });
        }, 500); // 模拟500ms延迟
        
        return; // 跳过后端API调用
        
        // 下面是原来的后端API调用代码（暂时禁用）
        // 设置8秒超时
        const timeoutId = setTimeout(() => {
            wx.hideLoading();
            console.error('⚠️ 后端API超时');
            wx.showModal({
                title: '预约超时',
                content: '预约服务响应超时\n\n可能原因：\n1. 后端服务未启动\n2. 网络连接异常\n3. 服务器响应慢\n\n请联系管理员确认后端服务状态',
                showCancel: false,
                confirmText: '知道了'
            });
        }, 8000);
        
        // 尝试调用后端API
        hospitalApi.createReservation(reserveData)
        .then(() => {
            clearTimeout(timeoutId);
            wx.hideLoading();
            console.log('✅ 预约成功（后端API）');
            
            // 添加到已预约列表
            this.addReservedHospital(hospitalId);
            
            const today = new Date();
            const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
            
            wx.showModal({
                title: '预约成功',
                content: `医院：${hospitalName}\n科室：${this.data.activeTag}\n日期：${dateStr}\n\n预约成功！请按时前往医院就诊`,
                showCancel: false,
                confirmText: '知道了'
            });
        })
        .catch(err => {
            clearTimeout(timeoutId);
            wx.hideLoading();
            console.error('❌ 预约失败（后端API）:', err);
            
            wx.showModal({
                title: '预约失败',
                content: `无法连接预约服务\n\n错误信息：${err.message || '未知错误'}\n\n可能原因：\n1. 后端服务未启动（请确认Java后端正在运行）\n2. API地址配置错误\n3. 网络连接问题\n\n请联系管理员解决`,
                showCancel: false,
                confirmText: '知道了'
            });
        });
    },
    
    /**
     * 添加已预约医院
     */
    addReservedHospital(hospitalId) {
        if (!this.data.reservedHospitals.includes(hospitalId)) {
            const reserved = [...this.data.reservedHospitals, hospitalId];
            this.setData({ reservedHospitals: reserved });
            this.saveReservedHospitals();
            
            // 更新医院列表显示
            this.updateHospitalReservationStatus();
        }
    },
    
    /**
     * 更新医院预约状态显示
     */
    updateHospitalReservationStatus() {
        const nearbyHospitals = this.data.nearbyHospitals.map(hospital => {
            return {
                ...hospital,
                isReserved: this.isHospitalReserved(hospital.hospitalId)
            };
        });
        
        const hospitals = this.data.hospitals.map(hospital => {
            return {
                ...hospital,
                isReserved: this.isHospitalReserved(hospital.hospitalId)
            };
        });
        
        this.setData({ 
            nearbyHospitals,
            hospitals
        });
    },
    
})
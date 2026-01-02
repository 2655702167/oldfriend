/**
 * 腾讯地图API - 搜索附近医院
 * 无需后端，直接调用腾讯位置服务API
 */

// 腾讯地图WebService API Key（需要申请）
const TENCENT_MAP_KEY = 'YOUR_KEY_HERE'; // 待替换

/**
 * 搜索附近的医院（使用腾讯地图API）
 * @param {Number} latitude - 纬度
 * @param {Number} longitude - 经度
 * @param {Number} radius - 搜索半径（米）
 * @returns {Promise} 医院列表
 */
function searchNearbyHospitals(latitude, longitude, radius = 5000) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/search',
      data: {
        keyword: '医院',
        boundary: `nearby(${latitude},${longitude},${radius})`,
        key: TENCENT_MAP_KEY,
        output: 'json'
      },
      success: (res) => {
        if (res.data.status === 0) {
          const hospitals = res.data.data.map((place, index) => ({
            hospitalId: `TXH_${index}`,
            hospitalName: place.title,
            address: place.address,
            latitude: place.location.lat,
            longitude: place.location.lng,
            phone: place.tel || '暂无电话',
            distance: place._distance || 0,
            distanceText: place._distance ? `${(place._distance / 1000).toFixed(1)}km` : '未知',
            available: true, // 默认可预约
            availableQuota: 100 // 模拟配额
          }));
          resolve(hospitals);
        } else {
          reject(new Error('搜索失败'));
        }
      },
      fail: reject
    });
  });
}

/**
 * 使用微信内置接口搜索附近地点
 * 不需要申请Key，但返回信息较少
 */
function searchNearbyHospitalsWX(latitude, longitude) {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      latitude: latitude,
      longitude: longitude,
      success: (res) => {
        // 这个方法需要用户手动选择，不太适合自动搜索
        reject(new Error('需要用户交互'));
      },
      fail: reject
    });
  });
}

module.exports = {
  searchNearbyHospitals
};

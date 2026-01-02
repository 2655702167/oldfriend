/**
 * HTTP请求封装工具
 * 统一处理API请求和响应
 */

const config = require('./config.js');

/**
 * 发起HTTP请求
 * @param {String} url - 请求路径（不含baseUrl）
 * @param {Object} options - 请求配置
 * @returns {Promise}
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 完整的请求URL
    const fullUrl = config.apiBaseUrl + url;

    // 发起请求
    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: Object.assign({
        'Content-Type': 'application/json'
      }, options.header || {}),
      timeout: config.timeout,
      
      success: (res) => {
        wx.hideLoading();
        
        // 检查HTTP状态码
        if (res.statusCode !== 200) {
          wx.showToast({
            title: `请求失败: ${res.statusCode}`,
            icon: 'none'
          });
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        // 检查业务状态码
        if (res.data.code === 0) {
          resolve(res.data.data);
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(new Error(res.data.message));
        }
      },
      
      fail: (err) => {
        wx.hideLoading();
        
        // 判断错误类型
        let errorMsg = '网络连接失败';
        if (err.errMsg.includes('timeout')) {
          errorMsg = '请求超时，请检查网络';
        } else if (err.errMsg.includes('fail')) {
          errorMsg = '无法连接服务器，请确认后端已启动';
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
        
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}) {
  // 将参数拼接到URL
  const params = Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&');
  
  const fullUrl = params ? `${url}?${params}` : url;
  
  return request(fullUrl, {
    method: 'GET'
  });
}

/**
 * POST请求
 */
function post(url, data = {}) {
  return request(url, {
    method: 'POST',
    data: data
  });
}

module.exports = {
  request,
  get,
  post
};

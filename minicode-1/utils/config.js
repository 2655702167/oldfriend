/**
 * 小程序配置文件
 * 包含后端API地址等配置
 */

// 开发环境配置
const DEV_CONFIG = {
  // 后端API基础地址（本地开发）
  // 使用电脑在当前网络下的IPv4地址 + 端口，方便真机访问
  // 当前检测到的活跃 WLAN IPv4 是 172.20.10.4
  apiBaseUrl: 'http://172.20.10.4:8082/api',
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 是否使用Mock数据
  useMock: false
};

// 生产环境配置
const PROD_CONFIG = {
  // 后端API基础地址（生产环境）
  apiBaseUrl: 'https://your-domain.com/api',
  
  timeout: 10000,
  useMock: false
};

// 根据环境选择配置
const ENV = 'development'; // 可选值：development / production
const config = ENV === 'development' ? DEV_CONFIG : PROD_CONFIG;

module.exports = config;

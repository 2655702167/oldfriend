/**
 * 增强的语音识别工具 - 支持多种方言
 */

const config = require('./config.js');

// 录音管理器
let recorderManager = null;
let tempAudioPath = null;

/**
 * 支持的方言列表及其代码
 */
const DIALECT_MAP = {
  '普通话': 'zh',
  '四川话': 'zh_sc',
  '广东话': 'zh_yue',
  '上海话': 'zh_sh',
  '东北话': 'zh_db',
  '陕西话': 'zh_sn',
  '河南话': 'zh_hn',
  '浙江话': 'zh_zj',
  '福建话': 'zh_fj'
};

/**
 * 初始化录音管理器
 */
function initRecorder() {
  if (!recorderManager) {
    recorderManager = wx.getRecorderManager();
    
    recorderManager.onStart(() => {
      console.log('开始录音');
    });
    
    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      tempAudioPath = res.tempFilePath;
    });
    
    recorderManager.onError((err) => {
      console.error('录音错误', err);
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
    });
  }
  return recorderManager;
}

/**
 * 开始录音
 */
function startRecord() {
  const manager = initRecorder();
  const options = {
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 48000,
    format: 'pcm',
    frameSize: 1
  };
  manager.start(options);
}

/**
 * 停止录音
 */
function stopRecord() {
  const manager = initRecorder();
  manager.stop();
}

/**
 * 识别音频（支持方言）
 * @param {String} dialect - 方言（如'普通话', '四川话'等）
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function recognizeAudio(dialect, successCallback, failCallback) {
  if (!tempAudioPath) {
    wx.showToast({
      title: '没有录音文件',
      icon: 'none'
    });
    if (failCallback) failCallback('没有录音文件');
    return;
  }

  // 获取方言代码
  const dialectCode = DIALECT_MAP[dialect] || DIALECT_MAP['普通话'];
  
  wx.showLoading({
    title: '正在识别' + dialect + '...',
    mask: true
  });

  // 上传到后端识别
  wx.uploadFile({
    url: config.apiBaseUrl + '/voice/recognize',
    filePath: tempAudioPath,
    name: 'file',
    formData: {
      dialect: dialect,
      dialectCode: dialectCode
    },
    header: {
      'Content-Type': 'multipart/form-data'
    },
    success: (res) => {
      wx.hideLoading();
      console.log('语音识别响应:', res);

      if (res.statusCode === 200) {
        const data = JSON.parse(res.data);

        if (data.code === 0) {
          const text = data.data.text;
          const confidence = data.data.confidence || 0;
          
          console.log('识别结果:', text);
          console.log('识别置信度:', confidence);

          if (successCallback) {
            successCallback({
              text: text,
              dialect: dialect,
              confidence: confidence
            });
          }
        } else {
          wx.showToast({
            title: data.message || '识别失败',
            icon: 'none'
          });
          if (failCallback) failCallback(data.message);
        }
      } else {
        wx.showToast({
          title: `请求失败: ${res.statusCode}`,
          icon: 'none'
        });
        if (failCallback) failCallback(`HTTP ${res.statusCode}`);
      }
    },
    fail: (err) => {
      wx.hideLoading();
      console.error('上传失败:', err);

      let errorMsg = '上传失败';
      if (err.errMsg.includes('timeout')) {
        errorMsg = '请求超时';
      } else if (err.errMsg.includes('fail')) {
        errorMsg = '无法连接服务器';
      }

      wx.showToast({
        title: errorMsg,
        icon: 'none'
      });

      if (failCallback) failCallback(err);
    }
  });
}

/**
 * 获取所有支持的方言列表
 */
function getSupportedDialects() {
  return Object.keys(DIALECT_MAP);
}

/**
 * 获取方言代码
 */
function getDialectCode(dialect) {
  return DIALECT_MAP[dialect] || DIALECT_MAP['普通话'];
}

module.exports = {
  startRecord,
  stopRecord,
  recognizeAudio,
  getSupportedDialects,
  getDialectCode,
  DIALECT_MAP
};

/**
 * 语音录音和识别工具
 */

const config = require('./config.js');

// 录音管理器
let recorderManager = null;
let tempAudioPath = null;

/**
 * 初始化录音管理器
 */
function initRecorder() {
  if (!recorderManager) {
    recorderManager = wx.getRecorderManager();
    
    // 录音开始
    recorderManager.onStart(() => {
      console.log('开始录音');
    });
    
    // 录音结束
    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      tempAudioPath = res.tempFilePath;
    });
    
    // 录音错误
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
  
  // 录音配置（配置为百度语音API要求的格式）
  const options = {
    duration: 60000,        // 最长录音时间 60秒
    sampleRate: 16000,      // 采样率（百度要求16000）
    numberOfChannels: 1,    // 单声道
    encodeBitRate: 48000,   // 编码码率
    // 使用 wav 容器格式，兼容性更好，由后端按文件扩展名上报百度
    format: 'wav'
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
 * 上传音频并识别
 * @param {Function} successCallback - 成功回调，参数为识别的文字
 * @param {Function} failCallback - 失败回调
 */
function recognizeAudio(successCallback, failCallback) {
  if (!tempAudioPath) {
    wx.showToast({
      title: '没有录音文件',
      icon: 'none'
    });
    if (failCallback) failCallback('没有录音文件');
    return;
  }
  
  // 获取用户设置的方言（兼容旧版本JavaScript）
  const app = getApp();
  const dialect = (app.globalData.setting && app.globalData.setting.dialect) || '普通话';
  
  wx.showLoading({
    title: '识别中...',
    mask: true
  });
  
  // 上传到后端识别
  wx.uploadFile({
    url: config.apiBaseUrl + '/voice/recognize',
    filePath: tempAudioPath,
    name: 'file',
    formData: {
      dialect: dialect  // 传递方言参数到后端
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
          console.log('识别结果:', text);
          
          if (successCallback) {
            successCallback(text);
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
      
      console.error('语音识别上传失败:', err);
      
      // 语音识别失败时不显示错误toast，避免干扰用户
      // 让调用方决定如何处理错误
      
      if (failCallback) failCallback(err);
    }
  });
}

// 缓存已下载的语音文件路径 (内存缓存)
const audioCache = {};
// 单例音频上下文
let globalInnerAudioContext = null;
// 文件管理器
const fs = wx.getFileSystemManager();
// 本地缓存目录
const VOICE_CACHE_DIR = `${wx.env.USER_DATA_PATH}/voice_cache`;

// 初始化缓存目录
try {
  fs.accessSync(VOICE_CACHE_DIR);
} catch (e) {
  try {
    fs.mkdirSync(VOICE_CACHE_DIR, true);
  } catch (err) {
    console.error('创建语音缓存目录失败', err);
  }
}

/**
 * 获取本地缓存文件路径
 */
function getLocalVoicePath(text, dialect) {
  // 简单的文件名处理，避免特殊字符
  const safeText = encodeURIComponent(text).replace(/%/g, '');
  const safeDialect = encodeURIComponent(dialect).replace(/%/g, '');
  // 限制文件名长度
  const fileName = `${safeDialect}_${safeText}`.substring(0, 50) + '.mp3';
  return `${VOICE_CACHE_DIR}/${fileName}`;
}

/**
 * 预下载语音资源
 * @param {Array} textList 需要预下载的文本列表
 */
function preloadVoices(textList) {
  // 禁用语音预加载，避免后端不可用时持续请求
  console.log('[Voice Preload Disabled]');
  return;
  
  // 以下代码已禁用
  /*
  if (!textList || !Array.isArray(textList)) return;
  
  const app = getApp();
  const dialect = (app.globalData.setting && app.globalData.setting.dialect) || '普通话';
  
  console.log(`开始预下载语音资源 (${dialect})...`);
  
  textList.forEach(text => {
    const localPath = getLocalVoicePath(text, dialect);
    
    // 检查文件是否存在
    try {
      fs.accessSync(localPath);
      // console.log(`语音已存在: ${text}`);
      return; // 已存在，跳过
    } catch (e) {
      // 不存在，开始下载
    }
    
    const ttsUrl = `${config.apiBaseUrl}/voice/synthesize?text=${encodeURIComponent(text)}&dialect=${encodeURIComponent(dialect)}`;
    
    wx.downloadFile({
      url: ttsUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到本地缓存目录
          fs.saveFile({
            tempFilePath: res.tempFilePath,
            filePath: localPath,
            success: (saveRes) => {
              console.log(`预下载成功: ${text}`);
            },
            fail: (err) => {
              console.error(`保存语音失败: ${text}`, err);
            }
          });
        }
      }
    });
  });
  */
}

/**
 * 播放语音播报 (TTS)
 * @param {string} text 要播报的文本
 */
function playText(text) {
  // 语音功能已禁用，避免后端不可用时持续报错
  console.log('[Voice Disabled]', text);
  return;
  
  // 以下代码已禁用
  /*
  if (!text) return;
  
  const app = getApp();
  
  // 初始化单例音频上下文
  if (!globalInnerAudioContext) {
    globalInnerAudioContext = wx.createInnerAudioContext();
    globalInnerAudioContext.onPlay(() => {
      console.log('开始播放语音');
    });
    globalInnerAudioContext.onError((res) => {
      console.error('语音播放失败', res);
      // 尝试重置 Context
      globalInnerAudioContext.destroy();
      globalInnerAudioContext = wx.createInnerAudioContext();
    });
  }
  */

  // 设置音量 (0-1)
  if (app && app.globalData && app.globalData.setting) {
      const volume = app.globalData.setting.volume;
      if (volume !== undefined) {
        globalInnerAudioContext.volume = volume / 100;
      }
  }

  // 获取方言设置
  let dialect = '普通话';
  if (app && app.globalData && app.globalData.setting && app.globalData.setting.dialect) {
      dialect = app.globalData.setting.dialect;
  }

  // 1. 检查本地文件缓存
  const localPath = getLocalVoicePath(text, dialect);
  try {
    fs.accessSync(localPath);
    console.log('⚡ 使用本地缓存语音:', text);
    globalInnerAudioContext.src = localPath;
    globalInnerAudioContext.play();
    return;
  } catch (e) {
    // 本地文件不存在
  }

  // 2. 检查内存缓存 (fallback)
  const cacheKey = `${dialect}_${text}`;
  if (audioCache[cacheKey]) {
    console.log('⚡ 使用内存缓存语音:', text);
    globalInnerAudioContext.src = audioCache[cacheKey];
    globalInnerAudioContext.play();
    return;
  }

  // 3. 下载并播放
  const ttsUrl = `${config.apiBaseUrl}/voice/synthesize?text=${encodeURIComponent(text)}&dialect=${encodeURIComponent(dialect)}`;
  
  console.log('⬇️ 下载语音:', text, '方言:', dialect);
  
  wx.downloadFile({
    url: ttsUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        const tempFilePath = res.tempFilePath;
        
        // 播放
        globalInnerAudioContext.src = tempFilePath;
        globalInnerAudioContext.play();
        
        // 异步保存到本地缓存，供下次使用
        fs.saveFile({
          tempFilePath: tempFilePath,
          filePath: localPath,
          success: () => {
            console.log('语音已缓存到本地:', text);
          },
          fail: (err) => {
            console.error('缓存语音失败:', err);
          }
        });
        
        // 同时也存入内存缓存
        audioCache[cacheKey] = tempFilePath;
      } else {
        // 下载失败，尝试直接播放URL
        console.warn('下载失败，尝试直接播放URL');
        globalInnerAudioContext.src = ttsUrl;
        globalInnerAudioContext.play();
      }
    },
    fail: (err) => {
      console.error('下载语音失败:', err);
      // 失败时尝试直接播放URL
      globalInnerAudioContext.src = ttsUrl;
      globalInnerAudioContext.play();
    }
  });
}

module.exports = {
  startRecord,
  stopRecord,
  recognizeAudio,
  playText,
  preloadVoices
};

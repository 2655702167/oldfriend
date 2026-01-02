const app = getApp();
const paymentApi = require('../../api/payment.js');
const voiceUtil = require('../../utils/voice.js');

Page({
    data: {
        fontSizes: {},
        paymentItems: [],  // 缴费项目列表
        loading: false,    // 加载状态
        isRecording: false,// 是否正在录音
        recognizedText: '' // 识别的文字
    },
  
    goToIndex() {
        // 移除语音播放，避免语音服务异常
        // app.playText('返回首页');
        wx.navigateBack({});
    },

    onShow() {
        // 强制清理所有可能的loading状态
        wx.hideLoading();
        wx.hideToast();
        
        // 先设置loading为false，确保页面可见
        this.setData({ loading: false });
        
        this.calcFontSizes();
        
        // 移除语音播放，避免因语音服务失败导致页面异常
        // app.playText('生活缴费');
        
        // 直接加载数据
        this.loadPaymentItems();
    },

    calcFontSizes() {
        this.setData({
            fontSizes: {
                title: app.calcFontSize('title'),
                content: app.calcFontSize('content'),
                button: app.calcFontSize('button'),
                time: app.calcFontSize('time'),
            }
        });
    },

    onLoad() {
        console.log('缴费页面加载成功');
        // 确保页面加载时清除所有loading
        wx.hideLoading();
        wx.hideToast();
    },

    onHide() {
        // 页面隐藏时清理loading状态
        wx.hideLoading();
        wx.hideToast();
    },

    onUnload() {
        // 页面卸载时清理loading状态
        wx.hideLoading();
        wx.hideToast();
    },

    /**
     * 加载缴费项目列表
     */
    loadPaymentItems() {
        // 直接使用模拟数据，不请求后端（避免502错误和loading卡顿）
        console.log('使用模拟数据');
        
        // 设置loading状态（短暂显示）
        this.setData({ loading: true });
        
        // 延迟500ms模拟加载效果，然后显示数据
        setTimeout(() => {
            this.loadMockData();
        }, 500);
        
        /* 后端可用时可以启用以下代码
        const userId = 'USER_123';
        const timeoutId = setTimeout(() => {
            console.warn('请求超时，使用模拟数据');
            this.loadMockData();
        }, 2000);

        paymentApi.getUnpaidItems(userId)
            .then(items => {
                clearTimeout(timeoutId);
                console.log('获取缴费项目成功:', items);
                this.setData({
                    paymentItems: items || [],
                    loading: false
                });
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error('获取缴费项目失败:', err);
                this.loadMockData();
            });
        */
    },

    /**
     * 加载模拟数据（当后端不可用时）
     */
    loadMockData() {
        console.log('使用模拟数据');
        
        // 强制隐藏所有loading相关UI
        wx.hideLoading();
        wx.hideToast();
        
        const mockData = [
            {
                itemId: 'MOCK_001',
                itemType: '电费',
                account: '35010612345',
                amount: '158.50',
                dueDate: '2025-12-20',
                status: 'unpaid'
            },
            {
                itemId: 'MOCK_002',
                itemType: '水费',
                account: '01234567',
                amount: '45.80',
                dueDate: '2025-12-25',
                status: 'unpaid'
            },
            {
                itemId: 'MOCK_003',
                itemType: '网费',
                account: '18512345678',
                amount: '100.00',
                dueDate: '2025-12-15',
                status: 'unpaid'
            },
            {
                itemId: 'MOCK_004',
                itemType: '话费',
                account: '18512345678',
                amount: '50.00',
                dueDate: '2025-12-31',
                status: 'unpaid'
            }
        ];
        
        // 设置数据并确保loading为false
        this.setData({
            paymentItems: mockData,
            loading: false
        });
        
        console.log('模拟数据加载完成，loading状态:', this.data.loading);
    },

    /**
     * 语音录音 - 长按开始
     */
    onVoiceStart() {
        console.log('缴费页面：语音功能暂时禁用');
        wx.showToast({
            title: '语音功能维护中',
            icon: 'none',
            duration: 1500
        });
        // 暂时禁用语音录音，避免后端服务不可用时出错
        // this.setData({ isRecording: true });
        // voiceUtil.startRecord();
    },

    /**
     * 语音录音 - 松开结束
     */
    onVoiceEnd() {
        console.log('缴费页面：语音功能暂时禁用');
        // 暂时禁用，避免语音服务错误
        return;
        
        // this.setData({ isRecording: false });
        // voiceUtil.stopRecord();
        
        // 等待录音文件生成后上传识别
        setTimeout(() => {
            voiceUtil.recognizeAudio(
                (text) => {
                    // 识别成功
                    if (text && text.trim() !== '') {
                        this.setData({ recognizedText: text });
                        console.log('识别到语音：', text);
                        
                        // 智能处理语音指令
                        this.handleVoiceCommand(text);
                    } else {
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
                    // 语音识别失败时给出提示但不阻塞页面
                    wx.showToast({
                        title: '语音识别暂不可用',
                        icon: 'none',
                        duration: 2000
                    });
                }
            );
        }, 300);
    },

    /**
     * 处理语音指令
     */
    handleVoiceCommand(voiceText) {
        const text = voiceText.toLowerCase();
        
        // 判断是否为缴费指令
        if (text.includes('缴费') || text.includes('支付') || text.includes('交')) {
            // 识别缴费类型
            let paymentType = null;
            if (text.includes('电费') || text.includes('电')) {
                paymentType = '电费';
            } else if (text.includes('水费') || text.includes('水')) {
                paymentType = '水费';
            } else if (text.includes('网费') || text.includes('网络') || text.includes('宽带')) {
                paymentType = '网费';
            } else if (text.includes('话费') || text.includes('电话')) {
                paymentType = '话费';
            }
            
            if (paymentType) {
                this.confirmPayment(paymentType);
            } else {
                wx.showModal({
                    title: '请确认',
                    content: '请问您要缴纳哪种费用？\n电费、水费、网费还是话费？',
                    showCancel: false
                });
            }
        } else if (text.includes('查询') || text.includes('多少')) {
            // 查询余额
            wx.showToast({
                title: '正在查询...',
                icon: 'loading'
            });
            this.loadPaymentItems();
        } else {
            wx.showToast({
                title: '未识别到有效指令',
                icon: 'none'
            });
        }
    },

    /**
     * 确认缴费
     */
    confirmPayment(paymentType) {
        // 从缴费项目列表中找到对应项目
        const item = this.data.paymentItems.find(i => i.itemType === paymentType);
        
        if (!item) {
            wx.showToast({
                title: `暂无${paymentType}待缴`,
                icon: 'none'
            });
            return;
        }
        
        wx.showModal({
            title: `确认缴纳${paymentType}`,
            content: `金额：¥${item.amount}\n账户：${item.account}\n\n确认要缴费吗？`,
            confirmText: '确认缴费',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.processPay(item);
                }
            }
        });
    },

    /**
     * 点击缴费项目（从页面触发）
     */
    onPaymentItemClick(e) {
        const item = e.currentTarget.dataset.item;
        if (item) {
            // 移除语音播放，避免语音服务异常
            // app.playText(`缴纳${item.itemType}`);
            this.processPay(item);
        }
    },

    /**
     * 执行缴费 - 优先跳转第三方，失败则模拟
     */
    processPay(item) {
        // 根据缴费类型配置第三方小程序信息
        const paymentTypeMap = {
            '电费': {
                appId: 'wx5b3e27c1727e7920', // 国家电网小程序
                name: '国家电网',
                path: 'pages/index/index'
            },
            '水费': {
                appId: 'wxf3e8e8c5b1c8d9e0', // 水费缴纳小程序（示例）
                name: '水费缴纳',
                path: 'pages/index/index'
            },
            '网费': {
                appId: 'wx91d27dbf599dff74', // 中国联通小程序
                name: '中国联通',
                path: 'pages/index/index'
            },
            '话费': {
                appId: 'wx464b12c78f83c2b5', // 中国移动小程序
                name: '中国移动',
                path: 'pages/index/index'
            }
        };
        
        const paymentInfo = paymentTypeMap[item.itemType];
        
        if (paymentInfo) {
            // 先复制账户信息和金额到剪贴板
            const clipboardData = `账户：${item.account}\n金额：${item.amount}元`;
            wx.setClipboardData({
                data: clipboardData,
                success: () => {
                    console.log('缴费信息已复制到剪贴板');
                }
            });
            
            // 确认是否跳转
            wx.showModal({
                title: '跳转确认',
                content: `将跳转到${paymentInfo.name}小程序进行缴费\n\n${item.itemType}：¥${item.amount}\n账户：${item.account}\n\n账户和金额已复制`,
                confirmText: '跳转缴费',
                cancelText: '模拟缴费',
                success: (res) => {
                    if (res.confirm) {
                        // 尝试跳转第三方小程序
                        this.jumpToPaymentApp(paymentInfo.appId, paymentInfo.name, paymentInfo.path, item);
                    } else {
                        // 用户选择模拟缴费
                        this.simulatePayment(item);
                    }
                }
            });
        } else {
            // 没有配置第三方小程序，直接模拟缴费
            this.simulatePayment(item);
        }
    },
    
    /**
     * 跳转到第三方缴费小程序
     */
    jumpToPaymentApp(appId, appName, path, item) {
        wx.showLoading({
            title: `正在跳转...`,
            mask: true
        });
        
        // 设置5秒超时，防止一直loading
        const timeoutId = setTimeout(() => {
            wx.hideLoading();
            console.error('跳转超时');
            this.showJumpFailDialog(appName, item);
        }, 5000);
        
        wx.navigateToMiniProgram({
            appId: appId,
            path: path,
            extraData: {
                amount: item.amount,
                account: item.account,
                type: item.itemType
            },
            envVersion: 'release',
            success: () => {
                clearTimeout(timeoutId);
                wx.hideLoading();
                console.log(`成功跳转到${appName}`);
                
                wx.showToast({
                    title: '跳转成功',
                    icon: 'success',
                    duration: 2000
                });
            },
            fail: (err) => {
                clearTimeout(timeoutId);
                wx.hideLoading();
                console.error(`跳转${appName}失败:`, err);
                
                // 跳转失败，提供模拟缴费选项
                this.showJumpFailDialog(appName, item);
            }
        });
    },
    
    /**
     * 显示跳转失败对话框
     */
    showJumpFailDialog(appName, item) {
        wx.showModal({
            title: '跳转失败',
            content: `无法跳转到${appName}小程序\n\n可能原因：\n• 小程序未安装或已下架\n• AppID不正确\n• 网络连接问题\n\n账户和金额已复制到剪贴板\n是否使用模拟缴费？`,
            confirmText: '模拟缴费',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    this.simulatePayment(item);
                }
            }
        });
    },
    
    /**
     * 模拟缴费（不请求后端，直接模拟成功）
     */
    simulatePayment(item) {
        wx.showLoading({
            title: '正在缴费...',
            mask: true
        });
        
        // 模拟缴费过程，1.5秒后显示成功
        setTimeout(() => {
            wx.hideLoading();
            
            wx.showModal({
                title: '缴费成功',
                content: `${item.itemType} ¥${item.amount} 已缴纳成功！\n\n账户：${item.account}\n\n（模拟缴费演示）`,
                showCancel: false,
                confirmText: '好的',
                success: () => {
                    // 从列表中移除已缴费项目
                    const newItems = this.data.paymentItems.filter(i => i.itemId !== item.itemId);
                    this.setData({
                        paymentItems: newItems
                    });
                    
                    if (newItems.length === 0) {
                        wx.showToast({
                            title: '所有缴费已完成',
                            icon: 'success'
                        });
                    }
                }
            });
        }, 1500);
    }
});
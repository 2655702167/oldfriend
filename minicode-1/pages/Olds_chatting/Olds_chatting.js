const app = getApp();

Page({
    data: {
      // 对话列表（初始数据，确保打开就能看到）
      chatList: [
        { id: 1, sender: 'ai', content: '你好呀！想聊点什么？', time: '10:30' },
        { id: 2, sender: 'user', content: '我有点想孙子了', time: '10:31' },
        { id: 3, sender: 'ai', content: '孙子也想您呢～', time: '10:31' }
      ],
      fontSizes:{},
      scrollTop: 0, // 对话列表自动滚动到底部
      scrollIntoView: '', // 滚动到指定元素
      bottomId: 'bottom', // 底部锚点ID
      inputContent: '', // 输入框内容
      isRecording: false, // 是否正在录音
      currentVoiceType: 'normal', // 音色类型（normal/grandson）
      isFestivalMode: false // 是否节日祝福模式
    },
    
    //  绑定字体逻辑
    onShow(){
        this.calcFontSizes();
        app.playText('老友聊天');
    },
    goToIndex(){
        app.playText('返回首页');
        wx.navigateBack({
        })
    },
    calcFontSizes(){
        this.setData({
            fontSizes:{
                title:app.calcFontSize('title'),
                content:app.calcFontSize('content'),
                button: app.calcFontSize('button'),
                time: app.calcFontSize('time')
            }
        })
    },

    // ========== 对话核心逻辑 ==========
    // 调用AI回复（智能回复 + 帮助中心）
    getAIReply(userInput) {
        wx.showLoading({
            title: '思考中...',
            mask: false
        });
        
        // 1. 先尝试本地智能回复（快速响应）
        const localReply = this.getLocalReply(userInput);
        
        if (localReply) {
            // 本地找到了匹配的回复
            wx.hideLoading();
            this.addAIReply(localReply);
        } else {
            // 2. 本地没找到，尝试调用后端API
            const userId = 'USER_123';
            const chatApi = require('../../api/chat.js');
            
            chatApi.sendMessage(userId, userInput)
                .then(data => {
                    wx.hideLoading();
                    const aiContent = data.reply || this.getDefaultReply();
                    this.addAIReply(aiContent);
                })
                .catch(err => {
                    wx.hideLoading();
                    console.error('后端对话失败:', err);
                    // 3. 后端也失败了，使用默认回复
                    this.addAIReply(this.getDefaultReply());
                });
        }
    },
    
    /**
     * 本地智能回复库（老人陪聊 + 小程序帮助）
     */
    getLocalReply(userInput) {
        const input = userInput.toLowerCase().replace(/\s+/g, '');
        
        // ========== 情感关怀类 ==========
        
        // 想念家人
        if (input.includes('想孙子') || input.includes('想孙女') || input.includes('想家人') || input.includes('想儿子') || input.includes('想女儿')) {
            const replies = [
                '他们也一定很想您呢～有空记得给他们打个电话，听听声音也好。',
                '我理解您的心情。您可以让孩子们教您用视频通话，这样就能经常见面啦！',
                '想念是因为爱。您养育他们长大，他们心里一定很感激您。',
                '您可以试试发语音或视频给他们，现在的小程序很方便的！'
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }
        
        // 孤独寂寞
        if (input.includes('孤独') || input.includes('寂寞') || input.includes('无聊') || input.includes('没人说话')) {
            const replies = [
                '您不孤单，我一直陪着您呢！有什么想聊的尽管说。',
                '要不咱们聊聊天？您可以跟我说说年轻时的故事。',
                '您可以去附近的公园走走，和邻居们聊聊天，也挺好的。',
                '寂寞的时候可以来找我，我随时在线哦！'
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }
        
        // 身体健康
        if (input.includes('身体') || input.includes('健康') || input.includes('不舒服') || input.includes('疼') || input.includes('难受')) {
            return '身体不舒服一定要重视！您可以用小程序里的"医院挂号"功能，我帮您找最近的医院。要不要现在就去看看？';
        }
        
        // 睡眠问题
        if (input.includes('失眠') || input.includes('睡不着') || input.includes('睡眠')) {
            return '睡不好确实很难受。建议您：1. 睡前少看手机；2. 喝杯热牛奶；3. 听点轻音乐。如果长期失眠，建议去医院看看哦。';
        }
        
        // 饮食问题
        if (input.includes('吃什么') || input.includes('饮食') || input.includes('食谱')) {
            return '老年人饮食要清淡营养！建议多吃：蔬菜、水果、鱼肉、豆制品。少吃油腻和太咸的食物。要按时吃饭哦！';
        }
        
        // 天气
        if (input.includes('天气') || input.includes('下雨') || input.includes('冷') || input.includes('热')) {
            return '天气变化时要注意保暖哦！出门记得看天气预报，该穿厚衣服就穿，身体最重要。';
        }
        
        // 心情不好
        if (input.includes('心情不好') || input.includes('烦') || input.includes('生气') || input.includes('不开心')) {
            return '别不开心啦！人生不如意十之八九，要学会放下。您这么大年纪了，最重要的是开心健康！';
        }
        
        // 夸奖鼓励
        if (input.includes('真好') || input.includes('谢谢') || input.includes('厉害')) {
            return '嘿嘿，您客气啦！能帮到您我也很开心。有什么需要随时找我哦！';
        }
        
        // ========== 小程序功能帮助 ==========
        
        // 打车功能
        if (input.includes('打车') || input.includes('叫车') || input.includes('出租车') || input.includes('去哪')) {
            return '要打车的话，点击首页的"打车"按钮就可以啦！您可以：\n1. 长按语音说出目的地\n2. 手动输入目的地\n3. 点击快捷目的地（家/医院/超市）\n\n说完后会自动跳转到滴滴打车哦！';
        }
        
        // 缴费功能
        if (input.includes('缴费') || input.includes('交费') || input.includes('电费') || input.includes('水费') || input.includes('网费') || input.includes('话费')) {
            return '要缴费的话，点击首页的"缴费"按钮。里面会显示您的待缴费项目：\n• 电费\n• 水费\n• 网费\n• 话费\n\n您可以语音说"交电费"，或者直接点击缴费按钮，会跳转到对应的小程序里完成缴费。';
        }
        
        // 挂号功能
        if (input.includes('挂号') || input.includes('看病') || input.includes('医院') || input.includes('预约') || input.includes('生病')) {
            return '要挂号看病的话，点击首页的"挂号"按钮。小程序会：\n1. 自动定位您的位置\n2. 显示最近的3家医院\n3. 您可以选择科室（内科、外科、眼科等）\n4. 点击"立即预约"就可以了\n\n您也可以语音说出症状，比如"头疼"，系统会帮您匹配科室。';
        }
        
        // 聊天功能
        if (input.includes('聊天') || input.includes('说话') || input.includes('陪我')) {
            return '您现在就是在和我聊天呀！我是您的老友助手，专门陪您说话的。\n\n您可以：\n• 打字输入\n• 长按"按住说话"按钮说话\n• 跟我聊任何事情\n\n我会一直陪着您的！';
        }
        
        // 紧急求助
        if (input.includes('救命') || input.includes('呼救') || input.includes('紧急') || input.includes('摔倒')) {
            return '如果遇到紧急情况，请：\n1. 点击首页的"呼救"按钮\n2. 系统会自动拨打120急救电话\n3. 或者联系您的紧急联系人\n\n现在就需要帮助吗？要不要现在帮您拨打？';
        }
        
        // 如何使用小程序
        if (input.includes('怎么用') || input.includes('怎么操作') || input.includes('不会用') || input.includes('教我')) {
            return '老友助手很简单的！首页有6个大按钮：\n\n🚕 打车 - 叫出租车\n💰 缴费 - 交水电费\n🏥 挂号 - 预约看病\n💬 问答 - 就是现在这个，陪您聊天\n🆘 呼救 - 紧急求助\n⚙️ 设置 - 调整字体大小\n\n每个功能都支持语音操作，不用打字！您想学哪个功能？';
        }
        
        // 字体调整
        if (input.includes('字太小') || input.includes('看不清') || input.includes('字体') || input.includes('放大')) {
            return '字太小看不清的话，点击首页的"设置"按钮，里面可以调整字体大小。\n\n有三个档位：\n• 小号字体\n• 中号字体（默认）\n• 大号字体\n\n选择适合您的大小就行了！';
        }
        
        // 语音功能
        if (input.includes('语音') || input.includes('说话') || input.includes('录音')) {
            return '小程序支持语音操作！几乎每个页面都有语音按钮（麦克风图标）。\n\n使用方法：\n1. 找到麦克风图标\n2. 长按开始说话\n3. 松开自动识别\n\n比打字方便多了！您试试看？';
        }
        
        // 打招呼
        if (input.includes('你好') || input.includes('在吗') || input.includes('您好')) {
            return '您好呀！我是您的老友助手，很高兴为您服务。有什么需要帮助的吗？';
        }
        
        // 告别
        if (input.includes('再见') || input.includes('拜拜') || input.includes('晚安')) {
            return '好的，您慢走！有需要随时来找我。祝您身体健康，天天开心！';
        }
        
        // 没有匹配到
        return null;
    },
    
    /**
     * 默认回复（兜底）
     */
    getDefaultReply() {
        const defaultReplies = [
            '嗯嗯，我听着呢，您接着说。',
            '是这样啊，我明白了。',
            '说得对！您真有想法。',
            '有道理，您继续说吧。',
            '我在听呢，您慢慢说。',
            '嗯，然后呢？',
            '这个我需要想想，您能再详细说说吗？'
        ];
        return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    },
  
    // 添加AI回复到对话列表
    addAIReply(content) {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        content: content,
        time: time
      };
      
      // 动态生成新的底部ID，确保触发滚动
      const newBottomId = 'bottom-' + Date.now();
      
      this.setData({
        chatList: this.data.chatList.concat([aiMsg]),
        bottomId: newBottomId,
        scrollIntoView: newBottomId
      });
    },
  
    // ========== 输入框交互逻辑 ==========
    // 输入框内容变化
    onInputChange(e) {
      this.setData({ inputContent: e.detail.value });
    },
  
    // 发送消息（点击发送/回车触发）
    sendMessage() {
      // 空内容不发送
      if (!this.data.inputContent.trim()) return;
  
      app.playText('发送');

      // 构造用户消息
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      const userMsg = {
        id: Date.now(),
        sender: 'user',
        content: this.data.inputContent,
        time
      };
  
      // 动态生成新的底部ID，确保触发滚动
      const newBottomId = 'bottom-' + Date.now();

      // 更新对话列表 + 清空输入框 + 滚动到底部
      this.setData({
        chatList: this.data.chatList.concat([userMsg]),
        inputContent: '',
        bottomId: newBottomId,
        scrollIntoView: newBottomId
      });
  
      // 调用AI回复
      this.getAIReply(userMsg.content);
    },
  
    // ========== 语音输入功能 ==========
    // 开始录音（长按说话按钮）
    startRecord() {
        this.setData({ isRecording: true });
        console.log('陪聊页面：开始录音');
        
        wx.showToast({
            title: '正在录音...',
            icon: 'none',
            duration: 60000
        });
        
        const voiceUtil = require('../../utils/voice.js');
        voiceUtil.startRecord();
    },
  
    // 停止录音（松开说话按钮）
    stopRecord() {
        this.setData({ isRecording: false });
        console.log('陪聊页面：停止录音');
        
        wx.hideToast();
        
        const voiceUtil = require('../../utils/voice.js');
        voiceUtil.stopRecord();
        
        // 等待录音文件生成后上传识别
        setTimeout(() => {
            voiceUtil.recognizeAudio(
                (text) => {
                    // 识别成功，将文字填入输入框
                    if (text && text.trim() !== '') {
                        this.setData({ inputContent: text });
                        console.log('识别到对话：', text);
                        
                        // 自动发送消息
                        setTimeout(() => {
                            this.sendMessage();
                        }, 500);
                    } else {
                        wx.showToast({
                            title: '没听清，再说一遍',
                            icon: 'none'
                        });
                    }
                },
                (err) => {
                    console.error('识别失败:', err);
                    wx.showToast({
                        title: '识别失败，请重试',
                        icon: 'none'
                    });
                }
            );
        }, 300);
    },
  
    // 切换孙子音色
    switchVoiceType() {
      const newType = this.data.currentVoiceType === 'normal' ? 'grandson' : 'normal';
      this.setData({ currentVoiceType: newType });
      
      const msg = `已${newType === 'grandson' ? '开启' : '关闭'}孙子音色`;
      app.playText(msg);

      wx.showToast({
        title: msg,
        icon: 'none'
      });
    },
  
    // 切换节日祝福模式
    enterFestivalMode() {
      this.setData({ isFestivalMode: !this.data.isFestivalMode });
      
      const msg = `已${this.data.isFestivalMode ? '开启' : '关闭'}节日祝福模式`;
      app.playText(msg);

      wx.showToast({
        title: msg,
        icon: 'none'
      });
    }
  })
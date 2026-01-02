// help.js
const app = getApp();
Page({
    data: {
      fontSizes: {},
      // 常见问题列表
      faqList: [
        {
          id: 1,
          question: '如何使用语音打车？',
          answer: '1. 点击首页"打车"按钮\n2. 长按语音按钮说出目的地\n3. 确认后自动跳转打车应用\n4. 目的地已自动复制，如未填写可长按粘贴',
          expanded: false
        },
        {
          id: 2,
          question: '如何缴纳生活费用？',
          answer: '1. 点击首页"缴费"按钮\n2. 查看待缴费项目列表\n3. 点击要缴费的项目\n4. 确认后跳转到对应的缴费小程序\n5. 账户和金额已复制，可直接粘贴',
          expanded: false
        },
        {
          id: 3,
          question: '如何预约挂号？',
          answer: '1. 点击首页"挂号"按钮\n2. 系统自动定位显示最近3家医院\n3. 选择需要就诊的科室\n4. 可以语音说症状自动匹配科室\n5. 点击"立即预约"完成挂号',
          expanded: false
        },
        {
          id: 4,
          question: '语音识别听不懂我说话怎么办？',
          answer: '可以尝试：\n1. 说话清晰缓慢一些\n2. 在安静环境下录音\n3. 录音时间保持2秒以上\n4. 到设置中更换方言识别\n5. 使用手动输入功能',
          expanded: false
        },
        {
          id: 5,
          question: '如何调整字体大小？',
          answer: '1. 点击首页"设置"按钮\n2. 找到"字体大小"选项\n3. 选择标准、大号或超大号\n4. 点击"保存设置"按钮\n5. 所有页面字体会同步调整',
          expanded: false
        },
        {
          id: 6,
          question: '如何更换方言识别？',
          answer: '1. 点击首页"设置"按钮\n2. 找到"方言选择"选项\n3. 选择您的方言（粤语、四川话、东北话等）\n4. 点击"保存设置"\n5. 语音识别将使用您选择的方言',
          expanded: false
        },
        {
          id: 7,
          question: '紧急情况如何求助？',
          answer: '1. 点击首页"呼救"按钮\n2. 系统自动拨打120急救电话\n3. 或联系您设置的紧急联系人\n4. 可在"我的"页面设置紧急联系人',
          expanded: false
        },
        {
          id: 8,
          question: '如何使用智能问答功能？',
          answer: '1. 点击首页"问答"按钮\n2. 可以打字输入或长按语音输入\n3. 支持闲聊、情感陪伴\n4. 也可以咨询小程序使用方法\n5. 系统会智能回复您的问题',
          expanded: false
        },
        {
          id: 9,
          question: '如何设置紧急联系人？',
          answer: '1. 点击底部导航栏"我的"\n2. 选择"紧急联系人"菜单\n3. 点击"添加联系人"按钮\n4. 输入亲友的姓名和电话\n5. 点击保存即可，紧急时刻可一键呼叫',
          expanded: false
        },
        {
          id: 10,
          question: '如何使用一键呼救功能？',
          answer: '1. 在首页点击红色的"一键呼救"按钮\n2. 系统会立即倒计时（防止误触）\n3. 倒计时结束自动拨打120\n4. 同时自动发送您的位置短信给紧急联系人',
          expanded: false
        },
        {
          id: 11,
          question: '如何发送我的位置给联系人？',
          answer: '1. 在聊天或紧急求助页面\n2. 点击"发送位置"按钮\n3. 系统会自动定位您当前的位置\n4. 确认发送后，对方即可收到您的具体位置信息',
          expanded: false
        },
        {
          id: 12,
          question: '如何修改个人资料和头像？',
          answer: '1. 进入"我的"页面\n2. 点击顶部的个人信息卡片\n3. 点击头像可更换照片\n4. 修改昵称、年龄等信息\n5. 点击保存更新您的个人资料',
          expanded: false
        },
        {
          id: 13,
          question: '如何使用语音输入功能？',
          answer: '1. 在输入框旁边找到"按住说话"按钮\n2. 按住按钮不放，开始说话\n3. 说完后松开手指\n4. 系统会自动将您的语音转换成文字发送',
          expanded: false
        }
      ]
    },
  
    onLoad() {
      console.log('帮助中心加载');
    },
   
    onShow() {
        this.calcFontSizes();
        app.playText('使用帮助');
    },
    
    calcFontSizes() {
        this.setData({
          fontSizes: {
            title: app.calcFontSize('title'),
            content: app.calcFontSize('content'),
            button: app.calcFontSize('button'),
            time: app.calcFontSize('time')
          }
        });
    },
    
    /**
     * 展开/折叠问题答案
     */
    toggleFAQ(e) {
      const faqId = e.currentTarget.dataset.id;
      const faqList = this.data.faqList.map(function(item) {
        if (item.id === faqId) {
          const newState = !item.expanded;
          if (newState) {
            app.playText(item.question);
          }
          return Object.assign({}, item, { expanded: newState });
        }
        return item;
      });
      this.setData({ faqList: faqList });
    },

    // 显示联系信息
    showContactInfo() {
      app.playText('联系我们');
      wx.showModal({
        title: '联系我们',
        content: '如有其他问题，请联系"啊对对队"我们会在24小时内回复您。',
        showCancel: false,
        confirmText: '知道了'
      });
    }
  });
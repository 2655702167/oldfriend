// const app = getApp();
// Component({
//     properties: {
//       // 图标路径
//       icon: {
//         type: String,
//         value: ''
//       },
//       // 费用名称（水费/电费）
//       name: {
//         type: String,
//         value: ''
//       },
//       // 金额（如¥85.60）
//       amount: {
//         type: String,
//         value: ''
//       },
//       // 左侧边框颜色
//       borderColor: {
//         type: String,
//         value: '#ccc'
//       },
//       // 按钮背景色
//       btnBgColor: {
//         type: String,
//         value: '#ccc'
//       }
//     },
//     data:{
//         fontSizes:{}
//     },
//     lifetimes:{
//         attached(){
//             this.calcFontSizes();
//         },
//         show(){
//             this.calcFontSizes();
//         }
//     },
//     methods: {
//         calcFontSizes(){
//             this.setData({
//                 fontSizes:{
//                     title:app.calcFontSize('title'),
//                     content:app.calcFontSize('content'),
//                     button:app.calcFontSize('button'),
//                     time:app.calcFontSize('time')
//                 }
//             })
//         }
//       }
//   })


const app = getApp();
Component({
  properties: {
    // 图标路径
    icon: {
      type: String,
      value: ''
    },
    // 费用名称（水费/电费）
    name: {
      type: String,
      value: ''
    },
    // 金额（如¥85.60）
    amount: {
      type: String,
      value: ''
    },
    // 左侧边框颜色
    borderColor: {
      type: String,
      value: '#ccc'
    },
    // 按钮背景色
    btnBgColor: {
      type: String,
      value: '#ccc'
    }
  },
  data: {
    fontSizes: {},
    showSuccessModal: false, // 缴费成功弹窗显示状态
    isPaid: false // 是否已缴费（控制欠费标签/金额隐藏）
  },
  lifetimes: {
    attached() {
      this.calcFontSizes();
    },
    show() {
      this.calcFontSizes();
    }
  },
  methods: {
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
    // 立即缴费按钮点击事件
    handlePay() {
      // 1. 显示缴费成功弹窗
      this.setData({ showSuccessModal: true });
      
      // 2. 3秒后自动关闭弹窗
      this.timer = setTimeout(() => {
        this.setData({ showSuccessModal: false });
        // 3. 弹窗关闭后，标记为已缴费（隐藏欠费标签和金额）
        this.setData({ isPaid: true });
      }, 3000);
    },
    // 手动关闭弹窗
    closeModal() {
      clearTimeout(this.timer); // 清除自动关闭定时器
      this.setData({ 
        showSuccessModal: false,
        isPaid: true // 手动关闭也标记已缴费
      });
    }
  },
  // 组件销毁时清除定时器，避免内存泄漏
  detached() {
    clearTimeout(this.timer);
  }
});
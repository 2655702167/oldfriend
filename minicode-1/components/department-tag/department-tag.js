const app = getApp();
Component({
    properties: {
      name: {
        type: String,
        value: ""
      },
      isActive: {
        type: Boolean,
        value: false
      }
    },
    data:{
        fontSizes:{}
    },
    lifetimes:{
        attached(){
            this.calcFontSizes();
        },
        show(){
            this.calcFontSizes();
        }
    },

    methods: {
      onTagTap() {
        // 向父页面传递点击事件，携带科室名称
        this.triggerEvent('tagtap', {
          name: this.data.name
        });
      },
      calcFontSizes(){
          this.setData({
              fontSizes:{
                  title:app.calcFontSize('title'),
                  content:app.calcFontSize('content'),
                  button:app.calcFontSize('button'),
                  time:app.calcFontSize('time')
              }
          })
      }
    }
  })
// pages/smartcard/smartcard.js
//获取应用实例
var comm=require('../../utils/comm_util.js')
const app = getApp()
let animationShowHeight = 300; 
var _animation = wx.createAnimation({
  duration: 200,
  timingFunction: 'linear',
  delay: 0
})
Page({

  /**
   * 页面的初始数据
   */
  data: {
    animationData: "",
    showModalStatus: false,
    currentSeedId:''  ,
    currentwifiName:'',
    currentwifiPassWord:'',
    cards:[
      { '_type': 0, 'cardUser': '456543245', 'cardWiFiName': 'ASUS_A4_5G', 'createDate': '20180309', 'cardWiFiPassword': '12345678', 'AID': 'F223344556' },
      { '_type': 0, 'cardUser': '676435677', 'cardWiFiName': 'CMCC-WiFi6', 'createDate': '20180309', 'cardWiFiPassword': '12345678', 'AID': 'F223344556' },

    ],
    motto: '请刷卡获取路由器端NFC信息',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    mode:'scaleToFill',
    src:'../Resource/nfcead.jpg',
    nfcdatacopyflag: 0,
    payload:{},
    tnf:{},
    type:{},
    tnf:{},
    id:{},
    myrecords : [],
    btnname:"恢复"
  },

  nfc: null,

  /**
   * 生命周期函数--监听页面加载
   */

  discoverHandler: function(res){
    const nfc = this.nfc
    var that = this

    let payload = that.payload
    let tnf = that.tnf
    let type = that.type
    let id = that.id
 
    const testrecords = [{payload,tnf,type,id}]

   if (res.techs.includes(nfc.tech.ndef)) {
     console.log('接受NFC数据:',res.messages)
     var ndef = nfc.getNdef()
     
     wx.showToast({
      title: "路由器信息已获取",
      icon: 'none'
    })


     ndef.connect({
       success:function(){
         console.log("connect success")
         //写数据
         if (app.globalData.nfcdatacopyflag == 1){
           ndef.writeNdefMessage({
             records: testrecords,
             complete(res) {
               console.log('res:', res)
               ndef.close();
               if(res.errMsg == "writeNdefMessage:ok"){
                 app.globalData.nfcdatacopyflag = 0
                 that.setData({
                  motto: "数据写入成功",
                })
               }
               else{
                that.setData({
                  motto: "写入NFC失败，请重刷",
                })
               }
             }
           })

         }else{
           
          //保存数据
           //app.globalData.nfcdatacopyflag = 1
           that.payload = res.messages[0].records[0].payload
           that.tnf = res.messages[0].records[0].tnf
           that.type = res.messages[0].records[0].type
           that.id = res.messages[0].records[0].id

           var payloadHex = comm.ab2hex(that.payload)
           console.log("payloadHex",payloadHex)

           const unit8Arr = new Uint8Array(that.payload)

           console.log("unit8Arr:",unit8Arr)
           console.log("unit8Arr[0]:",unit8Arr[0])

           console.log("payload:",that.payload)

           for (var i = 0; i <(unit8Arr.length-1); i++) {
            if(unit8Arr[i]== 0x10&&(unit8Arr[i+1] == 0x45)){
                let WifiNameLength = unit8Arr[i+3]
                console.log("WifiNameLength:",WifiNameLength)
                const WiFiNamenewBuffer = that.payload.slice(i+4, WifiNameLength+i+4)
                console.log("WiFiNamenewBuffer:",WiFiNamenewBuffer)
                const unit8Arr_currentwifiName = new Uint8Array(WiFiNamenewBuffer)
                that.data.currentwifiName = comm.byteToString(unit8Arr_currentwifiName)
                console.log("that.data.currentwifiName :",that.data.currentwifiName)
                console.log("test ","1111")

           }
            else if((unit8Arr[i]== 0x10)&&(unit8Arr[i+1]== 0x27)){
                 let WifiPasswordLength = unit8Arr[i+3]
                 console.log("WifiPasswordLength:",WifiPasswordLength)
                 const WiFiPassWordnewBuffer = that.payload.slice(i+4, WifiPasswordLength+i+4)
                 console.log("WiFiPassWordnewBuffer:",WiFiPassWordnewBuffer)
                 const unit8Arr_currentwifiPassWord = new Uint8Array(WiFiPassWordnewBuffer)
                that.data.currentwifiPassWord = comm.byteToString((unit8Arr_currentwifiPassWord))
                console.log("that.data.currentwifiPassWord:",that.data.currentwifiPassWord)
            
             }
            }
            
            genRandomSeed(that, 8)
            that.addCard()


           console.log("2222",res.messages[0].records)

           that.setData({
            motto: "路由器信息已获取，请刷卡",
          })
         }
       },
       complete:function(){
         if (app.globalData.nfcdatacopyflag == 1){
           console.log("complete")
          // nfc.stopDiscovery();
         }
       }
     })
   }
   if (res.techs.includes(nfc.tech.nfcF)) {
     const nfcF = nfc.getNfcF()
     console.log("nfcF",nfcF)
     nfcF.connect({
      success:function(){
        nfcF.transceive({
          data: new ArrayBuffer(0),
          complete(res) {
            console.log('res:', res)
          }
        })
      }
    })
     
     return
   }
 },

  onLoad: function (options) {

    var temp = "N"+comm.genRandom(8)
    var temp2 = "N"+comm.genRandom(8)


    var c=this.data.cards[0]
    wx.setStorageSync(c.cardUser, c)
    var c=this.data.cards[1]
    wx.setStorageSync(c.cardUser, c)

    // const nfc = wx.getNFCAdapter()
    // this.nfc = nfc
    // nfc.onDiscovered(this.discoverHandler)
    // nfc.startDiscovery({
    //   fail(err) {
    //     console.log('failed to discover:', err)
    //   }
    // })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // var nfc = this.nfc
    // nfc.onDiscovered(this.discoverHandler)
    // nfc.startDiscovery({
    //   fail(err) {
    //     console.log('failed to discover:', err)
    //   }
    // })
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // console.log("onHode")
    // var nfc = this.nfc
    // nfc.stopDiscovery();
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  addmengjing:function(event){
    console.log('添加智能卡片')
    genRandomSeed(this, 8)
    this.animation = _animation
    console.log('animationShowHeight=', animationShowHeight)
    _animation.translateY(animationShowHeight).step()
    this.setData({
      animationData: _animation.export(),
      showModalStatus: true,
    })
    setTimeout(function () {
      _animation.translateY(0).step()
      this.setData({
        animationData: _animation.export()
      })
    }.bind(this), 200)
  },
  /**
   * 生成指定长度随机编号
   */
  genRandomSeed:function(event){
    genRandomSeed(this,8)
  },
  //关闭浮动窗
  _close: function (event) {
    this.closeOptModal()
  },
  closeOptModal() {
    this.animation = _animation;
    _animation.translateY(animationShowHeight).step()
    this.setData({
      animationData: _animation.export(),
    })
    setTimeout(function () {
      _animation.translateY(0).step()
      this.setData({
        animationData: _animation.export(),
        showModalStatus: false
      })
    }.bind(this), 200)
  },
  /**
   * 添加公交卡
   */
  addgongjiao:function(event){

  },
  /**
   * 卡信息输入
   */
  inputCardInfo:function(event){
    console.log(event)
    var inputType = event.currentTarget.dataset.inputtype
    var value=event.detail.value
    if (inputType ==='wifiName'){
      this.setData({
        currentwifiName: value
      })
    } else if (inputType === 'wifiPassWord'){
      this.setData({
        currentwifiPassWord: value
      })
    }
  },

  /**
   * 添加
   */
  addCard:function(event){
    var currentSeedId=this.data.currentSeedId
    var currentwifiName=this.data.currentwifiName
    var currentwifiPassWord=this.data.currentwifiPassWord
    var msg=''
    if (currentwifiName.length<=0){
      msg = '请输入WiFi账号'
    }
    if (currentwifiPassWord.length<=0){
      msg = '请输入WiFi密码'
    }
    if(msg.length>0){
      wx.showToast({
        title: msg,
        icon: 'none'
      })
      return
    }
    var cardbean = { '_type': 0, 'cardUser': currentSeedId, 'cardWiFiName': currentwifiName, 'createDate': '20219999', 'cardWiFiPassword':  currentwifiPassWord, 'AID': 'F223344556'}

    wx.setStorageSync(cardbean.cardUser, cardbean)
    this.data.cards.push(cardbean)
    this.setData({
      cards: this.data.cards
    })
    this.closeOptModal()
  },
  /**
   * 选择hce卡
   */

  delcard:function(event){
    // var card = event.currentTarget.dataset.cardbean
    // console.log('card->', card)
    // this.data.cards.del(card)
    // this.setData({
    //   cards: this.data.cards
    // })
  },


  emvcard:function(event){
    var card = event.currentTarget.dataset.cardbean
    console.log('card->', card)
    wx.navigateTo({
      url: '../hce/hcecard?cardkey=' + card.cardUser,
    })
  }
})
function genRandomSeed(context,length){
  var seed = "N"+comm.genRandom(length)
  console.log("seed=" + seed)
  context.setData({
    currentSeedId: seed
  })
}
// pages/hce/hcecard.js
var comm = require('../../utils/comm_util.js')
var NfcHCECore = require('../../utils/nfc_hce_core.js')
var app=getApp()
var msg=''
var countdown = 120;
var timer=null
var settime = function (that) {
  if (countdown == 0) {
    wx.navigateBack({
      
    })
    return;
  } else {
    that.setData({
      last_time: countdown
    })
    countdown--;
  }
  timer=setTimeout(function () {
    settime(that)
  }, 1000)
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentCard:null,
    content:'',
    last_time: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onLoad")
    var cardKey = options.cardkey
    console.log("cardKey:",cardKey)
    var cardbean=wx.getStorageSync(cardKey)
    console.log('cardbean=' ,cardbean)
    this.setData({
      currentCard: cardbean
    })
    wx.setNavigationBarTitle({
      title: "路由器NFC信息：WiFi名称-"+cardbean.cardWiFiName,
    })
    this.nfcHCECore = new NfcHCECore(this, [cardbean.AID], this.onOptMessageCallBack.bind(this), this.onHCEMessageCallBack.bind(this))
    console.log("-->initNFCHCE")
    this.nfcHCECore.simple()
  },

  /**
   * hce操作相关回调
   */
  onOptMessageCallBack(code, _msg) {
    console.log('onOptMessageCallBack')
    if (code === 0) {
      console.log("执行成功！", _msg)
    } else {
      msg = msg + '执行失败code=' + code + ",msg=" + _msg + '\n'
    }
    this.setData({
      content: msg
    })
    this.resetTime()
  },
  resetTime(){
    clearTimeout(timer)
    countdown=120
    this.setData({
      last_time:'120'
    })
    settime(this)
  },
  /**
   * 收到读卡器发送指令
   */
  onHCEMessageCallBack(messageType, reason, hexData) {
    var that = this
    console.log('onHCEMessageCallBack')
    console.log("有读卡器读我,messageType=", messageType)
    if (messageType == 1) {
      msg = msg + "有读卡器读我,数据包:" + hexData + '\n'
      that.setData({
        content: msg
      })
      this.sendDataPackage()
      wx.vibrateShort({
        type:"medium"
      }
      )
    }
    this.resetTime()
  },
  /**
   * 发送数据及包
   */
  sendDataPackage() {
    var cardbean = this.data.currentCard
    console.log(comm.pad(2, 2))
    //组装TLV数据包
    var header = '00A40400'

    var hexCardUser = comm.stringToHex('test')
    hexCardUser = plusZero(hexCardUser)
    console.log('补零：' + hexCardUser)
    console.log('cardUser=>', cardbean.cardUser,';hexCardUser=>' + hexCardUser)
    console.log('还原xCardUser:',comm.hexToString(hexCardUser))
    var userTag = '1F01'
    console.log("cardUser.length:",hexCardUser.length)
    var len = comm.stringToHex(comm.pad((hexCardUser.length / 2), 2))
    console.log("hexCacardName.len",len)
    var cmduser = userTag + len + hexCardUser
    console.log('cmduser.TVL=>' + cmduser)

    var hexCardWiFiName = comm.stringToHex(cardbean.cardWiFiName)
    hexCardWiFiName = plusZero(hexCardWiFiName)
    console.log('hexCardWiFiName=>', cardbean.cardWiFiName,';hexCardWiFiName=>' + hexCardWiFiName)
    console.log('还原xCardWiFiName:', comm.hexToString(hexCardWiFiName))
    var CardWiFiNameTag = '5F01'
    console.log("hexCardWiFiName.length:",hexCardWiFiName.length)
    len = comm.stringToHex(comm.pad((hexCardWiFiName.length / 2), 2))
    console.log("hexCardWiFiName.len",len)
    var cmdWiFiName = CardWiFiNameTag + len + hexCardWiFiName
    console.log('cmdNo.TVL=>' + cmdWiFiName)

    var hexCreateDate = comm.stringToHex(cardbean.createDate)
    hexCreateDate = plusZero(hexCreateDate)
    console.log('hexCreateDate=>' + hexCreateDate)
    var createDateTag = '5F02'
    len = comm.stringToHex(comm.pad((hexCreateDate.length / 2), 2))
    console.log("hexCreateDate.len",len)
    var cmdDate = createDateTag + len + hexCreateDate
    console.log('cmdDate.TVL=>' + cmdDate)

    var hexCardWiFiPassword = comm.stringToHex(cardbean.cardWiFiPassword)
    hexCardWiFiPassword = plusZero(hexCardWiFiPassword)
    console.log('hexCardWiFiPassword=>' + hexCardWiFiPassword)
    var hexCardWiFiPasswordTag = '9F01'
    console.log("hexCardWiFiPassword.length:",hexCardWiFiPassword.length)
    len = comm.stringToHex(comm.pad((hexCardWiFiPassword.length / 2), 2))
    console.log("hexCardWiFiPassword.len",len)
    var cmdCardWiFiPassword = hexCardWiFiPasswordTag + len + hexCardWiFiPassword
    console.log('cmdExp.TVL=>' + cmdCardWiFiPassword)
    

    len = comm.stringToHex(((cmduser.length + cmdWiFiName.length + cmdDate.length + cmdCardWiFiPassword.length)/2).toString())
    
    console.log('len='+len)
    var status="9000"
    var sendcmd = (header + len + cmduser + cmdWiFiName + cmdDate + cmdCardWiFiPassword + status).toUpperCase()
    msg = msg + "卡片返回读卡器指令：" + sendcmd+ '\n'
    this.setData({
      content: msg
    })
    this.nfcHCECore.sendNfcHCEMessage(sendcmd)
  },

  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onReady")
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.resetTime()
    console.log("onShow")
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("onHide")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.resetTime()
    console.log("stopHCE")
    _stopHCE()
    setTimeout(function() {
      console.log('我是xx')
    }, 1000);
    console.log("onUnload")
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

  btnclean:function(event){
    msg = ""
    this.setData({
      content: ""
    })
    this.nfcHCECore.stopNfcHCE()
  //  _stopHCE()
  }
  

})



/**
 * 仅在安卓系统下有效。
 */
function _stopHCE() {
  console.log("-->stopHCE")

  wx.getHCEState({
    success (res) {
      console.log(res.errCode)
    },
    fail (res) {
      console.log(res.errCode)
    },
  })
  
  wx.offHCEMessage()

  wx.stopHCE({
    success: function (res) {
      console.log(res)
    },
    fail: function (err) {
      console.error(err)
    }
  })
}
//补零
function plusZero(_str) {
  while (_str.length % 2 != 0){
    _str += "0"
  }
  return _str
}

/**
 * Created by zaygeegee on 16/4/11.
 */

const electron = require('electron')
const terminate = global.terminate
const dialog = electron.dialog
const URL = require('url')
const request = require('request')

function MessageManager (qrManager) {
  this.qrManager = qrManager
  this.ClientMsgId = new Date().valueOf
}

// 状态同步
MessageManager.prototype._statusNotify = function (cb, ecb) {
  var self = this
  var url = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify?lang=zh_CN'
  if (self.qrManager.baseKey.pass_ticket) {
    url += '&pass_ticket=' + self.qrManager.baseKey.pass_ticket
  }
  this.qrManager.httpJson(url, {
    BaseRequest: this.qrManager._baseRequest(),
    Code: 3,
    FromUserName: this.qrManager.User.UserName,
    ToUserName: this.qrManager.User.UserName,
    ClientMsgId: this.ClientMsgId++
  }, {
    Referer: 'https://wx.qq.com/'
  }, function (j) {
    if (j.BaseResponse.Ret === 0) {
      console.log('syncNotify Success!')
      cb && cb()
    } else {
      console.log('syncNotify failed', j)
      ecb && ecb()
    }
  }, ecb)
}

// 获取联系人列表
MessageManager.prototype._getContact = function (cb, ecb) {
  var self = this
  var url = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&r=' + new Date().valueOf() + '&seq=0&skey=' + self.qrManager.baseKey.skey
  if (self.qrManager.baseKey.pass_ticket) {
    url += '&pass_ticket=' + self.qrManager.baseKey.pass_ticket
  }
  this.qrManager.httpGet(url, {
    Referer: 'https://wx.qq.com/'
  }, function (r) {
    var j = JSON.parse(r)
    if (j.BaseResponse.Ret === 0) {
      console.log('friend#' + j.MemberCount)
      cb && cb()
    } else {
      ecb && ecb()
    }
  }, ecb)
}

// 消息轮询
MessageManager.prototype._syncCheck = function (cb, ecb) {
  var url = 'https://webpush.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck?r=' + new Date().valueOf() + '&skey=' + this.qrManager.baseKey.skey + '&sid=' + this.qrManager.baseKey.wxsid + '&uin=' + this.qrManager.baseKey.wxuin + '&deviceid=' + this.qrManager.deviceid + '&synckey=' + this.qrManager.SyncKey.List.map(function (obj) {
        return obj.Key + '_' + obj.Val
      }).join('|') + '&_=' + new Date().valueOf()
  this.qrManager.httpGet(url, {
    Referer: 'https://wx.qq.com/?&lang=zh_CN'
  }, function (d) {
    console.log(d.toString())
    var window = {
      synccheck: null
    }
    eval(d.toString())
    cb && cb(window.synccheck)
  }, ecb)
}

// 获取消息
MessageManager.prototype._webWxSync = function (cb) {
  var self = this
  var url = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=' + self.qrManager.baseKey.wxsid + '&skey=' + self.qrManager.baseKey.skey + '&lang=zh_CN&pass_ticket=' + self.qrManager.baseKey.pass_ticket
  var data = {
    rr: ~new Date(),
    SyncKey: self.qrManager.SyncKey,
    BaseRequest: self.qrManager._baseRequest()
  }
  var headers = {
    'Host': URL.parse(url).host,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
    'Referer': 'https://wx.qq.com/?&lang=zh_CN'
  }
  var req = request.defaults({
    jar: this.jar
  })
  return req({
    method: 'POST',
    url: url,
    json: true,
    headers: headers,
    body: data,
    timeout: 2000
  }, function (err, res, body) {
    if (err || parseInt(res.statusCode) / 100 === 4 || parseInt(res.statusCode) / 100 === 5 || !body) {
      console.log('timeout')
    } else {
      var json = body
      if (json.BaseResponse.Ret === 0) {
        self.qrManager.SyncKey = json.SyncKey
        json.AddMsgList.forEach(function (msg) {
          cb && cb(msg)
        })
      } else {
        console.log(json.BaseResponse.ErrMsg)
      }
    }
  })
}

MessageManager.prototype.send = function (to, content) {
  var self = this
  if (to === this.qrManager.User.UserName) {
    return
  }
  (function (to, content) {
    self.qrManager.httpJson('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?pass_ticket=' + self.qrManager.baseKey.pass_ticket, {
      BaseRequest: self.qrManager._baseRequest(),
      Msg: {
        Type: 1,
        Content: content,
        FromUserName: self.qrManager.User.UserName,
        LocalID: this.ClientMsgId++,
        ToUserName: to,
        ClientMsgId: this.ClientMsgId
      }
    }, {
      'Referer': 'https://wx.qq.com/?&lang=zh_CN'
    }, function (j) {
      // console.log(j)
    })
  })(to, content)
}

// 同步手机消息等等等等...
MessageManager.prototype.init = function (cb, ecb) {
  var self = this
  console.log('开始同步状态')
  self._statusNotify(function () {
    console.log('同步状态成功')
    /*
     console.log('开始获取联系人')
     self._getContact(function () {

     }, function () {
     console.log('friend !null!')
     })
     */
    cb()
  }, function () {
    dialog.showMessageBox({
      type: 'error',
      title: '登录超时',
      message: '该账号已经登录超时, 请重新扫码登录',
      buttons: ['好的我知道了']
    })
    terminate()
  })
}

// 数据监测l
MessageManager.prototype.listener = function (cb) {
  var self = this
  var func = function () {
    self._syncCheck(function (res) {
      if (res.retcode === '0') {
        switch (res.selector) {
          default:
          case '0':
          case '7':
            break
          case '2':
          case '6':
            console.log('有新消息')
            self._webWxSync(cb)
            break
        }
        console.log('等待新的轮询')
      } else {
        // 退出
        dialog.showErrorBox('离线', '你的账号被离线!')
        terminate()
      }
    })
  }
  func()
  setInterval(func, 3000)
}

module.exports = MessageManager


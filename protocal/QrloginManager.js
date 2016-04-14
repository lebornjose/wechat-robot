/**
 * Created by zaygeegee on 16/4/11.
 */

const path = require('path')
const URL = require('url')
const fs = require('fs')
const request = require('request')
const FileCookieStore = require('tough-cookie-filestore')
const DOMParser = require('xmldom').DOMParser
const root_path = path.dirname(require.main.filename)

function QrloginManager () {
  this.appid = 'wx782c26e4c19acffb'
  this.deviceid = 'e300429122309842'
  this.jar = request.jar(new FileCookieStore(root_path + '/cookie'))

  this.uuid = ''
  this.loginicon_times = 0
  this.tip = 1
  this.userAvatar = null
  this.baseKey = {
    ret: null,
    message: null,
    skey: '',
    wxsid: '',
    wxuin: '',
    pass_ticket: null,
    isgrayscale: null
  }
  this.SyncKey = {}
  this.User = {}

  // 解析cookie中的字段到baseKey
  var cookiestring = this.jar.getCookieString('https://wx.qq.com')
  // wxuin, wxsid
  var mt = /wxuin=(.+?);/.exec(cookiestring)
  if (mt) {
    this.baseKey.wxuin = mt[1]
  }
  mt = /wxsid=(.+?);/.exec(cookiestring)
  if (mt) {
    this.baseKey.wxsid = mt[1]
  }
  console.log('解析得到cookie中的wxuin,wxsid')

  this._logout()
}

// post
QrloginManager.prototype.httpJson = function (url, data, hs, cb, ecb) {
  var headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Host': URL.parse(url).host,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0'
  }
  for (var k in hs) {
    headers[k] = hs[k]
  }
  var req = request.defaults({
    jar: this.jar
  })
  return req.post({
    method: 'POST',
    url: url,
    json: true,
    headers: headers,
    body: data
  }, function (err, res, body) {
    if (err || parseInt(res.statusCode) / 100 === 4 || parseInt(res.statusCode) / 100 === 5 || !body) {
      ecb && ecb()
    } else {
      cb && cb(body)
    }
  })
}

QrloginManager.prototype.httpPost = function (url, data, hs, cb, ecb) {
  var headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': URL.parse(url).host,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0'
  }
  for (var k in hs) {
    headers[k] = hs[k]
  }
  var req = request.defaults({
    jar: this.jar
  })
  return req.post({
    method: 'POST',
    url: url,
    headers: headers,
    form: data
  }, function (err, res, body) {
    if (err || parseInt(res.statusCode) / 100 === 4 || parseInt(res.statusCode) / 100 === 5 || !body) {
      ecb && ecb()
    } else {
      cb && cb(body)
    }
  })
}

QrloginManager.prototype.httpGet = function (url, hs, cb, ecb) {
  var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
    'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Connection': 'keep-alive',
    'Host': URL.parse(url).host
  }
  for (var k in hs) {
    headers[k] = hs[k]
  }
  var req = request.defaults({
    jar: this.jar
  })
  return req({
    method: 'GET',
    url: url,
    headers: headers,
    encoding: null
  }, function (err, res, body) {
    if (err || parseInt(res.statusCode) / 100 === 4 || parseInt(res.statusCode) / 100 === 5) {
      ecb && ecb()
    } else {
      cb && cb(body)
    }
  })
}

// 解析window对象属性
QrloginManager.prototype._parseWindow = function (d) {
  d = d.toString()
  var window = {
    code: null,
    redirect_uri: null,
    userAvatar: null,
    QRLogin: {}
  }
  eval(d)
  return window
}

// 获取二维码标识符
QrloginManager.prototype._jslogin = function (cb, ecb) {
  var self = this
  self.httpGet('https://login.weixin.qq.com/jslogin?appid=' + self.appid + '&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=' + new Date().valueOf(), {
    'Referer': 'https://wx.qq.com/?&lang=zh_CN'
  }, function (raw) {
    // window.QRLogin.code = 200; window.QRLogin.uuid = "YccSVwREQQ==";
    var window = self._parseWindow(raw)
    if (window.QRLogin.code === 200) {
      self.uuid = window.QRLogin.uuid
      console.log('uuin:' + self.uuid)
      cb && cb()
    } else {
      ecb && ecb()
    }
    cb && cb(window)
  }, ecb)
}

// 获取二维码
QrloginManager.prototype._qrcode = function (cb, ecb) {
  var self = this
  self.httpGet('https://login.weixin.qq.com/qrcode/' + self.uuid, {
    'Referer': 'https://wx.qq.com/?&lang=zh_CN'
  }, function (raw) {
    cb && cb(raw.toString('base64'))
  }, ecb)
}

// 二维码扫描状态  cb (状态吗)
QrloginManager.prototype._loginicon = function (cb, ecb) {
  var self = this
  self.loginicon_times++
  self.httpGet('https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid=' + self.uuid + '&tip=' + self.tip + '&r=-52755820&_=1460341635430', {
    'Referer': 'https://wx.qq.com/?&lang=zh_CN'
  }, function (raw) {
    if (self.baseKey.ret !== null) {
      return
    }
    var window = self._parseWindow(raw)
    // window.code = 201 确认扫描 200 确认登录 400 fail  408 没有扫描
    cb && cb(window)
    if (self.loginicon_times < 12 && (window.code === 408 || window.code === 201)) {
      // 201: userAvatar
      if (window.code === 201) {
        self.tip = 0
        self.userAvatar = window.userAvatar
      }
      self._loginicon(cb, ecb)
    } else if (window.code === 200) {
      // 200: redirect_uri
      self.httpGet(window.redirect_uri + '&fun=new&version=v2', {
        'Referer': 'https://wx.qq.com/?&lang=zh_CN'
      }, function (raw) {
        console.log(raw.toString())
        var dom = new DOMParser().parseFromString(raw.toString(), 'text/xml')
        if (dom.childNodes.length !== 1 || dom.childNodes[0].childNodes.length !== 7) {
          console.log('解析xml失败, 关闭!')
        } else {
          var xml = dom.childNodes[0].childNodes
          for (var i = 0; i < xml.length; ++i) {
            self.baseKey[xml[i].nodeName] = xml[i].textContent
          }
          console.log(self.baseKey)
          // 当code == 0时候就是加载完basekey
          cb && cb({
            code: 0,
            baseKey: self.baseKey
          })
        }
      }, function () {
        console.log('登录失败!关闭!')
      })
    } else {
      console.log('重置!')
      ecb && ecb()
      self.loginicon_times = 0
    }
  }, ecb)
}

QrloginManager.prototype._baseRequest = function () {
  return {
    Uin: this.baseKey.wxuin,
    Sid: this.baseKey.wxsid,
    Skey: this.baseKey.skey,
    DeviceID: this.deviceid
  }
}

// 微信初始化
QrloginManager.prototype._wxinit = function (cb, ecb) {
  var self = this
  var url = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=' + (~new Date()) + '&lang=zh_CN'
  if (self.baseKey.pass_ticket) {
    url += '&pass_ticket=' + self.baseKey.pass_ticket
  }
  self.httpJson(url, {
    BaseRequest: self._baseRequest()
  }, {
    Referer: 'https://wx.qq.com/'
  }, function (e) {
    var res = e.BaseResponse
    if (res && res.Ret === 0) {
      self.SyncKey = e.SyncKey
      self.User = e.User
      self.baseKey.skey = e.SKey
      cb && cb(self)
    } else {
      ecb && ecb()
    }
  }, ecb)
  /*
   curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-54842049&lang=zh_CN' -X POST -H 'Accept: application/json, text/plain, **'
   -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3'
   -H 'Cache-Control: max-age=0' -H 'Connection: keep-alive' -H 'Content-Length: 101'
   -H 'Content-Type: application/json;charset=utf-8'
   -H 'Cookie: mm_lang=zh_CN; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; pgv_pvi=7866431488; pgv_si=s5463415808; wxuin=1345066204; wxloadtime=1460342973_expired; webwxuvid=d2204767d02c0ce0bbfee883ea427a9e5e565113b26aecc6b480dd33c3b10ace5a61b5bcf0e84895e0830aa54a79b5d7; wxpluginkey=1460341823; wxsid=f3ZKtuXBsuPuW++T; webwx_data_ticket=AQcW4vwQswu0odmS/G1qaK0c' -H 'Host: wx.qq.com' -H 'Referer: https://wx.qq.com/?&lang=zh_CN'
   */
  /*
   curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-54082341&lang=zh_CN&pass_ticket=x3xrHyDrGTKNIx5POWPA%252FBhK7SgGsMo4yBn2EWCrVVHnGGvGZ1Oq9Zx9OLWxtebu'
   -X POST -H 'Accept: application/json, text/plain, *'
   -H 'Accept-Encoding: gzip, deflate, br'
   -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3'
   -H 'Connection: keep-alive'
   -H 'Content-Length: 149'
   -H 'Content-Type: application/json;charset=utf-8'
   H 'Host: wx.qq.com' -H 'Referer: https://wx.qq.com/?&lang=zh_CN'
   -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0'*/
}

QrloginManager.prototype._logout = function () {
  var self = this
  this.httpPost('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxlogout?redirect=1&type=0', {
    sid: this.baseKey.wxsid,
    uin: this.baseKey.wxuin
  }, {
    Referer: 'https://wx.qq.com/'
  }, function () {
    fs.writeFileSync(self.jar._jar.store.filePath, '')
  })
}

// 尝试登录
QrloginManager.prototype.tryLogin = function (cb, ecb) {
  var self = this
  self._wxinit(cb, ecb)
}

// 加载二维码
QrloginManager.prototype.qrLogin = function (qrcb, scancb, ecb) {
  var self = this
  self._jslogin(function () {
    self._qrcode(function (base64) {
      qrcb(base64)
      self._loginicon(scancb, ecb)
    }, ecb)
  }, ecb)
}

// 获取头像
QrloginManager.prototype.getUserAvatar = function (cb) {
  var self = this
  self.httpGet('https://wx.qq.com' + self.User.HeadImgUrl, {
    Referer: 'https://wx.qq.com/?&lang=zh_CN'
  }, function (d) {
    cb && cb('data:image/png;base64,' + d.toString('base64'))
  })
}

module.exports = QrloginManager

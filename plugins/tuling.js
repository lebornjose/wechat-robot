/**
 * Created by zaygeegee on 16/4/11.
 */

const Plugin = require('plugin')
const request = require('request')
const crypto = require('crypto')
const md5 = function (str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function MyPlugin () {
  Plugin.apply(this, arguments)
  this.name = '图灵机器人'
}

MyPlugin.prototype = new Plugin()

MyPlugin.prototype.init = function () {
  console.log(this.name + '->init')
}

/**
 * 插件处理函数
 * @param msg
 * @returns {string}
 */
MyPlugin.prototype.handle = function (msg) {
  var self = this
  var reg = /^@.*?:<br\/>(.*?)$/
  var match = reg.exec(msg.Content)
  match && (msg.Content = match[1])
  request({
    url: 'http://www.tuling123.com/openapi/api?key=a754a3a32c9ab3d7d7ec4cc2be4d228a&info=' + encodeURI(msg.Content) + '&userid=' + md5(msg.FromUserName)
  }, function (e, r, d) {
    var res = JSON.parse(d)
    var result = res.text + '\r\n'
    switch (res.code) {
      case 200000: // 连接
        result += res.url
        break
      case 302000: // 新闻
        res.list.forEach(function (news) {
          result += '标题:' + news.article + '\r\n'
          result += '链接:' + news.detailurl + '\r\n'
          result += '来源:' + news.source + '\r\n\r\n'
        })
        break
      case 308000: // 菜谱
        res.list.forEach(function (food) {
          result += '名子:' + food.name + '\r\n'
          result += '原料:' + food.info + '\r\n'
          result += '详情:' + food.detailurl + '\r\n\r\n'
        })
        break
    }
    self.send(msg.FromUserName, result)
  })
}

/**
 * 插件是否处理, 明确返回真才会处理
 * @param msg
 * @returns {boolean}
 */
MyPlugin.prototype.check = function (msg) {
  return !!msg
}

/**
 * 是否继续下一个插件
 * @param msg 消息体
 * @returns {boolean}
 */
MyPlugin.prototype.after = function (msg) {
  return true
}

module.exports = new MyPlugin()

/**
 * Created by zaygeegee on 16/4/11.
 */

var Plugin = require('plugin')
var request = require('request')

function MyPlugin () {
  Plugin.apply(this, arguments)
  this.name = 'Demo'
  this.description = '插件测试栗子'
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
  console.log('receive:' + msg.Content)
  if (msg.Content === 'hello') {
    this.send(msg.FromUserName, 'world')
  }
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
MyPlugin.prototype.after = function (msg, handlereturn) {
  return true
}

module.exports = new MyPlugin()

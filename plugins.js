/**
 * Created by zaygeegee on 16/4/11.
 */

const path = require('path')
const plugin_path = path.resolve(path.dirname(require.main.filename), 'plugins')
const fs = require('fs')
const request = require('request')
const dialog = require('electron').dialog

// 下载插件
function Plugin_Download (url, cb) {
  request({
    url: url
  }, function (e, r, d) {
    if (e || parseInt(r.statusCode) !== 200 || !d) {
      dialog.showErrorBox('下载', '插件下载出错')
      return
    }
    fs.writeFile(path.resolve(plugin_path, '' + new Date().valueOf()) + '.js', d, function () {
      cb && cb()
    })
  })
}

// 删除插件
function Plugin_Uninst (sig, cb) {
  if (!fs.existsSync(path.resolve(plugin_path, sig))) {
    dialog.showErrorBox('插件', '插件不存在')
  } else {
    fs.unlink(path.resolve(plugin_path, sig), function () {
      cb && cb()
    })
  }
}

// 装载插件
function Plugin_Load (sig, cb) {
  if (!fs.existsSync(path.resolve(plugin_path, sig))) {
    dialog.showErrorBox('插件', '插件不存在')
  } else {
    cb && cb(require(path.resolve(plugin_path, sig)))
  }
}

// 插件类定义
function Plugin () {
  this.name = '抽象插件'
  this.author = 'zaygeegee'
  this.description = '插件描述'
}

Plugin.prototype._init = function (manager) {
  // 信息管理, 用于提供发送信息服务
  this.manager = manager
  this.init()
}

Plugin.prototype.init = function () {
}

// 插件是否处理, 明确返回真才会处理
Plugin.prototype.check = function () {
}

// 插件处理之后的函数, 函数明确返回真菜会继续判断下一个插件
Plugin.prototype.after = function () {
}

// 插件处理函数, 函数的返回值会直接被当做返回值发送给发送者, 返回对象会被json格式化, 返回数组会根据数据字段判断是否为表情或者文件等等, 返回其他值或者假值会被忽略
Plugin.prototype.handle = function () {
}

Plugin.prototype.send = function (to, data) {
  console.log(to, data)
  this.manager.send(to, data)
}

Plugin.prototype.getName = function () {
  return this.name
}
Plugin.prototype.getAuthor = function () {
  return this.author
}
Plugin.prototype.getDescription = function () {
  return this.description
}

var plugins = []
fs.readdirSync(path.resolve(plugin_path)).forEach(function (file) {
  if (file.indexOf('.js') > -1) {
    plugins.push(file)
  }
})

module.exports = {
  Abstract: Plugin,
  Download: Plugin_Download,
  Uninst: Plugin_Uninst,
  Load: Plugin_Load,
  all: plugins
}

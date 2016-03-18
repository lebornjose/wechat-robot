'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var request = require('request');

var mainWindow = null; // 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC， window 会被自动地关闭

var fs = require('fs');
global.loadPlugins = function() {
    var plugins = {};
    console.log("正在加载插件");
    var files = fs.readdirSync(__dirname + "/app/plugins");
    files.forEach(function(filename) {
        if(filename != 'node_modules' && filename.lastIndexOf('.') > 0 && filename.substr(filename.lastIndexOf('.') + 1) == 'js') {
            var plugin = require(__dirname + "/app/plugins/" + filename);
            plugin.filename = filename.substr(0, filename.lastIndexOf('.'));
            plugins[plugin.filename] = plugin;
            //plugins[plugin.name] = plugin;
        }
    });
    console.log("插件加载结束");
    return plugins;
};

global.saveToFiles = function(setting_plugins) {
    var files = fs.readdirSync(__dirname + "/app/plugins");
    files.forEach(function(filename) {
        if(filename != 'node_modules'
            && filename.lastIndexOf('.') > 0
            && filename.substr(filename.lastIndexOf('.') + 1) == 'js'
            && setting_plugins.enabled.indexOf(filename.substr(0, filename.lastIndexOf('.'))) === -1
            && setting_plugins.disabled.indexOf(filename.substr(0, filename.lastIndexOf('.'))) === -1) {
                fs.unlinkSync(__dirname + "/app/plugins/" + filename);
        }
    });
};

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit()
  }
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        //resizable: false,
        frame: false,
        width: 325,
        height: 450
    });
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    mainWindow.openDevTools();
    mainWindow.on('closed', function() {
        mainWindow = null;
    })
});

//var FileCookieStore = require('tough-cookie-filestore');
//require('fs').writeFile(__dirname + '/app/cookies.json', '');
//var jar = request.jar(new FileCookieStore(__dirname + '/app/cookies.json'));
//var options = {
//    headers: {
//        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
//        'Referer': 'https://wx.qq.com/'
//    },
//    'jar': jar
//};
//global.request = request.defaults(options);

//    "tough-cookie-filestore": "0.0.1"

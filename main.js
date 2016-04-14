const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

var mainWindow = null

global.terminate = function () {
  app.quit()
}
const MessageManager = require('./protocal/MessageManager.js')
const QrloginManager = require('./protocal/QrloginManager.js')
const path = require('path')
const root = path.dirname(require.main.filename)
global.MessageManager = MessageManager
global.QrloginManager = QrloginManager

// plugins
global.Plugin = require('./plugins.js')

const fs = require('fs')
fs.writeFileSync(root + '/cookie', '')

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 300, // Integer - 窗口宽度,单位像素. 默认是 800.
    height: 400, // Integer - 窗口高度,单位像素. 默认是 600.
    resizable: false, // Boolean - 是否可以改变窗口size，默认为 true.
    backgroundColor: '#FFF',
    frame: false // Boolean - 指定 false 来创建一个 Frameless Window. 默认为 true.
  })
  mainWindow.loadURL('file://' + root + '/app/index.html')
  //mainWindow.loadURL('http://localhost:8080')
  //mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
})

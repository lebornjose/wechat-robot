/**
 * Created by zhuangjianjia on 16/4/05.
 */
var packager = require('electron-packager')
var dir = __dirname + '/../'
// 项目打包的时候只会讲package.json的dependencies的模块及其依赖保留, 其他的模块会忽略
var getDevDependenciesIgnore = function () {
  var base_root = require('path').resolve(__dirname + '/../')
  var fs = require('fs')
  var ignore = fs.readdirSync(__dirname + '/../node_modules')
  var loadJsonDependencies = function (f) {
    var ds = JSON.parse(fs.readFileSync(f)).dependencies
    var s = []
    for (var i in ds) {
      s.push(i)
    }
    return s
  }
  var delDepenciesToIgnore = function (module_name) {
    var pac = base_root + '/node_modules/' + module_name + '/package.json'
    var index = ignore.indexOf(module_name)
    if (index > -1) {
      ignore.splice(index, 1)
      if (fs.existsSync(pac)) {
        var dep = loadJsonDependencies(pac)
        dep.forEach(function (dep_module) {
          delDepenciesToIgnore(dep_module)
        })
      }
    }
  }
  var dependencies = loadJsonDependencies(base_root + '/package.json')
  dependencies.forEach(function (module) {
    delDepenciesToIgnore(module)
  })
  for (var i in ignore) {
    ignore[i] = '^/node_modules/' + ignore[i] + '($|/)'
  }
  return ignore
}
var ignore = getDevDependenciesIgnore().concat([
  '^/build($|/)',
  '^/src($|/)',
  '^/static',
  '^/test',
  '^/.babelrc',
  '^/.editorconfig',
  '^/.eslintrc.js',
  '^/.gitignore',
  '^/config.js',
  '^/index.html',
  '^/installation.md',
  '^/READEME.md'
])

packager({
  'out': __dirname + '/packager/', // 输出到哪里
  'arch': 'all', // 系统位数 'ia32', 'x64', 'all'
  'dir': dir, // 项目目录
  'platform': ['win32', 'darwin', 'mas'], // 平台 darwin即osx 还有'linux', 'mas', 'win32', 'all'
  'app-copyright': '@zaygeegee', // 应用版权信息
  'app-version': '0.1.0', // 应用版本
  'name': 'WeChatRobot', // 应用名字
  'cache': '/Users/zaygeegee/Desktop/code/js/electron/0.37.5/', // electron 平台源码路径, 淘宝镜像 https://npm.taobao.org/mirrors/electron
  'version': '0.37.5', // electron平台版本, 需要与cache对应的一致
  'ignore': ignore, // 构建时候忽略哪些文件
  'overwrite': true, // 是否对已存在应用覆盖
  'asar': true // 是否用asar打包
}, function (error, appPath) {
  if (error) {
    console.log(error) // 打印错误
  } else {
    console.log('打包成功[' + appPath + ']') // 打印项目打包路径
  }
})

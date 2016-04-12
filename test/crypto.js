/**
 * Created by zaygeegee on 16/4/12.
 */
var base_root = require('path').resolve(__dirname + '/../')

var fs = require('fs')
// 数组是要忽略的模块
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

var dependencies = loadJsonDependencies(__dirname + '/../package.json')

dependencies.forEach(function (module) {
  delDepenciesToIgnore(module)
})

console.log(ignore)
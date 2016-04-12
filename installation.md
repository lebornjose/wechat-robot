环境: nodejs

npm install vue-cli -g

mkdir qq-robot
cd qq-robot
vue init webpack

npm install electron-prebuilt vue-router --save
npm install electron-packager --save-dev
修改配置
package.json
main: main.js
创建入口文件main.js
package.json
scripts: {
	...
	packager: "",
	start: "node_modules/.bin/electron ."
	..
}
创建打包文件build/packager.js

build/webpack.base.conf.js
添加 module.exports = {
	...
	target: 'electron',
	...
}
-------------------------------基础框架搭建完成

安装jquery
npm install jquery --save

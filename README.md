# wechat-robot
基于vue和electron的微信机器人

安装模块：
	
	npm install

运行环境:
	
	npm run build
	// 编辑build/packager.js， 修改对应的平台
	npm run packager
	// 会在build/packager/下会生成对应平台可执行文件

开发环境:
	
	// 在main.js下， 取消32行的注释， 将31行注释
	npm run dev
	// 运行程序
	npm run start
	// 现在修改的页面会同步更新到程序里啦
	
ps: 还没有将插件功能提供配置， 只能手动编写插件，然后放到plugins/下， 具体插件编写的例子请看plugins/helloworld.js， 记得更改plugins/tuling.js里面的api_key， 	
	
#插件编写🌰
插件 plugin.js

	const Plugin = require('plugin')
	function MyPlugin () {
		Plugin.apply(this, arguments)
		this.name = '我的插件'
		this.description = '插件描述'
		this.author = 'zaygeegee'
	}
	MyPlugin.prototype = new Plugin()
	MyPlugin.prototype.init = function () {
		// 插件初始化的时候执行的方法
	}
	MyPlugin.prototype.check = function (msg) {
		return true; // 插件是否要处理消息msg
	}
	MyPlugin.prototype.handle = function (msg) {
		// 处理消息的方法, msg.Content; msg.FromUserName 等等
		// 可以使用this.send(msg.FromUserName, '要发送的消息')来回复消息
	}
	MyPlugin.prototype.after = function (msg, handleResult) {
		return true; // 消息是否被下一个插件处理
	}
	module.exports = new MyPlugin()

插件必须实现check和handle方法

插件编写完之后编写一个json包, plugin.json

	{
		"name": "插件名字",
		"description": "插件描述",
		"author": "插件作者",
		"src": "http://插件地址(plugin.js)",
		"sig": "下载后的文件名字（最好只包含英文）"
	}

然后到软件主界面的导入插件输入json的url地址， 例如我放到我的服务器上是， http://localhost/plugin.json；然后导入即可	
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
	

/**
 * Created by zhuangjianjia on 16/3/14.
 */

var packager = require('electron-packager');

packager({
    "arch": 'all',
    "dir": __dirname,
    "platform": 'darwin',
    "app-copyright": "@zaygeegee",
    "app-version": "0.1.0",
    "cache": __dirname + '/../electron/',
    "name": "微信机器人",
    "overwrite": true,
    "version": "0.37.2",
    "asar": true
}, function(error, appPath) {
    if(error) {
        console.log(error);
    } else {
        console.log("打包成功[" + appPath + "]")
    }
});
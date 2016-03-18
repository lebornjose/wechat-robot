/**
 * Created by zhuangjianjia on 16/3/13.
 */


var local_plugins = JSON.parse(localStorage.local_plugins || JSON.stringify({
        enabled: [],
        disabled: []
    }));
// 这时候来加载插件
initPlugins();
localStorage.local_plugins = JSON.stringify(local_plugins);

const request = require('request');
msgSend = wxInit(request);
/**
 * Created by zhuangjianjia on 16/3/16.
 */

//var loadPlugins = function() {};
var remote = require('electron').remote;
var loadPlugins = remote.getGlobal('loadPlugins');
var saveToFiles = remote.getGlobal('saveToFiles');
var plugins = loadPlugins();
var initPlugin = function(plugin) {
    if(local_plugins.enabled.indexOf(plugin) >= 0 && plugins[plugin].inited === false && plugins[plugin].init !== undefined) {
        plugins[plugin].init();
        plugins[plugin].inited = true;
    }
};

var initPlugins = function() {
    for(var plugin in plugins) {
        // 如果这个插件存在于之前的插件列表中
        if(local_plugins.enabled.indexOf(plugin) === -1 && local_plugins.disabled.indexOf(plugin) === -1) {
            local_plugins.disabled.push(plugin);
        } else {
            initPlugin(plugin);
        }
    }
};

var savePlugins = function() {
    saveToFiles(local_plugins);
    localStorage.local_plugins = JSON.stringify(local_plugins);
};
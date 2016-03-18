/**
 * Created by zhuangjianjia on 16/3/13.
 */

/**
 * 用于插件的添加,删除,关闭,以及查看历史纪录
 */

var settingVue = new Vue({
    el: '#setting',
    data: {
        show: false,
        plugins: {
            all: plugins,
            now: local_plugins
        }
    },
    methods: {
        toggle: function(ev) {
            if(ev.target.href) {
                var r = ev.target.href.match(/\#(.*?)$/i);
                if(r) {
                    var targetId = r[1];
                    var target = document.getElementById(targetId);
                    target.style.display = "block";
                    var p = target;
                    while(p.previousSibling) {
                        if(p.previousSibling.nodeName.toUpperCase() === 'SECTION') {
                            p.previousSibling.style.display = 'none';
                        }
                        p = p.previousSibling;
                    }
                    p = target;
                    while(p.nextSibling) {
                        if(p.nextSibling.nodeName.toUpperCase() === 'SECTION') {
                            p.nextSibling.style.display = 'none';
                        }
                        p = p.nextSibling;
                    }
                }
            }
        },
        enabled: function(plugin) {
            var index = this.plugins.now.disabled.indexOf(plugin);
            if(index !== -1) {
                var del = this.plugins.now.disabled.splice(index, 1);
                this.plugins.now.enabled.push(del[0]);
            }
            console.log(local_plugins);
            savePlugins();
        },
        disabled: function(plugin) {
            var index = this.plugins.now.enabled.indexOf(plugin);
            if(index !== -1) {
                var del = this.plugins.now.enabled.splice(index, 1);
                this.plugins.now.disabled.push(del[0]);
            }
            console.log(local_plugins);
            savePlugins();
        },
        delete: function(plugin) {

        }
    }
});

var loginVue = new Vue({
    el: '#login',
    data: {
        qrcode: wechat.qrcode,
        user: wechat.user
    },
    methods: {
        reload: function() {
            wxInit(request);
        }
    }
});

var mainVue = new Vue({
    el: '#main',
    data: {
        msgQueue: wechat.msgQueue,
        user: wechat.user,
        contacts: wechat.contacts
    }
});

mainVue.$watch('msgQueue', function(queue) {
    if(queue.length) {
        var msg = new Message(queue[0]);
        msgHandle(msg);
        queue.shift();
    }
});

var settingBtnVue = new Vue({
    el: '#setting_btn',
    methods: {
        setting_show: function() {
            settingVue.show = true;
        }
    }
});

//var app = new Vue({
//    el: '#app',
//    data: {
//        wechat: wechat
//    }
//});

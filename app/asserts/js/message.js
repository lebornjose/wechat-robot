/**
 * Created by zhuangjianjia on 16/3/16.
 */


var msgSend = function() {

};

/**
 * 消息处理函数
 * @param {Message}msg
 */
function msgHandle(msg) {
    for (var index in local_plugins.enabled) {
        var pluginName = local_plugins.enabled[index];
        wx_log(pluginName + "正在处理数据", msg);
        var plugin = plugins[pluginName];
        if(plugin.check(msg)) {
            // 记录当前的处理插件
            msg.handler.push(plugin);
            // 记录当前的处理时间
            msg.handled_mark.push(new Date);
            var result = plugin.handle(msg);
            if(result) {
                var msgId = msgSend(result, msg.raw.FromUserName);
                msg.msgIds.push(msgId);
            }
            if(!plugin.next(msg, result)) break;
        }
    }
}

/**
 *
 * @param {Array}raw
 * @constructor
 */
function Message(raw) {
    this.raw = raw; // 原始数据
    this.handler = []; // 处理插件顺序
    this.handled_mark = []; // 处理时间顺序
    this.msgIds = []; // 处理的响应id的顺序
    this.type = 'msg';
    // 处理原始数据
    /**
     * 消息类型
     * 1 文本类型/地理信息
     * 3 图片
     * 34 音频
     * 42 名片
     * 43 文件视频
     * 47 表情
     * 49 文件
     * 51 进出聊天戒面
     * 62 小视频
     * 10000 系统消息
     */
}
/**
 * Created by zhuangjianjia on 16/3/17.
 */

function Plugin(opts) {
    var opts = opts || {};
    this.name = opts.name;
    this.author = opts.author;
    this.version = opts.version;
    this.description = opts.description;
    this.inited = false;
}

Plugin.prototype.init = function(msg) {

};

Plugin.prototype.check = function(msg) {
    return true;
};

Plugin.prototype.handle = function(msg) {
    if(msg.raw.Content == 'hello')
        return 'world';
};

Plugin.prototype.next = function(msg, result) {

};

module.exports = new Plugin({
    name: 'demo',
    author: 'Zaygeegee',
    version: '1.0',
    description: 'hello world'
});
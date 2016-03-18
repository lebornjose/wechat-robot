/**
 * Created by zhuangjianjia on 16/3/13.
 */
/**
 * 微信协议
 * 基于request模块
 */

/**
 * 微信数据
  * @type {{qrcode: {code: null, uuid: null, data: null}, user: {avatar: null, nickname: null}, contacts: {}, msgQueue: Array}}
 */
var wechat = {
    qrcode: { // 二维码状态
        code: null, // 二维码扫描状态码, 400失效 408等待扫描 200确认登陆 201等待确认
        uuid: null, // 获取二维码的uuid
        data: null // 二维码图片
    },
    user: {
        isLogin: false,
        avatar: null, // 用户头像
        nickname: null // 用户昵称
        //username: null
    },
    contacts: [], // 联系人
    msgQueue: [] // 消息队列
};

var wx_debug = true;
var wx_log = function(msg, obj) {
    var msgBag = {
        time: new Date().toString(),
        msg: msg,
        OBJECY: obj
    };
    if(wx_debug) {
        console.log(msgBag);
    } else {
        console.log(msgBag.time + ':' + msgBag.msg);
    }
};

function wxInit(request) {
    var request = request.defaults({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
            'Referer': 'https://wx.qq.com/'
        },
        jar: true
    });
    const appId = 'wx782c26e4c19acffb';
    const URLs = {
        jsLogin: 'https://login.weixin.qq.com/jslogin',
        login: 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login',
        init: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit',
        statusNotify: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify',
        getContact: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact',
        syncCheck: 'https://webpush.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck',
        sync: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync',
        searchContact: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsearchcontact',
        sendMsg: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg',
        sendMsgImg: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsgimg',
        sendEmotion: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendemoticon',
        sendAppMsg: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendappmsg',
        downloadMedia: 'https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmedia',
        uploadMedia: 'https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxuploadmedia'
    };

    var run = true, // 程序是否运行
        tip = 1,// 二维码扫描状态, 1未扫描, 0已扫描
        login_uri = null,// 登陆地址
        syncCheck = {},// 心跳包
        baseKey = {},// 构造基本请求用的密匙
        deviceId = 'e300429122309842', // 设备id: e+15位随机数字
        syncKey = {},// 发送请求的密匙
        user = {};// 用户信息,例如username和nickname等
    var waitForLoginClock = null;

    /**
     * 初始化方法
     * @private
     */
    var _init = function() {
        tools.log("初始化变量");
        wechat.qrcode.code = 400;
        wechat.qrcode.uuid = null;
        wechat.qrcode.data = null;
        wechat.user.avatar = null;
        wechat.user.nickname = null;
        wechat.user.isLogin = false;
        wechat.contacts.splice(0,wechat.contacts.length);
        wechat.msgQueue.splice(0,wechat.msgQueue.length);
        login_uri = null;
        tip = 1;
        syncCheck = {
            retcode: null,
            selector: null
        };
        tools.clearWaitForLogin();
        tools.log("初始化变量完成", wechat);
    };

    /**
     * 工具方法
     */
    var tools = {
        /**
         * 获取时间戳
         * @returns {number}
         */
        getTimestamp: function() {
            return new Date().getTime();
        },
        /**
         * 用于生成地址
         * @param baseUrl
         * @param params
         * @returns {string}
         */
        urlGenerator: function(baseUrl, params) {
            baseUrl += '?';
            for(var key in params) {
                baseUrl += (key + '=' + params[key] + '&');
            }
            return baseUrl + '0=0';
        },
        /**
         * 打印信息
         * @param msg
         */
        log: wx_log,
        /**
         * 处理请求数据
         * @param error
         * @param response
         * @param body
         */
        resolve: function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var window = {
                    code: null,
                    synccheck: {
                        retcode: null,
                        selector: null
                    },
                    QRLogin: {
                        code: null,
                        uuid: null,
                    },
                    redirect_uri: null,
                    userAvatar: null
                };
                eval(body);
                return window;
            }
            return null;
        },
        clearWaitForLogin: function() {
            if(waitForLoginClock) {
                clearTimeout(waitForLoginClock);
                waitForLoginClock = null;
            }
        },
    };

    /**
     * 协议方法
     */
    var protocal = {
        getUUID: function() {
            var requestBag = {
                method: 'GET',
                url: tools.urlGenerator(URLs.jsLogin, {
                    appid: appId,
                    fun: 'new',
                    lang: 'zh_CN',
                    _: tools.getTimestamp()
                })
            };
            tools.log("#开始获取uuid", {
                requestBag: requestBag
            });
            request(requestBag, function(error, response, body) {
                var obj = tools.resolve(error, response, body);
                if(obj && obj.QRLogin.code == 200) {
                    tools.log("获取uuid成功", obj);
                    wechat.qrcode.uuid = obj.QRLogin.uuid;
                    protocal.getQRCode();
                } else {
                    tools.log("获取uuid失败", {
                        error: error,
                        response: response,
                        body: body,
                        obj: obj
                    });
                }
            });
        },
        getQRCode: function() {
            var requestBag = {
                method: "GET",
                url: "https://login.weixin.qq.com/qrcode/" + wechat.qrcode.uuid,
                encoding: null
            };
            tools.log("#开始获取二维码图片", requestBag);
            request(requestBag, function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    tools.log("获取二维码成功", body);
                    wechat.qrcode.data = "data:image/jpeg;base64," + body.toString('base64');
                    wechat.qrcode.code = 408;
                    waitForLoginClock = setTimeout(protocal.waitForLogin);
                } else {
                    tools.log("无法获取二维码", {
                        error: error,
                        response: response,
                        body: body
                    });
                }
            });
        },
        waitForLogin: function() {
            if(wechat.qrcode.code == 200 || wechat.qrcode.code == 400) {
                return;
            }
            var requestBag = {
                url: tools.urlGenerator(URLs.login, {
                    loginicon: 'true',
                    uuid: wechat.qrcode.uuid,
                    tip: tip,
                    _: tools.getTimestamp()
                }),
                method: 'GET'
            };
            tools.log("#开始验证二维码", requestBag);
            request(requestBag, function(error, response, body) {
                if(wechat.qrcode.code == 200 || wechat.qrcode.code == 400) {
                    return;
                }
                var obj = tools.resolve(error, response, body);
                if(obj) {
                    wechat.qrcode.code = obj.code;
                    switch (obj.code) {
                        case 400:
                            tools.log("二维码失效", wechat.qrcode);
                            tools.clearWaitForLogin();
                            wechat.user.avatar = null;
                            login_uri = null;
                            tip = 1;
                            break;
                        case 408:
                            tools.log("验证超时, 重新验证", wechat.qrcode);
                            waitForLoginClock = setTimeout(protocal.waitForLogin);
                            break;
                        case 200:
                            tools.log("确认登陆", wechat.qrcode);
                            tools.clearWaitForLogin();
                            login_uri = obj.redirect_uri + "&fun=new&version=v2";
                            protocal.login();
                            break;
                        case 201:
                            tools.log("已经扫描二维码", wechat.qrcode);
                            tip = 0;
                            waitForLoginClock = setTimeout(protocal.waitForLogin);
                            wechat.user.avatar = obj.userAvatar;
                            break;
                    }
                } else {
                    tools.log("无法验证二维码", {
                        error: error,
                        response: response,
                        body: body,
                        obj: obj
                    });
                }
            });
        },
        login: function() {
            var requestBag = {
                method: 'GET',
                url: login_uri
            };
            tools.log("#开始登陆#", requestBag);
            request(requestBag, function(error, response, body) {
                tools.clearWaitForLogin();
                if(!error && response.statusCode == 200) {
                    tools.log("获取xml, 开始解析", body);
                    var dom = new DOMParser().parseFromString(body, 'text/xml');
                    if(dom.childNodes.length != 1 || dom.childNodes[0].childNodes.length != 7) {
                        tools.log("解析xml失败", dom);
                    } else {
                        var xml = dom.childNodes[0].childNodes;
                        for(var i = 0; i < xml.length; ++i) {
                            baseKey[xml[i].nodeName] = xml[i].textContent;
                        }
                        tools.log("解析xml成功", baseKey);
                        protocal.init();
                    }
                } else {
                    tools.log("登陆失败", {
                        error: error,
                        response: response,
                        body: body
                    });
                }
            });
        },
        init: function() {
            var requestBag = {
                url: tools.urlGenerator(URLs.init, {
                    pass_ticket: baseKey.pass_ticket
                }),
                method: 'POST',
                json: true,
                body: {
                    BaseRequest: {
                        Uin: baseKey.wxuin,
                        Sid: baseKey.wxsid,
                        Skey: baseKey.skey,
                        DeviceID: deviceId
                    }
                }
            };
            tools.log("#开始微信初始化", requestBag);
            request(requestBag, function(error, response, obj) {
                tools.clearWaitForLogin();
                if(error || response.statusCode != 200 || !obj || !obj.BaseResponse || obj.BaseResponse.Ret != 0) {
                    tools.log("微信初始化失败", {
                        error: error,
                        response: response,
                        obj: obj
                    });
                } else {
                    syncKey = obj.SyncKey;
                    user = obj.User;
                    wechat.user.nickname = user.NickName;
                    tools.log("微信初始化成功", {
                        syncKey: syncKey,
                        user: user
                    });
                    protocal.statusNotify();
                    protocal.getContact();
                    tools.log("开启心跳检测");
                    protocal.syncCheck();
                }
            });
        },
        statusNotify: function() {
            var requestBag = {
                url: tools.urlGenerator(URLs.statusNotify, {
                    pass_ticket: baseKey.pass_ticket
                }),
                method: 'POST',
                json: true,
                body: {
                    BaseRequest: {
                        Uin: baseKey.wxuin,
                        Sid: baseKey.wxsid,
                        Skey: baseKey.skey,
                        DeviceID: deviceId
                    },
                    Code: 3,
                    FromUserName: user.UserName,
                    ToUserName: user.UserName,
                    ClientMsgId: tools.getTimestamp()
                }
            };
            tools.log("#开始同步手机状态", requestBag);
            request(requestBag, function(error, response, obj) {
                tools.clearWaitForLogin();
                if(error || response.statusCode != 200 || !obj || !obj.BaseResponse || obj.BaseResponse.Ret != 0) {
                    tools.log("同步手机状态失败", {
                        error: error,
                        response: response,
                        obj: obj
                    });
                } else {
                    tools.log("同步手机状态成功", obj);
                }
            });
        },
        getContact: function() {
            var requestBag = {
                url: tools.urlGenerator(URLs.getContact, {
                    pass_ticket: baseKey.pass_ticket,
                    r: tools.getTimestamp(),
                    seq: 0,
                    skey: baseKey.skey
                }),
                json: true,
                method: 'GET'
            };
            tools.log("#开始获取联系人", requestBag);
            request(requestBag, function(error, response, obj) {
                tools.clearWaitForLogin();
                if(error || response.statusCode != 200 || !obj || !obj.BaseResponse || obj.BaseResponse.Ret != 0) {
                    tools.log("获取联系人出错", {
                        error: error,
                        response: response,
                        obj: obj
                    });
                } else {
                    tools.log("获取联系人成功", obj);
                    wechat.contacts = obj.MemberList;
                }
            });
        },
        syncCheck: function() {
            var requestBag = {
                url: tools.urlGenerator(URLs.syncCheck, {
                    r: tools.getTimestamp(),
                    skey: baseKey.skey,
                    sid: baseKey.wxsid,
                    uin: baseKey.wxuin,
                    deviceid: deviceId,
                    synckey: syncKey.List.map(function(obj) {
                        return obj.Key + '_' + obj.Val;
                    }).join('|'),
                    _: tools.getTimestamp()
                }),
                method: 'GET'
            };
            tools.log("#心跳包", requestBag);
            request(requestBag, function(error, response, body) {
                tools.clearWaitForLogin();
                var obj = tools.resolve(error, response, body);
                if(obj && obj.synccheck.retcode == 0) {
                    wechat.user.isLogin = true;
                    syncCheck = obj.synccheck;
                    switch(obj.synccheck.selector) {
                        case "6": // 个人消息
                        case "2": // 群组消息
                            tools.log("有新消息", obj);
                            protocal.sync();
                            return;
                            break;
                        case "0":
                            tools.log("一切正常", obj);
                            break;
                        case "7":
                            tools.log("进入/离开聊天界面", obj);
                            break;
                        default:
                            tools.log("收到未知心跳响应包", obj);
                            break;
                    }
                    protocal.syncCheck();
                } else {
                    tools.log("心跳响应失败", {
                        error: error,
                        response: response,
                        body: body,
                        obj: obj
                    });
                    wechat.qrcode.code = 400;
                    tools.clearWaitForLogin();
                    wechat.user.avatar = null;
                    login_uri = null;
                    tip = 1;
                    wechat.user.isLogin = false;
                }
            })
        },
        sync: function() {
            var requestBag = {
                url: tools.urlGenerator(URLs.sync, {
                    sid: baseKey.wxsid,
                    skey: baseKey.skey,
                    pass_ticket: baseKey.pass_ticket
                }),
                method: 'POST',
                json: true,
                body: {
                    BaseRequest: {
                        Uin: baseKey.wxuin,
                        Sid: baseKey.wxsid,
                        Skey: baseKey.skey,
                        DeviceID: deviceId
                    },
                    rr: ~new Date,
                    SyncKey: syncKey
                }
            };
            tools.log("#正在拉取新消息", requestBag);
            request(requestBag, function(error, response, obj) {
                tools.clearWaitForLogin();
                if(error || response.statusCode != 200 || !obj || !obj.BaseResponse || obj.BaseResponse.Ret != 0) {
                    tools.log("拉取新消息失败", {
                        error: error,
                        response: response,
                        obj: obj
                    });
                    wechat.qrcode.code = 400;
                    tools.clearWaitForLogin();
                    wechat.user.avatar = null;
                    login_uri = null;
                    tip = 1;
                    wechat.user.isLogin = false;
                } else {
                    syncKey = obj.SyncKey;
                    for(var index in obj.AddMsgList) {
                        if(obj.AddMsgList[index].MsgType != 51) {
                            tools.log("队列中有" + wechat.msgQueue.push(obj.AddMsgList[index]) + "条信息还没有处理", obj);
                        }
                    }
                    protocal.syncCheck();
                }
            })
        },
        send: function(content, toUserName) {
            var msgId = tools.getTimestamp() + Math.floor(Math.random() * 9999 + 1000);
            var requestBag = {
                url: tools.urlGenerator(URLs.sendMsg, {
                    lang: 'zh_CN',
                    pass_ticket: baseKey.pass_ticket
                }),
                method: 'POST',
                json: true,
                body: {
                    BaseRequest: {
                        Uin: baseKey.wxuin,
                        Sid: baseKey.wxsid,
                        Skey: baseKey.skey,
                        DeviceID: deviceId
                    },
                    Msg: {
                        Type: 1,
                        Content: content,
                        FromUserName: user.UserName,
                        LocalID: msgId,
                        ToUserName: toUserName,
                        ClientMsgId: msgId
                    }
                }
            };
            tools.log("#准备发送消息", requestBag);
            request(requestBag, function(error, response, obj) {
                if(error || response.statusCode != 200 || !obj || !obj.BaseResponse || obj.BaseResponse.Ret != 0) {
                    tools.log("消息发送失败", {
                        error: error,
                        response: response,
                        obj: obj
                    });
                } else {
                    tools.log("消息发送成功", obj);
                }
            });
            return msgId;
        }
    };
    _init();
    protocal.getUUID();
    return protocal.send;
}


// curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg' -X POST -H 'Host: wx.qq.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json;charset=utf-8' -H 'Referer: https://wx.qq.com/' -H 'Content-Length: 352' -H 'Cookie: mm_lang=zh_CN; pgv_pvi=9948624896; wxuin=1345066204; wxloadtime=1457942881_expired; webwxuvid=d2204767d02c0ce0bbfee883ea427a9ec2e9a067ed8118dcbacbd90f76458e087e13a5914fa3ce34ca1eea45134cad2a; wxpluginkey=1457917867; wxsid=9J0mVmXytmjcqcXc; webwx_data_ticket=AQe6PrIrDS/0NV9PRmnE51k8; pt2gguin=o0670344600; RK=SNXjKXWXVK; ptcz=84d8a8efbfb87115de2260c409805ec75b5bdce70be4c5be613c5db0c3b1a8d9; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; pgv_si=s9723322368' -H 'Connection: keep-alive'
// {"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//,"DeviceID":"e807527486138922"},"Msg":{"Type":1,"Content":"aa","FromUserName":"@5a339a461b2a8c02b85f66300eddf8860339e06fdbb9886bbb072f95f5373111"
//    ,"ToUserName":"filehelper","LocalID":"14579434706370607","ClientMsgId":"14579434706370607"}}


// curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendemoticon?fun=sys' -X POST -H 'Host: wx.qq.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json;charset=utf-8' -H 'Referer: https://wx.qq.com/' -H 'Content-Length: 401' -H 'Cookie: mm_lang=zh_CN; pgv_pvi=9948624896; wxuin=1345066204; wxloadtime=1457942881_expired; webwxuvid=d2204767d02c0ce0bbfee883ea427a9ec2e9a067ed8118dcbacbd90f76458e087e13a5914fa3ce34ca1eea45134cad2a; wxpluginkey=1457917867; wxsid=9J0mVmXytmjcqcXc; webwx_data_ticket=AQe6PrIrDS/0NV9PRmnE51k8; pt2gguin=o0670344600; RK=SNXjKXWXVK; ptcz=84d8a8efbfb87115de2260c409805ec75b5bdce70be4c5be613c5db0c3b1a8d9; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; pgv_si=s9723322368' -H 'Connection: keep-alive'
//{"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//    ,"DeviceID":"e353468651025458"},"Msg":{"Type":47,"EmojiFlag":2,"EMoticonMd5":"ca17f472025f0943917b443faeaee999"
//    ,"FromUserName":"@5a339a461b2a8c02b85f66300eddf8860339e06fdbb9886bbb072f95f5373111","ToUserName":"filehelper"
//    ,"LocalID":"14579435270050092","ClientMsgId":"14579435270050092"}}
//{"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//    ,"DeviceID":"e942762855555388"},"Msg":{"Type":47,"EmojiFlag":2,"EMoticonMd5":"ca17f472025f0943917b443faeaee999"
//    ,"FromUserName":"@5a339a461b2a8c02b85f66300eddf8860339e06fdbb9886bbb072f95f5373111","ToUserName":"filehelper"
//    ,"LocalID":"14579435695740518","ClientMsgId":"14579435695740518"}}


// curl 'https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxuploadmedia?f=json' -X POST -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Connection: keep-alive' -H 'Content-Length: 14675' -H 'Content-Type: multipart/form-data; boundary=---------------------------619719379327914903822736519' -H 'Host: file.wx.qq.com' -H 'Origin: https://wx.qq.com' -H 'Referer: https://wx.qq.com/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0'
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="id"
//WU_FILE_1
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="name"
//Snip20160314_1.png
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="type"
//image/png
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="lastModifiedDate"
//Mon Mar 14 2016 16:16:21 GMT+0800 (CST)
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="size"
//13083
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="mediatype"
//pic
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="uploadmediarequest"
//{"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//    ,"DeviceID":"e795713501851819"},"ClientMediaId":1457943640668,"TotalLen":13083,"StartPos":0,"DataLen"
//:13083,"MediaType":4}
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="webwx_data_ticket"
//AQe6PrIrDS/0NV9PRmnE51k8
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="pass_ticket"
//undefined
//-----------------------------619719379327914903822736519
//Content-Disposition: form-data; name="filename"; filename="Snip20160314_1.png"
//Content-Type: image/png
//返回 mediaid
//curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsgimg?fun=async&f=json' -X POST -H 'Host: wx.qq.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json;charset=utf-8' -H 'Referer: https://wx.qq.com/' -H 'Content-Length: 1070' -H 'Cookie: mm_lang=zh_CN; pgv_pvi=9948624896; wxuin=1345066204; wxloadtime=1457942881_expired; webwxuvid=d2204767d02c0ce0bbfee883ea427a9ec2e9a067ed8118dcbacbd90f76458e087e13a5914fa3ce34ca1eea45134cad2a; wxpluginkey=1457917867; wxsid=9J0mVmXytmjcqcXc; webwx_data_ticket=AQe6PrIrDS/0NV9PRmnE51k8; pt2gguin=o0670344600; RK=SNXjKXWXVK; ptcz=84d8a8efbfb87115de2260c409805ec75b5bdce70be4c5be613c5db0c3b1a8d9; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; pgv_si=s9723322368' -H 'Connection: keep-alive'
//{"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//    ,"DeviceID":"e094917670369950"},"Msg":{"Type":3,"MediaId":"@crypt_32aaad8d_00fd66459bcb6104308c09253
//    7b129407ce5540fd25a6a173c48c6c1043b49384295587d2cc472a516a54e846d83a7d1fb60c5228c6d72ca78fb01dcefa9f
//    f37f7b870b6abdf7df12d12b731a18babd14bc7042ef7559e6d7147882ea8c3cfc5df3246fec95a486bd6c351aad796dea77
//    fa5b406ec1363e84cc48b6557030d34c681fcb9f21ca2c99dace4a3724aaa15e86c240411bf935893e135dd6662f5f186602
//    7395e5305bd50d749b6db73a4d550c1b17e5c1d7c665ebdfa7b299abf937d421badc744ac3c1fe227442539d4faa8971f747
//    6fff0297c6ab17a3508060aa2bed236ce17bd9a6c99438d2a7e0ec7079da60944f9c1b70bc2b3f71b0020ed80f656b58258d
//    f4f3849749d9b81c45f573549959ea4b840dfec2a848b2d5b05e213784b5368711d0fd6930954785831cf8e9765d420af0fd5b0a3acb426775e396008de912fe147f5a257d52b8b40f28a0a69fc5f3843b6d256afe3b7230fca"
//        ,"FromUserName":"@5a339a461b2a8c02b85f66300eddf8860339e06fdbb9886bbb072f95f5373111","ToUserName":"filehelper"
//        ,"LocalID":"14579436405770796","ClientMsgId":"14579436405770796"}}



// 文件
//curl 'https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxuploadmedia?f=json' -X POST -H 'Host: file.wx.qq.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://wx.qq.com/' -H 'Content-Length: 1683' -H 'Content-Type: multipart/form-data; boundary=---------------------------204215772914613049491529290751' -H 'Origin: https://wx.qq.com' -H 'Connection: keep-alive'
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="id"
//WU_FILE_2
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="name"
//laravel
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="type"
//application/octet-stream
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="lastModifiedDate"
//Sun Feb 14 2016 21:15:22 GMT+0800 (CST)
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="size"
//59
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="mediatype"
//doc
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="uploadmediarequest"
//{"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//    ,"DeviceID":"e489873691703676"},"ClientMediaId":1457943815367,"TotalLen":59,"StartPos":0,"DataLen":59
//    ,"MediaType":4}
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="webwx_data_ticket"
//AQe6PrIrDS/0NV9PRmnE51k8
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="pass_ticket"
//undefined
//-----------------------------204215772914613049491529290751
//Content-Disposition: form-data; name="filename"; filename="laravel"
//Content-Type: application/octet-stream
//composer create-project laravel/laravel=5.1.* --prefer-dist
//-----------------------------204215772914613049491529290751--
//curl 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendappmsg?fun=async&f=json' -X POST -H 'Host: wx.qq.com' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json;charset=utf-8' -H 'Referer: https://wx.qq.com/' -H 'Content-Length: 795' -H 'Cookie: mm_lang=zh_CN; pgv_pvi=9948624896; wxuin=1345066204; wxloadtime=1457942881_expired; webwxuvid=d2204767d02c0ce0bbfee883ea427a9ec2e9a067ed8118dcbacbd90f76458e087e13a5914fa3ce34ca1eea45134cad2a; wxpluginkey=1457917867; wxsid=9J0mVmXytmjcqcXc; webwx_data_ticket=AQe6PrIrDS/0NV9PRmnE51k8; pt2gguin=o0670344600; RK=SNXjKXWXVK; ptcz=84d8a8efbfb87115de2260c409805ec75b5bdce70be4c5be613c5db0c3b1a8d9; MM_WX_NOTIFY_STATE=1; MM_WX_SOUND_STATE=1; pgv_si=s9723322368' -H 'Connection: keep-alive'
// {"BaseRequest":{"Uin":1345066204,"Sid":"9J0mVmXytmjcqcXc","Skey":"@crypt_ae9db45b_8a84289da24f2aa46bec9d6943800da8"
//,"DeviceID":"e070768375683481"},"Msg":{"Type":6,"Content":"<appmsg appid='wxeb7ec651dd0aefa9' sdkver
//    =''><title>laravel</title><des></des><action></action><type>6</type><content></content><url></url><lowurl
//    ></lowurl><appattach><totallen>59</totallen><attachid>@crypt_35f9488_87c86b0c2589c795a9e7d307e8b84f9
//    06bc80142daf7c0d1d1e2735e182032b0488522bb5a6b8dd991c6f907ede75d1254c6dc07c8c2dfbbb03e89c6bdafcc1b6856017041c8648e449e40b6575c8a36
//    </attachid><fileext></fileext></appattach><extinfo></extinfo></appmsg>","FromUserName":"@5a339a461b2a8c02b85f66300eddf8860339e06fdbb9886bbb072f95f5373111"
//        ,"ToUserName":"filehelper","LocalID":"14579438152780116","ClientMsgId":"14579438152780116"}}


/**
 *
 sendMessage: function (e) {
                                            switch (e.MMStatus = confFactory.MSG_SEND_STATUS_SENDING, e.MsgType) {
                                                case confFactory.MSGTYPE_TEXT:
                                                    this.postTextMessage(e);
                                                    break;
                                                case confFactory.MSGTYPE_IMAGE:
                                                    this.postImgMessage(e);
                                                    break;
                                                case confFactory.MSGTYPE_APP:
                                                    this.postAppMessage(e);
                                                    break;
                                                case confFactory.MSGTYPE_EMOTICON:
                                                    this.postEmoticonMessage(e)
                                            }
                                        },
 _postMessage: function (url, data, msg) {
                                            data.FromUserName = msg.FromUserName,
                                            data.ToUserName = msg.ToUserName,
                                            data.LocalID = msg.LocalID,
                                            data.ClientMsgId = msg.ClientMsgId,
                                            data = angular.extend(accountFactory.getBaseRequest(), {
                                                Msg: data
                                            }),
                                            utilFactory.browser.msie && parseInt(utilFactory.browser.version) < 9 && url == confFactory.API_webwxsendmsg && (data = eval('\'' + JSON.stringify(data) + '\'')),
                                            mmHttp({
                                                method: 'POST',
                                                url: url,
                                                data: data,
                                                MMRetry: {
                                                    serial: !0
                                                }
                                            }).success(function (e) {
                                                0 == e.BaseResponse.Ret ? (msg.MsgId = e.MsgID, _msgMap[msg.MsgId] = msg, _addedMsgIdsMap[msg.MsgId] = !0, msg.MMStatus = confFactory.MSG_SEND_STATUS_SUCC, $rootScope.$broadcast('root:msgSend:success', msg))  : (reportService.report(reportService.ReportType.netError, {
                                                    text: 'postMessage error',
                                                    url: url,
                                                    res: e
                                                }), msg.MMStatus = confFactory.MSG_SEND_STATUS_FAIL)
                                            }).error(function (e) {
                                                reportService.report(reportService.ReportType.netError, {
                                                    text: 'postMessage error',
                                                    url: url,
                                                    res: e
                                                }),
                                                msg.MMStatus = confFactory.MSG_SEND_STATUS_FAIL
                                            })
                                        },
 postTextMessage: function (e) {
                                            var t = {
                                                Type: confFactory.MSGTYPE_TEXT,
                                                Content: e.MMSendContent
                                            };
                                            e.MMAtContacts && e.MMAtContacts.length && (t.MsgSource = '<msgsource><atusername>' + e.MMAtContacts + '</atusername><atchatroomname>' + e.ToUserName + '</atchatroomname></msgsource>'),
                                            this._postMessage(confFactory.API_webwxsendmsg, t, e)
                                        },
 postImgMessage: function (e) {
                                            var t = {
                                                Type: confFactory.MSGTYPE_IMAGE,
                                                MediaId: e.MediaId
                                            };
                                            this._postMessage(confFactory.API_webwxsendmsgimg + '?fun=async&f=json', t, e)
                                        },
 postAppMessage: function (e) {
                                            var t = {
                                                Type: confFactory.APPMSGTYPE_ATTACH,
                                                Content: '<appmsg appid=\'wxeb7ec651dd0aefa9\' sdkver=\'\'><title>' + e.FileName + '</title><des></des><action></action><type>' + confFactory.APPMSGTYPE_ATTACH + '</type><content></content><url></url><lowurl></lowurl><appattach><totallen>' + e.FileSize + '</totallen><attachid>' + e.MediaId + '</attachid><fileext>' + e.MMFileExt + '</fileext></appattach><extinfo></extinfo></appmsg>'
                                            };
                                            this._postMessage(confFactory.API_webwxsendappmsg + '?fun=async&f=json', t, e)
                                        },
 postEmoticonMessage: function (e) {
                                            var t = {
                                                Type: confFactory.MSGTYPE_EMOTICON,
                                                EmojiFlag: e.EmojiFlag,
                                                EMoticonMd5: e.EMoticonMd5 || e.md5
                                            };
                                            e.MediaId && (t.MediaId = e.MediaId),
                                            e.MMSourceMsgId && 'undefined' != typeof e.MMStatus && e.MMStatus != confFactory.MSG_SEND_STATUS_SUCC && (e.MMPreviewSrc = confFactory.API_webwxgetmsgimg + '?&MsgID=' + e.MMSourceMsgId + '&skey=' + encodeURIComponent(accountFactory.getSkey()) + '&type=big'),
                                            this._postMessage(confFactory.API_webwxsendemoticon + '?fun=sys', t, e)
                                        },
 */



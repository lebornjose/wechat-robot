<template>
  <div id="work" transition="fade">
    <img id="avatar" v-bind:class="'avatar scale ' + (run ? 'spin':'')" v-bind:src="avatar" alt="头像" v-on:click="pause">
    <!--所有插件-->
    <div id="plugins">

      <div id="exp">
        <input id="exp_url" type="text" v-model="export_url" placeholder="插件json包url地址">
        <button v-on:click.self="downloadPlugin">导入插件</button>
      </div>
      <table>
        <tr>
          <th>名称</th>
          <th>描述</th>
          <th>作者</th>
          <th>启用</th>
          <th>卸载</th>
        </tr>
        <tr v-for="plugin in plugins">
          <td>{{ plugin.name }}</td>
          <td>{{ plugin.description }}</td>
          <td>{{ plugin.author }}</td>
          <td>
            <input type="checkbox" v-model="plugin.status" lazy v-on:change="togglePluginStatus(plugin)">
          </td>
          <td>
            <button v-on:click.self="removePlugin(plugin)">卸载</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
<style>
  #work {
    position: absolute;
    background-color: #fff;
    width: 100%;
    height: 100%;
  }

  .avatar {
    -webkit-transition: all 1s;
    -moz-transition: all 1s;
    -ms-transition: all 1s;
    -o-transition: all 1s;
    transition: all 1s;
  }

  .avatar.scale {
    width: 150px;
    height: 150px;
    margin-top: -160px;
    margin-left: -75px;
    border-radius: 50%;
    border: 2px solid #ff3538;
    -webkit-transition: all 0.5s;
    -moz-transition: all 0.5s;
    -ms-transition: all 0.5s;
    -o-transition: all 0.5s;
    transition: all 0.5s;
    -webkit-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
    cursor: pointer;
  }

  #plugins {
    width: 280px;
    position: fixed;
    left: 50%;
    margin-left: -140px;
    top: 50%;
    margin-top: 20px;
    height: 150px;
    background-color: #f7f7f7;
    padding-top: 10px;
    padding-bottom: 10px;
    overflow-y: scroll;
  }

  #plugins table {
    width: 100%;
    text-align: left;
    font-size: 12px;
  }

  .spin {
    -webkit-animation: spin 2s infinite linear;
    animation: spin 2s infinite linear;
    border: 2px solid #5aff55 !important;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  #exp {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
  }

  #exp_url {
    width: 175px;
    height: 25px;
    line-height: 27px;
    padding-left: 5px;
    cursor: text;
  }

  button {
    background-color: #fff;
    border: 1px solid #999;
    padding: 0px 5px;
    cursor: pointer;
    -webkit-transition: all 0.5s;
    -moz-transition: all 0.5s;
    -ms-transition: all 0.5s;
    -o-transition: all 0.5s;
    transition: all 0.5s;
  }

  button:hover {
    background-color: #999;
    color: #fff;
    border: 1px solid #fff;
  }
</style>
<script>
  import Electron from 'electron'
  const remote = Electron.remote
  const MessageManager = remote.getGlobal('MessageManager')
  const Plugin = remote.getGlobal('Plugin')

  export default{
    props: ['avatar', 'manager'],
    el () {
      return '#work'
    },
    data () {
      return {
        plugins: null,
        on_plugins: null,
        run: false,
        logined: false,
        export_url: ''
      }
    },
    methods: {
      pause: function () {
        if (this.logined) {
          this.run = !this.run
        }
      },
      downloadPlugin: function () {
        var self = this
        var url = this.export_url
        Plugin.Download(url, function (sig) {
          console.log(sig)
          var plugin = Plugin.Load(sig)
          if (plugin) {
            plugin._init(self.manager.msg)
            plugin.sig = sig
            self.plugins.push(plugin)
            console.log('插件导入成功')
          } else {
            window.alert('插件解析失败')
          }
        })
      },
      removePlugin: function (plugin) {
        var self = this
        Plugin.Uninst(plugin.sig, function () {
          window.alert('插件' + plugin.name + '卸载成功')
          self.on_plugins.$remove(plugin.name)
          window.localStorage.setItem('on_plugins', JSON.stringify(self.on_plugins))
          self.plugins.$remove(plugin)
        })
      },
      togglePluginStatus: function (plugin) {
        console.log(plugin.status)
        if (plugin.status === true) {
          // 加入on_plugins
          if (this.on_plugins.indexOf(plugin.name) === -1) {
            this.on_plugins.push(plugin.name)
            console.log(this.on_plugins)
            window.localStorage.setItem('on_plugins', JSON.stringify(this.on_plugins))
          }
        } else {
          // 删除这个元素
          if (this.on_plugins.indexOf(plugin.name) > -1) {
            this.on_plugins.$remove(plugin.name)
            console.log(this.on_plugins)
            window.localStorage.setItem('on_plugins', JSON.stringify(this.on_plugins))
          }
        }
      }
    },
    ready () {
      var self = this
      var manager = this.manager
      manager.msg = new MessageManager(manager.qr)

      self.plugins = []
      var all_plugins = Plugin.all
      var on_plugins = window.localStorage.getItem('on_plugins')
      on_plugins = on_plugins ? JSON.parse(on_plugins) : []
      this.on_plugins = on_plugins
      window.localStorage.setItem('on_plugins', JSON.stringify(on_plugins))
      all_plugins.forEach(function (sig) {
        var plugin = Plugin.Load(sig)
        if (plugin) {
          plugin._init(self.manager.msg)
          plugin.sig = sig
          if (on_plugins.indexOf(plugin.name) > -1) {
            plugin.status = true
          }
          self.plugins.push(plugin)
        }
      })
      console.log(self.plugins)
      manager.msg.init(function () {
        console.log('启动!')
        self.run = true
        self.logined = true
        manager.msg.listener(function (info) {
          // 处理消息
          if (!self.logined || !self.run) {
            return
          }
          for (var i in self.plugins) {
            var sign = (function (plugin) {
              if (plugin.status && plugin.check(info)) {
                console.log(plugin.name + '开始响应消息')
                return plugin.after(info, plugin.handle(info))
              } else {
                return true
              }
            })(self.plugins[i])
            if (sign === false) {
              break
            }
          }
        })
      }, function () {
        console.log('失败')
        self.logined = false
        self.run = false
        self.$route.router.app.$children[0].login_sig.$remove(self.qrloginManager)
        self.$route.router.go({
          path: '/'
        })
      })
    }
  }
</script>
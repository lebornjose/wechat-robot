<template>
  <div id="work" transition="fade">
    <img class="avatar scale" v-bind:src="avatar" alt="头像">
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
    margin-top: -75px;
    margin-left: -75px;
    border-radius: 50%;
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
        plugins: null
      }
    },
    ready () {
      var self = this
      var manager = this.manager
      manager.msg = new MessageManager(manager.qr)

      self.plugins = []
      var all_plugins = Plugin.all
      all_plugins.forEach(function (sig) {
        Plugin.Load(sig, function (plugin) {
          console.log(plugin.getName())
          plugin._init(self.manager.msg)
          self.plugins.push(plugin)
        })
      })

      manager.msg.init(function () {
        console.log('启动!')
        manager.msg.listener(function (info) {
          // 处理消息
          self.plugins.forEach(function (plugin) {
            if (plugin.check(info)) {
              (function (p) {
                p.handle(info)
              })(plugin)
            }
            return true
          })
        })
      }, function () {
        console.log('失败')
        self.$route.router.app.$children[0].login_sig.$remove(self.qrloginManager)
        self.$route.router.go({
          path: '/'
        })
      })
    }
  }
</script>
<template>
  <div id="login" transition="fade">
    <div class="qrcode">
      <img class="qrcode" style="" v-bind:src="'data:image/jpeg;base64,' + qr" alt="二维码">
      <img class="avatar" v-if="avatar !== null" v-bind:src="avatar" alt="头像">
    </div>
  </div>
  </div>
</template>
<style>
  #login {
    position: absolute;
    background-color: #f6f6f6;
    width: 100%;
    height: 100%;
  }

  .qrcode {
    position: absolute;
    width: 300px;
    height: 300px;
    top: 50%;
    margin-top: -150px;
  }

  .avatar {
    position: absolute;
    width: 100px;
    height: 100px;
    top: 50%;
    margin-top: -50px;
    left: 50%;
    margin-left: -50px;
  }
</style>
<script>
  import Electron from 'electron'
  const remote = Electron.remote
  const QrloginManager = remote.getGlobal('QrloginManager')
  export default {
    props: ['avatar', 'manager'],
    el () {
      return '#login'
    },
    data () {
      return {
        qr: ''
      }
    },
    ready () {
      var self = this
      var qrManager = new QrloginManager()
      self.manager.qr = qrManager
      var getLogin = function () {
        self.avatar = null
        qrManager.qrLogin(function (base64) {
          self.qr = base64
        }, function (t) {
          console.log(t)
          switch (parseInt(t.code)) {
            case 0:
              console.log('开始登录')
              qrManager.tryLogin(function () {
                self.$route.router.go({
                  name: 'work'
                })
              }, function () {
                getLogin()
                console.log('登录失败')
              })
              break
            case 201:
              self.avatar = t.userAvatar
              break
          }
        }, function () {
          // 二维码失效, 重载二维码
          getLogin()
          console.log('error')
        })
      }
      getLogin()
    }
  }
</script>
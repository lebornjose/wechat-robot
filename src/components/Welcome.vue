<template>
  <div id="welcome" transition="fade">
    <h1 class="title">微信机器人</h1>
    <img class="logo" src="../../static/imgs/qq-robot.png" alt="logo">
    <h3 class="info">打开手机扫码登录</h3>
  </div>
</template>
<style>
  #welcome {
    position: absolute;
    background-color: #f0f0f0;
    width: 100%;
    height: 100%;
  }

  img.logo {
    position: absolute;
    width: 200px;
    height: 200px;
    top: 50%;
    left: 50%;
    margin-left: -100px;
    margin-top: -100px;
  }

  .title {
    text-align: center;
  }

  .info {
    text-align: center;
  }

</style>
<script>
  export default {
    el () {
      return '#welcome'
    },
    ready () {
      var self = this
      setTimeout(function () {
        self.$route.router.go({
          path: '/login'
        })
      }, 3000)
    }
  }
</script>
<template>
  <!--使得组件只会渲染一次, 撤销时会被缓存-->
  <router-view keep-alive :avatar.sync="avatar" :manager.sync="manager" :queue="queue" :plugins="plugins"></router-view>
</template>
<script>
  export default {
    data () {
      return {
        manager: {
          qr: null,
          msg: null
        },
        avatar: '',
        queue: [],
        plugins: []
      }
    },
    ready () {
      this.plugins = JSON.parse(window.localStorage.getItem('plugins'))
    }
  }
</script>

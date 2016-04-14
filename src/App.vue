<template>
  <div>
    <!--使得组件只会渲染一次, 撤销时会被缓存-->
    <router-view keep-alive :avatar.sync="avatar" :manager.sync="manager" :queue="queue"
                 :plugins="plugins"></router-view>
    <i class="close" v-on:click="terminate">×</i>
  </div>
</template>
<style>
  .close {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
  }
</style>
<script>
  import Electron from 'electron'
  const terminate = Electron.remote.getGlobal('terminate')
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
    },
    methods: {
      terminate: function () {
        if (window.confirm('是否要关闭?')) {
          terminate()
        }
      }
    }
  }
</script>

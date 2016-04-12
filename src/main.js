import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'
import Welcome from './components/Welcome'
import Login from './components/Login'
import Work from './components/Work'
import Setting from './components/Setting'
import jQuery from 'jquery'
Vue.use(VueRouter)

// 定义路由器
var router = new VueRouter()

// 定义路径
router.map({
  '/': {
    name: 'welcome',
    component: Welcome
  },
  '/login': {
    name: 'login',
    component: Login
  },
  '/work': {
    name: 'work',
    component: Work
  },
  '/setting': {
    name: 'setting',
    component: Setting
  }
})

var mainApp = Vue.extend({
  components: {App}
})

// 启动路由
router.start(mainApp, 'body')

// 过渡动画效果
Vue.transition('fade', {
  css: false,
  enter (el, done) {
    jQuery(el).css({
      'opacity': 0
    }).animate({
      'opacity': 1
    }, 333, done)
  },
  enterCancelled (el) {
    jQuery(el).stop()
  },
  leave (el, done) {
    jQuery(el).animate({
      'opacity': 0
    }, 999, done)
  },
  leaveCancelled (el) {
    jQuery(el).stop()
  }
})


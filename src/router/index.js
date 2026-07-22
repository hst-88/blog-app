import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录 - TaskHub', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    // 路由元信息 meta：用来存放自定义数据
    meta: { 
      title: '我的工作台', 
      requiresAuth: true,
      breadcrumb: '首页'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
// src/router/index.js (核心片段)
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true'

  // 如果去首页但没登录 -> 去登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // 如果已登录还想去登录页 -> 回首页
  else if (to.path === '/login' && isAuthenticated) {
    next('/')
  }
  else {
    next()
  }
})
export default router
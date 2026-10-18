import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/Login.vue') },
    {
      path: '/',
      component: () => import('./views/Layout.vue'),
      children: [
        { path: '', redirect: '/patients' },
        { path: 'patients', component: () => import('./views/Patients.vue') },
        { path: 'patients/:id', component: () => import('./views/Record.vue') },
        { path: 'alerts', component: () => import('./views/Alerts.vue') },
        { path: 'consult', component: () => import('./views/Consult.vue') },
        { path: 'followups', component: () => import('./views/Followups.vue') },
        { path: 'edu', component: () => import('./views/Edu.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('jh_doctor_token')
  if (to.path !== '/login' && !token) next('/login')
  else if (to.path === '/login' && token) next('/')
  else next()
})

export default router

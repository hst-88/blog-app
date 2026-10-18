import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/portal/Home.vue') },
    { path: '/login', redirect: '/admin/login' },
    { path: '/user/login', component: () => import('./views/user/Auth.vue') },
    {
      path: '/user',
      component: () => import('./views/user/Layout.vue'),
      children: [
        { path: '', redirect: '/user/home' },
        { path: 'home', component: () => import('./views/user/Home.vue') },
        { path: 'reports', component: () => import('./views/user/Reports.vue') },
        { path: 'reports/:id', component: () => import('./views/user/ReportDetail.vue') },
        { path: 'ai', component: () => import('./views/user/AiChat.vue') },
        { path: 'ai/:id', component: () => import('./views/user/AiChat.vue') },
        { path: 'packages', component: () => import('./views/user/Packages.vue') },
        { path: 'packages/:id', component: () => import('./views/user/PackageDetail.vue') },
        { path: 'booking/:id', component: () => import('./views/user/Booking.vue') },
        { path: 'appointments', component: () => import('./views/user/Appointments.vue') },
        { path: 'reminders', component: () => import('./views/user/Reminders.vue') },
        { path: 'risk', component: () => import('./views/user/Risk.vue') },
        { path: 'consults', component: () => import('./views/user/ConsultHistory.vue') },
        { path: 'consult', component: () => import('./views/user/Consult.vue') },
        { path: 'consult/:id', component: () => import('./views/user/Consult.vue') },
        { path: 'health', component: () => import('./views/user/Health.vue') },
        { path: 'mine', component: () => import('./views/user/Mine.vue') },
        { path: 'edit', component: () => import('./views/user/ProfileEdit.vue') },
      ],
    },
    { path: '/doctor/login', component: () => import('./views/doctor/Auth.vue') },
    {
      path: '/doctor',
      component: () => import('./views/doctor/Layout.vue'),
      children: [
        { path: '', redirect: '/doctor/home' },
        { path: 'home', component: () => import('./views/doctor/Dashboard.vue') },
        { path: 'patients', component: () => import('./views/doctor/Patients.vue') },
        { path: 'patients/:id', component: () => import('./views/doctor/Record.vue') },
        { path: 'alerts', component: () => import('./views/doctor/Alerts.vue') },
        { path: 'consult', component: () => import('./views/doctor/Consult.vue') },
        { path: 'followups', component: () => import('./views/doctor/Followups.vue') },
        { path: 'edu', component: () => import('./views/doctor/Edu.vue') },
        { path: 'settings', component: () => import('./views/doctor/Settings.vue') },
      ],
    },
    { path: '/admin/login', component: () => import('./views/Login.vue') },
    {
      path: '/admin',
      component: () => import('./views/Layout.vue'),
      children: [
        { path: '', component: () => import('./views/Overview.vue') },
        { path: 'imports', component: () => import('./views/Imports.vue') },
        { path: 'fhir', component: () => import('./views/Fhir.vue') },
        { path: 'packages', component: () => import('./views/Packages.vue') },
        { path: 'appointments', component: () => import('./views/Appointments.vue') },
        { path: 'stats', component: () => import('./views/Stats.vue') },
        { path: 'users', component: () => import('./views/Users.vue') },
        { path: 'doctors', component: () => import('./views/Doctors.vue') },
        { path: 'rbac', component: () => import('./views/Rbac.vue') },
        { path: 'logs', component: () => import('./views/Logs.vue') },
        { path: 'settings/alerts', component: () => import('./views/AlertRules.vue') },
        { path: 'settings/appointments', component: () => import('./views/AppointmentSettings.vue') },
        { path: 'settings/risk-model', component: () => import('./views/RiskModel.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const publicPaths = ['/', '/user/login', '/doctor/login', '/admin/login']
  if (publicPaths.includes(to.path)) return next()
  if (to.path.startsWith('/user')) {
    return localStorage.getItem('jh_user_token') ? next() : next('/user/login')
  }
  if (to.path.startsWith('/doctor')) {
    return localStorage.getItem('jh_doctor_token') ? next() : next('/doctor/login')
  }
  if (to.path.startsWith('/admin')) {
    return localStorage.getItem('jh_admin_token') ? next() : next('/admin/login')
  }
  next()
})

export default router

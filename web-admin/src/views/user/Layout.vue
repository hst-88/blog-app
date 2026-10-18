<template>
  <div class="mp-root">
    <div class="mp" :class="{ 'has-tab': showTab }">
      <main class="mp-body" :class="{ chat: isChat }"><router-view /></main>
      <nav v-if="showTab" class="mp-tab">
        <router-link to="/user/home">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>
          首页
        </router-link>
        <router-link to="/user/packages">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5"/></svg>
          预约
        </router-link>
        <router-link to="/user/reports">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
          报告
        </router-link>
        <router-link to="/user/mine">
          <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5 19c1.2-3.2 3.6-4.8 7-4.8s5.8 1.6 7 4.8"/></svg>
          我的
        </router-link>
      </nav>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isChat = computed(() => route.path.startsWith('/user/consult') || route.path.startsWith('/user/ai'))
const showTab = computed(() => {
  const p = route.path
  if (p.startsWith('/user/reports/')) return false
  if (p.startsWith('/user/packages/')) return false
  if (p.startsWith('/user/booking/')) return false
  if (p.startsWith('/user/consult')) return false
  if (p.startsWith('/user/ai')) return false
  if (p === '/user/risk' || p === '/user/health' || p === '/user/reminders' || p === '/user/edit' || p === '/user/consults') return false
  return true
})
</script>

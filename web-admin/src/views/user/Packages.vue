<template>
  <div>
    <div class="mp-nav">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>体检预约</h1>
        <span class="ghost" @click="$router.push('/user/appointments')">我的</span>
      </div>
    </div>
    <div style="padding:12px 14px 0">
      <div class="pk-banner" :class="{ closed }">
        <template v-if="closed">
          <b>今日已停止预约</b>
          <span>可选择其他日期，或到详情页查看余量</span>
        </template>
        <template v-else>
          <b>今日可约 {{ todayRemaining }} 人</b>
          <span>共 {{ slotsPerDay }} 个时段 · 每时段 {{ capacity }} 人，号源所有套餐共用</span>
        </template>
      </div>
      <p class="pk-lead">专业体检套餐 · 检后由签约医生解读并跟踪</p>
    </div>
    <div style="padding:4px 14px 14px">
      <div v-if="!items.length" class="empty">暂无可预约套餐</div>
      <div v-for="p in items" :key="p.id" class="pk-card tap" @click="$router.push('/user/packages/' + p.id)">
        <div class="pk-top">
          <b>{{ p.name }}</b>
          <span class="pk-price"><i>¥</i>{{ p.price }}</span>
        </div>
        <div class="sub">{{ p.crowd }}</div>
        <div class="pk-tags">
          <span v-for="t in p.tags" :key="t">{{ t }}</span>
        </div>
        <div class="pk-foot">
          <span>{{ p.items.length }} 项检查 · {{ p.duration }}</span>
          <span class="go">立即预约 ›</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { userHttp } from '../../api'
const items = ref([])
const todayRemaining = ref(0)
const capacity = ref(0)
const slotsPerDay = ref(0)
const closed = ref(false)
onMounted(async () => {
  items.value = (await userHttp.get('/packages')).items || []
  try {
    const today = new Date().toISOString().slice(0, 10)
    const a = await userHttp.get('/appointments/availability', { params: { date: today } })
    todayRemaining.value = a.totalRemaining ?? 0
    capacity.value = a.capacity || 0
    slotsPerDay.value = a.slotsPerDay || 0
    closed.value = !!a.closed
  } catch { /* ignore */ }
})
</script>
<style scoped>
.pk-banner { background: linear-gradient(135deg, #07c8c0, #06a8a1); color: #fff; border-radius: 14px; padding: 14px 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 3px; box-shadow: 0 10px 24px rgba(6,168,161,.22); }
.pk-banner b { font-size: 17px; }
.pk-banner span { font-size: 12px; opacity: .9; }
.pk-banner.closed { background: linear-gradient(135deg, #f59e0b, #d97706); }
.pk-lead { color: #8b949e; font-size: 12px; margin: 0 2px 10px; }
.pk-card { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 6px 20px rgba(6,168,161,.08); }
.pk-top { display: flex; justify-content: space-between; align-items: baseline; }
.pk-top b { font-size: 16px; }
.pk-price { color: var(--mp-danger); font-weight: 800; font-size: 20px; }
.pk-price i { font-size: 12px; font-style: normal; margin-right: 1px; }
.pk-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 4px; }
.pk-tags span { font-size: 11px; background: #e7f8f7; color: var(--mp-deep); border-radius: 6px; padding: 3px 8px; }
.pk-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; color: #8b949e; font-size: 12px; }
.pk-foot .go { color: var(--mp); font-weight: 700; }
</style>

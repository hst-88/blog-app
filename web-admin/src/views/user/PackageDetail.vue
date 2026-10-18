<template>
  <div>
    <div class="mp-nav">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>套餐详情</h1>
        <span class="ghost"></span>
      </div>
    </div>
    <div v-if="p" style="padding:12px 14px 30px">
      <div class="pd-head">
        <b>{{ p.name }}</b>
        <div class="pd-price"><i>¥</i>{{ p.price }}</div>
        <p class="sub">{{ p.crowd }}</p>
        <div class="pd-meta">
          <span>📍 {{ p.dept }}</span>
          <span>⏱ {{ p.duration }}</span>
        </div>
        <p class="pd-desc">{{ p.desc }}</p>
      </div>

      <section class="mp-sec" style="padding:0">
        <h3>检查项目（{{ p.items.length }} 项）</h3>
        <div class="mp-card">
          <div v-for="it in p.items" :key="it.code" class="pd-item">
            <span class="pd-ico">{{ it.name.slice(0, 1) }}</span>
            <div>
              <b>{{ it.name }}</b>
              <div class="sub">{{ it.dept }}<template v-if="it.desc"> · {{ it.desc }}</template></div>
            </div>
          </div>
        </div>
      </section>

      <section class="mp-sec" style="padding:0">
        <h3>预约时间</h3>
        <div class="mp-card">
          <div class="field" style="margin-bottom:10px">
            <label>体检日期</label>
            <input v-model="date" type="date" :min="minDate" @change="loadSlots" />
          </div>
          <div class="seat-bar" :class="{ closed }">
            <template v-if="closed">
              当日已停止预约，请选择其他日期
            </template>
            <template v-else>
              当日可约 <b>{{ totalRemaining }}</b> 人
              <span>共 {{ slotsPerDay }} 个时段 · 每时段 {{ capacity }} 人</span>
            </template>
          </div>
          <label style="font-size:12px;color:#8b949e">时段</label>
          <div class="slots">
            <button v-for="s in slots" :key="s.slot" type="button" :class="{ on: slot === s.slot, off: s.full }" :disabled="s.full || closed" @click="slot = s.slot">
              {{ s.slot }}
              <small>{{ s.full ? '已满' : `余 ${s.remaining}` }}</small>
            </button>
          </div>
        </div>
      </section>

      <section v-if="p.notice && p.notice.length" class="mp-sec" style="padding:0">
        <h3>体检须知</h3>
        <div class="mp-card">
          <p v-for="(n, i) in p.notice" :key="i" class="pd-notice">{{ i + 1 }}. {{ n }}</p>
        </div>
      </section>

      <p class="disclaimer">提交后可在「我的预约」查看；如需改期请先取消后重新预约</p>
      <button class="mp-btn" :disabled="!slot || submitting || closed" @click="submit">确认预约 · ¥{{ p.price }}</button>
    </div>
    <div v-else class="empty">加载中…</div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userHttp } from '../../api'
const route = useRoute()
const router = useRouter()
const p = ref(null)
const slots = ref([])
const slot = ref('')
const submitting = ref(false)
const date = ref('')
const totalRemaining = ref(0)
const capacity = ref(0)
const slotsPerDay = ref(0)
const closed = ref(false)
const minDate = (() => { const d = new Date(); return d.toISOString().slice(0, 10) })()
const defaultDate = (() => { const d = new Date(Date.now() + 86400000); return d.toISOString().slice(0, 10) })()

async function loadSlots() {
  if (!date.value) return
  const res = await userHttp.get('/appointments/availability', { params: { date: date.value } })
  slots.value = res.items || []
  capacity.value = res.capacity || 0
  slotsPerDay.value = res.slotsPerDay || slots.value.length
  totalRemaining.value = res.totalRemaining ?? slots.value.reduce((s, it) => s + it.remaining, 0)
  closed.value = !!res.closed
  const free = slots.value.find((s) => !s.full)
  slot.value = closed.value || !free ? '' : free.slot
}
async function submit() {
  router.push({ path: '/user/booking/' + p.value.id, query: { date: date.value, slot: slot.value } })
}
onMounted(async () => {
  p.value = await userHttp.get('/packages/' + route.params.id)
  date.value = defaultDate
  await loadSlots()
})
</script>
<style scoped>
.pd-head { background: linear-gradient(160deg, #07c8c0, #06a8a1); color: #fff; border-radius: 18px; padding: 18px; margin-bottom: 16px; box-shadow: 0 12px 30px rgba(6,168,161,.24); }
.pd-head b { font-size: 18px; }
.pd-price { font-size: 30px; font-weight: 800; margin: 8px 0 2px; }
.pd-price i { font-size: 15px; font-style: normal; }
.pd-head .sub { color: rgba(255,255,255,.85); font-size: 12px; margin: 0 0 10px; }
.pd-meta { display: flex; gap: 14px; font-size: 12px; opacity: .95; margin-bottom: 8px; }
.pd-desc { margin: 0; font-size: 12px; line-height: 1.6; opacity: .92; }
.pd-item { display: flex; gap: 10px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--mp-line); }
.pd-item:last-child { border-bottom: 0; }
.pd-item b { font-size: 14px; }
.pd-ico { width: 30px; height: 30px; border-radius: 9px; background: #e7f8f7; color: var(--mp-deep); display: grid; place-items: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
.pd-notice { margin: 0 0 6px; font-size: 12px; color: #64748b; line-height: 1.6; }
.seat-bar { background: #e7f8f7; color: var(--mp-deep); border-radius: 12px; padding: 10px 12px; font-size: 13px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 2px; }
.seat-bar b { font-size: 20px; color: var(--mp); margin: 0 2px; }
.seat-bar span { font-size: 11px; color: #7c8b93; }
.seat-bar.closed { background: #fff4e0; color: #d97706; }
.slots { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
.slots button { height: 48px; border: 1px solid #e8edf1; background: #f8fafb; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.slots button small { font-size: 10px; color: #8b949e; font-weight: 400; }
.slots button.on { background: #e7f8f7; border-color: var(--mp); color: var(--mp-deep); }
.slots button.off { opacity: .5; cursor: not-allowed; }
</style>

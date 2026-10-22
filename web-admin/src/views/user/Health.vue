<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>健康打卡</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" type="button" :class="{ on: type === t.key }" @click="type = t.key">{{ t.label }}</button>
      </div>
      <div class="mp-card">
        <div class="bp-pad">
          <template v-if="type === 'bp'">
            <div class="num">{{ sbp }}<span class="slash">/</span>{{ dbp }}<span class="unit"> mmHg</span></div>
            <div class="sub">收缩压 / 舒张压 · 收缩压超过 180 会通知签约医生</div>
          </template>
          <template v-else>
            <div class="num">{{ num }}<span class="unit"> {{ unit }}</span></div>
            <div class="sub">{{ tabs.find((t) => t.key === type).hint }}</div>
          </template>
        </div>
        <div v-if="type === 'bp'" class="dual">
          <div>
            <div class="lab">收缩压</div>
            <div class="stepper">
              <button type="button" @click="sbp = Math.max(70, sbp - 1)">−</button>
              <b>{{ sbp }}</b>
              <button type="button" @click="sbp = Math.min(220, sbp + 1)">+</button>
            </div>
          </div>
          <div>
            <div class="lab">舒张压</div>
            <div class="stepper">
              <button type="button" @click="dbp = Math.max(40, dbp - 1)">−</button>
              <b>{{ dbp }}</b>
              <button type="button" @click="dbp = Math.min(140, dbp + 1)">+</button>
            </div>
          </div>
        </div>
        <div v-else class="stepper wide">
          <button type="button" @click="bump(-step)">−</button>
          <input v-model.number="num" type="number" />
          <button type="button" @click="bump(step)">+</button>
        </div>
        <button class="mp-btn" @click="save">提交今日打卡</button>
        <p v-if="hint" class="warn">{{ hint }}</p>
        <button v-if="alerted" class="mp-btn ghost" style="margin-top:10px" @click="$router.push('/user/consult')">去咨询医生</button>
      </div>
      <div class="mp-card">
        <b>{{ tabs.find((t) => t.key === type).label }}变化趋势</b>
        <div v-if="series.length < 2" class="empty" style="padding:24px 0">至少打卡 2 次后显示趋势</div>
        <div v-else ref="chartEl" class="trend"></div>
      </div>
      <p class="disclaimer">危急值会进入医生端「预警中心」，签约医生可在工作台看到待处理预警。</p>
      <h3 style="margin:16px 4px 8px;font-size:15px">历史记录</h3>
      <div v-if="!shown.length" class="empty">还没有记录</div>
      <div v-for="i in shown" :key="i.id" class="mp-card hist">
        <div>
          <b>{{ display(i) }}</b>
          <div class="sub">{{ fmt(i.createdAt) }}</div>
        </div>
        <span class="chip" :class="i.abnormal ? 'high' : 'low'">{{ i.abnormal ? '已通知医生' : '正常' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { userHttp } from '../../api'
const tabs = [
  { key: 'bp', label: '血压', hint: '记录清晨安静状态下的血压', unit: 'mmHg' },
  { key: 'glucose', label: '血糖', hint: '空腹血糖参考 3.9–6.1 mmol/L', unit: 'mmol/L' },
  { key: 'weight', label: '体重', hint: '建议晨起空腹、同一体重秤', unit: 'kg' },
  { key: 'steps', label: '步数', hint: '记录当日活动量', unit: '步' },
]
const type = ref('bp')
const sbp = ref(120)
const dbp = ref(80)
const num = ref(5.6)
const hint = ref('')
const alerted = ref(false)
const items = ref([])
const chartEl = ref(null)
let chart
const unit = computed(() => tabs.find((t) => t.key === type.value).unit)
const step = computed(() => ({ glucose: 0.1, weight: 0.1, steps: 500 }[type.value] || 1))
const shown = computed(() => items.value.filter((i) => i.type === type.value).slice().reverse())
const series = computed(() => shown.value.slice().reverse().slice(-14))
const fmt = (t) => String(t || '').replace('T', ' ').slice(0, 16)
function display(i) {
  if (i.type === 'bp') return `${i.value?.sbp || '-'} / ${i.value?.dbp || '-'} mmHg`
  return `${i.value?.value ?? '-'} ${i.value?.unit || ''}`
}
function bump(delta) {
  const next = Number((Number(num.value) + delta).toFixed(1))
  num.value = Math.max(0, next)
}
function render() {
  if (!chartEl.value || series.value.length < 2) return
  if (!chart) chart = echarts.init(chartEl.value)
  const xs = series.value.map((i) => fmt(i.createdAt).slice(5, 10))
  const ys = type.value === 'bp'
    ? series.value.map((i) => Number(i.value?.sbp || 0))
    : series.value.map((i) => Number(i.value?.value || 0))
  const ys2 = type.value === 'bp' ? series.value.map((i) => Number(i.value?.dbp || 0)) : null
  chart.setOption({
    color: ['#07c8c0', '#94a3b8'],
    grid: { left: 36, right: 12, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xs, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f4' } } },
    series: [
      { name: type.value === 'bp' ? '收缩压' : tabs.find((t) => t.key === type.value).label, type: 'line', smooth: true, data: ys, symbolSize: 7 },
      ys2 ? { name: '舒张压', type: 'line', smooth: true, data: ys2, symbolSize: 7 } : null,
    ].filter(Boolean),
  }, true)
}
watch(type, async (t) => {
  if (t === 'glucose') num.value = 5.6
  if (t === 'weight') num.value = 65
  if (t === 'steps') num.value = 6000
  hint.value = ''
  alerted.value = false
  await nextTick()
  render()
})
watch(items, async () => { await nextTick(); render() })
async function load() { items.value = (await userHttp.get('/health-logs')).items || [] }
async function save() {
  const body = type.value === 'bp'
    ? { type: 'bp', sbp: Number(sbp.value), dbp: Number(dbp.value) }
    : { type: type.value, value: Number(num.value) }
  const r = await userHttp.post('/health-logs', body)
  hint.value = r.hint
  alerted.value = !!r.alertCreated
  load()
}
onMounted(async () => {
  await load()
  window.addEventListener('resize', render)
})
onUnmounted(() => {
  window.removeEventListener('resize', render)
  chart?.dispose()
})
</script>
<style scoped>
.tabs { display: flex; gap: 6px; margin-bottom: 10px; }
.tabs button {
  flex: 1; height: 34px; border: 0; border-radius: 999px; background: #fff; color: #64748b; font-size: 13px; cursor: pointer;
}
.tabs button.on { background: #07c8c0; color: #fff; font-weight: 700; }
.slash { font-size: 28px; color: #cbd5e1; margin: 0 4px; }
.dual { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.lab { text-align: center; font-size: 12px; color: #8b949e; }
.stepper { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 6px 0 12px; }
.stepper b { min-width: 36px; text-align: center; }
.stepper.wide input {
  width: 96px; height: 40px; border: 1px solid #e8edf1; border-radius: 12px; text-align: center; font-size: 18px; font-weight: 700;
}
.warn { color: #e11d48; text-align: center; margin: 10px 0 0; font-size: 13px; line-height: 1.5; }
.trend { height: 200px; }
.hist { display: flex; justify-content: space-between; align-items: center; }
</style>

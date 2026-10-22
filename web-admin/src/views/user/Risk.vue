<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>健康风险评估</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div v-if="!risk" class="empty">正在评估…</div>
      <template v-else>
        <div class="mp-card hero">
          <div class="sub">基于 {{ risk.examDate || '最近一次' }} 体检报告 · 模型 {{ risk.modelVersion || 'v1' }}</div>
          <div class="hero-row">
            <div>
              <b class="lv" :class="worst">{{ label(worst) }}</b>
              <p>{{ risk.advice }}</p>
            </div>
            <span class="chip" :class="worst">异常 {{ risk.abnormalCount || 0 }} 项</span>
          </div>
        </div>
        <div class="mp-card">
          <b>五维风险雷达</b>
          <div class="sub" style="margin-bottom:4px">分数越高，该维度越需要关注</div>
          <div ref="radarEl" class="radar"></div>
        </div>
        <div class="mp-card">
          <b>慢病分层</b>
          <div v-for="d in risk.diseases" :key="d.name" class="dis">
            <div>
              <b>{{ d.name }}</b>
              <div class="sub">{{ tip(d) }}</div>
            </div>
            <span class="chip" :class="d.level">{{ label(d.level) }}</span>
          </div>
        </div>
        <div class="mp-card">
          <b>详细建议</b>
          <div class="sub" style="margin-bottom:12px">{{ ctaHint }}</div>
          <button class="mp-btn" @click="goAdvice">查看详细建议</button>
          <button class="mp-btn ghost" style="margin-top:10px" @click="$router.push(cta.to)">{{ cta.label }}</button>
          <button v-if="cta.alt" class="mp-btn ghost" style="margin-top:10px" @click="$router.push(cta.alt.to)">{{ cta.alt.label }}</button>
          <p class="disclaimer">评估仅供健康管理参考，不能替代医生诊断</p>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { userHttp } from '../../api'
const router = useRouter()
const risk = ref(null)
const radarEl = ref(null)
let chart
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || lv)
const worst = computed(() => {
  const levels = (risk.value?.diseases || []).map((d) => d.level)
  if (levels.includes('high')) return 'high'
  if (levels.includes('mid')) return 'mid'
  return 'low'
})
const focusDim = computed(() => {
  const rows = risk.value?.radar || []
  return [...rows].sort((a, b) => b.score - a.score)[0]
})
const cta = computed(() => {
  if (worst.value === 'high') return { label: '立即咨询签约医生', to: '/user/consult', alt: { label: '预约复查套餐', to: '/user/packages' } }
  if (worst.value === 'mid') return { label: '预约复查套餐', to: '/user/packages', alt: { label: '去咨询医生', to: '/user/consult' } }
  return { label: '去健康打卡', to: '/user/health', alt: { label: '查看复查提醒', to: '/user/reminders' } }
})
const ctaHint = computed(() => {
  if (worst.value === 'high') return '高风险分层已同步医生工作台，建议尽快在线咨询或预约复查'
  if (worst.value === 'mid') return '中风险建议结合套餐复查，也可向签约医生追问生活干预'
  return '低风险可坚持打卡；医生随访会自动出现在复查提醒里'
})
function tip(d) {
  if (d.level === 'high') return '建议尽快咨询医生并安排复查'
  if (d.level === 'mid') return '注意饮食运动，必要时预约复查'
  return '目前控制较好，持续观察即可'
}
function goAdvice() {
  const dim = focusDim.value?.dim || '代谢风险'
  const q = `我的${dim}为${label(worst.value)}，应该注意什么？`
  router.push({ path: '/user/ai', query: { q } })
}
function render() {
  if (!radarEl.value || !risk.value?.radar) return
  if (!chart) chart = echarts.init(radarEl.value)
  const names = risk.value.radar.map((r) => r.dim.replace('风险', ''))
  const values = risk.value.radar.map((r) => r.score)
  chart.setOption({
    radar: {
      indicator: names.map((n) => ({ name: n, max: 100 })),
      splitNumber: 4,
      axisName: { color: '#64748b', fontSize: 11 },
      splitArea: { areaStyle: { color: ['#f8fffe', '#eef8f7'] } },
      splitLine: { lineStyle: { color: '#cdeceb' } },
      axisLine: { lineStyle: { color: '#cdeceb' } },
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: '风险' }],
      areaStyle: { color: 'rgba(7,200,192,0.28)' },
      lineStyle: { color: '#07c8c0', width: 2 },
      itemStyle: { color: '#06a8a1' },
      symbolSize: 6,
    }],
  })
}
watch(risk, async () => { await nextTick(); render() })
onMounted(async () => {
  risk.value = await userHttp.get('/risk/me')
  window.addEventListener('resize', render)
})
onUnmounted(() => {
  window.removeEventListener('resize', render)
  chart?.dispose()
})
</script>
<style scoped>
.hero-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-top: 8px; }
.lv { font-size: 22px; }
.lv.high { color: #e11d48; }
.lv.mid { color: #d97706; }
.lv.low { color: #16a34a; }
.hero p { margin: 6px 0 0; font-size: 13px; color: #475569; line-height: 1.55; }
.radar { height: 240px; }
.dis { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--mp-line); }
.dis:last-child { border-bottom: 0; padding-bottom: 0; }
.dis:first-of-type { margin-top: 4px; }
</style>

<template>
  <div>
    <h3 class="jh-page-title">{{ greet }}，{{ data.doctorName || '医生' }}</h3>
    <p class="jh-page-sub">{{ data.title ? data.title + ' · ' : '' }}今日待办来自用户咨询、打卡危急值和导入预警，点卡片进入处理页</p>
    <div class="kpi-grid">
      <div class="kpi tap" @click="$router.push('/doctor/patients')"><span>签约患者</span><b>{{ data.patients || 0 }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/consult')"><span>待回复咨询</span><b>{{ data.unread || 0 }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/followups')"><span>待随访</span><b>{{ (data.followups || 0) }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/alerts')"><span>今日预警</span><b>{{ data.alertsOpen || 0 }}</b></div>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="hd"><b>待办事项</b><el-button text type="primary" @click="$router.push('/doctor/alerts')">全部预警</el-button></div>
          </template>
          <el-empty v-if="!(data.todos || []).length" description="暂无待办，导入报告或等用户咨询后会出现" />
          <div v-for="t in data.todos || []" :key="t.key" class="todo" @click="$router.push(t.to)">
            <div>
              <el-tag :type="t.type" size="small">{{ t.kind }}</el-tag>
              <span class="lab">{{ t.label }}</span>
            </div>
            <em>{{ t.extra }}</em>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><b>近 7 日患者咨询</b></template>
          <div ref="chartEl" class="trend"></div>
          <div class="quick">
            <el-button type="primary" @click="$router.push('/doctor/consult')">回复咨询</el-button>
            <el-button @click="$router.push('/doctor/patients')">查看患者</el-button>
            <el-button @click="$router.push('/doctor/edu')">发布宣教</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { doctorHttp } from '../../api'
const data = ref({})
const chartEl = ref(null)
let chart
const greet = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const rows = data.value.consultTrend || []
  chart.setOption({
    color: ['#0f766e'],
    grid: { left: 36, right: 12, top: 16, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: rows.map((x) => x.day), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#eef2f4' } } },
    series: [{ type: 'line', smooth: true, areaStyle: { color: 'rgba(15,118,110,0.12)' }, data: rows.map((x) => x.count), symbolSize: 8 }],
  })
}
watch(() => data.value.consultTrend, async () => { await nextTick(); render() })
onMounted(async () => {
  data.value = await doctorHttp.get('/doctor/overview')
  window.addEventListener('resize', render)
})
onUnmounted(() => {
  window.removeEventListener('resize', render)
  chart?.dispose()
})
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.todo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #eef2f6;
  cursor: pointer;
}
.todo:last-child { border-bottom: 0; }
.todo .lab { margin-left: 8px; font-size: 14px; }
.todo em { font-style: normal; color: #94a3b8; font-size: 12px; }
.kpi.tap { cursor: pointer; }
.trend { height: 220px; }
.quick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
</style>

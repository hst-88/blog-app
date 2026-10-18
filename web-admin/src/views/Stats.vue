<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>统计白皮书</b>
          <p>按机构汇总报告数、异常率与检出率</p>
        </div>
        <el-form inline>
          <el-form-item label="机构"><el-input v-model="org" /></el-form-item>
          <el-button type="primary" @click="load">统计</el-button>
          <el-button @click="paper">生成白皮书</el-button>
          <el-button @click="exportJson">导出 JSON</el-button>
        </el-form>
      </div>
    </template>
    <el-descriptions v-if="data" :column="3" border>
      <el-descriptions-item label="报告数">{{ data.reportCount }}</el-descriptions-item>
      <el-descriptions-item label="异常率">{{ ((data.abnormalRate || 0) * 100).toFixed(1) }}%</el-descriptions-item>
      <el-descriptions-item label="检出率">{{ ((data.detectRate || 0) * 100).toFixed(1) }}%</el-descriptions-item>
    </el-descriptions>
    <div ref="chartEl" style="height:320px;margin-top:16px"></div>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { adminHttp } from '../api'
const org = ref('')
const data = ref(null)
const chartEl = ref()
async function load() {
  data.value = await adminHttp.get('/admin/stats', { params: { org: org.value } })
  render()
}
async function paper() {
  data.value = await adminHttp.post('/admin/stats/whitepaper', { org: org.value })
  render()
}
async function exportJson() {
  const res = await fetch('/api/admin/stats/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('jh_admin_token')}` },
    body: JSON.stringify({ org: org.value }),
  })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'stats.json'
  a.click()
}
function render() {
  if (!chartEl.value || !data.value) return
  const c = echarts.init(chartEl.value)
  c.setOption({
    color: ['#0284c7'],
    title: { text: '指标异常率', textStyle: { fontSize: 14 } },
    xAxis: { type: 'category', data: (data.value.byName || []).map((x) => x.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: (data.value.byName || []).map((x) => Number((x.rate * 100).toFixed(1))), barWidth: 28 }],
  })
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
</style>

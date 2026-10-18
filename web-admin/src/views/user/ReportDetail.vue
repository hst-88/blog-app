<template>
  <div v-if="report">
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>报告详情</h1>
        <span class="ghost" @click="$router.push('/user/consult')">问医生</span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div class="mp-card">
        <div class="top">
          <div>
            <b>{{ report.orgName }}</b>
            <div class="sub">{{ report.examDate }} · 点指标可追问</div>
          </div>
          <span class="chip" :class="report.riskLevel">{{ label(report.riskLevel) }}</span>
        </div>
        <div v-if="abnormals.length" class="abn-list">
          <span v-for="i in abnormals" :key="i.id">{{ i.name }} {{ i.valueText }}{{ i.unit }} {{ i.arrow }}</span>
        </div>
      </div>
      <div class="mp-card" style="padding:4px 14px">
        <div v-for="i in report.indicators" :key="i.id" class="ind" :class="i.status" @click="ask(i)">
          <i class="dot" :class="i.status"></i>
          <div class="name">{{ i.name }}<small>{{ i.department }}</small></div>
          <div class="val">{{ i.valueText }}{{ i.unit }} {{ i.arrow }}<small>参考 {{ i.refRange }}</small></div>
        </div>
      </div>
      <button class="mp-btn" :disabled="loading" @click="interpret">{{ loading ? '解读中…' : 'AI 智能解读' }}</button>
      <button class="mp-btn ghost" style="margin-top:8px" @click="$router.push('/user/ai/' + report.id)">进入 AI 对话</button>
      <button class="mp-btn ghost" style="margin-top:8px" @click="$router.push('/user/consult')">咨询签约医生</button>
      <p class="disclaimer">AI 建议仅供参考，不能替代医生诊断</p>
      <div v-if="summary" class="ai-box"><div class="lab">整体解读</div>{{ summary }}</div>
      <div v-if="answer" class="ai-box"><div class="lab">指标追问</div>{{ answer }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const route = useRoute()
const report = ref(null)
const summary = ref('')
const answer = ref('')
const loading = ref(false)
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || lv)
const abnormals = computed(() => (report.value?.indicators || []).filter((i) => i.status && i.status !== 'normal'))
onMounted(async () => {
  report.value = await userHttp.get('/reports/' + route.params.id)
  if (report.value.aiSummary) summary.value = report.value.aiSummary
})
async function interpret() {
  loading.value = true
  try {
    const r = await userHttp.post(`/reports/${route.params.id}/interpret`)
    summary.value = r.summary
  } catch (e) { ElMessage.error(e.message || 'AI正在思考，请稍后') }
  finally { loading.value = false }
}
async function ask(i) {
  try {
    const r = await userHttp.post(`/reports/${route.params.id}/ask`, { indicator: i.name, question: `${i.name}这个指标偏高严重吗？` })
    answer.value = r.answer
  } catch (e) { ElMessage.error(e.message) }
}
</script>

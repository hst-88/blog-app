<template>
  <div style="display:flex;flex-direction:column;height:100%">
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>AI 智能解读</h1>
        <span class="ghost" @click="pickReport">切换报告</span>
      </div>
    </div>
    <div v-if="!reportId" class="empty" style="padding-top:80px">
      暂无体检报告，无法进行 AI 解读<br />
      <a style="color:var(--mp)" @click="$router.push('/user/reports')">查看报告列表</a>
    </div>
    <template v-else>
      <div class="chat-list" ref="pane">
        <div class="ai-report-tag">
          {{ report?.orgName }} · {{ report?.examDate }}
          <span class="chip" :class="report?.riskLevel">{{ label(report?.riskLevel) }}</span>
        </div>
        <div v-if="summary" class="msg">
          <div class="avatar doc">AI</div>
          <div class="balloon">{{ summary }}
            <span class="disc">AI建议仅供参考，不能替代医生诊断</span>
          </div>
        </div>
        <div v-for="c in chats" :key="c.id">
          <div class="msg user">
            <div class="avatar me">我</div>
            <div class="balloon">{{ c.question }}</div>
          </div>
          <div class="msg">
            <div class="avatar doc">AI</div>
            <div class="balloon">{{ c.answer }}
              <span class="disc">AI建议仅供参考，不能替代医生诊断</span>
            </div>
          </div>
        </div>
        <div v-if="!summary && !chats.length" class="empty">
          点击下方「生成整体解读」或直接提问
        </div>
      </div>
      <div class="quick">
        <button type="button" @click="interpret">生成整体解读</button>
        <button v-for="q in quick" :key="q" type="button" @click="ask(q)">{{ q }}</button>
      </div>
      <div class="composer">
        <input v-model="text" placeholder="输入您的问题…" @keyup.enter="ask(text)" />
        <button @click="ask(text)">发送</button>
      </div>
    </template>
  </div>
</template>
<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userHttp } from '../../api'
const route = useRoute()
const reportId = ref(null)
const report = ref(null)
const summary = ref('')
const chats = ref([])
const text = ref('')
const pane = ref(null)
const quick = ['这个指标偏高怎么办？', '需要吃药吗？', '饮食上注意什么？']
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || '待评估')

async function pickReport() {
  const list = (await userHttp.get('/reports')).items || []
  if (list.length < 2) return ElMessage.info('只有一个报告')
  const id = await ElMessageBox.prompt('输入要解读的报告 ID', '切换报告', {
    inputValue: String(reportId.value),
    inputValidator: (v) => list.some((r) => String(r.id) === String(v)) || '报告不存在',
  }).then((r) => Number(r.value)).catch(() => null)
  if (id) { reportId.value = id; await load() }
}
async function load() {
  report.value = await userHttp.get('/reports/' + reportId.value)
  const res = await userHttp.get(`/reports/${reportId.value}/chats`)
  summary.value = res.summary || ''
  chats.value = res.items || []
  await scroll()
}
async function scroll() {
  await nextTick()
  if (pane.value) pane.value.scrollTop = pane.value.scrollHeight
}
async function interpret() {
  try {
    const r = await userHttp.post(`/reports/${reportId.value}/interpret`)
    summary.value = r.summary
    scroll()
  } catch (e) { ElMessage.error(e.message || 'AI正在思考，请稍后') }
}
const targetIndicator = () =>
  report.value?.indicators?.find((i) => i.status && i.status !== 'normal')?.name ||
  report.value?.indicators?.[0]?.name || ''
async function ask(q) {
  if (!q || !q.trim()) return
  const indicator = targetIndicator()
  if (!indicator) return ElMessage.info('该报告暂无指标可解读')
  text.value = ''
  try {
    await userHttp.post(`/reports/${reportId.value}/ask`, { indicator, question: q })
    await load()
  } catch (e) { ElMessage.error(e.message || '提问失败') }
}
onMounted(async () => {
  if (route.params.id) reportId.value = Number(route.params.id)
  else {
    const list = (await userHttp.get('/reports')).items || []
    reportId.value = list[0]?.id || null
  }
  if (reportId.value) await load()
})
</script>
<style scoped>
.ai-report-tag { margin: 4px 6px 12px; color: #8b949e; font-size: 12px; display: flex; align-items: center; gap: 6px; justify-content: center; }
.disc { display: block; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0; color: #94a3b8; font-size: 11px; }
.quick { display: flex; gap: 8px; padding: 0 12px 8px; background: #ededed; overflow-x: auto; }
.quick button { flex-shrink: 0; border: 1px solid #d7dee3; background: #fff; color: #475569; border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
</style>

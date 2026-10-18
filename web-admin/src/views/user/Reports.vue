<template>
  <div>
    <div class="mp-nav">
      <div class="row">
        <h1>体检报告</h1>
        <span class="ghost" @click="$router.push('/user/ai')">AI 解读</span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div v-if="!items.length" class="empty">暂无报告<br />请联系体检中心导入，或使用示例身份证注册</div>
      <div class="timeline">
        <div v-for="r in items" :key="r.id" class="tl-row">
          <i class="tl-dot" :class="r.riskLevel"></i>
          <div class="mp-card tap tl-card" @click="$router.push('/user/reports/' + r.id)">
            <div class="top">
              <div>
                <b>{{ r.orgName }}</b>
                <div class="sub">{{ r.examDate }}</div>
              </div>
              <span class="chip" :class="r.riskLevel">{{ label(r.riskLevel) }}</span>
            </div>
            <div class="foot">
              <span>异常 {{ r.abnormalCount }} 项</span>
              <span>查看详情 ›</span>
            </div>
          </div>
        </div>
      </div>
      <button v-if="items.length < total" class="mp-btn ghost" :disabled="loading" @click="more">{{ loading ? '加载中…' : '加载更多' }}</button>
      <p v-if="items.length" class="disclaimer">共 {{ total }} 份报告</p>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { userHttp } from '../../api'
const items = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || lv)
async function load(reset) {
  loading.value = true
  try {
    const res = await userHttp.get('/reports', { params: { page: reset ? 1 : page.value } })
    items.value = reset ? res.items : [...items.value, ...res.items]
    total.value = res.total
  } finally { loading.value = false }
}
async function more() { page.value += 1; await load(false) }
onMounted(() => load(true))
</script>
<style scoped>
.timeline { padding-left: 6px; }
.tl-row { position: relative; padding-left: 18px; border-left: 2px solid #e6eef0; }
.tl-row:last-child { border-left-color: transparent; }
.tl-dot { position: absolute; left: -6px; top: 18px; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px #f3f6f8; }
.tl-dot.mid { background: #f59e0b; }
.tl-dot.high { background: #ef4444; }
.tl-card { margin-bottom: 10px; }
</style>

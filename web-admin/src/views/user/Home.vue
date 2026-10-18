<template>
  <div>
    <div class="mp-nav">
      <div class="row">
        <h1>检后无忧</h1>
        <span class="ghost" @click="$router.push('/user/mine')">{{ city }}</span>
      </div>
    </div>
    <div class="mp-hero">
      <p class="hi">{{ greet }}，{{ me.nickname || '用户' }}</p>
      <p class="meta">{{ latest ? `${latest.orgName} · ${latest.examDate}` : '暂无体检报告，完成实名后可匹配' }}</p>
      <div class="score-row">
        <div class="ring" :style="{ '--p': score }"><span>{{ score }}</span></div>
        <div class="score-copy">
          <b>{{ latest ? label(latest.riskLevel) : '待评估' }}</b>
          <p>{{ latest ? `共 ${latest.abnormalCount} 项异常，点进报告看解读与追问` : '使用示例身份证注册可匹配演示报告' }}</p>
        </div>
      </div>
      <router-link v-if="latest" class="hero-btn" :to="'/user/reports/' + latest.id">查看最近报告</router-link>
    </div>
    <div class="mp-grid">
      <router-link to="/user/packages">
        <i class="tile e"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5"/></svg></i>
        体检预约
      </router-link>
      <router-link to="/user/reports">
        <i class="tile a"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></i>
        报告查询
      </router-link>
      <router-link to="/user/ai">
        <i class="tile f"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg></i>
        AI解读
      </router-link>
      <router-link to="/user/consults">
        <i class="tile c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-5 4v-4H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg></i>
        在线咨询
      </router-link>
      <router-link to="/user/health">
        <i class="tile d"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h4l2-5 4 10 2-5h4"/></svg></i>
        健康打卡
      </router-link>
      <router-link to="/user/reminders">
        <i class="tile g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M12 2v2M9 20l-2 2M15 20l2 2"/></svg></i>
        复查提醒
      </router-link>
      <router-link to="/user/risk">
        <i class="tile b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7z"/></svg></i>
        风险评估
      </router-link>
    </div>
    <section class="mp-sec" v-if="pendingReminders.length">
      <h3>待复查提醒 <router-link to="/user/reminders">全部</router-link></h3>
      <div v-for="r in pendingReminders" :key="r.id" class="mp-card tap" @click="$router.push('/user/reminders')">
        <div class="top">
          <div><b>{{ r.title }}</b><div class="sub">建议复查 {{ r.dueDate || '待定' }} · {{ r.doctorName }}</div></div>
          <span class="chip mid">待复查</span>
        </div>
      </div>
    </section>
    <section class="mp-sec" v-if="packages.length">
      <h3>体检套餐 <router-link to="/user/packages">全部</router-link></h3>
      <div v-for="p in packages.slice(0, 2)" :key="p.id" class="mp-card tap" @click="$router.push('/user/packages/' + p.id)">
        <div class="top">
          <div>
            <b>{{ p.name }}</b>
            <div class="sub">{{ p.crowd }} · {{ p.items.length }} 项检查</div>
          </div>
          <span style="color:var(--mp-danger);font-weight:800">¥{{ p.price }}</span>
        </div>
        <div class="foot"><span>{{ (p.tags || []).slice(0, 2).join(' · ') }}</span><span>去预约 ›</span></div>
      </div>
    </section>
    <section class="mp-sec" v-if="edu.length">
      <h3>健康资讯</h3>
      <div class="mp-card">
        <a v-for="e in edu" :key="e.id" class="news" href="#" @click.prevent="read(e)">{{ e.title }}<em>›</em></a>
      </div>
    </section>
    <section class="mp-sec">
      <h3>最近报告 <router-link to="/user/reports">全部</router-link></h3>
      <div v-if="!items.length" class="mp-card empty">暂无报告，可让体检中心导入或使用示例身份证注册</div>
      <div v-for="r in items.slice(0, 2)" :key="r.id" class="mp-card tap" @click="$router.push('/user/reports/' + r.id)">
        <div class="top">
          <div>
            <b>{{ r.orgName }}</b>
            <div class="sub">{{ r.examDate }}</div>
          </div>
          <span class="chip" :class="r.riskLevel">{{ label(r.riskLevel) }}</span>
        </div>
        <div class="foot"><span>异常 {{ r.abnormalCount }} 项</span><span>查看详情 ›</span></div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const me = ref({})
const items = ref([])
const packages = ref([])
const reminders = ref([])
const edu = ref([])
const city = '北京'
const greet = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const latest = computed(() => items.value[0])
const pendingReminders = computed(() => reminders.value.filter((r) => r.status === 'pending').slice(0, 2))
const score = computed(() => {
  const r = latest.value
  if (!r) return 80
  return Math.max(40, 96 - r.abnormalCount * 8)
})
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || '待评估')
async function read(e) {
  try { await userHttp.post(`/edu/${e.id}/read`) } catch { /* ignore */ }
  ElMessage.success(e.title)
}
onMounted(async () => {
  try { me.value = (await userHttp.get('/auth/me')).user || {} } catch { me.value = {} }
  try { items.value = (await userHttp.get('/reports')).items || [] } catch { items.value = [] }
  try { packages.value = (await userHttp.get('/packages')).items || [] } catch { packages.value = [] }
  try { reminders.value = (await userHttp.get('/reminders')).items || [] } catch { reminders.value = [] }
  try { edu.value = ((await userHttp.get('/edu')).items || []).slice(0, 3) } catch { edu.value = [] }
})
</script>
<style scoped>
.hero-btn { display: inline-block; margin-top: 12px; background: #e7f8f7; color: var(--mp-deep); font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 999px; text-decoration: none; }
.mp-grid { grid-template-columns: repeat(4, 1fr); row-gap: 16px; }
.tile.f { background: linear-gradient(135deg, #c4b5fd, #8b5cf6); }
.tile.g { background: linear-gradient(135deg, #fca5a5, #ef4444); }
.news { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--mp-line); font-size: 14px; text-decoration: none; color: inherit; }
.news:last-child { border-bottom: 0; }
.news em { font-style: normal; color: #c0c4cc; }
</style>

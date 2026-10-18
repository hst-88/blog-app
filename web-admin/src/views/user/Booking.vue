<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>确认预约</h1>
        <span></span>
      </div>
    </div>
    <div v-if="p" style="padding:12px 14px 30px">
      <div class="mp-card bk-pkg">
        <div class="bk-row">
          <span class="bk-ico">{{ p.name.slice(0, 1) }}</span>
          <div style="flex:1">
            <b>{{ p.name }}</b>
            <div class="sub">{{ p.dept }} · {{ p.duration }}</div>
          </div>
          <div class="bk-price">¥{{ p.price }}</div>
        </div>
      </div>

      <div class="mp-card">
        <div class="bk-line"><span>体检日期</span><b>{{ date || '未选择' }}</b></div>
        <div class="bk-line"><span>预约时段</span><b>{{ slot || '未选择' }}</b></div>
        <div class="bk-line"><span>体检机构</span><b>{{ p.orgName || '爱康体检中心' }}</b></div>
      </div>

      <div class="mp-card">
        <h3 style="margin:0 0 10px;font-size:14px">体检人</h3>
        <div class="bk-line"><span>姓名</span><b>{{ me.realName || '待完善' }}</b></div>
        <div class="bk-line"><span>手机号</span><b>{{ me.phone || '未绑定' }}</b></div>
        <div class="bk-line"><span>身份证</span><b>{{ maskId(me.idNo) }}</b></div>
        <div v-if="!me.realName" class="bk-tip" @click="$router.push('/user/edit')">完善实名信息 ›</div>
      </div>

      <div v-if="p.notice && p.notice.length" class="mp-card">
        <h3 style="margin:0 0 8px;font-size:14px">体检须知</h3>
        <p v-for="(n, i) in p.notice.slice(0, 3)" :key="i" class="bk-notice">{{ i + 1 }}. {{ n }}</p>
      </div>

      <p class="disclaimer">提交后可在「我的预约」查看。如需改期请先取消再重新预约。</p>
      <button class="mp-btn" :disabled="submitting || !date || !slot" @click="submit">
        {{ submitting ? '提交中…' : `确认预约 · ¥${p.price}` }}
      </button>
    </div>
    <div v-else class="empty">加载中…</div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const route = useRoute()
const router = useRouter()
const p = ref(null)
const me = ref({})
const date = ref(String(route.query.date || ''))
const slot = ref(String(route.query.slot || ''))
const submitting = ref(false)
const maskId = (id) => (id ? String(id).replace(/^(.{6}).*(.{4})$/, '$1********$2') : '未实名')
async function submit() {
  submitting.value = true
  try {
    const r = await userHttp.post('/appointments', { packageId: p.value.id, date: date.value, slot: slot.value })
    ElMessage.success('预约成功，请按时体检')
    router.replace('/user/appointments')
  } catch (e) {
    ElMessage.error(e.message || '预约失败')
  } finally { submitting.value = false }
}
onMounted(async () => {
  p.value = await userHttp.get('/packages/' + route.params.id)
  const res = await userHttp.get('/auth/me')
  me.value = res.user || {}
  if (!date.value || !slot.value) {
    const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const av = await userHttp.get('/appointments/availability', { params: { date: d } })
    const free = (av.items || []).find((s) => !s.full)
    date.value = d
    slot.value = free?.slot || ''
  }
})
</script>
<style scoped>
.bk-pkg { border: 1px solid #e6f4f3; }
.bk-row { display: flex; align-items: center; gap: 10px; }
.bk-ico { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #1ad4cc, #07c8c0); color: #fff; display: grid; place-items: center; font-weight: 800; }
.bk-price { font-size: 20px; font-weight: 800; color: #ef4444; }
.bk-line { display: flex; justify-content: space-between; font-size: 13px; padding: 7px 0; }
.bk-line span { color: #8b949e; }
.bk-line b { font-weight: 600; color: #1f2d33; }
.bk-tip { margin-top: 8px; font-size: 12px; color: var(--mp); cursor: pointer; }
.bk-notice { margin: 0 0 5px; font-size: 12px; color: #64748b; line-height: 1.6; }
</style>

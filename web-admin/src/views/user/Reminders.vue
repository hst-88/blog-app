<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>复查提醒</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div v-if="!items.length" class="empty">暂无复查提醒<br />医生可在随访中为你设置复查时间</div>

      <div v-for="r in pending" :key="r.id" class="mp-card rm pending">
        <div class="top">
          <div>
            <b>⏰ {{ r.title }}</b>
            <div class="sub">建议复查 {{ r.dueDate || '待定' }}</div>
          </div>
          <span class="chip mid">{{ dueLabel(r) }}</span>
        </div>
        <div class="sub" style="margin-top:8px">医生：{{ r.doctorName }}</div>
        <div class="rm-actions">
          <button class="rm-btn" @click="done(r)">已复查</button>
          <button class="rm-btn primary" @click="$router.push('/user/packages')">预约复查</button>
        </div>
      </div>

      <h3 v-if="doneList.length" style="margin:18px 4px 8px;font-size:15px">已完成</h3>
      <div v-for="r in doneList" :key="r.id" class="mp-card rm">
        <div class="top">
          <div>
            <b>✅ {{ r.title }}</b>
            <div class="sub">完成时间 {{ fmt(r.doneAt) }}</div>
          </div>
          <span class="chip low">已完成</span>
        </div>
        <div v-if="r.note" class="sub" style="margin-top:6px">{{ r.note }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userHttp } from '../../api'
const items = ref([])
const pending = computed(() => items.value.filter((r) => r.status === 'pending'))
const doneList = computed(() => items.value.filter((r) => r.status === 'done'))
const fmt = (t) => String(t || '').replace('T', ' ').slice(0, 16)
function dueLabel(r) {
  if (!r.dueDate) return '待定'
  const days = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return `逾期 ${-days} 天`
  if (days === 0) return '今天'
  return `${days} 天后`
}
async function load() { items.value = (await userHttp.get('/reminders')).items || [] }
async function done(r) {
  const note = await ElMessageBox.prompt('记录本次复查情况（可选）', `标记「${r.title}」已复查`, {
    inputPlaceholder: '如 已复查，指标恢复正常',
    inputValue: '',
  }).then((v) => v.value).catch(() => null)
  if (note === null) return
  await userHttp.post(`/reminders/${r.id}/done`, { note })
  ElMessage.success('已标记完成')
  load()
}
onMounted(load)
</script>
<style scoped>
.rm.pending { border-left: 3px solid #f59e0b; }
.rm-actions { display: flex; gap: 8px; margin-top: 12px; }
.rm-btn { flex: 1; height: 38px; border: 1px solid #e2e8f0; background: #fff; border-radius: 19px; font-size: 13px; color: #64748b; cursor: pointer; }
.rm-btn.primary { background: linear-gradient(90deg, #1ad4cc, #07c8c0); border-color: transparent; color: #fff; font-weight: 700; }
</style>

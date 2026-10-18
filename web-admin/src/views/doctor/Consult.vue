<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>咨询工作台</b>
          <p>用户端发来的消息会在这里出现，4 秒自动刷新</p>
        </div>
        <el-select v-model="current" placeholder="选择会话" style="width:280px" filterable>
          <el-option v-for="c in items" :key="c.id" :label="`${c.patientName || '患者'} · 会话 ${c.id}${c.unread ? ' · 未读 ' + c.unread : ''}`" :value="c.id" />
        </el-select>
      </div>
    </template>
    <div class="chat-pane desk">
      <div v-if="!messages.length" class="empty">暂无会话。请让用户端先发起咨询。</div>
      <div v-for="m in messages" :key="m.id" class="bubble" :class="m.senderRole">
        <small>{{ m.senderRole === 'doctor' ? '我' : (currentRow?.patientName || '患者') }} · {{ fmt(m.createdAt) }}</small>
        {{ m.content }}
      </div>
    </div>
    <el-input v-model="text" placeholder="回复内容，回车发送" @keyup.enter="send" />
    <div class="actions">
      <el-button type="primary" round @click="send">发送回复</el-button>
      <el-button round @click="rx('diet')">高血压饮食处方</el-button>
      <el-button round @click="rx('sport')">运动处方</el-button>
      <el-button v-if="currentRow?.userId" round @click="$router.push(`/doctor/patients/${currentRow.userId}`)">患者档案</el-button>
    </div>
  </el-card>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const items = ref([])
const current = ref(null)
const text = ref('')
const messages = computed(() => items.value.find((c) => c.id === current.value)?.messages || [])
const currentRow = computed(() => items.value.find((c) => c.id === current.value))
const fmt = (t) => String(t || '').replace('T', ' ').slice(11, 16)
const templates = {
  diet: '{患者姓名}您好，请低盐饮食（每日食盐小于 5g），增加蔬菜水果，限制加工食品。',
  sport: '{患者姓名}您好，建议每周至少 150 分钟中等强度运动，如快走、游泳，循序渐进。',
}
let timer
async function load() {
  items.value = (await doctorHttp.get('/consultations')).items
  if (!current.value && items.value[0]) current.value = items.value[0].id
}
async function send() {
  if (!current.value) return ElMessage.warning('暂无会话')
  if (!text.value.trim()) return
  await doctorHttp.post(`/consultations/${current.value}/messages`, { type: 'text', content: text.value })
  text.value = ''
  load()
}
async function rx(kind) {
  const pid = currentRow.value?.userId
  if (!pid) return ElMessage.warning('请先选择会话')
  await doctorHttp.post('/prescriptions', { patientId: pid, template: templates[kind] })
  ElMessage.success('处方已写入会话')
  load()
}
onMounted(() => { load(); timer = setInterval(load, 4000) })
onUnmounted(() => clearInterval(timer))
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.desk { min-height: 360px; max-height: 480px; overflow: auto; }
.empty { color: #94a3b8; margin: auto; }
.bubble small { display: block; opacity: .7; font-size: 11px; margin-bottom: 4px; }
.actions { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
</style>

<template>
  <div style="display:flex;flex-direction:column;height:100%">
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.push('/user/home')">‹</span>
        <h1>{{ doctorName }}</h1>
        <span class="ghost" @click="create">新会话</span>
      </div>
    </div>
    <div class="chat-list" ref="pane">
      <div v-if="!messages.length" class="empty">向签约医生描述你的报告疑问<br />例如「转氨酶偏高严不严重」</div>
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.senderRole">
        <div class="avatar" :class="m.senderRole === 'user' ? 'me' : 'doc'">{{ m.senderRole === 'user' ? '我' : '医' }}</div>
        <div class="balloon">{{ m.content }}</div>
      </div>
    </div>
    <div class="composer">
      <input v-model="text" placeholder="请输入…" @keyup.enter="send" />
      <button @click="send">发送</button>
    </div>
  </div>
</template>
<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const route = useRoute()
const current = ref(null)
const doctorName = ref('签约医生')
const text = ref('')
const messages = ref([])
const pane = ref(null)
let timer
async function load() {
  const res = await userHttp.get('/consultations')
  const items = res.items || []
  const row = items.find((c) => c.id === current.value) || items[0]
  if (row) {
    current.value = row.id
    doctorName.value = row.doctorName || '签约医生'
    messages.value = row.messages || []
    await nextTick()
    if (pane.value) pane.value.scrollTop = pane.value.scrollHeight
  }
}
async function create() {
  try {
    const r = await userHttp.post('/consultations', {})
    current.value = r.id
    await load()
  } catch (e) { ElMessage.error(e.message) }
}
async function send() {
  if (!text.value.trim()) return
  if (!current.value) await create()
  await userHttp.post(`/consultations/${current.value}/messages`, { type: 'text', content: text.value })
  text.value = ''
  await load()
}
onMounted(() => {
  if (route.params.id) current.value = Number(route.params.id)
  load()
  timer = setInterval(load, 4000)
})
onUnmounted(() => clearInterval(timer))
</script>

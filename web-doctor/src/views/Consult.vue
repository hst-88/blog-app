<template>
  <el-card>
    <el-select v-model="current" placeholder="选择会话" @change="noop">
      <el-option v-for="c in items" :key="c.id" :label="`会话 ${c.id}`" :value="c.id" />
    </el-select>
    <div class="msgs">
      <div v-for="m in messages" :key="m.id" :class="m.senderRole">{{ m.content }}</div>
    </div>
    <el-input v-model="text" placeholder="回复内容" />
    <el-button type="primary" style="margin-top:8px" @click="send">发送</el-button>
    <el-button @click="rx">发送高血压饮食处方</el-button>
  </el-card>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import http from '../api'
const items = ref([])
const current = ref(null)
const text = ref('')
const messages = computed(() => items.value.find((c) => c.id === current.value)?.messages || [])
async function load() { items.value = (await http.get('/consultations')).items; if (items.value[0]) current.value = items.value[0].id }
async function send() {
  await http.post(`/consultations/${current.value}/messages`, { type: 'text', content: text.value })
  text.value = ''
  load()
}
async function rx() {
  await http.post('/prescriptions', { patientId: 1, template: '{患者姓名}您好，请低盐饮食，每日步行30分钟。' })
}
function noop() {}
onMounted(load)
</script>
<style scoped>
.msgs { min-height: 180px; margin: 12px 0; background: #f8fafc; padding: 8px; }
.doctor { text-align: right; color: #0369a1; }
.user { text-align: left; }
</style>

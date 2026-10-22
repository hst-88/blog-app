<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>咨询记录</h1>
        <span class="ghost" @click="start">发起咨询</span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div v-if="!items.length" class="empty">暂无咨询记录<br />点右上角直接联系签约医生</div>
      <div v-for="c in items" :key="c.id" class="mp-card tap" @click="$router.push('/user/consult/' + c.id)">
        <div class="top">
          <div>
            <b>{{ c.doctorName || '签约医生' }}</b>
            <div class="sub">{{ fmt(c.lastMessageAt || c.createdAt) }}</div>
          </div>
          <span class="chip" :class="c.unread ? 'mid' : 'low'">{{ c.unread ? '待回复' : '已回复' }}</span>
        </div>
        <div class="sub" style="margin-top:8px;color:#475569">{{ c.lastMessageText || '暂无消息' }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { userHttp } from '../../api'
const router = useRouter()
const items = ref([])
const fmt = (t) => String(t || '').replace('T', ' ').slice(0, 16)
async function load() { items.value = (await userHttp.get('/consultations')).items || [] }
async function start() {
  const r = await userHttp.post('/consultations', {})
  router.push('/user/consult/' + r.id)
}
onMounted(load)
</script>

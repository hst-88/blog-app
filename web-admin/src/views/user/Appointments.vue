<template>
  <div>
    <div class="mp-nav">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>我的预约</h1>
        <span class="ghost" @click="$router.push('/user/packages')">去预约</span>
      </div>
    </div>
    <div style="padding:4px 14px 20px">
      <div v-if="!items.length" class="empty">暂无预约，去<a style="color:var(--mp)" @click="$router.push('/user/packages')"> 体检预约 </a>选套餐</div>
      <div v-for="a in items" :key="a.id" class="mp-card">
        <div class="top">
          <div>
            <b>{{ a.packageName }}</b>
            <div class="sub">{{ a.date }} · {{ a.slot }}</div>
          </div>
          <span class="chip" :class="a.status === 'booked' ? 'low' : 'mid'">{{ a.status === 'booked' ? '已预约' : '已取消' }}</span>
        </div>
        <div class="foot">
          <span>单号 #{{ a.id }} · ¥{{ a.price }}</span>
          <button v-if="a.status === 'booked'" class="cancel" @click="cancel(a)">取消预约</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userHttp } from '../../api'
const items = ref([])
async function load() { items.value = (await userHttp.get('/appointments')).items || [] }
async function cancel(a) {
  await ElMessageBox.confirm(`确认取消「${a.packageName}」的预约？`, '提示', { type: 'warning' })
  await userHttp.post(`/appointments/${a.id}/cancel`)
  ElMessage.success('已取消')
  load()
}
onMounted(load)
</script>
<style scoped>
.cancel { border: 0; background: none; color: #8b949e; font-size: 12px; cursor: pointer; text-decoration: underline; }
</style>

<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>血压打卡</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div class="mp-card">
        <div class="bp-pad">
          <div class="num">{{ sbp }}<span class="unit"> mmHg</span></div>
          <div class="sub">收缩压 · 超过 180 会提示就医</div>
        </div>
        <div class="stepper">
          <button type="button" @click="sbp = Math.max(70, Number(sbp) - 1)">−</button>
          <button type="button" @click="sbp = Math.min(220, Number(sbp) + 1)">+</button>
        </div>
        <button class="mp-btn" @click="save">记录本次血压</button>
        <p v-if="hint" style="color:#e11d48;text-align:center;margin:10px 0 0">{{ hint }}</p>
      </div>
      <h3 style="margin:16px 4px 8px;font-size:15px">打卡记录</h3>
      <div v-if="!items.length" class="empty">还没有记录</div>
      <div v-for="i in items" :key="i.id" class="mp-card" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <b>{{ i.value?.sbp || '-' }} mmHg</b>
          <div class="sub">{{ fmt(i.createdAt) }}</div>
        </div>
        <span class="chip" :class="i.abnormal ? 'high' : 'low'">{{ i.abnormal ? '异常' : '正常' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { userHttp } from '../../api'
const sbp = ref(120)
const hint = ref('')
const items = ref([])
const fmt = (t) => String(t || '').replace('T', ' ').slice(0, 16)
async function load() { items.value = ((await userHttp.get('/health-logs')).items || []).slice().reverse() }
async function save() {
  const r = await userHttp.post('/health-logs', { type: 'bp', sbp: Number(sbp.value) })
  hint.value = r.hint
  load()
}
onMounted(load)
</script>

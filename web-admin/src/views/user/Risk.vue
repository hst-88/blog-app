<template>
  <div v-if="risk">
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>健康风险</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div class="mp-card">
        <b>慢病风险分层</b>
        <div class="sub">模型 {{ risk.modelVersion || 'v1' }} · 仅供参考，不能替代诊断</div>
        <div v-for="d in risk.diseases" :key="d.name" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <span>{{ d.name }}</span>
          <span class="chip" :class="d.level">{{ label(d.level) }}</span>
        </div>
      </div>
      <div class="mp-card">
        <b>五维雷达</b>
        <div v-for="r in risk.radar" :key="r.dim" class="bar-row">
          <div class="lab"><span>{{ r.dim }}</span><span>{{ r.score }}</span></div>
          <div class="bar"><i :style="{ width: r.score + '%' }"></i></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { userHttp } from '../../api'
const risk = ref(null)
const label = (lv) => ({ low: '低风险', mid: '中风险', high: '高风险' }[lv] || lv)
onMounted(async () => { risk.value = await userHttp.get('/risk/me') })
</script>

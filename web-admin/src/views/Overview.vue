<template>
  <div>
    <h3 class="jh-page-title">运营总览</h3>
    <p class="jh-page-sub">三端共用数据的实时快照，导入后用户端与医生端即时同步</p>
    <div class="kpi-grid">
      <div class="kpi"><span>注册用户</span><b>{{ data.users || 0 }}</b></div>
      <div class="kpi"><span>体检报告</span><b>{{ data.reports || 0 }}</b></div>
      <div class="kpi"><span>咨询会话</span><b>{{ data.consults || 0 }}</b></div>
      <div class="kpi"><span>未处理预警</span><b>{{ data.alertsOpen || 0 }}</b></div>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <p>消息 {{ data.messages || 0 }} 条 · 已处理预警 {{ data.alertsHandled || 0 }} · 导入批次 {{ data.imports || 0 }} · 医护账号 {{ data.staff || 0 }} · 随访 {{ data.followups || 0 }} · 套餐 {{ data.packages || 0 }}</p>
          <el-button type="primary" @click="$router.push('/admin/imports')">去导入报告</el-button>
          <el-button @click="$router.push('/admin/users')">查看用户</el-button>
          <el-button @click="$router.push('/admin/stats')">打开统计</el-button>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><b>最近导入</b></template>
          <el-empty v-if="!(data.recentImports || []).length" description="尚无导入记录" />
          <div v-for="(b, i) in data.recentImports || []" :key="i" class="imp">
            <span>{{ String(b.at || '').replace('T', ' ').slice(0, 16) }}</span>
            <span>成功 {{ b.ok }} 行 · 失败 {{ b.failed?.length || 0 }} · 报告 {{ b.created?.length || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { adminHttp } from '../api'
const data = ref({})
onMounted(async () => { data.value = await adminHttp.get('/admin/overview') })
</script>
<style scoped>
.imp { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eef2f6; font-size: 13px; color: #475569; }
.imp:last-child { border-bottom: 0; }
</style>

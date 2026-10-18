<template>
  <div>
    <h3 class="jh-page-title">工作台</h3>
    <p class="jh-page-sub">签约患者、预警、咨询与随访的当日概览</p>
    <div class="kpi-grid">
      <div class="kpi tap" @click="$router.push('/doctor/patients')"><span>签约患者</span><b>{{ data.patients || 0 }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/alerts')"><span>未处理预警</span><b>{{ data.alertsOpen || 0 }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/consult')"><span>未读咨询</span><b>{{ data.unread || 0 }}</b></div>
      <div class="kpi tap" @click="$router.push('/doctor/followups')"><span>逾期随访</span><b>{{ data.overdue || 0 }}</b></div>
    </div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header><b>待办</b></template>
          <el-empty v-if="!todos.length" description="暂无待办" />
          <div v-for="t in todos" :key="t.key" class="todo" @click="$router.push(t.to)">
            <span>{{ t.label }}</span>
            <el-tag :type="t.type" size="small">{{ t.count }}</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><b>快捷操作</b></template>
          <el-button type="primary" @click="$router.push('/doctor/patients')">查看患者</el-button>
          <el-button @click="$router.push('/doctor/consult')">回复咨询</el-button>
          <el-button @click="$router.push('/doctor/edu')">发布宣教</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { doctorHttp } from '../../api'
const data = ref({})
const todos = computed(() => {
  const d = data.value
  return [
    d.alertsOpen ? { key: 'a', label: '待处理预警', count: d.alertsOpen, to: '/doctor/alerts', type: 'danger' } : null,
    d.unread ? { key: 'c', label: '待回复咨询', count: d.unread, to: '/doctor/consult', type: 'warning' } : null,
    d.overdue ? { key: 'f', label: '逾期随访', count: d.overdue, to: '/doctor/followups', type: 'danger' } : null,
  ].filter(Boolean)
})
onMounted(async () => { data.value = await doctorHttp.get('/doctor/overview') })
</script>
<style scoped>
.kpi.tap { cursor: pointer; }
.todo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eef2f6;
  cursor: pointer;
}
.todo:last-child { border-bottom: 0; }
</style>

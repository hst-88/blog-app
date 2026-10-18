<template>
  <el-card>
    <el-button type="primary" @click="create">为签约患者制定月随访</el-button>
    <el-table :data="items" style="margin-top:12px">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="patientId" label="患者" />
      <el-table-column prop="cycle" label="周期" />
      <el-table-column prop="dueDate" label="到期" />
      <el-table-column prop="overdue" label="逾期">
        <template #default="{ row }"><span :style="{ color: row.overdue ? 'red' : 'inherit' }">{{ row.overdue ? '逾期' : '正常' }}</span></template>
      </el-table-column>
      <el-table-column label="操作"><template #default="{ row }"><el-button text @click="result(row)">记录结果</el-button></template></el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import http from '../api'
const items = ref([])
async function load() { items.value = (await http.get('/followups')).items }
async function create() {
  await http.post('/followups', { patientIds: [1], cycle: 'monthly', dueDate: new Date().toISOString().slice(0, 10) })
  load()
}
async function result(row) {
  await http.post(`/followups/${row.id}/result`, { bp: '120/80', adherence: 'good' })
  load()
}
onMounted(load)
</script>

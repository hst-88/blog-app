<template>
  <el-card>
    <el-table :data="items">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="indicatorName" label="指标" />
      <el-table-column prop="level" label="等级" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" text @click="handle(row, false)">标记处理</el-button>
          <el-button text @click="handle(row, true)">发起随访</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import http from '../api'
const items = ref([])
async function load() { items.value = (await http.get('/alerts')).items }
async function handle(row, followup) {
  await http.post(`/alerts/${row.id}/handle`, { method: followup ? 'followup' : 'marked', followup })
  load()
}
onMounted(load)
</script>

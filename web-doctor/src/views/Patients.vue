<template>
  <el-card>
    <el-form inline>
      <el-input v-model="keyword" placeholder="姓名/手机号" style="width:200px" />
      <el-select v-model="riskLevel" placeholder="风险" clearable style="width:120px;margin-left:8px">
        <el-option label="高" value="high" /><el-option label="中" value="mid" /><el-option label="低" value="low" />
      </el-select>
      <el-button type="primary" @click="load">筛选</el-button>
    </el-form>
    <el-table :data="items">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="riskLevel" label="风险">
        <template #default="{ row }">
          <el-tag :type="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'mid' ? 'warning' : 'success'">{{ row.riskLevel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="examDate" label="最近体检" />
      <el-table-column prop="abnormalCount" label="异常数" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button text @click="$router.push(`/patients/${row.id}`)">查看档案</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import http from '../api'
const keyword = ref('')
const riskLevel = ref('')
const items = ref([])
async function load() {
  const res = await http.get('/doctor/patients', { params: { keyword: keyword.value, riskLevel: riskLevel.value } })
  items.value = res.items
}
onMounted(load)
</script>

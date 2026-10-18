<template>
  <el-card>
    <h3 class="jh-page-title">操作日志</h3>
    <p class="jh-page-sub">保留近 6 个月审计记录</p>
    <el-empty v-if="!items.length" description="暂无操作记录，导入或推送后会出现" />
    <el-table v-else :data="items.slice().reverse()">
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ String(row.createdAt || '').replace('T', ' ').slice(0, 19) }}</template>
      </el-table-column>
      <el-table-column prop="actorId" label="操作人" width="100" />
      <el-table-column prop="action" label="动作" width="160" />
      <el-table-column label="详情">
        <template #default="{ row }">{{ typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload || {}) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { adminHttp } from '../api'
const items = ref([])
onMounted(async () => { items.value = (await adminHttp.get('/admin/audit-logs')).items })
</script>

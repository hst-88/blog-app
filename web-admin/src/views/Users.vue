<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>用户与推送</b>
          <p>C 端注册用户会即时出现在这里，可按列表批量排队订阅消息</p>
        </div>
        <div>
          <el-button @click="exportCsv">导出 CSV</el-button>
          <el-button type="primary" :disabled="!items.length" @click="push">按当前列表批量推送</el-button>
        </div>
      </div>
    </template>

    <div class="filters">
      <el-input v-model="q.name" placeholder="姓名/昵称" clearable style="width:180px" @keyup.enter="load" @clear="load" />
      <el-date-picker v-model="q.date" type="date" value-format="YYYY-MM-DD" placeholder="最近体检日期" style="width:170px" @change="load" />
      <el-select v-model="q.package" placeholder="已约套餐" clearable style="width:200px" @change="load">
        <el-option v-for="p in packages" :key="p.id" :label="p.name" :value="p.name" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
      <span class="count">共 {{ items.length }} 人</span>
    </div>

    <el-table :data="items">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="姓名" width="110" />
      <el-table-column prop="nickname" label="昵称" width="110" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="age" label="年龄" width="70" />
      <el-table-column label="性别" width="70">
        <template #default="{ row }">{{ row.gender === 'female' ? '女' : row.gender === 'male' ? '男' : '-' }}</template>
      </el-table-column>
      <el-table-column label="实名" width="80">
        <template #default="{ row }">{{ row.hasRealname ? '已实名' : '未实名' }}</template>
      </el-table-column>
      <el-table-column prop="reportCount" label="报告数" width="80" />
      <el-table-column prop="lastExamDate" label="最近体检" width="110" />
      <el-table-column label="风险" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.riskLevel" :type="tagType(row.riskLevel)" size="small">{{ riskLabel(row.riskLevel) }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="packageName" label="已约套餐" min-width="150" />
      <el-table-column label="注册时间" width="150">
        <template #default="{ row }">{{ String(row.createdAt || '').replace('T', ' ').slice(0, 16) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const items = ref([])
const packages = ref([])
const q = ref({ name: '', date: '', package: '' })
const riskLabel = (v) => ({ low: '低风险', mid: '中风险', high: '高风险' }[v] || v)
const tagType = (v) => ({ low: 'success', mid: 'warning', high: 'danger' }[v] || 'info')
async function load() {
  const params = {}
  for (const [k, v] of Object.entries(q.value)) if (v) params[k] = v
  items.value = (await adminHttp.get('/admin/users', { params })).items || []
}
function reset() { q.value = { name: '', date: '', package: '' }; load() }
async function push() {
  await adminHttp.post('/admin/push', { userIds: items.value.map((x) => x.id), type: 'recheck' })
  ElMessage.success('已排队推送订阅消息')
}
async function exportCsv() {
  const params = { export: 1 }
  for (const [k, v] of Object.entries(q.value)) if (v) params[k] = v
  const res = await adminHttp.get('/admin/users/export', { params, responseType: 'blob' })
  const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'users.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}
onMounted(async () => {
  load()
  packages.value = (await adminHttp.get('/packages')).items || []
})
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.filters { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.count { margin-left: auto; color: #64748b; font-size: 13px; }
</style>

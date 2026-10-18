<template>
  <el-card>
    <template #header>
      <div>
        <b>预警中心</b>
        <p>导入报告触发的异常会在此出现，处理后可转入随访</p>
      </div>
    </template>
    <el-empty v-if="!items.length" description="暂无未处理预警，可在管理端导入示例数据" />
    <el-table v-else :data="items">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="patientName" label="患者" width="120" />
      <el-table-column prop="indicatorName" label="指标" />
      <el-table-column label="等级" width="90">
        <template #default="{ row }">
          <span class="jh-tag" :class="row.level === 'high' ? 'high' : row.level === 'mid' ? 'mid' : 'low'">{{ ({ high: '高', mid: '中', low: '低' }[row.level] || row.level) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button type="primary" text @click="handle(row, false)">标记处理</el-button>
          <el-button text @click="handle(row, true)">发起随访</el-button>
          <el-button v-if="row.patientId" text @click="$router.push(`/doctor/patients/${row.patientId}`)">查看档案</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const items = ref([])
async function load() { items.value = (await doctorHttp.get('/alerts')).items }
async function handle(row, followup) {
  await doctorHttp.post(`/alerts/${row.id}/handle`, {
    method: followup ? 'followup' : 'marked',
    followup,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  })
  ElMessage.success(followup ? '已转入随访' : '已标记处理')
  load()
}
onMounted(load)
</script>
<style scoped>
p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
</style>

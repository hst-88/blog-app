<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>签约患者</b>
          <p>注册用户会自动挂到当前医生名下，按风险优先排序</p>
        </div>
        <el-form inline>
          <el-input v-model="keyword" placeholder="姓名/手机号" clearable style="width:200px" @keyup.enter="load" />
          <el-select v-model="riskLevel" placeholder="风险" clearable style="width:120px;margin-left:8px">
            <el-option label="高" value="high" /><el-option label="中" value="mid" /><el-option label="低" value="low" />
          </el-select>
          <el-button type="primary" style="margin-left:8px" @click="load">筛选</el-button>
        </el-form>
      </div>
    </template>
    <el-table :data="items" @row-click="(row) => $router.push(`/doctor/patients/${row.id}`)">
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="age" label="年龄" width="70" />
      <el-table-column label="性别" width="70">
        <template #default="{ row }">{{ row.gender === 'female' ? '女' : row.gender === 'male' ? '男' : '-' }}</template>
      </el-table-column>
      <el-table-column label="风险" width="100">
        <template #default="{ row }">
          <span class="jh-tag" :class="row.riskLevel">{{ ({ high: '高', mid: '中', low: '低' }[row.riskLevel] || row.riskLevel) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="examDate" label="最近体检" width="120" />
      <el-table-column prop="abnormalCount" label="异常数" width="80" />
      <el-table-column prop="openAlerts" label="未处理预警" width="110" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button text type="primary" @click.stop="$router.push(`/doctor/patients/${row.id}`)">档案</el-button>
          <el-button text @click.stop="$router.push('/doctor/consult')">咨询</el-button>
          <el-button text @click.stop="$router.push('/doctor/followups')">随访</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { doctorHttp } from '../../api'
const keyword = ref('')
const riskLevel = ref('')
const items = ref([])
async function load() {
  const res = await doctorHttp.get('/doctor/patients', { params: { keyword: keyword.value, riskLevel: riskLevel.value } })
  items.value = res.items
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
:deep(.el-table__row) { cursor: pointer; }
</style>

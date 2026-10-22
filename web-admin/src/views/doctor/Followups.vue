<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>随访任务</b>
          <p>随访是医生任务；创建时会同步给患者发复查提醒，用户端「复查提醒」可见</p>
        </div>
        <el-button type="primary" @click="create">为签约患者制定月随访</el-button>
      </div>
    </template>
    <el-empty v-if="!items.length" description="暂无随访任务" />
    <el-table v-else :data="items">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="patientName" label="患者" />
      <el-table-column prop="cycle" label="周期" width="100">
        <template #default="{ row }">{{ row.cycle === 'quarterly' ? '每季' : '每月' }}</template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span v-if="row.archivedAt" style="color:#16a34a">已完成</span>
          <span v-else :style="{ color: row.overdue ? '#dc2626' : '#0f766e' }">{{ row.overdue ? '逾期' : '待访' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结果">
        <template #default="{ row }">{{ row.result ? `血压 ${row.result.bp} · 依从性 ${row.result.adherence}` : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button v-if="!row.archivedAt" text type="primary" @click="open(row)">记录结果</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="show" title="随访结果" width="420px">
      <el-form label-width="90px">
        <el-form-item label="血压"><el-input v-model="form.bp" placeholder="如 120/80" /></el-form-item>
        <el-form-item label="依从性">
          <el-select v-model="form.adherence">
            <el-option label="良好" value="good" /><el-option label="一般" value="fair" /><el-option label="差" value="poor" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="save">保存并归档</el-button></template>
    </el-dialog>
  </el-card>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const items = ref([])
const show = ref(false)
const current = ref(null)
const form = reactive({ bp: '120/80', adherence: 'good', note: '' })
async function load() { items.value = (await doctorHttp.get('/followups')).items }
async function create() {
  const patients = (await doctorHttp.get('/doctor/patients')).items || []
  if (!patients.length) return ElMessage.warning('暂无签约患者')
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  await doctorHttp.post('/followups', { patientIds: patients.map((p) => p.id), cycle: 'monthly', dueDate: due, content: '定期随访复查' })
  ElMessage.success('已制定月随访，患者端复查提醒同步可见')
  load()
}
function open(row) {
  current.value = row
  form.bp = '120/80'
  form.adherence = 'good'
  form.note = ''
  show.value = true
}
async function save() {
  await doctorHttp.post(`/followups/${current.value.id}/result`, { ...form })
  ElMessage.success('已归档随访结果，患者档案时间线可见')
  show.value = false
  load()
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
</style>

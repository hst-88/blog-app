<template>
  <div v-if="data">
    <el-page-header @back="$router.push('/doctor/patients')" :title="'返回患者列表'" :content="data.patient.name + ' 的健康档案'" style="margin-bottom:16px" />
    <el-card style="margin-bottom:16px">
      <div class="who">
        <div class="av">{{ (data.patient.name || '?').slice(0, 1) }}</div>
        <div>
          <h3 class="jh-page-title">{{ data.patient.name }} · {{ data.patient.phone || '未绑手机' }}</h3>
          <p class="jh-page-sub">{{ data.patient.gender === 'female' ? '女' : '男' }} · {{ data.patient.age || '-' }} 岁 · 身份证 {{ data.patient.idNo || '未实名' }}</p>
        </div>
        <div class="acts">
          <el-button type="primary" @click="$router.push('/doctor/consult')">去咨询</el-button>
          <el-button @click="makeFu">制定随访</el-button>
          <el-button @click="remind">设置复查提醒</el-button>
        </div>
      </div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="既往史">{{ data.patient.medicalHistory || '无' }}</el-descriptions-item>
        <el-descriptions-item label="过敏史">{{ data.patient.allergyHistory || '无' }}</el-descriptions-item>
        <el-descriptions-item label="未处理预警">{{ (data.alerts || []).filter((a) => a.status === 'open').length }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header><b>体检报告</b></template>
          <el-empty v-if="!data.reports?.length" description="暂无报告" />
          <div v-for="r in data.reports" :key="r.id" class="rep">
            <div class="rep-h">
              <b>{{ r.orgName }}</b>
              <span>{{ r.examDate }} · 异常 {{ r.abnormalCount }} 项</span>
              <span class="jh-tag" :class="r.riskLevel">{{ ({ high: '高风险', mid: '中风险', low: '低风险' }[r.riskLevel]) }}</span>
            </div>
            <el-table :data="r.indicators" size="small">
              <el-table-column prop="name" label="指标" />
              <el-table-column label="结果">
                <template #default="{ row }">{{ row.valueText }}{{ row.unit }}</template>
              </el-table-column>
              <el-table-column prop="refRange" label="参考" />
              <el-table-column label="状态">
                <template #default="{ row }">
                  <span class="jh-tag" :class="row.status === 'normal' ? 'low' : 'high'">{{ row.status === 'high' ? '偏高' : row.status === 'low' ? '偏低' : '正常' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><b>健康时间线</b></template>
          <el-timeline>
            <el-timeline-item v-for="(t, i) in data.timeline" :key="i" :timestamp="fmt(t.at) || '进行中'" :type="t.type === 'alert' ? 'danger' : 'primary'">
              {{ t.title }} · {{ t.extra }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog v-model="remindShow" title="设置复查提醒" width="440px">
      <el-form label-width="90px">
        <el-form-item label="提醒事项"><el-input v-model="remindForm.title" placeholder="如 肝功能复查" /></el-form-item>
        <el-form-item label="建议日期"><el-input v-model="remindForm.dueDate" type="date" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remindShow = false">取消</el-button>
        <el-button type="primary" @click="saveRemind">发送给患者</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const route = useRoute()
const data = ref(null)
const remindShow = ref(false)
const remindForm = ref({ title: '复查提醒', dueDate: '' })
const fmt = (t) => String(t || '').replace('T', ' ').slice(0, 16)
onMounted(async () => { data.value = await doctorHttp.get(`/doctor/patients/${route.params.id}/record`) })
function remind() {
  remindForm.value = {
    title: '复查提醒',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  }
  remindShow.value = true
}
async function saveRemind() {
  if (!remindForm.value.title.trim()) return ElMessage.warning('请填写提醒事项')
  await doctorHttp.post('/reminders', {
    patientId: Number(route.params.id),
    title: remindForm.value.title,
    dueDate: remindForm.value.dueDate,
  })
  ElMessage.success('已发送复查提醒，患者端可见')
  remindShow.value = false
}
async function makeFu() {
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  await doctorHttp.post('/followups', { patientIds: [Number(route.params.id)], cycle: 'monthly', dueDate: due })
  ElMessage.success('已制定月随访')
  data.value = await doctorHttp.get(`/doctor/patients/${route.params.id}/record`)
}
</script>
<style scoped>
.who { display: flex; gap: 14px; align-items: center; margin-bottom: 16px; }
.av {
  width: 52px; height: 52px; border-radius: 16px; background: #0f766e; color: #fff;
  display: grid; place-items: center; font-size: 22px; font-weight: 800;
}
.acts { margin-left: auto; }
.rep { margin-bottom: 16px; }
.rep-h { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.rep-h span { color: #64748b; font-size: 13px; }
</style>

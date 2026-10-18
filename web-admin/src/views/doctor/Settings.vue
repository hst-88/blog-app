<template>
  <div>
    <h2>个人设置</h2>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>执业信息</template>
          <el-form :model="form" label-width="90px">
            <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
            <el-form-item label="职称"><el-input v-model="form.title" placeholder="如 主治医师" /></el-form-item>
            <el-form-item label="所属医院"><el-input v-model="form.hospital" /></el-form-item>
            <el-form-item label="科室"><el-input v-model="form.dept" /></el-form-item>
            <el-form-item label="联系电话"><el-input v-model="form.phone" /></el-form-item>
            <el-form-item label="擅长领域"><el-input v-model="form.specialties" type="textarea" :rows="2" maxlength="60" show-word-limit /></el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="save">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>消息通知</template>
          <div class="notify-row"><span>新咨询提醒</span><el-switch v-model="form.notifications.consult" /></div>
          <div class="notify-row"><span>指标预警提醒</span><el-switch v-model="form.notifications.alert" /></div>
          <div class="notify-row"><span>随访任务提醒</span><el-switch v-model="form.notifications.followup" /></div>
          <el-button style="margin-top:12px;width:100%" :loading="saving" @click="save">保存通知设置</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const saving = ref(false)
const form = ref({ name: '', title: '', hospital: '', dept: '', phone: '', specialties: '', notifications: { consult: true, alert: true, followup: true } })
async function load() {
  const res = await doctorHttp.get('/doctor/profile')
  const d = res.doctor || res
  form.value = {
    name: d.name || '',
    title: d.title || '',
    hospital: d.hospital || '',
    dept: d.dept || '',
    phone: d.phone || '',
    specialties: d.specialties || '',
    notifications: { consult: true, alert: true, followup: true, ...(d.notifications || {}) },
  }
}
async function save() {
  saving.value = true
  try {
    await doctorHttp.put('/doctor/profile', form.value)
    ElMessage.success('已保存')
    load()
  } catch (e) { ElMessage.error(e.message || '保存失败') }
  finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>
.notify-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
</style>

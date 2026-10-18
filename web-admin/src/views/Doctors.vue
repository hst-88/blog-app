<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>医生管理</b>
          <p>医生账号由管理端统一创建；停用后无法登录医生端，其患者自动分配给默认医生</p>
        </div>
        <el-button type="primary" @click="open()">新增医生</el-button>
      </div>
    </template>
    <el-table :data="items">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="username" label="账号" width="120" />
      <el-table-column prop="title" label="职称" width="110" />
      <el-table-column prop="hospital" label="所属医院" min-width="160" />
      <el-table-column prop="dept" label="科室" width="100" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="patientCount" label="患者数" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '在职' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="open(row)">编辑</el-button>
          <el-button text @click="reset(row)">重置密码</el-button>
          <el-button text :type="row.status === 'active' ? 'danger' : 'success'" @click="toggle(row)">{{ row.status === 'active' ? '停用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="show" :title="form.id ? '编辑医生' : '新增医生'" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item v-if="!form.id" label="登录账号">
          <el-input v-model="form.username" placeholder="字母或数字，4-20 位" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="初始密码"><el-input v-model="form.password" placeholder="至少 6 位" /></el-form-item>
        <el-form-item label="职称"><el-input v-model="form.title" placeholder="如 主治医师" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="科室"><el-input v-model="form.dept" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="所属医院"><el-input v-model="form.hospital" /></el-form-item>
        <el-form-item label="擅长领域"><el-input v-model="form.specialties" type="textarea" :rows="2" maxlength="60" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="show = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminHttp } from '../api'
const items = ref([])
const show = ref(false)
const saving = ref(false)
const form = ref({})
async function load() { items.value = (await adminHttp.get('/admin/doctors')).items || [] }
function open(row) {
  form.value = row
    ? { ...row }
    : { name: '', username: '', password: '', title: '', hospital: '仁和体检中心', dept: '全科', phone: '', specialties: '' }
  show.value = true
}
async function save() {
  if (!form.value.name) return ElMessage.warning('请填写姓名')
  saving.value = true
  try {
    if (form.value.id) await adminHttp.put('/admin/doctors', form.value)
    else await adminHttp.post('/admin/doctors', form.value)
    ElMessage.success('已保存')
    show.value = false
    load()
  } catch (e) { ElMessage.error(e.message || '保存失败') }
  finally { saving.value = false }
}
async function reset(row) {
  const pwd = await ElMessageBox.prompt(`为 ${row.name} 设置新密码`, '重置密码', {
    inputValue: 'doctor123',
    inputValidator: (v) => (v && v.length >= 6) || '至少 6 位',
  }).then((r) => r.value).catch(() => null)
  if (!pwd) return
  await adminHttp.post('/admin/doctors/reset-password', { id: row.id, password: pwd })
  ElMessage.success('密码已重置')
}
async function toggle(row) {
  await adminHttp.put('/admin/doctors', { id: row.id, status: row.status === 'active' ? 'disabled' : 'active' })
  ElMessage.success('已更新')
  load()
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
</style>

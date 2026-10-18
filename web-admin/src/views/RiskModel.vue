<template>
  <el-card>
    <h3 class="jh-page-title">评估模型</h3>
    <p class="jh-page-sub">版本号会展示在用户端风险页</p>
    <el-form label-width="120px" style="max-width:420px">
      <el-form-item label="版本"><el-input v-model="form.version" /></el-form-item>
      <el-button type="primary" @click="save">保存模型</el-button>
    </el-form>
  </el-card>
</template>
<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const form = reactive({ version: 'v1' })
onMounted(async () => {
  try {
    const r = await adminHttp.get('/admin/settings/risk-model')
    if (r?.version) form.version = r.version
  } catch { /* keep default */ }
})
async function save() {
  await adminHttp.put('/admin/settings/risk-model', form)
  ElMessage.success('已更新评估模型')
}
</script>

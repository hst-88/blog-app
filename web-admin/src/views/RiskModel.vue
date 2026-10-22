<template>
  <el-card>
    <h3 class="jh-page-title">评估模型</h3>
    <p class="jh-page-sub">版本号和五维权重会立刻作用到 C 端「健康风险」页；医生工作台不读这套慢病模型</p>
    <el-alert type="info" :closable="false" style="margin-bottom:16px" title="会改哪些页">
      保存后用户刷新 `/user/risk` 即按新权重重算分层和雷达。报告列表上的低/中/高仍来自体检异常项数，不受本页影响。权重 1 为默认，大于 1 放大该维分数（上限 100）。
    </el-alert>
    <el-form label-width="120px" style="max-width:420px">
      <el-form-item label="版本"><el-input v-model="form.version" /></el-form-item>
      <el-form-item label="代谢权重"><el-input-number v-model="form.weights.metabolic" :min="0" :max="5" :step="0.1" /></el-form-item>
      <el-form-item label="心血管权重"><el-input-number v-model="form.weights.cardio" :min="0" :max="5" :step="0.1" /></el-form-item>
      <el-form-item label="肝肾权重"><el-input-number v-model="form.weights.liver" :min="0" :max="5" :step="0.1" /></el-form-item>
      <el-form-item label="呼吸权重"><el-input-number v-model="form.weights.respiratory" :min="0" :max="5" :step="0.1" /></el-form-item>
      <el-form-item label="骨骼权重"><el-input-number v-model="form.weights.bone" :min="0" :max="5" :step="0.1" /></el-form-item>
      <el-button type="primary" @click="save">保存模型</el-button>
    </el-form>
  </el-card>
</template>
<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const form = reactive({
  version: 'v1',
  weights: { metabolic: 1, cardio: 1, liver: 1, respiratory: 1, bone: 1 },
})
onMounted(async () => {
  try {
    const r = await adminHttp.get('/admin/settings/risk-model')
    if (r?.version) form.version = r.version
    if (r?.weights) Object.assign(form.weights, r.weights)
  } catch { /* keep default */ }
})
async function save() {
  await adminHttp.put('/admin/settings/risk-model', {
    version: form.version,
    weights: { ...form.weights },
  })
  ElMessage.success('已更新，C 端健康风险页将按新权重计算')
}
</script>

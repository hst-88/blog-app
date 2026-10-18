<template>
  <el-card>
    <h3 class="jh-page-title">预警阈值</h3>
    <p class="jh-page-sub">调整后对新导入报告立即生效</p>
    <el-table :data="rules">
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="name" label="指标" />
      <el-table-column prop="operator" label="运算符" width="100" />
      <el-table-column label="阈值" width="180">
        <template #default="{ row }"><el-input-number v-model="row.threshold" :step="0.1" /></template>
      </el-table-column>
      <el-table-column label="等级" width="140">
        <template #default="{ row }">
          <el-select v-model="row.level">
            <el-option label="高" value="high" /><el-option label="中" value="mid" /><el-option label="低" value="low" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
    <el-button type="primary" style="margin-top:12px" @click="save">保存</el-button>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const rules = ref([])
onMounted(async () => { rules.value = (await adminHttp.get('/admin/settings/alert-rules')).rules })
async function save() {
  await adminHttp.put('/admin/settings/alert-rules', { rules: rules.value })
  ElMessage.success('已保存，后续导入将按新阈值生成预警')
}
</script>

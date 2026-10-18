<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>体检数据导入</b>
          <p>Excel/CSV 导入后按身份证匹配用户，异常指标会生成医生端预警</p>
        </div>
        <div>
          <el-button @click="downloadTpl">下载模板</el-button>
          <el-button type="primary" @click="demo">导入示例数据</el-button>
        </div>
      </div>
    </template>
    <el-upload :auto-upload="false" :on-change="onFile" accept=".xlsx,.csv">
      <el-button>选择 Excel/CSV</el-button>
    </el-upload>
    <el-button style="margin-top:12px" type="success" :disabled="!file" @click="upload">开始导入</el-button>
    <el-alert v-if="result" style="margin-top:16px" :title="`成功 ${result.successRows} 行，失败 ${result.failed?.length || 0} 行，新建报告 ${result.createdReports?.length || 0} 份`" type="success" />
    <el-table v-if="result?.failed?.length" :data="result.failed" style="margin-top:12px">
      <el-table-column prop="row" label="行号" width="80" />
      <el-table-column prop="error" label="原因" />
    </el-table>
    <p class="hint">导入成功后：用户端立刻看到新报告，医生端预警中心出现异常指标。</p>
  </el-card>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'

const file = ref(null)
const result = ref(null)
function onFile(f) { file.value = f.raw }
async function downloadTpl() {
  const res = await fetch('/api/admin/imports/template', { headers: { Authorization: `Bearer ${localStorage.getItem('jh_admin_token')}` } })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'import-template.xlsx'
  a.click()
}
async function upload() {
  const fd = new FormData()
  fd.append('file', file.value)
  try {
    result.value = await adminHttp.post('/admin/imports', fd)
    ElMessage.success('导入完成')
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  }
}
async function demo() {
  try {
    result.value = await adminHttp.post('/admin/imports', {
      rows: [
        { 姓名: '李四', 身份证号: '110101199801011234', 体检日期: '2026-10-08', 体检机构: '示例体检中心', 指标名称: '血糖', 检测值: '12.2', 单位: 'mmol/L', 参考范围: '3.9-6.1' },
        { 姓名: '李四', 身份证号: '110101199801011234', 体检日期: '2026-10-08', 体检机构: '示例体检中心', 指标名称: '收缩压', 检测值: '168', 单位: 'mmHg', 参考范围: '90-140' },
        { 姓名: '张三', 身份证号: '110101199001011234', 体检日期: '2026-10-08', 体检机构: '示例体检中心', 指标名称: '谷丙转氨酶', 检测值: '88', 单位: 'U/L', 参考范围: '0-40' },
      ],
    })
    ElMessage.success('示例数据已导入，用户端与医生预警已同步')
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  }
}
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.hint { margin: 16px 0 0; color: #64748b; font-size: 13px; }
</style>

<template>
  <el-card>
    <h3 class="jh-page-title">HL7/FHIR 接入</h3>
    <p class="jh-page-sub">与「数据导入」同一条入库链：按身份证匹配已注册用户，报告进 C 端，异常按预警阈值进医生预警中心</p>
    <el-alert type="info" :closable="false" style="margin-bottom:16px" title="会改哪些页">
      推送成功后：C 端报告列表/详情、首页健康概览、风险评估会更新；医生端患者档案、预警中心、工作台未处理预警会增加；管理端运营总览与统计白皮书同步。重复 messageId 不会再给用户多一份报告。
    </el-alert>
    <el-form label-width="120px" style="max-width:560px">
      <el-form-item label="来源系统"><el-input v-model="sourceSystem" /></el-form-item>
      <el-form-item label="消息 ID"><el-input v-model="messageId" /></el-form-item>
      <el-form-item label="续传 token"><el-input v-model="resumeToken" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="ingest(false)">推送空消息</el-button>
        <el-button @click="ingest(true)">推送示例指标</el-button>
      </el-form-item>
    </el-form>
    <el-alert v-if="res" style="margin-top:12px" :title="res.duplicated ? '重复消息已忽略' : '接入成功'" type="success" :description="JSON.stringify(res)" />
  </el-card>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const sourceSystem = ref('center-a')
const messageId = ref('msg-1')
const resumeToken = ref('')
const res = ref(null)
async function ingest(withRows) {
  const rows = withRows ? [{
    姓名: '张三', 身份证号: '110101199001011234', 体检日期: '2026-10-10',
    体检机构: 'FHIR 样例中心', 指标名称: '血糖', 检测值: '6.2', 单位: 'mmol/L', 参考范围: '3.9-6.1',
  }] : []
  res.value = await adminHttp.post('/admin/fhir/ingest', {
    sourceSystem: sourceSystem.value,
    messageId: messageId.value,
    resumeToken: resumeToken.value,
    rows,
  })
  resumeToken.value = res.value.resumeToken
  ElMessage.success(res.value.duplicated ? '重复消息' : '已接入，C 端报告与医生预警已同步')
}
</script>

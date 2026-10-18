<template>
  <el-card>
    <h3 class="jh-page-title">健康宣教</h3>
    <p class="jh-page-sub">发布后推送给签约患者分组，用户端「我的」可阅读</p>
    <el-form label-width="80px" style="max-width:640px">
      <el-form-item label="标题"><el-input v-model="title" maxlength="40" show-word-limit /></el-form-item>
      <el-form-item label="分组">
        <el-select v-model="group" style="width:220px">
          <el-option label="全部签约患者" value="全部签约患者" />
          <el-option label="高血压组" value="高血压组" />
          <el-option label="糖尿病组" value="糖尿病组" />
        </el-select>
      </el-form-item>
      <el-form-item label="内容"><el-input v-model="content" type="textarea" rows="5" /></el-form-item>
      <el-form-item><el-button type="primary" round @click="publish">发布并推送</el-button></el-form-item>
    </el-form>
    <el-table :data="items" style="margin-top:8px">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="group" label="分组" width="140" />
      <el-table-column prop="reads" label="阅读" width="80" />
      <el-table-column prop="likes" label="点赞" width="80" />
      <el-table-column prop="comments" label="评论" width="80" />
      <el-table-column prop="createdAt" label="时间" width="180">
        <template #default="{ row }">{{ String(row.createdAt || '').replace('T', ' ').slice(0, 16) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'
const title = ref('高血压饮食要点')
const content = ref('少盐少油，增加蔬菜，每日步行 30 分钟。血压持续偏高请及时复诊。')
const group = ref('高血压组')
const items = ref([])
async function load() { items.value = ((await doctorHttp.get('/edu')).items || []).slice().reverse() }
async function publish() {
  if (!title.value.trim()) return ElMessage.warning('请填写标题')
  await doctorHttp.post('/edu', { title: title.value, content: content.value, group: group.value })
  ElMessage.success('已发布并推送给签约患者')
  load()
}
onMounted(load)
</script>

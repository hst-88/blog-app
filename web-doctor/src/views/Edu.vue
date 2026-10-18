<template>
  <el-card>
    <el-input v-model="title" placeholder="标题" />
    <el-input v-model="content" type="textarea" rows="4" style="margin-top:8px" placeholder="富文本内容" />
    <el-button type="primary" style="margin-top:8px" @click="publish">发布并推送</el-button>
    <el-descriptions v-if="post" style="margin-top:12px">
      <el-descriptions-item label="阅读">{{ post.reads }}</el-descriptions-item>
      <el-descriptions-item label="点赞">{{ post.likes }}</el-descriptions-item>
      <el-descriptions-item label="评论">{{ post.comments }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>
<script setup>
import { ref } from 'vue'
import http from '../api'
const title = ref('高血压饮食要点')
const content = ref('少盐少油，增加蔬菜。')
const post = ref(null)
async function publish() {
  post.value = await http.post('/edu', { title: title.value, content: content.value, group: '高血压组' })
}
</script>

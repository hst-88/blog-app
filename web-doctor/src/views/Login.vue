<template>
  <div class="wrap">
    <el-card class="card">
      <h2>检后无忧 · 医生端</h2>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="账号"><el-input v-model="username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="password" type="password" /></el-form-item>
        <el-button type="primary" native-type="submit" style="width:100%">登录</el-button>
      </el-form>
      <p class="hint">演示账号 doctor / doctor123</p>
    </el-card>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '../api'
const router = useRouter()
const username = ref('doctor')
const password = ref('doctor123')
async function onSubmit() {
  try {
    const res = await http.post('/auth/staff', { username: username.value, password: password.value, expectRole: 'doctor' })
    localStorage.setItem('jh_doctor_token', res.token)
    router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}
</script>
<style scoped>
.wrap { min-height: 100%; display: flex; align-items: center; justify-content: center; background: #ecfeff; }
.card { width: 380px; }
.hint { color: #64748b; font-size: 12px; text-align: center; }
</style>

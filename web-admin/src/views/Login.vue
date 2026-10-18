<template>
  <div class="auth-wrap admin">
    <div class="auth-card">
      <p class="kicker">管理端</p>
      <h2>体检中心控制台</h2>
      <p class="sub">导入报告、统计白皮书、权限与预警配置</p>
      <el-form @submit.prevent="onSubmit" label-position="top">
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item v-if="mode === 'register'" label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" round style="width:100%;height:44px">{{ mode === 'login' ? '登录' : '注册并进入' }}</el-button>
      </el-form>
      <p class="switch"><a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'">{{ mode === 'login' ? '没有账号？注册管理员' : '已有账号？去登录' }}</a></p>
      <p class="hint">演示账号 admin / admin123</p>
      <a class="back" href="/">返回三端入口</a>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'

const router = useRouter()
const mode = ref('login')
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123', name: '平台管理员' })

async function onSubmit() {
  loading.value = true
  try {
    const res = mode.value === 'login'
      ? await adminHttp.post('/auth/staff', { username: form.username, password: form.password, expectRole: 'admin' })
      : await adminHttp.post('/auth/staff/register', { ...form, role: 'admin' })
    localStorage.setItem('jh_admin_token', res.token)
    router.push('/admin')
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.admin { background: radial-gradient(circle at 20% 0, #e2e8f0, #f8fafc 42%); }
.kicker { color: #0284c7; font-weight: 700; letter-spacing: 2px; font-size: 12px; margin: 0 0 6px; }
</style>

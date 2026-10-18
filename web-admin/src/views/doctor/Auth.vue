<template>
  <div class="auth-wrap doctor">
    <div class="auth-card">
      <p class="kicker">医生端</p>
      <h2>基层医生工作台</h2>
      <p class="sub">患者档案、预警处理、咨询回复与随访</p>
      <el-form @submit.prevent="onSubmit" label-position="top">
        <el-form-item label="账号"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item v-if="mode === 'register'" label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" round style="width:100%;height:44px">{{ mode === 'login' ? '登录' : '注册并进入' }}</el-button>
      </el-form>
      <p class="switch"><a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'">{{ mode === 'login' ? '没有账号？注册医生' : '已有账号？去登录' }}</a></p>
      <p class="hint">演示账号 doctor / doctor123</p>
      <a class="back" href="/">返回三端入口</a>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { doctorHttp } from '../../api'

const router = useRouter()
const mode = ref('login')
const loading = ref(false)
const form = reactive({ username: 'doctor', password: 'doctor123', name: '李医生' })

async function onSubmit() {
  loading.value = true
  try {
    const res = mode.value === 'login'
      ? await doctorHttp.post('/auth/staff', { username: form.username, password: form.password, expectRole: 'doctor' })
      : await doctorHttp.post('/auth/staff/register', { ...form, role: 'doctor' })
    localStorage.setItem('jh_doctor_token', res.token)
    router.push('/doctor/home')
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.doctor { background: radial-gradient(circle at 80% 0, #ccfbf1, #f8fafc 46%); }
.kicker { color: #0f766e; font-weight: 700; letter-spacing: 2px; font-size: 12px; margin: 0 0 6px; }
</style>

<template>
  <div class="mp-root">
    <div class="mp">
      <div class="login-hero">
        <div class="mark">检</div>
        <div style="font-size:22px;font-weight:800">检后无忧</div>
        <p style="opacity:.85;margin:8px 0 0;font-size:13px">看懂报告 · 问到医生 · 管住指标</p>
      </div>
      <div class="login-sheet">
        <h2>{{ mode === 'login' ? '手机号登录' : '注册账号' }}</h2>
        <p class="desc">{{ mode === 'login' ? '登录后查看体检报告并咨询签约医生' : '填写资料后自动匹配报告并签约医生' }}</p>
        <div class="field"><label>手机号</label><input v-model="form.phone" maxlength="11" placeholder="请输入 11 位手机号" /></div>
        <div class="field"><label>密码</label><input v-model="form.password" type="password" placeholder="至少 6 位" /></div>
        <template v-if="mode === 'register'">
          <div class="field"><label>昵称</label><input v-model="form.nickname" maxlength="20" /></div>
          <div class="field"><label>年龄</label><input v-model="form.age" /></div>
          <div class="field">
            <label>性别</label>
            <div class="gender">
              <button type="button" :class="{ on: form.gender === 'male' }" @click="form.gender = 'male'">男</button>
              <button type="button" :class="{ on: form.gender === 'female' }" @click="form.gender = 'female'">女</button>
            </div>
          </div>
          <div class="field"><label>真实姓名</label><input v-model="form.realName" /></div>
          <div class="field"><label>身份证号（匹配报告）</label><input v-model="form.idNo" /></div>
        </template>
        <button class="mp-btn" :disabled="loading" @click="submit">{{ loading ? '请稍候…' : mode === 'login' ? '登录' : '注册并进入' }}</button>
        <p class="link-row">
          <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'">{{ mode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}</a>
        </p>
        <p class="tiny">演示 13800138000 / user123 · 李四 13900139000</p>
        <p class="tiny"><a href="/" style="color:#8a9199">返回三端入口</a></p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'

const router = useRouter()
const mode = ref('login')
const loading = ref(false)
const form = reactive({
  phone: '13800138000',
  password: 'user123',
  nickname: '张三',
  age: '35',
  gender: 'male',
  realName: '张三',
  idNo: '110101199001011234',
})

async function submit() {
  loading.value = true
  try {
    const res = mode.value === 'login'
      ? await userHttp.post('/auth/login', { phone: form.phone, password: form.password })
      : await userHttp.post('/auth/register', form)
    localStorage.setItem('jh_user_token', res.token)
    router.push('/user/home')
  } catch (e) {
    ElMessage.error(e.message || '失败')
  } finally {
    loading.value = false
  }
}
</script>

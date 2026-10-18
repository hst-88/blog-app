<template>
  <div>
    <div class="mine-head">
      <div class="av">{{ (me.nickname || '用').slice(0, 1) }}</div>
      <div>
        <div style="font-size:20px;font-weight:800">{{ me.nickname || '用户' }}</div>
        <div style="opacity:.85;font-size:13px;margin-top:4px">{{ me.phone || '未绑定手机' }} · {{ me.contracted ? '已签约医生' : '未签约' }}</div>
      </div>
    </div>
    <div class="cell">
      <router-link to="/user/edit">编辑资料<em>›</em></router-link>
      <router-link to="/user/reports">我的报告<em>›</em></router-link>
      <router-link to="/user/packages">体检预约<em>›</em></router-link>
      <router-link to="/user/appointments">我的预约<em>›</em></router-link>
      <router-link to="/user/reminders">复查提醒<em>›</em></router-link>
      <router-link to="/user/risk">健康评估<em>›</em></router-link>
      <router-link to="/user/health">打卡记录<em>›</em></router-link>
      <router-link to="/user/consults">咨询记录<em>›</em></router-link>
      <router-link to="/user/ai">AI 解读<em>›</em></router-link>
    </div>
    <div class="cell" v-if="edu.length">
      <a v-for="e in edu" :key="e.id" href="#" @click.prevent="read(e)">{{ e.title }}<em>›</em></a>
    </div>
    <div class="cell">
      <a href="/">返回三端入口<em>›</em></a>
      <button type="button" @click="logout">退出登录<em>›</em></button>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const router = useRouter()
const me = ref({})
const edu = ref([])
onMounted(async () => {
  try { me.value = (await userHttp.get('/auth/me')).user || {} } catch { router.push('/user/login') }
  try { edu.value = ((await userHttp.get('/edu')).items || []).slice(0, 5) } catch { /* ignore */ }
})
async function read(e) {
  try { await userHttp.post(`/edu/${e.id}/read`) } catch { /* ignore */ }
  ElMessage.success(e.title)
}
function logout() {
  localStorage.removeItem('jh_user_token')
  router.push('/user/login')
}
</script>

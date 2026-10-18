<template>
  <div>
    <div class="mp-nav plain">
      <div class="row">
        <span class="back" @click="$router.back()">‹</span>
        <h1>编辑资料</h1>
        <span></span>
      </div>
    </div>
    <div class="mp-sec" style="padding-top:12px">
      <div class="mp-card">
        <div class="field">
          <label>昵称</label>
          <input v-model="form.nickname" maxlength="20" placeholder="昵称" />
        </div>
        <div class="field">
          <label>性别</label>
          <div class="gender">
            <button type="button" :class="{ on: form.gender === 'male' }" @click="form.gender = 'male'">男</button>
            <button type="button" :class="{ on: form.gender === 'female' }" @click="form.gender = 'female'">女</button>
          </div>
        </div>
        <div class="field">
          <label>年龄</label>
          <input v-model.number="form.age" type="number" min="1" max="120" placeholder="年龄" />
        </div>
        <div class="field">
          <label>手机号（已绑定不可修改）</label>
          <input :value="me.phone || '未绑定'" disabled />
        </div>
        <div class="field">
          <label>既往病史</label>
          <input v-model="form.medicalHistory" maxlength="200" placeholder="如 高血压、糖尿病" />
        </div>
        <div class="field">
          <label>过敏史</label>
          <input v-model="form.allergyHistory" maxlength="200" placeholder="如 青霉素过敏" />
        </div>
      </div>
      <button class="mp-btn" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
      <p class="disclaimer">实名信息用于匹配体检报告，需在登录页完成实名</p>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { userHttp } from '../../api'
const me = ref({})
const saving = ref(false)
const form = ref({ nickname: '', gender: 'male', age: 30, medicalHistory: '', allergyHistory: '' })
async function load() {
  const res = await userHttp.get('/auth/me')
  me.value = res.user || {}
  const u = me.value
  form.value = {
    nickname: u.nickname || '',
    gender: u.gender || 'male',
    age: u.age || 30,
    medicalHistory: u.medicalHistory || '',
    allergyHistory: u.allergyHistory || '',
  }
}
async function save() {
  saving.value = true
  try {
    await userHttp.put('/users/me/profile', form.value)
    ElMessage.success('已保存')
    load()
  } catch (e) { ElMessage.error(e.message || '保存失败') }
  finally { saving.value = false }
}
onMounted(load)
</script>

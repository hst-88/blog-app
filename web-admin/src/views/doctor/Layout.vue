<template>
  <el-container class="workbench">
    <el-aside>
      <div class="brand-block">
        <div class="brand-mark">医</div>
        <div>医生工作台<small>基层健康管理</small></div>
      </div>
      <el-menu router :default-active="$route.path" background-color="#134e4a" text-color="#ccfbf1" active-text-color="#5eead4">
        <el-menu-item index="/doctor/home">工作台</el-menu-item>
        <el-menu-item index="/doctor/patients">患者列表</el-menu-item>
        <el-menu-item index="/doctor/alerts">预警中心</el-menu-item>
        <el-menu-item index="/doctor/consult">咨询工作台</el-menu-item>
        <el-menu-item index="/doctor/followups">随访任务</el-menu-item>
        <el-menu-item index="/doctor/edu">健康宣教</el-menu-item>
        <el-menu-item index="/doctor/settings">个人设置</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <span>基层医生端</span>
        <div>
          <el-button text @click="$router.push('/')">三端入口</el-button>
          <el-button text @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main><router-view /></el-main>
    </el-container>
  </el-container>
</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function logout() {
  localStorage.removeItem('jh_doctor_token')
  router.push('/doctor/login')
}
</script>
<style scoped>
.el-aside { background: #134e4a; }
.brand-mark { background: linear-gradient(135deg, #2dd4bf, #0f766e); }
</style>

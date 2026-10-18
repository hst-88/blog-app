<template>
  <el-container style="height:100%">
    <el-aside width="220px" class="aside">
      <div class="brand">医生工作台</div>
      <el-menu router :default-active="$route.path" background-color="#164e63" text-color="#e2e8f0" active-text-color="#67e8f9">
        <el-menu-item index="/patients">患者列表</el-menu-item>
        <el-menu-item index="/alerts">预警中心</el-menu-item>
        <el-menu-item index="/consult">咨询工作台</el-menu-item>
        <el-menu-item index="/followups">随访任务</el-menu-item>
        <el-menu-item index="/edu">健康宣教</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>基层医生端</span>
        <el-button text @click="logout">退出</el-button>
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
  router.push('/login')
}
</script>
<style scoped>
.aside { background: #164e63; }
.brand { padding: 20px 16px; color: #fff; font-weight: 700; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
</style>

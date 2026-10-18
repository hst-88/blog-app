<template>
  <el-container class="workbench">
    <el-aside>
      <div class="brand-block">
        <div class="brand-mark">管</div>
        <div>检后无忧<small>体检中心管理</small></div>
      </div>
      <el-menu router :default-active="$route.path" background-color="#0f172a" text-color="#cbd5e1" active-text-color="#38bdf8">
        <el-menu-item index="/admin">运营总览</el-menu-item>
        <el-menu-item index="/admin/imports">数据导入</el-menu-item>
        <el-menu-item index="/admin/fhir">接口同步</el-menu-item>
        <el-menu-item index="/admin/packages">套餐管理</el-menu-item>
        <el-menu-item index="/admin/appointments">预约管理</el-menu-item>
        <el-menu-item index="/admin/stats">统计白皮书</el-menu-item>
        <el-menu-item index="/admin/users">用户与推送</el-menu-item>
        <el-menu-item index="/admin/doctors">医生管理</el-menu-item>
        <el-menu-item index="/admin/rbac">角色权限</el-menu-item>
        <el-menu-item index="/admin/logs">操作日志</el-menu-item>
        <el-menu-item index="/admin/settings/alerts">预警阈值</el-menu-item>
        <el-menu-item index="/admin/settings/appointments">号源设置</el-menu-item>
        <el-menu-item index="/admin/settings/risk-model">评估模型</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <span>运营控制台</span>
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
  localStorage.removeItem('jh_admin_token')
  router.push('/admin/login')
}
</script>
<style scoped>
.el-aside { background: #0f172a; }
</style>

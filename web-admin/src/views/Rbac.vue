<template>
  <el-card>
    <template #header>
      <div class="hd">
        <b>角色权限</b>
        <el-button type="primary" @click="show = true">新增角色</el-button>
      </div>
    </template>
    <el-table :data="items">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="parentRoleId" label="父角色" width="100" />
      <el-table-column label="权限">
        <template #default="{ row }">
          <el-tag v-for="p in row.permissions || []" :key="p" size="small" style="margin-right:6px">{{ p }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="show" title="新增角色" width="420px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="父角色"><el-input-number v-model="form.parentRoleId" :min="0" /></el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox label="stats:read" />
            <el-checkbox label="import:write" />
            <el-checkbox label="patient:contracted:read" />
            <el-checkbox label="user:push" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="add">保存</el-button></template>
    </el-dialog>
  </el-card>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const items = ref([])
const show = ref(false)
const form = reactive({ name: '自定义角色', parentRoleId: 2, permissions: ['stats:read'] })
async function load() { items.value = (await adminHttp.get('/admin/roles')).items }
async function add() {
  await adminHttp.post('/admin/roles', { ...form })
  ElMessage.success('已新增角色')
  show.value = false
  load()
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
</style>

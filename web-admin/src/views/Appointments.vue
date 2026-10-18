<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>预约管理</b>
          <p>C 端用户下单后在此汇总，可按套餐与日期查看</p>
        </div>
        <el-select v-model="pkgFilter" clearable placeholder="按套餐筛选" style="width:200px">
          <el-option v-for="p in packages" :key="p.id" :label="p.name" :value="p.name" />
        </el-select>
      </div>
    </template>
    <el-table :data="filtered">
      <el-table-column prop="id" label="单号" width="70" />
      <el-table-column prop="patientName" label="用户" width="120" />
      <el-table-column prop="packageName" label="套餐" />
      <el-table-column prop="date" label="体检日期" width="120" />
      <el-table-column prop="slot" label="时段" width="130" />
      <el-table-column prop="contactPhone" label="联系电话" width="140" />
      <el-table-column label="金额" width="90">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'booked' ? 'success' : 'info'" size="small">{{ row.status === 'booked' ? '已预约' : '已取消' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { adminHttp } from '../api'
const items = ref([])
const packages = ref([])
const pkgFilter = ref('')
const filtered = computed(() => (pkgFilter.value ? items.value.filter((a) => a.packageName === pkgFilter.value) : items.value))
onMounted(async () => {
  items.value = (await adminHttp.get('/admin/appointments')).items
  packages.value = (await adminHttp.get('/admin/packages')).items
})
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
</style>

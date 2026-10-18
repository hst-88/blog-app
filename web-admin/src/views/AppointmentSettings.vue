<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>号源设置</b>
          <p>所有套餐共用同一批号源；每时段人数 × 时段数 = 单日可约上限，C 端按此显示「当日可约 N 人」</p>
        </div>
        <el-button type="primary" @click="save">保存</el-button>
      </div>
    </template>

    <el-form label-width="120px" style="max-width:640px">
      <el-form-item label="每时段人数">
        <el-input-number v-model="form.slotCapacity" :min="1" :max="200" :step="1" />
        <span class="hint">单日上限 = 每时段人数 × 时段数 = {{ form.slotCapacity * (form.slots.length || 0) }} 人</span>
      </el-form-item>
      <el-form-item label="时段">
        <div style="width:100%">
          <el-tag v-for="(s, i) in form.slots" :key="s" closable style="margin:0 8px 8px 0" @close="removeSlot(i)">{{ s }}</el-tag>
          <div style="display:flex;gap:8px;margin-top:4px">
            <el-input v-model="newSlot" placeholder="如 14:00-15:00" style="width:200px" />
            <el-button @click="addSlot">添加时段</el-button>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="停约日期">
        <div style="width:100%">
          <el-date-picker v-model="newDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
          <el-button style="margin-left:8px" @click="addDate">添加</el-button>
          <div style="margin-top:8px">
            <el-tag v-for="(d, i) in form.closedDates" :key="d" type="warning" closable style="margin:0 8px 8px 0" @close="removeDate(i)">{{ d }}</el-tag>
            <span v-if="!form.closedDates.length" class="hint">无停约日期</span>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminHttp } from '../api'
const form = ref({ slotCapacity: 4, slots: [], closedDates: [] })
const newSlot = ref('')
const newDate = ref('')
async function load() {
  const d = await adminHttp.get('/admin/settings/appointments')
  form.value = { slotCapacity: d.slotCapacity, slots: d.slots || [], closedDates: d.closedDates || [] }
}
function addSlot() {
  const v = newSlot.value.trim()
  if (!v) return
  if (form.value.slots.includes(v)) return ElMessage.warning('时段已存在')
  form.value.slots.push(v)
  newSlot.value = ''
}
function removeSlot(i) { form.value.slots.splice(i, 1) }
function addDate() {
  if (!newDate.value) return
  if (form.value.closedDates.includes(newDate.value)) return ElMessage.warning('日期已存在')
  form.value.closedDates.push(newDate.value)
  newDate.value = ''
}
function removeDate(i) { form.value.closedDates.splice(i, 1) }
async function save() {
  if (!form.value.slots.length) return ElMessage.warning('至少保留一个时段')
  await adminHttp.put('/admin/settings/appointments', form.value)
  ElMessage.success('已保存')
  load()
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.hint { color: #94a3b8; font-size: 12px; margin-left: 10px; }
</style>

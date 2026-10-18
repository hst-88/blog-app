<template>
  <el-card>
    <template #header>
      <div class="hd">
        <div>
          <b>套餐管理</b>
          <p>套餐项目从指标库勾选；上架后 C 端「体检预约」可看可约，下架即隐藏</p>
        </div>
        <el-button type="primary" @click="open()">新增套餐</el-button>
      </div>
    </template>
    <el-table :data="items">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" width="150" />
      <el-table-column prop="crowd" label="适用人群" width="160" />
      <el-table-column prop="price" label="价格" width="90">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="项目" min-width="240">
        <template #default="{ row }">
          <el-tag v-for="it in row.items" :key="it.code" size="small" style="margin:2px 4px 2px 0">{{ it.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bookedCount" label="已预约" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'on' ? 'success' : 'info'" size="small">{{ row.status === 'on' ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="open(row)">编辑</el-button>
          <el-button text @click="toggle(row)">{{ row.status === 'on' ? '下架' : '上架' }}</el-button>
          <el-button text type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="show" :title="form.id ? '编辑套餐' : '新增套餐'" width="680px" top="6vh">
      <el-form label-width="90px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="价格"><el-input-number v-model="form.price" :min="0" :step="10" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="体检地点"><el-input v-model="form.dept" placeholder="如 体检中心二楼" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="耗时"><el-input v-model="form.duration" placeholder="如 约 1.5 小时" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="适用人群"><el-input v-model="form.crowd" placeholder="如 40 岁以上 · 三高人群" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="form.desc" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="标签">
          <el-input v-model="tagText" placeholder="逗号分隔，如 当天出报告,含腹部彩超" />
        </el-form-item>
        <el-form-item label="注意事项">
          <el-input v-model="noticeText" type="textarea" :rows="2" placeholder="每行一条" />
        </el-form-item>
        <el-form-item label="检查项目">
          <div class="cat">
            <el-checkbox-group v-model="selectedCodes">
              <el-checkbox v-for="c in catalog" :key="c.code" :label="c.code" border style="margin:6px 8px 0 0">
                {{ c.name }}<span class="cat-dept">·{{ c.dept }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="on" inactive-value="off" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="show = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminHttp } from '../api'
const items = ref([])
const catalog = ref([])
const show = ref(false)
const selectedCodes = ref([])
const tagText = ref('')
const noticeText = ref('')
const form = ref({ name: '', price: 0, crowd: '', dept: '', duration: '', desc: '', status: 'on' })

const selectedItems = computed(() => selectedCodes.value.map((code) => ({ code })))

async function load() { items.value = (await adminHttp.get('/admin/packages')).items }
async function loadCatalog() { catalog.value = (await adminHttp.get('/indicator-catalog')).items }

function open(row) {
  if (row) {
    form.value = { ...row }
    selectedCodes.value = (row.items || []).map((it) => it.code)
    tagText.value = (row.tags || []).join(',')
    noticeText.value = (row.notice || []).join('\n')
  } else {
    form.value = { name: '', price: 299, crowd: '', dept: '', duration: '', desc: '', status: 'on' }
    selectedCodes.value = []
    tagText.value = ''
    noticeText.value = ''
  }
  show.value = true
}
async function save() {
  if (!form.value.name) return ElMessage.warning('请填写名称')
  if (!selectedCodes.value.length) return ElMessage.warning('请至少勾选一个检查项目')
  const payload = {
    ...form.value,
    items: selectedItems.value,
    tags: tagText.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    notice: noticeText.value.split('\n').map((s) => s.trim()).filter(Boolean),
  }
  await adminHttp.post('/admin/packages', payload)
  show.value = false
  ElMessage.success('已保存')
  load()
}
async function toggle(row) {
  await adminHttp.post('/admin/packages', { id: row.id, status: row.status === 'on' ? 'off' : 'on' })
  ElMessage.success(row.status === 'on' ? '已下架，C 端不再展示' : '已上架')
  load()
}
async function remove(row) {
  await ElMessageBox.confirm(`确认删除套餐「${row.name}」？`, '提示', { type: 'warning' })
  await adminHttp.post('/admin/packages/delete', { id: row.id })
  ElMessage.success('已删除')
  load()
}
onMounted(async () => { await loadCatalog(); await load() })
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.hd p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.cat { max-height: 180px; overflow: auto; width: 100%; }
.cat-dept { color: #94a3b8; font-size: 11px; }
</style>

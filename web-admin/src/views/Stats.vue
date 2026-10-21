<template>
  <div>
    <el-card>
      <template #header>
        <div class="hd">
          <div>
            <b>三端运营白皮书</b>
            <p>把检前预约、检后报告、医生干预、用户转化放在一张表上，数字均可跳到对应页面核对</p>
          </div>
          <el-form inline>
            <el-form-item label="机构">
              <el-select v-model="org" clearable placeholder="全部机构" style="width:200px" @change="load">
                <el-option v-for="o in data.orgs || []" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="load">刷新</el-button>
            <el-button @click="paper">生成白皮书</el-button>
            <el-button @click="exportJson">导出 JSON</el-button>
          </el-form>
        </div>
      </template>

      <el-alert v-if="data.narrative" type="info" show-icon :closable="false" style="margin-bottom:16px">
        <template #title>这份白皮书在说什么</template>
        <p v-for="(line, i) in data.narrative" :key="i" class="nar">{{ line }}</p>
      </el-alert>

      <h4 class="sec">1. 用户转化漏斗 · 从注册到问到医生</h4>
      <p class="hint">C 端注册 → 预约体检 → 管理端导入报告匹配身份证 → 用户看报告并发起咨询。断开的环节就是要补的运营动作。</p>
      <div class="funnel">
        <div class="funnel-cell" @click="$router.push('/admin/users')">
          <span>注册用户</span><b>{{ funnel.users }}</b>
          <em>用户管理</em>
        </div>
        <i>→</i>
        <div class="funnel-cell" @click="$router.push('/admin/appointments')">
          <span>已预约</span><b>{{ funnel.appointed }}</b>
          <em>预约管理 · C 端下单</em>
        </div>
        <i>→</i>
        <div class="funnel-cell" @click="$router.push('/admin/imports')">
          <span>已有报告</span><b>{{ funnel.withReport }}</b>
          <em>数据导入匹配</em>
        </div>
        <i>→</i>
        <div class="funnel-cell" @click="$router.push('/admin/users')">
          <span>已咨询医生</span><b>{{ funnel.consulted }}</b>
          <em>C 端咨询 → 医生工作台</em>
        </div>
      </div>

      <el-row :gutter="16" style="margin-top:16px">
        <el-col :span="12">
          <h4 class="sec">2. 检前预约 · 套餐与号源是否在被用</h4>
          <p class="hint">数据来自 C 端「确认预约 / 我的预约」。取消会释放号源，回到号源设置里的当日余量。</p>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="有效预约">{{ appt.booked }}</el-descriptions-item>
            <el-descriptions-item label="已取消">{{ appt.cancelled }}</el-descriptions-item>
          </el-descriptions>
          <el-table :data="appt.byPackage || []" size="small" style="margin-top:8px" @row-click="$router.push('/admin/appointments')">
            <el-table-column prop="name" label="套餐" />
            <el-table-column prop="booked" label="有效预约" width="100" />
            <el-table-column prop="cancelled" label="取消" width="80" />
          </el-table>
          <div class="links">
            <el-button text type="primary" @click="$router.push('/admin/packages')">去套餐管理</el-button>
            <el-button text type="primary" @click="$router.push('/admin/settings/appointments')">去号源设置</el-button>
            <el-button text type="primary" @click="$router.push('/admin/appointments')">去预约明细</el-button>
          </div>
        </el-col>
        <el-col :span="12">
          <h4 class="sec">3. 检后异常 · 导入报告里什么指标在亮</h4>
          <p class="hint">柱状图来自已导入指标。改「预警阈值」只影响之后新导入；医生端预警中心处理的是这些异常打出来的工单。</p>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="报告数">{{ data.reportCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="异常率">{{ pct(data.abnormalRate) }}</el-descriptions-item>
            <el-descriptions-item label="检出率">{{ pct(data.detectRate) }}</el-descriptions-item>
          </el-descriptions>
          <div ref="chartEl" style="height:240px;margin-top:8px"></div>
          <div class="links">
            <el-button text type="primary" @click="$router.push('/admin/imports')">去导入报告</el-button>
            <el-button text type="primary" @click="$router.push('/admin/settings/alerts')">去预警阈值</el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top:16px">
      <h4 class="sec">4. 医生干预 · 预警有没有人接、用户问了有没有人回</h4>
      <p class="hint">这些数字对应医生端四个菜单。中高风险未咨询的人，需要医生从患者列表跟进，或管理端按风险筛用户后推送。</p>
      <div class="kpi-grid">
        <div class="kpi tap" @click="$router.push('/admin/users')">
          <span>未处理预警</span><b>{{ iv.alertsOpen || 0 }}</b>
          <em>医生端预警中心</em>
        </div>
        <div class="kpi tap" @click="$router.push('/admin/users')">
          <span>已处理预警</span><b>{{ iv.alertsHandled || 0 }}</b>
          <em>可转随访</em>
        </div>
        <div class="kpi tap">
          <span>进行中随访</span><b>{{ iv.followupsOpen || 0 }}</b>
          <em>医生端随访任务</em>
        </div>
        <div class="kpi tap">
          <span>待复查提醒</span><b>{{ iv.remindersPending || 0 }}</b>
          <em>C 端复查提醒页</em>
        </div>
        <div class="kpi tap">
          <span>咨询会话</span><b>{{ iv.consults || 0 }}</b>
          <em>C 端发、医生回</em>
        </div>
        <div class="kpi tap">
          <span>医生回复</span><b>{{ iv.doctorReplies || 0 }}</b>
          <em>相对用户消息 {{ iv.userMessages || 0 }}</em>
        </div>
        <div class="kpi tap" @click="$router.push('/admin/users')">
          <span>中高风险未咨询</span><b>{{ iv.unconsultedRisk || 0 }}</b>
          <em>优先随访对象</em>
        </div>
        <div class="kpi tap">
          <span>AI 追问 / 打卡</span><b>{{ iv.aiChats || 0 }} / {{ iv.healthLogs || 0 }}</b>
          <em>C 端 AI 页与血压打卡</em>
        </div>
      </div>
      <div class="links">
        <el-button text type="primary" @click="$router.push('/admin/doctors')">去医生管理</el-button>
        <el-button text type="primary" @click="$router.push('/admin/users')">去用户管理筛人推送</el-button>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { adminHttp } from '../api'
const org = ref('')
const data = ref({})
const chartEl = ref()
const funnel = computed(() => data.value.funnel || { users: 0, appointed: 0, withReport: 0, consulted: 0 })
const appt = computed(() => data.value.appointment || { booked: 0, cancelled: 0, byPackage: [] })
const iv = computed(() => data.value.intervention || {})
const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`
async function load() {
  data.value = await adminHttp.get('/admin/stats', { params: { org: org.value } })
  render()
}
async function paper() {
  data.value = await adminHttp.post('/admin/stats/whitepaper', { org: org.value })
  render()
}
async function exportJson() {
  const res = await fetch('/api/admin/stats/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('jh_admin_token')}` },
    body: JSON.stringify({ org: org.value }),
  })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'stats-whitepaper.json'
  a.click()
}
function render() {
  if (!chartEl.value || !data.value?.byName) return
  const c = echarts.init(chartEl.value)
  c.setOption({
    color: ['#0f766e'],
    grid: { left: 40, right: 16, top: 28, bottom: 48 },
    title: { text: '异常指标 TOP', textStyle: { fontSize: 13 } },
    xAxis: { type: 'category', data: data.value.byName.map((x) => x.name), axisLabel: { rotate: 28 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [{ type: 'bar', data: data.value.byName.map((x) => Number((x.rate * 100).toFixed(1))), barWidth: 22 }],
  })
}
onMounted(load)
</script>
<style scoped>
.hd { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.hd p, .hint { margin: 4px 0 10px; color: #64748b; font-size: 13px; line-height: 1.6; }
.sec { margin: 4px 0 0; font-size: 15px; }
.nar { margin: 4px 0; font-size: 13px; color: #334155; }
.funnel { display: flex; align-items: stretch; gap: 8px; }
.funnel i { color: #94a3b8; align-self: center; font-style: normal; }
.funnel-cell {
  flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 12px 14px; cursor: pointer;
}
.funnel-cell span { color: #64748b; font-size: 12px; }
.funnel-cell b { display: block; font-size: 28px; margin: 4px 0; }
.funnel-cell em { font-style: normal; font-size: 12px; color: #0f766e; }
.kpi.tap { cursor: pointer; }
.kpi em { display: block; margin-top: 4px; font-style: normal; font-size: 12px; color: #64748b; font-weight: 400; }
.links { margin-top: 8px; }
</style>

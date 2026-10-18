import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  ASK_DAILY_LIMIT,
  APPT_SLOTS,
  APPT_SLOT_CAPACITY,
  DEFAULT_ALERT_RULES,
  IndicatorStatus,
  RiskLevel,
} from '../../packages/shared/src/index.js'
import { encryptField, hashField } from './common/crypto.js'

const DATA_FILE = join(process.cwd(), 'data', 'store.json')

export type Role = 'user' | 'doctor' | 'admin'

export interface User {
  id: number
  openid: string
  nickname: string
  avatarUrl: string
  phoneEnc: string
  phoneHash: string
  passwordHash: string
  age: number | null
  gender: 'male' | 'female' | null
  medicalHistory: string
  allergyHistory: string
  realNameEnc: string
  idNoEnc: string
  idNoHash: string
  createdAt: string
}

export interface Staff {
  id: number
  username: string
  password: string
  name: string
  role: 'doctor' | 'admin'
  parentRoleId: number | null
  title?: string
  hospital?: string
  dept?: string
  phone?: string
  specialties?: string
  notifications?: { consult: boolean; alert: boolean; followup: boolean }
  status?: 'active' | 'disabled'
}

export interface Report {
  id: number
  userId: number | null
  examDate: string
  orgName: string
  riskLevel: string
  abnormalCount: number
  pdfKey: string
  thumbKey: string
  source: 'excel' | 'fhir'
  aiSummary: string
  idNoHash: string
}

export interface Indicator {
  id: number
  reportId: number
  name: string
  valueText: string
  unit: string
  refRange: string
  status: string
  department: string
}

export interface Consultation {
  id: number
  userId: number
  doctorId: number
  reportId: number | null
  archivedAt: string | null
}

export interface Message {
  id: number
  consultationId: number
  senderRole: 'user' | 'doctor'
  type: 'text' | 'image' | 'audio'
  content: string
  status: 'sent' | 'unread' | 'read'
  createdAt: string
}

export interface Alert {
  id: number
  reportId: number
  patientId: number | null
  level: string
  status: 'open' | 'handled'
  handledBy: number | null
  handledAt: string | null
  handleMethod: string
  indicatorName: string
}

const now = () => new Date().toISOString()

class Seq {
  n = 1
  next() {
    const v = this.n
    this.n += 1
    return v
  }
}

class Store {
  users = new Map<number, User>()
  staff = new Map<number, Staff>()
  doctorPatients = new Set<string>()
  reports = new Map<number, Report>()
  indicators = new Map<number, Indicator>()
  askLogs: { userId: number; day: string; count: number }[] = []
  consultations = new Map<number, Consultation>()
  messages: Message[] = []
  alerts = new Map<number, Alert>()
  alertRules = [...DEFAULT_ALERT_RULES]
  groups = new Map<number, { id: number; doctorId: number; name: string; memberIds: number[] }>()
  followups = new Map<number, any>()
  healthLogs: any[] = []
  aiChats: any[] = []
  reminders: any[] = []
  rechecks: any[] = []
  packages = new Map<number, any>()
  appointments = new Map<number, any>()
  indicatorCatalog: any[] = []
  roles = new Map<number, any>()
  audit: any[] = []
  sms = new Map<string, { code: string; exp: number; errors: number; lockedUntil: number }>()
  fhirCursors = new Map<string, { resumeToken: string; lastSuccessAt: string }>()
  fhirSeen = new Set<string>()
  importBatches: any[] = []
  eduPosts: any[] = []
  prescriptions: any[] = []
  riskModel = {
    version: 'v1',
    weights: { metabolic: 1, cardio: 1, liver: 1, respiratory: 1, bone: 1 },
  }
  appointmentSettings = { slotCapacity: APPT_SLOT_CAPACITY, slots: [...APPT_SLOTS], closedDates: [] as string[] }
  files = new Map<string, { mime: string; buf: Buffer; name: string }>()
  seq = { user: new Seq(), staff: new Seq(), report: new Seq(), ind: new Seq(), consult: new Seq(), msg: new Seq(), alert: new Seq(), group: new Seq(), fu: new Seq(), pkg: new Seq(), role: new Seq(), edu: new Seq(), appt: new Seq(), reminder: new Seq() }

  dirty = false
  persistTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.loadOrSeed()
    this.persistTimer = setInterval(() => this.flush(), 800)
  }

  loadOrSeed() {
    try {
      if (existsSync(DATA_FILE)) {
        this.hydrate(JSON.parse(readFileSync(DATA_FILE, 'utf8')))
        return
      }
    } catch {
      /* fall through to seed */
    }
    this.seed()
    this.flush(true)
  }

  touch() {
    this.dirty = true
  }

  flush(force = false) {
    if (!this.dirty && !force) return
    mkdirSync(dirname(DATA_FILE), { recursive: true })
    const payload = {
      users: [...this.users.entries()],
      staff: [...this.staff.entries()],
      doctorPatients: [...this.doctorPatients],
      reports: [...this.reports.entries()],
      indicators: [...this.indicators.entries()],
      askLogs: this.askLogs,
      consultations: [...this.consultations.entries()],
      messages: this.messages,
      alerts: [...this.alerts.entries()],
      alertRules: this.alertRules,
      groups: [...this.groups.entries()],
      followups: [...this.followups.entries()],
      healthLogs: this.healthLogs,
      reminders: this.reminders,
      aiChats: this.aiChats,
      rechecks: this.rechecks,
      packages: [...this.packages.entries()],
      appointments: [...this.appointments.entries()],
      indicatorCatalog: this.indicatorCatalog,
      roles: [...this.roles.entries()],
      audit: this.audit,
      fhirCursors: [...this.fhirCursors.entries()],
      fhirSeen: [...this.fhirSeen],
      importBatches: this.importBatches,
      eduPosts: this.eduPosts,
      prescriptions: this.prescriptions,
      riskModel: this.riskModel,
      appointmentSettings: this.appointmentSettings,
      seq: Object.fromEntries(Object.entries(this.seq).map(([k, v]) => [k, v.n])),
    }
    writeFileSync(DATA_FILE, JSON.stringify(payload))
    this.dirty = false
  }

  hydrate(data: any) {
    const toMap = (arr: any[], Ctor: typeof Map) => new Ctor(arr || [])
    this.users = toMap(data.users, Map)
    this.staff = toMap(data.staff, Map)
    this.doctorPatients = new Set(data.doctorPatients || [])
    this.reports = toMap(data.reports, Map)
    this.indicators = toMap(data.indicators, Map)
    this.askLogs = data.askLogs || []
    this.consultations = toMap(data.consultations, Map)
    this.messages = data.messages || []
    this.alerts = toMap(data.alerts, Map)
    this.alertRules = data.alertRules?.length ? data.alertRules : [...DEFAULT_ALERT_RULES]
    this.groups = toMap(data.groups, Map)
    this.followups = toMap(data.followups, Map)
    this.healthLogs = data.healthLogs || []
    this.reminders = data.reminders || []
    this.aiChats = data.aiChats || []
    this.rechecks = data.rechecks || []
    this.packages = toMap(data.packages, Map)
    this.appointments = toMap(data.appointments, Map)
    this.indicatorCatalog = data.indicatorCatalog?.length ? data.indicatorCatalog : defaultCatalog()
    this.roles = toMap(data.roles, Map)
    this.audit = data.audit || []
    this.fhirCursors = toMap(data.fhirCursors, Map)
    this.fhirSeen = new Set(data.fhirSeen || [])
    this.importBatches = data.importBatches || []
    this.eduPosts = data.eduPosts || []
    this.prescriptions = data.prescriptions || []
    this.riskModel = data.riskModel || this.riskModel
    if (data.appointmentSettings) this.appointmentSettings = { ...this.appointmentSettings, ...data.appointmentSettings }
    if (data.seq) {
      for (const [k, n] of Object.entries(data.seq)) {
        if (this.seq[k]) this.seq[k].n = Number(n) || this.seq[k].n
      }
    }
    this.repairAlerts()
    this.ensureCatalogAndPackages()
  }

  repairAlerts() {
    const known = new Set(this.alertRules.map((r) => r.name))
    for (const a of this.alerts.values()) {
      if (known.has(a.indicatorName)) continue
      const inds = [...this.indicators.values()].filter((i) => i.reportId === a.reportId && i.status !== 'normal')
      if (inds[0]) a.indicatorName = inds[0].name
    }
  }

  ensureCatalogAndPackages() {
    if (!this.indicatorCatalog?.length) this.indicatorCatalog = defaultCatalog()
    for (const [id, pkg] of [...this.packages.entries()]) {
      const items = Array.isArray(pkg.items) ? pkg.items : []
      if (!items.length) {
        this.packages.delete(id)
        continue
      }
      pkg.items = items
        .map((it: any) => (typeof it === 'string' ? { code: it } : it))
        .filter((it: any) => !!it?.code)
      if (!pkg.items.length) this.packages.delete(id)
    }
    const rich = [...this.packages.values()].some((p) => Array.isArray(p.items) && p.items[0]?.code)
    if (rich && this.packages.size >= 2) return
    const seeded = defaultPackages()
    for (const pkg of seeded) {
      const exist = [...this.packages.values()].find((p) => p.name === pkg.name)
      if (exist) Object.assign(exist, { ...pkg, id: exist.id, status: exist.status || pkg.status })
      else {
        const id = this.seq.pkg.next()
        this.packages.set(id, { ...pkg, id })
      }
    }
    this.touch()
  }

  seed() {
    const adminId = this.seq.staff.next()
    this.staff.set(adminId, {
      id: adminId,
      username: 'admin',
      password: 'admin123',
      name: '平台管理员',
      role: 'admin',
      parentRoleId: null,
    })
    const doctorId = this.seq.staff.next()
    this.staff.set(doctorId, {
      id: doctorId,
      username: 'doctor',
      password: 'doctor123',
      name: '李医生',
      role: 'doctor',
      parentRoleId: null,
    })
    const idNo = '110101199001011234'
    const user: User = {
      id: this.seq.user.next(),
      openid: 'demo-openid',
      nickname: '张三',
      avatarUrl: '',
      phoneEnc: encryptField('13800138000'),
      phoneHash: hashField('13800138000'),
      passwordHash: hashField('user123'),
      age: 35,
      gender: 'male',
      medicalHistory: '',
      allergyHistory: '',
      realNameEnc: encryptField('张三'),
      idNoEnc: encryptField(idNo),
      idNoHash: hashField(idNo),
      createdAt: now(),
    }
    this.users.set(user.id, user)
    this.doctorPatients.add(`${doctorId}:${user.id}`)

    const reportId = this.seq.report.next()
    const indicators = [
      { name: '谷丙转氨酶', value: '45', unit: 'U/L', range: '0-40', dept: '肝功能' },
      { name: '血糖', value: '5.4', unit: 'mmol/L', range: '3.9-6.1', dept: '生化' },
      { name: '总胆固醇', value: '4.8', unit: 'mmol/L', range: '0-5.2', dept: '血脂' },
      { name: '收缩压', value: '128', unit: 'mmHg', range: '90-140', dept: '一般检查' },
    ]
    let abnormal = 0
    for (const it of indicators) {
      const status = resolveStatus(it.value, it.range)
      if (status !== IndicatorStatus.NORMAL) abnormal += 1
      const id = this.seq.ind.next()
      this.indicators.set(id, {
        id,
        reportId,
        name: it.name,
        valueText: it.value,
        unit: it.unit,
        refRange: it.range,
        status,
        department: it.dept,
      })
    }
    this.reports.set(reportId, {
      id: reportId,
      userId: user.id,
      examDate: '2026-09-20',
      orgName: '示例体检中心',
      riskLevel: abnormal >= 5 ? RiskLevel.HIGH : abnormal >= 2 ? RiskLevel.MID : RiskLevel.LOW,
      abnormalCount: abnormal,
      pdfKey: '',
      thumbKey: '',
      source: 'excel',
      aiSummary: '',
      idNoHash: user.idNoHash,
    })
    this.roles.set(1, { id: 1, name: '医生', parentRoleId: null, permissions: ['patient:contracted:read'] })
    this.roles.set(2, { id: 2, name: '管理员', parentRoleId: null, permissions: ['import:write', 'stats:read'] })
    this.indicatorCatalog = defaultCatalog()
    for (const pkg of defaultPackages()) {
      const id = this.seq.pkg.next()
      this.packages.set(id, { ...pkg, id })
    }
    this.seq.role.n = 3
    const alertId = this.seq.alert.next()
    this.alerts.set(alertId, {
      id: alertId,
      reportId,
      patientId: user.id,
      level: 'mid',
      status: 'open',
      handledBy: null,
      handledAt: null,
      handleMethod: '',
      indicatorName: '谷丙转氨酶',
    })
  }

  auditLog(actorId: number, action: string, payload: any, ip: string) {
    this.audit.push({ id: randomUUID(), actorId, action, payload, ip, createdAt: now() })
    this.touch()
  }

  todayAskCount(userId: number) {
    const day = new Date().toISOString().slice(0, 10)
    const row = this.askLogs.find((x) => x.userId === userId && x.day === day)
    return row?.count || 0
  }

  incAsk(userId: number) {
    const day = new Date().toISOString().slice(0, 10)
    const row = this.askLogs.find((x) => x.userId === userId && x.day === day)
    if (row) row.count += 1
    else this.askLogs.push({ userId, day, count: 1 })
  }

  canAsk(userId: number) {
    return this.todayAskCount(userId) < ASK_DAILY_LIMIT
  }
}

function defaultCatalog() {
  return [
    { code: 'cbc', name: '血常规', dept: '检验科', desc: '红细胞、白细胞、血小板等 20 项' },
    { code: 'liver', name: '肝功能', dept: '检验科', desc: '谷丙转氨酶、谷草转氨酶、胆红素等' },
    { code: 'kidney', name: '肾功能', dept: '检验科', desc: '肌酐、尿素氮、尿酸' },
    { code: 'lipid', name: '血脂四项', dept: '检验科', desc: '总胆固醇、甘油三酯、高低密度脂蛋白' },
    { code: 'glucose', name: '空腹血糖', dept: '检验科', desc: '空腹血糖' },
    { code: 'hba1c', name: '糖化血红蛋白', dept: '检验科', desc: '近 3 个月平均血糖' },
    { code: 'thyroid', name: '甲状腺功能', dept: '检验科', desc: 'TSH、T3、T4' },
    { code: 'urine', name: '尿常规', dept: '检验科', desc: '尿蛋白、尿糖、隐血等' },
    { code: 'ecg', name: '心电图', dept: '功能科', desc: '静息十二导联' },
    { code: 'chest', name: '胸部正位片', dept: '放射科', desc: '心胸 DR 正位' },
    { code: 'abdomen', name: '腹部彩超', dept: '超声科', desc: '肝、胆、胰、脾、双肾' },
    { code: 'thyroid_us', name: '甲状腺彩超', dept: '超声科', desc: '甲状腺结节筛查' },
    { code: 'carotid', name: '颈动脉彩超', dept: '超声科', desc: '斑块与血流' },
    { code: 'tumor', name: '肿瘤标志物', dept: '检验科', desc: 'AFP、CEA 等' },
    { code: 'hpv', name: 'HPV+TCT', dept: '妇科', desc: '宫颈癌联合筛查' },
    { code: 'bone', name: '骨密度', dept: '功能科', desc: '双能 X 线' },
  ]
}

function defaultPackages() {
  return [
    {
      name: '入职基础套餐',
      price: 199,
      crowd: '18-45 岁 · 求职入职',
      dept: '体检中心一楼',
      duration: '约 1 小时',
      status: 'on',
      tags: ['当天出报告', '无需预约'],
      notice: ['体检前 8 小时禁食', '携带身份证原件'],
      desc: '覆盖入职常规必查项目，出报告快，满足多数企业入职要求。',
      items: [{ code: 'cbc' }, { code: 'liver' }, { code: 'ecg' }, { code: 'chest' }],
    },
    {
      name: '基础健康套餐',
      price: 299,
      crowd: '成人 · 每年体检',
      dept: '体检中心二楼',
      duration: '约 1.5 小时',
      status: 'on',
      tags: ['含腹部彩超', 'AI 报告解读'],
      notice: ['体检前 8 小时禁食', '晨起空腹，勿大量饮水'],
      desc: '在入职基础上增加腹部彩超与血脂血糖，适合年度常规体检。',
      items: [{ code: 'cbc' }, { code: 'liver' }, { code: 'kidney' }, { code: 'lipid' }, { code: 'glucose' }, { code: 'abdomen' }, { code: 'ecg' }],
    },
    {
      name: '慢病筛查套餐',
      price: 599,
      crowd: '40 岁以上 · 三高人群',
      dept: '体检中心二楼',
      duration: '约 2 小时',
      status: 'on',
      tags: ['含颈动脉彩超', '含糖化血红蛋白'],
      notice: ['体检前 8 小时禁食', '正在服药请提前告知医生'],
      desc: '针对高血压、高血糖、高血脂人群的深度筛查，含斑块与糖化指标。',
      items: [{ code: 'cbc' }, { code: 'liver' }, { code: 'kidney' }, { code: 'lipid' }, { code: 'glucose' }, { code: 'hba1c' }, { code: 'carotid' }, { code: 'abdomen' }, { code: 'ecg' }],
    },
    {
      name: '女性专项套餐',
      price: 899,
      crowd: '25 岁以上女性',
      dept: '体检中心三楼',
      duration: '约 2 小时',
      status: 'on',
      tags: ['含宫颈癌筛查', '女医师操作'],
      notice: ['避开月经期', '检查前 24 小时避免性生活'],
      desc: '在慢病筛查基础上增加 HPV+TCT 与甲状腺彩超，关注女性高发疾病。',
      items: [{ code: 'cbc' }, { code: 'liver' }, { code: 'kidney' }, { code: 'lipid' }, { code: 'glucose' }, { code: 'thyroid_us' }, { code: 'hpv' }, { code: 'abdomen' }, { code: 'bone' }],
    },
  ]
}

function resolveStatus(value: string, range: string) {
  const n = Number(value)
  const m = range.replace(/～/g, '~').match(/^([\d.]+)\s*[-~]\s*([\d.]+)$/)
  if (!Number.isFinite(n) || !m) return IndicatorStatus.NORMAL
  const min = Number(m[1])
  const max = Number(m[2])
  if (n < min) return IndicatorStatus.LOW
  if (n > max) return IndicatorStatus.HIGH
  return IndicatorStatus.NORMAL
}

export const store = new Store()

import { Injectable } from '@nestjs/common'
import { store } from './store.js'
import { Errors } from './common/http-error.js'
import { decryptField, encryptField, hashField } from './common/crypto.js'
import { signToken } from './common/jwt.js'
import { isValidAge, isValidIdNo, isValidPhone, isValidSmsCode, REPORT_PAGE_SIZE, PATIENT_PAGE_SIZE, CONSULT_MAX_IMAGES, CONSULT_MAX_IMAGE_BYTES, CONSULT_MAX_AUDIO_SECONDS, BP_CRITICAL_SBP, SMS_TTL_SECONDS, SMS_MAX_ERRORS, SMS_LOCK_SECONDS, ASK_DAILY_LIMIT, APPT_SLOTS, APPT_SLOT_CAPACITY } from '../../packages/shared/src/index.js'
import { resolveIndicatorStatus, reportRiskLevel, evaluateAlert, DEFAULT_ALERT_RULES } from '../../packages/shared/src/index.js'
import { buildAskPrompt, buildSummaryPrompt, chatComplete, mockSummary } from './ai/ai.service.js'
import { assessRisk } from './risk/risk.service.js'

function maskName(name: string) {
  if (!name) return ''
  return `${name[0]}*`
}
function maskPhone(p: string) {
  const d = (p || '').replace(/\D/g, '')
  if (d.length < 7) return '****'
  return `${d.slice(0, 3)}****${d.slice(-4)}`
}

@Injectable()
export class AppService {
  health() {
    return { ok: true, name: 'jianhou-wuyou' }
  }

  defaultDoctorId() {
    const d = [...store.staff.values()].find((x) => x.role === 'doctor')
    return d?.id || null
  }

  assignDoctor(userId: number) {
    for (const s of store.staff.values()) {
      if (s.role === 'doctor') store.doctorPatients.add(`${s.id}:${userId}`)
    }
    store.touch()
  }

  wechatLogin(body: any) {
    if (body?.denied) throw Errors.wechatDenied()
    const openid = body.openid || body.code || 'demo-openid'
    let user = [...store.users.values()].find((u) => u.openid === openid)
    if (!user) {
      const id = store.seq.user.next()
      user = {
        id,
        openid,
        nickname: body.nickname || '微信用户',
        avatarUrl: body.avatarUrl || '',
        phoneEnc: '',
        phoneHash: '',
        passwordHash: '',
        age: null,
        gender: null,
        medicalHistory: '',
        allergyHistory: '',
        realNameEnc: '',
        idNoEnc: '',
        idNoHash: '',
        createdAt: new Date().toISOString(),
      }
      store.users.set(id, user)
      this.assignDoctor(id)
    }
    store.touch()
    return { token: signToken({ sub: user.id, role: 'user' }), user: this.publicUser(user) }
  }

  registerUser(body: any) {
    const phone = String(body.phone || '')
    const password = String(body.password || '')
    if (!isValidPhone(phone)) throw Errors.smsInvalid()
    if (password.length < 6) throw Errors.weakPassword()
    if (!isValidAge(body.age)) throw Errors.ageInvalid()
    if (body.gender !== 'male' && body.gender !== 'female') throw Errors.ageInvalid()
    const hash = hashField(phone)
    if ([...store.users.values()].some((u) => u.phoneHash === hash)) throw Errors.userExists()
    const id = store.seq.user.next()
    const user = {
      id,
      openid: `phone-${hash.slice(0, 12)}`,
      nickname: (body.nickname || '用户').slice(0, 20),
      avatarUrl: '',
      phoneEnc: encryptField(phone),
      phoneHash: hash,
      passwordHash: hashField(password),
      age: Number(body.age),
      gender: body.gender,
      medicalHistory: (body.medicalHistory || '').slice(0, 200),
      allergyHistory: (body.allergyHistory || '').slice(0, 200),
      realNameEnc: encryptField(body.realName || body.nickname || ''),
      idNoEnc: '',
      idNoHash: '',
      createdAt: new Date().toISOString(),
    }
    store.users.set(id, user)
    this.assignDoctor(id)
    if (body.idNo && isValidIdNo(body.idNo)) {
      try {
        this.realname({ sub: id }, { name: body.realName || body.nickname, idNo: body.idNo })
      } catch {
        /* 无匹配报告时仍完成注册 */
      }
    }
    store.auditLog(id, 'user.register', { phone: maskPhone(phone) }, '')
    return { token: signToken({ sub: id, role: 'user' }), user: this.publicUser(store.users.get(id)) }
  }

  loginUser(body: any) {
    const phone = String(body.phone || '')
    const password = String(body.password || '')
    if (!isValidPhone(phone) || password.length < 6) throw Errors.badPassword()
    const user = [...store.users.values()].find((u) => u.phoneHash === hashField(phone))
    if (!user || user.passwordHash !== hashField(password)) throw Errors.badPassword()
    return { token: signToken({ sub: user.id, role: 'user' }), user: this.publicUser(user) }
  }

  registerStaff(body: any) {
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    const role = body.role === 'admin' ? 'admin' : 'doctor'
    if (!username || username.length < 3) throw Errors.weakPassword()
    if (password.length < 6) throw Errors.weakPassword()
    if ([...store.staff.values()].some((s) => s.username === username)) throw Errors.staffExists()
    const id = store.seq.staff.next()
    const staff = {
      id,
      username,
      password,
      name: (body.name || username).slice(0, 20),
      role,
      parentRoleId: null,
    }
    store.staff.set(id, staff)
    if (role === 'doctor') {
      for (const u of store.users.values()) store.doctorPatients.add(`${id}:${u.id}`)
    }
    store.touch()
    store.auditLog(id, 'staff.register', { username, role }, '')
    return { token: signToken({ sub: id, role }), profile: this.publicStaff(staff) }
  }

  staffLogin(body: any) {
    const s = [...store.staff.values()].find((x) => x.username === body.username && x.password === body.password)
    if (!s) throw Errors.badPassword()
    if (body.expectRole && s.role !== body.expectRole) throw Errors.forbidden()
    if (s.status === 'disabled') throw Errors.forbidden()
    return { token: signToken({ sub: s.id, role: s.role }), profile: this.publicStaff(s) }
  }

  me(user: any) {
    if (user.role === 'user') {
      const u = store.users.get(user.sub)
      return { role: 'user', user: this.publicUser(u), doctorId: this.defaultDoctorId() }
    }
    const s = store.staff.get(user.sub)
    return { role: s.role, profile: this.publicStaff(s) }
  }

  publicStaff(s: any) {
    if (!s) return null
    return {
      id: s.id,
      username: s.username,
      name: s.name,
      role: s.role,
      title: s.title || '',
      hospital: s.hospital || '',
      dept: s.dept || '',
      phone: s.phone || '',
      specialties: s.specialties || '',
      notifications: s.notifications || { consult: true, alert: true, followup: true },
      status: s.status || 'active',
    }
  }

  doctorProfile(user: any) {
    return this.publicStaff(store.staff.get(user.sub))
  }

  updateDoctorProfile(user: any, body: any) {
    const s = store.staff.get(user.sub)
    if (!s) throw Errors.forbidden()
    if (body.name) s.name = String(body.name).slice(0, 20)
    if (body.title != null) s.title = String(body.title).slice(0, 20)
    if (body.hospital != null) s.hospital = String(body.hospital).slice(0, 40)
    if (body.dept != null) s.dept = String(body.dept).slice(0, 20)
    if (body.phone != null) s.phone = String(body.phone).slice(0, 20)
    if (body.specialties != null) s.specialties = String(body.specialties).slice(0, 60)
    if (body.notifications) s.notifications = { ...this.publicStaff(s).notifications, ...body.notifications }
    store.touch()
    return this.publicStaff(s)
  }

  listDoctors() {
    return {
      items: [...store.staff.values()]
        .filter((s) => s.role === 'doctor')
        .map((s) => ({
          ...this.publicStaff(s),
          patientCount: [...store.doctorPatients].filter((k) => k.startsWith(`${s.id}:`)).length,
        })),
    }
  }

  createDoctor(body: any) {
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    if (!username || username.length < 3) throw Errors.weakPassword()
    if (password.length < 6) throw Errors.weakPassword()
    if ([...store.staff.values()].some((s) => s.username === username)) throw Errors.staffExists()
    const id = store.seq.staff.next()
    const s = {
      id,
      username,
      password,
      name: (body.name || username).slice(0, 20),
      role: 'doctor' as const,
      parentRoleId: null,
      title: (body.title || '').slice(0, 20),
      hospital: (body.hospital || '').slice(0, 40),
      dept: (body.dept || '').slice(0, 20),
      phone: (body.phone || '').slice(0, 20),
      specialties: (body.specialties || '').slice(0, 60),
      notifications: { consult: true, alert: true, followup: true },
      status: 'active' as const,
    }
    store.staff.set(id, s)
    for (const u of store.users.values()) store.doctorPatients.add(`${id}:${u.id}`)
    store.touch()
    store.auditLog(0, 'doctor.create', { id, username }, '')
    return this.publicStaff(s)
  }

  updateDoctor(body: any) {
    const s = store.staff.get(Number(body.id))
    if (!s || s.role !== 'doctor') throw Errors.forbidden()
    if (body.name != null) s.name = String(body.name).slice(0, 20)
    if (body.title != null) s.title = String(body.title).slice(0, 20)
    if (body.hospital != null) s.hospital = String(body.hospital).slice(0, 40)
    if (body.dept != null) s.dept = String(body.dept).slice(0, 20)
    if (body.phone != null) s.phone = String(body.phone).slice(0, 20)
    if (body.specialties != null) s.specialties = String(body.specialties).slice(0, 60)
    if (body.status === 'active' || body.status === 'disabled') {
      if (s.role !== 'doctor') throw Errors.forbidden()
      s.status = body.status
    }
    store.touch()
    store.auditLog(0, 'doctor.update', { id: s.id }, '')
    return this.publicStaff(s)
  }

  resetDoctorPassword(body: any) {
    const s = store.staff.get(Number(body.id))
    if (!s || s.role !== 'doctor') throw Errors.forbidden()
    const password = String(body.password || '')
    if (password.length < 6) throw Errors.weakPassword()
    s.password = password
    store.touch()
    store.auditLog(0, 'doctor.resetPassword', { id: s.id }, '')
    return { ok: true }
  }

  sendSms(_user: any, phone: string) {
    if (!isValidPhone(phone)) throw Errors.smsInvalid()
    const rec = store.sms.get(phone)
    if (rec?.lockedUntil && rec.lockedUntil > Date.now()) throw Errors.smsLocked()
    const code = String(Math.floor(100000 + Math.random() * 900000))
    store.sms.set(phone, { code, exp: Date.now() + SMS_TTL_SECONDS * 1000, errors: rec?.errors || 0, lockedUntil: 0 })
    return { sent: true, debugCode: process.env.NODE_ENV === 'production' ? undefined : code }
  }

  bindSms(user: any, phone: string, code: string) {
    if (!isValidPhone(phone) || !isValidSmsCode(code)) throw Errors.smsInvalid()
    const rec = store.sms.get(phone)
    if (rec?.lockedUntil && rec.lockedUntil > Date.now()) throw Errors.smsLocked()
    if (!rec || rec.exp < Date.now() || rec.code !== code) {
      const errors = (rec?.errors || 0) + 1
      const lockedUntil = errors >= SMS_MAX_ERRORS ? Date.now() + SMS_LOCK_SECONDS * 1000 : 0
      store.sms.set(phone, { code: rec?.code || '', exp: rec?.exp || 0, errors, lockedUntil })
      if (lockedUntil) throw Errors.smsLocked()
      throw Errors.smsInvalid()
    }
    const hash = hashField(phone)
    if ([...store.users.values()].some((u) => u.phoneHash === hash && u.id !== user.sub)) throw Errors.phoneTaken()
    const u = store.users.get(user.sub)
    u.phoneEnc = encryptField(phone)
    u.phoneHash = hash
    store.sms.delete(phone)
    store.touch()
    return { ok: true }
  }

  updateProfile(user: any, body: any) {
    if (!isValidAge(body.age)) throw Errors.ageInvalid()
    if (body.gender !== 'male' && body.gender !== 'female') throw Errors.ageInvalid()
    const u = store.users.get(user.sub)
    u.age = Number(body.age)
    u.gender = body.gender
    u.nickname = (body.nickname || u.nickname).slice(0, 20)
    u.medicalHistory = (body.medicalHistory || '').slice(0, 200)
    u.allergyHistory = (body.allergyHistory || '').slice(0, 200)
    store.touch()
    return this.publicUser(u)
  }

  realname(user: any, body: any) {
    if (!isValidIdNo(body.idNo)) throw Errors.idInvalid()
    const hash = hashField(body.idNo)
    const u = store.users.get(user.sub)
    u.realNameEnc = encryptField(body.name || '')
    u.idNoEnc = encryptField(body.idNo)
    u.idNoHash = hash
    const matched = [...store.reports.values()].filter((r) => r.idNoHash === hash)
    if (!matched.length) throw Errors.reportNotMatched()
    for (const r of matched) r.userId = u.id
    this.assignDoctor(u.id)
    store.touch()
    return { matched: matched.length }
  }

  listReports(user: any, page = 1) {
    const all = [...store.reports.values()]
      .filter((r) => {
        if (user.role === 'user') return r.userId === user.sub
        if (user.role === 'admin') return true
        if (user.role === 'doctor') return r.userId && store.doctorPatients.has(`${user.sub}:${r.userId}`)
        return false
      })
      .sort((a, b) => b.examDate.localeCompare(a.examDate))
    const start = (page - 1) * REPORT_PAGE_SIZE
    return { total: all.length, page, pageSize: REPORT_PAGE_SIZE, items: all.slice(start, start + REPORT_PAGE_SIZE) }
  }

  getReport(user: any, id: number) {
    const r = store.reports.get(id)
    if (!r) throw Errors.forbidden()
    this.assertReportAccess(user, r)
    const indicators = [...store.indicators.values()].filter((i) => i.reportId === id)
    const grouped: Record<string, any[]> = {}
    for (const i of indicators) {
      grouped[i.department] = grouped[i.department] || []
      grouped[i.department].push({ ...i, arrow: i.status === 'high' ? '↑' : i.status === 'low' ? '↓' : '' })
    }
    return { ...r, grouped, indicators }
  }

  assertReportAccess(user: any, r: any) {
    if (user.role === 'admin') return
    if (user.role === 'user' && r.userId === user.sub) return
    if (user.role === 'doctor' && r.userId && store.doctorPatients.has(`${user.sub}:${r.userId}`)) return
    throw Errors.forbidden()
  }

  async interpret(user: any, id: number) {
    const detail = this.getReport(user, id)
    const prompt = buildSummaryPrompt(detail.indicators)
    try {
      const text = await chatComplete(prompt)
      store.reports.get(id).aiSummary = text
      store.touch()
      return { summary: text, disclaimer: 'AI建议仅供参考，不能替代医生诊断' }
    } catch (e: any) {
      if (e.code === 'LLM_NOT_CONFIGURED') {
        const text = mockSummary(detail.indicators)
        store.reports.get(id).aiSummary = text
        store.touch()
        return { summary: text, disclaimer: 'AI建议仅供参考，不能替代医生诊断', mock: true }
      }
      throw e
    }
  }

  async ask(user: any, id: number, body: any) {
    if (!store.canAsk(user.sub)) throw Errors.askLimit()
    const detail = this.getReport(user, id)
    const ind = detail.indicators.find((i) => i.name === body.indicator)
    if (!ind) throw Errors.forbidden()
    const prompt = buildAskPrompt({
      name: ind.name,
      value: ind.valueText,
      unit: ind.unit,
      range: ind.refRange,
      question: body.question || '',
    })
    store.incAsk(user.sub)
    let answer: string
    let mock = false
    try {
      answer = await chatComplete(prompt)
    } catch (e: any) {
      if (e.code !== 'LLM_NOT_CONFIGURED') throw e
      answer = `${ind.name} 当前为 ${ind.valueText}${ind.unit}（参考 ${ind.refRange}）。可能原因包括生活习惯或一过性波动，请结合医生建议。\n\nAI建议仅供参考，不能替代医生诊断`
      mock = true
    }
    const chat = {
      id: store.aiChats.length + 1,
      userId: user.sub,
      reportId: id,
      indicator: ind.name,
      question: body.question || `${ind.name}这个指标偏高严重吗？`,
      answer,
      disclaimer: 'AI建议仅供参考，不能替代医生诊断',
      createdAt: new Date().toISOString(),
    }
    store.aiChats.push(chat)
    store.touch()
    return { answer, chatId: chat.id, remaining: ASK_DAILY_LIMIT - store.todayAskCount(user.sub), mock }
  }

  listAiChats(user: any, id: number) {
    this.getReport(user, id)
    return {
      items: store.aiChats
        .filter((c) => c.reportId === id && c.userId === user.sub)
        .map((c) => ({ ...c })),
      summary: store.reports.get(id)?.aiSummary || '',
    }
  }

  myRisk(user: any) {
    const u = store.users.get(user.sub)
    const reports = [...store.reports.values()].filter((r) => r.userId === user.sub)
    const latest = reports.sort((a, b) => b.examDate.localeCompare(a.examDate))[0]
    const inds = latest ? [...store.indicators.values()].filter((i) => i.reportId === latest.id) : []
    return { ...assessRisk(u, inds), modelVersion: store.riskModel.version }
  }

  listPatients(user: any, q: any) {
    if (user.role !== 'doctor') throw Errors.forbidden()
    let ids = [...store.doctorPatients].filter((k) => k.startsWith(`${user.sub}:`)).map((k) => Number(k.split(':')[1]))
    let rows = ids.map((id) => store.users.get(id)).filter(Boolean)
    if (q.keyword) {
      rows = rows.filter((u) => decryptField(u.realNameEnc).includes(q.keyword) || decryptField(u.phoneEnc).includes(q.keyword))
    }
    if (q.riskLevel) {
      rows = rows.filter((u) => {
        const r = [...store.reports.values()].filter((x) => x.userId === u.id).sort((a, b) => b.examDate.localeCompare(a.examDate))[0]
        return r?.riskLevel === q.riskLevel
      })
    }
    const mapped = rows.map((u) => {
      const r = [...store.reports.values()].filter((x) => x.userId === u.id).sort((a, b) => b.examDate.localeCompare(a.examDate))[0]
      const openAlerts = [...store.alerts.values()].filter((a) => a.patientId === u.id && a.status === 'open').length
      return {
        id: u.id,
        name: decryptField(u.realNameEnc) || u.nickname,
        phone: decryptField(u.phoneEnc) || maskPhone(''),
        age: u.age,
        gender: u.gender,
        riskLevel: r?.riskLevel || 'low',
        examDate: r?.examDate || '',
        abnormalCount: r?.abnormalCount || 0,
        openAlerts,
        reportId: r?.id || null,
      }
    })
    mapped.sort((a, b) => ({ high: 0, mid: 1, low: 2 }[a.riskLevel] - { high: 0, mid: 1, low: 2 }[b.riskLevel]))
    const page = Number(q.page || 1)
    const start = (page - 1) * PATIENT_PAGE_SIZE
    return { total: mapped.length, page, pageSize: PATIENT_PAGE_SIZE, items: mapped.slice(start, start + PATIENT_PAGE_SIZE) }
  }

  patientRecord(user: any, id: number) {
    if (user.role !== 'doctor' || !store.doctorPatients.has(`${user.sub}:${id}`)) throw Errors.forbidden()
    const u = store.users.get(id)
    const reports = [...store.reports.values()]
      .filter((r) => r.userId === id)
      .sort((a, b) => b.examDate.localeCompare(a.examDate))
      .map((r) => ({
        ...r,
        indicators: [...store.indicators.values()].filter((i) => i.reportId === r.id),
      }))
    const consults = [...store.consultations.values()]
      .filter((c) => c.userId === id && c.doctorId === user.sub)
      .map((c) => ({ ...c, messages: store.messages.filter((m) => m.consultationId === c.id) }))
    const logs = store.healthLogs.filter((x) => x.userId === id)
    const alerts = [...store.alerts.values()].filter((a) => a.patientId === id)
    const followups = [...store.followups.values()].filter((f) => f.patientId === id && f.doctorId === user.sub)
    const prescriptions = store.prescriptions.filter((p) => p.patientId === id && p.doctorId === user.sub)
    return {
      patient: {
        id: u.id,
        name: decryptField(u.realNameEnc) || u.nickname,
        nickname: u.nickname,
        phone: decryptField(u.phoneEnc),
        idNo: decryptField(u.idNoEnc) || '',
        age: u.age,
        gender: u.gender,
        medicalHistory: u.medicalHistory,
        allergyHistory: u.allergyHistory,
      },
      reports,
      consults,
      logs,
      alerts,
      followups,
      prescriptions,
      timeline: [
        ...reports.map((r) => ({ type: 'report', at: r.examDate, title: `${r.orgName} 体检`, extra: `异常 ${r.abnormalCount} 项`, data: r })),
        ...consults.map((c) => ({ type: 'consult', at: c.messages.at(-1)?.createdAt || '', title: '在线咨询', extra: `${c.messages.length} 条消息`, data: c })),
        ...logs.map((l) => ({ type: 'health', at: l.createdAt, title: '健康打卡', extra: l.type === 'bp' ? `血压 ${l.value?.sbp || '-'} mmHg` : l.type, data: l })),
        ...alerts.map((a) => ({ type: 'alert', at: a.handledAt || '', title: `预警 ${a.indicatorName}`, extra: a.status === 'open' ? '未处理' : '已处理', data: a })),
      ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))),
    }
  }

  listAlerts(user: any) {
    const items = [...store.alerts.values()]
      .filter((a) => a.status === 'open')
      .filter((a) => {
        if (user.role === 'admin') return true
        if (user.role === 'doctor') return a.patientId && store.doctorPatients.has(`${user.sub}:${a.patientId}`)
        return false
      })
      .sort((a, b) => (a.level === 'high' ? -1 : 1))
    return {
      items: items.map((a) => {
        const u = a.patientId ? store.users.get(a.patientId) : null
        return {
          ...a,
          patientName: u ? decryptField(u.realNameEnc) || u.nickname : '未匹配',
          patientPhone: u ? decryptField(u.phoneEnc) : '',
        }
      }),
    }
  }

  handleAlert(user: any, id: number, body: any) {
    const a = store.alerts.get(id)
    if (!a) throw Errors.forbidden()
    a.status = 'handled'
    a.handledBy = user.sub
    a.handledAt = new Date().toISOString()
    a.handleMethod = body.method || 'marked'
    store.auditLog(user.sub, 'alert.handle', { id, method: a.handleMethod }, '')
    if (body.followup) {
      const fid = store.seq.fu.next()
      store.followups.set(fid, { id: fid, patientId: a.patientId, doctorId: user.sub, cycle: 'monthly', dueDate: body.dueDate, overdue: false })
    }
    store.touch()
    return { ok: true }
  }

  createConsult(user: any, body: any) {
    const doctorId = Number(body.doctorId || this.defaultDoctorId())
    if (!doctorId) throw Errors.noContract()
    if (!store.doctorPatients.has(`${doctorId}:${user.sub}`)) this.assignDoctor(user.sub)
    if (!store.doctorPatients.has(`${doctorId}:${user.sub}`)) throw Errors.noContract()
    const existing = [...store.consultations.values()].find((c) => c.userId === user.sub && c.doctorId === doctorId && !c.archivedAt)
    if (existing) return { id: existing.id, doctorId }
    const id = store.seq.consult.next()
    store.consultations.set(id, { id, userId: user.sub, doctorId, reportId: body.reportId || null, archivedAt: null })
    store.touch()
    return { id, doctorId }
  }

  listConsults(user: any, doctorId?: number) {
    let items = [...store.consultations.values()]
    if (user.role === 'user') items = items.filter((c) => c.userId === user.sub)
    if (user.role === 'doctor') items = items.filter((c) => c.doctorId === user.sub)
    if (doctorId) items = items.filter((c) => c.doctorId === Number(doctorId))
    const mapped = items.map((c) => {
      const u = store.users.get(c.userId)
      const d = store.staff.get(c.doctorId)
      const messages = store.messages.filter((m) => m.consultationId === c.id)
      const last = messages.at(-1) || null
      return {
        ...c,
        patientName: decryptField(u?.realNameEnc || '') || u?.nickname || `患者${c.userId}`,
        doctorName: d?.name || '签约医生',
        createdAt: messages[0]?.createdAt || '',
        lastMessage: last,
        lastMessageText: last ? (last.content || '').slice(0, 60) : '',
        lastMessageAt: last?.createdAt || '',
        unread: messages.filter((m) => m.senderRole === 'user' && m.status === 'unread').length,
        messages,
      }
    })
    mapped.sort((a, b) => String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')))
    return { items: mapped }
  }

  postMessage(user: any, id: number, body: any) {
    const c = store.consultations.get(id)
    if (!c) throw Errors.forbidden()
    if (c.archivedAt) throw Errors.forbidden()
    if (user.role === 'user' && c.userId !== user.sub) throw Errors.forbidden()
    if (user.role === 'doctor' && c.doctorId !== user.sub) throw Errors.forbidden()
    if (user.role === 'doctor') {
      for (const m of store.messages) {
        if (m.consultationId === id && m.senderRole === 'user') m.status = 'read'
      }
    }
    const images = store.messages.filter((m) => m.consultationId === id && m.type === 'image' && m.senderRole === user.role)
    if (body.type === 'image') {
      if (images.length >= CONSULT_MAX_IMAGES) throw Errors.fileLimit()
      if (body.size && body.size > CONSULT_MAX_IMAGE_BYTES) throw Errors.fileLimit()
    }
    if (body.type === 'audio' && body.duration > CONSULT_MAX_AUDIO_SECONDS) throw Errors.fileLimit()
    const msg = {
      id: store.seq.msg.next(),
      consultationId: id,
      senderRole: user.role,
      type: body.type || 'text',
      content: body.content || body.fileUrl || '',
      status: 'unread' as const,
      createdAt: new Date().toISOString(),
    }
    store.messages.push(msg)
    store.touch()
    return msg
  }

  sendPrescription(user: any, body: any) {
    const name = decryptField(store.users.get(body.patientId)?.realNameEnc || '') || '患者'
    const text = String(body.template || '').replaceAll('{患者姓名}', name)
    this.prescriptionsPush(user, body.patientId, text)
    const consult = [...store.consultations.values()].find((c) => c.userId === Number(body.patientId) && c.doctorId === user.sub && !c.archivedAt)
    if (consult) this.postMessage(user, consult.id, { type: 'text', content: `【健康处方】${text}` })
    return { text }
  }

  overview() {
    const alerts = [...store.alerts.values()]
    const recentImports = store.importBatches.slice(-5).reverse()
    return {
      users: store.users.size,
      reports: store.reports.size,
      staff: store.staff.size,
      consults: store.consultations.size,
      messages: store.messages.length,
      alertsOpen: alerts.filter((a) => a.status === 'open').length,
      alertsHandled: alerts.filter((a) => a.status === 'handled').length,
      imports: store.importBatches.length,
      followups: store.followups.size,
      packages: store.packages.size,
      appointments: store.appointments.size,
      recentImports,
    }
  }

  indicatorCatalog() {
    return { items: store.indicatorCatalog }
  }

  resolvePackageItems(items: any[]) {
    const byCode = new Map(store.indicatorCatalog.map((c) => [c.code, c]))
    return (items || [])
      .map((it: any) => {
        if (typeof it === 'string') return { code: it, name: it, dept: '', desc: '' }
        const meta = byCode.get(it.code)
        return meta ? { ...meta } : { code: it.code, name: it.name || it.code, dept: it.dept || '', desc: '' }
      })
      .filter(Boolean)
  }

  publicPackages() {
    return {
      items: [...store.packages.values()]
        .filter((p) => p.status === 'on')
        .map((p) => ({ ...p, items: this.resolvePackageItems(p.items) })),
    }
  }

  packageDetail(id: number) {
    const p = store.packages.get(id)
    if (!p || p.status !== 'on') throw Errors.packageUnavailable()
    return { ...p, items: this.resolvePackageItems(p.items) }
  }

  apptCapacity() {
    const n = Number(store.appointmentSettings?.slotCapacity)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : APPT_SLOT_CAPACITY
  }

  apptSlots(): string[] {
    const s = store.appointmentSettings?.slots
    return Array.isArray(s) && s.length ? s : APPT_SLOTS
  }

  isClosedDate(date: string) {
    return (store.appointmentSettings?.closedDates || []).includes(date)
  }

  usedSeats(date: string, slot: string) {
    return [...store.appointments.values()].filter((a) => a.date === date && a.slot === slot && a.status !== 'cancelled').length
  }

  appointments(user: any, body: any) {
    const pkg = store.packages.get(Number(body.packageId))
    if (!pkg || pkg.status !== 'on') throw Errors.packageUnavailable()
    const date = String(body.date || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Errors.apptDateInvalid()
    if (this.isClosedDate(date)) throw Errors.apptClosed()
    const slot = String(body.slot || '')
    if (!this.apptSlots().includes(slot)) throw Errors.apptDateInvalid()
    if (this.usedSeats(date, slot) >= this.apptCapacity()) throw Errors.apptFull()
    const id = store.seq.appt.next()
    const row = {
      id,
      userId: user.sub,
      packageId: pkg.id,
      packageName: pkg.name,
      price: pkg.price,
      date,
      slot,
      status: 'booked',
      contactPhone: decryptField(store.users.get(user.sub)?.phoneEnc || ''),
      createdAt: new Date().toISOString(),
    }
    store.appointments.set(id, row)
    store.touch()
    store.auditLog(user.sub, 'appointment.create', { id, packageId: pkg.id, date, slot }, '')
    return row
  }

  listAppointments(user: any) {
    let items = [...store.appointments.values()]
    if (user.role === 'user') items = items.filter((a) => a.userId === user.sub)
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    return {
      items: items.map((a) => {
        const u = store.users.get(a.userId)
        return { ...a, patientName: u ? (decryptField(u.realNameEnc) || u.nickname) : `用户${a.userId}` }
      }),
    }
  }

  cancelAppointment(user: any, id: number) {
    const a = store.appointments.get(id)
    if (!a) throw Errors.forbidden()
    if (user.role === 'user' && a.userId !== user.sub) throw Errors.forbidden()
    a.status = 'cancelled'
    a.cancelledAt = new Date().toISOString()
    store.touch()
    return a
  }

  slotAvailability(date: string) {
    const capacity = this.apptCapacity()
    const closed = this.isClosedDate(date)
    const items = this.apptSlots().map((slot) => {
      const used = this.usedSeats(date, slot)
      return { slot, capacity, used, remaining: Math.max(0, capacity - used), full: used >= capacity }
    })
    return {
      date,
      capacity,
      closed,
      totalRemaining: closed ? 0 : items.reduce((sum, it) => sum + it.remaining, 0),
      slotsPerDay: items.length,
      items,
    }
  }

  apptSettings() {
    return { ...store.appointmentSettings, capacity: this.apptCapacity(), slots: this.apptSlots() }
  }

  saveApptSettings(body: any) {
    const cur = store.appointmentSettings
    const next = { ...cur }
    if (body.slotCapacity != null) {
      const n = Number(body.slotCapacity)
      if (!Number.isFinite(n) || n < 1 || n > 200) throw Errors.apptSettingsInvalid()
      next.slotCapacity = Math.floor(n)
    }
    if (Array.isArray(body.slots) && body.slots.length) {
      const slots = body.slots.map((s: any) => String(s).trim()).filter(Boolean)
      if (!slots.length) throw Errors.apptSettingsInvalid()
      next.slots = slots
    }
    if (Array.isArray(body.closedDates)) {
      next.closedDates = body.closedDates.map((d: any) => String(d)).filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    }
    store.appointmentSettings = next
    store.touch()
    store.auditLog(0, 'appointment.settings', { slotCapacity: next.slotCapacity, slots: next.slots.length, closedDates: next.closedDates.length }, '')
    return this.apptSettings()
  }

  doctorOverview(user: any) {
    const ids = [...store.doctorPatients].filter((k) => k.startsWith(`${user.sub}:`)).map((k) => Number(k.split(':')[1]))
    const alerts = [...store.alerts.values()].filter((a) => a.patientId && ids.includes(a.patientId))
    const consults = [...store.consultations.values()].filter((c) => c.doctorId === user.sub)
    const fus = [...store.followups.values()].filter((f) => f.doctorId === user.sub)
    return {
      patients: ids.length,
      alertsOpen: alerts.filter((a) => a.status === 'open').length,
      consults: consults.length,
      unread: store.messages.filter((m) => consults.some((c) => c.id === m.consultationId) && m.senderRole === 'user' && m.status === 'unread').length,
      followups: fus.length,
      overdue: fus.filter((f) => f.overdue && !f.archivedAt).length,
      edu: store.eduPosts.filter((p) => p.doctorId === user.sub).length,
    }
  }

  listEdu(user: any) {
    if (user.role === 'doctor') return { items: store.eduPosts.filter((p) => p.doctorId === user.sub) }
    return { items: store.eduPosts }
  }

  prescriptionsPush(user: any, patientId: number, text: string) {
    store.prescriptions.push({ doctorId: user.sub, patientId, text, at: new Date().toISOString() })
    store.touch()
  }

  addHealthLog(user: any, body: any) {
    const sbp = body.type === 'bp' ? Number(body.sbp || body.value) : 0
    const abnormal = body.type === 'bp' && sbp > BP_CRITICAL_SBP
    const row = { id: store.healthLogs.length + 1, userId: user.sub, type: body.type, value: body, abnormal, createdAt: new Date().toISOString() }
    store.healthLogs.push(row)
    store.touch()
    return { ...row, hint: abnormal ? '血压偏高，请及时就医' : '' }
  }

  listHealthLogs(user: any, userId?: number) {
    const uid = user.role === 'user' ? user.sub : Number(userId || 0)
    if (user.role === 'doctor' && !store.doctorPatients.has(`${user.sub}:${uid}`)) throw Errors.forbidden()
    return { items: store.healthLogs.filter((x) => x.userId === uid) }
  }

  addReminder(user: any, body: any) {
    const isDoctor = user.role === 'doctor'
    const patientId = isDoctor ? Number(body.patientId || 0) : user.sub
    if (!patientId || !store.users.has(patientId)) throw Errors.forbidden()
    if (isDoctor && !store.doctorPatients.has(`${user.sub}:${patientId}`)) throw Errors.forbidden()
    const doctorId = isDoctor ? user.sub : this.defaultDoctorId()
    const doctorName = doctorId ? store.staff.get(doctorId)?.name || '签约医生' : '签约医生'
    const row = {
      id: store.seq.reminder.next(),
      userId: patientId,
      doctorId,
      doctorName,
      title: (body.title || body.content || '复查提醒').slice(0, 40),
      dueDate: String(body.dueDate || body.nextFireAt || '').slice(0, 10),
      type: body.type || 'recheck',
      status: 'pending',
      doneAt: null,
      note: '',
      createdAt: new Date().toISOString(),
    }
    store.reminders.push(row)
    store.touch()
    if (isDoctor) store.auditLog(user.sub, 'reminder.create', { id: row.id, patientId, title: row.title }, '')
    return row
  }

  listReminders(user: any) {
    let items = store.reminders
    if (user.role === 'user') items = items.filter((r) => r.userId === user.sub)
    else if (user.role === 'doctor') items = items.filter((r) => r.doctorId === user.sub)
    return {
      items: items
        .slice()
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
        .map((r) => {
          const u = store.users.get(r.userId)
          return { ...r, patientName: u ? decryptField(u.realNameEnc) || u.nickname : `用户${r.userId}` }
        }),
    }
  }

  doneReminder(user: any, id: number, body: any) {
    const r = store.reminders.find((x) => x.id === id)
    if (!r) throw Errors.forbidden()
    if (user.role === 'user' && r.userId !== user.sub) throw Errors.forbidden()
    r.status = 'done'
    r.doneAt = new Date().toISOString()
    r.note = (body?.note || '已完成复查').slice(0, 100)
    store.touch()
    return r
  }

  importExcel(user: any, rows: any[]) {
    const required = ['姓名', '身份证号', '体检日期', '体检机构', '指标名称', '检测值', '单位', '参考范围']
    const failed = []
    const ok = []
    rows.forEach((row, idx) => {
      const line = idx + 2
      const miss = required.filter((k) => !row[k] && !row[this.enKey(k)])
      if (miss.length) {
        failed.push({ row: line, error: `缺必填：${miss.join(',')}` })
        return
      }
      const mapped = this.normalizeImport(row)
      if (!isValidIdNo(mapped.idNo)) {
        failed.push({ row: line, error: '身份证号格式错误' })
        return
      }
      ok.push(mapped)
    })
    const groups = new Map<string, typeof ok>()
    for (const r of ok) {
      const key = `${hashField(r.idNo)}|${r.examDate}|${r.orgName}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(r)
    }
    const created = []
    for (const [, list] of groups) {
      const first = list[0]
      const reportId = store.seq.report.next()
      let abnormal = 0
      for (const it of list) {
        const status = resolveIndicatorStatus(it.value, it.range)
        if (status !== 'normal') abnormal += 1
        const iid = store.seq.ind.next()
        store.indicators.set(iid, {
          id: iid,
          reportId,
          name: it.indicator,
          valueText: String(it.value),
          unit: it.unit,
          refRange: it.range,
          status,
          department: it.department || '其他',
        })
        const hit = this.matchAlert(it.indicator, it.value)
        if (hit) {
          const aid = store.seq.alert.next()
          const userMatched = [...store.users.values()].find((u) => u.idNoHash === hashField(first.idNo))
          store.alerts.set(aid, {
            id: aid,
            reportId,
            patientId: userMatched?.id || null,
            level: hit.level,
            status: 'open',
            handledBy: null,
            handledAt: null,
            handleMethod: '',
            indicatorName: it.indicator,
          })
        }
      }
      const userMatched = [...store.users.values()].find((u) => u.idNoHash === hashField(first.idNo))
      if (userMatched) this.assignDoctor(userMatched.id)
      store.reports.set(reportId, {
        id: reportId,
        userId: userMatched?.id || null,
        examDate: first.examDate,
        orgName: first.orgName,
        riskLevel: reportRiskLevel(abnormal),
        abnormalCount: abnormal,
        pdfKey: '',
        thumbKey: '',
        source: 'excel',
        aiSummary: '',
        idNoHash: hashField(first.idNo),
      })
      created.push(reportId)
    }
    store.importBatches.push({ at: new Date().toISOString(), ok: ok.length, failed, created })
    store.auditLog(user.sub, 'import', { ok: ok.length, failed: failed.length }, '')
    store.touch()
    return { successRows: ok.length, failed, createdReports: created }
  }

  enKey(k: string) {
    return ({
      姓名: 'name',
      身份证号: 'idNo',
      体检日期: 'examDate',
      体检机构: 'orgName',
      指标名称: 'indicator',
      检测值: 'value',
      单位: 'unit',
      参考范围: 'refRange',
    } as any)[k]
  }

  normalizeImport(row: any) {
    return {
      name: row['姓名'] || row.name,
      idNo: String(row['身份证号'] || row.idNo),
      examDate: String(row['体检日期'] || row.examDate),
      orgName: row['体检机构'] || row.orgName,
      indicator: row['指标名称'] || row.indicator,
      value: row['检测值'] || row.value,
      unit: row['单位'] || row.unit,
      range: row['参考范围'] || row.refRange,
      department: row['科室'] || row.department || '其他',
    }
  }

  matchAlert(name: string, value: any) {
    const map: Record<string, string> = { 血糖: 'glucose', 收缩压: 'sbp', 舒张压: 'dbp', 谷丙转氨酶: 'alt', 总胆固醇: 'tc' }
    const code = map[name]
    if (!code) return null
    return evaluateAlert(code, value, store.alertRules)
  }

  fhirIngest(body: any) {
    const source = body.sourceSystem || 'default'
    const msgId = body.messageId || body.id
    if (msgId && store.fhirSeen.has(msgId)) return { duplicated: true, resumeToken: store.fhirCursors.get(source)?.resumeToken }
    if (msgId) store.fhirSeen.add(msgId)
    const token = body.resumeToken || msgId || `${Date.now()}`
    store.fhirCursors.set(source, { resumeToken: token, lastSuccessAt: new Date().toISOString() })
    if (body.rows?.length) this.importExcel({ sub: 0 }, body.rows)
    return { ok: true, resumeToken: token }
  }

  stats(q: any) {
    const reports = [...store.reports.values()].filter((r) => {
      if (q.org && r.orgName !== q.org) return false
      if (q.from && r.examDate < q.from) return false
      if (q.to && r.examDate > q.to) return false
      return true
    })
    const inds = [...store.indicators.values()].filter((i) => reports.some((r) => r.id === i.reportId))
    const abnormal = inds.filter((i) => i.status !== 'normal').length
    return {
      reportCount: reports.length,
      indicatorCount: inds.length,
      abnormalRate: inds.length ? abnormal / inds.length : 0,
      detectRate: reports.filter((r) => r.abnormalCount > 0).length / (reports.length || 1),
      byName: this.groupRate(inds),
    }
  }

  groupRate(inds: any[]) {
    const m: Record<string, { total: number; abnormal: number }> = {}
    for (const i of inds) {
      m[i.name] = m[i.name] || { total: 0, abnormal: 0 }
      m[i.name].total += 1
      if (i.status !== 'normal') m[i.name].abnormal += 1
    }
    return Object.entries(m).map(([name, v]) => ({ name, rate: v.abnormal / v.total }))
  }

  packages(action: string, body: any) {
    const decorate = (p: any) => ({ ...p, items: this.resolvePackageItems(p.items), bookedCount: [...store.appointments.values()].filter((a) => a.packageId === p.id && a.status !== 'cancelled').length })
    if (action === 'list') {
      const list = [...store.packages.values()].filter((p) => (body.visibleOnly ? p.status === 'on' : true))
      return { items: list.map(decorate) }
    }
    if (action === 'create') {
      const id = store.seq.pkg.next()
      const row = {
        id,
        name: body.name,
        price: Number(body.price) || 0,
        crowd: body.crowd || '',
        dept: body.dept || '',
        duration: body.duration || '',
        desc: body.desc || '',
        tags: body.tags || [],
        notice: body.notice || [],
        items: body.items || [],
        status: body.status || 'on',
      }
      store.packages.set(id, row)
      store.touch()
      return decorate(row)
    }
    if (action === 'update') {
      const p = store.packages.get(body.id)
      if (!p) throw Errors.forbidden()
      Object.assign(p, {
        name: body.name ?? p.name,
        price: body.price != null ? Number(body.price) : p.price,
        crowd: body.crowd ?? p.crowd,
        dept: body.dept ?? p.dept,
        duration: body.duration ?? p.duration,
        desc: body.desc ?? p.desc,
        tags: body.tags ?? p.tags,
        notice: body.notice ?? p.notice,
        items: body.items ?? p.items,
        status: body.status ?? p.status,
      })
      store.touch()
      return decorate(p)
    }
    if (action === 'delete') {
      store.packages.delete(body.id)
      store.touch()
      return { ok: true }
    }
    return { items: [...store.packages.values()].map(decorate) }
  }

  adminAppointments() {
    return this.listAppointments({ role: 'admin' })
  }

  adminUsers(q: any = {}) {
    const packageName = q.package ? String(q.package) : ''
    return {
      items: [...store.users.values()]
        .map((u) => {
          const reports = [...store.reports.values()]
            .filter((r) => r.userId === u.id)
            .sort((a, b) => String(b.examDate).localeCompare(String(a.examDate)))
          const latest = reports[0]
          const appt = [...store.appointments.values()]
            .filter((a) => a.userId === u.id)
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
          return {
            id: u.id,
            name: decryptField(u.realNameEnc) || u.nickname,
            nickname: u.nickname,
            phone: maskPhone(decryptField(u.phoneEnc)),
            age: u.age,
            gender: u.gender,
            hasRealname: !!u.idNoHash,
            reportCount: reports.length,
            lastExamDate: latest?.examDate || '',
            riskLevel: latest?.riskLevel || '',
            packageName: appt?.packageName || '',
            createdAt: u.createdAt,
          }
        })
        .filter((u) => {
          if (q.name && !String(u.name).includes(String(q.name)) && !String(u.nickname).includes(String(q.name))) return false
          if (q.date && u.lastExamDate !== String(q.date)) return false
          if (packageName && u.packageName !== packageName) return false
          return true
        }),
    }
  }

  publicUser(u: any) {
    if (!u) return null
    const doctorId = this.defaultDoctorId()
    const contracted = doctorId ? store.doctorPatients.has(`${doctorId}:${u.id}`) : false
    return {
      id: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      age: u.age,
      gender: u.gender,
      hasPhone: !!u.phoneHash,
      hasRealname: !!u.idNoHash,
      medicalHistory: u.medicalHistory || '',
      allergyHistory: u.allergyHistory || '',
      realName: decryptField(u.realNameEnc) || '',
      idNo: (() => {
        const id = decryptField(u.idNoEnc)
        return id ? id.replace(/^(.{6}).*(.{4})$/, '$1********$2') : ''
      })(),
      phone: maskPhone(decryptField(u.phoneEnc)),
      contracted,
      doctorId,
    }
  }
}

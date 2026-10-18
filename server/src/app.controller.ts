import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request, Response } from 'express'
import * as XLSX from 'xlsx'
import { AppService } from './app.service.js'
import { BizError, Errors } from './common/http-error.js'
import { verifyToken } from './common/jwt.js'
import { decryptField } from './common/crypto.js'
import { store } from './store.js'

function auth(req: Request, roles?: string[]) {
  const h = String(req.headers.authorization || '')
  const token = h.startsWith('Bearer ') ? h.slice(7) : String((req.query as any).token || '')
  const payload = verifyToken(token)
  if (!payload) throw Errors.unauthorized()
  if (roles && !roles.includes(payload.role)) throw Errors.forbidden()
  return payload
}

@Controller()
export class AppController {
  private readonly app = new AppService()

  @Get('health')
  health() {
    return this.app.health()
  }

  @Post('auth/wechat')
  wechat(@Body() body: any) {
    return this.app.wechatLogin(body)
  }

  @Post('auth/register')
  registerUser(@Body() body: any) {
    return this.app.registerUser(body)
  }

  @Post('auth/login')
  loginUser(@Body() body: any) {
    return this.app.loginUser(body)
  }

  @Post('auth/staff/register')
  registerStaff(@Body() body: any) {
    return this.app.registerStaff(body)
  }

  @Post('auth/staff')
  staff(@Body() body: any) {
    return this.app.staffLogin(body)
  }

  @Get('auth/me')
  me(@Req() req: Request) {
    return this.app.me(auth(req))
  }

  @Get('doctor/profile')
  doctorProfile(@Req() req: Request) {
    return this.app.doctorProfile(auth(req, ['doctor']))
  }

  @Put('doctor/profile')
  updateDoctorProfile(@Req() req: Request, @Body() body: any) {
    return this.app.updateDoctorProfile(auth(req, ['doctor']), body)
  }

  @Post('auth/sms/send')
  sendSms(@Req() req: Request, @Body() body: any) {
    return this.app.sendSms(null, body.phone)
  }

  @Post('auth/sms/bind')
  bindSms(@Req() req: Request, @Body() body: any) {
    return this.app.bindSms(auth(req, ['user']), body.phone, body.code)
  }

  @Put('users/me/profile')
  profile(@Req() req: Request, @Body() body: any) {
    return this.app.updateProfile(auth(req, ['user']), body)
  }

  @Post('users/me/realname')
  realname(@Req() req: Request, @Body() body: any) {
    return this.app.realname(auth(req, ['user']), body)
  }

  @Get('reports')
  reports(@Req() req: Request, @Query('page') page?: string) {
    return this.app.listReports(auth(req, ['user', 'doctor', 'admin']), Number(page || 1))
  }

  @Get('reports/:id')
  report(@Req() req: Request, @Param('id') id: string) {
    return this.app.getReport(auth(req, ['user', 'doctor', 'admin']), Number(id))
  }

  @Get('reports/:id/pdf')
  pdf(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const detail = this.app.getReport(auth(req, ['user', 'doctor']), Number(id))
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`)
    const text = `Report ${detail.id} ${detail.examDate} ${detail.orgName}`
    res.send(Buffer.from(text))
  }

  @Post('reports/:id/interpret')
  interpret(@Req() req: Request, @Param('id') id: string) {
    return this.app.interpret(auth(req, ['user']), Number(id))
  }

  @Post('reports/:id/ask')
  ask(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.app.ask(auth(req, ['user']), Number(id), body)
  }

  @Get('reports/:id/chats')
  aiChats(@Req() req: Request, @Param('id') id: string) {
    return this.app.listAiChats(auth(req, ['user']), Number(id))
  }

  @Get('risk/me')
  risk(@Req() req: Request) {
    return this.app.myRisk(auth(req, ['user']))
  }

  @Get('doctor/overview')
  doctorOverview(@Req() req: Request) {
    return this.app.doctorOverview(auth(req, ['doctor']))
  }

  @Get('doctor/patients')
  patients(@Req() req: Request, @Query() q: any) {
    return this.app.listPatients(auth(req, ['doctor']), q)
  }

  @Get('doctor/patients/:id/record')
  record(@Req() req: Request, @Param('id') id: string) {
    return this.app.patientRecord(auth(req, ['doctor']), Number(id))
  }

  @Post('doctor/groups')
  groups(@Req() req: Request, @Body() body: any) {
    const u = auth(req, ['doctor'])
    const id = store.seq.group.next()
    store.groups.set(id, { id, doctorId: u.sub, name: body.name, memberIds: body.memberIds || [] })
    store.touch()
    return store.groups.get(id)
  }

  @Get('alerts')
  alerts(@Req() req: Request) {
    return this.app.listAlerts(auth(req, ['doctor', 'admin']))
  }

  @Post('alerts/:id/handle')
  handleAlert(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.app.handleAlert(auth(req, ['doctor']), Number(id), body)
  }

  @Post('consultations')
  createConsult(@Req() req: Request, @Body() body: any) {
    return this.app.createConsult(auth(req, ['user']), body)
  }

  @Get('consultations')
  listConsult(@Req() req: Request, @Query('doctorId') doctorId?: string) {
    return this.app.listConsults(auth(req, ['user', 'doctor']), doctorId ? Number(doctorId) : undefined)
  }

  @Post('consultations/:id/messages')
  msg(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.app.postMessage(auth(req, ['user', 'doctor']), Number(id), body)
  }

  @Post('prescriptions')
  rx(@Req() req: Request, @Body() body: any) {
    return this.app.sendPrescription(auth(req, ['doctor']), body)
  }

  @Get('health-logs')
  logs(@Req() req: Request, @Query('userId') userId?: string) {
    return this.app.listHealthLogs(auth(req, ['user', 'doctor']), userId ? Number(userId) : undefined)
  }

  @Post('health-logs')
  addLog(@Req() req: Request, @Body() body: any) {
    return this.app.addHealthLog(auth(req, ['user']), body)
  }

  @Post('reminders')
  reminder(@Req() req: Request, @Body() body: any) {
    return this.app.addReminder(auth(req, ['user', 'doctor']), body)
  }

  @Get('reminders')
  reminders(@Req() req: Request) {
    return this.app.listReminders(auth(req, ['user', 'doctor']))
  }

  @Post('reminders/:id/done')
  doneReminder(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.app.doneReminder(auth(req, ['user', 'doctor']), Number(id), body)
  }

  @Post('followups')
  followup(@Req() req: Request, @Body() body: any) {
    const u = auth(req, ['doctor'])
    const ids = body.patientIds || [body.patientId]
    const created = ids.map((pid: number) => {
      const id = store.seq.fu.next()
      const row = {
        id,
        patientId: pid,
        doctorId: u.sub,
        cycle: body.cycle || 'monthly',
        method: body.method || 'phone',
        content: body.content || '',
        dueDate: body.dueDate,
        overdue: body.dueDate ? new Date(body.dueDate) < new Date() : false,
      }
      store.followups.set(id, row)
      return row
    })
    store.touch()
    return { items: created }
  }

  @Get('followups')
  listFu(@Req() req: Request) {
    const u = auth(req, ['doctor'])
    return {
      items: [...store.followups.values()]
        .filter((f) => f.doctorId === u.sub)
        .map((f) => {
          const p = store.users.get(f.patientId)
          const name = p ? (decryptField(p.realNameEnc) || p.nickname || `患者${p.id}`) : `患者${f.patientId}`
          return { ...f, patientName: name }
        }),
    }
  }

  @Get('admin/overview')
  overview(@Req() req: Request) {
    auth(req, ['admin'])
    return this.app.overview()
  }

  @Post('followups/:id/result')
  fuResult(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    auth(req, ['doctor'])
    const f = store.followups.get(Number(id))
    if (!f) throw Errors.forbidden()
    f.result = body
    f.archivedAt = new Date().toISOString()
    store.touch()
    return f
  }

  @Get('edu')
  listEdu(@Req() req: Request) {
    return this.app.listEdu(auth(req, ['doctor', 'user', 'admin']))
  }

  @Post('edu')
  edu(@Req() req: Request, @Body() body: any) {
    const u = auth(req, ['doctor'])
    const id = store.seq.edu.next()
    const row = { id, doctorId: u.sub, title: body.title, content: body.content, group: body.group || '全部签约患者', reads: 0, likes: 0, comments: 0, createdAt: new Date().toISOString() }
    store.eduPosts.push(row)
    store.touch()
    return row
  }

  @Post('edu/:id/read')
  eduRead(@Req() req: Request, @Param('id') id: string) {
    auth(req, ['user', 'doctor'])
    const row = store.eduPosts.find((x) => x.id === Number(id))
    if (row) {
      row.reads += 1
      store.touch()
    }
    return row || {}
  }

  @Get('edu/:id/stats')
  eduStats(@Req() req: Request, @Param('id') id: string) {
    auth(req, ['doctor'])
    return store.eduPosts.find((x) => x.id === Number(id)) || {}
  }

  @Get('admin/imports/template')
  template(@Req() req: Request, @Res() res: Response) {
    auth(req, ['admin'])
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['姓名', '身份证号', '体检日期', '体检机构', '指标名称', '检测值', '单位', '参考范围']])
    XLSX.utils.book_append_sheet(wb, ws, 'template')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(buf)
  }

  @Post('admin/imports')
  @UseInterceptors(FileInterceptor('file'))
  imports(@Req() req: Request, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const u = auth(req, ['admin'])
    let rows = body.rows
    if (file) {
      const wb = XLSX.read(file.buffer, { type: 'buffer' })
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    }
    return this.app.importExcel(u, rows || [])
  }

  @Post('admin/fhir/ingest')
  fhir(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.fhirIngest(body)
  }

  @Get('admin/packages')
  listPkg(@Req() req: Request) {
    auth(req, ['admin'])
    return this.app.packages('list', {})
  }

  @Post('admin/packages')
  savePkg(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.packages(body.id ? 'update' : 'create', body)
  }

  @Get('packages')
  publicPkg() {
    return this.app.publicPackages()
  }

  @Get('packages/:id')
  pkgDetail(@Param('id') id: string) {
    return this.app.packageDetail(Number(id))
  }

  @Get('indicator-catalog')
  catalog(@Req() req: Request) {
    auth(req, ['user', 'doctor', 'admin'])
    return this.app.indicatorCatalog()
  }

  @Post('admin/packages/delete')
  deletePkg(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.packages('delete', body)
  }

  @Get('admin/appointments')
  adminAppointments(@Req() req: Request) {
    auth(req, ['admin'])
    return this.app.adminAppointments()
  }

  @Get('appointments/availability')
  availability(@Req() req: Request, @Query('date') date: string) {
    auth(req, ['user'])
    return this.app.slotAvailability(date)
  }

  @Get('admin/settings/appointments')
  apptSettings(@Req() req: Request) {
    auth(req, ['admin'])
    return this.app.apptSettings()
  }

  @Put('admin/settings/appointments')
  saveApptSettings(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.saveApptSettings(body)
  }

  @Get('appointments')
  appointments(@Req() req: Request) {
    return this.app.listAppointments(auth(req, ['user', 'doctor']))
  }

  @Post('appointments')
  createAppointment(@Req() req: Request, @Body() body: any) {
    return this.app.appointments(auth(req, ['user']), body)
  }

  @Post('appointments/:id/cancel')
  cancelAppointment(@Req() req: Request, @Param('id') id: string) {
    return this.app.cancelAppointment(auth(req, ['user']), Number(id))
  }

  @Get('admin/stats')
  stats(@Req() req: Request, @Query() q: any) {
    auth(req, ['admin'])
    return this.app.stats(q)
  }

  @Post('admin/stats/whitepaper')
  paper(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return { ...this.app.stats(body), charts: ['bar', 'pie'] }
  }

  @Post('admin/stats/export')
  exportStats(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    auth(req, ['admin'])
    const data = this.app.stats(body)
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(data, null, 2))
  }

  @Get('admin/users')
  users(@Req() req: Request, @Query() q: any) {
    auth(req, ['admin'])
    return this.app.adminUsers(q)
  }

  @Get('admin/users/export')
  exportUsers(@Req() req: Request, @Res() res: Response, @Query() q: any) {
    auth(req, ['admin'])
    const users = this.app.adminUsers(q).items
    const header = 'id,name,nickname,phone,age,gender,hasRealname,reportCount,lastExamDate,riskLevel,packageName,createdAt'
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = users.map((u) =>
      [u.id, u.name, u.nickname, u.phone, u.age, u.gender, u.hasRealname, u.reportCount, u.lastExamDate, u.riskLevel, u.packageName, u.createdAt].map(esc).join(','),
    )
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv')
    res.send('\ufeff' + [header, ...rows].join('\n'))
  }

  @Get('admin/doctors')
  doctors(@Req() req: Request) {
    auth(req, ['admin'])
    return this.app.listDoctors()
  }

  @Post('admin/doctors')
  createDoctor(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.createDoctor(body)
  }

  @Put('admin/doctors')
  updateDoctor(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.updateDoctor(body)
  }

  @Post('admin/doctors/reset-password')
  resetDoctorPassword(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    return this.app.resetDoctorPassword(body)
  }

  @Post('admin/push')
  push(@Req() req: Request, @Body() body: any) {
    const u = auth(req, ['admin'])
    store.auditLog(u.sub, 'push', body, '')
    return { queued: (body.userIds || []).length, channel: 'wechat-subscribe' }
  }

  @Get('admin/roles')
  roles(@Req() req: Request) {
    auth(req, ['admin'])
    return { items: [...store.roles.values()] }
  }

  @Post('admin/roles')
  saveRole(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    const id = body.id || store.seq.role.next()
    store.roles.set(id, { id, name: body.name, parentRoleId: body.parentRoleId || null, permissions: body.permissions || [] })
    store.touch()
    return store.roles.get(id)
  }

  @Get('admin/audit-logs')
  logsAdmin(@Req() req: Request) {
    auth(req, ['admin'])
    const sixMonths = Date.now() - 180 * 24 * 3600 * 1000
    return { items: store.audit.filter((a) => new Date(a.createdAt).getTime() >= sixMonths) }
  }

  @Put('admin/settings/alert-rules')
  alertRules(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    if (Array.isArray(body.rules)) store.alertRules = body.rules
    store.touch()
    return { rules: store.alertRules }
  }

  @Get('admin/settings/alert-rules')
  getAlertRules(@Req() req: Request) {
    auth(req, ['admin'])
    return { rules: store.alertRules }
  }

  @Get('admin/settings/risk-model')
  getRiskModel(@Req() req: Request) {
    auth(req, ['admin'])
    return store.riskModel
  }

  @Put('admin/settings/risk-model')
  riskModel(@Req() req: Request, @Body() body: any) {
    auth(req, ['admin'])
    store.riskModel = { ...store.riskModel, ...body }
    store.touch()
    return store.riskModel
  }
}

export function errorMiddleware(err: any, _req: any, res: any, _next: any) {
  if (err instanceof BizError) {
    res.status(err.status).json({ code: err.code, message: err.message })
    return
  }
  res.status(500).json({ code: 'INTERNAL', message: err?.message || 'error' })
}

import { AGE_MAX, AGE_MIN, HISTORY_MAX, NICKNAME_MAX } from './enums.js'

export function isValidPhone(phone) {
  return typeof phone === 'string' && /^1\d{10}$/.test(phone)
}

export function isValidSmsCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code)
}

export function isValidAge(age) {
  const n = Number(age)
  return Number.isInteger(n) && n >= AGE_MIN && n <= AGE_MAX
}

export function isValidNickname(nickname) {
  return typeof nickname === 'string' && nickname.length >= 1 && nickname.length <= NICKNAME_MAX
}

export function isValidHistory(text) {
  return text == null || text === '' || (typeof text === 'string' && text.length <= HISTORY_MAX)
}

export function isValidIdNo(idNo) {
  return typeof idNo === 'string' && /^\d{17}[\dXx]$/.test(idNo)
}

export function validateProfile(payload) {
  const errors = []
  if (!isValidNickname(payload.nickname ?? payload.nickName ?? '用户')) {
    errors.push({ field: 'nickname', message: '昵称需为 1 至 20 个字符' })
  }
  if (!isValidAge(payload.age)) {
    errors.push({ field: 'age', message: '请输入有效年龄' })
  }
  if (payload.gender !== 'male' && payload.gender !== 'female') {
    errors.push({ field: 'gender', message: '性别须为男或女' })
  }
  if (!isValidHistory(payload.medicalHistory)) {
    errors.push({ field: 'medicalHistory', message: '既往病史最多 200 字' })
  }
  if (!isValidHistory(payload.allergyHistory)) {
    errors.push({ field: 'allergyHistory', message: '过敏史最多 200 字' })
  }
  return errors
}

export function parseRefRange(range) {
  if (!range || typeof range !== 'string') return null
  const text = range.replace(/～/g, '~').replace(/—/g, '-').trim()
  let m = text.match(/^([<>]=?)\s*([\d.]+)$/)
  if (m) {
    return { op: m[1], value: Number(m[2]) }
  }
  m = text.match(/^([\d.]+)\s*[-~]\s*([\d.]+)$/)
  if (m) {
    return { min: Number(m[1]), max: Number(m[2]) }
  }
  return null
}

export const IMPORT_REQUIRED_FIELDS = [
  '姓名',
  '身份证号',
  '体检日期',
  '体检机构',
  '指标名称',
  '检测值',
  '单位',
  '参考范围',
]

import { IndicatorStatus } from './enums.js'
import { parseRefRange } from './validation.js'

export function parseNumericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const m = value.trim().match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

export function resolveIndicatorStatus(value, refRange) {
  const n = parseNumericValue(value)
  const range = parseRefRange(refRange)
  if (n == null || !range) return IndicatorStatus.NORMAL
  if ('min' in range && 'max' in range) {
    if (n < range.min) return IndicatorStatus.LOW
    if (n > range.max) return IndicatorStatus.HIGH
    return IndicatorStatus.NORMAL
  }
  if (range.op === '>') return n > range.value ? IndicatorStatus.HIGH : IndicatorStatus.NORMAL
  if (range.op === '>=') return n >= range.value ? IndicatorStatus.HIGH : IndicatorStatus.NORMAL
  if (range.op === '<') return n < range.value ? IndicatorStatus.LOW : IndicatorStatus.NORMAL
  if (range.op === '<=') return n <= range.value ? IndicatorStatus.LOW : IndicatorStatus.NORMAL
  return IndicatorStatus.NORMAL
}

export function indicatorArrow(status) {
  if (status === IndicatorStatus.HIGH) return '↑'
  if (status === IndicatorStatus.LOW) return '↓'
  return ''
}

export function evaluateAlert(code, value, rules) {
  const n = parseNumericValue(value)
  if (n == null) return null
  const rule = rules.find((r) => r.code === code)
  if (!rule) return null
  const hit = rule.operator === '>' ? n > rule.threshold : n >= rule.threshold
  return hit ? { ...rule, value: n } : null
}

export function reportRiskLevel(abnormalCount) {
  if (abnormalCount >= 5) return 'high'
  if (abnormalCount >= 2) return 'mid'
  return 'low'
}

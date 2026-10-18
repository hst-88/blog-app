export const RiskLevel = {
  LOW: 'low',
  MID: 'mid',
  HIGH: 'high',
}

export const RiskLevelLabel = {
  low: '低',
  mid: '中',
  high: '高',
}

export const RiskLevelColor = {
  low: '#22c55e',
  mid: '#eab308',
  high: '#ef4444',
}

export const IndicatorStatus = {
  NORMAL: 'normal',
  HIGH: 'high',
  LOW: 'low',
}

export const AlertLevel = {
  HIGH: 'high',
  MID: 'mid',
}

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
}

export const Role = {
  USER: 'user',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
}

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
}

export const MessageStatus = {
  SENT: 'sent',
  UNREAD: 'unread',
  READ: 'read',
}

export const AlertStatus = {
  OPEN: 'open',
  HANDLED: 'handled',
}

export const HealthLogType = {
  BP: 'bp',
  GLUCOSE: 'glucose',
  WEIGHT: 'weight',
  STEPS: 'steps',
}

export const ReminderType = {
  MEDICATION: 'medication',
  EXERCISE: 'exercise',
}

export const FollowupCycle = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
}

export const PackageStatus = {
  ON: 'on',
  OFF: 'off',
}

export const DEFAULT_ALERT_RULES = [
  { code: 'glucose', name: '血糖', operator: '>', threshold: 11.1, unit: 'mmol/L', level: AlertLevel.HIGH },
  { code: 'sbp', name: '收缩压', operator: '>', threshold: 160, unit: 'mmHg', level: AlertLevel.HIGH },
  { code: 'dbp', name: '舒张压', operator: '>', threshold: 100, unit: 'mmHg', level: AlertLevel.HIGH },
  { code: 'alt', name: '谷丙转氨酶', operator: '>', threshold: 100, unit: 'U/L', level: AlertLevel.MID },
  { code: 'tc', name: '总胆固醇', operator: '>', threshold: 7.0, unit: 'mmol/L', level: AlertLevel.MID },
]

export const APPT_SLOTS = ['07:30-08:30', '08:30-09:30', '09:30-10:30', '10:30-11:30']
export const APPT_SLOT_CAPACITY = 4

export const ASK_DAILY_LIMIT = 10
export const SMS_TTL_SECONDS = 300
export const SMS_MAX_ERRORS = 3
export const SMS_LOCK_SECONDS = 600
export const CONSULT_MAX_IMAGES = 9
export const CONSULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const CONSULT_MAX_AUDIO_SECONDS = 60
export const REPORT_PAGE_SIZE = 10
export const PATIENT_PAGE_SIZE = 20
export const AI_TIMEOUT_MS = 5000
export const BP_CRITICAL_SBP = 180
export const NICKNAME_MAX = 20
export const HISTORY_MAX = 200
export const AGE_MIN = 1
export const AGE_MAX = 120

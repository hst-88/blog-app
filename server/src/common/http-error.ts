export class BizError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status = 400,
  ) {
    super(message)
  }
}

export const Errors = {
  wechatDenied: () => new BizError('WECHAT_AUTH_DENIED', '请允许授权以使用完整功能', 400),
  smsInvalid: () => new BizError('SMS_CODE_INVALID', '验证码错误', 400),
  smsLocked: () => new BizError('SMS_LOCKED', '尝试次数过多，请 10 分钟后重试', 429),
  phoneTaken: () => new BizError('PHONE_TAKEN', '该手机号已被占用', 409),
  ageInvalid: () => new BizError('AGE_INVALID', '请输入有效年龄', 400),
  idInvalid: () => new BizError('IDNO_INVALID', '身份证号格式错误', 400),
  reportNotMatched: () => new BizError('REPORT_NOT_MATCHED', '未找到您的体检记录，请联系客服', 404),
  noContract: () => new BizError('NO_CONTRACT', '请先签约医生后再发起咨询', 409),
  askLimit: () => new BizError('ASK_LIMIT', '当日追问次数已用完', 429),
  aiTimeout: () => new BizError('AI_TIMEOUT', 'AI正在思考，请稍后', 504),
  fileLimit: () => new BizError('FILE_LIMIT', '图片或语音超出限制', 400),
  forbidden: () => new BizError('FORBIDDEN', '无权限', 403),
  pdfFail: () => new BizError('PDF_FAIL', '下载失败，请重试', 500),
  llmMissing: () => new BizError('LLM_NOT_CONFIGURED', '解读服务暂不可用', 503),
  unauthorized: () => new BizError('UNAUTHORIZED', '请先登录', 401),
  userExists: () => new BizError('USER_EXISTS', '该手机号已注册', 409),
  staffExists: () => new BizError('STAFF_EXISTS', '该账号已注册', 409),
  badPassword: () => new BizError('BAD_PASSWORD', '账号或密码错误', 401),
  weakPassword: () => new BizError('WEAK_PASSWORD', '密码至少 6 位', 400),
  packageUnavailable: () => new BizError('PACKAGE_UNAVAILABLE', '该套餐已下架，请选择其他套餐', 409),
  apptDateInvalid: () => new BizError('APPOINTMENT_INVALID', '请选择有效的体检日期与时段', 400),
  apptFull: () => new BizError('APPOINTMENT_FULL', '该时段已约满，请更换时段', 409),
  apptClosed: () => new BizError('APPOINTMENT_CLOSED', '该日期已停止预约，请选择其他日期', 409),
  apptSettingsInvalid: () => new BizError('APPOINTMENT_SETTINGS_INVALID', '号源配置无效，请检查每时段人数与时段设置', 400),
}

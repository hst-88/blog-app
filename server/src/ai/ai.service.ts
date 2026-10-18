import { Errors } from '../common/http-error.js'

const DISCLAIMER = 'AI建议仅供参考，不能替代医生诊断'

export function buildAskPrompt(input: {
  name: string
  value: string
  unit: string
  range: string
  question: string
}) {
  return `你是一名全科医生，请根据用户的体检指标【${input.name} ${input.value} ${input.unit}，参考范围${input.range}】，用通俗易懂的语言回答用户问题【${input.question}】。回答需包含：可能原因、严重程度、生活建议。`
}

export function buildSummaryPrompt(indicators: { department: string; name: string; valueText: string; unit: string; refRange: string; status: string }[]) {
  const lines = indicators
    .map((i) => `${i.department} ${i.name} ${i.valueText}${i.unit}（参考${i.refRange}，${i.status}）`)
    .join('；')
  return `你是一名全科医生。请用通俗易懂的中文解读以下体检报告摘要，说明整体情况、需要关注的异常项和生活建议。摘要：${lines}。请在结尾保留免责声明。`
}

export async function chatComplete(prompt: string) {
  const key = process.env.USER_LLM_API_KEY
  const base = process.env.USER_LLM_BASE_URL
  const model = process.env.USER_LLM_MODEL || 'qwen-plus'
  if (!key || key === 'your-api-key-here' || !base) {
    throw Errors.llmMissing()
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw Errors.aiTimeout()
    const data: any = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''
    return text.includes(DISCLAIMER) ? text : `${text}\n\n${DISCLAIMER}`
  } catch (e) {
    if (e && (e as any).code) throw e
    throw Errors.aiTimeout()
  } finally {
    clearTimeout(timer)
  }
}

export function mockSummary(indicators: { name: string; status: string; valueText: string; unit: string }[]) {
  const abn = indicators.filter((i) => i.status !== 'normal')
  const body = abn.length
    ? `本次体检共有 ${abn.length} 项异常：${abn.map((i) => `${i.name} ${i.valueText}${i.unit}`).join('、')}。建议结合生活习惯观察，必要时就医复查。`
    : '本次体检主要指标均在参考范围内，请继续保持健康生活方式。'
  return `${body}\n\n${DISCLAIMER}`
}

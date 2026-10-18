import { createHmac } from 'node:crypto'

const secret = () => process.env.JWT_SECRET || 'dev-jwt-secret'

function b64url(buf: Buffer | string) {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64url')
}

export function signToken(payload: Record<string, unknown>, ttlSec = 7 * 24 * 3600) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }
  const mid = b64url(JSON.stringify(body))
  const sig = createHmac('sha256', secret()).update(`${header}.${mid}`).digest('base64url')
  return `${header}.${mid}.${sig}`
}

export function verifyToken(token: string) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, m, s] = parts
  const sig = createHmac('sha256', secret()).update(`${h}.${m}`).digest('base64url')
  if (sig !== s) return null
  try {
    const body = JSON.parse(Buffer.from(m, 'base64url').toString())
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null
    return body
  } catch {
    return null
  }
}

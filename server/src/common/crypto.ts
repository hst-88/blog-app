import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function keyBuf() {
  const raw = process.env.USER_DATA_AES_KEY || '0123456789abcdef0123456789abcdef'
  return createHash('sha256').update(raw).digest()
}

export function encryptField(plain: string) {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyBuf(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptField(payload: string) {
  if (!payload) return ''
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', keyBuf(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function hashField(plain: string) {
  return createHash('sha256').update(plain || '').digest('hex')
}

export function sha256(plain: string) {
  return createHash('sha256').update(plain).digest('hex')
}

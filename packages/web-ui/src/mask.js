export function maskName(name) {
  if (!name || typeof name !== 'string') return ''
  const s = name.trim()
  if (s.length <= 1) return '*'
  return `${s[0]}*`
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return ''
  const d = phone.replace(/\D/g, '')
  if (d.length < 7) return '****'
  return `${d.slice(0, 3)}****${d.slice(-4)}`
}

export function maskIdNo(idNo) {
  if (!idNo || typeof idNo !== 'string') return ''
  if (idNo.length < 8) return '**************'
  return `${idNo.slice(0, 4)}${'*'.repeat(Math.max(idNo.length - 8, 4))}${idNo.slice(-4)}`
}

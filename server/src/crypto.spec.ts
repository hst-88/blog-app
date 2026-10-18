import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decryptField, encryptField, hashField } from './common/crypto.js'
import { isValidAge, isValidIdNo, isValidPhone, resolveIndicatorStatus, reportRiskLevel } from '../../packages/shared/src/index.js'
import { maskName, maskPhone, maskIdNo } from '../../packages/web-ui/src/index.js'
import { buildAskPrompt } from './ai/ai.service.js'
import { assessRisk } from './risk/risk.service.js'

describe('crypto', () => {
  it('encrypts and decrypts round-trip', () => {
    const enc = encryptField('13800138000')
    assert.notEqual(enc, '13800138000')
    assert.equal(decryptField(enc), '13800138000')
  })
  it('hashes stably', () => {
    assert.equal(hashField('a'), hashField('a'))
  })
})

describe('validation', () => {
  it('accepts age 1 and 120', () => {
    assert.equal(isValidAge(1), true)
    assert.equal(isValidAge(120), true)
    assert.equal(isValidAge(0), false)
    assert.equal(isValidAge(121), false)
  })
  it('validates phone', () => {
    assert.equal(isValidPhone('13800138000'), true)
    assert.equal(isValidPhone('03800138000'), false)
  })
  it('validates 18-digit id', () => {
    assert.equal(isValidIdNo('110101199001011234'), true)
    assert.equal(isValidIdNo('123'), false)
  })
})

describe('indicator', () => {
  it('marks high and low', () => {
    assert.equal(resolveIndicatorStatus('45', '0-40'), 'high')
    assert.equal(resolveIndicatorStatus('1', '3-5'), 'low')
    assert.equal(resolveIndicatorStatus('4', '3-5'), 'normal')
  })
  it('maps risk by abnormal count', () => {
    assert.equal(reportRiskLevel(0), 'low')
    assert.equal(reportRiskLevel(2), 'mid')
    assert.equal(reportRiskLevel(5), 'high')
  })
})

describe('mask', () => {
  it('masks name phone id', () => {
    assert.equal(maskName('张三'), '张*')
    assert.equal(maskPhone('13800138000'), '138****8000')
    assert.equal(maskIdNo('110101199001011234').startsWith('1101'), true)
  })
})

describe('prompt', () => {
  it('includes indicator and question', () => {
    const p = buildAskPrompt({ name: '谷丙转氨酶', value: '45', unit: 'U/L', range: '0-40', question: '严重吗' })
    assert.match(p, /谷丙转氨酶/)
    assert.match(p, /45/)
    assert.match(p, /严重吗/)
  })
})

describe('risk', () => {
  it('raises liver risk on ALT', () => {
    const r = assessRisk({ age: 35, gender: 'male' }, [{ name: '谷丙转氨酶', status: 'high', valueText: '45' }])
    assert.equal(r.radar.find((x) => x.dim === '肝肾风险').score > 0, true)
  })
})

const { request } = require('../../utils/request')
Page({
  data: { text: '', disclaimer: 'AI建议仅供参考，不能替代医生诊断', waiting: false },
  onLoad(q) {
    this.id = q.id
    this.indicator = q.indicator
    if (q.indicator) {
      this.ask()
    } else {
      this.summary()
    }
  },
  summary() {
    this.setData({ waiting: true, text: 'AI正在思考，请稍后' })
    request('/reports/' + this.id + '/interpret', 'POST')
      .then((r) => this.setData({ text: r.summary, waiting: false }))
      .catch((e) => this.setData({ text: e.message || 'AI正在思考，请稍后', waiting: false }))
  },
  ask() {
    this.setData({ waiting: true, text: 'AI正在思考，请稍后' })
    request('/reports/' + this.id + '/ask', 'POST', { indicator: this.indicator, question: this.indicator + '偏高严重吗？' })
      .then((r) => this.setData({ text: r.answer, waiting: false }))
      .catch((e) => this.setData({ text: e.message || 'AI正在思考，请稍后', waiting: false }))
  },
})

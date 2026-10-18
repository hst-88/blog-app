const { request } = require('../../utils/request')
Page({
  data: { id: null, text: '', messages: [] },
  onLoad(q) {
    this.setData({ id: q.id })
    this.refresh()
  },
  refresh() {
    request('/consultations', 'GET').then((r) => {
      const c = (r.items || []).find((x) => String(x.id) === String(this.data.id))
      this.setData({ messages: (c && c.messages) || [] })
    })
  },
  onText(e) { this.setData({ text: e.detail.value }) },
  send() {
    request('/consultations/' + this.data.id + '/messages', 'POST', { type: 'text', content: this.data.text })
      .then(() => { this.setData({ text: '' }); this.refresh() })
  },
})

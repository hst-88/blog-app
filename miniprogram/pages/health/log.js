const { request } = require('../../utils/request')
Page({
  data: { sbp: '', items: [], hint: '' },
  onSbp(e) { this.setData({ sbp: e.detail.value }) },
  save() {
    request('/health-logs', 'POST', { type: 'bp', sbp: Number(this.data.sbp) }).then((r) => {
      this.setData({ hint: r.hint })
      this.load()
    })
  },
  load() { request('/health-logs', 'GET').then((r) => this.setData({ items: r.items })) },
  onShow() { this.load() },
})

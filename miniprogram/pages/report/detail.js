const { request } = require('../../utils/request')
Page({
  data: { report: null, id: null },
  onLoad(q) {
    this.setData({ id: q.id })
    request('/reports/' + q.id, 'GET').then((r) => this.setData({ report: r }))
  },
  interpret() { wx.navigateTo({ url: '/pages/report/interpret?id=' + this.data.id }) },
  ask(e) {
    const name = e.currentTarget.dataset.name
    wx.navigateTo({ url: '/pages/report/interpret?id=' + this.data.id + '&indicator=' + name })
  },
  share() { wx.navigateTo({ url: '/pages/report/share?id=' + this.data.id }) },
})

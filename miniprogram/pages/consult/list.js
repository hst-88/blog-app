const { request } = require('../../utils/request')
Page({
  data: { items: [] },
  onShow() {
    request('/consultations', 'GET').then((r) => this.setData({ items: r.items }))
  },
  open(e) { wx.navigateTo({ url: '/pages/consult/chat?id=' + e.currentTarget.dataset.id }) },
  create() {
    request('/consultations', 'POST', { doctorId: 2 }).then((r) => {
      wx.navigateTo({ url: '/pages/consult/chat?id=' + r.id })
    }).catch((e) => wx.showToast({ title: e.message || '请先签约医生', icon: 'none' }))
  },
})

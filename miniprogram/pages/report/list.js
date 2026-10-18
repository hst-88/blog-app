const { request } = require('../../utils/request')
Page({
  data: { items: [], page: 1 },
  onShow() { this.load() },
  load() {
    request('/reports?page=' + this.data.page, 'GET').then((res) => this.setData({ items: res.items }))
  },
  open(e) {
    wx.navigateTo({ url: '/pages/report/detail?id=' + e.currentTarget.dataset.id })
  },
})

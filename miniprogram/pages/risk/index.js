const { request } = require('../../utils/request')
Page({
  data: { risk: null },
  onShow() {
    request('/risk/me', 'GET').then((r) => this.setData({ risk: r }))
  },
})

const { request } = require('../../utils/request')
Page({
  data: { name: '', idNo: '', msg: '' },
  onName(e) { this.setData({ name: e.detail.value }) },
  onId(e) { this.setData({ idNo: e.detail.value }) },
  submit() {
    request('/users/me/realname', 'POST', { name: this.data.name, idNo: this.data.idNo })
      .then(() => wx.reLaunch({ url: '/pages/report/list' }))
      .catch((e) => this.setData({ msg: e.message }))
  },
})

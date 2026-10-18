const { request } = require('../../utils/request')
Page({
  data: { age: '', gender: 'male', medicalHistory: '', allergyHistory: '', msg: '' },
  onAge(e) { this.setData({ age: e.detail.value }) },
  save() {
    request('/users/me/profile', 'PUT', this.data)
      .then(() => wx.navigateTo({ url: '/pages/auth/realname' }))
      .catch((e) => this.setData({ msg: e.message || '请输入有效年龄' }))
  },
})

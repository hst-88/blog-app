const { request } = require('../../utils/request')
Page({
  data: { phone: '', code: '', msg: '' },
  onPhone(e) { this.setData({ phone: e.detail.value }) },
  onCode(e) { this.setData({ code: e.detail.value }) },
  send() {
    request('/auth/sms/send', 'POST', { phone: this.data.phone })
      .then((r) => this.setData({ msg: r.debugCode ? `演示验证码 ${r.debugCode}` : '已发送' }))
      .catch((e) => this.setData({ msg: e.message }))
  },
  bind() {
    request('/auth/sms/bind', 'POST', { phone: this.data.phone, code: this.data.code })
      .then(() => wx.navigateTo({ url: '/pages/auth/profile' }))
      .catch((e) => this.setData({ msg: e.message }))
  },
})

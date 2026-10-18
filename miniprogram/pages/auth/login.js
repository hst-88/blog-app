const { request } = require('../../utils/request')

Page({
  data: { denied: false },
  onAuth() {
    request('/auth/wechat', 'POST', { code: 'demo-code', nickname: '张三' })
      .then((res) => {
        getApp().globalData.token = res.token
        wx.setStorageSync('jh_user_token', res.token)
        wx.reLaunch({ url: '/pages/report/list' })
      })
      .catch(() => {
        this.setData({ denied: true })
      })
  },
  onDeny() {
    this.setData({ denied: true })
  },
})

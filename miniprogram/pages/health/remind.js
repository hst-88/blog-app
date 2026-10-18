const { request } = require('../../utils/request')
Page({
  create() {
    request('/reminders', 'POST', { type: 'medication', rrule: 'daily' }).then(() => {
      wx.showToast({ title: '已设置每日用药提醒' })
    })
  },
})

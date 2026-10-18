Page({
  data: { hint: '建议在WiFi环境下下载' },
  download() {
    wx.showToast({ title: '建议在WiFi环境下下载', icon: 'none' })
  },
})

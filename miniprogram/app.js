App({
  globalData: { token: '', user: null, apiBase: 'http://127.0.0.1:3001/api' },
  onLaunch() {
    const token = wx.getStorageSync('jh_user_token')
    if (token) this.globalData.token = token
  },
})

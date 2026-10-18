const app = () => getApp()

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app().globalData.apiBase}${path}`,
      method,
      data,
      header: {
        Authorization: app().globalData.token ? `Bearer ${app().globalData.token}` : '',
      },
      success(res) {
        if (res.statusCode >= 400) {
          reject(res.data || { message: '请求失败' })
          return
        }
        resolve(res.data)
      },
      fail: reject,
    })
  })
}

module.exports = { request }

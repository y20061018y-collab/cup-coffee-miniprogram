const { API_BASE, USE_MOCK } = require('../config/index.js')

function request({ url, method = 'GET', data = {}, header = {} }) {
  return new Promise((resolve, reject) => {
    if (USE_MOCK) {
      reject(new Error('request: USE_MOCK 时请在 services/api 内返回 mock，勿直连'))
      return
    }
    const token = wx.getStorageSync('auth_token') || ''
    wx.request({
      url: `${API_BASE}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.message || `HTTP ${res.statusCode}`))
        }
      },
      fail: reject,
    })
  })
}

function get(url, data) {
  return request({ url, method: 'GET', data })
}

function post(url, data) {
  return request({ url, method: 'POST', data })
}

module.exports = { request, get, post, USE_MOCK, API_BASE }

const store = require('../../../../store/index.js')
const orderApi = require('../../../../mock/orders.js')

Page({
  data: {
    orderId: '',
    orderNo: '',
    pickupText: '门店自提',
    storeName: '',
    pay: '0.00',
    theme: 'light',
  },
  onLoad(q) {
    const orderId = q.id || String(Date.now())
    const order = orderApi.all().find((item) => item.id === orderId) || {}
    this.setData({
      orderId,
      orderNo: orderId.slice(-6).toUpperCase(),
      pickupText: order.pickupType === 'delivery' ? '外送到手' : '门店自提',
      storeName: order.storeName || 'CUP Coffee',
      pay: Number(order.pay || 0).toFixed(2),
      theme: store.getState().theme,
    })
    this._unsub = store.subscribe((s) => this.setData({ theme: s.theme }))
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  goOrders() {
    wx.redirectTo({ url: '/subpackages/flow/pages/orders/index' })
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },
})
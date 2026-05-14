const orderApi = require('../../../../mock/orders.js')
const store = require('../../../../store/index.js')

Page({
  data: { list: [], theme: 'light' },
  onLoad() {
    this.setData({ theme: store.getState().theme })
    this._unsub = store.subscribe((s) => this.setData({ theme: s.theme }))
    this._load()
  },
  onShow() {
    this._load()
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  _load() {
    const list = orderApi.all().map((o) => ({
      ...o,
      pay: Number(o.pay).toFixed(2),
    }))
    this.setData({ list })
  },
  onDeleteOrder(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.showModal({
      title: '删除订单',
      content: '确定删除这条订单记录？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#c06b3e',
      success: (res) => {
        if (!res.confirm) return
        if (!orderApi.remove(id)) {
          wx.showToast({ title: '订单不存在', icon: 'none' })
          this._load()
          return
        }
        this._load()
        wx.showToast({ title: '已删除', icon: 'none' })
      },
    })
  },
})

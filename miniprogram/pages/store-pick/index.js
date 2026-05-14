const api = require('../../services/api.js')
const store = require('../../store/index.js')

Page({
  data: { list: [], sel: '', theme: 'light' },
  onLoad() {
    this.setData({ theme: store.getState().theme })
    this._unsub = store.subscribe((s) => this.setData({ theme: s.theme }))
    this._load()
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  async _load() {
    const { list } = await api.getStoreList()
    const cur = store.getState().store
    this.setData({
      list,
      sel: (cur && cur.id) || (list[0] && list[0].id) || '',
    })
  },
  choose(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ sel: id })
  },
  confirm() {
    if (!this.data.sel) return
    const one = this.data.list.find((s) => s.id === this.data.sel)
    if (one) {
      store.setStore(one)
      wx.showToast({ title: '门店已更新', icon: 'success' })
    }
    wx.navigateBack()
  },
})

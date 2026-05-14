const api = require('../../services/api.js')
const store = require('../../store/index.js')
const { getMoodPick } = require('../../config/moodPick.js')

Page({
  data: {
    loading: true,
    list: [],
    moodTitle: '',
    moodNote: '',
    theme: 'light',
  },
  onLoad(query) {
    const moodId = query.mood || ''
    const meta = getMoodPick(moodId)
    if (!meta) {
      this.setData({ loading: false })
      wx.showToast({ title: '未知心情', icon: 'none' })
      setTimeout(() => {
        if (getCurrentPages().length > 1) {
          wx.navigateBack()
        } else {
          wx.switchTab({ url: '/pages/index/index' })
        }
      }, 1600)
      return
    }
    wx.setNavigationBarTitle({ title: 'CUP · ' + meta.title })
    const st = store.getState()
    this.setData({
      moodTitle: meta.title,
      moodNote: meta.note,
      theme: st.theme,
    })
    this._unsub = store.subscribe((s) => {
      this.setData({ theme: s.theme })
    })
    this._load(meta.productIds)
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  async _load(ids) {
    try {
      const { list } = await api.getProductsByIds(ids)
      this.setData({ list: list || [], loading: false })
    } catch (e) {
      this.setData({ list: [], loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },
  onProduct(e) {
    const id = e.detail && e.detail.id
    if (!id) return
    wx.navigateTo({ url: '/subpackages/media/pages/goods/detail?id=' + id })
  },
})

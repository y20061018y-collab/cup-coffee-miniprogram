const api = require('../../services/api.js')
const store = require('../../store/index.js')
const themeChrome = require('../../utils/themeChrome.js')

Page({
  data: {
    categories: [],
    list: [],
    cur: '',
    searchKeyword: '',
    hasSearchQuery: false,
    theme: 'light',
    pageRootStyle: 'background: #f5f0e8',
  },
  onLoad() {
    themeChrome.syncToPage(this)
    this._unsub = themeChrome.subscribeForPage(this)
    this._load()
  },
  onShow() {
    themeChrome.syncToPage(this)
  },
  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer)
    if (this._unsub) this._unsub()
  },
  async _load() {
    const { categories } = await api.getCategoryList()
    const first = categories[0] && categories[0].id
    this.setData({ categories, cur: first })
    this._loadProducts(first)
  },
  async _loadProducts(categoryId) {
    const { list } = await api.getProductList(categoryId)
    this.setData({ list })
  },
  async _runSearch(q) {
    this.setData({ hasSearchQuery: true })
    const { list } = await api.searchProducts(q)
    const payload = { list }
    if (list.length && list[0].categoryId) {
      payload.cur = list[0].categoryId
    }
    this.setData(payload)
  },
  onSearchInput(e) {
    const searchKeyword = e.detail.value
    this.setData({ searchKeyword })
    if (this._searchTimer) clearTimeout(this._searchTimer)
    const q = String(searchKeyword || '').trim()
    if (!q) {
      this.setData({ hasSearchQuery: false })
      this._loadProducts(this.data.cur)
      return
    }
    this._searchTimer = setTimeout(() => {
      this._searchTimer = null
      this._runSearch(q)
    }, 280)
  },
  onSearchConfirm(e) {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
    const raw =
      e.detail.value != null ? e.detail.value : this.data.searchKeyword
    const searchKeyword = String(raw || '')
    const q = searchKeyword.trim()
    this.setData({ searchKeyword })
    if (!q) {
      this.setData({ hasSearchQuery: false })
      this._loadProducts(this.data.cur)
      return
    }
    this._runSearch(q)
  },
  onCat(e) {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = null
    }
    const id = e.currentTarget.dataset.id
    this.setData({
      cur: id,
      searchKeyword: '',
      hasSearchQuery: false,
    })
    this._loadProducts(id)
  },
  onProduct(e) {
    wx.navigateTo({
      url: '/subpackages/media/pages/goods/detail?id=' + e.detail.id,
    })
  },
})

const orderApi = require('../../mock/orders.js')
const products = require('../../mock/products.js')
const storeModule = require('../../store/index.js')
const cart = require('../../utils/cart.js')
const spec = require('../../utils/specConfig.js')
const themeChrome = require('../../utils/themeChrome.js')

const TABS = [
  { key: 'pending', label: '待支付' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const STATUS_MAP = {
  pending: { label: '待支付', cls: 'st--pending' },
  completed: { label: '已完成', cls: 'st--done' },
  paid: { label: '已完成', cls: 'st--done' },
  cancelled: { label: '已取消', cls: 'st--cancel' },
}

/** 与商品库封面一致，订单行缩略图优先按商品名对齐首页 */
function buildCoverByName() {
  const map = {}
  try {
    products.getByCategory().forEach((p) => {
      map[p.name] = p.cover
    })
  } catch (e) {}
  return map
}
const COVER_BY_NAME = buildCoverByName()
const DEFAULT_COVER = '/images/products/p3-yirgacheffe-carousel-1.png'

function fmtTime(iso) {
  try {
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return (
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
      `${p(d.getHours())}:${p(d.getMinutes())}`
    )
  } catch (e) {
    return ''
  }
}

function amountLabelFor(status) {
  if (status === 'cancelled') return '订单金额'
  if (status === 'pending') return '应付'
  return '实付'
}

function decorate(list) {
  return list.map((o) => {
    const st = STATUS_MAP[o.status] || { label: o.status, cls: '' }
    const norm = o.status === 'paid' ? 'completed' : o.status
    return {
      ...o,
      _status: norm,
      _statusLabel: st.label,
      _statusCls: st.cls,
      _time: fmtTime(o.createdAt),
      _pay: Number(o.pay || 0).toFixed(2),
      _amountLabel: amountLabelFor(norm),
      _amountMuted: norm === 'cancelled',
      lines: (o.lines || []).map((l) => ({
        ...l,
        cover: COVER_BY_NAME[l.name] || l.cover || DEFAULT_COVER,
      })),
    }
  })
}

Page({
  data: {
    mainSeg: 'bag',
    bagLines: [],
    bagSubtotal: '0.00',
    bagCount: 0,
    tabs: TABS,
    curTab: 'pending',
    orders: [],
    theme: 'light',
    pageRootStyle: 'background: #f5f0e8',
  },

  onLoad() {
    themeChrome.syncToPage(this)
    this._unsub = themeChrome.subscribeForPage(this)
    orderApi.seed()
    wx.setNavigationBarTitle({ title: '购物车' })
  },

  onShow() {
    themeChrome.syncToPage(this)
    this._refreshBag()
    this._load()
  },

  onUnload() {
    if (this._unsub) this._unsub()
  },

  _refreshBag() {
    const raw = cart.read()
    const lines = raw.map((l) => {
      const p = products.getById(l.productId)
      const unit = spec.unitPriceForLine(p, l)
      const rk = cart.rowKey(l)
      return {
        ...l,
        rowKey: rk,
        price: unit,
        cover: l.cover || DEFAULT_COVER,
        _unit: Number(unit).toFixed(2),
        _lineTotal: (unit * l.qty).toFixed(2),
      }
    })
    const sub = cart.subtotal(lines)
    storeModule.setCartCount(cart.totalCount(raw))
    this.setData({
      bagLines: lines,
      bagSubtotal: sub.toFixed(2),
      bagCount: cart.totalCount(raw),
    })
  },

  switchMainSeg(e) {
    const seg = e.currentTarget.dataset.seg
    if (!seg || seg === this.data.mainSeg) return
    this.setData({ mainSeg: seg })
    wx.setNavigationBarTitle({ title: seg === 'bag' ? '购物车' : '我的订单' })
    if (seg === 'bag') this._refreshBag()
  },

  onBagDelta(e) {
    const { key, delta } = e.currentTarget.dataset
    const d = Number(delta)
    if (!key || !d) return
    const r = cart.applyQtyDelta(key, d)
    if (!r.ok) {
      wx.showToast({ title: r.msg || '操作失败', icon: 'none' })
      return
    }
    this._refreshBag()
  },

  onBagRemove(e) {
    const { key } = e.currentTarget.dataset
    if (!key) return
    wx.showModal({
      title: '移除商品',
      content: '要从购物车里移除这一件吗？',
      confirmText: '移除',
      success: (res) => {
        if (!res.confirm) return
        cart.removeRow(key)
        this._refreshBag()
      },
    })
  },

  goCheckoutFromBag() {
    if (!this.data.bagLines.length) {
      wx.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    try {
      wx.removeStorageSync('cup_checkout_keys')
    } catch (e) {}
    wx.navigateTo({
      url: '/subpackages/flow/pages/checkout/index',
    })
  },

  goCategory() {
    wx.switchTab({ url: '/pages/category/index' })
  },

  _load() {
    this._raw = orderApi.all()
    this._filter()
  },

  _filter() {
    const { curTab } = this.data
    let list = this._raw || []
    if (curTab === 'pending') {
      list = list.filter((o) => o.status === 'pending')
    } else if (curTab === 'completed') {
      list = list.filter(
        (o) => o.status === 'completed' || o.status === 'paid'
      )
    } else if (curTab === 'cancelled') {
      list = list.filter((o) => o.status === 'cancelled')
    }
    this.setData({ orders: decorate(list) })
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.curTab) return
    this.setData({ curTab: key })
    this._filter()
  },

  cancelOrder(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '取消订单',
      content: '确认取消该订单吗？',
      confirmText: '取消订单',
      cancelText: '再想想',
      confirmColor: '#c0392b',
      success: (res) => {
        if (!res.confirm) return
        orderApi.update(id, { status: 'cancelled' })
        this._load()
        wx.showToast({ title: '订单已取消', icon: 'none' })
      },
    })
  },

  goPay(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '模拟支付',
      content: '确认支付该订单？',
      confirmText: '立即支付',
      success: (res) => {
        if (!res.confirm) return
        orderApi.update(id, { status: 'completed' })
        this._load()
        wx.showToast({ title: '支付成功', icon: 'success' })
      },
    })
  },

  reorder(e) {
    wx.showToast({ title: '已重新加入购物车', icon: 'success' })
  },

  goReview() {
    wx.showToast({ title: '评价功能即将上线', icon: 'none' })
  },

  deleteOrder(e) {
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

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },
})

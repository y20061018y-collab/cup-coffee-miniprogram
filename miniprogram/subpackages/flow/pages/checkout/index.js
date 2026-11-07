const cart = require('../../../../utils/cart.js')
const { rowKey: cartRowKey } = cart
const products = require('../../../../mock/products.js')
const couponsApi = require('../../../../mock/coupons.js')
const spec = require('../../../../utils/specConfig.js')
const orderApi = require('../../../../mock/orders.js')
const store = require('../../../../store/index.js')

Page({
  data: {
    lines: [],
    subTotal: '0.00',
    pay: '0.00',
    coupons: [],
    selectedCouponId: '',
    discount: '0.00',
    store: null,
    pickupType: 'store',
    theme: 'light',
    orderMood: '咖啡师准备中',
    etaText: '预计 3 分钟完成制作',
  },
  onLoad() {
    this.setData({ theme: store.getState().theme })
    this._unsub = store.subscribe((s) => this.setData({ theme: s.theme }))
    this._rebuild()
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  onShow() {
    this._rebuild()
  },
  _rebuild() {
    const raw = cart.read()
    if (!raw.length) {
      if (!this._backNavigating) {
        this._backNavigating = true
        wx.showModal({
          title: '购物车是空的',
          content: '可以去分类挑一杯咖啡，也可以回首页用心情灵感试试。',
          confirmText: '去分类',
          cancelText: '回首页',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.switchTab({ url: '/pages/category/index' })
            } else if (modalRes.cancel) {
              wx.switchTab({ url: '/pages/index/index' })
            }
          },
          complete: () => {
            this._backNavigating = false
          },
        })
      }
      return
    }
    this._backNavigating = false
    const checkoutKeys = wx.getStorageSync('cup_checkout_keys') || []
    const source = checkoutKeys.length
      ? raw.filter((l) => checkoutKeys.includes(cartRowKey(l)))
      : raw
    const lines = source.map((l) => {
      const p = products.getById(l.productId)
      const unit = spec.unitPriceForLine(p, l)
      return {
        ...l,
        rowKey: cartRowKey(l),
        price: unit,
      }
    })
    const sub = Number(cart.subtotal(lines).toFixed(2))
    const st = store.getState()
    let selectedCoupon = st.selectedCoupon
    if (selectedCoupon && !couponsApi.isEligible(selectedCoupon, sub)) {
      store.setSelectedCoupon(null)
      selectedCoupon = null
    }
    const discount = couponsApi.discountFor(selectedCoupon, sub)
    const couponList = couponsApi.list().map((coupon) => ({
      ...coupon,
      eligible: couponsApi.isEligible(coupon, sub),
      discountText: '-¥' + couponsApi.discountFor(coupon, sub).toFixed(2),
      selected: !!selectedCoupon && selectedCoupon.id === coupon.id,
    }))
    this.setData({
      lines,
      subTotal: sub.toFixed(2),
      pay: Math.max(0, sub - discount).toFixed(2),
      coupons: couponList,
      selectedCouponId: selectedCoupon ? selectedCoupon.id : '',
      discount: discount.toFixed(2),
      store: st.store,
      orderMood: lines.length === 1 ? '你的专属咖啡卡片' : '今日咖啡组合已生成',
    })
  },
  pickCoupon(e) {
    const coupon = couponsApi.list().find(
      (item) => item.id === e.currentTarget.dataset.id
    )
    if (!coupon) return
    if (!couponsApi.isEligible(coupon, Number(this.data.subTotal))) {
      wx.showToast({ title: '未满足使用门槛', icon: 'none' })
      return
    }
    const selectedCoupon = store.getState().selectedCoupon
    store.setSelectedCoupon(
      selectedCoupon && selectedCoupon.id === coupon.id ? null : coupon
    )
    this._rebuild()
  },
  pickType(e) {
    this.setData({ pickupType: e.currentTarget.dataset.type })
  },
  submit() {
    const {
      lines,
      subTotal,
      pay,
      discount,
      selectedCouponId,
      store: st,
      pickupType,
    } = this.data
    const selectedCoupon = store.getState().selectedCoupon
    const checkoutKeys = wx.getStorageSync('cup_checkout_keys') || []
    const order = orderApi.add({
      lines: lines.map((l) => ({
        name: l.name,
        spec: l.spec,
        qty: l.qty,
        price: l.price,
      })),
      subTotal: Number(subTotal),
      pay: Number(pay),
      couponId: selectedCouponId,
      couponName: selectedCoupon ? selectedCoupon.name : '',
      discount: Number(discount),
      pickupType,
      storeName: (st && st.name) || '',
    })
    store.setSelectedCoupon(null)
    if (checkoutKeys.length) {
      cart.removeLines(checkoutKeys, false)
    } else {
      cart.clear()
    }
    store.setCartCount(cart.totalCount(cart.read()))
    wx.removeStorageSync('cup_checkout_keys')
    wx.redirectTo({
      url: '/subpackages/flow/pages/order-success/index?id=' + order.id,
    })
  },
})

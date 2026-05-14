const listeners = []

const state = {
  user: {
    isLogin: false,
    nickname: '访客',
    avatar: '',
    points: 0,
    level: 1, // 1-5
  },
  cartCount: 0,
  /** @type {import('../mock/coupons').Coupon[]} */
  selectedCoupon: null,
  /** 当前门店 */
  store: null,
  /** @type {import('../mock/stores').StoreItem | null} */
  theme: 'light', // light | dark
}

function getState() {
  return { ...state, user: { ...state.user } }
}

function _notify() {
  const snap = getState()
  listeners.forEach((fn) => {
    try {
      fn(snap)
    } catch (e) {
      console.error(e)
    }
  })
}

function subscribe(fn) {
  if (typeof fn !== 'function') return () => {}
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i > -1) listeners.splice(i, 1)
  }
}

function setUser(partial) {
  state.user = { ...state.user, ...partial }
  _notify()
  try {
    wx.setStorageSync('cup_user', state.user)
  } catch (e) {}
}

function setCartCount(n) {
  state.cartCount = Math.max(0, n | 0)
  _notify()
}

function setStore(store) {
  state.store = store
  _notify()
  try {
    wx.setStorageSync('cup_store', store)
  } catch (e) {}
}

function setTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light'
  _notify()
  try {
    wx.setStorageSync('cup_theme', state.theme)
  } catch (e) {}
  const app = getApp()
  if (app) app.applyTheme && app.applyTheme(state.theme)
}

function setSelectedCoupon(coupon) {
  state.selectedCoupon = coupon
  _notify()
}

function hydrate() {
  try {
    const u = wx.getStorageSync('cup_user')
    if (u && typeof u === 'object') {
      state.user = { ...state.user, ...u }
    }
    const s = wx.getStorageSync('cup_store')
    if (s) state.store = s
    const t = wx.getStorageSync('cup_theme')
    if (t === 'dark' || t === 'light') state.theme = t
  } catch (e) {}
}

module.exports = {
  getState,
  subscribe,
  setUser,
  setCartCount,
  setStore,
  setTheme,
  setSelectedCoupon,
  hydrate,
}

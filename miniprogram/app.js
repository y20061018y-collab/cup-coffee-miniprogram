const store = require('./store/index.js')
const brandChrome = require('./utils/brandChrome.js')
const {
  CLOUD_ENV_ID,
  MOOD_RECOMMEND_SOURCE,
} = require('./config/index.js')
const { envList } = require('./envList.js')

App({
  onLaunch() {
    const resolvedCloudEnv =
      (CLOUD_ENV_ID && String(CLOUD_ENV_ID).trim()) ||
      (envList[0] && envList[0].envId) ||
      ''
    this.globalData = { env: resolvedCloudEnv }
    store.hydrate()
    const st = store.getState()
    this.applyTheme(st.theme)
    this._refreshCartBadge()
    try {
      wx.removeTabBarBadge({ index: 2 })
    } catch (e) {}

    if (wx.cloud && MOOD_RECOMMEND_SOURCE === 'cloud') {
      const opt = { traceUser: true }
      if (resolvedCloudEnv) opt.env = resolvedCloudEnv
      wx.cloud.init(opt)
    }
    wx.onThemeChange(({ theme }) => {
      if (getApp().globalData?.followSystemTheme) {
        store.setTheme(theme === 'dark' ? 'dark' : 'light')
      }
    })
  },
  onShow() {
    this._refreshCartBadge()
  },
  onHide() {},

  applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light'
    const B = brandChrome[t]
    if (t === 'dark') {
      wx.setNavigationBarColor({
        frontColor: brandChrome.dark.navFrontColor,
        backgroundColor: brandChrome.dark.navBgColor,
      })
      try {
        wx.setTabBarStyle(brandChrome.dark.tabBar)
      } catch (e) {}
      try {
        if (wx.setBackgroundColor) {
          wx.setBackgroundColor({
            backgroundColor: brandChrome.dark.bgColor,
            backgroundColorTop: brandChrome.dark.bgColor,
            backgroundColorBottom: brandChrome.dark.bgColor,
          })
        }
      } catch (e) {}
    } else {
      wx.setNavigationBarColor({
        frontColor: brandChrome.light.navFrontColor,
        backgroundColor: brandChrome.light.navBgColor,
      })
      try {
        wx.setTabBarStyle(brandChrome.light.tabBar)
      } catch (e) {}
      try {
        if (wx.setBackgroundColor) {
          wx.setBackgroundColor({
            backgroundColor: brandChrome.light.bgColor,
            backgroundColorTop: brandChrome.light.bgColor,
            backgroundColorBottom: brandChrome.light.bgColor,
          })
        }
      } catch (e) {}
    }
  },

  setFollowSystem(follow) {
    this.globalData = this.globalData || {}
    this.globalData.followSystemTheme = !!follow
  },

  _refreshCartBadge() {
    const cart = require('./utils/cart.js')
    const c = cart.totalCount(cart.read())
    store.setCartCount(c)
  },
})

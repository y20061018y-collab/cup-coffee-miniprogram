const store = require('../../store/index.js')
const themeChrome = require('../../utils/themeChrome.js')

const levelNames = ['', '探索者', '爱好者', '鉴赏家', '旅行家', '大师']

Page({
  data: {
    user: {},
    theme: 'light',
    pageRootStyle: 'background: #f5f0e8',
    levelName: '',
    tapCount: 0,
  },
  onLoad() {
    themeChrome.syncToPage(this)
    this.setData(this._fromStore())
    this._unsub = themeChrome.subscribeForPage(this, (s) => {
      this.setData(this._fromStore(s))
    })
  },
  onShow() {
    themeChrome.syncToPage(this)
    this.setData(this._fromStore())
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  _fromStore(s) {
    const st = s || store.getState()
    const { user } = st
    return {
      user,
      theme: st.theme,
      levelName: levelNames[user.level] || levelNames[1],
    }
  },
  onLogin() {
    if (store.getState().user.isLogin) return
    store.setUser({
      isLogin: true,
      nickname: 'CUP 体验用户',
      avatar: '',
      points: 120,
      level: 2,
    })
    wx.showToast({ title: '已登录(模拟)', icon: 'success' })
  },
  onLogoLong() {
    wx.navigateTo({
      url: '/subpackages/flow/pages/dev-showcase/index',
    })
  },
  goShowcase() {
    wx.navigateTo({
      url: '/subpackages/flow/pages/dev-showcase/index',
    })
  },
  onTapVersion() {
    const c = (this._tap = (this._tap || 0) + 1)
    this.setData({ tapCount: c })
    if (c >= 3) {
      this._tap = 0
      this.setData({ tapCount: 0 })
      wx.navigateTo({
        url: '/subpackages/flow/pages/dev-showcase/index',
      })
    }
  },
  toggleTheme() {
    const t = store.getState().theme === 'dark' ? 'light' : 'dark'
    store.setTheme(t)
  },
})

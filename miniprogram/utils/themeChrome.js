/**
 * Tab 页与带系统导航栏的页面：根节点是原生 page，子 view 的 theme-dark 管不到整屏底色。
 * 用 page-style + 再次 apply 导航/Tab/Background，与首页（custom 导航）行为一致。
 */
function pageRootStyle(theme) {
  return theme === 'dark' ? 'background: #121212' : 'background: #f5f0e8'
}

function applyBarOnce(app, theme) {
  if (app && typeof app.applyTheme === 'function') {
    app.applyTheme(theme)
  }
}

/**
 * Tab 页在切换时原生导航栏会先沿用 app.json 的浅色，再被 JS 覆盖。
 * 用 nextTick/延迟多刷一次，避免「半截白」。
 */
function syncToPage(page) {
  const store = require('../store/index.js')
  const t = store.getState().theme
  if (page && page.setData) {
    page.setData({ pageRootStyle: pageRootStyle(t), theme: t })
  }
  const app = getApp()
  applyBarOnce(app, t)
  const runAgain = () => applyBarOnce(app, t)
  if (wx.nextTick) {
    try {
      wx.nextTick(runAgain)
    } catch (e) {
      setTimeout(runAgain, 0)
    }
  } else {
    setTimeout(runAgain, 0)
  }
  setTimeout(runAgain, 50)
}

function subscribeForPage(page, onTheme) {
  const store = require('../store/index.js')
  return store.subscribe((s) => {
    if (page && page.setData) {
      page.setData({ pageRootStyle: pageRootStyle(s.theme), theme: s.theme })
    }
    const app = getApp()
    applyBarOnce(app, s.theme)
    const runAgain = () => applyBarOnce(app, s.theme)
    if (wx.nextTick) {
      try {
        wx.nextTick(runAgain)
      } catch (e) {
        setTimeout(runAgain, 0)
      }
    } else {
      setTimeout(runAgain, 0)
    }
    setTimeout(runAgain, 50)
    if (typeof onTheme === 'function') onTheme(s)
  })
}

module.exports = { pageRootStyle, syncToPage, subscribeForPage }

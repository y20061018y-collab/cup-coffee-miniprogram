const api = require('../../services/api.js')
const store = require('../../store/index.js')

const MOOD_HOME_FULL_KEY = 'cup_home_mood_full'

/**
 * 心情推荐结果页的「微庆祝」一句，按商品 id 粗颗粒对齐动机
 * @param {string} productId
 */
function moodCelebrationLine(productId) {
  const M = {
    p1: '读到了：你现在更需要一口干净利落、把困意推开的清醒感。',
    p2: '读到了：你想要温柔绵密一点、适合慢慢喝也很有安全感的一杯。',
    p3: '读到了：想慢下来，喝得到一点花香果酸层次。',
    p4: '读到了：今天需要更扎实的搭配，咖啡配点吃的更踏实。',
    p5: '读到了：想喝「有咖啡骨架」的经典奶咖和蓬松奶泡。',
    p6: '读到了：想要清冽爽快、带走闷热和倦意的一杯。',
    p7: '读到了：更想要燕麦/植物奶带来的柔和与饱足。',
    p8: '读到了：想把咖啡因放轻，仍然保留奶咖的香气。',
    p9: '读到了：想来点当季限定、清爽不腻的一口。',
  }
  return (
    M[productId] ||
    '听懂了你的描述，已从门店在售里挑了这杯，点开看看是否对味。'
  )
}

function go(link) {
  if (!link) return
  const path = link.split('?')[0]
  if (
    path === '/pages/index/index' ||
    path === 'pages/index/index'
  ) {
    wx.switchTab({ url: '/pages/index/index' })
    return
  }
  if (path === '/pages/category/index' || path === 'pages/category/index') {
    wx.switchTab({ url: '/pages/category/index' })
    return
  }
  if (path === '/pages/cart/index' || path === 'pages/cart/index') {
    wx.switchTab({ url: '/pages/cart/index' })
    return
  }
  if (path === '/pages/user/index' || path === 'pages/user/index') {
    wx.switchTab({ url: '/pages/user/index' })
    return
  }
  if (link.startsWith('/')) {
    wx.navigateTo({ url: link })
  } else {
    wx.navigateTo({ url: '/' + link })
  }
}

Page({
  data: {
    loading: true,
    banners: [],
    heroSlides: [],
    heroParallaxY: 0,
    moodRows: [
      {
        rowId: 'm1',
        left: { id: 'work', label: '工作续命', note: '低酸清醒' },
        right: { id: 'morning', label: '早起清醒', note: '果酸明亮' },
      },
      {
        rowId: 'm2',
        left: { id: 'relax', label: '午后松弛', note: '奶咖治愈' },
        right: { id: 'focus', label: '深度专注', note: '干净高醇' },
      },
      {
        rowId: 'm3',
        left: { id: 'date', label: '约会氛围', note: '适合截图' },
        right: { id: 'warm', label: '降温暖胃', note: '热饮醇厚' },
      },
      {
        rowId: 'm4',
        left: { id: 'decaf', label: '夜晚低因', note: '轻负担' },
        right: { id: 'cool', label: '消暑解渴', note: '气泡/冷萃清爽' },
      },
    ],
    recommended: [],
    statusBar: 20,
    theme: 'light',
    moodInspireVisible: false,
    moodInspireTitle: '现在心情如何？',
    moodInspireHint: '简单写一两句心情或想喝的口感，我们从店里在售咖啡里帮你挑一杯。',
    moodInspirePlaceholder:
      '例如：熬了一整夜想提神、下午想喝奶咖温和一点…',
    moodInspireCancelLabel: '取消',
    moodInspireSubmitLabel: '为我推荐',
    moodInspireText: '',
    moodInspireSubmitting: false,
    moodResultVisible: false,
    moodResultProductId: '',
    moodResultReason: '',
    moodResultName: '',
    moodResultSubtitle: '',
    moodResultCover: '',
    moodResultCelebration: '',
    moodMenuFull: false,
  },
  onLoad() {
    const sys = wx.getSystemInfoSync()
    let moodMenuFull = false
    try {
      moodMenuFull = wx.getStorageSync(MOOD_HOME_FULL_KEY) === true
    } catch (e) {}
    this.setData({ statusBar: sys.statusBarHeight || 20, moodMenuFull })
    const s = store.getState()
    this.setData({
      theme: s.theme,
    })
    this._unsub = store.subscribe((st) => {
      this.setData({
        theme: st.theme,
      })
    })
    this._load()
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  async _load() {
    this.setData({ loading: true })
    try {
      const res = await api.getHome()
      let heroSlides = []
      if (Array.isArray(res.heroSlides) && res.heroSlides.length) {
        heroSlides = res.heroSlides
          .filter((s) => s && s.image)
          .map((s, i) => ({
            id: s.id || `slide-${i}`,
            label: s.label || '',
            title: s.title || '',
            desc: s.desc || '',
            image: s.image,
            _loaded: false,
          }))
      }
      if (!heroSlides.length) {
        const imgs =
          (Array.isArray(res.heroImages) &&
            res.heroImages.length &&
            res.heroImages) ||
          (Array.isArray(res.banners) &&
            res.banners.map((b) => b.image).filter(Boolean)) ||
          []
        if (imgs.length) {
          heroSlides = imgs.map((image, i) => ({
            id: `legacy-${i}`,
            label: 'TODAY MOOD',
            title:
              i === 0 ? '雨天适合一杯低因拿铁' : '今日咖啡灵感',
            desc:
              i === 0
                ? '奶泡、胶片色和一点慢下来的香气'
                : '为你精选门店在售风味',
            image,
            _loaded: false,
          }))
        }
      }
      this.setData({
        banners: res.banners,
        heroSlides,
        recommended: (res.recommended || []).map((item, index) => ({
          ...item,
          _delay: index * 80,
        })),
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },
  onHeroSlideImageLoad(e) {
    const id = e.currentTarget.dataset.slideId
    if (!id) return
    const heroSlides = this.data.heroSlides.map((s) =>
      s.id === id ? { ...s, _loaded: true } : s
    )
    this.setData({ heroSlides })
  },
  onBannerNav(e) {
    go(e.detail.link)
  },
  onProduct(e) {
    const { id } = e.detail
    if (!id) return
    wx.navigateTo({
      url:
        '/subpackages/media/pages/goods/detail?id=' +
        encodeURIComponent(String(id)),
    })
  },
  onPeekRecommend() {
    wx.createSelectorQuery()
      .select('#rec-anchor')
      .boundingClientRect()
      .selectViewport()
      .scrollOffset()
      .exec((res) => {
        const rect = res && res[0]
        const viewport = res && res[1]
        if (!rect || !viewport) return
        const top = viewport.scrollTop + rect.top - 48
        wx.pageScrollTo({ scrollTop: Math.max(0, top), duration: 320 })
      })
  },
  onExpandMoodMenu() {
    try {
      wx.setStorageSync(MOOD_HOME_FULL_KEY, true)
    } catch (e) {}
    this.setData({ moodMenuFull: true })
  },
  onCollapseMoodMenu() {
    try {
      wx.removeStorageSync(MOOD_HOME_FULL_KEY)
    } catch (e) {}
    this.setData({ moodMenuFull: false })
  },
  onMoodTap(e) {
    const moodId = e.currentTarget.dataset.id
    if (!moodId) return
    wx.navigateTo({ url: '/pages/mood-picks/index?mood=' + moodId })
  },
  onOpenMoodInspire() {
    this.setData({
      moodInspireVisible: true,
      moodInspireText: '',
    })
  },
  onCloseMoodInspire() {
    if (this.data.moodInspireSubmitting) return
    this.setData({ moodInspireVisible: false })
  },
  onMoodInspireInput(e) {
    this.setData({ moodInspireText: e.detail.value })
  },
  async onMoodInspireSubmit() {
    const text = (this.data.moodInspireText || '').trim()
    if (!text) {
      wx.showToast({ title: '先写几个字吧', icon: 'none' })
      return
    }
    if (this.data.moodInspireSubmitting) return
    this.setData({ moodInspireSubmitting: true })
    try {
      const { productId, reason } = await api.recommendCoffeeByMood(text)
      let moodResultName = '推荐饮品'
      let moodResultSubtitle = ''
      let moodResultCover = ''
      try {
        const detail = await api.getProductDetail(productId)
        const p = detail && detail.product
        if (p) {
          moodResultName = p.name || moodResultName
          moodResultSubtitle = p.subtitle || ''
          moodResultCover = p.cover || ''
        }
      } catch (_) {}
      const moodResultCelebration = moodCelebrationLine(productId)
      this.setData({
        moodInspireVisible: false,
        moodInspireSubmitting: false,
        moodResultVisible: true,
        moodResultProductId: productId,
        moodResultReason: reason,
        moodResultName,
        moodResultSubtitle,
        moodResultCover,
        moodResultCelebration,
      })
    } catch (e) {
      this.setData({ moodInspireSubmitting: false })
      wx.showToast({
        title: (e && e.message) || '推荐失败，请稍后再试',
        icon: 'none',
      })
    }
  },
  onCloseMoodResult() {
    this.setData({
      moodResultVisible: false,
      moodResultCelebration: '',
    })
  },
  onMoodResultRefine() {
    this.setData({
      moodResultVisible: false,
      moodResultCelebration: '',
      moodInspireVisible: true,
      moodInspireText: '',
    })
  },
  onMoodResultGoDetail() {
    const id = this.data.moodResultProductId
    if (!id) {
      this.setData({ moodResultVisible: false })
      return
    }
    this.setData({ moodResultVisible: false })
    wx.navigateTo({
      url:
        '/subpackages/media/pages/goods/detail?id=' +
        encodeURIComponent(id),
    })
  },
  onPageScroll(e) {
    const y = Math.min(e.scrollTop || 0, 220)
    this.setData({
      heroParallaxY: Math.round(y * -0.06),
    })
  },
})

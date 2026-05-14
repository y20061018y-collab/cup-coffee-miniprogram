const api = require('../../../../services/api.js')
const store = require('../../../../store/index.js')
const cart = require('../../../../utils/cart.js')
const spec = require('../../../../utils/specConfig.js')

/** 包内路径在不同端解析方式不一致，逐个候选尝试后再预览，避免点击后黑屏转圈。 */
function getImageInfoPath(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: (res) => resolve(res.path || src),
      fail: reject,
    })
  })
}

function buildLocalCandidates(src) {
  const raw = (src || '').trim()
  if (!raw) return []
  const clean = raw.replace(/^\/+/, '')
  return Array.from(
    new Set([
      raw, // /images/...
      clean, // images/...
      `/${clean}`, // 标准化前导 /
      `../../${clean}`, // pages/goods/detail -> 项目根
      `../${clean}`,
    ])
  )
}

async function resolveImageForPreview(src) {
  if (!src || typeof src !== 'string') return src
  const s = src.trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  const candidates = buildLocalCandidates(s)
  for (let i = 0; i < candidates.length; i++) {
    try {
      const p = await getImageInfoPath(candidates[i])
      if (p) return p
    } catch (_) {}
  }
  return s
}

function resolvePreviewUrls(urls) {
  return Promise.all((urls || []).map((u) => resolveImageForPreview(u)))
}

Page({
  data: {
    product: { skus: [], tags: [] },
    images: [],
    imgIdx: 0,
    canAdd: false,
    theme: 'light',
    cartCount: 0,
    sheetVisible: false,
    uploadVisible: false,
    upload: { image: null, comment: '', scene: '' },
    imgLoaded: [],
    addOkVisible: false,
    addOk: null,
  },
  onLoad(q) {
    this._id = q.id
    this._unsub = store.subscribe((s) =>
      this.setData({ theme: s.theme, cartCount: s.cartCount })
    )
    const st = store.getState()
    this.setData({ theme: st.theme, cartCount: st.cartCount })
    this._load(q.id)
  },
  onUnload() {
    if (this._unsub) this._unsub()
  },
  async _load(id) {
    const { product } = await api.getProductDetail(id)
    if (!product) {
      wx.showToast({ title: '商品不存在', icon: 'none' })
      return
    }
    const cover = product.cover
    const detail = (product.detailImages || []).filter(Boolean)
    const merged =
      detail.length && cover && detail[0] === cover
        ? [cover, ...detail.slice(1)]
        : [cover, ...detail]
    const images = merged.filter(Boolean)
    this.setData({
      product,
      images,
      imgLoaded: images.map(() => false),
      canAdd: spec.hasStock(product),
    })
  },
  openSkuSheet() {
    if (!this.data.canAdd) {
      wx.showToast({ title: '暂无可售库存', icon: 'none' })
      return
    }
    this.setData({ sheetVisible: true })
  },
  onSheetClose() {
    this.setData({ sheetVisible: false })
  },
  onSheetErr(e) {
    const msg = (e.detail && e.detail.msg) || '无法操作'
    wx.showToast({ title: msg, icon: 'none' })
  },
  onSheetAdd(e) {
    const { price, specKey, specText, skuId, qty } = e.detail
    const { product } = this.data
    const cups = Math.max(1, Number(qty) || 1)
    const r = cart.addLine({
      productId: product.id,
      skuId,
      name: product.name,
      spec: specText,
      specKey,
      price,
      cover: product.cover,
      qty: cups,
    })
    if (!r.ok) {
      wx.showToast({ title: r.msg || '无法加入', icon: 'none' })
      return
    }
    const count = cart.totalCount(cart.read())
    store.setCartCount(count)
    const rowKey = cart.rowKey({
      productId: product.id,
      skuId,
      specKey: specKey || undefined,
    })
    wx.setStorageSync('cup_checkout_keys', [rowKey])
    this.setData({
      sheetVisible: false,
      cartCount: count,
      addOkVisible: true,
      addOk: {
        name: product.name,
        spec: specText,
        cover: product.cover || '',
        qty: cups,
      },
    })
  },

  onAddOkBrowse() {
    this.setData({ addOkVisible: false, addOk: null })
  },

  onAddOkCheckout() {
    this.setData({ addOkVisible: false, addOk: null })
    wx.navigateTo({
      url: '/subpackages/flow/pages/checkout/index',
    })
  },
  onGalleryImgLoad(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx !== idx) return
    this.setData({ [`imgLoaded[${idx}]`]: true })
  },
  onSwiperChange(e) {
    const cur = e.detail && e.detail.current
    if (typeof cur !== 'number') return
    this.setData({ imgIdx: cur })
  },
  onGalleryPreview(e) {
    const urls = (this.data.images || []).filter(Boolean)
    if (!urls.length) return
    let i = Number(e.currentTarget.dataset.idx)
    if (i !== i || i < 0 || i >= urls.length) i = this.data.imgIdx
    resolvePreviewUrls(urls)
      .then((resolved) => {
        wx.previewImage({ current: resolved[i], urls: resolved })
      })
      .catch(() => {
        wx.previewImage({ current: urls[i], urls })
      })
  },
  previewShareImage(e) {
    const { image } = e.currentTarget.dataset
    const urls = (this.data.product.userShares || [])
      .map((item) => item.image)
      .filter(Boolean)
    if (!image || !urls.length) return
    resolvePreviewUrls(urls)
      .then((resolved) => {
        const idx = urls.indexOf(image)
        const current = idx >= 0 ? resolved[idx] : resolved[0]
        wx.previewImage({ current, urls: resolved })
      })
      .catch(() => {
        wx.previewImage({ current: image, urls })
      })
  },

  openUploadSheet() {
    this.setData({ uploadVisible: true })
  },
  closeUploadSheet() {
    this.setData({
      uploadVisible: false,
      upload: { image: null, comment: '', scene: '' },
    })
  },
  chooseUploadImage() {
    const runChoose = () => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const f = res.tempFiles && res.tempFiles[0]
          const path = f && f.tempFilePath
          if (path) this.setData({ 'upload.image': path })
        },
        fail: (err) => {
          const msg = (err && err.errMsg) || ''
          if (/cancel|取消/.test(msg)) return
          wx.showToast({ title: '未能选择图片', icon: 'none' })
        },
      })
    }
    if (typeof wx.requirePrivacyAuthorize === 'function') {
      wx.requirePrivacyAuthorize({
        success: runChoose,
        fail: () => {
          wx.showToast({
            title: '请先同意隐私指引后再选图',
            icon: 'none',
          })
        },
      })
    } else {
      runChoose()
    }
  },
  removeUploadImage(e) {
    e.stopPropagation && e.stopPropagation()
    this.setData({ 'upload.image': null })
  },
  onCommentInput(e) {
    this.setData({ 'upload.comment': e.detail.value })
  },
  onSceneInput(e) {
    this.setData({ 'upload.scene': e.detail.value })
  },
  submitShare() {
    const { upload, product } = this.data
    if (!upload.image) {
      wx.showToast({ title: '请先上传一张图片', icon: 'none' })
      return
    }
    const newShare = {
      id: 'u-' + Date.now(),
      user: '我',
      avatarText: '我',
      image: upload.image,
      comment: upload.comment || upload.scene || '随手一杯',
      tags: upload.scene ? [upload.scene] : [],
    }
    const userShares = [newShare, ...(product.userShares || [])]
    this.setData({ 'product.userShares': userShares })
    this.closeUploadSheet()
    wx.showToast({ title: '分享成功！', icon: 'success' })
  },
})

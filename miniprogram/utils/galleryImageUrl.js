/**
 * 商品主图 / 详情轮播统一输出像素与画幅（Unsplash 动态裁剪）。
 * 本地静态路径无法在此处改尺寸，需包内素材本身一致或改为可带参 CDN。
 */
const GALLERY_W = 1080
const GALLERY_H = 1350
const GALLERY_Q = 80

function normalizeForGallery(url) {
  if (!url || typeof url !== 'string') return url
  const u = url.trim()
  if (!u) return u
  if (/^https?:\/\/images\.unsplash\.com\//i.test(u)) {
    const base = u.split(/[?#]/)[0]
    return `${base}?w=${GALLERY_W}&h=${GALLERY_H}&fit=crop&q=${GALLERY_Q}`
  }
  return u
}

function normalizeProductMedia(p) {
  if (!p) return p
  return {
    ...p,
    cover: normalizeForGallery(p.cover),
    detailImages: (p.detailImages || []).map(normalizeForGallery),
    userShares: (p.userShares || []).map((s) => ({
      ...s,
      image: normalizeForGallery(s.image),
    })),
  }
}

module.exports = {
  normalizeForGallery,
  normalizeProductMedia,
}

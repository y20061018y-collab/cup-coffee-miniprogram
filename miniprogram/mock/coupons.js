const coupons = [
  {
    id: 'cp1',
    name: '首单立减 8 元',
    firstOrderOnly: true,
    offAmount: 8,
    minAmount: 39,
    desc: '满 39 可用',
  },
  {
    id: 'cp2',
    name: '满 59 减 12',
    offAmount: 12,
    minAmount: 59,
    desc: '自提/外带同享',
  },
  {
    id: 'cp3',
    name: '会员 95 折',
    offAmount: 0,
    minAmount: 0,
    desc: '以积分价展示（本演示中按券选择模拟）',
    isMemberPercent: true,
  },
]

function list() {
  return coupons
}

function isEligible(coupon, subtotal, ctx = {}) {
  if (!coupon || (coupon.firstOrderOnly && ctx.hasOrdered)) return false
  return subtotal >= (coupon.minAmount || 0)
}

function ineligibleReason(coupon, subtotal, ctx = {}) {
  if (coupon && coupon.firstOrderOnly && ctx.hasOrdered) return '仅限首单使用'
  if (!coupon || subtotal < (coupon.minAmount || 0)) return '未满足使用门槛'
  return ''
}

function discountFor(coupon, subtotal, ctx = {}) {
  if (!isEligible(coupon, subtotal, ctx)) return 0
  const discount = coupon.isMemberPercent
    ? subtotal * 0.05
    : Math.min(coupon.offAmount, subtotal)
  return Number(discount.toFixed(2))
}

/**
 * @typedef {typeof coupons[0]} Coupon
 */

module.exports = { list, isEligible, ineligibleReason, discountFor }

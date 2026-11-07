const coupons = [
  {
    id: 'cp1',
    name: '首单立减 8 元',
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

function isEligible(coupon, subtotal) {
  return !!coupon && subtotal >= (coupon.minAmount || 0)
}

function discountFor(coupon, subtotal) {
  if (!isEligible(coupon, subtotal)) return 0
  const discount = coupon.isMemberPercent
    ? subtotal * 0.05
    : Math.min(coupon.offAmount, subtotal)
  return Number(discount.toFixed(2))
}

/**
 * @typedef {typeof coupons[0]} Coupon
 */

module.exports = { list, isEligible, discountFor }

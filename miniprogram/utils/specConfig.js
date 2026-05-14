/**
 * 商详半屏规格：选项定义 + 价格/文案/合并键
 * totalPrice = 饮品底价(cup) + 各加料单价之和（依选项）
 */
const TOPPING_UNIT = 3

const GROUPS = {
  cup: {
    key: 'cup',
    title: '杯型',
    single: true,
    options: [
      { id: 'm', name: '中杯' },
      { id: 'l', name: '大杯' },
    ],
  },
  ice: {
    key: 'ice',
    title: '冰度',
    single: true,
    options: [
      { id: 'less', name: '少冰' },
      { id: 'standard', name: '标准冰' },
      { id: 'more', name: '多冰' },
      { id: 'none', name: '去冰' },
    ],
  },
  sweet: {
    key: 'sweet',
    title: '甜度',
    single: true,
    options: [
      { id: 'none', name: '无糖' },
      { id: 'less', name: '少糖' },
      { id: 'standard', name: '标准糖' },
    ],
  },
  caffeine: {
    key: 'caffeine',
    title: '咖啡因',
    single: true,
    options: [
      { id: 'full', name: '全因' },
      { id: 'half', name: '半因' },
      { id: 'decaf', name: '无因' },
    ],
  },
  toppings: {
    key: 'toppings',
    title: '加料',
    single: false,
    optionExtra: TOPPING_UNIT,
    options: [
      { id: 'extra_shot', name: '加一份浓缩', price: 7 },
      { id: 'oat_milk', name: '换燕麦奶', price: 6 },
      { id: 'vanilla_syrup', name: '香草糖浆', price: 2 },
      { id: 'caramel_syrup', name: '焦糖糖浆', price: 2 },
      { id: 'whipped', name: '奶油顶', price: 4 },
    ],
  },
}

const DEFAULT_SEL = {
  cup: 'm',
  ice: 'standard',
  sweet: 'standard',
  caffeine: 'full',
  toppings: [],
}

const LABEL = {
  cup: (id) => ({ m: '中杯', l: '大杯' }[id] || id),
  ice: (id) =>
    ({ less: '少冰', standard: '标准冰', more: '多冰', none: '去冰' }[id] || id),
  sweet: (id) =>
    ({ none: '无糖', less: '少糖', standard: '标准糖' }[id] || id),
  caffeine: (id) =>
    ({ full: '全因', half: '半因', decaf: '无因' }[id] || id),
  topping: (id) =>
    GROUPS.toppings.options.find((o) => o.id === id)?.name || id,
}

/**
 * 饮品底价：按杯型在商品上配置；无杯型时用 singleBasePrice
 * @param {object} product
 * @param {object} sel
 */
function drinkBase(product, sel) {
  if (product.specGroups && product.specGroups.cup === false) {
    return Number(product.singleBasePrice != null ? product.singleBasePrice : product.priceFrom) || 0
  }
  const cup = sel.cup || 'm'
  const map = product.cupBasePrices || { m: product.priceFrom, l: product.priceFrom }
  return Number(map[cup] != null ? map[cup] : product.priceFrom) || 0
}

function toppingUnitPrice(toppingId) {
  const o = GROUPS.toppings.options.find((x) => x.id === toppingId)
  return o && o.price != null ? Number(o.price) : TOPPING_UNIT
}

function totalPrice(product, sel) {
  const base = drinkBase(product, sel)
  const ids = sel.toppings || []
  const topSum = ids.reduce((s, id) => s + toppingUnitPrice(id), 0)
  return base + topSum
}

/**
 * 用于购物车合并唯一键（与商品可选项一致）
 */
function specKey(product, sel) {
  const g = product.specGroups
  const parts = []
  if (!g || g.cup !== false) parts.push(sel.cup)
  if (!g || g.ice) parts.push(sel.ice)
  if (!g || g.sweet) parts.push(sel.sweet)
  if (!g || g.caffeine) parts.push(sel.caffeine)
  if (!g || g.toppings) {
    parts.push((sel.toppings || []).slice().sort().join('.'))
  }
  return parts.join('|')
}

/**
 * specKey 的逆向解析；须与 {@link specKey} 的条件分支顺序一致
 */
function selectionFromSpecKey(product, keyStr) {
  const g = product.specGroups
  const sel = {
    cup: DEFAULT_SEL.cup,
    ice: DEFAULT_SEL.ice,
    sweet: DEFAULT_SEL.sweet,
    caffeine: DEFAULT_SEL.caffeine,
    toppings: [],
  }
  if (!keyStr || keyStr === '') return sel
  const parts = keyStr.split('|')
  let i = 0
  const next = () => parts[i++]
  if (!g || g.cup !== false) sel.cup = next() || sel.cup
  if (!g || g.ice) sel.ice = next() || sel.ice
  if (!g || g.sweet) sel.sweet = next() || sel.sweet
  if (!g || g.caffeine) sel.caffeine = next() || sel.caffeine
  if (!g || g.toppings) {
    const raw = next()
    sel.toppings = raw ? raw.split('.').filter(Boolean) : []
  }
  return sel
}

/**
 * 结算/订单用：与加购时 spec.totalPrice 同源，避免仅信存储里的 price
 */
function unitPriceForLine(product, line) {
  if (!product) return Number(line.price) || 0
  if (line.specKey) {
    const sel = selectionFromSpecKey(product, line.specKey)
    return totalPrice(product, sel)
  }
  if (line.skuId) {
    const sku = (product.skus || []).find((s) => s.id === line.skuId)
    if (sku) return Number(sku.price) || 0
  }
  return Number(line.price) || 0
}

/**
 * 订单/购物车展示用一行文案
 */
function specLine(product, sel) {
  const parts = []
  if (product.specGroups && product.specGroups.cup !== false) {
    parts.push(LABEL.cup(sel.cup))
  }
  if (product.specGroups && product.specGroups.ice) {
    parts.push(LABEL.ice(sel.ice))
  }
  if (product.specGroups && product.specGroups.sweet) {
    parts.push(LABEL.sweet(sel.sweet))
  }
  if (product.specGroups && product.specGroups.caffeine) {
    parts.push(LABEL.caffeine(sel.caffeine))
  }
  if (sel.toppings && sel.toppings.length) {
    const names = sel.toppings.map((id) => LABEL.topping(id))
    parts.push(`+ ${names.join('、')}`)
  }
  if (!parts.length) return '按所选规格'
  return parts.join(' / ')
}

function activeGroupKeys(product) {
  const g = product.specGroups
  if (!g) {
    return ['cup', 'ice', 'sweet', 'caffeine', 'toppings']
  }
  return ['cup', 'ice', 'sweet', 'caffeine', 'toppings'].filter(
    (k) => g[k] !== false
  )
}

function listGroupsForUI(product) {
  const keys = activeGroupKeys(product)
  return keys.map((k) => {
    const def = GROUPS[k]
    return {
      key: k,
      title: def.title,
      single: def.single,
      optionExtra: def.optionExtra,
      options: def.options,
    }
  })
}

/**
 * 默认可点：任一 sku 有库存
 */
function hasStock(product) {
  return (product.skus || []).some((s) => (s.stock || 0) > 0)
}

/**
 * 加车用库存 skuId：演示用主 sku
 */
function inventorySkuId(product) {
  const s0 = (product.skus && product.skus[0]) || {}
  return s0.id || ''
}

module.exports = {
  GROUPS,
  DEFAULT_SEL,
  TOPPING_UNIT,
  drinkBase,
  toppingUnitPrice,
  totalPrice,
  specKey,
  selectionFromSpecKey,
  unitPriceForLine,
  specLine,
  activeGroupKeys,
  listGroupsForUI,
  hasStock,
  inventorySkuId,
}

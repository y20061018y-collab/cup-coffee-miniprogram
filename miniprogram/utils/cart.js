const key = 'cup_cart'
const products = require('../mock/products.js')
const { adjustStock } = products

function read() {
  try {
    const raw = wx.getStorageSync(key)
    return Array.isArray(raw) ? raw : []
  } catch (e) {
    return []
  }
}

function write(list) {
  try {
    wx.setStorageSync(key, list)
  } catch (e) {}
}

function lineMatchKey(l) {
  if (l.specKey) return l.productId + '\0' + l.specKey
  return l.productId + '\0' + l.skuId
}

/**
 * 结算/删除用，与加车一致（保证同品不同规格行可区分）
 */
function rowKey(l) {
  if (l.specKey) return `${l.productId}_sp_${l.specKey}`
  return `${l.productId}_${l.skuId}`
}

function addLine({
  productId,
  skuId,
  name,
  spec,
  price,
  cover = '',
  qty = 1,
  specKey = '',
}) {
  const list = read()
  const incomingKey = specKey ? productId + '\0' + specKey : productId + '\0' + skuId
  const i = list.findIndex((l) => lineMatchKey(l) === incomingKey)
  if (i >= 0) {
    list[i].qty += qty
    if (cover) list[i].cover = cover
  } else {
    const row = { productId, skuId, name, spec, price, cover, qty }
    if (specKey) row.specKey = specKey
    list.push(row)
  }
  if (!adjustStock(skuId, -qty)) {
    return { ok: false, msg: '库存不足' }
  }
  write(list)
  return { ok: true, list }
}

function updateQty(skuId, productId, qty) {
  const list = read()
  const i = list.findIndex(
    (l) =>
      l.skuId === skuId &&
      l.productId === productId &&
      !l.specKey
  )
  if (i < 0) return { ok: false }
  const old = list[i].qty
  const delta = qty - old
  if (delta > 0 && !adjustStock(skuId, -delta)) {
    return { ok: false, msg: '库存不足' }
  }
  if (delta < 0) adjustStock(skuId, -delta)
  if (qty <= 0) list.splice(i, 1)
  else list[i].qty = qty
  write(list)
  return { ok: true, list }
}

function clear() {
  write([])
}

function removeLines(keys, restock = true) {
  const removed = Array.isArray(keys) ? keys : []
  const list = read()
  const next = []
  list.forEach((line) => {
    const rk = rowKey(line)
    if (removed.includes(rk)) {
      if (restock) adjustStock(line.skuId, line.qty)
    } else {
      next.push(line)
    }
  })
  write(next)
  return next
}

const MAX_LINE_QTY = 99

/**
 * 购物车行 +/-（支持 specKey）；库存与 addLine 一致
 * @param {string} rowKeyStr cart.rowKey(line)
 * @param {number} delta +1 / -1
 */
function applyQtyDelta(rowKeyStr, delta) {
  const d = Number(delta) || 0
  if (!d) return { ok: true }
  const list = read()
  const i = list.findIndex((l) => rowKey(l) === rowKeyStr)
  if (i < 0) return { ok: false }
  const line = list[i]
  const nextQty = line.qty + d
  if (nextQty < 1) {
    adjustStock(line.skuId, line.qty)
    list.splice(i, 1)
    write(list)
    return { ok: true }
  }
  if (nextQty > MAX_LINE_QTY && d > 0) {
    return { ok: false, msg: '单款至多 ' + MAX_LINE_QTY + ' 杯' }
  }
  if (d > 0 && !adjustStock(line.skuId, -d)) {
    return { ok: false, msg: '库存不足' }
  }
  if (d < 0) adjustStock(line.skuId, -d)
  line.qty = nextQty
  write(list)
  return { ok: true }
}

/**
 * @param {string} rowKeyStr
 */
function removeRow(rowKeyStr) {
  const list = read()
  const i = list.findIndex((l) => rowKey(l) === rowKeyStr)
  if (i < 0) return { ok: false }
  const line = list[i]
  adjustStock(line.skuId, line.qty)
  list.splice(i, 1)
  write(list)
  return { ok: true }
}

function syncStockWithCart() {
  products.resetInventory()
  const inventory = products.getInventory()
  const list = read()
  const synced = []
  let changed = false

  list.forEach((line) => {
    if (!line || !(line.skuId in inventory)) {
      changed = true
      return
    }
    let qty = Number(line.qty)
    if (!(qty > 0)) {
      changed = true
      return
    }
    if (!adjustStock(line.skuId, -qty)) {
      qty = Math.max(0, products.getInventory()[line.skuId])
      if (qty > 0) adjustStock(line.skuId, -qty)
    }
    if (qty <= 0) {
      changed = true
      return
    }
    if (line.qty !== qty) {
      changed = true
      synced.push({ ...line, qty })
    } else {
      synced.push(line)
    }
  })

  if (changed) write(synced)
  return synced
}

function totalCount(list) {
  return list.reduce((s, l) => s + l.qty, 0)
}

function subtotal(list) {
  return list.reduce((s, l) => s + l.price * l.qty, 0)
}

module.exports = {
  read,
  addLine,
  updateQty,
  clear,
  removeLines,
  applyQtyDelta,
  removeRow,
  syncStockWithCart,
  totalCount,
  subtotal,
  rowKey,
}

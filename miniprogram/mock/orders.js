const key = 'cup_orders'

const SEED_KEY = 'cup_orders_seeded_v2'

function all() {
  try {
    const raw = wx.getStorageSync(key)
    return Array.isArray(raw) ? raw : []
  } catch (e) {
    return []
  }
}

function save(list) {
  try {
    wx.setStorageSync(key, list)
  } catch (e) {}
}

function add(order) {
  const list = all()
  const item = {
    id: 'o' + Date.now(),
    status: 'completed',
    createdAt: new Date().toISOString(),
    ...order,
  }
  list.unshift(item)
  save(list)
  return item
}

function update(id, partial) {
  const list = all()
  const i = list.findIndex((o) => o.id === id)
  if (i < 0) return false
  list[i] = { ...list[i], ...partial }
  save(list)
  return true
}

function remove(id) {
  const prev = all()
  const next = prev.filter((o) => o.id !== id)
  if (next.length === prev.length) return false
  save(next)
  return true
}

function hasUserOrder() {
  return all().some(
    (o) => !String(o.id).startsWith('seed') && o.status !== 'cancelled'
  )
}

/** 首次运行注入三条覆盖三种状态的演示数据 */
function seed() {
  try {
    if (wx.getStorageSync(SEED_KEY)) return
  } catch (e) {}

  const now = Date.now()
  const mockList = [
    {
      id: 'seed001',
      status: 'completed',
      createdAt: new Date(now - 86400000 * 2).toISOString(),
      storeName: '静安 · 久光概念店',
      pickupType: 'store',
      lines: [
        {
          name: '经典美式',
          spec: 'M / 冰',
          qty: 1,
          price: 22,
          cover: '/images/banners/hero-morning-espresso.png',
        },
        {
          name: '可颂三件套',
          spec: '套餐',
          qty: 1,
          price: 46,
          cover: '/images/banners/hero-afternoon-iced-latte.png',
        },
      ],
      subTotal: 68,
      pay: 68,
    },
    {
      id: 'seed002',
      status: 'pending',
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      storeName: '徐汇 · 武康路手冲站',
      pickupType: 'delivery',
      lines: [
        {
          name: '澳白',
          spec: 'M / 热',
          qty: 2,
          price: 28,
          productId: 'p2',
          cover:
            'https://images.unsplash.com/photo-1559496417-e7f25cb247f3',
        },
      ],
      subTotal: 56,
      pay: 56,
    },
    {
      id: 'seed003',
      status: 'cancelled',
      createdAt: new Date(now - 86400000 * 5).toISOString(),
      storeName: '浦东 · 滨江臻选',
      pickupType: 'store',
      lines: [
        {
          name: '耶加雪菲 手冲',
          spec: '手冲',
          qty: 1,
          price: 38,
          productId: 'p3',
          cover: '/images/products/p3-yirgacheffe-carousel-1.png',
        },
      ],
      subTotal: 38,
      pay: 38,
    },
  ]

  const existing = all()
  save([...mockList, ...existing])
  try {
    wx.setStorageSync(SEED_KEY, true)
  } catch (e) {}
}

module.exports = { all, add, update, remove, seed, hasUserOrder }

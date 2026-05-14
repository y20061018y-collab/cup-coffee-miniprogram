const { USE_MOCK, post } = require('./request.js')
const config = require('../config/index.js')
const products = require('../mock/products.js')
const stores = require('../mock/stores.js')
const coupons = require('../mock/coupons.js')
const { normalizeForGallery } = require('../utils/galleryImageUrl.js')

function delay(data, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

/**
 * @typedef {'rules' | 'fallback' | 'llm'} RecommendCoffeeByMoodSource
 */

/**
 * 心情文本推荐一杯咖啡 — 统一返回（Mock / HTTPS / 云函数解析后均应对齐此结构）
 * @typedef {Object} RecommendCoffeeByMoodResult
 * @property {string} productId - 商品 id，必须在 `mock/products` 目录中存在；非法时服务端或 `sanitizeRecommendProductId` 会兜底
 * @property {string} reason - 一句中文推荐理由（规则模板或 LLM 文案）
 * @property {RecommendCoffeeByMoodSource} [source] - 结果来源，便于调试；真实接口正常为 `llm`
 */

/** 无匹配或 LLM 无效 id 时的兜底（计划：澳白） */
const DEFAULT_MOOD_RECOMMEND_PRODUCT_ID = 'p2'

/**
 * @param {string} [productId]
 * @returns {string}
 */
function sanitizeRecommendProductId(productId) {
  const id = typeof productId === 'string' ? productId.trim() : ''
  if (id && products.getById(id)) return id
  const fallback =
    products.getById(DEFAULT_MOOD_RECOMMEND_PRODUCT_ID) ||
    products.getById('p1')
  return fallback ? fallback.id : 'p1'
}

/**
 * @param {string} text
 */
function normalizeMoodInputText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

/**
 * @type {Array<{ test: (normalized: string) => boolean, productId: string, reason: string }>}
 */
const MOOD_TEXT_RULES = [
  {
    test: (n) =>
      /冰|暑|解渴|夏天|三伏|燥热|来杯冰/.test(n) && !/不要冰|去冰|少冰|热饮/.test(n),
    productId: 'p6',
    reason: '你提到了消暑或冰饮感，这杯冰美式清冽顺口，很适合提神醒脑。',
  },
  {
    test: (n) =>
      /低因|脱因|睡不着|晚上喝|咖啡因敏感|不含咖啡因|戒咖啡因/.test(n),
    productId: 'p8',
    reason: '听起来需要控制咖啡因，这杯瑞士水处理低因澳白保留奶咖香气，更适合晚间或敏感体质。',
  },
  {
    test: (n) => /栀子|初夏限定/.test(n),
    productId: 'p9',
    reason: '初夏限定栀子燕麦拿铁，花香清爽配燕麦奶，很适合现在这个时节慢慢喝。',
  },
  {
    test: (n) =>
      /手冲|耶加|雪菲|果酸|花香|慢饮|阅读|周末|层次感/.test(n),
    productId: 'p3',
    reason: '听起来想慢一点、喝出香气层次，手冲耶加雪菲的花果调很适合现在的心情。',
  },
  {
    test: (n) => /燕麦|植物奶|燕麦奶/.test(n),
    productId: 'p7',
    reason: '你提到了燕麦或植物奶，这杯燕麦拿铁香气温和，饱腹感和心情都更柔一点。',
  },
  {
    test: (n) => /卡布|卡布奇诺|厚奶泡|蓬松奶泡/.test(n),
    productId: 'p5',
    reason: '经典奶咖比例和绵密奶泡，卡布奇诺很适合想喝「有咖啡骨架的奶咖」时。',
  },
  {
    test: (n) =>
      /饿|早餐|可颂|轻食|双人|分享|三件套|下午茶/.test(n),
    productId: 'p4',
    reason: '听起来需要一点扎实的搭配，咖啡配可颂的组合省心又好拍。',
  },
  {
    test: (n) =>
      /奶|松弛|治愈|澳白|flatwhite|绵密|温柔|午后|安全感|奶油/.test(n),
    productId: 'p2',
    reason: '你描述的状态很适合一杯绵密澳白，奶香把浓缩包得更温柔。',
  },
  {
    test: (n) =>
      /困|累|加班|熬夜|提神|清醒|早八|通勤|专注|会议|码字|美式|黑咖|浓缩/.test(
        n
      ),
    productId: 'p1',
    reason: '根据你提到的疲惫或需要清醒感，经典美式干净利落，很适合提神但不拖泥带水。',
  },
]

/**
 * Mock：关键词优先级由上至下，未命中则兜底 DEFAULT
 * @param {string} rawText
 * @returns {RecommendCoffeeByMoodResult}
 */
function mockRecommendCoffeeByMood(rawText) {
  const normalized = normalizeMoodInputText(rawText)
  if (!normalized) {
    return {
      productId: sanitizeRecommendProductId(DEFAULT_MOOD_RECOMMEND_PRODUCT_ID),
      reason: '可以先点一杯招牌澳白，喝完再慢慢说今天的心情也不迟。',
      source: 'fallback',
    }
  }
  for (let i = 0; i < MOOD_TEXT_RULES.length; i += 1) {
    const rule = MOOD_TEXT_RULES[i]
    if (rule.test(normalized)) {
      return {
        productId: sanitizeRecommendProductId(rule.productId),
        reason: rule.reason,
        source: 'rules',
      }
    }
  }
  return {
    productId: sanitizeRecommendProductId(DEFAULT_MOOD_RECOMMEND_PRODUCT_ID),
    reason: '没从话里抓到太具体的关键词，先为你选门店很受欢迎的澳白，通常不容易踩雷。',
    source: 'fallback',
  }
}

/**
 * 将后端 / 云函数返回体规范为 {@link RecommendCoffeeByMoodResult}
 * 约定：JSON 可为 `{ productId, reason }` 或 `{ data: { productId, reason } }`
 * @param {*} raw
 * @returns {RecommendCoffeeByMoodResult}
 */
function normalizeRecommendCoffeeByMoodResponse(raw) {
  const obj =
    raw && typeof raw === 'object'
      ? raw.data && typeof raw.data === 'object'
        ? raw.data
        : raw
      : {}
  const reasonIn =
    typeof obj.reason === 'string' && obj.reason.trim()
      ? obj.reason.trim()
      : ''
  /** @type {RecommendCoffeeByMoodSource} */
  let source = 'llm'
  const s = obj.source
  if (s === 'rules' || s === 'fallback' || s === 'llm') source = s
  return {
    productId: sanitizeRecommendProductId(obj.productId),
    reason:
      reasonIn ||
      '为你挑了这杯，点开详情看看是否符合今天的心情。',
    source,
  }
}

/**
 * @param {string} input
 * @returns {Promise<RecommendCoffeeByMoodResult>}
 */
function recommendCoffeeByMoodCloud(input) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
      reject(new Error('请使用支持云开发的基础库并上传云函数 recommendByMood'))
      return
    }
    wx.cloud.callFunction({
      name: 'recommendByMood',
      data: { text: input },
      success(res) {
        const r = res && res.result
        if (r && r.ok && r.productId) {
          resolve(normalizeRecommendCoffeeByMoodResponse(r))
          return
        }
        reject(new Error((r && r.errMsg) || '云函数返回异常'))
      },
      fail(err) {
        const msg =
          (err && err.errMsg) ||
          (err && err.message) ||
          '调用云函数失败，请检查是否已上传 recommendByMood'
        reject(new Error(msg))
      },
    })
  })
}

/**
 * 根据用户输入的一句心情，推荐一杯咖啡（Mock 为本地规则；非 Mock 走 HTTPS，云函数可在网关后暴露同路径）
 * @param {string} text
 * @returns {Promise<RecommendCoffeeByMoodResult>}
 */
async function recommendCoffeeByMood(text) {
  const input = String(text ?? '').trim()
  if (config.MOOD_RECOMMEND_SOURCE === 'cloud') {
    return recommendCoffeeByMoodCloud(input)
  }
  if (USE_MOCK) {
    return delay(mockRecommendCoffeeByMood(input))
  }
  const raw = await post('/v1/coffee/recommend', { text: input })
  return normalizeRecommendCoffeeByMoodResponse(raw)
}

async function getHome() {
  if (USE_MOCK) {
    return delay({
      // 包内咖啡主题 Banner（原随机占位图与咖啡无关，已换为 Pexels 豆/杯素材）
      banners: [
        {
          id: 'b1',
          image: '/images/banners/hero-morning-espresso.png',
          link: '/pages/category/index',
        },
        {
          id: 'b2',
          image: '/images/banners/hero-afternoon-iced-latte.png',
          link: '/subpackages/media/pages/goods/detail?id=p2',
        },
      ],
      // 首页顶部三张心情轮播（晨光 / 午后图默认为占位文件，可直接替换同路径 PNG）
      heroSlides: [
        {
          id: 'rain',
          label: 'TODAY MOOD',
          title: '雨天适合一杯低因拿铁',
          desc: '奶泡、胶片色和一点慢下来的香气',
          image: '/images/banners/hero-today-mood-rainy-latte.png',
        },
        {
          id: 'morning',
          label: 'MORNING LIGHT',
          title: '晨光里先提神一点点',
          desc: '短萃或美式，把睡意留在窗外',
          image: '/images/banners/hero-morning-espresso.png',
        },
        {
          id: 'afternoon',
          label: 'AFTERNOON CHILL',
          title: '午后适合一杯冰奶咖',
          desc: '冰块、甜香奶泡和慢慢喝的时间',
          image: '/images/banners/hero-afternoon-iced-latte.png',
        },
      ],
      // 上镜款固定四款，避免新增商品挤掉推荐位
      recommended: products.getByIds(['p1', 'p5', 'p2', 'p4']),
    })
  }
  // const { get } = require('./request')
  // return get('/v1/home')
  return delay({ banners: [], recommended: [], heroSlides: [] })
}

async function getProductDetail(id) {
  if (USE_MOCK) {
    return delay({ product: products.getById(id), related: products.getRecommended().filter((p) => p.id !== id).slice(0, 2) })
  }
  return delay({ product: null, related: [] })
}

async function getProductsByIds(ids) {
  if (USE_MOCK) {
    return delay({ list: products.getByIds(ids || []) })
  }
  return delay({ list: [] })
}

async function getCategoryList() {
  if (USE_MOCK) {
    const categories = [...products.categories].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    )
    return delay({ categories })
  }
  return delay({ categories: [] })
}

async function searchProducts(keyword) {
  if (USE_MOCK) {
    return delay({ list: products.searchProducts(keyword) })
  }
  // const { get } = require('./request')
  // return get('/v1/products', { q: keyword })
  return delay({ list: [] })
}

async function getProductList(categoryId) {
  if (USE_MOCK) {
    return delay({ list: products.getByCategory(categoryId) })
  }
  return delay({ list: [] })
}

async function getStoreList() {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success(res) {
          resolve({ list: stores.getStoresSorted(res.latitude, res.longitude) })
        },
        fail() {
          resolve({ list: stores.getStoresSorted() })
        },
      })
    })
  }
  return { list: [] }
}

module.exports = {
  getHome,
  getProductDetail,
  getProductsByIds,
  getCategoryList,
  searchProducts,
  getProductList,
  getStoreList,
  recommendCoffeeByMood,
  config,
}

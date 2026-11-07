/**
 * 商品 + SKU + 动态库存（内存模拟，可配合 api 落库）
 */
const { normalizeProductMedia } = require('../utils/galleryImageUrl.js')

const categories = [
  { id: 'c1', name: '经典黑咖', sort: 1 },
  { id: 'c4', name: '绵密奶咖', sort: 2 },
  { id: 'c2', name: '手冲甄选', sort: 3 },
  { id: 'c3', name: '轻食烘焙', sort: 4 },
  { id: 'c5', name: '无咖啡因 / 茶饮', sort: 5 },
  { id: 'c6', name: '季节限定', sort: 6 },
]

const INITIAL_INVENTORY = Object.freeze({
  s1: 32,
  s2: 18,
  s3: 9,
  s4: 24,
  s5: 15,
  s6: 40,
  s7: 14,
  s8: 22,
  s9: 26,
  s10: 20,
  s11: 18,
  s12: 16,
  s13: 20,
  s14: 18,
  s15: 16,
  s16: 14,
})
let inventory = { ...INITIAL_INVENTORY }

const products = [
  {
    id: 'p1',
    name: '经典美式',
    subtitle: '低酸平衡 · 中深烘',
    categoryId: 'c1',
    cover:
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7',
    priceFrom: 22,
    tags: ['热销', '低卡'],
    isNew: false,
    story: {
      flavor: ['黑巧', '烤坚果', '轻微焦糖'],
      scene: '通勤路上、会议前的清醒开场',
      reason: '入口干净利落，适合想要咖啡香但不想有负担的一杯。',
      drink: '推荐少冰、无糖；饭后或午后饮用更能感到中深烘的回甘。',
    },
    userShares: [
      {
        id: 'p1-u1',
        user: '早八通勤人',
        avatarText: '早',
        image:
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
        comment: '少冰无糖很清爽，杯子实物比商品图更有咖啡香。',
        tags: ['少冰', '无糖', '通勤'],
      },
      {
        id: 'p1-u2',
        user: '会议前来一杯',
        avatarText: '会',
        image:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        comment: '颜色很干净，拍桌面照很好看，苦味不会太冲。',
        tags: ['桌面照', '低酸'],
      },
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    ],
    skus: [
      { id: 's1', label: '中杯 冰', price: 22, spec: 'M / 冰' },
      { id: 's2', label: '大杯 热', price: 26, spec: 'L / 热' },
    ],
    /** 半屏规格：杯型不展示单价；总价 = 饮品底价 + 各加料单价之和（见 utils/specConfig.js GROUPS.toppings） */
    cupBasePrices: { m: 22, l: 26 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p2',
    name: '澳白',
    subtitle: '更绵密奶泡 · 香气突出',
    categoryId: 'c4',
    cover: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3',
    priceFrom: 28,
    tags: ['奶咖', '门店同款'],
    isNew: true,
    story: {
      flavor: ['绵密奶泡', '榛果香', '奶油感'],
      scene: '午后松弛、约会聊天、慢慢散步',
      reason: '浓缩的香气被细腻奶泡包住，拍起来温柔，喝起来也很有安全感。',
      drink: '建议热饮、标准甜；想要更轻盈可以选择燕麦奶加料。',
    },
    userShares: [
      {
        id: 'p2-u1',
        user: '奶泡收藏家',
        avatarText: '奶',
        image: '/images/products/p7-oat-latte-carousel-1.png',
        comment: '热澳白拉花很稳定，奶泡细腻，适合坐下来慢慢喝。',
        tags: ['热饮', '拉花', '奶咖'],
      },
      {
        id: 'p2-u2',
        user: '午后松弛一下',
        avatarText: '午',
        image: '/images/products/p8-decaf-flatwhite-carousel-1.png',
        comment: '标准甜刚好，拍出来是奶油色调，和甜点放一起很好看。',
        tags: ['标准甜', '下午茶'],
      },
    ],
    detailImages: [],
    skus: [
      { id: 's3', label: '中杯 热', price: 28, spec: 'M / 热' },
      { id: 's4', label: '大杯 冰', price: 32, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 28, l: 32 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p5',
    name: '卡布奇诺',
    subtitle: '奶泡细腻 · 经典之选',
    categoryId: 'c4',
    cover: '/images/products/p5-cappuccino-carousel-3.png',
    priceFrom: 28,
    tags: ['奶咖', '经典'],
    isNew: true,
    story: {
      flavor: ['绵密奶泡', '可可香', '坚果感'],
      scene: '上午开会前、午休后的温柔补充',
      reason: '传统奶咖比例，奶泡蓬松细腻，入口顺滑而有咖啡骨架。',
      drink: '推荐热饮、少糖；想更突出咖啡感可选浅一层奶泡备注。',
    },
    userShares: [
      {
        id: 'p5-u1',
        user: '经典奶咖控',
        avatarText: '卡',
        image:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        comment: '奶泡厚度刚好，撒可可粉很香，适合慢慢喝不腻。',
        tags: ['热饮', '奶泡', '经典'],
      },
      {
        id: 'p5-u2',
        user: '桌面办公搭子',
        avatarText: '桌',
        image:
          'https://images.unsplash.com/photo-1511920170033-f8396924c348',
        comment: '比拿铁更有「咖啡味」，配键盘噪音刚好续命。',
        tags: ['办公', '中深烘'],
      },
    ],
    detailImages: [
      '/images/products/p5-cappuccino-carousel-3.png',
      '/subpackages/media/images/products/p5-cappuccino-carousel-4.png',
    ],
    skus: [
      { id: 's7', label: '中杯 热', price: 28, spec: 'M / 热' },
      { id: 's8', label: '大杯 冰', price: 32, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 28, l: 32 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p6',
    name: '冰美式',
    subtitle: '冰爽清冽，提神首选',
    categoryId: 'c1',
    cover: '/images/products/p6-iced-americano-carousel-1.png',
    priceFrom: 22,
    tags: ['清爽', '提神'],
    isNew: true,
    story: {
      flavor: ['清澈口感', '低酸明亮', '咖啡本味'],
      scene: '午后犯困、久坐码字、需要立刻清醒的一刻',
      reason: '冰块拉长香气层次，入口干净不拖沓，像给大脑按了一下刷新键。',
      drink: '推荐少冰、无糖；想要更柔和可选单份奶少量融合口感。',
    },
    userShares: [
      {
        id: 'p6-u1',
        user: '冰镇续命党',
        avatarText: '冰',
        image:
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
        comment: '第一口就很醒，冰没化之前风味最干净，适合立刻开会前。',
        tags: ['少冰', '提神', '办公'],
      },
      {
        id: 'p6-u2',
        user: '桌面清屏搭档',
        avatarText: '清',
        image:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        comment: '比奶咖更利索，放电脑旁拍照也高级，夏天离不开。',
        tags: ['冰饮', '清爽'],
      },
    ],
    detailImages: [
      '/images/products/p6-iced-americano-carousel-1.png',
      '/subpackages/media/images/products/p6-iced-americano-carousel-2.png',
    ],
    skus: [
      { id: 's9', label: '中杯 冰', price: 22, spec: 'M / 冰' },
      { id: 's10', label: '大杯 冰', price: 26, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 22, l: 26 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p7',
    name: '燕麦拿铁',
    subtitle: '植物奶首选，轻盈不腻',
    categoryId: 'c4',
    cover: '/images/products/p7-oat-latte-carousel-1.png',
    priceFrom: 30,
    tags: ['植物奶', '轻盈'],
    isNew: true,
    story: {
      flavor: ['燕麦谷物香', '绵密奶泡', '柔和甜感'],
      scene: '久坐办公、想喝奶咖又不想厚重的午后',
      reason: '燕麦奶自带清甜与顺滑，和咖啡的苦韵叠在一起刚好不腻。',
      drink: '推荐热饮、标准甜；冰饮更清爽，想要更「干净」可选少糖。',
    },
    userShares: [
      {
        id: 'p7-u1',
        user: '植物奶常驻',
        avatarText: '燕',
        image:
          'https://images.unsplash.com/photo-1511920170033-f8396924c348',
        comment: '比普通拿铁轻一点，喝完喉咙不糊，拉花也还稳。',
        tags: ['热饮', '植物奶', '办公'],
      },
      {
        id: 'p7-u2',
        user: '续命不踩雷',
        avatarText: '续',
        image:
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
        comment: '谷物香很自然，配键盘与木纹桌都很上镜，适合截图发群。',
        tags: ['轻盈', '奶咖'],
      },
    ],
    detailImages: [
      '/images/products/p7-oat-latte-carousel-1.png',
      '/subpackages/media/images/products/p7-oat-latte-carousel-2.png',
    ],
    skus: [
      { id: 's11', label: '中杯 热', price: 30, spec: 'M / 热' },
      { id: 's12', label: '大杯 冰', price: 34, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 30, l: 34 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p3',
    name: '耶加雪菲 手冲',
    subtitle: '柑橘与花香',
    categoryId: 'c2',
    cover: '/images/products/p3-yirgacheffe-carousel-1.png',
    priceFrom: 38,
    tags: ['限定豆'],
    isNew: true,
    story: {
      flavor: ['柑橘', '白花', '蜂蜜尾韵'],
      scene: '安静阅读、灵感整理、周末慢早餐',
      reason: '花果香清亮，像把清晨的光感放进杯子里，适合做内容截图主角。',
      drink: '推荐热饮、无糖；先闻香气再入口，冷却后果酸会更明显。',
    },
    userShares: [
      {
        id: 'p3-u1',
        user: '手冲慢慢喝',
        avatarText: '手',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
        comment: '热的时候花香明显，冷一点后果酸更亮，适合边看书边喝。',
        tags: ['热饮', '无糖', '阅读'],
      },
      {
        id: 'p3-u2',
        user: '周末咖啡桌',
        avatarText: '周',
        image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096',
        comment: '实物颜色很清透，不像奶咖那么厚重，早上喝很舒服。',
        tags: ['清透', '周末'],
      },
    ],
    detailImages: [
      '/images/products/p3-yirgacheffe-carousel-1.png',
      '/subpackages/media/images/products/p3-yirgacheffe-carousel-2.png',
    ],
    skus: [
      { id: 's5', label: '单份 热', price: 38, spec: '手冲' },
    ],
    singleBasePrice: 38,
    specGroups: {
      cup: false,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
  {
    id: 'p4',
    name: '可颂三件套',
    subtitle: '咖啡 + 可颂 组合更省',
    categoryId: 'c3',
    cover: '/images/products/p4-croissant-set-carousel-1.png',
    priceFrom: 46,
    tags: ['组合', '高转化'],
    isNew: false,
    story: {
      flavor: ['黄油香', '麦香', '酥皮甜感'],
      scene: '早餐补给、下午茶分享、轻食加班餐',
      reason: '咖啡与可颂一起出现，天然有生活方式画面，适合展示客单价组合。',
      drink: '建议搭配热澳白或少冰美式；三件套适合两人分享。',
    },
    userShares: [
      {
        id: 'p4-u1',
        user: '窗边双人拉',
        avatarText: '窗',
        image: '/subpackages/media/images/products/p4-usershare-sharing.png',
        comment:
          '两人吃一套刚好：他递我热奶咖、我掰可颂分他一半，冰饮也在桌上，阳光照进来怎么拍都像在店里度假。',
        tags: ['分享', '双人'],
      },
      {
        id: 'p4-u2',
        user: '酥皮脑袋',
        avatarText: '酥',
        image: '/subpackages/media/images/products/p4-usershare-crunch.png',
        comment:
          '一撕开酥屑就弹起来，外壳脆、里面层层黄油香，背景那杯拉花端过来刚好接住，馋虫瞬间被勾起来。',
        tags: ['酥脆', '黄油香'],
      },
    ],
    detailImages: [
      '/images/products/p4-croissant-set-carousel-1.png',
      '/subpackages/media/images/products/p4-croissant-set-carousel-2.png',
    ],
    skus: [
      { id: 's6', label: '默认', price: 46, spec: '套餐' },
    ],
    singleBasePrice: 46,
    specGroups: {
      cup: false,
      ice: false,
      sweet: false,
      caffeine: false,
      toppings: true,
    },
  },
  {
    id: 'p8',
    name: '低因澳白',
    subtitle: '瑞士水处理低因 · 夜晚也能喝',
    categoryId: 'c5',
    cover: '/images/products/p8-decaf-flatwhite-carousel-1.png',
    priceFrom: 30,
    tags: ['低因', '门店同款'],
    isNew: true,
    story: {
      flavor: ['绵密奶泡', '焦糖柔和', '巧克力尾韵'],
      scene: '晚间小酌、咖啡因敏感、想喝奶咖又怕睡不着',
      reason: '瑞士水处理降低咖啡因，保留澳白的顺滑与香气，夜里也能温柔收尾。',
      drink: '推荐热饮、标准甜；冰饮更清爽，不建议再加浓缩以免抵消低因意义。',
    },
    userShares: [
      {
        id: 'p8-u1',
        user: '晨光轻早餐',
        avatarText: '晨',
        image: '/subpackages/media/images/products/p8-usershare-breakfast.png',
        comment:
          '司康配低因澳白当早餐刚好，奶泡绵、拉花也温柔，吃完开工不心慌。',
        tags: ['早餐', '低因'],
      },
      {
        id: 'p8-u2',
        user: '下班慢慢喝',
        avatarText: '夜',
        image: '/subpackages/media/images/products/p8-usershare-afterwork.png',
        comment:
          '站了一天就想来杯奶咖，低因版澳白顺口不涩，晚上喝也不怕睡不着。',
        tags: ['下班后', '放松'],
      },
    ],
    detailImages: [
      '/images/products/p8-decaf-flatwhite-carousel-1.png',
      '/subpackages/media/images/products/p8-decaf-flatwhite-carousel-2.png',
    ],
    skus: [
      { id: 's13', label: '中杯 热', price: 30, spec: 'M / 热' },
      { id: 's14', label: '大杯 冰', price: 34, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 30, l: 34 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: false,
      toppings: true,
    },
  },
  {
    id: 'p9',
    name: '栀子燕麦拿铁（初夏限定）',
    subtitle: '栀子花香 · 燕麦奶清爽',
    categoryId: 'c6',
    cover: '/images/products/p9-gardenia-carousel-1.png',
    priceFrom: 32,
    tags: ['限定', '新品'],
    isNew: true,
    story: {
      flavor: ['栀子清香', '燕麦谷物', '淡甜尾韵'],
      scene: '初夏午后、散步街拍、想喝点不一样的奶咖',
      reason: '时令栀子风味与燕麦奶叠在一起，清爽不腻，限定档期喝完再等一年。',
      drink: '推荐少冰、标准甜；热饮花香更明显，冰饮更解暑。',
    },
    userShares: [
      {
        id: 'p9-u1',
        user: '初夏街拍搭子',
        avatarText: '栀',
        image: '/subpackages/media/images/products/p9-usershare-street.png',
        comment: '杯子拿在手里颜色很温柔，花香不假甜，适合发朋友圈。',
        tags: ['限定', '冰饮'],
      },
      {
        id: 'p9-u2',
        user: '燕麦奶忠实粉',
        avatarText: '燕',
        image: '/subpackages/media/images/products/p9-usershare-oatfan.png',
        comment: '比普通燕麦拿铁多一层花香，和店里绿植背景很搭。',
        tags: ['燕麦', '拍照'],
      },
    ],
    detailImages: [
      '/images/products/p9-gardenia-carousel-1.png',
      '/subpackages/media/images/products/p9-gardenia-carousel-2.png',
    ],
    skus: [
      { id: 's15', label: '中杯 热', price: 32, spec: 'M / 热' },
      { id: 's16', label: '大杯 冰', price: 36, spec: 'L / 冰' },
    ],
    cupBasePrices: { m: 32, l: 36 },
    specGroups: {
      cup: true,
      ice: true,
      sweet: true,
      caffeine: true,
      toppings: true,
    },
  },
]

function getInventory() {
  return { ...inventory }
}

function resetInventory() {
  inventory = { ...INITIAL_INVENTORY }
}

function adjustStock(skuId, delta) {
  if (!(skuId in inventory)) return false
  const next = inventory[skuId] + delta
  if (next < 0) return false
  inventory[skuId] = Math.min(next, INITIAL_INVENTORY[skuId])
  return true
}

function withStock(list) {
  return list.map((p) => {
    const n = normalizeProductMedia(p)
    return {
      ...n,
      skus: p.skus.map((k) => ({
        ...k,
        stock: inventory[k.id] ?? 0,
      })),
    }
  })
}

/**
 * 智能推荐排序：销量权重 + 库存可见性 + 新品
 */
function recommendScore(p) {
  const skus = p.skus || []
  const stock = skus.reduce(
    (sum, k) => sum + (inventory[k.id] ?? 0),
    0
  )
  const hot = p.tags && p.tags.includes('热销') ? 12 : 0
  const combo = p.tags && p.tags.includes('组合') ? 6 : 0
  const fresh = p.isNew ? 8 : 0
  return hot + combo + fresh + Math.min(10, stock * 0.15)
}

function getRecommended() {
  const list = withStock(products).sort(
    (a, b) => recommendScore(b) - recommendScore(a)
  )
  return list
}

function getByCategory(categoryId) {
  if (!categoryId) return withStock(products)
  return withStock(products.filter((p) => p.categoryId === categoryId))
}

/** 关键词搜索 name / subtitle / tags；英文大小写不敏感 */
function searchProducts(keyword) {
  const k = String(keyword || '').trim()
  if (!k) return []
  const kLower = k.toLowerCase()
  const haystack = (s) => String(s || '').toLowerCase().includes(kLower)
  const filtered = products.filter((p) => {
    if (haystack(p.name) || haystack(p.subtitle)) return true
    const tags = p.tags || []
    return tags.some((t) => haystack(t))
  })
  return withStock(filtered)
}

function getById(id) {
  const p = products.find((x) => x.id === id)
  if (!p) return null
  const [one] = withStock([p])
  return one
}

/** 按传入 id 顺序返回，跳过不存在的 id */
function getByIds(ids) {
  if (!ids || !ids.length) return []
  const out = []
  for (let i = 0; i < ids.length; i++) {
    const p = getById(ids[i])
    if (p) out.push(p)
  }
  return out
}

module.exports = {
  categories,
  getRecommended,
  getByCategory,
  searchProducts,
  getById,
  getByIds,
  getInventory,
  resetInventory,
  adjustStock,
  withStock,
  recommendScore,
}

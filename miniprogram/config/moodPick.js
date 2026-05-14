/**
 * 首页心情入口 → 可选商品 id（顺序即展示顺序）
 * 与 pages/index 中 mood id 一致
 */
const MOOD_PICK = {
  work: {
    title: '工作续命',
    note: '低酸清醒 · 专注提神',
    productIds: ['p1', 'p2', 'p5', 'p6', 'p7'], // 经典美式、澳白、卡布、冰美式、燕麦拿铁
  },
  morning: {
    title: '早起清醒',
    note: '果酸明亮',
    productIds: ['p1', 'p3'],
  },
  relax: {
    title: '午后松弛',
    note: '奶咖治愈',
    productIds: ['p2', 'p4'],
  },
  focus: {
    title: '深度专注',
    note: '干净高醇',
    productIds: ['p1', 'p3'],
  },
  date: {
    title: '约会氛围',
    note: '适合截图',
    productIds: ['p2', 'p3'],
  },
  warm: {
    title: '降温暖胃',
    note: '热饮醇厚',
    productIds: ['p2', 'p3'],
  },
  decaf: {
    title: '夜晚低因',
    note: '轻负担',
    productIds: ['p2', 'p1'],
  },
  cool: {
    title: '消暑解渴',
    note: '气泡/冷萃清爽',
    productIds: ['p1', 'p3'],
  },
}

function getMoodPick(moodId) {
  if (!moodId) return null
  return MOOD_PICK[moodId] || null
}

module.exports = {
  MOOD_PICK,
  getMoodPick,
}

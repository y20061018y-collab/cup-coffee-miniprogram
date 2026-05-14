/**
 * 运行配置：Mock 与真实 API 可切换
 */
const USE_MOCK = true
const API_BASE = 'https://api.example.com' // 对接时替换

/** 心情推荐：`cloud` = 云函数 recommendByMood（默认仅关键词规则，与 mock 一致；大模型需在云端设 MOOD_USE_LLM=1）；`mock` = 小程序内规则 */
const MOOD_RECOMMEND_SOURCE = 'mock'
/**
 * 云环境 ID。留空时依次尝试：envList.js 的 envList[0].envId、开发者工具当前选中的云环境。
 * 确认已开通云开发：工具栏「云开发」→ 控制台顶部可复制环境 ID。
 */
const CLOUD_ENV_ID = ''

module.exports = {
  USE_MOCK,
  API_BASE,
  MOOD_RECOMMEND_SOURCE,
  CLOUD_ENV_ID,
  appName: 'CUP 精品咖啡',
  /** 主色 — 与 app.wxss 变量保持语义一致 */
  brandColor: '#2C1810',
}

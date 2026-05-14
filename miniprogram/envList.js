/**
 * 云开发环境（与微信开发者工具「云开发」面板一致）。
 * 开通后把环境 ID 填到下面任一条，或在 config/index.js 的 CLOUD_ENV_ID 填写（config 优先）。
 * @type {{ envId: string, alias?: string }[]}
 */
const envList = [
  // { envId: 'cloud1-xxxxx', alias: 'dev' },
]
const isMac = false
module.exports = {
  envList,
  isMac,
}

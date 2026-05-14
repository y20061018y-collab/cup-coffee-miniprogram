/**
 * 原生导航栏 / TabBar / 窗口背景色，与 app.wxss 中设计 token 保持一致。
 * 仅 frontColor 支持 #000000 / #ffffff（微信限制）。
 */
module.exports = {
  light: {
    navFrontColor: '#000000',
    navBgColor: '#F5F0E8',
    bgColor: '#F5F0E8',
    tabBar: {
      color: '#7A6D63',
      selectedColor: '#2C1810',
      backgroundColor: '#FDFCFA',
      borderStyle: 'white',
    },
  },
  dark: {
    navFrontColor: '#ffffff',
    navBgColor: '#121212',
    bgColor: '#121212',
    tabBar: {
      color: '#7A726A',
      selectedColor: '#D4A574',
      backgroundColor: '#1E1E1E',
      borderStyle: 'black',
    },
  },
}

# CUP 精品咖啡 · 微信小程序

对标连锁咖啡类小程序的「作品级」实现：强调极简高级 UI、清晰信息架构、可量化转化路径（加购/券/自提/订单），并内置 **Mock / 真接口可切换** 与 **隐藏开发者展示页**。

## 1. 项目目录结构

```
miniprogram/
  app.js, app.json, app.wxss, sitemap.json
  config/index.js          # USE_MOCK、API_BASE
  services/
    request.js            # 统一 request（关 Mock 时走真接口）
    api.js                # 业务入口：内部分支 mock 或 远程
  store/index.js          # 全局状态（用户/主题/门店/角标/选中券）
  mock/
    products.js           # 商品、SKU、动态库存、推荐排序
    stores.js             # 门店 + 距离排序
    coupons.js, orders.js
  utils/cart.js           # 购物车 + 与库存扣减联动
  components/
    banner-swiper, home-skeleton, product-card
  pages/
    index/                # 首页（定制导航、骨架屏、推荐）
    category/             # 双栏分类
    goods/                # 详情（多规格 SKU）
    cart/, user/, store-pick/
  subpackages/flow/
    pages/checkout/       # 券与实付
    pages/orders/         # 订单列表
    pages/dev-showcase/   # 隐藏：作品说明
  images/tabs/            # Tab 图标占位（可替换 81×81 品牌图）
```

## 2. 页面与分包

| 类型 | 路径 | 说明 |
|------|------|------|
| Tab | `pages/index/index` | 品牌首屏、Banner、智能推荐、门店入口 |
| Tab | `pages/category/index` | 左类右货 |
| Tab | `pages/cart/index` | 购物车、去结算 |
| Tab | `pages/user/index` | 模拟登录、积分与等级、深色模式、订单/门店 |
| 主包 | `pages/goods/detail` | 规格、库存、相关推荐 |
| 主包 | `pages/store-pick/index` | 门店按距离（含定位，失败用默认点） |
| 分包 `flow` | `checkout` / `orders` / `dev-showcase` | 结算与订单、作品说明；`preloadRule` 从购物车预拉 `flow` |

**隐藏页入口**：`我的` 中连点「关于」三次，或 **长按** 用户卡片区域。

## 3. 核心代码入口

- **Mock / API 切换**：`miniprogram/config/index.js` 中 `USE_MOCK = true/false`；`services/api.js` 在 `false` 时按注释改为 `get/post` 请求。
- **全局状态**：`store/index.js` 提供 `getState` / `subscribe` / `setUser` / `setTheme` / `setStore` 等；`app.js` 在主题变更时联动导航栏与 Tab 样式。
- **推荐算法**：`mock/products.js` 中 `recommendScore` 综合标签（热销/组合）、新品、库存可见性。

## 4. 技术选型说明

| 项 | 选择 | 原因 |
|----|------|------|
| 框架 | 原生小程序 + 自研轻量 store | 便于甲方交付与无构建依赖，突出工程能力 |
| 数据 | Mock + 可切换 `request` | 演示可离线跑通，上线接 API 时改一层 |
| 结构 | 主包 + `flow` 分包 | 控制首包体积，结算链路透预加载 |
| 体验 | 骨架屏、图片 lazy、tap 微动效 | 首屏可感知与商业质感 |

## 5. UI 与转化建议

- **视觉**：米白/深咖底 + 单一强调色，少边框、大留白、大圆角，文字层级用字重/字号而不是过多颜色。
- **转化动线**：首屏强门店/自提 → 智能推荐与「组合」品曝光 → 详情 SKU 与库存制造稀缺 → 结算页突出实付与券（已选状态）。
- **合规**：外网图片需在[微信公众平台 - 开发 - 开发管理 - 服务器域名]配置 `downloadFile` 合法域名，本地开发可开「不校验合法域名」。

## 原云能力

若需使用云开发，在 `app.js` 的 `env` 填入云环境 ID，并恢复云函数上传流程；本演示主链路不依赖云。

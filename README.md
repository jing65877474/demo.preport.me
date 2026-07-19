# 谢雅丽作品集网页

## 打开方式

双击 `index.html` 即可在浏览器中查看作品集。

建议使用最新版 Chrome 或 Edge 浏览器，并保持目录结构不变，避免图片、视频和样式文件丢失。

## 文件说明

- `index.html`：网页入口
- `styles.css`：主样式
- `experience.css`：个人介绍页样式
- `collage-arc.css`：拼贴页样式
- `card-radius-system.css`：卡片圆角规范
- `border-glow.css`：卡片边框发光效果
- `script.js`：网页交互与动画
- `assets/`：作品图片素材
- `assets/images/main-images/`：主图素材，页面引用使用 WebP
- `assets/images/detail-pages/`：详情页长图素材，页面引用使用 WebP
- `assets/images/posters/`：海报活动素材，页面引用使用 WebP
- `assets/images/ui/`：标题手写字等界面素材，页面引用使用透明 WebP
- `assets/videos/`：首屏视频素材，页面优先引用 WebM
- `docs/`：页面布局与维护规范
- `docs/main-image-screen-design-spec.md`：主图设计屏的视觉、比例与响应式规范
- `docs/performance-mobile-optimization-spec.md`：性能与手机端适配规范
- `mq9h0l3n-image.webp`：首屏及个人介绍图片的页面引用版本

## 图片素材规则

- 项目内新增或替换图片时，先转换为 WebP 格式，再写入 HTML / CSS 引用。
- 首页海报素材统一放在 `assets/images/posters/`，文件名使用英文和数字，例如 `poster-01.webp`。
- 保留原始素材在外部素材目录即可，项目内页面引用优先使用 `.webp`，减少首屏加载体积。

## 维护规则

- 优化动效时只调整运行策略和性能，不改变页面区块顺序、锚点 ID 和主要布局结构。
- 修改 `styles.css` 或 `script.js` 后，同步递增 `index.html` 中的 `?v=` 版本号。
- 修改 `#works-wall` 主图设计屏时，优先遵守 `docs/main-image-screen-design-spec.md`，不得破坏已确认的标题逐字间距与 2560 × 1440 比例基准。
- 手机端适配和性能规则记录在 `docs/performance-mobile-optimization-spec.md`，后续修改优先按该文档检查。

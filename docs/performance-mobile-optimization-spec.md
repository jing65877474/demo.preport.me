# 性能与手机端适配维护规范

## 适用范围

本规范适用于当前静态作品集页面：

- `index.html`：页面结构、素材引用和版本号
- `styles.css`：全站主视觉、首屏海报墙和手机端稳定层
- `script.js`：首屏轮播、拼贴屏、3D 作品墙和指针交互
- `collage-arc.css`、`card-radius-system.css`、`border-glow.css`：独立视觉模块

优化原则是保持现有布局结构、区块顺序、锚点 ID 和内容层级不变，只调整性能、动效运行方式、素材加载和响应式细节。

## 动画运行规则

页面内高频动画必须遵守以下规则：

1. 使用 `requestAnimationFrame` 的模块只在对应区块进入视口时运行。
2. 页面切到后台或 `document.hidden` 为真时，必须暂停动画帧。
3. `prefers-reduced-motion: reduce` 下不得启动自动滚动、视差或 3D 帧循环。
4. 每帧中避免读取 `clientWidth`、`clientHeight`、`getBoundingClientRect()` 等会触发布局计算的值；尺寸应在初始化或 `resize` 时缓存。
5. 触屏设备上不要依赖 hover 放大效果，避免滚动后出现粘滞高亮。
6. 横向长轨道必须由父容器裁切并加 `contain: layout paint`，避免隐藏内容继续撑大页面 `scrollWidth`。

当前 `script.js` 中需要保持可见性暂停的模块：

- 首屏海报轮播：`[data-hero-carousel]`
- 首屏轻量视差：`.hero-wall-scene`
- 弧形拼贴：`[data-arc-collage]`
- 3D 作品墙：`[data-curved-gallery]`

## 手机端稳定规则

手机端修改以 `560px` 和 `380px` 两个断点为主：

- `max-width: 560px`：普通手机布局，保留当前首屏视频、标题、底部海报轨道和顶部导航结构。
- `max-width: 380px`：小屏兜底，优先处理导航重叠、标题换行和海报轨道高度。

新增手机端样式时遵守：

1. 不新增页面区块，不改变 HTML 顺序。
2. 不隐藏主内容区块，仅允许缩小、收紧间距或降低 hover 动效。
3. 顶部导航必须保持在一行内，不得覆盖品牌按钮和联系按钮。
4. 首屏标题不得压住底部海报轨道。
5. 页面不得出现横向滚动条。
6. 图片、视频必须限制在父容器内，优先使用 `object-fit` 控制裁切。

## 素材加载规则

- 首屏海报使用 `assets/images/posters/*.webp`，保持 `loading="eager"` 和 `decoding="sync"`，避免首屏轨道出现未解码底色。
- 首屏海报轨道统一使用 `object-fit: cover` 填充卡片，避免横版素材在竖卡内露出大面积底色。
- 拼贴屏主图使用 `assets/images/main-images/*.webp`，保持 `loading="lazy"` 和 `decoding="async"`。
- 首屏视频优先使用 `../assets/videos/home-hero.webm`，保留 `poster="../assets/videos/home-hero-poster.jpg"`。
- 替换图片时先转换为 WebP，再更新 HTML 或 CSS 引用。
- 更新 `styles.css` 或 `script.js` 后，同步递增 `index.html` 中的查询版本号，避免浏览器继续读取旧缓存。

## 修改检查清单

每次优化后至少检查：

- 1440 × 900：首屏视频、标题、海报轨道无遮挡。
- 390 × 844：导航不重叠，首屏标题和底部海报轨道不相压。
- 375 × 812：小屏兜底样式生效，无横向滚动。
- 360 × 740：导航、标题、作品墙仍可读。

检查项：

- 控制台无 JavaScript 错误。
- `script.js` 能通过 `node --check script.js`。
- 滚动到下方后，首屏动画已暂停，3D 作品墙只在进入视口时运行。
- 触屏设备上 hover 放大不会卡住。
- `prefers-reduced-motion` 下页面仍能完整浏览。

## 禁止项

- 不要把 `requestAnimationFrame` 循环放回全页面常驻运行。
- 不要在单张卡片上写死破坏统一系统的宽高、负 margin 或独立 `translateZ()`。
- 不要移除 `docs/` 中已有的拼贴屏、3D 作品墙和圆角系统规范。
- 不要把新素材直接引用为大体积 PNG/JPG，除非有明确兼容原因并同步说明。

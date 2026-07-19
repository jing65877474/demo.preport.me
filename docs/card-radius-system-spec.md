# 后续页面卡片圆角规范

## 适用范围

本规范适用于拼贴屏 `#creative-collage` 之后的作品集页面卡片：

- `#recent-work` 横向滚动卡片
- 个人介绍页头像和经历模块
- 能力分类 `.category-card`
- 3D 作品墙 `.works-gallery-item` 和 `.work-tile`
- 案例页封面 `.case-cover`
- 案例图片网格 `.gallery-media`

首屏视频轮播和拼贴屏使用各自独立规范，不在本文件内调整。

## 圆角系统

统一使用 `card-radius-system.css` 中的变量：

```css
--portfolio-card-radius-xl: clamp(26px, 2vw, 36px);
--portfolio-card-radius-lg: clamp(22px, 1.55vw, 30px);
--portfolio-card-radius-md: clamp(18px, 1.2vw, 24px);
--portfolio-card-radius-sm: clamp(12px, .8vw, 16px);
```

使用规则：

- 大型容器和整屏主视觉使用 `xl`
- 常规作品卡片使用 `lg`
- 卡片内部装饰或设备形态使用 `md`
- 悬浮信息层使用 `sm`
- 按钮和小标签继续使用 pill 圆角，不混入卡片圆角系统
- 个人介绍页的大图、经历块使用 `xl`，内部事实/数据模块使用 `md`

## 修改约束

- 不要在后续页面新增方角卡片。
- 不要在单个卡片上临时写死 `border-radius: 0`。
- 需要调整卡片圆角时，优先修改 `card-radius-system.css` 的变量。
- 需要调整卡片大小时，保持同一屏内的视觉节奏，不要让卡片互相遮挡。
- 3D 作品墙的定位、滚动和入场动效由 `script.js` 控制，圆角文件只处理视觉外观。

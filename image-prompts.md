# API Image Prompts · Page-Locked

重要约束：配图必须遵循原 PPT 大纲和每页固定图片位置。不要把其他页素材放进当前页，也不要生成与本页内容无关的概念图。

## 前 3 页图片映射

| 页码 | 原 PPT 页面主题 | 固定图片 |
|---|---|---|
| 01 | 设计师如何使用 Codex 提升效率 / CodexGuide 网站 | `ppt-media/image1.png` |
| 02 | Codex 桌面应用程序下载与安装 | `ppt-media/image2.png` |
| 03 | 两种不同的使用方式 | `ppt-media/image3.png`, `ppt-media/image4.png` |

## 生图原则

- 优先直接使用原 PPT 提取图片，保持信息真实。
- 如需调用 API，只做“本页原图的风格统一 / 轻度重绘 / 截图再设计”，必须把该页原图作为 `--input-image` 传入。
- 不生成新的无关办公场景、抽象 AI 场景、其他案例图。
- 不跨页借图。例如第 1 页不能使用第 2 页安装截图或第 28 张转正述职网页图。
- 生成后保存到 `images/`，命名保持页码和语义，如 `01-codexguide-restyle.png`。

## 01 · CodexGuide 网站图

Input image: `ppt-media/image1.png`

Prompt:

Please restyle the provided screenshot into a clean webpage-PPT visual asset while preserving the original page meaning: CodexGuide, guide website, design/share context. Keep the screenshot content recognizable and do not introduce unrelated pages or scenes. Use pale blue paper background, navy UI framing, safety-orange underline accents, straight card edges, light editorial web style. No fake new brand, no extra page, no unrelated app, no watermark.

## 02 · Codex 下载页图

Input image: `ppt-media/image2.png`

Prompt:

Please restyle the provided screenshot into a clean presentation visual asset for the exact topic: Codex desktop app download and installation. Preserve the original download-page meaning and layout reference. Use pale blue paper background, navy UI framing, subtle orange highlight on the download action, straight edges, restrained web editorial style. Do not introduce unrelated software, fake login screens, extra websites, or unrelated workflow diagrams.

## 03A · Plus 充值方式图

Input image: `ppt-media/image3.png`

Prompt:

Please restyle the provided screenshot into a clean presentation visual asset for the exact topic: Plus subscription / recharge options. Preserve the original information hierarchy and do not invent unrelated payment pages. Use navy typography, white card modules, pale blue paper background, one safety-orange highlight. Keep it as a page-specific evidence image, not a full slide.

## 03B · 手机 / Google 支付相关图

Input image: `ppt-media/image4.png`

Prompt:

Please restyle the provided mobile screenshot into a clean presentation visual asset for the exact topic: mobile Google payment / app access as part of using Codex. Preserve that this is a mobile-app screenshot reference. Use pale blue paper background, navy framing, one safety-orange highlight. Do not replace it with unrelated icons, fake products, or generic AI imagery.

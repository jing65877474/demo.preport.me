$ErrorActionPreference = "Stop"

if (-not $env:OPENAI_API_KEY) {
  $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")
}
if (-not $env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY is missing. Set it before running this script."
}

$env:OPENAI_BASE_URL = if ($env:OPENAI_BASE_URL) { $env:OPENAI_BASE_URL } else { "https://yunwu.ai/v1" }

$script = "C:\Users\pc\.codex\skills\api-image-generation\scripts\api_image_generate.py"
$python = "C:\Users\pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$outDir = Join-Path $PSScriptRoot "images"
$mediaDir = Join-Path $PSScriptRoot "ppt-media"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Page-locked image generation only.
# Each call uses the original image from the same PPT page as reference.

& $python $script @"
Please restyle the provided screenshot into a clean webpage-PPT visual asset while preserving the original page meaning: CodexGuide, guide website, design/share context. Keep the screenshot content recognizable and do not introduce unrelated pages or scenes. Use pale blue paper background, navy UI framing, safety-orange underline accents, straight card edges, light editorial web style. No fake new brand, no extra page, no unrelated app, no watermark.
"@ --input-image (Join-Path $mediaDir "image1.png") --out (Join-Path $outDir "01-codexguide-restyle.png") --size 1536x640 --quality low

& $python $script @"
Please restyle the provided screenshot into a clean presentation visual asset for the exact topic: Codex desktop app download and installation. Preserve the original download-page meaning and layout reference. Use pale blue paper background, navy UI framing, subtle orange highlight on the download action, straight edges, restrained web editorial style. Do not introduce unrelated software, fake login screens, extra websites, or unrelated workflow diagrams.
"@ --input-image (Join-Path $mediaDir "image2.png") --out (Join-Path $outDir "02-install-restyle.png") --size 1280x720 --quality low

& $python $script @"
Please restyle the provided screenshot into a clean presentation visual asset for the exact topic: Plus subscription / recharge options. Preserve the original information hierarchy and do not invent unrelated payment pages. Use navy typography, white card modules, pale blue paper background, one safety-orange highlight. Keep it as a page-specific evidence image, not a full slide.
"@ --input-image (Join-Path $mediaDir "image3.png") --out (Join-Path $outDir "03-plus-restyle.png") --size 1280x800 --quality low

& $python $script @"
Please restyle the provided mobile screenshot into a clean presentation visual asset for the exact topic: mobile Google payment / app access as part of using Codex. Preserve that this is a mobile-app screenshot reference. Use pale blue paper background, navy framing, one safety-orange highlight. Do not replace it with unrelated icons, fake products, or generic AI imagery.
"@ --input-image (Join-Path $mediaDir "image4.png") --out (Join-Path $outDir "03-mobile-payment-restyle.png") --size 1024x1024 --quality low

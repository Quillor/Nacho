---
name: macOS app icon generation (Electron)
description: How to produce the desktop .icns in this Linux repl despite no native Apple tooling.
---

# macOS app icon for the Electron desktop app

This repl is Linux: there is no `iconutil`/`sips`, and ImageMagick (`magick`) has
**no ICNS write coder** (`ICNS:` output fails). Do not try to commit a real
`.icns` produced locally.

**Approach that works:** commit a single 1024×1024 8-bit RGBA `build/icon.png`
and point `mac.icon: build/icon.png` in `electron-builder.yml`. electron-builder
converts the PNG to a multi-resolution `.icns` at package time, cross-platform.

**Why:** ImageMagick silently writes a plain PNG when given a `.icns` extension
(`file` reports "PNG image data"), so a committed `.icns` would be malformed.

**How to apply:** regenerate with `pnpm --filter @workspace/desktop run gen-icon`
(rasterizes `artifacts/pico/public/logo-mark.svg` via `magick`). The Pico
`logo-mark.svg` is a perfect circle (rx == width/2), so the icon renders as a
circular mark on transparent — that is intended, not a bug.

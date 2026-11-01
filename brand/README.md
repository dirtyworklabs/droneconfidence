# Drone Confidence brand assets

`source/` holds the official files exactly as supplied. Never edit, recolour, crop or stretch them;
re-export from them instead.

## Web exports and where they are used

| File | Made from | Used for |
| --- | --- | --- |
| `public/brand/drone-confidence-logo-horizontal-green.png` | horizontal green, 1200px wide | Header, mobile menu, footer, admin, no-JS fallback |
| `public/brand/drone-confidence-logo-horizontal-white.png` | horizontal white, 1200px wide | Dark backgrounds (`<Wordmark tone="onDark" />`), social card |
| `public/brand/drone-confidence-logo-stacked-green.png` | stacked green, 960px wide | Booking emails, JSON-LD `logo` |
| `public/brand/drone-confidence-logo-stacked-white.png` | stacked white, 960px wide | Stacked lock-up on dark backgrounds |
| `public/favicon.ico`, `public/favicon-32.png` | favicon set | Browser tab |
| `public/icon-192.png`, `public/icon-512.png` | icon-192, favicon-512 | Web app manifest, compact header icon (<360px), loading screen |
| `public/apple-touch-icon.png` | apple-touch-icon | iOS home screen |
| `public/social-card.png` | rendered from `public/social-card.svg` | Open Graph / Twitter preview |

Logo exports were resized with Lanczos and keep their transparent padding as clear space.

Paths, sizes and the two sampled brand colours (forest `#11442d`, mint `#8cc7b0`) are defined once in
`shared/brand.ts`. Components use `<Wordmark />`; nothing else should hard-code a logo path.

To rebuild the social card after editing its SVG, run from `public/`:

```bash
rsvg-convert -w 1200 -h 630 social-card.svg -o social-card.png
```

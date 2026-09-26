# Performance rules

A personal site should load fast everywhere — over a phone connection, on first visit, with cold caches. Performance here is a hard requirement, not a polish pass: it's a ranking signal for SEO, an accessibility floor for users on slow networks, and a respect signal for everyone else.

The targets below are measured on the **homepage**, on a **mobile** profile, with **cold cache**, on **simulated 4G**. Every other page is held to the same bar unless it has a documented reason to differ.

## Targets

- **Lighthouse Performance ≥ 95** on every changed page.
- **Lighthouse Best Practices ≥ 95**.
- **Core Web Vitals** at the 75th percentile of real-user load:
  - **LCP** (Largest Contentful Paint) < 2.0s
  - **INP** (Interaction to Next Paint) < 200ms
  - **CLS** (Cumulative Layout Shift) < 0.05
- **Time to First Byte (TTFB)** < 600ms — GitHub Pages handles this for us; a regression usually means the asset graph is wrong, not the host.

If a change pushes any of these past the limit, fix it before merging. "We'll optimize later" is how a personal site grows a 4 MB hero image.

## Page weight budget

After gzip / brotli compression, per page:

- **HTML** ≤ 50 KB
- **CSS** total ≤ 30 KB
- **JavaScript** total ≤ 30 KB
- **Images** above the fold ≤ 200 KB *combined*
- **Fonts** ≤ 50 KB *combined*

Total page weight target: **≤ 400 KB above the fold**, **≤ 1 MB full page**. A typical text-only page should land much smaller.

If a page exceeds budget, the change either includes a documented reason in the commit body or it doesn't merge.

## Images

- **Modern formats first.** Author images as AVIF (best compression) with a WebP or JPEG fallback via `<picture>`:
  ```html
  <picture>
    <source srcset="/assets/images/hero.avif" type="image/avif">
    <source srcset="/assets/images/hero.webp" type="image/webp">
    <img src="/assets/images/hero.jpg" alt="Descriptive alt text"
         width="1600" height="900" loading="eager" fetchpriority="high">
  </picture>
  ```
- **Explicit `width` and `height`** on every `<img>`. Required to prevent CLS. Aspect ratio derives from the attributes; CSS scales the rendered size.
- **`loading="lazy"`** for below-the-fold images.
- **`loading="eager"` and `fetchpriority="high"`** for the LCP image (typically the hero on the homepage). Don't lazy-load the LCP image — that's a common cause of LCP regressions.
- **Decoding hints**: `decoding="async"` on non-critical images.
- **Responsive images** via `srcset` and `sizes` for any image rendered at meaningfully different sizes across breakpoints. Don't ship a 2400-px-wide hero to a 375-px-wide phone.
- **Compress aggressively.** Target ≤ 80% quality for AVIF / WebP, ≤ 75% for JPEG. Visually-lossless settings are still smaller than what most CDNs serve.
- **Strip metadata.** `exiftool -all= image.jpg` (or equivalent) before commit. EXIF can be private (geolocation) and is always extra bytes.
- **SVG** for icons and simple illustrations. Optimize with [SVGO](https://github.com/svg/svgo) before committing.

## Fonts

- **Self-host.** No Google Fonts CDN. Self-hosting is faster (no extra DNS / TLS handshake), more private, and CSP-friendly.
- **WOFF2 only.** Every browser the site targets supports it.
- **Subset to Latin** (or whatever the site's content actually uses). A full Inter family is 200+ KB; a subset is 30–40 KB.
- **`font-display: swap`** on every `@font-face` declaration. Text renders immediately in the fallback; the web font swaps in when ready. Prefer `optional` on body fonts that aren't critical to the LCP element.
- **Preload the LCP font** only — and only if it's actually on the LCP element:
  ```html
  <link rel="preload" href="/assets/fonts/inter-regular.woff2"
        as="font" type="font/woff2" crossorigin>
  ```
  Don't preload more than one or two fonts; preload competes with other critical resources.
- **System-font fallback stack** in CSS, used until the web font loads. Pick a fallback whose metrics are close to the web font (use [size-adjust descriptors](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) to align them) so the swap doesn't shift layout.

## CSS

- **Critical CSS** is small enough that no inlining trick is needed — the entire `styles/` shipped to a typical page should be under 30 KB gzipped (cross-ref `css.md`).
- **No render-blocking external stylesheets** beyond the site's own. No `<link rel="stylesheet">` to a third-party CDN unless it's been deliberately decided.
- **`@import` chains** ship serially. Prefer multiple `<link>` tags over deeply nested `@import` for performance-critical sheets.

## JavaScript

- **Defer everything.** Every `<script>` tag uses `type="module" defer` (cross-ref `javascript.md`). No script blocks parsing.
- **No render-blocking third-party scripts.** Analytics, embeds, comment widgets — defer or async, never blocking.
- **No JS on the LCP critical path.** The LCP element renders from HTML and CSS only. JS may enhance it after.
- **Bundle size:** see budget above. If the per-page JS is approaching 30 KB gzipped, the question is what's in there and whether it can be deleted.

## Layout shift (CLS)

- **Reserve space** for everything that loads asynchronously: images (`width`/`height`), embeds (`aspect-ratio`), late content (min-height), web fonts (size-adjusted fallbacks).
- **No content injected above existing content.** A late banner shoves the page; users misclick.
- **No animations** on `top`, `left`, `width`, `height` — those trigger layout. Animate `transform` and `opacity` instead.

## Interactivity (INP)

- **No long tasks on the main thread.** Anything > 50ms is a smell; > 200ms is a bug.
- **Break up heavy work** with `await new Promise(r => setTimeout(r, 0))` or `requestIdleCallback` to yield to user input.
- **Avoid synchronous layout thrashing.** Don't read DOM measurements inside a write loop. Batch reads, then batch writes.
- **Event handlers stay short.** A click handler that takes 300ms to compute something is a click handler the user perceives as broken.

## Caching

- **GitHub Pages defaults** are reasonable: HTML is cached briefly, immutable assets longer. Don't fight them; benefit from them.
- If GitHub Pages someday supports custom headers via a config file, set long `Cache-Control: max-age=31536000, immutable` on assets and short cache (or `no-cache`) on HTML.
- **Filename-fingerprint** long-lived assets (`hero.abc123.avif`) when caching gets aggressive. Until the site has a build step or a script that does this, content updates rely on URL changes or natural cache turnover.

## Third parties

- **None by default.** Every third-party origin is a DNS lookup, a TLS handshake, a download, and a privacy concern. The default is to do without.
- **When a third party is added**, document it in `security.md` (origin, what it does, what data it sees) and verify the performance impact (Lighthouse before / after, Network panel waterfall).
- **Subresource Integrity** (`integrity` + `crossorigin`) on every external script and stylesheet. See `security.md`.
- **`rel="preconnect"`** for third-party origins that are critical (a font CDN, an analytics endpoint that gates the LCP). Don't preconnect everything — preconnect competes with other critical resources.

## Verification

- **Lighthouse** locally, mobile profile, on every changed page. Run it three times; take the median.
- **WebPageTest** (free tier) on the production URL after deploy, for a real-network read of LCP / INP / CLS.
- **PageSpeed Insights** uses CrUX field data — useful as a real-user metric source after the site has traffic.
- **Network panel** in Chrome DevTools — sort by transfer size, sanity-check the top hits.
- **Coverage tab** in Chrome DevTools — anything > 80% unused is a deletion candidate.

## Anti-patterns

- 4 MB hero image at native phone-camera resolution.
- A web font for a single page heading.
- Loading jQuery to do `document.querySelector`.
- Auto-playing background video without `prefers-reduced-motion` and `prefers-reduced-data` respect.
- A third-party analytics script that ships 80 KB and gates the LCP.
- "It's a personal site, perf doesn't matter." It does. Especially on mobile.

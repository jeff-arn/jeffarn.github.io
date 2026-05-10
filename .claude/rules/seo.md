# SEO rules

This site exists in part to be findable: search engines, link previews on social, and the "site:jeffarn.github.io" search-box trick should all do something useful. SEO discipline here is about making the page legible to crawlers and to people skimming a search result — not about gaming rankings.

The constraints here intersect tightly with `accessibility.md` (semantic HTML, `alt` text), `performance.md` (Core Web Vitals are ranking signals), and `javascript.md` (content rendered only by JS is content invisible to most crawlers). When this file disagrees with one of those, the more specific rule wins.

## Per-page metadata

Every page has these in its `<head>`, every value unique per page (no copy-pasted descriptions):

```html
<title>Page name — Jeff Arn</title>
<meta name="description" content="One sentence, ≤ 160 chars, in plain prose." />
<link rel="canonical" href="https://jeffarn.github.io/page-path" />
```

- `<title>` ≤ 60 characters. Write the page name first, the site name last (search results truncate the right side).
- `<meta name="description">` ≤ 160 characters. Plain prose, not keyword soup. This is what shows up in the search snippet.
- `<link rel="canonical">` always points to the absolute URL of this page on the production origin. Required even when the URL looks "obvious" — it disambiguates trailing-slash, `www`, and protocol variants.

## Open Graph and Twitter Card

Every page has these too. Without them, link previews are blank or wrong.

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://jeffarn.github.io/page-path" />
<meta property="og:title" content="Page name — Jeff Arn" />
<meta property="og:description" content="Same string as meta[name=description]." />
<meta property="og:image" content="https://jeffarn.github.io/assets/og/page-name.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Describe the OG image for screen readers." />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page name — Jeff Arn" />
<meta name="twitter:description" content="Same string as meta[name=description]." />
<meta name="twitter:image" content="https://jeffarn.github.io/assets/og/page-name.png" />
```

- OG image is **1200 × 630**, ≤ 200 KB after compression. AVIF or WebP isn't supported by every preview crawler — ship a PNG or JPEG for OG images specifically.
- Don't reuse the homepage's OG image on every sub-page. A generic image is worse than a thoughtfully cropped one; a thoughtful one earns clicks.
- For pages that are articles (writing, posts), use `og:type="article"` and add `article:published_time`, `article:modified_time`, and `article:author` (a URL).

## URL hygiene

- Lowercase, hyphenated, human-readable: `/projects/chainsmith` not `/projects/Chainsmith` or `/p?id=42`.
- No trailing `index.html` in the canonical URL — the directory form is the canonical form.
- Don't change a URL that's already been published. If you must, ship a `<link rel="canonical">` on the new page pointing to itself, and (when GitHub Pages adds redirect support — currently via a `_redirects`-style hack) redirect the old URL.
- One canonical URL per page. The same content at two URLs is a self-inflicted SEO problem.

## Heading structure

- One `<h1>` per page; it matches the page's primary topic and (usually) the `<title>` (without the site-name suffix).
- Headings nest cleanly: `<h1>` → `<h2>` → `<h3>`. No skipping levels.
- The heading outline mirrors what a reader scanning the page would expect — heading text is content, not styling.
- Don't use headings for visual emphasis. If you need bigger text, that's a CSS job; if it's not a heading, don't make it one.

## Structured data

Add JSON-LD in a `<script type="application/ld+json">` block where it adds clarity. Don't ship empty schema.

- **Homepage**: `Person` schema for Jeff. Include `name`, `url`, `image`, `sameAs` (links to verified profiles), `jobTitle`, `worksFor` (if applicable).
- **Per-page on writing**: `Article` (or `BlogPosting` for shorter posts). Include `headline`, `author` (a `Person` reference), `datePublished`, `dateModified`, `image`, `description`, `mainEntityOfPage`.
- **Sub-pages with hierarchy**: `BreadcrumbList` matching the visible breadcrumbs (when breadcrumbs exist).
- Keep dates in ISO 8601 (`2026-05-10`).
- Validate before merging with [Google's Rich Results Test](https://search.google.com/test/rich-results) and the [Schema.org validator](https://validator.schema.org/).

## Robots and sitemap

- **`robots.txt`** at the root. Allow everything by default; only disallow paths that should never be indexed (drafts, internal scratch pages — not relevant today).
  ```
  User-agent: *
  Allow: /

  Sitemap: https://jeffarn.github.io/sitemap.xml
  ```
- **`sitemap.xml`** at the root. Lists every public URL with `<lastmod>` (ISO 8601). Update on every commit that adds, removes, or substantively changes a page.
  - Hand-authored is fine while the site is small. If page count grows past ~30 and updates churn, generate it from a script or a list.
  - Don't list URLs blocked by robots.txt.
  - Don't list URLs that 404. Validate before merging.

## Image SEO

- Every content image has descriptive `alt` text. The same text serves accessibility and SEO — see `accessibility.md`.
- Filenames are descriptive: `chainsmith-deck-editor.avif`, not `IMG_4012.png`.
- Include `width` and `height` attributes on every `<img>` (also a CLS / `performance.md` rule).
- Use `loading="lazy"` for below-the-fold images; do **not** lazy-load the LCP image (cross-ref `performance.md`).

## JavaScript and crawlers

- **Primary content is in the initial HTML**, not injected by JS. Most crawlers run JS, but not all do, not always promptly, and not with the same behavior. Progressive enhancement (see `javascript.md`) is the right posture for SEO too.
- If a feature genuinely requires JS to fully render (an interactive demo, for example), the page still has a meaningful, indexable HTML version of the content.
- **No `noscript`-only content blocks** as a fallback for content that should be in the HTML to begin with.
- **No client-side routing** that hides content behind hash fragments. Each page lives at a real URL.

## Writing for search and humans

- Write the description, headings, and first paragraph for the human skimming a search result. The crawler will figure out what the page is about from the same text.
- **No keyword stuffing.** "Jeff Arn — software engineer, software developer, software designer, web developer, web designer, …" is parsed as spammy and degrades ranking. Write naturally.
- **No hidden text.** Anything `display: none`, `visibility: hidden`, off-screen, or `font-size: 0` for SEO purposes is a Google webmaster-guideline violation.
- **Internal links use descriptive anchor text.** "Read about chainsmith" beats "click here" — for users and for crawlers.

## Verification

- **[Google Rich Results Test](https://search.google.com/test/rich-results)** for any page that ships JSON-LD.
- **[Lighthouse SEO](https://developer.chrome.com/docs/lighthouse/seo/) score ≥ 95** on every changed page (cross-ref `CLAUDE.md` definition of done).
- **[Open Graph debugger](https://www.opengraph.xyz/) and [Twitter Card validator](https://cards-dev.twitter.com/validator)** when OG metadata changes — preview crawlers cache aggressively, so verify on a deployed URL, not localhost.
- **Google Search Console** ownership for the domain (one-time setup), and a periodic glance at the Pages and Performance reports — not on every commit, but monthly is reasonable.

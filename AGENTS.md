# AGENTS.md — jeffarn.github.io

Project instructions for Meta Muse Code (powered by Muse Spark).
This file is the entry point Muse reads automatically. The detailed
domain rules live in `.agents/rules/` — read the relevant one on demand
before touching that domain (Muse loads one instruction file per
directory level, so those files are not auto-injected; open them
explicitly).

## Project snapshot

Jeff Arn's personal site. Vanilla HTML, hand-written CSS, small amount
of vanilla JavaScript. Single author, English-only, deployed via GitHub
Pages from the default branch root at <https://jeffarn.github.io>.

No backend, no CMS, no build pipeline, no Node runtime dependency for
the site itself. If a change pulls toward a framework, a bundler, or a
server, stop and reconsider.

## Stack

- **HTML**: hand-written, semantic, one `index.html` (per-page `.html`
  files at root when more pages exist: lowercase, hyphenated,
  human-readable, no trailing `index.html`).
- **CSS**: hand-written under `styles/`. Design tokens live in
  `styles/tokens.css` as CSS custom properties. No Tailwind, no
  preprocessor, no CSS-in-JS, no component library.
- **JavaScript**: vanilla ES modules under `scripts/`, one concern per
  file. No framework, no jQuery, no bundler, no transpiler. Evergreen
  browsers (last 2 Chrome/Safari/Firefox, iOS Safari ≥ 16).
- **Assets**: images and fonts under `assets/`. AVIF/WebP first for
  images, WOFF2 for fonts, self-hosted.
- **Hosting**: GitHub Pages from branch root. `index.html` is home,
  `404.html` is the Pages 404.
- **Tooling**: none required. Preview with `python3 -m http.server`.

## Hard requirements (every change)

- **WCAG 2.1 AA.** Keyboard-reachable, focus-visible, correctly
  announced. See `.agents/rules/accessibility.md`.
- **Progressive enhancement.** Every page fully usable with JS disabled.
  JS only enhances, never enables content or navigation. Test with JS
  off. See `.agents/rules/javascript.md`.
- **Conventional Commits 1.0.0** on every commit. See
  `.agents/rules/commits.md`.
- **Semantic HTML, tokens, logical CSS.** Right element; `var(--token)`
  never raw values; logical properties (`margin-inline`,
  `padding-block`, `inset-inline-start`) so styling is RTL-ready. See
  `.agents/rules/css.md`.
- **No inline styles, no inline scripts.** CSP violations and wrong
  abstraction. See `.agents/rules/css.md`, `.agents/rules/security.md`.
- **Fast.** Lighthouse Performance, Accessibility, Best Practices, SEO
  all ≥ 95 on every changed page. See `.agents/rules/performance.md`.

## Detail files — read on demand

| Domain | File |
|---|---|
| Naming, functions, comments, anti-over-engineering | `.agents/rules/clean-code.md` |
| WCAG AA, semantics, ARIA, keyboard, contrast | `.agents/rules/accessibility.md` |
| Tokens, logical properties, theming, motion | `.agents/rules/css.md` |
| Vanilla JS, ES modules, progressive enhancement | `.agents/rules/javascript.md` |
| Titles, meta, OG, structured data, sitemap | `.agents/rules/seo.md` |
| Core Web Vitals, weight budgets, images, fonts | `.agents/rules/performance.md` |
| CSP, XSS, third parties, privacy | `.agents/rules/security.md` |
| Commit format and scope vocabulary | `.agents/rules/commits.md` |

Rule of thumb: before editing CSS, read `css.md`; before editing JS,
read `javascript.md`; before changing markup, read `accessibility.md`.
Where files disagree, the most domain-specific one wins.

## Key budgets and policies (do not regress)

- Page weight (gzipped, per page): HTML ≤ 50 KB, CSS ≤ 30 KB,
  JS ≤ 30 KB, above-fold images ≤ 200 KB combined, fonts ≤ 50 KB
  combined. Above-fold total ≤ 400 KB.
- CSP starting policy: `default-src 'self'; script-src 'self'; style-src
  'self'; img-src 'self' data:; font-src 'self'; connect-src 'self';
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
  Any new third-party origin updates the CSP and gets a row in the
  third-parties table in `.agents/rules/security.md`.
- Secrets: none in the repo, ever — not even "public" keys without a
  note explaining they are public-by-design.
- Modules: `<script type="module" defer>` in `<head>`; named exports;
  `textContent` / `createElement` / `<template>`, never `innerHTML`
  with dynamic strings; no `eval`, no `new Function(string)`.

## File layout

```
.
├── AGENTS.md                   # this file (Muse entry point)
├── .agents/rules/              # detail rules (read on demand)
├── index.html                  # homepage
├── 404.html                    # Pages 404
├── robots.txt
├── sitemap.xml
├── styles/                     # index.css, tokens.css, base.css, per-page sheets
├── scripts/                    # ES modules, one concern per file
└── assets/images/ assets/fonts/
```

## Common commands

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Definition of done

- HTML validates (W3C Nu Validator), no errors.
- axe DevTools: zero violations on changed pages.
- Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO.
- Keyboard-tested: tab order matches visual order, focus always visible,
  Enter/Space activate, Esc dismisses overlays.
- Tested with JavaScript disabled: content readable, navigation works.
- New content has unique `<title>` and `<meta name="description">`;
  `sitemap.xml` updated if the URL is new.
- New third-party origin reflected in CSP and in
  `.agents/rules/security.md`.
- Commit messages follow Conventional Commits.

## What this repo is not

- Not a blog platform (hand-authored HTML, no SSG).
- Not a portfolio app (no build, no state, no router).
- Not a framework experiment (use a separate repo).

If a feature outgrows these constraints, discuss the tradeoff — do not
quietly add a bundler.

# jeffarn.github.io

Jeff Arn's personal site. Vanilla HTML, hand-written CSS, and a small amount of vanilla JavaScript. Single author, English-only, deployed via GitHub Pages from the default branch root at <https://jeffarn.github.io>.

This repo contains the entire site. There is no backend, no CMS, no build pipeline, and no Node-based runtime dependency for the site itself. If a change starts pulling toward a framework, a bundler, or a server, that is a signal to stop and reconsider.

## Stack

- **HTML**: hand-written, semantic, one `index.html` (and per-page `.html` files when more pages exist later)
- **CSS**: hand-written, organized under `styles/`. Design tokens live in `styles/tokens.css` as CSS custom properties. No Tailwind, no preprocessor, no CSS-in-JS, no component library.
- **JavaScript**: vanilla ES modules under `scripts/`. No framework, no jQuery, no bundler, no transpiler. Targets evergreen browsers (last 2 versions of Chrome, Safari, Firefox, plus iOS Safari ≥ 16).
- **Assets**: images and fonts under `assets/`. Modern formats first (AVIF / WebP for images, WOFF2 for fonts).
- **Hosting**: GitHub Pages, served from the default branch root. `index.html` is the homepage; `404.html` is the Pages 404.
- **Tooling**: none required to run the site. Local preview via any static server (e.g. `python3 -m http.server`).

## Hard requirements

These hold on every change, not just "when there's time."

- **WCAG 2.1 AA accessibility.** Every interactive element is keyboard-reachable, focus-visible, and announced correctly. Verified with axe DevTools and a manual keyboard pass before merge. See `.claude/rules/accessibility.md`.
- **Progressive enhancement.** Every page is fully usable with JavaScript disabled. JS only enhances; it never enables core content or navigation. Test with JS off in the browser before merging anything that touches scripts. See `.claude/rules/javascript.md`.
- **Conventional Commits.** Every commit on every branch follows Conventional Commits 1.0.0. See `.claude/rules/commits.md`.
- **Semantic HTML, design tokens, logical CSS.** Use the right element. Reference tokens, never raw values. Use logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) so the styling is RTL-ready by default. See `.claude/rules/css.md`.
- **No inline styles, no inline scripts.** Both are CSP violations and both are signs the abstraction is wrong. See `.claude/rules/css.md` and `.claude/rules/security.md`.
- **Fast.** Lighthouse Performance, Accessibility, Best Practices, and SEO all ≥ 95 on the homepage. See `.claude/rules/performance.md`.

## File layout

```
.
├── index.html                  # homepage
├── 404.html                    # GitHub Pages 404
├── robots.txt                  # search-engine directives
├── sitemap.xml                 # full URL list, referenced from robots.txt
├── styles/
│   ├── index.css               # entry point, @imports the rest
│   ├── tokens.css              # design tokens (the only place values are defined)
│   ├── base.css                # element resets and base typography
│   └── <page-or-component>.css # scoped to a page or component
├── scripts/
│   └── <module>.js             # ES modules, one concern per file
└── assets/
    ├── images/
    └── fonts/
```

When the site grows beyond one page, add per-page HTML files at the root (e.g. `about.html`, `projects.html`) — keep URLs human-readable, lowercase, hyphenated, no trailing `index.html`.

## Rules files

Read these for their respective domains:

- `.claude/rules/clean-code.md` — naming, function design, comments, anti-over-engineering
- `.claude/rules/accessibility.md` — WCAG AA, semantic HTML, ARIA, keyboard, contrast
- `.claude/rules/css.md` — design tokens, logical properties, theming, motion
- `.claude/rules/javascript.md` — vanilla JS, ES modules, progressive enhancement
- `.claude/rules/seo.md` — titles, meta, Open Graph, structured data, sitemap, robots
- `.claude/rules/performance.md` — Core Web Vitals, page weight budgets, image and font discipline
- `.claude/rules/security.md` — CSP, third-party scripts, dependencies, XSS, privacy
- `.claude/rules/commits.md` — Conventional Commits 1.0 format and scope vocabulary

## Common commands

```bash
# Preview locally (any of these work)
python3 -m http.server 8000
# then open http://localhost:8000

# Validate HTML (uses W3C public validator)
# Replace URL once the site is deployed
curl -H "Content-Type: text/html; charset=utf-8" \
  --data-binary @index.html \
  https://validator.w3.org/nu/?out=gnu

# Run Lighthouse from the command line (requires `npm i -g lighthouse` ad-hoc)
lighthouse http://localhost:8000 --view
```

There is no `package.json` in this repo by design. Tooling installs are ad-hoc — install globally, run, move on.

## Definition of done

A change is done when:

- HTML validates (W3C Nu Validator) with no errors
- axe DevTools shows zero violations on any changed page
- Lighthouse on the changed page scores ≥ 95 on Performance, Accessibility, Best Practices, and SEO
- The page has been keyboard-tested: tab order matches visual order, focus is always visible, Enter/Space activate, Esc dismisses overlays
- The page has been tested with JavaScript disabled: all content readable, all navigation working
- The page has been smoke-tested in Chrome, Safari, and Firefox on desktop, plus mobile Safari (real device or BrowserStack)
- New content has unique `<title>` and `<meta name="description">`, plus updated `sitemap.xml` if the URL is new
- Any new third-party origin (font CDN, analytics, embed) is reflected in the CSP and listed in `.claude/rules/security.md`
- Commit messages follow Conventional Commits

## What this repo is not

- Not a blog platform. If posts arrive, they're hand-authored HTML files, not a static-site generator's output.
- Not a portfolio app. No build step. No state. No router.
- Not a place to experiment with frameworks. Use a separate repo for that.

If a future feature genuinely outgrows the constraints in this file, the answer is to discuss the tradeoff explicitly — not to quietly add a bundler.

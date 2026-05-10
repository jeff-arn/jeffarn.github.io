# jeffarn.github.io

Source for [jeffarn.com](https://jeffarn.com) — Jeff Arn's personal site.

Vanilla HTML, hand-written CSS, and a small amount of vanilla JavaScript. No framework, no bundler, no build step. Deployed via GitHub Pages from the `main` branch.

## Stack

- **HTML** — hand-written, semantic
- **CSS** — design tokens in `styles/tokens.css`; per-page sheets under `styles/`. No Tailwind, no preprocessor.
- **JavaScript** — vanilla ES modules under `scripts/`. Progressive enhancement only — every page works with JS disabled.
- **Hosting** — GitHub Pages with a custom domain via `CNAME`.

## Local preview

No tooling required. Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Layout

```
.
├── index.html         # homepage
├── favicon.svg        # SVG favicon (adapts to prefers-color-scheme)
├── robots.txt
├── sitemap.xml
├── CNAME              # custom domain for GitHub Pages
├── styles/
│   ├── tokens.css     # design tokens (the only place values live)
│   ├── base.css       # resets and base typography
│   ├── home.css       # homepage chrome
│   └── profiler.css   # dev profiler (lazy-loaded)
├── scripts/
│   ├── theme.js       # light/dark toggle
│   └── profiler.js    # dev profiler
└── assets/
```

## Conventions

Project conventions and hard requirements (WCAG 2.1 AA, strict CSP, Conventional Commits, performance budgets) live in [`CLAUDE.md`](CLAUDE.md) and [`.claude/rules/`](.claude/rules/).

## License

[MIT](LICENSE).

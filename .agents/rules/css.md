# CSS rules

Hand-written CSS, organized under `styles/`, with a small design-token layer at the bottom of the cascade. No Tailwind, no preprocessor, no PostCSS plugin chain, no CSS-in-JS, no component library. The design system in this repo is the source of truth for visual decisions, and it lives in plain CSS custom properties.

This is a deliberately small toolset. The site has no build step. If a feature genuinely needs a build step to express, that's a discussion, not a commit.

## Where styles live

- **`styles/tokens.css`** — CSS custom properties for color, spacing, radius, motion, typography, breakpoints. The only place values are *defined*. Defined under `:root` for light mode, overridden inside `@media (prefers-color-scheme: dark)` for dark mode using the same names.
- **`styles/base.css`** — element resets, base typography, a tiny utility set (`.visually-hidden`, `.skip-link`). Loaded on every page.
- **`styles/index.css`** — the entry point, `@import`s tokens, base, and per-page sheets in dependency order.
- **`styles/<page-or-component>.css`** — scoped to a page or to a reusable component. Loaded by the pages that need it.

Components and pages reference tokens via `var(--token-name)`. They never define raw values inline.

## Design tokens

Authoritative values live in `tokens.css`. This file lists the conventions.

### Color

- Tokens are named by **role**, not by hue: `--bg-base`, `--bg-raised`, `--bg-overlay`, `--text-primary`, `--text-muted`, `--text-subtle`, `--border-subtle`, `--accent-brand`, `--accent-brand-hover`.
- **Light is the default.** Tokens are defined under `:root` for light, overridden under `@media (prefers-color-scheme: dark)` for dark, using the same names. Components reference role tokens; the theme system swaps the underlying values.
- **Semantic colors**: `--state-success`, `--state-warning`, `--state-danger`, `--state-info`. Use these in components, never raw hex.
- **Focus-ring colors**: `--focus-ring`, `--focus-ring-offset`. Used by every focusable element's `:focus-visible` style.

### Spacing

- **4px base scale**: `--space-1` (4px) through `--space-16` (64px), doubling-ish steps (4, 8, 12, 16, 24, 32, 48, 64).
- Don't introduce off-scale values in component sheets. If a layout needs a non-scale value, the layout is wrong; rework it before adding a token.

### Radius

- Tokens: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-pill` (9999px).
- Cards use `--radius-md`. Modals and panels use `--radius-lg`. Buttons and tags use `--radius-sm` or `--radius-pill`. Document any exception in a one-line comment.

### Typography

- **One body font** loaded as a self-hosted WOFF2, plus the system-monospace stack for code. No display fonts. No multiple-weight collections without a reason.
- **Size scale**: `--text-xs` (12px) through `--text-3xl` (32px), plus a `--text-display` for hero / page-title use.
- **Line-height tokens**: `--leading-tight`, `--leading-normal`, `--leading-loose`.
- **Weight tokens**: `--weight-regular`, `--weight-medium`, `--weight-bold`. Don't reach for `font-weight: 567` — round to the nearest scale step.
- Don't introduce off-scale font sizes in component CSS. Token or nothing.

### Elevation and shadow

- Tokens for the three sizes of overlay surface: `--shadow-sm`, `--shadow-md`, `--shadow-lg`. Don't invent ad-hoc `box-shadow` values.

### Motion

- `--motion-duration-fast` (150ms) and `--motion-duration-slow` (300ms).
- `--motion-ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)` or similar). No bounce, no overshoot.
- Every animated rule respects `prefers-reduced-motion: reduce`. Ship a global rule in `base.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  This is the one place `!important` is acceptable in this repo.

### Breakpoints

- Mobile-first. Default styles target the smallest viewport; `@media (min-width: …)` adds desktop adjustments.
- Token-friendly breakpoints: `--bp-sm` (40em), `--bp-md` (48em), `--bp-lg` (64em), `--bp-xl` (80em). Use them via [container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries) when scoping by component, or `@media (min-width: …)` when scoping by viewport.

## Logical properties

- Use **logical** CSS properties (`margin-inline`, `margin-block`, `padding-inline-start`, `padding-block-end`, `inset-inline-start`, `border-inline-end`) instead of physical (`margin-left/right/top/bottom`, `padding-left/right/top/bottom`, `left`, `right`, `border-left/right`).
- Same for `text-align: start | end` over `left | right`, and `border-start-end-radius` style corner radii.
- This pays the styling debt for RTL up front, before a future RTL locale exists. Even on an English-only site today, logical properties cost nothing extra and make the markup honest about what it means.

The narrow exception: a glyph or icon that must visually point left regardless of locale (a play button, a back chevron whose meaning is "previous in the language's reading order, but visually fixed for branding") — these are rare and require a one-line comment naming the reason.

## No inline `style` attribute

Default-deny. If you find yourself reaching for `style="..."`, the answer is almost always one of:

1. **Add or use a class** in the relevant component CSS.
2. **Add or use a token** if the value is reused, or represents a real role.
3. **Use a CSS custom property scoped to the element** when the value is genuinely runtime-dynamic (e.g. a chart bar height computed from data):
   ```html
   <div class="bar" style="--bar-height: 73%"></div>
   ```
   ```css
   .bar { block-size: var(--bar-height); }
   ```
   This still uses the `style` attribute, but it routes the dynamic value through a custom property — keeping the CSS rule (`block-size: var(--bar-height)`) in the stylesheet where it belongs.

The truly raw `style="font-size: 11.5px"` form is the violation we're guarding against. Add a token, a class, or a custom-property handoff.

## No `!important`

The cascade exists to avoid this. If you reach for `!important`, the right fix is upstream — adjust specificity, restructure the selector, fix the order of imports.

The one allowed exception is the `prefers-reduced-motion` zero-out above, where the intent is to override every animation declaration unconditionally.

## Reach for tokens, not raw values

If the value you want isn't on the scale, the answer is one of:

1. **Round to the nearest scale step.** Micro-decisions (12px vs 13px font size, 14px vs 16px padding) almost never survive contact with users; pick the nearest token.
2. **Add a token** if the value is reused in three or more places and represents a real role (a new elevation, a new label-size for a new component class). The commit that adds the token also adds it to `tokens.css`.
3. If neither fits, that's the rare "genuinely dynamic" case — use the custom-property handoff from the previous section.

No raw hex colors in component sheets. No raw `box-shadow` strings. No raw `cubic-bezier(…)` values. Tokens or nothing.

## Selector and class discipline

- **Class names** are component-scoped or BEM-ish (`.post-card`, `.post-card__title`, `.post-card--featured`). Lowercase, hyphenated. No camelCase, no PascalCase.
- **No IDs for styling.** IDs are for `id="main"` (skip link target) and form `for`/`id` association. Style with classes.
- **No deep selectors.** `.post-card .footer .meta a` is fragile and order-dependent. Flatten the markup or add a class.
- **No `*` selectors except in the reset.** Universal selectors are slow and indiscriminate.
- **No tag-only selectors in components.** Style by class. The exception is base typography in `base.css` (`h1`, `h2`, `p`).

## Layout

- **Flex and Grid** for layout. No floats. No table-based layout.
- **Aspect ratios** via `aspect-ratio: 16 / 9` rather than padding-bottom hacks.
- **Modern selectors** (`:is()`, `:where()`, `:has()`) are fine; they ship in every evergreen browser the site targets.

## Anti-patterns

- No `!important` outside the reduced-motion override.
- No deep selectors (`.foo .bar > .baz`).
- No hex colors in component files. Tokens or nothing.
- No `px` for `font-size` once tokens are in place — reference the size tokens.
- No new fonts without an explicit decision (perf and licensing both matter).
- No `position: absolute` for layout when flex or grid would do.
- No fragile `z-index: 999` ladders. Use a small, documented z-index scale in `tokens.css` if z-index management gets non-trivial.

## File-size budget

- Total CSS shipped to a page ≤ 30 KB after gzip. Cross-ref `performance.md`.
- Per-page CSS only loads the sheets that page needs. Don't `@import` everything from `index.css` and call it done.

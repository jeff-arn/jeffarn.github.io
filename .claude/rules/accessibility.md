# Accessibility rules

WCAG 2.1 AA is a **hard requirement** for this site. Not aspirational, not "we'll get to it." Every change that touches markup, styles, or scripts is expected to clear AA on the changed surface.

A personal site that doesn't work for keyboard users, screen-reader users, or users who need reduced motion or higher contrast is a personal site that's narrower than it should be. The bar is non-negotiable.

## Semantic HTML first

- Use the right element. `<button>` for actions, `<a href>` for navigation, `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` for landmarks, `<dialog>` for modals.
- A `<div onclick>` is a bug. So is a `<span role="button">` when a `<button>` would do.
- Reach for ARIA only when semantics aren't enough. Misused ARIA is worse than no ARIA — the first rule of ARIA is don't use ARIA.
- One `<h1>` per page. Headings nest properly: `<h1>` then `<h2>` then `<h3>`, no jumping from `<h1>` to `<h4>`.
- Every page has a `<main>` landmark, exactly one.
- Skip-to-content link as the first focusable element on every page; it links to `#main` (or wherever `<main>` lives).

## Keyboard

- **Every interactive element is keyboard-reachable.** Tab moves forward, Shift+Tab moves back, Enter/Space activates, Esc dismisses.
- **Focus is always visible.** Don't `outline: none` without an equivalent visible replacement. The default focus ring is fine; a custom one defined via the `--focus-ring-*` tokens in `tokens.css` is fine; no focus indicator at all is a bug.
- **Tab order matches visual order.** If you find yourself reaching for `tabindex="-1"` on an actionable element, the layout is wrong, not the tabindex.
- **No positive `tabindex` values.** `tabindex="0"` to make a non-interactive element focusable is sometimes necessary; `tabindex="3"` is never the right answer.
- **Custom keyboard shortcuts** (if any) are documented in plain prose on the page, and obey the same modifier conventions as the platform.

## Screen readers

- **Every interactive element has an accessible name.** Visible text is the default. When there isn't visible text (an icon-only button), use `aria-label` with a meaningful, human-readable string.
- **Live regions** for dynamic announcements: form errors, copy-link confirmations, toast-style feedback. Use `aria-live="polite"` for non-urgent and `aria-live="assertive"` only for genuinely urgent.
- **Descriptions** via `aria-describedby` for fields with help text or error text. Don't bury context in a tooltip the screen reader can't reach.
- **`role="status"`** for in-progress feedback ("loading…"), **`role="alert"`** for errors that need immediate attention.
- **Don't override correct semantics.** `<button role="link">` defeats the element. If you want link behavior, use `<a href>`.

## Color and contrast

- **4.5:1** for body text against its background. **3:1** for large text (≥ 18pt or 14pt bold) and for meaningful non-text (icons, borders, focus rings that convey state).
- Tokens that fail contrast in either light or dark mode are bugs, not preferences. When adding or changing a color token, verify it against every surface it lands on, in both modes.
- **Color is not the only signal.** If state is conveyed by color (success/error, selected/unselected), it's also conveyed by an icon, label, weight, or pattern. A user with color blindness must see the same information.

## Forms

- **Every input has an associated `<label>`.** Visible whenever possible. When the design genuinely needs no visible label, use `aria-label` with a meaningful string.
- **Error association**: errors are linked via `aria-describedby` to the input, and announced via an `aria-live` region. Marking a field invalid (`aria-invalid="true"`) is also required.
- **Required fields** get `aria-required="true"`, plus a visual indicator that does not rely solely on color.
- **Autocomplete** attributes on every relevant field (`autocomplete="email"`, `autocomplete="name"`, etc.). Helps password managers, autofill, and assistive tech.
- **Submit on Enter** in single-line inputs. Don't intercept it without a reason.

## Images and icons

- **Decorative images**: `alt=""`. The empty alt is required, not optional — omitting `alt` falls back to the filename, which is worse than nothing.
- **Content images**: `alt` describes what the image conveys, not "image of …" or the filename. Useful alt text is also useful for SEO (see `seo.md`).
- **Icon-only buttons**: the visible icon is decorative (`aria-hidden="true"` on the SVG), and the button itself carries an `aria-label`.
- **Icons with adjacent text**: the icon is decorative; the text is the accessible name. Don't double up.
- **Image dimensions**: every `<img>` has explicit `width` and `height` to prevent layout shift (cross-ref `performance.md`).

## Modals and overlays

- Modals use the native `<dialog>` element with the `showModal()` API for the inert-background behavior.
- Open: focus moves into the dialog (typically to the first focusable control or to a heading). Close: focus returns to the trigger. Esc closes. Click-outside closes if the dialog is non-destructive.
- The page behind a modal is `inert`, not `aria-hidden="true"` on a sibling — `inert` is the right primitive and is supported in every evergreen browser the site targets.

## Reduced motion and preferences

- `prefers-reduced-motion: reduce` disables non-essential animation. Ship a global rule in `base.css` that drops transitions and animations to near-zero duration when this is set; opt non-decorative motion (loading spinners, progress) back in deliberately.
- `prefers-color-scheme` drives light vs. dark theming via tokens defined in `tokens.css` (cross-ref `css.md`).
- `prefers-contrast: more` — bump border weights and contrast on critical surfaces. Stretch goal, not a launch blocker, but tokens are structured so the override is one variable change.

## Verification

- **axe DevTools** on every changed page. Zero violations is the bar. If a rule must be suppressed, the suppression is annotated in code with the rule ID, the reason, and a follow-up.
- **Manual keyboard pass** before merging anything user-facing. Tab through it. Hit Enter on every actionable element. Hit Esc in every modal. Close the laptop and reopen it — focus should land somewhere sensible.
- **Manual screen-reader pass** for new flows: VoiceOver on macOS or iOS is the minimum. Not on every commit, but before any milestone-shaped change.
- **Lighthouse Accessibility ≥ 95** on the changed page (cross-ref `CLAUDE.md` definition of done).

## What we don't do

- **No ARIA roles invented from scratch.** Stick to the published vocabulary.
- **No skip-to-content link omitted.** It's the first focusable element on every layout.
- **No `<h1>` skipped or misused.** One per page; headings nest properly.
- **No reliance on hover for critical information.** Hover-only tooltips fail keyboard and touch users; pair every hover affordance with a focus-equivalent.
- **No auto-playing media with sound.** Auto-play silent decorative video is the only acceptable form, and it respects `prefers-reduced-motion`.
- **No CAPTCHA on a personal site.** If spam becomes a problem, the answer is rate limiting and honeypots, not Google's reCAPTCHA gauntlet.

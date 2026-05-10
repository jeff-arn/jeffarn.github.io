# JavaScript rules

Vanilla JavaScript, ES modules, no framework, no bundler, no transpiler. The site has no build step on purpose. JS exists to *enhance* the static HTML and CSS — it never gates content or navigation.

## Progressive enhancement is a hard requirement

**Every page is fully usable with JavaScript disabled.** This is not a stretch goal. It is the headline rule of this file, and it has consequences for every other rule below.

What "fully usable" means in practice:

- All content is in the initial HTML. No content is fetched and rendered exclusively by JS.
- All navigation is via real `<a href>` links to real URLs. No client-side router.
- All forms work via standard form submission (or, on a static site, would work if a backend were wired up — they're never JS-only).
- Interactive enhancements (a copy-link button, a theme toggle, a smooth-scroll affordance) are visible *only when JS is available*. Render them via JS, or hide them via a `data-js-only` attribute that JS removes on boot. Never ship a non-functional button to no-JS users.

To verify: open DevTools, disable JavaScript, reload, and try the page. If a primary action no longer works, the page violates this rule.

This rule reinforces `accessibility.md` (assistive tech with broken JS still works), `seo.md` (crawlers see real content), and `performance.md` (JS isn't on the LCP critical path).

## Modules

- **ES modules only.** Every script tag uses `<script type="module" defer src="…"></script>`. No global script pollution. No legacy `<script src=…>` without `type="module"`.
- **Named exports** over default exports. Named exports rename loudly when they drift; default exports rename silently and break call sites.
- **Static imports at the top of the file**, not inside functions, unless the dynamic import is a deliberate code-splitting choice.
- **One concern per module.** A `theme-toggle.js` does theme toggling and nothing else. A 600-line `main.js` is two or three modules pretending to be one.

## Script loading

- **`<script type="module" defer>`** on every script tag. `type="module"` already implies deferred execution, but `defer` is harmless and explicit.
- Scripts go in `<head>` with `defer`, not at the bottom of `<body>`. With `defer`, they don't block parsing, and head-loading lets the browser kick off the fetch sooner.
- **No `async` for site-critical scripts.** `async` runs scripts in unpredictable order; the site doesn't have so many scripts that order doesn't matter.
- **No inline scripts** in HTML. CSP forbids them (see `security.md`), and inlining defeats caching.
- **No third-party scripts** without a deliberate decision (analytics, embeds). Each one has a row in `security.md` documenting what it does and what data it sees.

## Syntax and language features

- **`const` by default, `let` when reassignment is genuinely needed, never `var`.**
- **Arrow functions** for callbacks; named function declarations for module-level definitions. Named functions show up better in stack traces.
- **Strict mode** is implicit in modules; don't add `"use strict"`.
- **`async`/`await`** over raw `.then()` chains. Promise composition (`Promise.all`) is fine.
- **Optional chaining and nullish coalescing** (`?.`, `??`) over hand-rolled guards.
- **Template literals** for string composition. No string concatenation with `+`.
- Modern syntax targets evergreen browsers (last 2 versions of Chrome, Safari, Firefox, plus iOS Safari ≥ 16). No transpilation. No polyfills unless a specific feature genuinely lacks support and the cost is justified.

## DOM access

- **Query once, cache the reference.** Don't `document.querySelector('.foo')` four times in one function.
- **`querySelector` / `querySelectorAll`** over `getElementById` / `getElementsByClassName`. Consistent API, more flexible selectors.
- **Add classes, don't write inline styles.** State changes flip a class on or off. CSS owns the visual; JS owns the state.
- **`addEventListener`** for every event binding. Never inline `onclick="…"`.
- **Event delegation** when binding to many similar elements (a list of cards). Bind once on the container, switch on `event.target`.
- **`{ passive: true }`** on touch and wheel listeners that don't `preventDefault`. Helps scroll performance.

## DOM construction

- **`element.textContent`** for setting text. Never `innerHTML` for text — it's slower and unsafe.
- **`document.createElement` + `append`** for building DOM. Prefer the explicit shape over a template-string-and-`innerHTML` flow.
- If a feature genuinely needs HTML composition, use the [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) and `cloneNode(true)` — the markup lives in HTML, and JS only stamps it out.
- **Never `innerHTML` with user-provided strings.** That's the XSS pattern. Cross-ref `security.md`.

## State and storage

- **In-memory state only**, by default. State is held in module-scope `let` bindings or in DOM attributes (`data-state="open"`).
- **`localStorage`** is appropriate for a small set of user preferences (theme override, a "don't show again" flag). Wrap reads in a `try/catch` — `localStorage` can throw in private-browsing modes.
- **No `sessionStorage`, no `IndexedDB`** without a real reason. A personal site usually doesn't have one.
- **No cookies** set by client JS. If cookies are needed for auth or analytics in the future, they come from the server with `HttpOnly`.

## Errors

- **Fail loud in development.** Unhandled errors throw and surface in the console.
- **Fail gracefully in production.** A broken theme toggle should never break the page itself. Wrap each enhancement's boot in a try/catch that logs and bails:
  ```js
  try {
    setupThemeToggle();
  } catch (err) {
    console.warn('theme toggle disabled:', err);
  }
  ```
- **`console.warn` and `console.error`** for intentional logging, with context. **No `console.log`** in committed code — it's a debugging artifact.
- **No silent `catch (err) {}`.** If we don't care about the error, the comment says so.

## Disallowed APIs

- **No `eval`.** No code path on this site needs it.
- **No `new Function(string)`.** Same reason.
- **No `document.write`.** It's an anti-pattern from another era.
- **No `with` blocks.** They're forbidden in strict mode anyway.
- **No `innerHTML` with dynamic / user-provided strings.** Cross-ref `security.md`.

## Frameworks and libraries

- **No frameworks.** No React, no Vue, no Svelte, no jQuery, no Alpine, no htmx. The day a feature genuinely needs one, the discussion happens before the dependency lands.
- **No utility libraries** (Lodash, date-fns, etc.) until a specific need justifies the bytes. Modern JS standard-library support covers most needs (`Array.prototype.flat`, `Intl.DateTimeFormat`, `URL`, `URLSearchParams`).
- **Web standards over libraries.** Need a date picker? `<input type="date">`. Need form validation? HTML5 `required`, `pattern`, `type="email"`. Need a modal? `<dialog>`.

## Page-level JS budget

- Total JS shipped to a page ≤ 30 KB after gzip (cross-ref `performance.md`). A typical personal-site page should land closer to 5 KB.
- If you're approaching the budget, the question isn't "should we minify?" — it's "what is this script doing that the HTML and CSS couldn't?"

## Boot pattern

A typical script module on this site looks like:

```js
// scripts/theme-toggle.js
const STORAGE_KEY = 'theme-override';

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function setupThemeToggle() {
  const toggle = document.querySelector('[data-js-theme-toggle]');
  if (!toggle) return;

  toggle.hidden = false; // revealed only when JS is available

  const initial = readPreference();
  if (initial) applyTheme(initial);

  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  });
}

setupThemeToggle();
```

Note the shape: progressive-enhancement-first (`toggle.hidden = false` only when JS runs), defensive against `localStorage` failures, no global state, no framework.

# Security rules

Static-site security posture. Lighter than a full-stack app's security file because there is no backend, no database, no user accounts, and no token issuance — but the parts that matter still matter. The threat model is "an internet-exposed static site whose author is identifiable, that may someday include third-party content (analytics, fonts, comments)."

## Secrets in the repo

- **No secrets in this repo, ever.** No API keys, no tokens, no service credentials, not even "public" ones — anything that looks like a token is treated as a bug, even when the value is technically meant to be public, because intent is hard to recover from a git log.
- **`.gitignore`** covers any local-only files (`.env`, OS junk like `.DS_Store`, editor scratch).
- If the site someday integrates with a third party that requires a public client key (e.g. a "site verification" tag from Google Search Console, a Plausible site key, etc.), document the value in `CLAUDE.md` or this file with a one-line note explaining why it's public-by-design.
- A future improvement is to add `gitleaks` or a similar secret scanner to a pre-commit hook, mirroring the pattern from Jeff's other repos. Not in scope for the initial bootstrap.

## Content Security Policy

Ship a strict CSP via a `<meta http-equiv="Content-Security-Policy">` tag in every page (or, if hosting moves off Pages and supports headers, via the HTTP header — preferred). Starting policy:

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Notes on the policy:

- **`script-src 'self'` only.** No `'unsafe-inline'`, no `'unsafe-eval'`. The site has no inline scripts (`javascript.md`), and no code path needs `eval`.
- **`style-src 'self'`** with no `'unsafe-inline'`. The site has no inline styles (`css.md`); stylesheets are external.
- **`frame-ancestors 'none'`** prevents clickjacking — nothing legitimately needs to embed this site in an iframe.
- **`base-uri 'self'`** prevents `<base>` tag injection from changing relative URLs.
- **`form-action 'self'`** keeps forms from posting elsewhere.
- **No `data:` in `script-src` or `frame-src`.** That's an XSS vector.

When a third party is added (a font CDN, an analytics endpoint, an embedded widget), the CSP changes to allow exactly that origin and nothing more. Each addition is documented in the **Third parties** section below.

## XSS

- **Never `innerHTML` with user-provided or dynamic strings.** Use `textContent` for text, `document.createElement` for structure, or a `<template>` element cloned into place. Cross-ref `javascript.md`.
- **No `eval`, no `new Function(string)`, no `setTimeout(string)`.** The CSP forbids them anyway; the rule is here for defense in depth.
- **User-authored content** (comments, guestbook, contact form — none exist today) would render as text only. Markdown rendering, if added later, goes through a sanitizer with a strict allowlist (e.g. DOMPurify), and the call site has a comment naming the rule and the threat.
- **`rel="noopener noreferrer"`** on every `<a target="_blank">`. Prevents the new tab from accessing `window.opener` and from leaking referrer.
- **Don't interpolate URLs into `href`/`src` from untrusted sources** without validating the scheme — `javascript:`, `data:`, and `file:` URLs are XSS vectors in `<a href>`.

## Third-party scripts and origins

**Default-deny.** Every third-party origin (font CDN, analytics, embedded widget, comment system) is a privacy and security tradeoff worth a deliberate decision. The default is to do without.

When a third party *is* added, the change includes:

1. **A row below documenting it**: origin, what it does, what data it sees, why we accepted the tradeoff.
2. **Subresource Integrity** on every `<script>` and `<link rel="stylesheet">` from a third-party origin — `integrity="sha384-…"` and `crossorigin="anonymous"`. Pin a specific version; renew the SRI hash when the version bumps.
3. **CSP allowlist update** for the origin in `script-src`, `style-src`, `img-src`, `connect-src`, or whichever directive applies. Only add the directives the asset actually needs.
4. **A `rel="preconnect"`** for the origin if it's on the critical path (cross-ref `performance.md`).

### Active third parties

| Origin | Purpose | Data it sees |
|---|---|---|
| *(none today)* | | |

Add a row when adding a third party. Remove a row when removing one. The table is the source of truth for the CSP.

## External links and embeds

- **External `<a>` links**: `target="_blank" rel="noopener noreferrer"`. The two `rel` values together prevent tab-jacking and referrer leakage.
- **Embeds (YouTube, etc.)**: prefer a static, lazy-loaded fallback (a thumbnail with a play overlay) that loads the iframe only on click. This avoids the embed's tracking until the user opts in, and cuts the page weight (`performance.md`).
- **No silent iframes.** Anything in an `<iframe>` is documented in the third-parties table above.

## HTTPS and mixed content

- **HTTPS only.** GitHub Pages enforces this for `*.github.io` domains; if a custom domain is added, ensure the "Enforce HTTPS" checkbox in repo settings is on.
- **No mixed content.** Every asset URL is `https://` (or relative, which inherits the page's scheme). No `http://` references in HTML, CSS, or JS.

## Privacy

- **No analytics by default.** A personal site does not need to instrument every visitor.
- **If analytics is added**, pick a privacy-respecting option (e.g. self-hosted Plausible, Umami, or a similar cookieless tool). Document the choice and what it captures in the third-parties table above. Add a privacy notice page describing what's collected and why.
- **No personally-identifying information in logs or analytics.** Even self-hosted analytics should not capture full URLs with sensitive query parameters.
- **Honor Do Not Track / Global Privacy Control** if analytics is added — opt-out is the default for users who signal opt-out.
- **Contact form** (none today): a submission goes to a forwarding email, never stored client-side. If client-side validation captures content, it doesn't send anything before the user submits.

## Browser-side state

- **`localStorage`** is appropriate for a small set of UI preferences (theme override, "don't show again" flags). Wrap reads in try/catch — `localStorage` can throw in private-browsing modes (cross-ref `javascript.md`).
- **No tracking identifiers** stored in `localStorage`, `sessionStorage`, or `IndexedDB`.
- **No cookies set by client JS.** If cookies are needed (they aren't today), they come from the server with `HttpOnly` and `Secure`.

## Dependencies

- **Site code has no runtime dependencies.** This is by design. If a feature genuinely requires a JS library, it's discussed before the dependency lands.
- **Tooling dependencies** (linters, image optimizers run ad-hoc) live outside this repo. If they grow into a `package.json`, pin exact versions, commit the lockfile, and review changelogs on upgrade.
- **No `<script src="https://cdn.example.com/some-lib.js">`** without SRI, version pinning, and a row in the third-parties table.

## Disclosure

This project does not yet have a published security policy. If one is added, link it from this file and `README.md`. Until then, the response to any security report is to treat it seriously and fix it quickly, even informally.

## What we don't do

- **No `eval` or `new Function`.**
- **No `innerHTML` with dynamic strings.**
- **No third-party scripts without SRI.**
- **No `'unsafe-inline'` or `'unsafe-eval'` in CSP.**
- **No tracking pixels, no fingerprinting libraries, no session-replay tools.** A personal site is not a marketing funnel.
- **No `target="_blank"` without `rel="noopener noreferrer"`.**
- **No mixed content.**

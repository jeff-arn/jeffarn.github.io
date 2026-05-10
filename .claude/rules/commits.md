# Commit message rules

This project uses [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) (a.k.a. Commitizen style) for every commit on every branch. The format gives the log a machine-readable shape — future tooling can generate changelogs, infer semver bumps, and surface breaking changes — without asking much of the author beyond a brief discipline.

This is the same standard Jeff's other projects use; the only meaningful differences are the scope vocabulary below and the smaller surface area of this repo.

Enforcement is currently social — there is no commit-msg hook installed yet. Adding one is a future improvement (mirror the bash hook from the chainsmith-web repo). Until then, the convention holds because we hold it.

## Format

```
<type>[(scope)][!]: <subject>

[body]

[footer(s)]
```

The subject line is the only required part. Type is required; scope is optional but encouraged when the change is localized.

## Types

Use one of:

- `feat` — a new user-visible feature
- `fix` — a bug fix
- `perf` — a performance improvement that is neither a feature nor a fix
- `refactor` — a code change that neither fixes a bug nor adds a feature
- `docs` — documentation only (including `README.md`, `CLAUDE.md`, `.claude/rules/*`)
- `style` — formatting, whitespace, no logic change
- `test` — adding or correcting tests
- `build` — changes to deployment, packaging, or build config (e.g. a future GitHub Action)
- `ci` — changes to CI configuration or scripts
- `chore` — housekeeping, tooling, repo metadata
- `revert` — reverts a previous commit

If a change doesn't fit any of these, the commit is probably doing too many things. Split it.

## Scope

Scope is a noun in parentheses naming the area touched: page, layer, or area of the site. Reuse existing scope names where they fit. Starting vocabulary for this repo:

- `home` — the homepage / `index.html`
- `about` — about page (when it exists)
- `projects` — projects/portfolio page (when it exists)
- `404` — the Pages 404 page
- `styles` — CSS under `styles/`, including `tokens.css`
- `scripts` — JavaScript under `scripts/`
- `assets` — images, fonts, downloads under `assets/`
- `seo` — meta tags, structured data, `robots.txt`, `sitemap.xml`
- `a11y` — accessibility-only fixes (focus rings, contrast, ARIA)
- `perf` — performance-only fixes (the *type* is also `perf`; use the *scope* when you want to be specific)
- `meta` — repo-level metadata (`README.md`, `LICENSE`, `.gitignore`, `CNAME`)
- `claude` — `CLAUDE.md` or `.claude/rules/` updates

```
feat(home): add featured-projects section
fix(a11y): restore focus to trigger on dialog close
docs(claude): add seo.md and tighten progressive-enhancement framing
```

Don't invent new vocabulary per commit. If your scope doesn't fit any of the above and the change isn't trivial, propose adding it to this list in the same commit.

## Subject line

- **Imperative mood.** "add," not "added" or "adds." Read it as completing "If applied, this commit will…"
- **Lowercase** after the colon.
- **No trailing period.**
- **Under 72 characters.** GitHub truncates around 70 in some views.
- **Concrete.** "fix bug" is not enough. "fix off-by-one in nav active-link logic" is.

## Body (optional)

Add a body when the change benefits from explanation:

- Blank line after the subject.
- Wrap at 72 columns.
- Explain *why* and the relevant context — not *what*, the diff shows that.
- Reference issues in the footer (`Refs: #123`, `Closes: #123`), not the body prose.

## Breaking changes

Mark a breaking change with `!` in the subject **and** a `BREAKING CHANGE:` footer:

```
refactor(styles)!: rename --color-bg tokens to --bg-*

BREAKING CHANGE: any external consumer of this stylesheet (none today,
but documenting the convention) must update token references.
```

For a single-author personal site, "breaking" mostly applies to URL changes (an old `/projects/foo` no longer resolves) or to any feed / metadata consumers downstream. Use `!` only when something out in the world will actually break.

## Reverts

```
revert: feat(home): add featured-projects section

Refs: <sha-of-reverted-commit>
```

Use the `revert` type plus the original subject verbatim. Put the SHA of the reverted commit in a footer.

## Authorship trailers

This project does **not** use `Co-Authored-By:` trailers by default. The git log credits the human committer only; AI-assisted authorship (Claude, Copilot, Cursor, etc.) is implicit and does not appear in commit metadata.

Add a `Co-Authored-By:` trailer only when crediting a real human collaborator who pair-programmed on the change. When committing on behalf of the user, do not append a Claude attribution trailer even if a default behavior would otherwise add one — the rule in this file overrides that default.

## One change per commit

A commit should be one logical change. If you need the word "and" to describe what a commit does, it's two commits.

This applies even mid-branch: if you've made messy WIP commits, **squash them before merging** so what lands on the default branch has a clean Conventional Commits log. The branch's pre-squash history is allowed to be messy; the merged history is not.

## Examples

Good:

```
feat(home): add featured-projects section
fix(a11y): give icon-only nav links visible labels for screen readers
refactor(styles): split base.css out of index.css
docs(claude): bootstrap CLAUDE.md and rules files
chore(meta): add CNAME for jeffarn.com
ci: add Lighthouse CI on pull requests
perf(assets): convert hero image to AVIF with WebP fallback
seo(home): add Person JSON-LD and canonical URL
```

Bad — and why:

- `Updated stuff` — no type, vague, wrong tense
- `feat: added new page.` — past tense, trailing period
- `fix(home): Fix the thing` — capital F after colon, placeholder subject
- `feat: add about page and tweak unrelated nav colors` — two changes in one commit; split
- `WIP` — never lands on the default branch; squash it out before merge

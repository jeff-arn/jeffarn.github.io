# Clean code rules

Project-specific clean-code preferences for the vanilla HTML / CSS / JS code in this repo. The bar is the same as Jeff's other projects; the language-specific rules here are scoped to plain JavaScript and HTML — there is no React, no TypeScript, no build pipeline.

This file overlaps with `javascript.md` and `css.md`. Where they differ, the more specific wins (`javascript.md` > this file for JS; `css.md` > this file for CSS).

## Functions

- **One job per function.** A function is a verb. If the name needs an "and," split it. *Validate, then save* is two functions, not one.
- **Don't extract for the sake of extraction.** A single-use helper that exists only to make a parent function shorter usually hurts readability — the reader jumps around, and the name lies about how reusable the code is. Inline beats extract when the helper would be called once and is not independently testable.
- **Early returns over nested conditionals.** Handle the edge case, return, and let the rest of the function read top-to-bottom at the happy-path indent level.
- **Parameter count is a smell, not a hard rule.** Three is fine, four is fine, six is a smell — the fix is an options object, not stuffing fields into module-level state.
- **Pure where possible, side-effecting where necessary, never both.** A function either computes a value or touches the DOM / network. Mixing them makes the function harder to reason about. Keep the boundary explicit.

## Naming

- **Names reveal intent, not implementation.** `posts` beats `fetchedPostData`. `featuredProject` beats `filteredItem`. Prefer the shorter form when context makes the implementation obvious.
- **Length scales with scope.** A `.map` callback variable can be `p`. A function-level variable used across 30 lines should be `publishedPosts`. A module-level export should be unambiguous on its own (`renderPublishedPostList`).
- **Verbs for functions, nouns for values.** `formatDate` not `dateFormat`. `theme` not `themeValue`. `isExpanded` not `expandedCheck`.
- **Prefer concrete over generic.** `posts` beats `items`. `parseFrontMatter` beats `processInput`.
- **HTML class names**: BEM-ish or simple component-scoped names (`.post-card`, `.post-card__title`). Lowercase, hyphenated. No abbreviations unless the abbreviation is universal (`.nav`, `.btn` are fine).
- **JS module names**: lowercase, hyphenated (`theme-toggle.js`, `copy-link.js`). One concern per module.

## JavaScript specifics

- **`const` by default, `let` when reassignment is genuinely needed, never `var`.**
- **No implicit globals.** Modules give us file-scoped bindings for free; rely on that. `window.foo = bar` is a code smell.
- **Modules export named functions and values, not default-exports.** Named exports rename loudly when they drift; default exports rename silently and break call sites.
- **Strict equality** (`===`, `!==`). The one exception is `value == null` to catch both `null` and `undefined` — fine when intentional.
- **Optional chaining and nullish coalescing** (`?.`, `??`) over hand-rolled guard clauses. They're clearer about intent.
- **No `any`-style casts that hide intent.** This codebase isn't typed, but pretending a value is something it isn't (`/** @type {Foo} */ (something)`) lies to the next reader. If the value is dynamic, narrow it with a runtime check.
- **`Array.from`, spread, `for…of`** over `forEach` when you need indices, breaks, or async — the right loop construct beats forcing one shape.

## Comments

- **Explain *why*, not *what*.** The code shows what. Comments exist for context the reader can't deduce: a workaround for a browser quirk, a non-obvious tradeoff, a link to a rule from another file, a domain rule that justifies an otherwise odd-looking branch.
- **Comments are not a failure.** A short comment explaining intent is cheaper than a heroic rename, and some context (browser bugs, performance tradeoffs, why an event listener uses `{ passive: true }`) genuinely cannot live in a name.
- **Update or delete drifting comments.** A wrong comment is worse than no comment. If you change behavior, scan for comments above and below the change.
- **No commit-message comments in code.** "Added to fix the home page bug" belongs in the commit, not the source.
- **No autobiographical comments.** "Jeff was here," dated TODOs without owners, and stream-of-consciousness debugging logs all get cleaned up before commit.

## Avoiding over-engineering

The most common failure mode in LLM-generated code — and in 11pm refactors — is solving problems that don't exist yet. Rules to push back:

- **YAGNI.** Don't add a config option, a theme switch, a layout variant, or a utility module unless something on the site uses it now. "We might want this later" is a TODO in your head, not code.
- **No speculative abstractions.** One implementation, no factory. One value, no enum-of-strings. Concrete code is cheaper to generalize later than a wrong abstraction is to undo.
- **No premature splitting.** A 200-line `index.html` that reads top-to-bottom is often clearer than five 40-line partial files glued together with build steps. This site has no build step on purpose; respect the constraint.
- **No "just in case" helpers.** A `formatDateOrNull` that handles a `null` you've never produced is dead code.
- **No defensive checks for impossible states.** If `document.querySelector('.foo')` cannot return null on this page (because the markup is in the same file), don't add a `if (!el) return;` guard "just in case." Either the element is required and a missing one is a bug worth crashing on, or the script should target a real boundary.
- **No "just in case" exports.** Module exports are the smallest set callers need. Treat the module's surface as part of its design.

## When to break a rule

Every rule above has exceptions. The bar for breaking one is:

1. Name the rule you are breaking, in a code comment or the commit body.
2. Explain why the alternative is worse for this specific case.
3. Be willing to defend it in review.

If you can't do all three, follow the rule.

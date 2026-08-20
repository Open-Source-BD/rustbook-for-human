# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Rust for Humans" — a W3Schools-style, learn-by-doing Rust course built with [mdBook](https://rust-lang.github.io/mdBook/). Each lesson has a runnable/editable code example (▶ Run button via the Rust Playground), an end-of-lesson quiz, and flashcards on a shuffled Review page. Deploys to GitHub Pages on every push to `main`.

## Commands

```bash
# one-time: install mdBook (needs Rust's cargo)
cargo install mdbook --locked

# regenerate lesson stubs + SUMMARY.md + bundle question banks, then serve with live reload
node tools/generate.mjs
mdbook serve --open      # http://localhost:3000

# validate lesson structure and question banks (used in CI-equivalent checks)
node tools/validate.mjs

# production build (output in book/, git-ignored)
mdbook build
```

There is no separate test suite — `tools/validate.mjs` is the correctness check: it exits non-zero on any ERROR (missing sections, dangling `AUTHORING:` placeholders, malformed quiz/flashcard data), and prints warnings for softer issues (empty quiz/flashcards, `rust,editable` blocks without `fn main`).

## Architecture

Content is generated from a single source of truth, then hand-edited:

1. **`tools/topics.data.js`** — the 43 topics (slug, title, category, level, summary, description, example code, pitfalls, takeaways, prereq/next links, external doc links). This is the authoritative topic list.
2. **`tools/generate.mjs`** — reads `topics.data.js` and:
   - writes one lesson stub per topic to `src/<category-dir>/<slug>.md` (skipped if the file already exists, so hand-edits are never clobbered — pass `--force` to regenerate stubs)
   - writes an empty quiz/flashcard stub to `questions/<slug>.json` (skipped if it already exists)
   - **always** regenerates `src/SUMMARY.md` (the mdBook sidebar) from the topic order/categories
   - **always** regenerates `theme/questions.data.js`, a bundle of every `questions/*.json` file into `window.RUST_QUESTIONS` / `window.RUST_TOPIC_ORDER`, so the quiz widget works offline without fetching JSON
3. **`src/<category>/<slug>.md`** — the actual lesson prose, hand-edited after the initial stub is generated. Required sections (checked by `validate.mjs`): `## What & why`, `## The idea, slowly`, `## Your turn`, `## Quick check` (contains `<div class="quiz" data-topic="<slug>">`), `## Remember this`.
4. **`questions/<slug>.json`** — per-topic quiz (`quiz: [{q, options, answer, explain}]`) and flashcards (`flashcards: [{front, back}]`). A question written once serves both as the end-of-lesson quiz and as a Review-page flashcard.
5. **`theme/retention.js`** + **`theme/retention.css`** — the quiz/flashcard widget, vanilla JS with no dependencies. Reads `window.RUST_QUESTIONS` (not a network fetch) and persists progress to `localStorage` under a versioned key prefix (`rfh:v1:`) so it survives reloads and works fully offline.

### Editing workflow

- **Editing an existing lesson**: just edit the `.md` file directly in `src/`.
- **Editing quiz/flashcards**: edit `questions/<slug>.json`, then re-run `node tools/generate.mjs` to rebuild `theme/questions.data.js` (this file is auto-generated — never hand-edit it).
- **Adding a new topic**: add an entry to `tools/topics.data.js`, then run `node tools/generate.mjs` to create its lesson stub, sidebar entry, and empty question bank.
- After any content change, run `node tools/validate.mjs` before committing.

### Runnable code fence conventions

- ` ```rust,editable ` — editable block with a ▶ Run button (executes on the real Rust Playground). Only for examples that compile with the standard library alone; the mdBook playground needs a `fn main`, so `generate.mjs` auto-wraps bare snippets that lack one.
- ` ```rust ` — syntax-highlighted, no Run button. For examples needing an external crate (serde, tokio, axum…) or real I/O, which the Playground can't run.
- ` ```bash ` — terminal commands.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: installs mdBook, runs `node tools/generate.mjs`, runs `mdbook build`, and publishes `book/` to GitHub Pages. Pages must be configured with **Settings → Pages → Source: GitHub Actions**.

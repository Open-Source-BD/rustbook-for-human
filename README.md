# Rust for Humans

A W3Schools-style, learn-by-doing Rust course. Dead-simple explanations, a **▶ Run** button on
every example, a quiz after every topic, fix-the-code exercises, and a shuffled flashcard **Review**
page so it actually sticks.

Built with [mdBook](https://rust-lang.github.io/mdBook/) (the same tool as the official Rust Book).

## Develop locally

```bash
# one-time: install mdBook (needs Rust's cargo)
cargo install mdbook --locked

# generate lesson stubs + question bundle from the topic data, then serve live
node tools/generate.mjs
mdbook serve --open      # http://localhost:3000, live-reloads on save
```

## How it's structured

```
src/                 lesson Markdown (one folder per category) + SUMMARY.md (the sidebar)
questions/<slug>.json quiz + flashcard bank for each topic
theme/retention.js    the quiz + flashcard widget (vanilla JS, no dependencies)
theme/retention.css   its styling
theme/questions.data.js  AUTO-GENERATED bundle of all question banks (do not edit)
tools/topics.data.js  the 43 source topics (ported from the original rust-atlas app.js)
tools/generate.mjs    ports topics -> lesson stubs, builds SUMMARY.md, bundles questions
book/                 build output (git-ignored)
```

## Adding or editing content

- **Edit a lesson:** just edit its `.md` file in `src/`. Re-run `node tools/generate.mjs` only if
  you changed a `questions/*.json` file (it rebuilds the browser bundle).
- **Add quiz questions / flashcards:** edit `questions/<slug>.json`, then run
  `node tools/generate.mjs`. A question written once appears both as the topic's end-of-lesson
  quiz and as a flashcard on the Review page.
- **Add a whole new topic:** add it to `tools/topics.data.js`, then `node tools/generate.mjs`
  creates its lesson stub, sidebar entry, and empty question bank. Existing hand-edited lessons are
  never overwritten (use `--force` to regenerate stubs).

### Runnable code rules

- ` ```rust,editable ` = an editable block with a working **▶ Run** button (runs on the official
  Rust Playground). Use it only for examples that compile with the standard library alone.
- ` ```rust ` = shown with highlighting but no Run button. Use it for examples that need an
  external crate (serde, tokio, axum…) or real I/O, which the Playground can't run.
- ` ```bash ` = terminal commands.

## Deploy (free, on GitHub Pages)

Push to a GitHub repo. The workflow in `.github/workflows/deploy.yml` builds and publishes to
Pages on every push to `main`. In the repo: **Settings → Pages → Source: GitHub Actions**.

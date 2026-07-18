# Workspaces and crates

> **Intermediate** · Runtime & ecosystem

## What & why

A **crate** is one unit of Rust code that compiles together — basically one library or one program.
A **workspace** is a folder that holds several crates and builds them as a team, sharing one lock
file and one `target/` build folder. You reach for a workspace when a single project grows big
enough that splitting it into pieces (an API crate, a core-logic crate, a shared-types crate) keeps
things sane.

## The idea, slowly

### First, what exactly is a crate?

The word "crate" gets used loosely, so let's pin it down. A crate is the smallest amount of code
the Rust compiler considers at once. There are two kinds:

- A **binary crate** produces a program you can run — it has a `main` function. Your CLI or web
  server is a binary crate.
- A **library crate** produces code meant to be *used by other crates* — it has no `main`. `serde`
  and `axum` are library crates.

A **package** is what Cargo manages: a folder with a `Cargo.toml`. A package contains one or more
crates. When you run `cargo new myapp`, you get a package with one binary crate. Most of the time
"crate" and "package" feel like the same thing, and that's fine while learning.

### Why split a project up at all?

Imagine one giant `main.rs` with 10,000 lines: the web routes, the database code, the business
logic, the shared data types, all tangled together. Problems pile up:

- Change one line and Cargo recompiles *everything* — slow.
- There's no enforced boundary, so the database code can secretly reach into the web code and
  create a mess.
- You can't reuse the business logic in a second program (say, a CLI) without dragging the whole
  web server along.

Splitting into separate crates fixes all three: each crate compiles on its own (faster rebuilds),
the boundaries between them are *enforced by the compiler*, and you can reuse a crate anywhere.

### What a workspace looks like

A workspace is a top-level `Cargo.toml` that lists its member crates. It has **no** `[package]`
section of its own — just `[workspace]`:

```toml
# Cargo.toml at the project root
[workspace]
resolver = "2"
members = [
    "crates/api",     # the web server (binary crate)
    "crates/core",    # business logic (library crate)
]
```

The folder layout that goes with it:

```text
myproject/
├── Cargo.toml          <- the workspace file above (no [package])
├── Cargo.lock          <- ONE shared lock file for everyone
├── target/             <- ONE shared build output folder
└── crates/
    ├── api/
    │   ├── Cargo.toml   <- has its own [package]
    │   └── src/main.rs
    └── core/
        ├── Cargo.toml   <- has its own [package]
        └── src/lib.rs
```

The two big shared things — `Cargo.lock` and `target/` — are what make it a *workspace* instead of
just two unrelated folders. Shared lock file means every crate uses the *same version* of each
dependency. Shared `target/` means a dependency is compiled once and reused, not rebuilt per crate.

### Making one crate use another

Inside `crates/api/Cargo.toml`, you depend on the `core` crate by pointing at its path:

```toml
[package]
name = "api"
version = "0.1.0"
edition = "2021"

[dependencies]
core = { path = "../core" }
```

Now `api`'s code can call anything `core` marked as `pub`:

```rust
// in crates/api/src/main.rs
use core::greet;

fn main() {
    println!("{}", greet("world"));
}
```

The boundary is real: `api` can only touch what `core` chose to make public. That's the compiler
enforcing your architecture for you.

### Running things in a workspace

From the root, Cargo commands understand the whole workspace:

```bash
cargo build                  # build every crate
cargo run -p api             # run a specific crate by its package name
cargo test                   # test every crate
```

The `-p` (for "package") flag picks one member when you don't want all of them.

### Sharing dependency versions in one place

A newer, very handy feature: declare a dependency's version *once* at the workspace root, and let
every crate inherit it. That stops the classic bug where crate A uses serde 1.0.150 and crate B
uses 1.0.200:

```toml
# root Cargo.toml
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }

# a member's Cargo.toml
[dependencies]
serde = { workspace = true }
```

## Common mistakes

- **Splitting into crates too early.** If the boundary between "api" and "core" isn't real yet,
  you'll spend more time shuffling code between crates than building. Start with one crate; split
  only when a seam clearly exists.
- **Putting a `[package]` section in the workspace root.** The root `Cargo.toml` for a pure
  workspace has `[workspace]` and no `[package]`. Mixing them up confuses Cargo about what to build.
- **Forgetting `path = "../core"` for local crates.** Cargo looks up dependencies on crates.io by
  default; a local crate needs an explicit path or Cargo can't find it.
- **Version drift between crates.** Without `[workspace.dependencies]`, different members can pin
  different versions of the same crate, causing duplicate compiles and subtle type-mismatch errors.
- **Expecting private items to cross the boundary.** One crate can only use another's `pub` items.
  Forgetting `pub` gives a "not found" error even though the item is right there.

## Your turn

This is a **spot-the-bug** in a `Cargo.toml`, since a workspace isn't a runnable program. This root
file is meant to define a workspace with two members, but Cargo rejects it. What's wrong, and why?

```toml
[package]
name = "myproject"
version = "0.1.0"

[workspace]
members = ["crates/api", "crates/core"]
```

<details><summary>Show solution</summary>

The root file mixes a `[package]` section into what should be a pure workspace root. A workspace
root `Cargo.toml` describes the *group*, not a package to build, so it should have only
`[workspace]`:

```toml
[workspace]
resolver = "2"
members = ["crates/api", "crates/core"]
```

The actual packages live in `crates/api/Cargo.toml` and `crates/core/Cargo.toml`, each with its own
`[package]` section. Keeping `[package]` out of the root is what tells Cargo "this folder
coordinates crates; it isn't a crate itself." (You *can* have a package at the root too — a "root
package" workspace — but for a clean multi-crate layout, keep the root workspace-only.)

</details>

## Quick check

<div class="quiz" data-topic="workspaces-and-crates"></div>

## Remember this

- A **crate** is one compile unit: a *binary* crate has `main`, a *library* crate is meant to be used by others.
- A **workspace** groups multiple crates, sharing one `Cargo.lock` and one `target/` folder.
- The workspace root `Cargo.toml` has `[workspace]` with a `members` list and (usually) no `[package]`.
- Depend on a local crate with `path = "../other"`; you can only use its `pub` items.
- Split into crates only when a real boundary exists — enforced boundaries and faster rebuilds are the payoff.
- Use `[workspace.dependencies]` to pin shared dependency versions in one place.

## Go deeper

- [Cargo Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html) — Multi-crate project structure.

**Next:**

- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)
- [Serde and JSON](../runtime-and-ecosystem/serde-and-json.md)

# Integration testing

> **Intermediate** · Runtime & ecosystem

## What & why

Unit tests check pieces of your code from the inside, with full access to private internals. Integration tests check your crate the way an actual downstream user would: importing it like a dependency and calling only what's `pub`. That catches a specific class of bug unit tests structurally can't — "it works internally, but the public API I actually shipped doesn't hang together." Cargo has a dedicated `tests/` directory for exactly this.

## The idea, slowly

### The `tests/` directory: one file, one crate

Integration tests live in a top-level `tests/` folder, as siblings of `src/`:

```
my_project/
├── Cargo.toml
├── src/
│   └── lib.rs        # your library code
└── tests/
    └── api.rs         # an integration test file
```

Cargo automatically compiles **every `.rs` file directly under `tests/`** as its own separate binary crate, linked against your library the same way any external project would depend on it. That's why the file imports your crate by name instead of using `super`:

```rust
// tests/api.rs
use my_crate::add;

#[test]
fn public_add_works() {
    assert_eq!(add(2, 2), 4);
}
```

There's no `#[cfg(test)]` here, and no `mod` wrapper — the whole *file* only exists as test code by virtue of living in `tests/`, so Cargo already knows to build and run it only during `cargo test`.

### Only `pub` items are visible

Because each `tests/*.rs` file is compiled as a genuinely separate crate, it goes through the same visibility rules as any other crate depending on yours: it can only see items marked `pub`. A private helper function inside `src/lib.rs` simply doesn't exist as far as `tests/api.rs` is concerned — there's no `super` to reach through, because it isn't a child module of your crate, it's a different crate entirely. This is the opposite tradeoff from `#[cfg(test)] mod tests` unit tests, which live inside the crate and can see everything.

### Why this only applies to library crates

For `use my_crate::add;` to mean anything, there has to be a compiled library (an `rlib`) named `my_crate` for the test file to depend on. A `src/lib.rs` produces exactly that. A project with only a `src/main.rs` and no library target doesn't — a binary crate isn't a dependency anything can `use`, including your own `tests/` files. If you want integration tests for logic that currently lives in `main.rs`, the standard move is to pull that logic into `src/lib.rs` and make `main.rs` a thin wrapper that calls into it:

```rust
// src/lib.rs
pub fn run() -> i32 {
    42
}
```

```rust
// src/main.rs
fn main() {
    println!("{}", my_crate::run());
}
```

```rust
// tests/smoke.rs
use my_crate::run;

#[test]
fn run_returns_the_expected_value() {
    assert_eq!(run(), 42);
}
```

Now `tests/smoke.rs` has something real to import, and `main.rs` stays a thin entry point.

### Sharing setup code: `tests/common/mod.rs`

If two test files need the same setup helper, the naive move — a file called `tests/common.rs` — backfires: Cargo treats *every* direct child of `tests/` as its own test crate, so `common.rs` gets compiled and run as a test binary too, showing up in `cargo test` output with zero tests in it. It's harmless but noisy, and it's not what you meant.

The idiomatic fix is a subdirectory using the old-style module file name, `tests/common/mod.rs`. Cargo only auto-discovers files *directly* inside `tests/`, not ones nested in a subdirectory — so `tests/common/mod.rs` is never treated as a test crate of its own. Each test file that wants it declares it explicitly with `mod common;`:

```
tests/
├── common/
│   └── mod.rs
├── api.rs
└── more_api.rs
```

```rust
// tests/common/mod.rs
pub fn setup() -> String {
    "test-fixture-value".to_string()
}
```

```rust
// tests/api.rs
mod common;

use my_crate::add;

#[test]
fn public_add_works() {
    let _fixture = common::setup();
    assert_eq!(add(2, 2), 4);
}
```

`mod common;` tells this particular test crate "compile the file at `common/mod.rs` as a module here" — it becomes part of `tests/api.rs`'s own crate, not a standalone test crate, so it never shows up as its own entry in the test summary.

## Common mistakes

- **Expecting `tests/` to see private items.** It structurally can't — each file is a separate crate that only sees your `pub` surface. If you need to check a private helper directly, that's what a `#[cfg(test)] mod tests` unit test (previous lesson) is for.
- **Naming a shared helper file `tests/common.rs`.** Cargo runs it as its own (nearly empty) test crate. Use `tests/common/mod.rs` instead so it's only ever pulled in via `mod common;`.
- **Writing integration tests for a binary-only crate.** With no `src/lib.rs`, there's no library for `tests/*.rs` to `use` — move the logic you want to test into a library target first.
- **Underestimating the cost.** Each file directly under `tests/` triggers its own full compile of your library. A handful of files is fine; dozens of large integration test files can noticeably slow down `cargo test`.

## Your turn

This integration test won't compile — it's reaching for something integration tests structurally can't see.

```rust
// src/lib.rs
fn helper(x: i32) -> i32 {
    x * 2
}

pub fn double_and_add_one(x: i32) -> i32 {
    helper(x) + 1
}
```

```rust
// tests/api.rs
use my_crate::helper;

#[test]
fn helper_doubles() {
    assert_eq!(helper(5), 10);
}
```

<details><summary>Show solution</summary>

`helper` isn't `pub`, and `tests/api.rs` is a separate crate — it can only import public items, so `use my_crate::helper;` fails with "function `helper` is private." There are two legitimate fixes, and which one is right depends on intent.

If `helper` genuinely needs its own direct test, that's a job for a unit test *inside* `src/lib.rs`, where `use super::*` can reach it:

```rust
// src/lib.rs
fn helper(x: i32) -> i32 {
    x * 2
}

pub fn double_and_add_one(x: i32) -> i32 {
    helper(x) + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn helper_doubles() {
        assert_eq!(helper(5), 10);
    }
}
```

But if the goal was really to check the crate's public behavior, the integration test should exercise the `pub` function instead — that's what an outside user would actually call:

```rust
// tests/api.rs
use my_crate::double_and_add_one;

#[test]
fn public_function_works() {
    assert_eq!(double_and_add_one(5), 11);
}
```

The rule of thumb: private implementation details get unit-tested from the inside; only your public API gets integration-tested from the outside.

</details>

## Quick check

<div class="quiz" data-topic="integration-testing"></div>

## Remember this

- Each `.rs` file directly under `tests/` is compiled as its own separate crate, linked against your library exactly like an external user's project would be.
- Integration tests only see `pub` items — reach for a `#[cfg(test)]` unit test if you need private internals.
- This only works for library crates: a binary-only crate (no `src/lib.rs`) has no importable public API.
- `tests/common/mod.rs` shares setup helpers via `mod common;` without being auto-discovered as its own test file — `tests/common.rs` would be.
- Each file in `tests/` triggers its own compile of your crate, so a large integration suite can noticeably slow `cargo test`.

## Go deeper

- [Rust Book - Test Organization](https://doc.rust-lang.org/book/ch11-03-test-organization.html) — Unit vs integration test layout.

**Next:**

- [Doc tests and benchmarks](../runtime-and-ecosystem/doc-tests-and-benchmarks.md)

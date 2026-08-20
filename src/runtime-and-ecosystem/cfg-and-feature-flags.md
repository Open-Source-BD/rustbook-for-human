# cfg and Cargo feature flags

> **Intermediate** · Runtime & ecosystem

## What & why

`#[cfg(...)]` is an "if" that the compiler evaluates *before* your program exists — code that doesn't match gets thrown away at compile time, not skipped at runtime. Cargo features are the switches you flip to control those conditions: they let one crate offer optional functionality (and optional dependencies) that stays out of the binary unless someone asks for it. Together they're how a crate stays small and portable by default while still supporting Linux-only code, test-only helpers, or a heavy dependency nobody should pay for unless they use it.

## The idea, slowly

### `#[cfg(...)]`: an if-statement for the compiler

Put `#[cfg(condition)]` above an item (a function, a struct, a module, even a single line inside a function) and the compiler only keeps that item if the condition is true *for this build*. If it's false, the item isn't compiled — it's as if you deleted it, not as if you wrapped it in `if false`.

```rust,editable
fn main() {
    #[cfg(target_os = "linux")]
    println!("hello from linux");

    #[cfg(target_os = "macos")]
    println!("hello from macos");

    #[cfg(target_os = "windows")]
    println!("hello from windows");

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    println!("hello from some other OS");
}
```

Run this and exactly one line prints — the other three branches never made it into the compiled binary for your platform. Two other conditions come up constantly:

- `#[cfg(test)]` — true only when compiling with `cargo test`. This is how test modules stay out of your normal binary entirely.
- `#[cfg(debug_assertions)]` — true in a normal `cargo build`/`cargo run`, false in `cargo build --release`. Handy for extra checks or verbose output you only want during development.

```rust,editable
fn main() {
    #[cfg(debug_assertions)]
    println!("running a debug build (cargo run)");

    #[cfg(not(debug_assertions))]
    println!("running a release build (cargo run --release)");
}
```

### Declaring a Cargo feature

`#[cfg(target_os = "...")]` reacts to *where* you're compiling. Cargo features let you react to *what someone asked for*. You declare them in a `[features]` table in `Cargo.toml`:

```toml
[package]
name = "mytool"
version = "0.1.0"
edition = "2021"

[features]
json = []
```

That alone doesn't do anything by itself — it just gives the name `json` a meaning Cargo understands. Someone builds with it on via `cargo build --features json`, or a default feature list turns it on automatically:

```toml
[features]
default = ["json"]
json = []
```

### Checking a feature in code

Once a feature exists, `#[cfg(feature = "json")]` works exactly like `#[cfg(target_os = "...")]` — the item is compiled in only when that feature is enabled for this build:

```rust
#[cfg(feature = "json")]
pub fn to_json(value: &str) -> String {
    format!("\"{value}\"")
}
```

With `json` off, `to_json` doesn't exist in the compiled crate at all — calling it from elsewhere is a "function not found" error, not a runtime failure.

### Making a heavy dependency opt-in

The most common real use of features: a crate wants to *support* something like JSON output, but doesn't want to force every user to pull in `serde_json` if they never use it. The pattern is `optional = true` on the dependency plus a feature of the same name that turns it on:

```toml
[dependencies]
serde_json = { version = "1", optional = true }

[features]
json = ["dep:serde_json"]
```

`optional = true` means "don't compile this dependency in unless something enables it." The `dep:serde_json` syntax in the feature list is what actually enables it — it says "turning on `json` also turns on the `serde_json` dependency." Now `serde_json` is compiled and linked *only* for people who opt into `json`, and everyone else's build stays smaller and faster to compile.

### Features are additive — never conflicting

Here's the rule that matters once your crate has dependents: **features are additive across the entire dependency graph.** If your crate and someone else's dependency both depend on `serde_json` — and either one enables its `json` feature — that feature is on for *everyone* using `serde_json` in that build, not just for the crate that asked for it. Cargo builds each dependency exactly once per build, with the union of every feature anyone requested.

This means a feature must only ever *add* capability (extra functions, extra impls) — never *change* existing behavior in a way that could conflict with what another crate expects. If one crate needed `json` off and another needed it on in the same build, there is no way to satisfy both — Cargo has no concept of "on for me, off for you."

## Common mistakes

- **Using `#[cfg(feature = "x")]` without declaring `x` in `[features]`.** It doesn't error, but modern Cargo warns `unexpected cfg condition value` — and worse, the code is silently, permanently excluded because the feature can never be turned on. Always declare every feature you check.
- **Forgetting `optional = true` on the dependency.** If `serde_json` isn't optional, it gets compiled in for *everyone*, feature or not — the `[features]` entry becomes decorative and doesn't shrink anyone's build.
- **Forgetting the `dep:` prefix.** `json = ["serde_json"]` (no `dep:`) also implicitly creates a public feature literally named `serde_json` that others can enable directly — usually not what you want. `dep:serde_json` enables the dependency without exposing a redundant feature name.
- **Designing a feature that changes behavior instead of adding it.** Because features unify across the whole build, a feature that flips existing behavior (rather than adding a new function or impl) can silently change how a *different* crate in the same build behaves, purely because something else in the graph turned it on.
- **Never testing `--no-default-features` or feature combinations.** Code behind a feature that's always on in your own testing can silently rot — it compiles for you, but breaks the moment someone builds without your defaults.

## Your turn

This `Cargo.toml` and `lib.rs` are supposed to make `serde_json` an opt-in dependency behind a `json` feature — someone who doesn't need JSON shouldn't have to compile it. But `serde_json` still gets compiled into *every* build, feature or not, and the feature does nothing:

```toml
[package]
name = "mytool"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1"
```

```rust
#[cfg(feature = "json")]
pub fn to_json(value: &str) -> String {
    serde_json::to_string(value).unwrap()
}
```

<details><summary>Show solution</summary>

Two things are missing: the dependency was never marked optional, and the `json` feature that should control it was never declared, so `to_json` can never actually be turned on.

```toml
[package]
name = "mytool"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = { version = "1", optional = true }

[features]
json = ["dep:serde_json"]
```

```rust
#[cfg(feature = "json")]
pub fn to_json(value: &str) -> String {
    serde_json::to_string(value).unwrap()
}
```

Now `serde_json` is compiled only when `json` is enabled (`cargo build --features json`), and `to_json` becomes reachable at exactly the same time — the feature and the dependency it needs turn on together instead of being two disconnected pieces.

</details>

## Quick check

<div class="quiz" data-topic="cfg-and-feature-flags"></div>

## Remember this

- `#[cfg(...)]` removes non-matching code at compile time — it's not a runtime `if`, the code simply isn't there.
- `#[cfg(target_os = "linux")]`, `#[cfg(test)]`, and `#[cfg(debug_assertions)]` are the conditions you'll reach for most.
- Declare a feature in `[features]` in `Cargo.toml`; check it in code with `#[cfg(feature = "name")]`.
- `optional = true` on a dependency plus `feature = ["dep:name"]` is the standard way to make a heavy dependency opt-in.
- Features are additive across the whole dependency graph — if anything enables one, it's on for everyone using that dependency, so a feature must only add capability, never change existing behavior in a conflicting way.

## Go deeper

- [Cargo Book - Features](https://doc.rust-lang.org/cargo/reference/features.html) — Declaring and using Cargo features.
- [Rust Reference - Conditional compilation](https://doc.rust-lang.org/reference/conditional-compilation.html) — Every #[cfg] predicate.

**Next:**

- [Build scripts (build.rs)](../runtime-and-ecosystem/build-scripts.md)

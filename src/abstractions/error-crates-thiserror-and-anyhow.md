# thiserror and anyhow

> **Intermediate** · Abstractions

## What & why

The `ConfigError` from the last lesson took five separate pieces — the enum, `impl Display`, `impl Error`, one `impl From` per source error — just to model two ways of failing. Multiply that by every error type in a real project and it's a lot of near-identical boilerplate. Almost every real Rust codebase reaches for one of two crates to cut it down: **`thiserror`** derives all that boilerplate for a precise, `match`-able error enum (great for libraries), and **`anyhow`** gives you a single catch-all error type for application code that just wants to propagate failures upward with a helpful message attached (great for binaries).

## The idea, slowly

### The problem, restated

Here's the previous lesson's `ConfigError`, in full, as a reminder of what we're about to compress:

```rust
use std::fmt;

#[derive(Debug)]
enum ConfigError {
    Missing(String),
    Invalid(std::num::ParseIntError),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ConfigError::Missing(key) => write!(f, "missing key: {key}"),
            ConfigError::Invalid(e) => write!(f, "invalid value: {e}"),
        }
    }
}
impl std::error::Error for ConfigError {}
impl From<std::num::ParseIntError> for ConfigError {
    fn from(e: std::num::ParseIntError) -> Self {
        ConfigError::Invalid(e)
    }
}
```

Four trait impls to express two variants. `thiserror` generates all of it from attributes on the enum itself.

### `thiserror`: derive the boilerplate

Add `thiserror = "1"` (or `"2"`, check the latest) to `Cargo.toml`, then `#[derive(thiserror::Error)]` with an `#[error("...")]` message per variant:

```rust
#[derive(thiserror::Error, Debug)]
enum ConfigError {
    #[error("missing key: {0}")]
    Missing(String),

    #[error("invalid value")]
    Invalid(#[from] std::num::ParseIntError),
}
```

That's the entire type. `#[derive(Error)]` generates the `std::error::Error` impl; each `#[error("...")]` generates the matching arm of `Display` (`{0}` refers to the variant's first field, same idea as `format!`); and `#[from]` on a field generates the `From<ParseIntError> for ConfigError` impl too, so `?` still auto-converts exactly as before. Four hand-written impls become two attributes.

**What the compiler is thinking:** `#[derive(thiserror::Error)]` is a proc macro — it runs at compile time and writes ordinary `impl Display` / `impl Error` / `impl From` blocks for you, identical in spirit to what you wrote by hand last lesson. `#[from]` can only appear on one field per underlying error type, because it's generating a `From` impl, and a type can only have one `From<ParseIntError>` implementation.

### `anyhow`: one error type for applications

`thiserror` is precise — it's for library code whose callers want to `match` on exactly what went wrong. But `main` and application-level code usually don't `match` on error variants; they just want to propagate *something that failed*, print it, and exit. Add `anyhow = "1"` and reach for `anyhow::Result<T>` — shorthand for `Result<T, anyhow::Error>` — which *any* error type converts into via `?`:

```rust
fn parse_port(text: &str) -> anyhow::Result<u16> {
    let port: u16 = text.parse()?; // ParseIntError converts into anyhow::Error automatically
    Ok(port)
}

fn main() -> anyhow::Result<()> {
    let port = parse_port("8080")?;
    println!("listening on {port}");
    Ok(())
}
```

No enum, no `Display` impl, no `From` impl — `anyhow::Error` accepts anything implementing `std::error::Error` (or a plain string), so every `?` in the function just works. This is the same idea as `Box<dyn Error>` from two lessons ago, but with a much nicer API layered on top — including the context features below.

### Adding context with `anyhow::Context`

A bare `ParseIntError` bubbling up from deep in your code says "invalid digit found in string" — technically true, unhelpful in a log. `anyhow::Context` (a trait — bring it into scope with `use anyhow::Context;`) adds `.context("...")` to any `Result`, attaching a message *without* losing the original error:

```rust
use anyhow::{Context, Result};

fn parse_port(text: &str) -> Result<u16> {
    text.parse()
        .context("PORT must be a valid port number")
}

fn main() -> Result<()> {
    let port = parse_port("not-a-number")?;
    println!("listening on {port}");
    Ok(())
}
```

If this fails, printing the error (e.g. via `eprintln!("{e:#}")` or letting `main` return the error) shows both layers: `PORT must be a valid port number: invalid digit found in string`. `.with_context(|| ...)` is the lazy version — for when building the message string costs something and you only want to pay for it on the failure path, same trade-off as `.unwrap_or_else()` from the first lesson.

### `bail!` and `ensure!`: early returns without a match

For application code, constructing a one-off error just to `return Err(...)` is more ceremony than the situation deserves. `anyhow::bail!` builds an error from a format string and returns immediately; `anyhow::ensure!` is `bail!` behind a condition check — like a fallible `assert!`:

```rust
use anyhow::{bail, ensure, Result};

fn set_port(port: i32) -> Result<u16> {
    if port < 0 {
        bail!("port cannot be negative: {port}");
    }
    ensure!(port <= 65535, "port {port} is out of range");
    Ok(port as u16)
}
```

`ensure!(cond, "message")` is exactly equivalent to `if !cond { bail!("message") }` — reach for whichever reads more clearly at the call site.

### Rule of thumb: thiserror for libraries, anyhow for binaries

- **Library crate** (code other crates will depend on): use `thiserror`. Callers may need to `match` on *which* error happened to decide how to react — `anyhow::Error` erases the concrete type, so a caller can't `match` on it at all, only print or downcast it.
- **Binary / application code** (the thing that's actually run): use `anyhow`. Nobody downstream needs to `match` on your `main`'s errors; they need a good message and a nonzero exit code.

It's common to see both in the same project: a library crate exposes a `thiserror` enum, and the application crate that depends on it uses `anyhow::Result` everywhere, letting `?` convert the library's precise errors in via `anyhow::Error`'s blanket `From` impl.

## Common mistakes

- **Using `anyhow` in a library's public API.** It forces every downstream caller into `anyhow` too, and they lose the ability to `match` on specific failures. Keep `anyhow` at the application boundary; expose a `thiserror` enum (or a plain `Result<T, YourError>`) from a library.
- **Calling `.context(...)` without `use anyhow::Context;` in scope.** `context` isn't an inherent method on `Result` — it's a trait method, so it doesn't exist until the trait is imported.
- **Putting `#[from]` on two fields of the same source error type.** `thiserror` generates one `From<X>` impl per `#[from]` field; two fields of the same `X` would need two conflicting `From<X>` impls, which doesn't compile.
- **Expecting to `match` on an `anyhow::Error`.** It's intentionally type-erased. If you need to distinguish error cases in application code, either keep using a `thiserror` enum there too, or `.downcast_ref::<SpecificError>()` on the `anyhow::Error` (rare, and usually a sign `thiserror` was the better fit).

## More examples

### A `thiserror` enum with two different `#[from]` sources
A config loader can fail while reading the file (`io::Error`) or while parsing a value out of it (`ParseIntError`) — `#[from]` on each field generates the matching `From` impl, so `?` still converts both automatically.

```rust
use std::io;
use std::num::ParseIntError;

#[derive(thiserror::Error, Debug)]
enum ConfigLoadError {
    #[error("couldn't read config file")]
    Io(#[from] io::Error),

    #[error("config value isn't a valid number")]
    BadNumber(#[from] ParseIntError),
}

fn load_max_connections(path: &str) -> Result<u32, ConfigLoadError> {
    let text = std::fs::read_to_string(path)?; // io::Error -> ConfigLoadError
    let max: u32 = text.trim().parse()?;       // ParseIntError -> ConfigLoadError
    Ok(max)
}
```

### Attaching context at every step of a pipeline
`main` here reads a file, parses it, and normalizes the result — `.context(...)` at each fallible step means a failure says exactly *which* step broke, not just what the underlying error was.

```rust
use anyhow::{Context, Result};

fn run() -> Result<()> {
    let raw = std::fs::read_to_string("threshold.txt")
        .context("reading threshold.txt")?;
    let threshold: f64 = raw
        .trim()
        .parse()
        .context("threshold.txt must contain a number")?;
    let normalized = (threshold / 100.0).clamp(0.0, 1.0);
    println!("normalized threshold: {normalized}");
    Ok(())
}

fn main() -> Result<()> {
    run().context("startup failed")
}
```

### Bailing out before doing any real work
A discount percentage outside 0-100 is nonsense input — `bail!` rejects it in one line, before the function bothers computing anything with it.

```rust
use anyhow::{bail, Result};

fn apply_discount(price: f64, percent: f64) -> Result<f64> {
    if !(0.0..=100.0).contains(&percent) {
        bail!("discount percent must be between 0 and 100, got {percent}");
    }
    Ok(price * (1.0 - percent / 100.0))
}

fn main() -> Result<()> {
    println!("{:.2}", apply_discount(80.0, 25.0)?);
    println!("{:.2}", apply_discount(80.0, 150.0)?); // bails before any math happens
    Ok(())
}
```

### A library's precise errors, wrapped in `anyhow` at the application boundary
The library crate below exposes a `thiserror` enum so its callers *could* match on specific failures; the binary that uses it doesn't care and just wants `?` to work, so it returns `anyhow::Result` instead.

```rust
// --- lib.rs (a library crate) ---
#[derive(thiserror::Error, Debug)]
pub enum StorageError {
    #[error("key not found: {0}")]
    NotFound(String),
}

pub fn get(key: &str) -> Result<String, StorageError> {
    if key == "config" {
        Ok("value".to_string())
    } else {
        Err(StorageError::NotFound(key.to_string()))
    }
}

// --- main.rs (the binary crate, depends on the library above) ---
fn main() -> anyhow::Result<()> {
    let value = get("missing-key")?; // StorageError -> anyhow::Error automatically
    println!("{value}");
    Ok(())
}
```

## Your turn

`read_port` is meant to attach a helpful message to a parse failure, but it doesn't compile.

```rust
use anyhow::Result;

fn read_port(text: &str) -> Result<u16> {
    let port: u16 = text
        .parse()
        .context("PORT must be a valid port number")?; // error: no method `context` found
    Ok(port)
}

fn main() -> Result<()> {
    println!("{}", read_port("nope")?);
    Ok(())
}
```

<details><summary>Show solution</summary>

`.context(...)` comes from the `anyhow::Context` trait, not from an inherent method on `Result`. Without `use anyhow::Context;`, the compiler can't find the method at all: `no method named 'context' found for enum 'Result' in the current scope`. Import the trait:

```rust
use anyhow::{Context, Result};

fn read_port(text: &str) -> Result<u16> {
    let port: u16 = text
        .parse()
        .context("PORT must be a valid port number")?;
    Ok(port)
}

fn main() -> Result<()> {
    println!("{}", read_port("nope")?);
    Ok(())
}
```

Now `text.parse()` (which fails with `ParseIntError`) gets wrapped in an `anyhow::Error` carrying the extra context message, and `?` propagates that combined error out of `read_port`. Running this prints something like `Error: PORT must be a valid port number: invalid digit found in string` — the original cause is still there, just with a human message attached in front of it.

</details>

## Quick check

<div class="quiz" data-topic="error-crates-thiserror-and-anyhow"></div>

## Remember this

- `thiserror`: `#[derive(Error)]` plus `#[error("...")]` per variant generates `Display` and `std::error::Error`; `#[from]` on a field generates the matching `From` impl, so `?` still auto-converts.
- `anyhow::Result<T>` = `Result<T, anyhow::Error>` — any error type implementing `std::error::Error` converts into it via `?`, making it the fast default for `main` and application code.
- `.context("...")` / `.with_context(|| ...)` (from the `anyhow::Context` trait — remember to import it) attach a human message to a failing `Result` without discarding the original error.
- `anyhow::bail!("...")` returns early with a formatted error; `anyhow::ensure!(cond, "...")` is a fallible `assert!` — bails if the condition is false.
- Rule of thumb: `thiserror` for libraries (callers need to `match` on specific variants), `anyhow` for binaries/applications (callers just want to log or exit).

## Go deeper

- [thiserror docs](https://docs.rs/thiserror/) — Derive macro for error enums.
- [anyhow docs](https://docs.rs/anyhow/) — Catch-all error type for applications.

**Next:**

- [The builder pattern](../abstractions/builder-pattern.md)
- [Logging and tracing](../runtime-and-ecosystem/logging-and-tracing.md)

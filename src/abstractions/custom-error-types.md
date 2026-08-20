# Custom error types

> **Intermediate** · Abstractions

## What & why

A real function usually has more than one way to fail. `parse_env_number` from the last lesson could fail because the variable is missing *or* because the text isn't a number — two genuinely different problems a caller might want to handle differently. Reaching for `Box<dyn Error>` erases that distinction; the caller can only print it, not `match` on *which* thing went wrong. The idiomatic fix is your own error type: an enum with one variant per failure mode, wired up so `?` can convert into it automatically.

## The idea, slowly

### One enum, one variant per way to fail

Think of the error enum as an honest list of everything that can go wrong, named the way you'd explain it to a teammate:

```rust,editable
#[derive(Debug)]
enum ConfigError {
    Missing(String),                    // a key wasn't set
    Invalid(std::num::ParseIntError),   // a key was set, but not a valid number
}

fn main() {
    let e = ConfigError::Missing("PORT".to_string());
    println!("{:?}", e);
}
```

This is just a normal enum — nothing Rust-specific about error types yet. `#[derive(Debug)]` gives you a `{:?}` representation for free, which every error type should have.

### Telling the story: `impl Display`

`Debug` is for programmers; `Display` is for humans. Implementing `std::fmt::Display` gives your error a `{}` representation — the message a user or a log line would actually show:

```rust,editable
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

fn main() {
    let e = ConfigError::Missing("PORT".to_string());
    println!("{}", e); // missing key: PORT
}
```

The `match` inside `fmt` is exhaustive, same as any other `match` — add a variant later and the compiler will point at every `Display` (and every other `match`) that now needs updating.

### Becoming a "real" error: `impl std::error::Error`

`Display` alone makes a type *printable*, but Rust's error-handling ecosystem (the `?` operator's conversions, `Box<dyn Error>`, logging libraries) is built around the `std::error::Error` trait. Implementing it — often with an empty body, since it has sensible defaults — is what makes your type interoperate:

```rust,editable
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

fn main() {
    let e: Box<dyn std::error::Error> = Box::new(ConfigError::Missing("PORT".to_string()));
    println!("{e}");
}
```

**What the compiler is thinking:** `std::error::Error` requires `Debug + Display` as supertraits — that's why both had to come first. Once all three are in place, `ConfigError` can be boxed into `Box<dyn Error>`, returned alongside other error types, and passed to anything generic over `E: std::error::Error`.

### The magic: `impl From<X> for MyError` lets `?` convert automatically

Recall from the last lesson: `?` calls `From::from` on the error it sees, converting it into the function's declared error type. Implement `From<ParseIntError> for ConfigError` once, and every `?` on a `.parse()` call inside a function returning `Result<_, ConfigError>` converts automatically — no `.map_err(...)` needed:

```rust,editable
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

fn get_port(value: Option<&str>) -> Result<u16, ConfigError> {
    let text = value.ok_or_else(|| ConfigError::Missing("PORT".to_string()))?;
    let port: u16 = text.parse()?; // ParseIntError -> ConfigError via From, automatically
    Ok(port)
}

fn main() {
    println!("{:?}", get_port(Some("8080"))); // Ok(8080)
    println!("{:?}", get_port(Some("nope")));  // Err(Invalid(ParseIntError { .. }))
    println!("{:?}", get_port(None));          // Err(Missing("PORT"))
}
```

Now the caller gets a single, specific error type they can actually `match` on — `ConfigError::Missing` vs `ConfigError::Invalid` — instead of an opaque `Box<dyn Error>` that can only be printed.

### Chaining causes: `.source()`

Sometimes an error wraps *another* error, and callers (or logging tools) want to walk the whole chain — "this failed, because that failed, because this other thing failed." The `Error` trait has a `source()` method, defaulted to `None`, that you can override to expose the wrapped error:

```rust,editable
use std::fmt;

#[derive(Debug)]
enum ConfigError {
    Invalid(std::num::ParseIntError),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "invalid config value")
    }
}

impl std::error::Error for ConfigError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            ConfigError::Invalid(e) => Some(e), // the underlying ParseIntError
        }
    }
}

fn main() {
    let e = ConfigError::Invalid("nope".parse::<i32>().unwrap_err());
    println!("{e}");
    if let Some(cause) = std::error::Error::source(&e) {
        println!("caused by: {cause}");
    }
}
```

You won't need `source()` for every error type, but it's what lets tools print a full "Caused by: ... Caused by: ..." chain instead of just the top-level message.

## Common mistakes

- **Forgetting `impl std::error::Error`.** `Display` alone lets you print the error, but without `Error`, your type won't compose with code expecting `Box<dyn Error>`, and `?` can't convert *into* other error types that rely on the blanket `Error` conversions.
- **Skipping `From` impls and using `.map_err(|e| ConfigError::Invalid(e))` everywhere instead.** It works, but it's exactly the repetition `From` + `?` exists to eliminate — implement `From` once per source error type and let `?` do the wrapping.
- **One giant catch-all variant instead of one per failure mode.** `ConfigError::Other(String)` for everything defeats the point — callers can no longer `match` on *which* thing failed. Give each real failure mode its own variant.
- **Writing all of this by hand for every project.** It's exactly what the `thiserror` crate automates — see the next lesson before hand-rolling a large error enum from scratch.

## Your turn

`get_port` should convert a `ParseIntError` into a `ConfigError` automatically via `?`, but it doesn't compile.

```rust,editable
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

fn get_port(value: Option<&str>) -> Result<u16, ConfigError> {
    let text = value.ok_or_else(|| ConfigError::Missing("PORT".to_string()))?;
    let port: u16 = text.parse()?; // no From<ParseIntError> for ConfigError yet
    Ok(port)
}

fn main() {
    println!("{:?}", get_port(Some("nope")));
}
```

<details><summary>Show solution</summary>

`?` needs a `From<ParseIntError> for ConfigError` impl to convert the error from `.parse()` into `ConfigError`. Without it, the compiler reports a type mismatch on the `?` line — it has a `ParseIntError` and nowhere to convert it. Add the `From` impl:

```rust,editable
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

fn get_port(value: Option<&str>) -> Result<u16, ConfigError> {
    let text = value.ok_or_else(|| ConfigError::Missing("PORT".to_string()))?;
    let port: u16 = text.parse()?; // now converts automatically
    Ok(port)
}

fn main() {
    println!("{:?}", get_port(Some("nope"))); // Err(Invalid(ParseIntError { .. }))
    println!("{:?}", get_port(Some("8080"))); // Ok(8080)
}
```

Once `From<ParseIntError> for ConfigError` exists, `?` finds it and wraps the error automatically — that's the whole point of the pattern: implement the conversion once, and every fallible call site in a function returning `Result<_, ConfigError>` gets it for free.

</details>

## Quick check

<div class="quiz" data-topic="custom-error-types"></div>

## Remember this

- One enum variant per distinct failure mode keeps the caller's `match` meaningful — resist collapsing everything into one catch-all variant.
- Implement `Display` (a human message) + `std::error::Error` (interoperability); `Error` requires `Debug + Display` as supertraits.
- `impl From<X> for MyError` for each source error type lets `?` auto-convert — implement it once, use `?` everywhere instead of `.map_err(...)` at every call site.
- The `source()` method on `Error` (default `None`) lets callers walk the underlying cause chain when your error wraps another one.
- This whole pattern is boilerplate-heavy by hand — the next lesson shows how `thiserror` generates most of it for you.

## Go deeper

- [std::error::Error docs](https://doc.rust-lang.org/std/error/trait.Error.html) — The trait every error type should implement.

**Next:**

- [thiserror and anyhow](../abstractions/error-crates-thiserror-and-anyhow.md)
- [The builder pattern](../abstractions/builder-pattern.md)

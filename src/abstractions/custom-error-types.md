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

## More examples

### Three ways a CSV row can go wrong
A small import tool has to reject bad rows without crashing the whole batch — an enum with one variant per failure mode lets it explain exactly what was wrong with each line.

```rust,editable
#[derive(Debug)]
enum RowError {
    Empty,
    WrongFieldCount(usize),
    BadNumber(String),
}

fn parse_row(line: &str) -> Result<(String, f64), RowError> {
    if line.trim().is_empty() {
        return Err(RowError::Empty);
    }
    let fields: Vec<&str> = line.split(',').collect();
    if fields.len() != 2 {
        return Err(RowError::WrongFieldCount(fields.len()));
    }
    let price: f64 = fields[1]
        .trim()
        .parse()
        .map_err(|_| RowError::BadNumber(fields[1].to_string()))?;
    Ok((fields[0].to_string(), price))
}

fn main() {
    for line in ["apple,1.50", "banana", "  ", "pear,free"] {
        println!("{line:?} -> {:?}", parse_row(line));
    }
}
```

### Converting a std error automatically with `From`
Loading a settings file can fail because the file isn't there (an `io::Error`) or because it's empty — wiring up `From<io::Error>` means `?` handles the first case without a `.map_err(...)` at the call site.

```rust,editable
use std::fmt;
use std::io;

#[derive(Debug)]
enum SettingsError {
    Read(io::Error),
    Empty,
}

impl fmt::Display for SettingsError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SettingsError::Read(e) => write!(f, "couldn't read settings file: {e}"),
            SettingsError::Empty => write!(f, "settings file is empty"),
        }
    }
}

impl From<io::Error> for SettingsError {
    fn from(e: io::Error) -> Self {
        SettingsError::Read(e)
    }
}

fn load_settings(path: &str) -> Result<String, SettingsError> {
    let text = std::fs::read_to_string(path)?; // io::Error -> SettingsError via From
    if text.trim().is_empty() {
        return Err(SettingsError::Empty);
    }
    Ok(text)
}

fn main() {
    match load_settings("does-not-exist.toml") {
        Ok(text) => println!("loaded: {text}"),
        Err(e) => println!("error: {e}"),
    }
}
```

### Reacting differently depending on which variant you got
A network call might be worth retrying, or might not — matching on the specific error variant lets the caller decide, instead of treating every failure the same way.

```rust,editable
#[derive(Debug)]
enum FetchError {
    Timeout,
    NotFound,
}

fn fetch(attempt: u32) -> Result<String, FetchError> {
    match attempt {
        0 => Err(FetchError::Timeout),
        1 => Err(FetchError::Timeout),
        _ => Ok("payload".to_string()),
    }
}

fn main() {
    let mut attempt = 0;
    loop {
        match fetch(attempt) {
            Ok(data) => {
                println!("got it: {data}");
                break;
            }
            Err(FetchError::Timeout) => {
                println!("timed out, retrying...");
                attempt += 1;
            }
            Err(FetchError::NotFound) => {
                println!("gone for good, giving up");
                break;
            }
        }
    }
}
```

### Walking a chain of causes with `.source()`
When a database wrapper fails because the underlying connection failed, exposing that inner error through `.source()` lets a logger print the full "here's what actually broke" chain instead of a vague one-liner.

```rust,editable
use std::error::Error;
use std::fmt;
use std::io;

#[derive(Debug)]
struct DbError {
    cause: io::Error,
}

impl fmt::Display for DbError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "could not connect to database")
    }
}

impl Error for DbError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.cause)
    }
}

fn connect() -> Result<(), DbError> {
    let cause = io::Error::new(io::ErrorKind::ConnectionRefused, "port 5432 refused");
    Err(DbError { cause })
}

fn main() {
    if let Err(e) = connect() {
        println!("error: {e}");
        let mut source = e.source();
        while let Some(s) = source {
            println!("  caused by: {s}");
            source = s.source();
        }
    }
}
```

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

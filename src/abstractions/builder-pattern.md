# The builder pattern

> **Intermediate** · Abstractions

## What & why

Many languages let you write `new Server(host: "localhost", port: 8080, timeout: None)` — named arguments, some optional, in any order. Rust has neither constructor overloading nor named/optional function arguments. A `fn new(host: String, port: u16, timeout_ms: Option<u32>, retries: u8, tls: bool)` gets unreadable fast, and every call site is a wall of positional values you have to count to understand. The **builder pattern** is Rust's answer: a separate type with small chainable setter methods and a final `.build()` that assembles (and validates) the real struct. It's not a hack — it's the idiomatic, ecosystem-standard way to construct anything with several optional pieces (`reqwest::Client::builder()`, `std::process::Command`, `std::thread::Builder`).

## The idea, slowly

### Why not just add fields as constructor arguments?

Imagine a `ServerConfig` with a required `host`, and optional `port`, `timeout_ms`, and `tls`. Without a builder you're stuck picking one bad option:

- One giant constructor with every field as a parameter — callers must remember the order, and `ServerConfig::new("localhost", 8080, 5000, true)` reads like noise; nobody can tell what `5000` or `true` mean at a glance.
- A pile of near-duplicate constructors (`new`, `new_with_port`, `new_with_port_and_tls`, ...) — this is "constructor overloading" simulated by hand, and it explodes combinatorially as fields grow.

A builder sidesteps both: each optional piece gets its own named method, called only when you need it, in whatever order you like.

### The chainable setter pattern

The trick is that every setter takes `self` **by value** and returns `Self`. Taking `self` (not `&self`) means the method *consumes* the builder and hands back a (modified) one, which is exactly what lets you chain `.method().method().method()` — each call produces the next builder in the chain:

```rust,editable
#[derive(Default)]
struct ServerConfigBuilder {
    host: String,
    port: u16,
    tls: bool,
}

impl ServerConfigBuilder {
    fn host(mut self, host: &str) -> Self {
        self.host = host.to_string();
        self // hand the (modified) builder back
    }

    fn port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    fn tls(mut self, tls: bool) -> Self {
        self.tls = tls;
        self
    }
}

fn main() {
    let builder = ServerConfigBuilder::default()
        .host("localhost")
        .port(8080)
        .tls(true);

    println!("host={} port={} tls={}", builder.host, builder.port, builder.tls);
}
```

**What the compiler is thinking:** `mut self` means the method owns the builder for the duration of its body — it's free to mutate its own copy. Returning `self` at the end moves that (now-updated) builder out to the caller. Because the return type is `Self`, the very next `.method()` call has something of the right type to call on. Drop the `-> Self` and forget to return `self`, and the method implicitly returns `()` — the chain breaks at the *next* call with a type error, not at the method you actually got wrong (more on this below).

`#[derive(Default)]` gives every field its zero value (`String::new()`, `0`, `false`) for free, so `ServerConfigBuilder::default()` is a clean starting point without writing a `new()` by hand.

### `.build()`: where validation lives

So far the builder is just a struct in disguise. The real value shows up when some fields are *required* and others aren't. Store required fields as `Option<T>` inside the builder, and let `.build()` check that they were actually set — returning a `Result` so the caller can't ignore a missing field:

```rust,editable
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Default)]
struct ServerConfigBuilder {
    host: Option<String>,
    port: Option<u16>,
}

impl ServerConfigBuilder {
    fn host(mut self, host: &str) -> Self {
        self.host = Some(host.to_string());
        self
    }

    fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    fn build(self) -> Result<ServerConfig, String> {
        Ok(ServerConfig {
            host: self.host.ok_or("host is required")?,
            port: self.port.unwrap_or(8080), // has a sensible default
        })
    }
}

fn main() {
    let ok = ServerConfigBuilder::default().host("localhost").build();
    let missing = ServerConfigBuilder::default().port(9000).build();

    match ok {
        Ok(c) => println!("ok: host={} port={}", c.host, c.port),
        Err(e) => println!("error: {}", e),
    }
    match missing {
        Ok(c) => println!("ok: host={} port={}", c.host, c.port),
        Err(e) => println!("error: {}", e), // this one runs: "host is required"
    }
}
```

`.build()` takes `self` by value one last time (no more chaining after this — construction is finished), uses `?` and `.ok_or(...)` to turn a missing `Option` into an `Err`, and only returns `Ok(ServerConfig { .. })` once every required piece is actually present. This is the same `Result`/`?` discipline from error handling, applied to object construction instead of a fallible computation.

### When a builder is overkill

A builder is worth its ceremony when a struct has several optional fields, or when construction needs validation. For two or three fields with no real optionality, it's pure overhead — reach for `Default` plus struct-update syntax instead:

```rust,editable
#[derive(Default, Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let origin = Point::default();
    let shifted = Point { x: 10, ..Default::default() }; // y stays 0
    println!("{:?} {:?}", origin, shifted);
}
```

`..Default::default()` fills in every field you didn't name explicitly. No builder type, no `.build()`, no chain — just a struct literal. Save the builder for when it earns its keep.

## Common mistakes

- **A builder for a 2-3 field struct.** It's more code to read and maintain than a plain constructor or `Default` + `..Default::default()`. Builders pay off once fields are numerous, optional, or need validation — not by default.
- **Forgetting to return `Self` from a setter.** If a setter's signature is `fn port(mut self, port: u16)` (no `-> Self`), it implicitly returns `()`. The setter itself compiles fine — the error shows up one call later, at the *next* `.method()` in the chain, as "no method named `port` found for type `()`". Always double-check every setter ends in `-> Self { ...; self }`.
- **Skipping validation in `.build()`.** If `.build()` just always returns `Ok(...)` (or isn't fallible at all) for a struct with genuinely required fields, you've reinvented "trust me it's fine" — exactly what `Result` exists to avoid. Use `Option` fields plus `.ok_or(...)?` for anything required.
- **Mutating through `&mut self` instead of consuming `self`.** Both styles exist in real code, but mixing them confuses callers: consuming-`self` builders must be reassigned (`b = b.port(80)`) or chained directly; `&mut self` builders mutate in place and return `&mut Self`. Pick one style per builder and stay consistent.

## Your turn

This builder for a `ServerConfig` doesn't compile. One setter is missing something the rest of the chain depends on:

```rust,editable
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Default)]
struct ServerConfigBuilder {
    host: Option<String>,
    port: Option<u16>,
}

impl ServerConfigBuilder {
    fn host(mut self, host: &str) -> Self {
        self.host = Some(host.to_string());
        self
    }

    fn port(mut self, port: u16) {
        self.port = Some(port);
    }

    fn build(self) -> Result<ServerConfig, String> {
        Ok(ServerConfig {
            host: self.host.ok_or("host is required")?,
            port: self.port.ok_or("port is required")?,
        })
    }
}

fn main() {
    let config = ServerConfigBuilder::default()
        .host("localhost")
        .port(8080)
        .build();

    match config {
        Ok(c) => println!("host={} port={}", c.host, c.port),
        Err(e) => println!("error: {}", e),
    }
}
```

<details><summary>Show solution</summary>

`fn port(mut self, port: u16)` has no return type, so it implicitly returns `()`. The chain is `.host(...)` (returns `Self`, fine) `.port(8080)` (returns `()`) `.build()` (called on `()`, which has no `build` method) — the compiler reports the error at `.build()`, even though `port` is the actual culprit. Give `port` a `-> Self` and return `self`:

```rust,editable
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Default)]
struct ServerConfigBuilder {
    host: Option<String>,
    port: Option<u16>,
}

impl ServerConfigBuilder {
    fn host(mut self, host: &str) -> Self {
        self.host = Some(host.to_string());
        self
    }

    fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    fn build(self) -> Result<ServerConfig, String> {
        Ok(ServerConfig {
            host: self.host.ok_or("host is required")?,
            port: self.port.ok_or("port is required")?,
        })
    }
}

fn main() {
    let config = ServerConfigBuilder::default()
        .host("localhost")
        .port(8080)
        .build();

    match config {
        Ok(c) => println!("host={} port={}", c.host, c.port), // host=localhost port=8080
        Err(e) => println!("error: {}", e),
    }
}
```

Every setter in a chain must return `Self` — a single missing `-> Self` breaks every call that comes after it.

</details>

## Quick check

<div class="quiz" data-topic="builder-pattern"></div>

## Remember this

- Each setter takes `mut self` (or `&mut self`) and returns `Self`, so calls chain: `Builder::new().name("x").port(8080).build()`.
- `.build()` is where required-field validation happens, often returning a `Result`.
- Prefer `Default` + struct-update syntax (`..Default::default()`) for simpler cases before reaching for a full builder.
- A missing `-> Self` on one setter surfaces as a confusing error on the *next* method call, not on the setter itself.

## Go deeper

- [Rust API Guidelines - Builders](https://rust-lang.github.io/api-guidelines/type-safety.html#builders-enable-construction-of-complex-values-c-builder) — When and how to use a builder.

**Next:**

- [The newtype pattern](../abstractions/newtype-pattern.md)
- [Operator overloading](../abstractions/operator-overloading.md)

# Procedural macros (derive macros you use)

> **Advanced** · Runtime & ecosystem

## What & why

You will probably never write a procedural macro in your first year of Rust — but you'll use one in nearly every project you touch. `#[derive(Debug)]`, `#[derive(Serialize, Deserialize)]` from serde, `#[derive(Parser)]` from clap, `#[tokio::main]` — all procedural macros. Unlike `macro_rules!`, which pattern-matches tokens, a procedural macro ("proc macro") is an actual Rust program: it receives your code as a stream of tokens and runs arbitrary logic to decide what new code to generate. This lesson is about using them well — recognizing the three kinds, knowing why they live in their own crate, and knowing how to see what they actually generated.

## The idea, slowly

### The three kinds, and where you meet them

**Derive macros** attach with `#[derive(...)]` and add new code *alongside* your type, without touching the type itself:

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
}
```

`#[derive(Serialize)]` doesn't change the `User` struct one bit — it generates a *separate* `impl Serialize for User { ... }` block right next to it, one that knows how to walk `id` and `name` and turn them into JSON (or whatever format you're serializing to). `#[derive(Debug)]` works the same way: it generates an `impl Debug for User` that knows how to print your fields. You get the impl for free; your struct definition stays exactly as you wrote it.

**Attribute macros** attach above an item too, but — unlike derive — they can *rewrite the whole item*, not just add something beside it. The one you've almost certainly used is `#[tokio::main]`:

```rust
#[tokio::main]
async fn main() {
    println!("hello from an async main");
}
```

Rust's real `main` can never be `async fn` on its own — something has to create an async runtime and drive that future to completion. `#[tokio::main]` is what does it: it takes your `async fn main`, and generates roughly this in its place:

```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            println!("hello from an async main");
        })
}
```

Your `async fn main` never actually exists in the compiled program — the attribute macro replaced it with a plain `fn main` that spins up a runtime and runs your code inside it.

**Function-like macros** look exactly like a `macro_rules!` call at the call site — `name!(...)` — but are implemented as a proc macro, which means they can do things pattern-matching could never do. `sqlx::query!` is the classic example:

```rust
let row = sqlx::query!("SELECT id, name FROM users WHERE id = $1", user_id)
    .fetch_one(&pool)
    .await?;
```

At compile time, `sqlx::query!` actually connects to your database (or reads a cached schema file) and checks that this SQL is valid *and* that the columns you're selecting match the types you're binding into. Typo a column name and your program fails to *compile*, with an error pointing at the SQL string. A `macro_rules!` macro, which only ever sees tokens, could never do that — it has no way to know what's in your database.

### A proc macro has to live in its own crate

Proc macros run as part of the compiler's job while it's compiling *other* code — so the macro itself has to be built and ready to run before that other code is compiled. Rust enforces this with a crate-type: a crate that defines proc macros sets `proc-macro = true` under `[lib]` in its `Cargo.toml`:

```toml
[lib]
proc-macro = true

[dependencies]
syn = "2"
quote = "1"
proc-macro2 = "1"
```

Two consequences follow directly from this:

- **You can't define a proc macro and use it in the same crate.** The macro crate has to be compiled first, as a separate build artifact, then pulled in as a dependency by the crate that wants to call it. This is why every proc macro you've used — serde, clap, tokio — ships as its own published crate (`serde_derive`, `clap_derive`, and so on), even though you usually only ever type `serde::Serialize`.
- **A `proc-macro = true` crate can only export macros.** It can't also export a normal `pub fn` or `pub struct` for other crates to use directly.

Actually *writing* one means parsing the incoming tokens (typically with the `syn` crate) and generating new tokens back out (typically with `quote`) — a real jump in complexity that's worth its own dedicated study once you're comfortable using proc macros. This lesson deliberately stops at "how to use them correctly," not "how to build one."

### `cargo expand`: stop guessing, look at the real code

When a derive or attribute macro does something confusing — or when its generated code fails to compile and the error points at code you never wrote — the fastest way to understand what happened is to look at the *actual* generated Rust. That's what [`cargo expand`](https://github.com/dtolnay/cargo-expand) is for:

```bash
cargo install cargo-expand
cargo expand
```

It runs your crate through the same macro expansion the compiler performs, then pretty-prints the fully expanded source. For a small struct with `#[derive(Debug)]`:

```rust
struct Point {
    x: i32,
    y: i32,
}
```

`cargo expand` shows you (roughly) the impl block the derive generated on your behalf:

```rust
impl std::fmt::Debug for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Point")
            .field("x", &self.x)
            .field("y", &self.y)
            .finish()
    }
}
```

No more guessing what a derive "probably" does — you can read exactly what it wrote. This is the single most useful debugging habit for proc macros: when a derive-generated error looks alien, `cargo expand` turns it back into ordinary Rust you can reason about.

## Common mistakes

- **Defining and using a proc macro in the same crate.** The compiler rejects this — a `proc-macro = true` crate must be built separately and depended on from elsewhere, never used from within itself.
- **Forgetting the crate's derive feature flag.** `serde = "1"` alone does *not* give you `#[derive(Serialize)]` — you need `serde = { version = "1", features = ["derive"] }`. Without it, the derive macro simply doesn't exist yet, and you get a "cannot find derive macro" error even though `serde` is a dependency.
- **Confusing a function-like proc macro with a plain `macro_rules!` macro.** They look identical at the call site (`name!(...)`), but a proc macro like `sqlx::query!` can do real compile-time work — hitting a database, reading files — so its errors and behavior are far less predictable than pattern matching.
- **Missing the runtime feature flags an attribute macro needs.** `#[tokio::main]` needs `tokio = { version = "1", features = ["full"] }` (or at least `rt-multi-thread` and `macros`) — without the right features enabled, you get errors that look unrelated to the actual missing flag.
- **Staring at your own struct trying to debug a derive-generated error.** The error is almost always in the *generated* code, not your definition. Reach for `cargo expand` before you reach for guesswork.

## More examples

### A CLI's flags for free
`#[derive(Parser)]` from clap reads a struct's fields and doc comments and generates all the argument parsing, `--help` text, and validation — you never hand-write a single `match` over `std::env::args()`.

```rust
use clap::Parser;

#[derive(Parser)]
struct Args {
    /// Name to greet
    name: String,
    /// Number of times to greet
    #[arg(short, long, default_value_t = 1)]
    count: u8,
}

fn main() {
    let args = Args::parse();
    for _ in 0..args.count {
        println!("Hello, {}!", args.name);
    }
}
```

### Async methods on a trait, before Rust supported them natively
`#[async_trait]` is an attribute macro that rewrites a trait (and its impls) so its methods can be `async fn`, transforming them into boxed futures behind the scenes — exactly the "rewrite the whole item" behavior `#[tokio::main]` does for `main`.

```rust
use async_trait::async_trait;

#[async_trait]
trait Notifier {
    async fn send(&self, message: &str);
}

struct EmailNotifier;

#[async_trait]
impl Notifier for EmailNotifier {
    async fn send(&self, message: &str) {
        println!("emailing: {message}");
    }
}

#[tokio::main]
async fn main() {
    let notifier = EmailNotifier;
    notifier.send("your order shipped").await;
}
```

### Compile-time-checked HTML templates
`maud`'s `html!` is a function-like macro that parses actual HTML syntax at compile time — a mismatched tag is a compile error, not a runtime bug discovered in a browser.

```rust
use maud::html;

fn main() {
    let name = "Ada";
    let markup = html! {
        h1 { "Welcome, " (name) "!" }
    };
    println!("{}", markup.into_string());
}
```

### Generating a builder for a config struct
`#[derive(Builder)]` from `derive_builder` writes the whole builder pattern — the setter methods, the `build()` that checks required fields — from a plain struct definition, so you don't hand-write it yourself.

```rust
use derive_builder::Builder;

#[derive(Builder, Debug)]
struct ServerConfig {
    host: String,
    #[builder(default = "8080")]
    port: u16,
}

fn main() {
    let config = ServerConfigBuilder::default()
        .host("localhost".to_string())
        .build()
        .unwrap();

    println!("{config:?}");
}
```

## Your turn

This code imports `Serialize` and tries to turn a `User` into JSON, but it doesn't compile. Something is missing that would make `User` an actual `Serialize` type, not just code that mentions the trait.

```rust
// Cargo.toml: serde = { version = "1", features = ["derive"] }, serde_json = "1"
use serde::Serialize;

struct User {
    id: u64,
    name: String,
}

fn main() {
    let user = User { id: 1, name: "Ada".to_string() };
    let json = serde_json::to_string(&user).unwrap();
    println!("{}", json);
}
```

<details><summary>Show solution</summary>

`use serde::Serialize;` only brings the *trait* into scope — it doesn't make `User` implement it. `serde_json::to_string` requires `T: Serialize`, so the compiler rejects this with something like `the trait bound 'User: Serialize' is not satisfied`. What actually implements the trait for you is the derive macro, and it's missing:

```rust
use serde::Serialize;

#[derive(Serialize)]
struct User {
    id: u64,
    name: String,
}

fn main() {
    let user = User { id: 1, name: "Ada".to_string() };
    let json = serde_json::to_string(&user).unwrap();
    println!("{}", json); // {"id":1,"name":"Ada"}
}
```

Adding `#[derive(Serialize)]` is what generates the `impl Serialize for User` block — the struct definition itself never changes. Importing the trait just lets you *refer* to it; deriving it is what actually implements it.

</details>

## Quick check

<div class="quiz" data-topic="procedural-macros-overview"></div>

## Remember this

- Three kinds: **derive** macros (`#[derive(X)]`) add code alongside your type; **attribute** macros (`#[tokio::main]`) can rewrite the whole item; **function-like** macros (`sqlx::query!(...)`) look like `macro_rules!` calls but run arbitrary compile-time logic.
- A derive macro never modifies your struct/enum definition — it generates a separate `impl` block next to it.
- A proc macro must live in its own crate with `proc-macro = true` in `Cargo.toml` — you can't define and use one in the same crate.
- `cargo expand` prints the real generated code — the fastest way to understand, or debug, what a derive or attribute macro actually did.
- The two most common daily errors are a missing derive feature flag (e.g. serde's `features = ["derive"]`) and a missing `#[derive(...)]` itself — both surface as "trait bound not satisfied" or "cannot find macro" errors.

## Go deeper

- [Rust Reference - Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html) — How proc macros work under the hood.
- [cargo-expand](https://github.com/dtolnay/cargo-expand) — install it once, reach for it constantly.
- [Serde: Using derive](https://serde.rs/derive.html) — the derive macro you'll meet first in real projects.

**Next:**

- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

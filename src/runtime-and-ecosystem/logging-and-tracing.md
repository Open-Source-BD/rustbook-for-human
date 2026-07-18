# Logging and tracing

> **Intermediate** · Runtime & ecosystem

## What & why

Logging is how your program tells you what it's doing while it runs — so that when something breaks
at 2am in production, you have a trail to follow instead of a shrug. Tracing is logging's grown-up
sibling: it adds *structure* (named fields) and *spans* (the story of one request from start to
finish). This lesson shows why `println!` isn't enough and how the `tracing` crate fixes it.

## The idea, slowly

### Why not just use `println!`?

When you're learning, `println!("here")` is a fine way to peek at what's happening. But in a real
program it falls apart:

- You can't turn it off without deleting lines. In production you want *less* noise; while
  debugging you want *more*. `println!` is all-or-nothing.
- There are no **levels** — no way to say "this is just info" versus "this is a real error."
- It goes to stdout, mixing debug spew into your program's real output.
- There's no timestamp, no context, no way to filter.

Logging libraries fix all of that. You write a log line *once*, tag it with a level, and later
decide — without touching the code — how much of it you actually want to see.

### The five levels

Every logging system has severity **levels**, from noisiest to most serious:

- **trace** — extremely fine-grained "I am here" detail.
- **debug** — information useful while developing.
- **info** — normal, noteworthy events ("server started", "user logged in").
- **warn** — something looks off but the program continues.
- **error** — something actually failed.

You set a threshold (say, `info`) and everything below it is silently dropped. In development you
lower the threshold to `debug` to see more; in production you raise it to keep logs quiet and cheap.

### The `tracing` crate: macros per level

The modern Rust standard is the `tracing` crate. You emit a log with a macro named after the level.
The key upgrade over `println!` is **structured fields** — named key/value pairs, not just a
sentence:

```rust
use tracing::{info, warn, error};

fn main() {
    // You MUST install a subscriber first, or nothing prints (see below).
    tracing_subscriber::fmt::init();

    let user_id = 7;

    info!("server started");
    // The `user_id` before the message becomes a structured field, not just text:
    info!(user_id, "user logged in");
    warn!(retries = 3, "slow database response");
    error!("failed to connect to database");
}
```

This uses external crates, so it won't run on the Playground. In a real project:

```bash
cargo add tracing
cargo add tracing-subscriber
cargo run
```

Notice `info!(user_id, "user logged in")`. The `user_id` isn't glued into the sentence — it's
attached as a labeled field. Later a log tool can search "show me every event where `user_id = 7`,"
which is impossible when the value is buried inside a string.

### The subscriber: someone has to be listening

Here's the part that trips everyone up. In `tracing`, the macros (`info!`, `error!`) only *emit*
events. They don't decide where the events go — that's a separate piece called a **subscriber**. If
you never install one, your log calls do *nothing*. It's like a radio station broadcasting with no
receiver switched on.

The simplest receiver is `tracing_subscriber::fmt::init()`, which prints formatted logs to the
terminal. You call it **once**, at the very start of `main`, before any logging happens. In your
real Axum backend, this is exactly what the `init_logger()` function does — it sets up a subscriber
with an `EnvFilter` so the log level can be controlled from an environment variable:

```rust
use tracing_subscriber::{fmt, EnvFilter};

fn init_logger() {
    // Read the level from the RUST_LOG env var, defaulting to "info".
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));
    fmt().with_env_filter(filter).init();
}
```

Now `RUST_LOG=debug cargo run` shows debug logs; plain `cargo run` shows only info and above — no
code change needed.

### Spans: the story of one request

`info!` gives you single events, like snapshots. A **span** gives you a *duration* — it wraps a
chunk of work so every log inside it is automatically tagged with that context. In a web server,
you open a span per request; then every log line during that request carries the request's id, so
you can follow one user's journey even when a thousand requests are interleaved:

```rust
use tracing::info_span;

fn handle_request(id: u64) {
    // Everything logged while this span is entered is tagged with request_id.
    let span = info_span!("request", request_id = id);
    let _guard = span.enter();

    tracing::info!("handling");   // automatically carries request_id = id
}
```

That's the real difference between "logging" and "tracing": events are dots, spans connect the dots
into a line.

## Common mistakes

- **Forgetting to install a subscriber.** Your `info!`/`error!` calls compile and run but print
  *nothing*, because no receiver is listening. Call `tracing_subscriber::fmt::init()` (or your
  `init_logger`) once at startup.
- **Logging secrets.** Passwords, tokens, API keys, full credit-card numbers — logs are often
  stored and shared widely, so anything sensitive in them is a leak. Redact before logging.
- **Using the wrong level.** Logging routine events at `error` cries wolf; logging real failures at
  `debug` hides them. The level *is* the signal — pick it deliberately.
- **Gluing values into the message instead of using fields.** `info!("user {id}")` makes the id
  unsearchable text; `info!(user_id = id, "user")` makes it a queryable field. Prefer fields.
- **Mixing logs into stdout output.** For a CLI, send logs to stderr so they don't corrupt the
  program's real stdout result (see the CLI lesson).

## Your turn

This is a **spot-the-bug**, since `tracing` can't run on the Playground. A beginner runs this and
complains "my logs never appear!" What did they forget, and why does that cause total silence?

```rust
use tracing::info;

fn main() {
    // ... no setup here ...
    info!("app started");
    info!(items = 3, "loaded items");
}
```

<details><summary>Show solution</summary>

They never installed a **subscriber**, so nobody is listening to the events. The macros run but
have nowhere to send their output.

```rust
use tracing::info;

fn main() {
    tracing_subscriber::fmt::init();   // <-- the missing receiver

    info!("app started");
    info!(items = 3, "loaded items");
}
```

In `tracing`, the `info!`/`warn!`/`error!` macros only *emit* events. A separate **subscriber**
decides where they go and whether to print them. With no subscriber installed, every log call
silently does nothing. Installing `tracing_subscriber::fmt::init()` once at the top of `main` gives
the events a home — the terminal.

</details>

## Quick check

<div class="quiz" data-topic="logging-and-tracing"></div>

## Remember this

- `println!` doesn't scale for real programs — no levels, no filtering, no structure.
- Levels from noisiest to most serious: **trace, debug, info, warn, error**; set a threshold and everything below is dropped.
- The `tracing` macros only *emit* events — you must install a **subscriber** (e.g. `tracing_subscriber::fmt::init()`) or nothing prints.
- Prefer **structured fields** (`info!(user_id, "...")`) over stuffing values into the message string — fields are searchable.
- **Spans** tag every log inside them with shared context, so you can follow one request end to end.
- Never log secrets, and pick the level that matches the real severity.

## Go deeper

- [tracing crate docs](https://docs.rs/tracing/) — Common Rust tracing ecosystem.

**Next:**

- [Web services](../runtime-and-ecosystem/web-services.md)
- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)

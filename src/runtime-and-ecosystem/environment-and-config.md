# Environment variables and config

> **Beginner** · Runtime & ecosystem

## What & why

Almost every real program needs settings that live *outside* the binary — a port number, an API key, a database URL, a "dev vs. production" switch. You don't want to recompile your app just to change a port. Rust gives you three layers for this, from simplest to richest: read a single environment variable directly, load a whole `.env` file for local development, or deserialize a structured TOML/JSON config file into a real Rust struct. All three treat "the setting is missing" as something you must handle, not something that silently becomes an empty string.

## The idea, slowly

### `std::env::var` returns a `Result`, not a `String`

`std::env::var("KEY")` looks up an environment variable and hands back `Result<String, VarError>` — `Ok(value)` if it's set, `Err(VarError::NotPresent)` if it isn't. This is a deliberate design choice: in many languages, reading a missing environment variable silently gives you `""` or `undefined`, and your program limps along with a blank setting instead of crashing where the mistake actually happened. Rust refuses to let "missing" and "set to empty string" look the same.

```rust,editable
use std::env;

fn main() {
    // This var is almost certainly not set inside the Playground's sandbox —
    // so you'll see the Err branch run.
    match env::var("PORT") {
        Ok(val) => println!("PORT = {val}"),
        Err(e) => println!("PORT not set: {e}"),
    }

    // A very common real pattern: fall back to a sane default instead of
    // crashing when a var is optional.
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .expect("PORT must be a number");
    println!("listening on {port}");
}
```

Run it. The first `match` prints the `Err` branch, and `e` prints as `environment variable not found` — that's `VarError`'s own `Display` message. The compiler is thinking: *"Reading the outside world can fail. I'm not going to let you treat the result as a guaranteed `String` — you get a `Result`, and you decide what 'missing' means for this variable."* Some vars are truly required (crash with a clear message if absent, via `.expect("EXPLAIN_WHAT")`); others are optional (fall back to a default, like `PORT` above).

### Loading a `.env` file for local development

In production, real environment variables are set by your platform (Docker, systemd, your cloud host's dashboard). But typing `export API_KEY=abc123` in every new terminal during local development gets old fast. The `dotenvy` crate reads a `.env` file from your project root and copies its key-value pairs into the process's environment — so `std::env::var` finds them exactly as if you'd exported them yourself.

```bash
cargo add dotenvy
```

```text
# .env (project root)
API_KEY=dev-only-fake-key
DATABASE_URL=postgres://localhost/myapp_dev
```

```rust
// dotenvy is an external crate — add it first (above), then run in a real project.
use std::env;

fn main() {
    dotenvy::dotenv().ok(); // loads .env into the process environment; ignores it if missing
    let api_key = env::var("API_KEY").expect("API_KEY must be set — check your .env file");
    println!("using key starting with {}", &api_key[..4.min(api_key.len())]);
}
```

Call `dotenvy::dotenv()` once, right at the top of `main`, *before* you read anything with `env::var`. The `.ok()` throws away the `Result` on purpose — if there's no `.env` file (common in production, where real env vars are already set another way), that's not an error, it's expected.

**Why real secrets don't belong in a committed `.env` file:** a `.env` file sitting in your repo gets committed to git the first time someone forgets to add it to `.gitignore` — and once a secret is in git history, rotating it is the only real fix, because it's in every clone and every fork forever. Treat `.env` as a *local development convenience* for fake or low-stakes values, add it to `.gitignore`, and commit a `.env.example` with the key names but no real values. Production secrets belong in your platform's actual secret manager (environment variables set in your host's dashboard, a secrets vault, CI secret storage) — never in a file that `git add .` can pick up.

### Structured config: deserialize a file into a struct

A handful of env vars is fine. A dozen related settings — server port, log level, feature flags, timeouts — turns into a wall of `env::var(...)` calls that's easy to get wrong. The idiomatic fix is to describe your config as a Rust struct and let `serde` deserialize a TOML (or JSON) file straight into it.

```bash
cargo add serde --features derive
cargo add toml
```

```toml
# config.toml
port = 8080
debug = false
app_name = "orbit"
```

```rust
// serde + toml are external crates — add them first (above), then run in a real project.
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct Config {
    port: u16,
    debug: bool,
    app_name: String,
}

fn main() {
    let text = std::fs::read_to_string("config.toml").expect("could not read config.toml");
    let config: Config = toml::from_str(&text).expect("config.toml is not valid");
    println!("{config:?}");
}
```

Notice the shape: `#[derive(Deserialize)]` teaches `toml::from_str` how to turn text into a `Config` — field names in the file line up with field names on the struct, and each field's *type* (`u16`, `bool`, `String`) is checked for you. Get the TOML wrong (wrong type, missing required field) and you get one clear `Err` at startup instead of a `None`-shaped bug three functions later. The exact same struct works with `serde_json::from_str` if you'd rather ship JSON — the struct doesn't know or care which text format fed it.

## Common mistakes

- **Assuming a missing env var reads as `""`.** It doesn't — `env::var` returns `Err`. Code that does `env::var("KEY").unwrap_or_default()` silently treats "forgot to set this" the same as "set to empty on purpose," which hides real misconfiguration.
- **Committing a `.env` file with real secrets.** Once it's in git history, the secret is compromised — rotate it, don't just delete the file. Keep `.env` in `.gitignore`; commit a `.env.example` instead.
- **Calling `dotenvy::dotenv()` after you've already read the vars you need.** It has to run *before* the `env::var` calls that depend on it, right at the top of `main`.
- **Using bare `.unwrap()` on a required env var.** It crashes with `called \`Result::unwrap()\` on an \`Err\` value: NotPresent` — technically correct but useless at 2am. `.expect("DATABASE_URL must be set")` tells you exactly what to fix.
- **Reaching for a dozen loose `env::var` calls instead of one config struct.** Once you have more than two or three related settings, a `#[derive(Deserialize)]` struct is easier to validate, document, and pass around than scattered string lookups.

## More examples

### Switching log verbosity between dev and prod
A CLI tool that behaves the same everywhere is annoying to debug locally and noisy in production — reading one `APP_ENV` variable lets the same binary do both.

```rust,editable
fn main() {
    let mode = std::env::var("APP_ENV").unwrap_or_else(|_| "development".into());

    match mode.as_str() {
        "production" => println!("[prod] starting with minimal logging"),
        "staging" => println!("[staging] starting with verbose logging"),
        _ => println!("[dev] starting with debug logging enabled"),
    }
}
```

### Enabling a hidden debug overlay in a game
Some flags don't need a value at all — checking `.is_ok()` instead of reading the value turns "does this variable exist" into a simple on/off switch for a debug overlay.

```rust,editable
fn main() {
    let hitboxes_on = std::env::var("DEBUG_HITBOXES").is_ok();

    if hitboxes_on {
        println!("rendering hitbox outlines for every sprite");
    } else {
        println!("normal rendering — no debug overlay");
    }
}
```

### Loading SMTP credentials for an email worker
A background worker that sends mail needs real credentials in production but fake ones on your laptop — `dotenvy` fills in the fake ones from `.env` without touching how the worker reads them.

```rust
// dotenvy is an external crate — cargo add dotenvy, then run in a real project.
use std::env;

fn main() {
    dotenvy::dotenv().ok();

    let host = env::var("SMTP_HOST").expect("SMTP_HOST must be set — check your .env file");
    let user = env::var("SMTP_USER").expect("SMTP_USER must be set — check your .env file");

    println!("connecting to {host} as {user}");
}
```

### Configuring a game server from a TOML file
A multiplayer server has too many related settings for loose env vars — deserializing a `server.toml` straight into a struct catches a bad `tick_rate` at startup instead of mid-match.

```rust
// serde + toml are external crates — cargo add serde --features derive, cargo add toml.
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct ServerConfig {
    max_players: u32,
    tick_rate: f32,
    region: String,
}

fn main() {
    let text = std::fs::read_to_string("server.toml").expect("could not read server.toml");
    let config: ServerConfig = toml::from_str(&text).expect("server.toml is not valid");
    println!("{config:?}");
}
```

## Your turn

This function is supposed to read `PORT` from the environment, falling back to `8080` if it's missing — but it doesn't compile. Find the bug before checking the solution.

```rust,editable
use std::env;

fn main() {
    let port: u16 = env::var("PORT").parse().expect("PORT must be a number");
    println!("listening on {port}");
}
```

<details><summary>Show solution</summary>

`env::var("PORT")` returns `Result<String, VarError>` — not a `String`. `.parse()` is a method on `str`/`String`, not on `Result`, so the compiler rejects this with something like `no method named \`parse\` found for enum \`Result<String, VarError>\` in the current scope`. The `Result` has to be dealt with *before* you can parse the string inside it.

```rust,editable
use std::env;

fn main() {
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".into()) // unwrap the Result into a String first
        .parse()                           // now .parse() has a &str to work with
        .expect("PORT must be a number");
    println!("listening on {port}");
}
```

`.unwrap_or_else(|_| "8080".into())` turns the `Result<String, VarError>` into a plain `String` — either the real value or the fallback — and *then* `.parse()` has something it actually knows how to work with.

</details>

## Quick check

<div class="quiz" data-topic="environment-and-config"></div>

## Remember this

- `std::env::var("KEY")` returns `Result<String, VarError>` — a missing variable is an `Err`, never a silent empty string.
- `dotenvy::dotenv().ok()` at the top of `main` loads a `.env` file into the process environment for local dev convenience — call it before any `env::var` reads that depend on it.
- Never commit real secrets in `.env` — keep it in `.gitignore`, commit a `.env.example` instead, and put production secrets in your platform's real secret manager.
- For more than a couple of related settings, deserialize a TOML/JSON file into a `#[derive(Deserialize)]` struct instead of many loose `env::var` calls.
- Prefer `.expect("clear message")` over bare `.unwrap()` on required config — future-you (or 2am on-call you) will thank you.

## Go deeper

- [std::env docs](https://doc.rust-lang.org/std/env/index.html) — Environment and process introspection.
- [dotenvy docs](https://docs.rs/dotenvy/) — .env file loading.

**Next:**

- [Args, exit codes, and subprocesses](../runtime-and-ecosystem/process-and-command.md)
- [cfg and Cargo feature flags](../runtime-and-ecosystem/cfg-and-feature-flags.md)

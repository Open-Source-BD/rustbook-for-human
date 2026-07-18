# Serde and JSON

> **Intermediate** · Runtime & ecosystem

## What & why

Serde is the crate the whole Rust world uses to turn structs into JSON (and back). Anytime your
program talks to the outside — a web API, a config file, a saved game — it needs to convert between
"data as text" and "data as Rust types." Serde does that conversion for you, safely, from a struct
you already wrote.

## The idea, slowly

### Two words: serialize and deserialize

The name **Serde** is just "**Ser**ialize + **De**serialize" smashed together.

- **Serialize** = take a Rust value and write it out as text (or bytes). Struct → JSON string.
- **Deserialize** = read text back into a Rust value. JSON string → struct.

Think of a struct as a piece of furniture and JSON as the flat-pack box. *Serializing* is packing
the furniture into the box to ship it. *Deserializing* is opening the box and assembling it again.
Serde reads the "shape" of your struct and figures out the packing instructions automatically.

### The magic line: `#[derive(Serialize, Deserialize)]`

You don't write the packing code by hand. You put one attribute above your struct and Serde
generates all of it at compile time:

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
}

fn main() {
    let user = User { id: 7, name: String::from("Shamirul") };

    // Rust struct -> JSON text
    let json = serde_json::to_string(&user).unwrap();
    println!("{json}");            // {"id":7,"name":"Shamirul"}

    // JSON text -> Rust struct
    let back: User = serde_json::from_str(&json).unwrap();
    println!("{back:?}");          // User { id: 7, name: "Shamirul" }
}
```

This needs two external crates, so the Playground's Run button won't help here. In a real project,
add them to `Cargo.toml` and run `cargo run`:

```bash
cargo add serde --features derive
cargo add serde_json
```

Read the flow slowly: `to_string` takes a **reference** (`&user`) and gives back a `String` of
JSON. `from_str` takes JSON text and — because we annotated the variable as `: User` — knows what
type to build. Both return a `Result`, because the outside world can always hand you broken data;
we'll `.unwrap()` here for learning, but real code handles the error.

### Why a `Result`? Because deserializing can fail

Serializing your own struct basically never fails — you control the data. But *deserializing*
reads text from somewhere you don't trust. If the JSON is missing a field, has the wrong type, or
is malformed, `from_str` returns an `Err` instead of crashing. That's Serde protecting you: bad
input becomes a value you can handle, not a panic.

### Renaming fields to match the outside world

Rust likes `snake_case`; lots of JSON APIs use `camelCase`. You bridge the gap with attributes so
your Rust stays idiomatic while the wire format stays whatever the API demands:

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Product {
    id: u64,
    #[serde(rename = "displayName")]     // JSON says displayName...
    display_name: String,                // ...Rust keeps snake_case
}
```

You can even rename the whole struct's fields at once with
`#[serde(rename_all = "camelCase")]`. In a real backend like yours (Axum + SeaORM), the entity
structs derive `Serialize`/`Deserialize` exactly like this so that database rows become API JSON
with no hand-written conversion.

### Optional and missing fields

The outside world is messy: sometimes a field is there, sometimes it isn't. Model that with
`Option<T>`. If the JSON has the field, you get `Some(value)`; if it's absent, you get `None`
instead of an error:

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct Settings {
    theme: String,
    nickname: Option<String>,   // may or may not be present
}
```

This is how you plan for "extra or missing fields" without your program falling over.

## Common mistakes

- **Forgetting the `derive` feature on `serde`.** `#[derive(Serialize)]` only exists if you add
  serde with `features = ["derive"]`. Without it you get a confusing "cannot find derive macro"
  error even though serde is installed.
- **Field names not matching the JSON.** Serde matches by field name. If the API sends
  `displayName` and your field is `display_name`, deserializing fails until you add
  `#[serde(rename = ...)]`. It bites because the error appears at runtime, not compile time.
- **Making a field required when the source omits it.** A plain `String` field must be present in
  the JSON. If the source sometimes drops it, use `Option<String>` — otherwise every request with
  that field missing errors out.
- **Calling `.unwrap()` on `from_str` in real code.** Deserialization handles untrusted input;
  unwrapping turns a recoverable "bad JSON" into a crash. Handle the `Result` instead.
- **Forgetting `&` when serializing.** `serde_json::to_string(&value)` takes a reference; passing
  the value by move works too but often you still need it afterward, so borrow it.

## Your turn

This is a **fill-in-the-blank**, since serde can't run on the Playground. This struct should
accept JSON where the key is `"user_name"` and the `bio` field may be missing entirely. Fix the two
blanks.

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct Account {
    // JSON sends "user_name", but we want Rust-style naming here:
    name: String,         // <-- needs an attribute
    bio: String,          // <-- bio is sometimes absent
}
```

<details><summary>Show solution</summary>

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct Account {
    #[serde(rename = "user_name")]   // map JSON "user_name" <-> Rust `name`
    name: String,
    bio: Option<String>,             // absent -> None instead of an error
}
```

Why:

- **`#[serde(rename = "user_name")]`** tells Serde the field is called `user_name` in the JSON, so
  it stops looking for a key named `name` and stops failing.
- **`Option<String>`** makes `bio` optional: present JSON gives `Some("...")`, missing JSON gives
  `None`. Without `Option`, any JSON lacking `bio` would fail to deserialize.

</details>

## Quick check

<div class="quiz" data-topic="serde-and-json"></div>

## Remember this

- Serde = **Ser**ialize (Rust → text) + **De**serialize (text → Rust).
- `#[derive(Serialize, Deserialize)]` generates all the conversion code for you at compile time.
- Add serde with the `derive` feature, plus `serde_json` for JSON: `cargo add serde --features derive`.
- `serde_json::to_string(&value)` and `serde_json::from_str(text)` both return `Result` — deserializing untrusted input can fail.
- Use `#[serde(rename = ...)]` / `rename_all` to match outside naming, and `Option<T>` for fields that may be missing.

## Go deeper

- [Serde docs](https://docs.rs/serde/) — Canonical ecosystem docs.
- [serde_json docs](https://docs.rs/serde_json/) — JSON support on docs.rs.

**Next:**

- [CLI apps](../runtime-and-ecosystem/cli-apps.md)
- [Web services](../runtime-and-ecosystem/web-services.md)

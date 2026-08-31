# Docs and rustfmt

> **Beginner** · Runtime & ecosystem

## What & why

Rust ships with two tools that make your code pleasant to read and share: `rustfmt` formats your
code to one standard style so you never argue about spacing again, and `cargo doc` turns special
comments into a browsable website of documentation. Both are one command, both come free with
Rust, and both make your future self (and teammates) much happier.

## The idea, slowly

### rustfmt: stop formatting by hand

Every programmer has spent time nudging spaces and line breaks to make code "look right." `rustfmt`
ends that entirely. It reads your file and rewrites it in the official Rust style — consistent
indentation, spacing, and line wrapping — automatically. You run one command:

```bash
cargo fmt
```

That's it. Your whole project is reformatted in place. The huge win isn't just tidiness; it's that
**everyone's code looks identical**, so diffs in version control show real changes, not someone's
personal spacing preferences. You stop debating style because a tool already decided.

Take this messy but valid code:

```rust
fn add(a:i32,b:i32)->i32{a+b}
```

After `cargo fmt` it becomes:

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

Same program, standard shape. You didn't touch a single space by hand.

### Doc comments: `///` is special

Rust has two kinds of comments:

- `//` — a normal comment. Notes to yourself. Tooling ignores it.
- `///` — a **doc comment** (three slashes). This one is documentation *for the thing right below
  it*, and `cargo doc` collects them into a real webpage.

```rust,editable
/// Adds two numbers together and returns the result.
///
/// Use this when you need a sum.
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("{}", add(2, 3));
}
```

This runs fine on the Playground (doc comments are just comments to the compiler). The magic
happens when you later run `cargo doc` — the `///` text above `add` becomes its official
description in the generated docs. Write `///` the moment you write a public function, and your
documentation is done before you forget how the function works.

### Markdown inside doc comments

Doc comments understand **Markdown**, so you can add headings, lists, and code examples. A common
convention is an `# Examples` section showing how to call the function:

```rust
/// Multiplies two numbers.
///
/// # Examples
///
/// ```
/// let result = multiply(2, 3);
/// assert_eq!(result, 6);
/// ```
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

There's a bonus here that feels like magic: those code blocks inside doc comments are **doctests**.
When you run `cargo test`, Rust actually *runs the example* and checks the `assert_eq!`. So your
documentation can never silently go out of date — if the example stops working, your tests fail.

### `//!` documents the file itself

One more slash-based sibling: `//!` (slash-slash-bang) documents the *module or file it's inside*,
rather than the item below it. You put it at the very top of a file to describe the whole module.
In real generated code — like the SeaORM entity files in an Axum project — you'll see lines like
`//! SeaORM Entity` at the top: that's the file describing itself.

### Generating and viewing the docs

One command builds an HTML site for your whole project and opens it in your browser:

```bash
cargo doc --open
```

It documents your crate *and* your dependencies, all cross-linked, styled exactly like the official
`docs.rs` pages you've been reading. Your `///` comments become the descriptions.

## Common mistakes

- **Using `//` when you meant `///`.** A two-slash comment is invisible to `cargo doc`, so your
  carefully written explanation never shows up in the generated docs. Three slashes for
  documentation.
- **Fighting the formatter by hand.** Manually aligning code that `cargo fmt` will just rewrite
  wastes time and creates noisy diffs. Let the tool own formatting; run it before committing.
- **Doc examples that don't compile.** Because doctests actually run under `cargo test`, a broken
  example fails your test suite. That's a feature — fix the example — but it surprises people who
  thought docs were "just comments."
- **Writing docs for yourself, not the reader.** "Calls internal_helper then returns" tells a user
  nothing. Describe *what it does and when to use it*, from the caller's point of view.
- **Documenting the obvious and skipping the tricky.** A doc comment that restates the function
  name adds no value; spend the words on the surprising behavior and the edge cases.

## More examples

### A doc comment that doubles as a test

Real crates lean on `# Examples` constantly, because the example *is* the test — if you ever change
the function and break the promise in the docs, `cargo test` tells you immediately.

```rust,editable
/// Converts a temperature from Celsius to Fahrenheit.
///
/// # Examples
///
/// ```
/// let f = celsius_to_fahrenheit(0.0);
/// assert_eq!(f, 32.0);
/// ```
fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

fn main() {
    println!("{}", celsius_to_fahrenheit(100.0));
}
```

### Hiding setup lines in a doctest

Sometimes an example needs a few lines of scaffolding that would be noise for a reader. Prefix a
line with `# ` inside the code block and `cargo doc` hides it from the rendered page — but `cargo
test` still compiles and runs it:

```rust
/// A shopping cart total, in cents.
///
/// # Examples
///
/// ```
/// # struct Cart { cents: u32 }
/// # impl Cart { fn total(&self) -> u32 { self.cents } }
/// let cart = Cart { cents: 1999 };
/// assert_eq!(cart.total(), 1999);
/// ```
struct Cart {
    cents: u32,
}
```

The reader sees a clean two-line example; the doctest quietly checks the whole thing still works.

### Customizing rustfmt's line width

`rustfmt` follows sensible defaults out of the box, but a team can tune them project-wide by
dropping a `rustfmt.toml` next to `Cargo.toml`. Every `cargo fmt` run in that project then follows
these settings instead of the defaults:

```toml
# rustfmt.toml
max_width = 100
tab_spaces = 4
use_small_heuristics = "Max"
```

No flags to remember, no per-developer settings — everyone who runs `cargo fmt` in this project
gets the same 100-column style automatically.

### Browsing your own crate's docs like a visitor

Once you've written a few `///` comments, generate the site and actually read it the way a user of
your crate would:

```bash
cargo doc --open
```

This builds the HTML docs for your crate *and* every dependency, then opens your default browser
straight to your crate's page. It's the fastest way to catch a confusing doc comment — read it as a
stranger would, not as the person who just wrote the code.

### A module-level doc comment for context

`//!` at the top of a file introduces the *whole module* before a reader sees any individual item —
handy for explaining scope, like "this file only validates data, it never touches the database":

```rust,editable
//! Small helpers for validating usernames before they hit the database.
//!
//! Keep this module free of database or network code — just plain checks.

/// Returns `true` if a username is between 3 and 20 characters and has no spaces.
fn is_valid_username(name: &str) -> bool {
    let len = name.chars().count();
    (3..=20).contains(&len) && !name.contains(' ')
}

fn main() {
    println!("{}", is_valid_username("shamirul"));
    println!("{}", is_valid_username("a b"));
}
```

## Your turn

This function is documented with the wrong comment style, so `cargo doc` will ignore the
explanation entirely. Fix it so the description becomes real documentation. (The program still runs
either way — press Run to confirm — but only one version documents `greet`.)

```rust,editable
// Returns a friendly greeting for the given name.
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

fn main() {
    println!("{}", greet("Shamirul"));
}
```

<details><summary>Show solution</summary>

Change the two-slash comment into a three-slash **doc comment**:

```rust,editable
/// Returns a friendly greeting for the given name.
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

fn main() {
    println!("{}", greet("Shamirul"));
}
```

`//` is a normal comment the documentation tool skips. `///` is a doc comment attached to the item
directly below it, so `cargo doc` picks it up and shows it as `greet`'s description. The program
runs the same either way — the difference only appears when you generate the docs.

</details>

## Quick check

<div class="quiz" data-topic="docs-and-rustfmt"></div>

## Remember this

- `cargo fmt` reformats your whole project to the standard style — never format by hand.
- `//` is a normal comment; `///` is a **doc comment** that `cargo doc` turns into documentation.
- `//!` documents the enclosing file/module (put it at the top of a file).
- Code examples inside doc comments are **doctests** — `cargo test` runs them, so docs stay correct.
- `cargo doc --open` builds and opens a browsable HTML site for your crate and its dependencies.
- Write docs for the *caller*: what it does and when to use it, not how it works internally.

## Go deeper

- [rustfmt book](https://rust-lang.github.io/rustfmt/) — Formatting rules and configuration.
- [cargo doc](https://doc.rust-lang.org/cargo/commands/cargo-doc.html) — Generate browsable API docs.

**Next:**

- [Workspaces and crates](../runtime-and-ecosystem/workspaces-and-crates.md)
- [Clippy and formatting](../runtime-and-ecosystem/clippy-and-formatting.md)

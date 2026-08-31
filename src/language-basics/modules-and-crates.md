# Modules and crates

> **Beginner** · Language basics

## What & why

As your program grows past one file, you need a way to organize it into sensible groups and decide what's shared and what's private. Rust does this with **modules** (folders of code inside a project) and **crates** (whole projects that get compiled). Getting the vocabulary straight now means the "where does this code go?" question stops being scary later.

## The idea, slowly

### Crate: the whole package

A **crate** is the unit Rust compiles at once — roughly, "one project." There are two kinds:

- A **binary crate** is a program you can run. It has a `main` function. Your `hello world` was a binary crate.
- A **library crate** is code meant to be *used by* other crates. It has no `main`; instead it offers functions and types for others to call. When you add a dependency from the internet, you're pulling in a library crate.

You mostly don't think about crates directly — Cargo (Rust's build tool) handles them. Just hold the mental model: *a crate is a compiled package, either a runnable program or a reusable library.*

### Module: a labeled drawer inside a crate

A **module** is a way to group related code and give it a name. Think of a crate as a filing cabinet and modules as the labeled drawers inside. You declare one with `mod`:

```rust,editable
mod parser {
    pub fn parse(input: &str) -> usize {
        input.len()
    }
}

fn main() {
    // reach into the module with :: (two colons)
    let n = parser::parse("hello");
    println!("parsed length is {n}"); // 5
}
```

Read `mod parser { ... }` as "here's a drawer named `parser`, and here's what's inside it." To use something from the drawer, you write the module's name, then `::`, then the item's name: `parser::parse`. The `::` is Rust's "reach inside" operator — a path separator, like a slash in a folder path.

### Privacy: `pub` opens the drawer

Here's the rule that trips people up: **everything in a module is private by default.** Private means "only code inside this same module (or its children) can see it." From outside, it's invisible.

Look again at the example. The function is written `pub fn parse`. That `pub` (public) is what lets `main` — which is *outside* the module — call it. Remove the `pub` and watch it break:

```rust,editable
mod parser {
    fn parse(input: &str) -> usize {  // no pub → private
        input.len()
    }
}

fn main() {
    let n = parser::parse("hello");   // ERROR: function `parse` is private
    println!("{n}");
}
```

Press Run: *"function `parse` is private."* The compiler is protecting the module's insides. This is a feature: a module can have lots of helper functions it uses internally, and only mark the few it wants the outside world to touch with `pub`. That handful of `pub` items is the module's **public interface** — its promise to everyone else.

The guiding habit: **keep things as private as you can.** Only add `pub` when something genuinely needs to be used from outside. Private code is free to change without breaking anyone.

### `use` saves you from long paths

Writing `parser::parse` every time gets tiring. The `use` keyword brings a name into scope so you can refer to it directly:

```rust,editable
mod parser {
    pub fn parse(input: &str) -> usize {
        input.len()
    }
}

use parser::parse;   // bring `parse` into scope

fn main() {
    let n = parse("hello");   // now no prefix needed
    println!("{n}");
}
```

You've already used `use` without thinking — pulling in things like `use std::collections::HashMap;`. It's just "let me call this by its short name."

### Modules and files

In small examples, `mod parser { ... }` with the code right there in braces works fine. In real projects, you usually put a module in its own file. Writing `mod parser;` (with a semicolon, no braces) tells Rust: "the module `parser` lives in a file called `parser.rs` next door — go read it." The module structure and the file structure line up, but they're separate ideas: `mod` declares the module, and the file is just where its contents happen to live. You don't need this yet; recognize it when you see it.

### The standard library is a crate too

Everything you get for free — `String`, `println!`, `Vec` — comes from a library crate called `std`. When you write `std::collections::HashMap`, you're reading a path: the `std` crate, its `collections` module, the `HashMap` inside. Same `::` navigation, all the way down.

## Common mistakes

- **Forgetting `pub`.** Items are private by default. Calling a module's function from outside without marking it `pub` fails with *"function is private."* Add `pub` to the things you want to expose.
- **Making everything `pub`.** The opposite mistake. If every function is public, you can never safely change your internals. Expose only what callers truly need.
- **Confusing `mod` and `use`.** `mod` *declares* a module (creates the drawer or points at its file). `use` just makes an existing name shorter to type. They are not the same; `use` alone won't create a module.
- **Wrong path with `::`.** `parser.parse()` (a dot) is not how you reach into a module — that's method syntax. Use `parser::parse()` with the double colon for paths.
- **`pub` on the function but not its enclosing module.** If a module is private, marking an inner function `pub` still won't let outside code reach it — the whole path must be reachable. Make the parent module `pub` too if needed.

## More examples

### A CLI's flag parser gets its own drawer
Keeping argument-parsing code inside a `cli` module means `main` stays focused on running the program, not decoding strings.

```rust,editable
mod cli {
    pub fn parse_flag(arg: &str) -> bool {
        arg == "--verbose" || arg == "-v"
    }
}

fn main() {
    let args = ["build", "--verbose"];
    let verbose = args.iter().any(|a| cli::parse_flag(a));
    println!("verbose mode: {}", verbose);
}
```

### Nested modules for a game engine's systems
A game engine groups unrelated systems — physics, rendering, audio — into their own nested modules so their internals don't tangle together.

```rust,editable
mod game {
    pub mod physics {
        pub fn apply_gravity(velocity_y: f64) -> f64 {
            velocity_y - 9.8
        }
    }
}

fn main() {
    let v = game::physics::apply_gravity(0.0);
    println!("velocity after one tick: {v}");
}
```

### An inventory module for an online store
Stock-checking logic lives behind one `pub` function in an `inventory` module, so the rest of the store's code doesn't need to know how availability is calculated.

```rust,editable
mod inventory {
    pub fn in_stock(quantity: u32) -> bool {
        quantity > 0
    }
}

fn main() {
    let quantity = 0;
    println!("in stock? {}", inventory::in_stock(quantity));
}
```

### A config module for a web server's defaults
Bundling default settings into a `config` module gives the rest of the crate one path to reach for instead of scattering constants everywhere.

```rust,editable
mod config {
    pub const DEFAULT_PORT: u16 = 8080;

    pub fn describe() -> String {
        format!("listening on port {DEFAULT_PORT}")
    }
}

fn main() {
    println!("{}", config::describe());
    println!("port constant: {}", config::DEFAULT_PORT);
}
```

## Your turn

This program tries to use a function from a module, but it won't compile. Two things are wrong. Fix it so it prints the length. Press ▶ Run.

```rust,editable
mod text_tools {
    fn word_count(input: &str) -> usize {
        input.split(' ').count()
    }
}

fn main() {
    let n = text_tools.word_count("hello there friend");
    println!("word count is {n}");
}
```

<details><summary>Show solution</summary>

The function needs `pub` so `main` can see it, and you reach into a module with `::`, not a dot.

```rust,editable
mod text_tools {
    pub fn word_count(input: &str) -> usize {
        input.split(' ').count()
    }
}

fn main() {
    let n = text_tools::word_count("hello there friend");
    println!("word count is {n}"); // 3
}
```

`pub` opens the function to the outside, and `text_tools::word_count` is the correct path.

</details>

## Quick check

<div class="quiz" data-topic="modules-and-crates"></div>

## Remember this

- A **crate** is a compiled package: a **binary** crate runs (`main`), a **library** crate is used by others.
- A **module** (`mod name { ... }`) groups related code inside a crate, like a labeled drawer.
- Everything is **private by default**; `pub` exposes an item to code outside its module.
- Reach into a module with `::` (a path), e.g. `parser::parse`. Method calls use a dot.
- `use` brings a name into scope so you can type its short form. The standard library is the `std` crate.

## Go deeper

- [Rust Book - Modules](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html) — Module basics.

**Next:**

- [Structs](../language-basics/structs.md)
- [Enums](../language-basics/enums.md)
- [Workspaces and crates](../runtime-and-ecosystem/workspaces-and-crates.md)

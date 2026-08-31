# Cargo basics

> **Beginner** · Start here

## What & why

Cargo is the tool you'll type more than any other in Rust. It starts new projects, builds them, runs them, runs your tests, and downloads code from other people. Learn a handful of Cargo commands now and you'll have the everyday workflow that carries you through the whole rest of Rust. This is the practical center of your day-to-day.

## The idea, slowly

You *could* compile Rust by calling `rustc` on a single file by hand. Almost nobody does. Real projects have many files, need outside libraries, want tests, and have to be built the same way on everyone's machine. Cargo handles all of that so you don't have to think about it. One tool, one set of commands, every project the same shape.

### Making a new project

To start a project:

```bash
cargo new hello-rust
cd hello-rust
```

`cargo new hello-rust` builds a folder named `hello-rust` with everything a Rust project needs already in place. Here's what it "thinks" it should give you:

```text
hello-rust/
├── Cargo.toml       <- the project's settings and dependency list
└── src/
    └── main.rs      <- your code starts here
```

- **`src/main.rs`** is where your code lives. Cargo even fills it with a working "Hello, world" so the project runs immediately.
- **`Cargo.toml`** is the project's ID card and shopping list. It holds the project's name, its version, and — importantly — the list of outside libraries it depends on. (`.toml` is just a simple settings-file format; don't worry about it beyond "this is where project settings live.")

### Building and running

From inside the project folder, the command you'll use constantly:

```bash
cargo run
```

`cargo run` does two jobs in one: it **builds** your code (compiles it) and then **runs** the resulting program. On a brand-new project it prints `Hello, world!`. That single line `main.rs` looks like this:

```rust,editable
fn main() {
    println!("Hello, world!");
}
```

If you only want to compile without running, use `cargo build`. If you only want to *check* that the code is valid without producing a finished program — which is faster — use `cargo check`. That last one is a beginner's best friend: while you're fixing compiler errors, `cargo check` gives you the same errors much quicker than a full build.

### Debug builds vs release builds

By default Cargo builds a **debug** version: it compiles fast and keeps extra info to help you find bugs, but the program itself runs slower. When you want the fast, optimized version, add `--release`:

```bash
cargo build --release
```

For learning, plain `cargo run` (debug) is exactly what you want. Reach for `--release` only when you actually care about the program's speed.

### Adding someone else's code (a dependency)

Rust's real power shows up when you pull in libraries — called **crates** — that other people wrote. Say you want colored terminal text. From your project folder:

```bash
cargo add colored
```

`cargo add` writes a line into your `Cargo.toml` under `[dependencies]`, and the next `cargo run` downloads and compiles that crate for you automatically. You can also edit `Cargo.toml` by hand; `cargo add` just does it for you safely. The huge public collection of crates lives at [crates.io](https://crates.io).

### The lockfile: `Cargo.lock`

The first time you build, Cargo creates a file called **`Cargo.lock`**. It records the *exact* versions of every dependency it used. Its whole purpose is repeatability: with the lockfile, your project builds with the identical library versions on your laptop, your friend's laptop, and a server — no "works on my machine" surprises. For an application (a program you run), **commit `Cargo.lock` to git**. You don't edit it by hand; Cargo manages it.

### The commands you'll actually use daily

- `cargo new <name>` — start a project.
- `cargo run` — build and run it (your most-used command).
- `cargo check` — quickly verify it compiles, no finished program. Great while fixing errors.
- `cargo build` — compile it (`--release` for the fast, optimized version).
- `cargo test` — run your tests.
- `cargo add <crate>` — add a dependency.

That's the core loop. Everything else you can look up when you need it.

## Common mistakes

- **Running Cargo from the wrong folder.** Cargo commands work *inside* a project — the folder that has `Cargo.toml`. If you run `cargo run` and get an error about no manifest / `Cargo.toml` not found, you're probably one folder too high. `cd` into the project first.
- **Forgetting to `cd` after `cargo new`.** `cargo new hello-rust` makes the folder but leaves you *outside* it. You must `cd hello-rust` before `cargo run` does anything.
- **Reaching for `cargo clean` at the first weird error.** `cargo clean` deletes all built files so the next build starts from scratch — slow, and rarely the actual fix. Stale-build problems are uncommon; read the real error first and only clean if you genuinely suspect leftover build junk.
- **Not committing `Cargo.lock` for an application.** Leave it out and different machines may pull different dependency versions, causing bugs that only appear "over there." Commit it for apps so everyone builds the same thing.

## More examples

### Starting a library instead of an app
You're writing a chunk of logic — say, date-parsing helpers — that other code will import, not something you run directly.

```bash
cargo new --lib date_utils
```

### Adding a dependency and building it
Your project needs to read JSON, so you pull in a crate instead of writing a parser yourself.

```bash
cargo add serde_json
cargo build
```

### Running just one test by name
Your test suite has grown to two hundred tests, but you're only working on one function right now and don't want to wait for all of them every time.

```bash
cargo test parses_positive_numbers
```

### Fast feedback with `cargo check`
You're mid-refactor, chasing compiler errors one at a time, and producing a full runnable binary after every tiny edit is wasted work.

```bash
cargo check
```

### Running one binary out of several
Your project grew a `src/bin/` folder with a couple of small helper programs alongside the main app, and you want to run just one of them.

```bash
cargo run --bin date_utils_cli
```

## Your turn

No code to debug this time — the exercise is to run the real workflow and read what Cargo prints. In your terminal, do exactly this:

```bash
cargo new hello-rust
cd hello-rust
cargo run
```

Then open `src/main.rs`, change the text inside `println!` to a message of your own, and run `cargo run` again. Watch how the output changes.

<details><summary>Show solution</summary>

The first `cargo run` compiles the starter project and prints:

```text
   Compiling hello-rust v0.1.0 (/path/to/hello-rust)
    Finished dev [unoptimized + debuginfo] target(s) in 0.5s
     Running `target/debug/hello-rust`
Hello, world!
```

After you edit `src/main.rs` — say to `println!("Cargo works!");` — running `cargo run` again recompiles just what changed and prints your new line, `Cargo works!`. If you saw the `Compiling` / `Finished` / `Running` lines and then your text, the whole toolchain is working end to end.

</details>

## Quick check

<div class="quiz" data-topic="cargo-basics"></div>

## Remember this

- `cargo new <name>` starts a project; then `cd` into it before running anything.
- `cargo run` builds **and** runs — it's your most-used command.
- `cargo check` is a fast way to catch errors without a full build; great while fixing them.
- Dependencies (crates) are listed in **`Cargo.toml`**; add them with `cargo add <crate>` from [crates.io](https://crates.io).
- `Cargo.lock` pins exact dependency versions for repeatable builds — commit it for applications.

## Go deeper

- [Cargo Book](https://doc.rust-lang.org/cargo/) — The full reference.
- [Cargo manifest reference](https://doc.rust-lang.org/cargo/reference/manifest.html) — How `Cargo.toml` is structured.

**Next:**

- [Hello, world](../start-here/hello-world.md)
- [Modules and crates](../language-basics/modules-and-crates.md)
- [Testing](../runtime-and-ecosystem/testing.md)

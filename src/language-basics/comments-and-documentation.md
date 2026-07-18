# Comments and documentation

> **Beginner** · Language basics

## What & why

Comments are notes in your code that the compiler ignores — they're for humans. Rust has two flavors: **ordinary comments** for quick notes to yourself, and **doc comments**, a special kind that Rust can gather up and turn into a browsable website of your API. Knowing which is which saves you from writing useless comments and helps you write the useful kind.

## The idea, slowly

### Ordinary comments with `//`

Anything after `//` on a line is a comment. Rust skips it entirely:

```rust,editable
fn main() {
    // This is a note to myself. The compiler ignores it.
    let tries = 3; // you can also put a comment at the end of a line
    println!("{tries}");
}
```

Use these for anything: reminders, explanations, a "TODO" for later. There's no special meaning — it's just text the compiler throws away.

For a longer note across several lines, either start each line with `//`, or use the block form `/* ... */`:

```rust,editable
fn main() {
    /* This is a block comment.
       It can span multiple lines
       without a // on each one. */
    println!("hello");
}
```

Most Rust code uses `//` even for multiple lines, but both work.

### The real skill: comment the *why*, not the *what*

Beginners often write comments that just repeat the code:

```rust,editable
fn main() {
    let x = 5; // set x to 5   <- useless, the code already says this
    println!("{x}");
}
```

That comment adds nothing — anyone can see `x` is `5`. A good comment explains something the code *can't* say: why you did it, a tricky edge case, a reason that isn't obvious. Think of comments as answering "why is this here?" not "what does this line do?"

### Doc comments with `///`

Now the special kind. A comment starting with **three** slashes `///` is a **doc comment**. It's not just a note — it *documents* the item written right below it (a function, struct, and so on). Rust's tool `cargo doc` reads these and generates a real HTML documentation website.

```rust,editable
/// Returns the name of the currently active profile.
///
/// This is the text shown in the app's title bar.
pub fn profile_name() -> &'static str {
    "stable"
}

fn main() {
    println!("{}", profile_name());
}
```

Notice the doc comment sits **above** the function, on its own lines, outside any function body. It describes `profile_name`. When you run `cargo doc --open`, Rust builds a page for `profile_name` with that text as its description. This is exactly how the official Rust standard library docs are made — every description you read there came from a `///` comment in the source.

The `pub` keyword means "public" — this function is part of your library's public interface. Doc comments are most valuable on `pub` items, because those are the parts other people will actually look up.

### Doc comments can hold example code that gets tested

Here's a small piece of Rust magic. Code inside a doc comment's example block is **run as a test** when you run `cargo test`. So your examples can never silently go stale:

```rust,editable
/// Doubles a number.
///
/// # Examples
///
/// ```
/// let answer = my_crate::double(21);
/// assert_eq!(answer, 42);
/// ```
pub fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    println!("{}", double(21));
}
```

You don't need to understand this fully yet. Just tuck away the idea: **documentation examples are real, tested code**, which is why Rust's docs are so trustworthy.

### A quick summary of the marks

- `//` — ordinary comment, for humans, one line.
- `/* ... */` — ordinary comment, block form, can span lines.
- `///` — doc comment, describes the item *below* it, feeds `cargo doc`.
- `//!` — doc comment that describes the *thing it's inside* (a whole module or file) rather than what's below it. You'll see this at the very top of files. It's the same idea, aimed inward.

## Common mistakes

- **Writing comments that repeat the code.** `let x = 5; // assign 5 to x` wastes everyone's time. Comment the reason, not the obvious mechanics.
- **Using `//` when you meant `///`.** A two-slash comment above a function is just a private note — it will *not* show up in `cargo doc`. If you want generated documentation, you need three slashes.
- **Putting a `///` doc comment where there's no item to document.** A `///` must sit directly above something it describes (a function, struct, etc.). Floating on its own with nothing below, or at the end of a line, it causes an error. For inner documentation use `//!` instead.
- **Letting comments drift out of date.** A comment that describes old behavior is worse than none, because it misleads. When you change code, check the comment above it.
- **Over-commenting simple code.** If a function is clear, it doesn't need a paragraph. Save the words for the parts that genuinely need explaining.

## Your turn

This code wants a *doc* comment on the public function so it shows up in `cargo doc`, but it's using the wrong comment style, and the doc comment is in the wrong place. Fix it so the description properly documents `greeting`. Press ▶ Run.

```rust,editable
// Returns a friendly greeting for the app.
pub fn greeting() -> &'static str {
    /// this comment is in the wrong spot
    "Welcome!"
}

fn main() {
    println!("{}", greeting());
}
```

<details><summary>Show solution</summary>

The description belongs *above* the function as a `///` doc comment. The stray `///` inside the body has nothing to document, so make it an ordinary `//` note (or remove it).

```rust,editable
/// Returns a friendly greeting for the app.
pub fn greeting() -> &'static str {
    // this note is fine as an ordinary comment
    "Welcome!"
}

fn main() {
    println!("{}", greeting());
}
```

`///` above the function documents it; `//` inside is just a human note.

</details>

## Quick check

<div class="quiz" data-topic="comments-and-documentation"></div>

## Remember this

- `//` is an ordinary comment; `/* ... */` is the block form. Both are ignored by the compiler.
- `///` is a **doc comment**: it describes the item directly below it and feeds `cargo doc`.
- `//!` documents the thing it's *inside* (a module or file), used at the top of files.
- Good comments explain **why**, not **what** — don't just restate the code.
- Code examples inside doc comments are run as tests, which keeps docs honest.

## Go deeper

- [Rust by Example - Documentation](https://doc.rust-lang.org/rust-by-example/meta/doc.html) — How doc comments work.

**Next:**

- [Modules and crates](../language-basics/modules-and-crates.md)
- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)

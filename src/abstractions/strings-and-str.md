# Strings and `str`

> **Intermediate** · Abstractions

## What & why

Rust has **two** main text types and beginners bump into both on day one: `String` (text your program *owns* and can grow) and `&str` (a *borrowed view* into some text). Once you see why there are two, the endless "expected `&str`, found `String`" errors stop being mysterious and start being obvious.

## The idea, slowly

### Owned vs borrowed, one more time

You already met this split in the Ownership lessons, just with different types. Text is the same story:

- **`String`** is a growable, heap-allocated buffer your variable *owns*. Think of it as a **whiteboard you bought** — it's yours, you can write more on it, erase it, and when you're done it gets thrown away.
- **`&str`** (say "string slice") is a *borrowed look* at text that already exists somewhere. Think of it as **pointing at words on someone else's whiteboard** — you can read them, but you don't own the board and can't grow it.

```rust,editable
fn main() {
    let owned: String = String::from("hello"); // owns a growable buffer
    let borrowed: &str = &owned;                // borrows a view of it

    println!("owned = {}", owned);
    println!("borrowed = {}", borrowed);
}
```

`&owned` borrows the `String` and hands you a `&str` looking into it. Nothing is copied; `borrowed` just points at the same letters `owned` holds.

### String literals are already `&str`

Every time you type text in quotes, that's a `&str` — it points into your compiled program, which stays alive the whole time it runs:

```rust,editable
fn main() {
    let greeting = "hi there"; // type is &str, no String involved
    println!("{}", greeting);
}
```

So `"hi"` is a `&str`, and `String::from("hi")` turns that borrowed text into an owned `String` you can grow.

### Growing a `String`

Only `String` can grow, because only `String` owns its buffer:

```rust,editable
fn main() {
    let mut name = String::from("Shamir");
    name.push_str("ul");     // add several chars
    name.push('!');          // add one char (note single quotes)
    println!("{}", name);    // Shamirul!
}
```

`push_str` takes a `&str` (a borrowed piece of text to append), and `push` takes a single `char`. Try this on a plain `&str` and it won't compile — a borrowed view has nothing of its own to grow.

### The function-argument rule of thumb

This is the practical payoff. **When a function just needs to *read* text, take `&str`.** It's the more flexible choice because *both* a `String` and a `&str` can be passed to it:

```rust,editable
fn shout(text: &str) -> String {
    text.to_uppercase()
}

fn main() {
    let owned = String::from("hello");
    println!("{}", shout(&owned));  // pass a String by reference -> &str
    println!("{}", shout("world")); // pass a literal &str directly
}
```

`shout` accepts `&str`, so it works for owned strings (via `&owned`) *and* literals. If you'd written `fn shout(text: String)`, you'd force every caller to hand over an owned `String` and give it away. Taking `&str` is friendlier. **Take `&str` to read; return `String` when you build new text.**

### Length is in *bytes*, not letters

This one surprises everyone. Rust text is UTF-8, where some characters take more than one byte. `.len()` counts **bytes**:

```rust,editable
fn main() {
    let word = "café";
    println!("bytes: {}", word.len());          // 5, not 4 — é is 2 bytes
    println!("chars: {}", word.chars().count()); // 4 actual characters
}
```

Because of this, you also **can't index text by number** — `word[0]` is a compile error in Rust, on purpose, because "byte 0" and "character 0" aren't always the same thing. To walk characters, use `.chars()`.

## Common mistakes

- **`expected &str, found String` (or vice versa).** A function wanting `&str` won't silently take a `String`. Pass `&my_string` to borrow it down to a `&str`. Going the other way, turn a `&str` into a `String` with `.to_string()` or `String::from(...)`.
- **Trying to grow a `&str`.** `push_str`/`push` need an owned buffer, so they only exist on `String`. The fix is to start from a `String`, or convert with `.to_string()`.
- **Indexing text with `[i]`.** `s[0]` doesn't compile for strings because byte positions and character positions differ in UTF-8. Use `.chars().nth(i)` for a character, or slice by a known byte range.
- **Assuming `.len()` is the character count.** It's the *byte* count. For visible characters use `.chars().count()`.
- **Taking `String` as a parameter when you only read it.** This forces callers to give up ownership for no reason. Prefer `&str` for read-only text arguments.

## Your turn

This function should return the text in uppercase, and be callable with both a `String` and a literal. It doesn't compile. Fix the parameter type.

```rust,editable
fn loud(text: String) -> String {
    text.to_uppercase()
}

fn main() {
    let name = String::from("rust");
    println!("{}", loud(&name)); // passing &name (a &str) — type mismatch
    println!("{}", loud("go"));  // passing a literal &str — type mismatch
}
```

<details><summary>Show solution</summary>

`main` passes borrowed text (`&name` and the literal `"go"`), both of which are `&str`. Make the function accept `&str`:

```rust,editable
fn loud(text: &str) -> String {
    text.to_uppercase()
}

fn main() {
    let name = String::from("rust");
    println!("{}", loud(&name));
    println!("{}", loud("go"));
}
```

Accepting `&str` lets the function read either an owned `String` (borrowed with `&`) or a literal, without taking ownership.

</details>

## Quick check

<div class="quiz" data-topic="strings-and-str"></div>

## Remember this

- `String` **owns** growable text; `&str` **borrows** a view of existing text.
- String literals like `"hi"` are already `&str`.
- Only `String` can grow (`push_str`, `push`) — a `&str` has nothing of its own to grow.
- For read-only text arguments, take **`&str`**; it accepts both `String` (via `&`) and literals.
- `.len()` is **bytes**, not characters; you can't index text by number — use `.chars()`.

## Go deeper

- [Rust Book - Storing UTF-8 Encoded Text with Strings](https://doc.rust-lang.org/book/ch08-02-strings.html) — How Rust treats text.

**Next:**

- [Iterators](../abstractions/iterators.md)
- [File I/O](../runtime-and-ecosystem/file-io.md)

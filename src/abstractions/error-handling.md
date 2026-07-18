# Error handling

> **Intermediate** · Abstractions

## What & why

Most languages let a function secretly fail — throw an exception, return `null`, crash — and you find out at 2am. Rust makes failure **part of the return type**, so the compiler forces you to deal with it before your program runs. The two tools are `Option` (a value might be *missing*) and `Result` (an operation might *fail*), plus the `?` operator that makes handling them painless.

## The idea, slowly

### `Option`: maybe there's a value, maybe not

`Option<T>` is Rust's honest answer to "this might have nothing." It has exactly two shapes: `Some(value)` (there's a value) or `None` (there isn't). This is what replaces `null` — but unlike `null`, you *can't* accidentally use it as if a value were there, because the compiler makes you check.

```rust,editable
fn main() {
    let names = vec!["Alice", "Bob"];

    match names.get(5) {         // .get returns Option: Some or None
        Some(name) => println!("found {}", name),
        None => println!("nobody at index 5"),
    }
}
```

`match` forces you to write *both* branches — the found case and the empty case. Forget one and the compiler refuses to build, saying the match isn't exhaustive. That's Rust removing an entire category of "I forgot to check for null" bugs.

### `Result`: it worked, or here's why it failed

`Result<T, E>` is for operations that can *fail with a reason*. Its two shapes are `Ok(value)` (success, here's the result) and `Err(problem)` (failure, here's what went wrong). Parsing text into a number is a classic example — it fails if the text isn't a number:

```rust,editable
fn main() {
    let good: Result<i32, _> = "42".parse();
    let bad: Result<i32, _> = "oops".parse();

    match good {
        Ok(n) => println!("parsed {}", n),
        Err(e) => println!("failed: {}", e),
    }

    match bad {
        Ok(n) => println!("parsed {}", n),
        Err(e) => println!("failed: {}", e), // this one runs
    }
}
```

Again `match` makes you handle both outcomes. The `Err` carries a real error value describing what happened, not just a silent `false`.

### `unwrap` and `expect`: the "I'm sure" shortcuts (careful!)

Sometimes you just want the value and are willing to crash if it's missing. `unwrap()` and `expect(...)` do that — they hand back the inner value on success, and **panic** (crash the program) on `None`/`Err`:

```rust,editable
fn main() {
    let n: i32 = "42".parse().unwrap(); // fine: it IS a number
    println!("{}", n);

    let ok = "7".parse::<i32>().expect("should be a number");
    println!("{}", ok);
    // "oops".parse::<i32>().unwrap(); // would CRASH the program
}
```

These are handy in tiny examples and tests. In real programs, reaching for `unwrap` everywhere means "crash on any problem," which is rarely what you want. Prefer `match` or `?` (below) when the caller might handle the failure gracefully. `expect` is slightly better than `unwrap` because its message tells you *which* unwrap blew up.

### The `?` operator: propagate failure the easy way

Writing a `match` at every fallible step gets tedious. The `?` operator is the shortcut: put it after something that returns a `Result` (or `Option`), and it means **"if this is `Ok`, give me the value; if it's `Err`, stop and return that error from my function."**

```rust,editable
use std::num::ParseIntError;

fn double_from_text(text: &str) -> Result<i32, ParseIntError> {
    let n = text.parse::<i32>()?; // on error, return the Err right here
    Ok(n * 2)                     // on success, continue
}

fn main() {
    println!("{:?}", double_from_text("10"));   // Ok(20)
    println!("{:?}", double_from_text("nope")); // Err(ParseIntError { .. })
}
```

The `?` after `.parse()` unpacks the `Ok` value into `n`, or — if parsing failed — immediately returns the `Err` from `double_from_text`. Notice the function's return type is `Result<i32, ParseIntError>`; **`?` only works inside a function that itself returns `Result` (or `Option`)**, because that's where the early error goes. Also notice the success path still wraps the answer in `Ok(...)` — the function's job is to return a `Result`.

**What the compiler is thinking:** at the `?`, it inserts "check: is this `Err`? If so, return it now. Otherwise unwrap the `Ok`." One character replaces a whole `match`.

### `main` can return a `Result` too

So you can even use `?` in `main`:

```rust,editable
fn main() -> Result<(), std::num::ParseIntError> {
    let n: i32 = "123".parse()?;
    println!("got {}", n);
    Ok(())
}
```

`Ok(())` means "succeeded, with no meaningful value" — `()` is Rust's empty type. If a `?` inside `main` hits an error, the program exits and prints it.

## Common mistakes

- **`unwrap()` in real code.** It crashes the whole program on the first `None`/`Err`. Fine for a quick test; risky in anything a user runs. Prefer `match`, `if let`, or `?`.
- **Using `?` in a function that doesn't return `Result`/`Option`.** The error is `the ? operator can only be used in a function that returns Result or Option`. Change the function's return type, or handle the error with `match` instead.
- **Forgetting to wrap the success value in `Ok(...)`.** In a `-> Result<...>` function, the happy path must return `Ok(value)`, not a bare `value`. Bare returns give a type mismatch.
- **Confusing `Option` with `Result`.** Use `Option` when something is simply *absent* (no error to report); use `Result` when there's a *reason it failed* you want to carry. Mixing them up leads to awkward conversions.
- **Ignoring a `Result` entirely.** Rust warns if you drop a `Result` on the floor (`unused Result that must be used`). Handle it, propagate it with `?`, or explicitly `let _ = ...` if you truly mean to ignore it.

## Your turn

This function should parse text into a number and add 1, returning a `Result`. It doesn't compile — the `?` has nowhere to send an error, and the success value isn't wrapped.

```rust,editable
fn plus_one(text: &str) -> i32 {
    let n = text.parse::<i32>()?;
    n + 1
}

fn main() {
    println!("{:?}", plus_one("41"));
}
```

<details><summary>Show solution</summary>

Give the function a `Result` return type so `?` has an error to return early with, and wrap the answer in `Ok(...)`:

```rust,editable
fn plus_one(text: &str) -> Result<i32, std::num::ParseIntError> {
    let n = text.parse::<i32>()?; // on error, returns Err from plus_one
    Ok(n + 1)                     // success must be wrapped in Ok
}

fn main() {
    println!("{:?}", plus_one("41")); // Ok(42)
    println!("{:?}", plus_one("x"));  // Err(...)
}
```

`?` needs a `Result`-returning function to hand its error to, and the happy path returns `Ok(value)`.

</details>

## Quick check

<div class="quiz" data-topic="error-handling"></div>

## Remember this

- `Option<T>` = `Some(v)` or `None` — a value might be **missing** (Rust's safe replacement for null).
- `Result<T, E>` = `Ok(v)` or `Err(e)` — an operation might **fail with a reason**.
- `match` forces you to handle every case, so you can't forget the failure path.
- `?` means "unwrap the `Ok`/`Some`, or return the error early" — only usable in a function that returns `Result`/`Option`.
- `unwrap()` / `expect()` grab the value but **panic** on failure; use them sparingly, mostly in tests and quick scripts.

## Go deeper

- [Rust Book - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Option, Result, and `?`.

**Next:**

- [Testing](../runtime-and-ecosystem/testing.md)
- [File I/O](../runtime-and-ecosystem/file-io.md)
- [Serde and JSON](../runtime-and-ecosystem/serde-and-json.md)

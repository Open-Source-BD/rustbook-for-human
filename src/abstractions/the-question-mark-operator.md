# The ? operator

> **Intermediate** · Abstractions

## What & why

Writing a `match` at every fallible step — parse this, or return the error; read that, or return the error — gets tedious fast, and the boilerplate drowns out the actual logic. The `?` operator is the shortcut: put it after something that returns `Result` (or `Option`), and it means **"if this succeeded, give me the value; if it failed, stop and return that failure from my function right now."** It only works inside a function whose own return type is `Result`/`Option`, and — its real superpower — it can convert between different error types along the way.

## The idea, slowly

### `?` is sugar for a match

Take this function without `?`:

```rust,editable
use std::num::ParseIntError;

fn double_from_text_verbose(text: &str) -> Result<i32, ParseIntError> {
    let n = match text.parse::<i32>() {
        Ok(value) => value,
        Err(e) => return Err(e), // bail out immediately with the error
    };
    Ok(n * 2)
}

fn main() {
    println!("{:?}", double_from_text_verbose("10"));   // Ok(20)
    println!("{:?}", double_from_text_verbose("nope")); // Err(ParseIntError { .. })
}
```

`?` collapses that entire `match` into one character:

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

**What the compiler is thinking:** at the `?`, it inserts "check: is this `Err`? If so, `return Err(...)` right now — converting the error type if needed (more on that below). Otherwise, unwrap the `Ok` and keep going." Notice the success path still wraps the answer in `Ok(...)` — `?` only handles the *early-return* side; the function's normal return still needs to produce a `Result`.

### Why `?` only works in a `Result`/`Option`-returning function

`?`'s early return has to return *something* from the enclosing function — specifically, an `Err` (or `None`). If the function doesn't return `Result`/`Option`, there's nowhere for that early return to go, and the compiler refuses:

```text
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option`
```

The fix is always the same shape: give the function a `Result<T, E>` (or `Option<T>`) return type so `?` has something to return early with.

### The hidden superpower: `?` converts error types via `From`

Real functions often call into several things that fail with *different* error types. `?` doesn't just return the error as-is — it calls `From::from` on it, converting it into whatever error type the function declares. As long as `From<SourceError> for MyError` exists, `?` uses it automatically:

```rust,editable
use std::error::Error;

fn parse_env_number(key: &str) -> Result<i32, Box<dyn Error>> {
    let text = std::env::var(key)?; // VarError converts into Box<dyn Error>
    let n: i32 = text.parse()?;     // ParseIntError converts into Box<dyn Error>
    Ok(n)
}

fn main() {
    match parse_env_number("PORT") {
        Ok(n) => println!("port: {n}"),
        Err(e) => println!("couldn't read PORT: {e}"),
    }
}
```

Here `std::env::var` fails with `VarError` and `.parse()` fails with `ParseIntError` — two unrelated types — but both `?`s work because `Box<dyn Error>` has a blanket `From` impl for *any* type implementing `std::error::Error`. The function only has to declare one error type; `?` does the conversion at each call site. (The next two lessons build on exactly this: writing your own error type with `From` impls, and letting `thiserror`/`anyhow` generate them for you.)

### `?` works on `Option` too

The same operator works in a function returning `Option`: on `Some`, it unwraps; on `None`, it returns `None` immediately.

```rust,editable
fn first_upper_char(text: &str) -> Option<char> {
    let c = text.chars().next()?; // None if text is empty — return None right here
    Some(c.to_ascii_uppercase())
}

fn main() {
    println!("{:?}", first_upper_char("rust")); // Some('R')
    println!("{:?}", first_upper_char(""));      // None
}
```

### `main` can return a `Result` too

Because `?` needs a `Result`/`Option`-returning function to work in, and you'll often want to use `?` at the top level, `fn main` is allowed to return `Result<(), E>`:

```rust,editable
fn main() -> Result<(), std::num::ParseIntError> {
    let n: i32 = "123".parse()?;
    println!("got {}", n);
    Ok(())
}
```

`Ok(())` means "succeeded, with no meaningful value" — `()` is Rust's empty type. If a `?` inside `main` hits an error, the program exits with a nonzero status and prints the error using its `Debug` output.

## Common mistakes

- **Using `?` in a function that doesn't return `Result`/`Option`.** The error is `the ? operator can only be used in a function that returns Result or Option`. Change the function's return type, or handle the error with `match` instead.
- **Forgetting to wrap the success value in `Ok(...)`.** In a `-> Result<...>` function, the happy path must return `Ok(value)`, not a bare `value`. `?` only rewrites the *error* path; the normal return is still your job.
- **Using `?` across two error types with no `From` impl between them.** If your function returns `Result<T, ParseIntError>` but you `?` on something that fails with `std::io::Error`, the compiler can't find a conversion and refuses to build. Either widen the return type (e.g. to `Box<dyn Error>`), or write the `From` impl yourself (next lesson).
- **Expecting `?` to work in a closure the same way it does in the enclosing function.** `?` returns from the *nearest* enclosing function — inside a closure, that's the closure, not `main`. If the closure's return type isn't `Result`/`Option` too, it won't compile.

## Your turn

This function should read a `PORT` environment variable and parse it as a number, but it doesn't compile.

```rust,editable
use std::num::ParseIntError;

fn parse_env_number(key: &str) -> Result<i32, ParseIntError> {
    let text = std::env::var(key)?; // env::var fails with VarError, not ParseIntError
    let n: i32 = text.parse()?;
    Ok(n)
}

fn main() {
    println!("{:?}", parse_env_number("PORT"));
}
```

<details><summary>Show solution</summary>

`std::env::var` fails with `std::env::VarError`, but the function's declared error type is `ParseIntError`. `?` tries to convert the error via `From::from`, but there's no `From<VarError> for ParseIntError` — so the compiler rejects it with a type mismatch on the `?`.

The simplest fix is to widen the return type to something both error types can convert into, like `Box<dyn std::error::Error>`:

```rust,editable
use std::error::Error;

fn parse_env_number(key: &str) -> Result<i32, Box<dyn Error>> {
    let text = std::env::var(key)?; // VarError -> Box<dyn Error>
    let n: i32 = text.parse()?;     // ParseIntError -> Box<dyn Error>
    Ok(n)
}

fn main() {
    println!("{:?}", parse_env_number("PORT"));
}
```

Both `VarError` and `ParseIntError` implement `std::error::Error`, and there's a blanket `From` impl that converts any such type into `Box<dyn Error>`, so both `?`s now compile. (The next lesson shows the alternative: a custom error enum with explicit `From` impls, which keeps the concrete error type instead of erasing it into a trait object.)

</details>

## Quick check

<div class="quiz" data-topic="the-question-mark-operator"></div>

## Remember this

- `expr?` means: on success, give me the inner value; on failure, return early from this function with the error.
- `?` only compiles inside a function that itself returns `Result` or `Option` — there's nowhere else for the early return to go.
- `?` calls `From::from` on the error, so a function can return one error type while `?`-ing through several different underlying error types — as long as a `From` conversion exists (or the target is `Box<dyn Error>`, which accepts anything).
- The happy path still needs an explicit `Ok(value)` (or `Some(value)`) — `?` only handles the early-return side.
- `fn main() -> Result<(), E>` lets you use `?` directly in `main`.

## Go deeper

- [Rust Book - Propagating Errors](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) — Where the ? operator is introduced.

**Next:**

- [Custom error types](../abstractions/custom-error-types.md)
- [thiserror and anyhow](../abstractions/error-crates-thiserror-and-anyhow.md)

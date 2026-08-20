# Option and Result

> **Intermediate** · Abstractions

## What & why

Most languages let a function secretly fail — throw an exception, return `null`, crash — and you find out at 2am. Rust makes failure **part of the return type**, so the compiler forces you to deal with it before your program runs. `Option<T>` says "there might not be a value"; `Result<T, E>` says "this might fail, and here's why." Once you're comfortable with `match` on both, the real payoff is their **combinators** — `.map()`, `.and_then()`, `.unwrap_or()`, `.ok_or()` — which let you chain transformations without unwrapping early and re-wrapping by hand.

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

These are handy in tiny examples and tests. In real programs, reaching for `unwrap` everywhere means "crash on any problem," which is rarely what you want. `expect` is slightly better than `unwrap` because its message tells you *which* unwrap blew up — but neither is a substitute for actually handling the failure.

### Combinators: transforming without unwrapping

Writing `match` every time you touch an `Option`/`Result` gets verbose, especially when all you want to do is "if there's a value, transform it" or "if it failed, use a default." Both types have methods for exactly this — you stay inside the `Option`/`Result` "container" the whole time instead of unwrapping, checking, and re-wrapping by hand.

**`.map()`** transforms the value *inside* `Some`/`Ok`, leaving `None`/`Err` untouched:

```rust,editable
fn main() {
    let price: Option<i32> = Some(10);
    let with_tax = price.map(|p| p * 110 / 100);
    println!("{:?}", with_tax); // Some(11)

    let missing: Option<i32> = None;
    let still_missing = missing.map(|p| p * 110 / 100);
    println!("{:?}", still_missing); // None — map never runs the closure
}
```

**`.and_then()`** is for when the next step is *itself* fallible — the closure you pass must return an `Option`/`Result`, not a bare value. This chains fallible steps without nesting `Option<Option<T>>`:

```rust,editable
fn half_if_even(n: i32) -> Option<i32> {
    if n % 2 == 0 { Some(n / 2) } else { None }
}

fn main() {
    let x = Some(8).and_then(half_if_even).and_then(half_if_even);
    println!("{:?}", x); // Some(2)  (8 -> 4 -> 2)

    let y = Some(7).and_then(half_if_even);
    println!("{:?}", y); // None — 7 is odd, chain stops
}
```

**What the compiler is thinking:** with `.map(f)`, it expects `f: T -> U` and wraps the result back in `Some`/`Ok` for you. With `.and_then(f)`, it expects `f: T -> Option<U>` (or `Result<U, E>`) and does **not** re-wrap — if your closure returns a bare value instead of `Some(value)`, that's a type mismatch, not a missing wrap.

**`.unwrap_or(default)`** and **`.unwrap_or_else(|| ...)`** get you a plain value out, no panic risk — you supply a fallback instead:

```rust,editable
fn main() {
    let a: Option<i32> = None;
    println!("{}", a.unwrap_or(0)); // 0

    let b: Result<i32, String> = Err("bad input".to_string());
    println!("{}", b.unwrap_or_else(|_e| -1)); // -1, computed lazily from the error
}
```

Use `.unwrap_or(x)` when the fallback is cheap to compute up front; use `.unwrap_or_else(|| ...)` when computing it is expensive or needs the error value — the closure only runs on the failure path.

**`.ok_or(err)`** turns an `Option` into a `Result` by supplying the error to use for `None`. **`.ok()`** goes the other way, turning a `Result` into an `Option` and *throwing away* the error:

```rust,editable
fn main() {
    let found: Option<i32> = None;
    let as_result: Result<i32, &str> = found.ok_or("not found");
    println!("{:?}", as_result); // Err("not found")

    let parsed: Result<i32, _> = "42".parse();
    let as_option: Option<i32> = parsed.ok();
    println!("{:?}", as_option); // Some(42)
}
```

**`.filter()`** on `Option` keeps `Some(value)` only if a predicate returns `true`; otherwise it becomes `None`:

```rust,editable
fn parse_positive(text: &str) -> Option<i32> {
    text.parse::<i32>().ok().filter(|&n| n > 0)
}

fn main() {
    println!("{:?}", parse_positive("21")); // Some(21)
    println!("{:?}", parse_positive("-5")); // None — filtered out
    println!("{:?}", parse_positive("oops")); // None — parse failed first
}
```

Chained together, combinators read like a pipeline: `text.parse::<i32>().ok().filter(|&n| n > 0).map(|n| n * 2).unwrap_or(0)` — parse it, drop it if parsing failed or it's not positive, double it, or fall back to `0`. No `match`, no intermediate variables.

## Common mistakes

- **`unwrap()` in real code.** It crashes the whole program on the first `None`/`Err`. Fine for a quick test; risky in anything a user runs. Prefer `match`, `if let`, a combinator, or `?` (next lesson).
- **Passing `.and_then()` a closure that returns a bare value instead of `Option`/`Result`.** `.and_then(|n| n + 1)` doesn't compile — the closure must return `Some(n + 1)` (or `Ok`/`Err`). If your closure just transforms the value, you wanted `.map()`, not `.and_then()`.
- **Reaching for `.and_then()` when `.map()` would do.** If your closure can't fail, `.map()` is simpler and doesn't need you to wrap the result.
- **Confusing `Option` with `Result`.** Use `Option` when something is simply *absent* (no error to report); use `Result` when there's a *reason it failed* you want to carry. `.ok_or()` and `.ok()` exist precisely because this choice sometimes needs to change mid-pipeline.
- **Ignoring a `Result` entirely.** Rust warns if you drop a `Result` on the floor (`unused Result that must be used`). Handle it, propagate it, or explicitly `let _ = ...` if you truly mean to ignore it.

## Your turn

This function should parse a price string, apply a 10% discount, and fall back to `0` if parsing fails — but it doesn't compile.

```rust,editable
fn discounted_price(text: &str) -> i32 {
    text.parse::<i32>()
        .and_then(|n| n * 90 / 100)
        .unwrap_or(0)
}

fn main() {
    println!("{}", discounted_price("100")); // want: 90
    println!("{}", discounted_price("oops")); // want: 0
}
```

<details><summary>Show solution</summary>

The closure passed to `.and_then()` must return a `Result` (since `.parse()` returns `Result<i32, ParseIntError>`), but `n * 90 / 100` is a bare `i32`. Since the transformation here can't fail, the right combinator is `.map()`, which wraps the output for you:

```rust,editable
fn discounted_price(text: &str) -> i32 {
    text.parse::<i32>()
        .map(|n| n * 90 / 100)
        .unwrap_or(0)
}

fn main() {
    println!("{}", discounted_price("100")); // 90
    println!("{}", discounted_price("oops")); // 0
}
```

`.and_then()` is for chaining another *fallible* step (its closure must itself return `Result`/`Option`). `.map()` is for a plain transformation of the success value. Mixing them up is a type error, not a logic bug — the compiler catches it immediately.

</details>

## Quick check

<div class="quiz" data-topic="result-and-option"></div>

## Remember this

- `Option<T>` = `Some(v)` or `None` — a value might be **missing** (Rust's safe replacement for null).
- `Result<T, E>` = `Ok(v)` or `Err(e)` — an operation might **fail with a reason**.
- `match` forces you to handle every case, so you can't forget the failure path.
- `.map(f)` transforms the success value (`f` returns a plain value); `.and_then(f)` chains another fallible step (`f` returns `Option`/`Result`).
- `.unwrap_or(default)` / `.unwrap_or_else(|| ...)` get a plain value out with a fallback; `.ok_or(err)` and `.ok()` convert between `Option` and `Result`; `.filter()` turns `Some` into `None` when a predicate fails.
- `unwrap()` / `expect()` grab the value but **panic** on failure; use them sparingly, mostly in tests and quick scripts.

## Go deeper

- [Rust Book - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Option, Result, and `?`.

**Next:**

- [The ? operator](../abstractions/the-question-mark-operator.md)
- [Custom error types](../abstractions/custom-error-types.md)

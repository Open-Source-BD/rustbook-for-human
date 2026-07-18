# Pattern matching

> **Intermediate** · Language basics

## What & why

Pattern matching is how you look at a value, figure out which *shape* it has, and pull the pieces out — all in one move. It's the natural partner to enums: you built a value that could be one of several things, and `match` is how you handle each thing. Once it clicks, a lot of Rust code that looked mysterious (`if let`, `match`, destructuring) turns out to be the same simple idea wearing different clothes.

## The idea, slowly

### `match`: one value, many branches

A `match` compares a value against a list of **patterns**, top to bottom, and runs the first one that fits:

```rust,editable
fn main() {
    let number = 3;

    match number {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("something else"),
    }
}
```

Read each line as "if the value looks like *this*, do *that*." The `=>` separates the pattern (left) from the code to run (right). The compiler checks each arm in order and stops at the first match.

That last arm, `_`, is the **catch-all** — an underscore that means "anything not already handled." It's like the `default` case in other languages. It matters because of Rust's big rule below.

### The rule: `match` must be exhaustive

Rust insists that a `match` cover **every** possible value. If you leave a case out, it won't compile:

```rust,editable
fn main() {
    let flag = true;

    match flag {
        true => println!("yes"),
        // missing the `false` case!
    }
}
```

Press Run: *"non-exhaustive patterns: `false` not covered."* At first this feels bossy. But it's a gift: it means you can *never* forget a case. If you add a new enum variant six months from now, every `match` that doesn't handle it lights up red immediately. The compiler is thinking: "you claim to handle this value — prove you handled all of it."

You satisfy exhaustiveness either by listing every case, or by adding `_` to sweep up the rest.

### Matching an enum and unpacking its data

This is where `match` earns its keep. When you match an enum variant that carries data, the pattern *names* that data so you can use it:

```rust,editable
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn main() {
    let msg = Message::Write(String::from("hello"));

    match msg {
        Message::Quit => println!("bye"),
        Message::Move { x, y } => println!("move to {x}, {y}"),
        Message::Write(text) => println!("writing: {text}"),
    }
}
```

Look at `Message::Write(text)`. The `text` isn't a value you already have — it's a *name you're inventing* to capture whatever `String` is inside this `Write`. Same with `x` and `y` in the `Move` arm. This is **destructuring**: the pattern mirrors the shape of the data, and Rust hands you the inner pieces under the names you chose. One construct branches *and* extracts, together.

### `if let`: the shortcut for one case

Sometimes you only care about *one* variant and want to ignore everything else. Writing a full `match` with a `_ => ()` throwaway arm is clunky. `if let` is the compact form:

```rust,editable
fn main() {
    let maybe_number: Option<i32> = Some(7);

    if let Some(n) = maybe_number {
        println!("got a number: {n}");
    } else {
        println!("nothing here");
    }
}
```

Read `if let Some(n) = maybe_number` as: "if `maybe_number` matches the pattern `Some(n)`, then bind that inner value to `n` and run the block." It's a `match` with only one interesting arm. Use `if let` when a full `match` would be overkill; use `match` when you genuinely handle several cases.

### Patterns show up in more than `match`

Once you see patterns as "shapes with names," you'll spot them elsewhere. A `let` can destructure:

```rust,editable
fn main() {
    let (a, b, c) = (1, 2, 3);      // unpack a tuple into three names
    println!("{a} {b} {c}");

    let point = (10, 20);
    let (x, y) = point;             // same idea
    println!("x={x}, y={y}");
}
```

`let (a, b, c) = ...` is a pattern too — it takes apart the tuple and binds each slot. So the destructuring you do in a `match` arm is the very same mechanism as a `let` that pulls a tuple apart. It's all one idea.

### Extra tools: multiple patterns and guards

Two handy extras. You can match several values in one arm with `|` ("or"), and you can add an `if` condition (a **guard**) to an arm:

```rust,editable
fn main() {
    let n = 5;

    match n {
        1 | 2 | 3 => println!("small"),        // matches 1, 2, or 3
        x if x > 100 => println!("huge: {x}"), // matches, but only if x > 100
        _ => println!("in between"),
    }
}
```

The `|` lets one arm cover multiple patterns, and `x if x > 100` only fires when both the pattern *and* the extra condition hold. You don't need these often, but they're there when a plain pattern isn't enough.

## Common mistakes

- **Non-exhaustive match.** Leaving out a case fails with *"non-exhaustive patterns."* Handle every variant or add `_`. This is the whole point of `match`, so lean into it rather than fighting it.
- **Putting `_` too early.** Arms are checked top to bottom, so a `_` (or any broad pattern) placed above specific ones will swallow them, and Rust warns the later arms are "unreachable." Keep the catch-all last.
- **Reaching for the inner data without matching.** You can't do `msg.text` on an enum value — it might be a different variant. You get the inner value by matching (or `if let`), which is exactly what these tools are for.
- **Using `match` when `if let` reads better (or vice versa).** A `match` with one real arm and a `_ => ()` is usually clearer as `if let`. Conversely, chaining many `if let`s where a single `match` would do makes code harder to follow.
- **Forgetting patterns bind *new* names.** In `Some(n)`, `n` is a fresh name capturing the inner value — it does not compare against an existing variable called `n`. This surprises people who expect it to mean "match only if equal to `n`."

## Your turn

This program should describe an `Option`, but it won't compile. The `match` is missing a case, and one arm tries to reach into the value the wrong way. Fix it. Press ▶ Run.

```rust,editable
fn describe(value: Option<i32>) -> String {
    match value {
        Some => format!("got {}", value.0),
    }
}

fn main() {
    println!("{}", describe(Some(42)));
    println!("{}", describe(None));
}
```

<details><summary>Show solution</summary>

The `Some` variant carries a value, so the pattern must name it: `Some(n)`. And the match must also handle `None` to be exhaustive.

```rust,editable
fn describe(value: Option<i32>) -> String {
    match value {
        Some(n) => format!("got {n}"),
        None => String::from("got nothing"),
    }
}

fn main() {
    println!("{}", describe(Some(42))); // got 42
    println!("{}", describe(None));     // got nothing
}
```

`Some(n)` destructures the inner number into `n`, and the `None` arm makes the match cover every case.

</details>

## Quick check

<div class="quiz" data-topic="pattern-matching"></div>

## Remember this

- `match` compares a value to patterns top-to-bottom and runs the first that fits; `=>` separates pattern from action.
- A `match` must be **exhaustive** — cover every case or add `_` as a catch-all (kept last).
- Patterns **destructure**: `Some(n)` or `Move { x, y }` both branch *and* bind the inner data to new names.
- `if let` is the compact form for handling just one variant; use it when a full `match` is overkill.
- Patterns also work in `let` bindings (`let (a, b) = pair`), with `|` for multiple patterns and `if` guards for extra conditions.

## Go deeper

- [Rust Book - Match](https://doc.rust-lang.org/book/ch06-02-match.html) — The core matching story.

**Next:**

- [Methods and impl blocks](../language-basics/methods-and-impls.md)
- [Error handling](../abstractions/error-handling.md)

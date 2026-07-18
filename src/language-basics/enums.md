# Enums

> **Beginner** · Language basics

## What & why

An enum lets you say "this value is exactly one of these few possibilities." A traffic light is red, yellow, or green — never all three, never something else. A struct bundles values that are all present *together*; an enum picks *one* from a list of options. This "one of" idea is quietly one of Rust's most powerful tools, and it's the foundation for how Rust handles missing values and errors safely.

## The idea, slowly

### The simplest enum: a set of choices

You define an enum with the `enum` keyword and list the possibilities, called **variants**:

```rust,editable
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let heading = Direction::North;   // pick one variant
    // ... we'll do something with it below
    println!("picked a direction");
}
```

`Direction` is a type whose value can be exactly one of four things. You choose a variant with `EnumName::Variant`, so `Direction::North`. The `::` reaches into the enum to grab the variant, the same path syntax you saw with modules.

A `heading` is *always* a valid `Direction` — there's no way to accidentally create a fifth direction. The compiler knows the complete list, and that turns out to be incredibly useful (see pattern matching below).

### The powerful part: variants can carry data

Here's what makes Rust enums special. Each variant can hold its *own* data, and different variants can hold different shapes of data:

```rust,editable
enum Message {
    Quit,                       // holds nothing
    Move { x: i32, y: i32 },    // holds two named fields, like a struct
    Write(String),              // holds a String
    ChangeColor(i32, i32, i32), // holds three numbers, like a tuple
}

fn main() {
    let a = Message::Quit;
    let b = Message::Move { x: 10, y: 20 };
    let c = Message::Write(String::from("hello"));
    let d = Message::ChangeColor(255, 0, 0);
    println!("built four different messages");
}
```

Read this slowly. A `Message` is one of four things. If it's a `Write`, it carries a `String`. If it's a `Move`, it carries an `x` and a `y`. If it's `Quit`, it carries nothing at all. One type, four different possible shapes, and a value is always exactly one of them.

This is why enums are called the backbone of Rust modeling. You could try to represent this with a struct full of optional fields and a "kind" flag, but then nothing stops you from having a `Write` message with `Move` data filled in. The enum makes the illegal combinations *impossible to build*.

### `Option`: the enum that replaces `null`

You will meet one enum constantly, and it's built into Rust: `Option`. Many languages have `null` — a special "nothing here" value that causes crashes when you forget to check for it. Rust has no `null`. Instead it uses an enum:

```rust,editable
fn find_first_even(numbers: &[i32]) -> Option<i32> {
    for &n in numbers {
        if n % 2 == 0 {
            return Some(n);   // found one: wrap it in Some
        }
    }
    None                       // found nothing
}

fn main() {
    let result = find_first_even(&[1, 3, 4, 7]);
    println!("{:?}", result);          // Some(4)
    let empty = find_first_even(&[1, 3, 5]);
    println!("{:?}", empty);           // None
}
```

`Option<i32>` means "either an `i32`, or nothing." Its two variants are `Some(value)` (there's a value) and `None` (there isn't). Because the "nothing" case is baked into the type, Rust *forces* you to handle it — you can't accidentally use a missing value like you can with `null`. That single design choice removes a whole category of crashes.

(The `{:?}` in `println!` is a debug print — handy for inspecting values while learning. And `Result`, the enum for success-or-error, works the same way; it's in the Error handling lesson.)

### Enums shine with `match`

An enum on its own is just a value. Where it becomes powerful is pairing it with `match`, which lets you handle each variant and *pull the data back out*:

```rust,editable
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn describe(msg: Message) -> String {
    match msg {
        Message::Quit => String::from("quit"),
        Message::Move { x, y } => format!("move to {x}, {y}"),
        Message::Write(text) => format!("write: {text}"),
    }
}

fn main() {
    println!("{}", describe(Message::Move { x: 1, y: 2 }));
    println!("{}", describe(Message::Write(String::from("hi"))));
}
```

Notice how `match` both *branches* on which variant it is and *unpacks* the data inside (`x`, `y`, `text`). The next lesson (pattern matching) is entirely about this. For now, the key insight: enums and `match` are two halves of one idea. You design the possibilities with an enum, then handle them with `match`.

## Common mistakes

- **Forgetting the `EnumName::` prefix.** You write `Direction::North`, not just `North`. Without the prefix Rust doesn't know which enum you mean (unless you brought it into scope with `use`).
- **Treating a variant's data as always accessible.** You can't just read the `String` out of `Message::Write` directly — the value might be a *different* variant. You get the data by matching, which is exactly why `match` exists.
- **Reaching for `null` habits.** There's no `null` in Rust. "Might be missing" is `Option`, and you must handle the `None` case. Trying to skip it won't compile.
- **Overusing structs where an enum fits.** If you find yourself with a "type" field and a pile of fields that are only sometimes filled in, that's an enum trying to be born. Enums make "one of these shapes" explicit and safe.
- **Non-exhaustive `match`.** When you match an enum, you must handle every variant (or use `_` for the rest). Miss one and the compiler stops you — a feature that catches bugs when you add a new variant later.

## Your turn

This program models a coin and tries to get its value, but it won't compile. The variant is referenced without its enum name, and one variant is missing from the match. Fix it. Press ▶ Run.

```rust,editable
enum Coin {
    Penny,
    Nickel,
    Dime,
}

fn value(coin: Coin) -> u32 {
    match coin {
        Penny => 1,
        Nickel => 5,
    }
}

fn main() {
    println!("{}", value(Coin::Dime));
}
```

<details><summary>Show solution</summary>

Each pattern needs the `Coin::` prefix, and `match` must cover every variant — `Dime` was missing.

```rust,editable
enum Coin {
    Penny,
    Nickel,
    Dime,
}

fn value(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
    }
}

fn main() {
    println!("{}", value(Coin::Dime)); // 10
}
```

With all three variants handled and properly prefixed, the match is exhaustive and compiles.

</details>

## Quick check

<div class="quiz" data-topic="enums"></div>

## Remember this

- An `enum` says a value is **exactly one** of several **variants** — pick one with `EnumName::Variant`.
- Variants can carry data, and each can carry a *different* shape (nothing, a tuple, or named fields).
- Enums make illegal states impossible to build, which is why they're great for modeling.
- `Option` (`Some(value)` / `None`) is Rust's built-in replacement for `null` — missing values are handled, not ignored.
- Enums pair with `match` to branch on the variant and unpack its data — that's the next lesson.

## Go deeper

- [Rust Book - Enums](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html) — Variant-driven data.

**Next:**

- [Pattern matching](../language-basics/pattern-matching.md)
- [Error handling](../abstractions/error-handling.md)

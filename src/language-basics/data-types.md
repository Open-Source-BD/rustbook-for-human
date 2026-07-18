# Data types

> **Beginner** · Language basics

## What & why

Every value in Rust has a **type** — a label that says what kind of thing it is: a whole number, a decimal, a true/false, a piece of text. Rust cares deeply about types because knowing the shape of your data up front is how it catches mistakes before your program runs. The good news: most of the time Rust guesses the type for you, and you only spell it out when it asks.

## The idea, slowly

### Two big families: scalars and compounds

There are two families of built-in types:

- **Scalar** types hold *one* value: a number, a `true`/`false`, a single character.
- **Compound** types bundle *several* values together: tuples and arrays.

Let's meet them slowly.

### Numbers: integers and floats

An **integer** is a whole number — no decimal point. `5`, `-3`, `1000`. A **float** is a number with a decimal point — `3.14`, `-0.5`.

Rust integers come with a size and a sign baked into the type name. Don't panic, it's a simple code:

- The letter `i` means **signed** (can be negative). The letter `u` means **unsigned** (zero or positive only).
- The number is how many **bits** it uses, which decides how big it can get: `8`, `16`, `32`, `64`.

So `i32` is a signed 32-bit integer (the everyday default), `u8` is an unsigned 8-bit integer (0 to 255), `u64` is a big positive-only number, and so on.

```rust,editable
fn main() {
    let age: u32 = 32;        // unsigned, can't be negative
    let temperature: i32 = -5; // signed, can be negative
    let pi = 3.14;            // no annotation → Rust picks f64 (a float)
    println!("{age}, {temperature}, {pi}");
}
```

If you don't say which integer type you want, Rust defaults to `i32`. For decimals it defaults to `f64`. So you rarely need to write the type — `let x = 5;` just works and `x` is an `i32`.

### Booleans and characters

A **boolean** (`bool`) is either `true` or `false`. That's the whole type. It's what `if` looks at.

A **character** (`char`) is a single letter, digit, or symbol, written in *single* quotes. Note: single quotes for one character, double quotes for text.

```rust,editable
fn main() {
    let is_ready: bool = true;
    let grade: char = 'A';        // single quotes = one char
    let heart = '♥';              // even emoji-like symbols work
    println!("{is_ready}, {grade}, {heart}");
}
```

### Tuples: a fixed group of possibly-different types

A **tuple** groups a fixed number of values, which can be *different types*, inside parentheses. Think of it as a tiny labeled box with a set number of slots.

```rust,editable
fn main() {
    let point: (i32, i32) = (8, 13);
    let mixed = (500, 6.4, 'x');   // an integer, a float, a char

    // Get values out by position, starting at 0:
    println!("x is {}", point.0);
    println!("y is {}", point.1);

    // Or unpack all at once ("destructuring"):
    let (a, b, c) = mixed;
    println!("{a}, {b}, {c}");
}
```

You reach into a tuple with a dot and the position number: `.0` is the first slot, `.1` the second. A tuple's size is fixed forever — a 2-tuple can never become a 3-tuple.

### Arrays: many of the same type, fixed length

An **array** holds several values of the **same** type, and its length is fixed. It's written in square brackets.

```rust,editable
fn main() {
    let names = ["a", "b", "c"];        // 3 text values
    let zeros = [0; 5];                 // shorthand: five 0s → [0, 0, 0, 0, 0]

    println!("first: {}", names[0]);    // index into it with [ ]
    println!("how many: {}", names.len());
}
```

Two things to remember: every element must be the same type, and the length can't grow or shrink. If you need a list that grows, you want a **vector** (`Vec`), which lives in the Collections lesson. Rule of thumb: *fixed, known number of items → array; changing number of items → vector.*

### Type inference, and when you must help

Most of the time Rust reads the value and figures out the type. But sometimes it genuinely can't decide and asks you to say. The classic case is parsing text into a number:

```rust,editable
fn main() {
    let text = "42";
    let number: u32 = text.parse().unwrap();  // the : u32 tells parse what to make
    println!("{}", number + 1);
}
```

Without `: u32`, Rust wouldn't know *which* number type to parse into, and would refuse to guess. The annotation is you stepping in to answer its question.

## Common mistakes

- **Mixing number types without converting.** Rust won't quietly add an `i32` to a `u8` for you. `let a: i32 = 1; let b: u8 = 2; a + b` fails with a "mismatched types" error. You must convert one, e.g. `a + b as i32`. Rust never does surprise conversions.
- **Using double quotes for a `char`.** `'A'` is a `char`; `"A"` is text (a string). Swapping them gives a type error. Single quote = one character.
- **Indexing past the end of an array.** `let a = [1, 2, 3]; a[5]` compiles but **panics** (crashes) at runtime with "index out of bounds." Arrays don't stretch — the index must be within the length.
- **Expecting an array to grow.** Arrays are fixed length. If you try to "add" an item, there's no method for it. Reach for a `Vec` instead when the size changes.
- **Overflowing a small integer.** A `u8` maxes out at 255. Going past it panics in debug builds. Pick a type big enough for your values.

## Your turn

This program mixes up its types in three places. Fix it so it compiles and prints the point and grade. Press ▶ Run.

```rust,editable
fn main() {
    let grade: char = "A";
    let point: (i32, i32) = (8, 13, 21);
    let scores = [90, 85, "seventy"];

    println!("grade {grade}, point ({}, {})", point.0, point.1);
    println!("first score {}", scores[0]);
}
```

<details><summary>Show solution</summary>

Three type errors: `grade` needs single quotes to be a `char`; the tuple's type says two slots but the value has three; and the array mixes numbers with text.

```rust,editable
fn main() {
    let grade: char = 'A';
    let point: (i32, i32) = (8, 13);
    let scores = [90, 85, 70];

    println!("grade {grade}, point ({}, {})", point.0, point.1);
    println!("first score {}", scores[0]);
}
```

Every value now matches the type it claims to be.

</details>

## Quick check

<div class="quiz" data-topic="data-types"></div>

## Remember this

- Integers name their sign and size: `i32` (signed) is the default, `u32` is unsigned, `u8`/`u64` are smaller/bigger.
- Decimals are floats; `f64` is the default. Booleans are `true`/`false`. A `char` is one character in single quotes.
- **Tuples** group a fixed number of possibly-different types; reach in with `.0`, `.1`.
- **Arrays** hold many values of the *same* type at a fixed length; a growing list is a `Vec` instead.
- Rust infers types when it can, but you must annotate when it genuinely can't decide (like `parse`).

## Go deeper

- [Rust Book - Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html) — Scalars and compound types.

**Next:**

- [Functions](../language-basics/functions.md)
- [Control flow](../language-basics/control-flow.md)
- [Collections](../abstractions/collections.md)

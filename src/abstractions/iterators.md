# Iterators

> **Intermediate** · Abstractions

## What & why

An iterator is a thing that hands you items **one at a time**, on demand. Instead of writing a `for` loop with an index counter and manual bookkeeping, you describe *what* you want done to each item — double it, keep only the even ones, add them up — and Rust walks the sequence for you. The result is shorter code that reads like a sentence.

## The idea, slowly

### One item at a time

Picture a vending machine that dispenses one snack per press of the button, and eventually says "empty." That's an iterator: each "press" gives you the next item (`Some(item)`), until it's done (`None`). You rarely press the button yourself, though — you tell Rust the recipe and it presses for you.

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4];

    // the old, manual way
    for n in &nums {
        println!("{}", n);
    }
}
```

`for n in &nums` already uses an iterator under the hood. The interesting part is what you can chain onto one.

### Adapters: describe the transformation

An **adapter** is a step that transforms the stream. `map` changes each item; `filter` keeps only items that pass a test. They snap together like Lego:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6];

    let result: Vec<i32> = nums
        .iter()               // start an iterator (borrows each item)
        .filter(|n| *n % 2 == 0) // keep even numbers
        .map(|n| n * 10)      // multiply each by 10
        .collect();           // gather results into a Vec

    println!("{:?}", result); // [20, 40, 60]
}
```

Read the chain top to bottom like a pipeline:

- `.iter()` starts the stream, handing out each item.
- `.filter(|n| *n % 2 == 0)` looks at each item and keeps it only if the little test returns `true`. The `|n| ...` part is a **closure** — a tiny inline function (next lesson).
- `.map(|n| n * 10)` replaces each surviving item with a new value.
- `.collect()` gathers everything back into a collection.

### Lazy: nothing happens until you ask

Here's the twist that catches beginners: **adapters do nothing on their own.** `.filter(...).map(...)` just *describes* work. No number is touched until a **consumer** at the end asks for results.

```rust,editable
fn main() {
    let nums = vec![1, 2, 3];

    // This line does NOTHING useful — no consumer at the end:
    let _lazy = nums.iter().map(|n| n * 100);
    // (nothing was multiplied yet!)

    // Add a consumer and now it runs:
    let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6]
}
```

**What the compiler is thinking:** the `map` line just builds a "plan" object. Rust even warns that an iterator adapter is unused because nothing consumed it. Consumers like `.collect()`, `.sum()`, `.count()`, and `for` are what actually pull items through the pipeline. **Adapters plan; consumers do.**

### `iter` vs `iter_mut` vs `into_iter`

These three decide *how* items come out — this is just ownership again:

```rust,editable
fn main() {
    let words = vec![String::from("a"), String::from("b")];

    // iter(): borrow each item (read-only). The vector survives.
    for w in words.iter() {
        println!("borrowed {}", w);
    }
    println!("still have {} words", words.len()); // fine

    // into_iter(): take ownership of each item, consuming the vector.
    for w in words.into_iter() {
        println!("owned {}", w);
    }
    // words is gone now — it was consumed.
}
```

- **`.iter()`** gives you `&T` — a borrow. You can read; the collection stays usable afterward.
- **`.iter_mut()`** gives you `&mut T` — a mutable borrow, so you can *change* each item in place.
- **`.into_iter()`** gives you `T` — the owned item, and it **eats** the collection.

Pick by what you need: reading (`iter`), editing in place (`iter_mut`), or consuming (`into_iter`).

### Common consumers

Besides `collect`, you'll reach for these constantly:

```rust,editable
fn main() {
    let nums = vec![4, 8, 15, 16];

    let total: i32 = nums.iter().sum();
    let count = nums.iter().filter(|n| **n > 10).count();

    println!("sum = {}, big numbers = {}", total, count);
}
```

`sum` adds everything up; `count` tells you how many items came through. Both *finish* the chain and produce a plain value.

## Common mistakes

- **A chain that "does nothing."** If you write `v.iter().map(...)` with no consumer, no work happens and Rust warns `unused iterator`. Add `.collect()`, `.sum()`, a `for`, etc. — **adapters are lazy.**
- **Using the collection after `into_iter()`.** `into_iter()` consumes it, so touching the original afterward gives `value moved`. Use `.iter()` if you need the collection later.
- **The `*` confusion in closures.** `filter` hands you a *reference* (like `&&i32`), so you often need `*n` or `**n` to reach the actual number. The error `cannot compare &i32 with integer` is your hint to dereference.
- **`collect` without a target type.** `.collect()` can build many things, so the compiler asks *which*. The error is `type annotations needed`. Fix it with a type on the variable: `let v: Vec<i32> = ....collect();`.
- **Reaching for a manual index loop out of habit.** `for i in 0..v.len() { v[i] }` works but is noisier and can panic on bad indices. A direct `for x in &v` or an adapter chain is usually clearer and safer.

## Your turn

This should keep the numbers bigger than 2, triple them, and collect them into a `Vec`. It doesn't compile. Two small things are missing.

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4];

    let result = nums
        .iter()
        .filter(|n| n > 2)
        .map(|n| n * 3);

    println!("{:?}", result);
}
```

<details><summary>Show solution</summary>

Two fixes: `filter` gives a reference, so compare with `*n`; and the chain needs a consumer plus a target type to become a `Vec`:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4];

    let result: Vec<i32> = nums
        .iter()
        .filter(|n| **n > 2) // deref the reference to compare
        .map(|n| n * 3)
        .collect();          // consume the chain into a Vec

    println!("{:?}", result); // [9, 12]
}
```

Without `collect`, the adapters just describe work and never run; the type annotation tells `collect` to build a `Vec<i32>`.

</details>

## Quick check

<div class="quiz" data-topic="iterators"></div>

## Remember this

- An iterator yields items **one at a time** until it's empty.
- **Adapters** (`map`, `filter`) are **lazy** — they only describe work and do nothing until a **consumer** runs the chain.
- Consumers (`collect`, `sum`, `count`, `for`) are what actually pull items through.
- `iter()` borrows, `iter_mut()` borrows mutably, `into_iter()` takes ownership and consumes the collection.
- `collect` often needs a target type, e.g. `let v: Vec<_> = ...collect();`.

## Go deeper

- [Rust Book - Processing a Series of Items with Iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html) — Iterator fundamentals.

**Next:**

- [Closures](../abstractions/closures.md)
- [Error handling](../abstractions/error-handling.md)

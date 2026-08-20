# Iterator basics

> **Intermediate** · Abstractions

## What & why

Think of an iterator as a vending machine: you press the button (`.next()`) and it hands you one item, or tells you it's out. Every `for` loop you've ever written already uses one under the hood. This lesson pulls back the curtain on the `Iterator` trait itself, and on the single biggest source of iterator-flavored borrow-checker errors: the difference between `.iter()`, `.iter_mut()`, and `.into_iter()`. Chaining transformations like `.map()` and `.filter()` — the fun part — is the next lesson; here we're building the foundation that makes those make sense.

## The idea, slowly

### The `Iterator` trait: one method, `.next()`

Everything iterable implements this trait, which boils down to a single required method:

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

Call `.next()` and you get `Some(item)` if there's more, or `None` once it's exhausted. That's the whole contract. Every adaptor and every `for` loop you'll ever write is built on repeated calls to this one method.

You can drive an iterator by hand:

```rust,editable
fn main() {
    let nums = vec![10, 20, 30];
    let mut iter = nums.iter(); // must be `mut` — next() needs &mut self

    println!("{:?}", iter.next()); // Some(10)
    println!("{:?}", iter.next()); // Some(20)
    println!("{:?}", iter.next()); // Some(30)
    println!("{:?}", iter.next()); // None — exhausted
}
```

**What the compiler is thinking:** `next(&mut self)` takes a mutable reference to the iterator so it can update wherever it tracks "how far along am I." That's why `iter` had to be declared `mut` — without it, the compiler refuses with `cannot borrow iter as mutable`.

### `for` loops are `.next()` calls in a trench coat

Nobody actually writes manual `.next()` loops by hand — that's exactly what `for` is sugar for. This:

```rust,editable
fn main() {
    let nums = vec![10, 20, 30];
    for n in &nums {
        println!("{n}");
    }
}
```

desugars to roughly this:

```rust,editable
fn main() {
    let nums = vec![10, 20, 30];
    let mut iter = (&nums).into_iter();
    while let Some(n) = iter.next() {
        println!("{n}");
    }
}
```

A `for` loop is just a `while let Some(...) = iter.next()` loop with the bookkeeping hidden. That single fact unlocks the next section: the *only* thing that changes between `for x in &v`, `for x in &mut v`, and `for x in v` is which flavor of `into_iter()` gets called — and each one hands back something different.

### `.iter()` vs `.iter_mut()` vs `.into_iter()`

This is just ownership again, wearing an iterator costume:

| Method | Yields | Effect on the collection |
|---|---|---|
| `.iter()` | `&T` (a borrow) | Untouched — still usable afterward |
| `.iter_mut()` | `&mut T` (a mutable borrow) | Untouched, but items can be changed in place |
| `.into_iter()` | `T` (owned) | **Consumed** — the collection is gone after |

```rust,editable
fn main() {
    let mut nums = vec![1, 2, 3];

    // .iter(): read-only borrow, nums survives
    for n in nums.iter() {
        print!("{n} ");
    }
    println!("- still have {} items", nums.len());

    // .iter_mut(): mutable borrow, change items in place
    for n in nums.iter_mut() {
        *n *= 10; // *n because n is &mut i32 — dereference to write through it
    }
    println!("{nums:?}"); // [10, 20, 30]

    // .into_iter(): takes ownership, nums is consumed
    for n in nums.into_iter() {
        print!("{n} ");
    }
    // nums.len() here would NOT compile — nums was moved
}
```

And the desugaring rule ties it all together: `for x in &v` calls `.iter()` under the hood, `for x in &mut v` calls `.iter_mut()`, and `for x in v` calls `.into_iter()`. That's why `for x in &v` leaves `v` usable afterward, and `for x in v` doesn't — you're choosing the borrow mode the moment you write (or omit) the `&`.

### Laziness: an iterator does nothing until something asks

Building an iterator — even one with a transformation attached — doesn't run anything by itself. It's a plan, not an action:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3];

    nums.iter().map(|n| n * 100); // just describes work — the compiler warns "unused `Map` that must be used"
    // (nothing was multiplied — nothing consumed the chain)

    let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect(); // NOW it runs
    println!("{doubled:?}"); // [2, 4, 6]
}
```

Nothing happens until something pulls values out — by calling `.next()` directly, by looping with `for`, or by handing the chain to a **consumer** like `.collect()`. That laziness is exactly what makes chaining `.map()`, `.filter()`, and friends cheap and composable, which is exactly what the next lesson, [Iterator adaptors](../abstractions/iterator-adaptors.md), covers in depth.

## Common mistakes

- **Using `for x in v` when you still need `v` afterward.** That form calls `.into_iter()`, which consumes `v`. If you need the collection again, loop over `&v` instead.
- **Forgetting `mut` on a manually-driven iterator.** `.next()` takes `&mut self`; `let iter = v.iter();` followed by `iter.next()` won't compile without `let mut iter = ...`.
- **Assuming an iterator "ran" just because you built it.** `v.iter().map(...)` alone does nothing — Rust warns `unused iterator that must be used`. You need a `for` loop or a consumer.
- **Forgetting to dereference in `.iter_mut()`.** The loop variable is `&mut T`, not `T` — writing `n = 5` won't compile, you need `*n = 5` to write through the reference.
- **Reaching for `.into_iter()` out of habit.** If you only need to *read* the items, `.iter()` is almost always the right call — it doesn't give up the collection.

## Your turn

This program should greet every name and then report how many names there were. It doesn't compile.

```rust,editable
fn main() {
    let names = vec![String::from("Ferris"), String::from("Rusty")];

    for name in names {
        println!("hello, {name}");
    }

    println!("we had {} names", names.len());
}
```

<details><summary>Show solution</summary>

`for name in names` calls `.into_iter()`, which takes ownership of `names` and consumes it — by the time `names.len()` runs, `names` is gone. The fix is to borrow instead of own, since the loop body only needs to *read* each name:

```rust,editable
fn main() {
    let names = vec![String::from("Ferris"), String::from("Rusty")];

    for name in &names { // borrow: names survives the loop
        println!("hello, {name}");
    }

    println!("we had {} names", names.len()); // fine now
}
```

`for name in &names` calls `.iter()` under the hood, so `names` is only borrowed for the duration of the loop and is still valid afterward.

</details>

## Quick check

<div class="quiz" data-topic="iterator-basics"></div>

## Remember this

- The `Iterator` trait boils down to one method: `fn next(&mut self) -> Option<Self::Item>`.
- A `for` loop is sugar for calling `.into_iter()` once, then looping `while let Some(x) = iter.next()`.
- `.iter()` yields `&T` (borrow, collection stays usable), `.iter_mut()` yields `&mut T` (mutate in place), `.into_iter()` yields `T` (owned, **consumes** the collection).
- `for x in &v` borrows (like `.iter()`); `for x in &mut v` mutably borrows (like `.iter_mut()`); `for x in v` consumes (like `.into_iter()`).
- An iterator does nothing on its own — it needs `.next()`, a `for` loop, or a consumer like `.collect()` to actually run.

## Go deeper

- [Rust Book - Processing a Series of Items with Iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html) — Iterator fundamentals.

**Next:**

- [Iterator adaptors](../abstractions/iterator-adaptors.md)
- [Closures](../abstractions/closures.md)

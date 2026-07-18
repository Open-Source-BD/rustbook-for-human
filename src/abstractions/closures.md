# Closures

> **Intermediate** · Abstractions

## What & why

A closure is a **little function you write right where you use it**, without giving it a name — and it can *remember* variables from the surrounding code. You've already seen them living inside iterator chains (`.map(|n| n * 2)`). This lesson slows down and explains what those `|...|` bars actually are.

## The idea, slowly

### A function with no name

Compare a normal function to a closure that does the same thing:

```rust,editable
fn main() {
    // normal named function
    fn double_fn(x: i32) -> i32 {
        x * 2
    }

    // closure stored in a variable
    let double_cl = |x: i32| x * 2;

    println!("{}", double_fn(5)); // 10
    println!("{}", double_cl(5)); // 10
}
```

The closure is `|x: i32| x * 2`. Read it as:

- **`|x: i32|`** — the parameter list, but with pipes `| |` instead of parentheses. Here it takes one `i32` called `x`.
- **`x * 2`** — the body. A one-expression closure doesn't need `{ }` or a `return`; the last expression is the result. (You *can* use braces for multi-line bodies: `|x| { let y = x + 1; y * 2 }`.)

Rust can usually figure out the types, so you'll often see them dropped: `let double_cl = |x| x * 2;`. The types get *inferred* from how you call it.

### The superpower: capturing the environment

Here's what makes a closure different from a plain function — it can **use variables from the code around it**, without you passing them in:

```rust,editable
fn main() {
    let tax = 0.1;

    // this closure "captures" tax from the surrounding scope
    let with_tax = |price: f64| price + price * tax;

    println!("{}", with_tax(100.0)); // 110
    println!("{}", with_tax(50.0));  // 55
}
```

`with_tax` uses `tax` even though `tax` was never passed in as an argument. The closure **captured** it from the environment. A normal `fn` *cannot* do this — a top-level function only sees its own parameters. This is exactly why closures shine in iterator chains: `.filter(|n| *n > threshold)` can reach out and grab your local `threshold`.

**What the compiler is thinking:** "This closure mentions `tax`, which lives outside it. I need to keep `tax` available for the closure to use." It quietly bundles the captured variable together with the code.

### How a closure captures: borrow, or move

By default a closure captures **by borrowing** — it just peeks at the variable, like `&`:

```rust,editable
fn main() {
    let name = String::from("Rust");

    let greet = || println!("Hello, {}", name); // borrows name
    greet();
    greet();

    println!("still have: {}", name); // name is still usable — only borrowed
}
```

But sometimes you need the closure to **own** what it captures — especially if the closure will outlive the current scope (for example, handed to a thread). You force that with the `move` keyword:

```rust,editable
fn main() {
    let name = String::from("Rust");

    let greet = move || println!("Hello, {}", name); // takes ownership of name
    greet();
    // println!("{}", name); // ERROR now: name was moved into the closure
}
```

`move` tells the closure "take these captured variables *with* you." After that, the original variable is gone from the outer scope — same move rules you learned in Ownership, just applied to captured values.

### Passing a closure to a function

Functions can accept closures as arguments. You describe "a thing I can call" with the `Fn` trait family:

```rust,editable
fn apply_twice<F: Fn(i32) -> i32>(f: F, start: i32) -> i32 {
    f(f(start))
}

fn main() {
    let add_three = |x| x + 3;
    println!("{}", apply_twice(add_three, 10)); // 10 -> 13 -> 16
}
```

`F: Fn(i32) -> i32` reads as "`F` is some callable that takes an `i32` and returns an `i32`." That's a trait bound (from the Generics lesson), and it lets `apply_twice` accept any matching closure. The three closure traits are `Fn` (just reads captured values), `FnMut` (changes them), and `FnOnce` (consumes them) — for most beginner code, `Fn` is all you need to recognize.

## Common mistakes

- **Pipes vs parentheses.** Closure parameters go between `| |`, not `( )`. Writing `(x) x * 2` isn't a closure. The shape is `|params| body`.
- **Using a captured variable after `move`.** Once you write `move ||`, captured owning values (like a `String`) are moved *into* the closure; touching the original afterward gives `value moved`. Only add `move` when you actually need the closure to own its captures.
- **Expecting a closure to work in a place a plain `fn` is required.** Some very low-level spots want a bare function pointer, not a capturing closure. If a closure captures nothing, it can coerce to a function pointer; if it captures, it can't. The error mentions `expected fn pointer, found closure`.
- **Over-stuffing a closure.** A closure with twenty lines of logic is harder to read than a named function. Keep closures short and near their use; promote big logic to a real `fn`.
- **Forgetting the return type/expression rule.** In `|x| x + 1`, there's no `;` after `x + 1` — adding one (`|x| { x + 1; }`) turns it into a closure that returns nothing (`()`), which usually breaks the caller.

## Your turn

This should build a closure that adds a captured `bonus` to any score, then apply it. It doesn't compile — the closure syntax is wrong.

```rust,editable
fn main() {
    let bonus = 5;

    let add_bonus = (score) score + bonus;

    println!("{}", add_bonus(10));
    println!("{}", add_bonus(20));
}
```

<details><summary>Show solution</summary>

Closure parameters go inside pipes `| |`, not parentheses:

```rust,editable
fn main() {
    let bonus = 5;

    let add_bonus = |score| score + bonus; // pipes, and it captures bonus

    println!("{}", add_bonus(10)); // 15
    println!("{}", add_bonus(20)); // 25
}
```

The closure captures `bonus` from the surrounding scope, so you never pass it in explicitly.

</details>

## Quick check

<div class="quiz" data-topic="closures"></div>

## Remember this

- A closure is an unnamed function written inline: `|params| body`.
- Its superpower is **capturing** variables from the surrounding scope — a plain `fn` can't do that.
- By default closures **borrow** what they capture; add `move` to make them **own** it (needed when the closure outlives the scope, e.g. threads).
- Functions accept closures via the `Fn` / `FnMut` / `FnOnce` trait bounds.
- Keep closures small; promote big logic to a named function.

## Go deeper

- [Rust Book - Closures](https://doc.rust-lang.org/book/ch13-01-closures.html) — How closures capture state.

**Next:**

- [Error handling](../abstractions/error-handling.md)
- [Concurrency](../runtime-and-ecosystem/concurrency.md)

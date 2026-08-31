# Control flow

> **Beginner** · Language basics

## What & why

Control flow is how your program makes decisions and repeats work: "if this is true, do that," "keep doing this until done," "for each item in the list, handle it." Every useful program branches and loops. Rust's versions are familiar if you've seen another language, with a couple of strict rules that will save you from bugs.

## The idea, slowly

### `if` needs a real boolean

An `if` runs a block only when a condition is `true`:

```rust,editable
fn main() {
    let score = 81;

    if score >= 70 {
        println!("pass");
    } else {
        println!("retry");
    }
}
```

Here's Rust's first rule that surprises people coming from C or JavaScript: **the condition must be an actual `bool`.** Rust does *not* treat `0` as false or `1` as true. This won't compile:

```rust,editable
fn main() {
    let count = 3;
    if count {                 // ERROR: expected `bool`, found integer
        println!("nonzero");
    }
}
```

The compiler is thinking: "you gave me a number, but `if` only understands `true`/`false`." Write the comparison you actually mean: `if count != 0 { ... }`. This forces you to be explicit, which prevents the classic "I meant to compare but wrote an assignment" family of bugs.

You can chain more conditions with `else if`:

```rust,editable
fn main() {
    let n = 0;
    if n > 0 {
        println!("positive");
    } else if n < 0 {
        println!("negative");
    } else {
        println!("zero");
    }
}
```

### `if` is an expression — it produces a value

In Rust, `if` doesn't just *do* things; it can *give back* a value. That means you can put an `if` on the right of a `let`:

```rust,editable
fn main() {
    let score = 81;
    let grade = if score >= 70 { "pass" } else { "retry" };
    println!("{grade}");
}
```

Read it as: "let `grade` be `\"pass\"` if the score is high enough, otherwise `\"retry\"`." Each branch is a little expression, and the whole `if` becomes whichever branch runs. One catch: both branches must produce the **same type** (here, both text). If one arm gave text and the other a number, Rust couldn't decide what `grade` is, and would error.

### Three ways to loop

Rust has three looping tools. Learn what each is for.

**`loop`** repeats forever until you `break` out. It's the most basic:

```rust,editable
fn main() {
    let mut n = 0;
    loop {
        n += 1;
        if n == 3 {
            break;      // jump out of the loop
        }
    }
    println!("stopped at {n}"); // 3
}
```

A neat trick: `loop` can *return* a value by putting it after `break`:

```rust,editable
fn main() {
    let mut n = 0;
    let result = loop {
        n += 1;
        if n * n > 20 {
            break n;        // hand this value out of the loop
        }
    };
    println!("first n whose square passes 20 is {result}"); // 5
}
```

**`while`** repeats *as long as* a condition stays true. Use it when you don't know how many times up front:

```rust,editable
fn main() {
    let mut countdown = 3;
    while countdown > 0 {
        println!("{countdown}...");
        countdown -= 1;
    }
    println!("liftoff!");
}
```

**`for`** walks through each item of a collection. This is the one you'll use most:

```rust,editable
fn main() {
    for item in [10, 20, 30] {
        println!("{item}");
    }
}
```

To repeat a fixed number of times, loop over a **range** with `..`:

```rust,editable
fn main() {
    for i in 1..4 {          // 1, 2, 3 — the end (4) is NOT included
        println!("count {i}");
    }
}
```

Watch the range carefully: `1..4` gives `1, 2, 3` — the right side is **excluded**. If you want to include it, write `1..=4` (with the `=`), which gives `1, 2, 3, 4`.

### Why prefer `for` over manual indexing

You *could* loop by hand with a counter and index into an array, but it's easy to get the bounds wrong and crash with "index out of bounds." `for item in list` can never run off the end, because Rust hands you each item directly. Reach for `for` first; it's safer and reads better.

## Common mistakes

- **Using a number as a condition.** `if count { }` fails — Rust needs a `bool`. Write the comparison: `if count != 0 { }`. Same for `while`.
- **Mismatched `if` branch types.** When an `if` produces a value, every branch must return the same type. `let x = if c { 1 } else { "no" };` errors because one arm is a number and the other is text.
- **Off-by-one with ranges.** `1..4` stops at 3, not 4. Forgetting the end is excluded leads to loops that run one time too few. Use `1..=4` when you want the last number included.
- **`break` outside a loop.** `break` only works inside `loop`, `while`, or `for`. Using it elsewhere is an error.
- **Forgetting to change the `while` condition.** If nothing inside the loop moves toward making the condition false, it runs forever. Make sure you update the variable the condition checks.

## More examples

### Searching until you find it, with `break value`
When you're scanning for something, you often want the loop to hand back *what it found*, not just stop — `break value` does exactly that.

```rust,editable
fn main() {
    let inventory = [3, 12, 47, 8, 47, 2];
    let mut i = 0;
    let position = loop {
        if inventory[i] == 47 {
            break i; // found it, hand back the index
        }
        i += 1;
    };
    println!("found at index {position}");
}
```

### A labeled loop to escape two levels at once
Searching a grid means nesting a loop inside a loop. Once you find your target, a label lets you break out of *both* in one line instead of juggling a "found" flag.

```rust,editable
fn main() {
    let grid = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    let target = 5;

    'search: for row in grid {
        for cell in row {
            if cell == target {
                println!("found {target}!");
                break 'search; // stop both loops at once
            }
        }
    }
}
```

### Draining a stack with `while let`
Popping items off a stack until it's empty is a perfect fit for `while let` — it keeps going as long as `pop()` still hands back `Some(value)`, and stops the instant it doesn't.

```rust,editable
fn main() {
    let mut undo_stack = vec!["type", "bold", "delete"];

    while let Some(action) = undo_stack.pop() {
        println!("undoing: {action}");
    }
    println!("nothing left to undo");
}
```

### An `if` chain that picks a grade band
When there are more than two outcomes, chain `else if` and let the whole thing evaluate to a value — no separate variable needs reassigning afterward.

```rust,editable
fn main() {
    let score = 84;

    let grade = if score >= 90 {
        "A"
    } else if score >= 80 {
        "B"
    } else if score >= 70 {
        "C"
    } else {
        "F"
    };
    println!("grade: {grade}");
}
```

### Numbering items with `enumerate`
Printing a numbered list means pairing each item with its position. `.iter().enumerate()` hands you both at once, so you never have to track an index by hand.

```rust,editable
fn main() {
    let playlist = ["Intro", "Chapter 1", "Chapter 2", "Outro"];

    for (i, track) in playlist.iter().enumerate() {
        println!("{}. {track}", i + 1);
    }
}
```

## Your turn

This program should print `pass` or `retry`, then count `1`, `2`, `3`. It has two problems. Fix it. Press ▶ Run.

```rust,editable
fn main() {
    let score = 55;

    let grade = if score {
        "pass"
    } else {
        "retry"
    };
    println!("{grade}");

    for i in 1..3 {
        println!("count {i}");
    }
}
```

<details><summary>Show solution</summary>

The `if` condition must be a real comparison, not a bare number. And `1..3` only reaches 2 — to include 3 use the inclusive range `1..=3`.

```rust,editable
fn main() {
    let score = 55;

    let grade = if score >= 70 {
        "pass"
    } else {
        "retry"
    };
    println!("{grade}");

    for i in 1..=3 {
        println!("count {i}");
    }
}
```

`score >= 70` gives a `bool`, and `1..=3` includes the final `3`.

</details>

## Quick check

<div class="quiz" data-topic="control-flow"></div>

## Remember this

- `if`/`while` conditions must be a real `bool` — Rust never treats numbers as true/false.
- `if` is an **expression**: it can produce a value, and all branches must share one type.
- `loop` runs forever until `break` (and `break value` can return a value); `while` runs while a condition holds; `for` walks a collection.
- Ranges: `1..4` excludes the end (`1,2,3`); `1..=4` includes it (`1,2,3,4`).
- Prefer `for item in collection` over manual indexing — it can't run off the end.

## Go deeper

- [Rust Book - Control Flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html) — Conditionals and loops.

**Next:**

- [Modules and crates](../language-basics/modules-and-crates.md)
- [Pattern matching](../language-basics/pattern-matching.md)

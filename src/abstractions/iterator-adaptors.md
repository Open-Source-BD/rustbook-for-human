# Iterator adaptors

> **Intermediate** · Abstractions

## What & why

An **adaptor** is a step in an iterator pipeline that describes a transformation — "double each item," "keep only the even ones," "pair each item with its index." Adaptors snap together like an assembly line, and (as the [previous lesson](../abstractions/iterator-basics.md) covered) none of them actually run anything: they build up a lazy plan until a **consumer** — `.collect()`, `.sum()`, a `for` loop — pulls values through the whole chain. This is the idiomatic replacement for most hand-rolled index loops, and once you know the vocabulary, chains like `.filter(...).map(...).collect()` read like a sentence instead of a puzzle.

## The idea, slowly

### `map`: transform each item

`.map()` replaces every item with the result of a closure. It doesn't touch anything until consumed:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3];
    let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();
    println!("{doubled:?}"); // [2, 4, 6]
}
```

### `filter`: keep only what passes a test

`.filter()` takes a closure returning `bool` and drops anything that returns `false`. The closure receives a *reference* to each item (`&Item`), so with `.iter()` on a `Vec<i32>` you're comparing `&i32`, which usually means dereferencing:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6];
    let evens: Vec<&i32> = nums.iter().filter(|n| **n % 2 == 0).collect();
    println!("{evens:?}"); // [2, 4, 6]
}
```

**What the compiler is thinking:** `.iter()` yields `&i32`. `.filter()`'s closure gets a reference to that item — `&&i32` — so `**n` peels back both layers to reach the actual number. Forget one `*` and you'll see `cannot compare &i32 with integer`; that error is your cue to dereference.

### `filter_map`: filter and transform in one step

When "keep it, but also transform it" describes what you want, `filter_map` does both in one pass. Its closure returns `Option<T>` — `Some(value)` keeps and unwraps, `None` drops:

```rust,editable
fn main() {
    let inputs = vec!["3", "seven", "12", "oops", "9"];

    let numbers: Vec<i32> = inputs
        .iter()
        .filter_map(|s| s.parse().ok()) // Ok -> Some(n), Err -> None
        .collect();

    println!("{numbers:?}"); // [3, 12, 9]
}
```

Without `filter_map` you'd need `.map(|s| s.parse())` followed by `.filter(...)` followed by unwrapping — one adaptor instead of three.

### `enumerate`: pair each item with its index

```rust,editable
fn main() {
    let letters = vec!['a', 'b', 'c'];
    for (i, letter) in letters.iter().enumerate() {
        println!("{i}: {letter}");
    }
    // 0: a
    // 1: b
    // 2: c
}
```

### `zip`: walk two iterators together

`.zip()` pairs items positionally from two iterators. It stops as soon as the **shorter** one runs out:

```rust,editable
fn main() {
    let names = vec!["Ferris", "Rusty"];
    let scores = vec![100, 87, 999]; // extra item, ignored

    let paired: Vec<(&&str, &i32)> = names.iter().zip(scores.iter()).collect();
    println!("{paired:?}"); // [("Ferris", 100), ("Rusty", 87)]
}
```

### `take` / `skip`: slice the stream by count

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6];

    let first_three: Vec<&i32> = nums.iter().take(3).collect();
    let after_three: Vec<&i32> = nums.iter().skip(3).collect();

    println!("{first_three:?}"); // [1, 2, 3]
    println!("{after_three:?}"); // [4, 5, 6]
}
```

### `fold`: build up one accumulated value

`.fold(initial, |accumulator, item| ...)` walks the whole iterator, carrying an accumulator through each step. `.sum()` is really just a specialized `fold`:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4];

    let total = nums.iter().fold(0, |acc, n| acc + n);
    let joined = nums.iter().fold(String::new(), |mut acc, n| {
        acc.push_str(&n.to_string());
        acc.push(' ');
        acc
    });

    println!("{total}");  // 10
    println!("{joined}"); // "1 2 3 4 "
}
```

### Consumers: `collect`, `sum`, `count`

These are what actually run a chain. `.collect()` is the most flexible — and the most likely to confuse the compiler, because it can build almost any collection. Tell it what to build either with a type annotation on the binding, or with turbofish syntax:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3, 4, 5];

    // Option A: type annotation on the binding
    let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();

    // Option B: turbofish on collect itself
    let tripled = nums.iter().map(|n| n * 3).collect::<Vec<i32>>();

    let total: i32 = nums.iter().sum();
    let how_many = nums.iter().filter(|&&n| n > 2).count();

    println!("{doubled:?} {tripled:?} sum={total} big={how_many}");
}
```

`.sum()` adds everything up (needs a type it can add into, usually inferred). `.count()` just tallies how many items came through, regardless of their value.

### A realistic pipeline

Here's a chain doing real work: parse a batch of raw scores, keep the valid passing ones, number them, and format a report — four adaptors plus a consumer:

```rust,editable
fn main() {
    let raw_scores = vec!["88", "42", "oops", "95", "59", "73"];

    let report: Vec<String> = raw_scores
        .iter()
        .filter_map(|s| s.parse::<i32>().ok()) // drop anything that isn't a number
        .filter(|&score| score >= 60)          // keep only passing scores
        .enumerate()                            // pair with a rank
        .map(|(i, score)| format!("#{}: {score}", i + 1)) // format for display
        .collect();

    for line in &report {
        println!("{line}");
    }
    // #1: 88
    // #2: 95
    // #3: 73
}
```

### When a plain `for` loop reads better

Adaptor chains are great until they aren't. Once a chain grows past roughly four or five steps, or mixes in side effects like I/O or logging, a `for` loop with a comment is often *more* readable — you can name intermediate values, step through it in a debugger one line at a time, and add a print statement without restructuring the whole chain. Prefer adaptors for straightforward transform/filter/collect work; reach for a `for` loop when the logic branches, has side effects, or the chain is fighting you.

## Common mistakes

- **A chain with no consumer at the end.** `nums.iter().map(...)` alone does nothing and the compiler warns `unused Map that must be used`. Add `.collect()`, `.sum()`, a `for` loop, or another consumer.
- **`collect()` without a target type.** The compiler doesn't know what to build — `type annotations needed`. Fix it with a type annotation (`let v: Vec<i32> = ...`) or turbofish (`.collect::<Vec<i32>>()`).
- **Forgetting `filter`/`map` closures receive references.** Over `.iter()`, `filter`'s closure parameter is a reference to a reference (`&&T`) — you'll often need `*n` or `**n` to compare or use the actual value.
- **Assuming `.zip()` pads the shorter iterator.** It doesn't — it silently truncates to the length of the shorter side. If lengths can differ and that matters, check lengths first or use a different strategy.
- **Chaining adaptors past the point of clarity.** A 6-step chain that took you five minutes to write will take a teammate (or future you) five minutes to read. A `for` loop with a comment is not a downgrade.

## More examples

### Sum only the valid donations
Real input is messy — some entries won't parse. `filter_map` lets you drop the bad ones and total the rest in a single pass, no intermediate `Vec` needed.

```rust,editable
fn main() {
    let donations = vec!["25", "n/a", "100", "-", "40"];

    let total: i32 = donations.iter().filter_map(|d| d.parse::<i32>().ok()).sum();

    println!("total raised: ${total}"); // 165
}
```

### Combine two shifts of readings with `zip`
`zip` isn't just for display pairs — pairing up two same-length datasets and combining them element-wise (like adding two shifts' sales) is a common use.

```rust,editable
fn main() {
    let morning = vec![12, 8, 15];
    let evening = vec![5, 10, 7];

    let daily_totals: Vec<i32> = morning.iter().zip(evening.iter()).map(|(m, e)| m + e).collect();

    println!("{:?}", daily_totals); // [17, 18, 22]
}
```

### Number the lines of a file
`.enumerate()` is exactly what a text editor or `cat -n` needs: pair each line with its position for display.

```rust,editable
fn main() {
    let lines = vec!["fn main() {", "    println!(\"hi\");", "}"];

    for (num, line) in lines.iter().enumerate() {
        println!("{:>3} | {}", num + 1, line);
    }
}
```

### Track the hottest reading with `fold`
`fold` isn't limited to sums — any "carry a running answer through the whole list" problem fits, like tracking a running maximum.

```rust,editable
fn main() {
    let temps = vec![68, 75, 71, 80, 66];

    let hottest = temps.iter().fold(i32::MIN, |max_so_far, &t| {
        if t > max_so_far { t } else { max_so_far }
    });

    println!("hottest reading: {hottest}"); // 80
}
```

### Split a sorted list at a threshold
Given data that's already sorted — like ages sorted ascending — `take_while`/`skip_while` split it at the first point a condition stops holding, without scanning the whole list twice by hand.

```rust,editable
fn main() {
    let ages = vec![12, 15, 17, 18, 22, 30, 45];

    let minors: Vec<&i32> = ages.iter().take_while(|&&age| age < 18).collect();
    let adults: Vec<&i32> = ages.iter().skip_while(|&&age| age < 18).collect();

    println!("minors: {:?}", minors); // [12, 15, 17]
    println!("adults: {:?}", adults); // [18, 22, 30, 45]
}
```

## Your turn

This should shout every name in uppercase and print the list. It doesn't compile.

```rust,editable
fn main() {
    let names = vec!["ferris", "rusty", "cargo"];

    let shout = names.iter().map(|s| s.to_uppercase()).collect();

    println!("{:?}", shout);
}
```

<details><summary>Show solution</summary>

`.collect()` can build many different collections, and here nothing tells it which one — the error is `type annotations needed`. Fix it with either a type annotation on `shout` or turbofish on `collect` itself:

```rust,editable
fn main() {
    let names = vec!["ferris", "rusty", "cargo"];

    let shout: Vec<String> = names.iter().map(|s| s.to_uppercase()).collect();
    // or equivalently:
    // let shout = names.iter().map(|s| s.to_uppercase()).collect::<Vec<String>>();

    println!("{:?}", shout); // ["FERRIS", "RUSTY", "CARGO"]
}
```

Either form tells `collect` what to build; without one of them, the compiler has no way to pick a type.

</details>

## Quick check

<div class="quiz" data-topic="iterator-adaptors"></div>

## Remember this

- Adaptors (`map`, `filter`, `filter_map`, `enumerate`, `zip`, `take`, `skip`, `fold`, ...) are **lazy** — chain as many as you like before paying any cost.
- Consumers (`collect`, `sum`, `count`, `fold`, `for_each`, `for`) are what actually pull values through and run the pipeline.
- `collect()` needs a target type — a type annotation on the binding or turbofish, `::<Vec<_>>()`.
- `zip` stops at the shorter of its two iterators; `filter`/`map` closures over `.iter()` receive references, so dereference to compare or use the value.
- More than ~4-5 chained adaptors, or any side effects, often read worse than a plain `for` loop with a comment — clarity beats cleverness.

## Go deeper

- [std::iter::Iterator docs](https://doc.rust-lang.org/std/iter/trait.Iterator.html) — the full list of adaptor and consumer methods.

**Next:**

- [Closures](../abstractions/closures.md)
- [Option and Result](../abstractions/result-and-option.md)

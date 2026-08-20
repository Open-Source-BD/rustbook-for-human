# Doc tests and benchmarks

> **Intermediate** · Runtime & ecosystem

## What & why

Two tools, bundled here because they're both about verifying claims instead of trusting them. A doc-test keeps your documentation's example code honest — it's compiled and *executed* by `cargo test`, so a stale or wrong example fails the build instead of silently rotting. A benchmark tells you whether a change actually made your code faster, backed by real measurement instead of a guess. `std::time::Instant` gives you a rough number for free; the `criterion` crate gives you a trustworthy one.

## The idea, slowly

### Doc-tests: examples that can't lie

A fenced code block inside a `///` doc comment isn't just for show — `cargo test` compiles and runs it as its own tiny test:

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// assert_eq!(my_crate::add(2, 2), 4);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

When you run `cargo test`, alongside your unit and integration tests you'll see a section like `Doc-tests my_crate ... test result: ok. 1 passed`. Each ` ``` ` block gets compiled as its own standalone program (Rust wraps it in an implicit `fn main` if you don't write one) and executed. If someone later changes `add` to subtract instead, this example now fails its assertion — `cargo test` catches the outdated documentation the same day, not months later when a user copy-pastes broken sample code.

Doc-tests carry the same visibility restriction as `tests/` integration tests, and for the same reason: the example is compiled as if it were external code calling `my_crate::add`, so it can only reach `pub` items.

### Hiding setup lines with `# `

Real examples often need setup code — imports, fixture construction — that would clutter the version a reader sees in rendered docs. Prefix a line with `# ` (a literal `#` and a space) to compile and run it, while hiding it from the documentation output:

```rust
/// ```
/// # fn helper_setup() -> i32 { 40 }
/// let n = helper_setup();
/// assert_eq!(n + 2, 42);
/// ```
pub fn placeholder() {}
```

`cargo doc` renders only:

```rust,editable
fn main() {
    let n = 40; // stands in for helper_setup(), shown for illustration
    assert_eq!(n + 2, 42);
    println!("n + 2 = {}", n + 2);
}
```

but `cargo test` still compiles and runs the hidden `# fn helper_setup() -> i32 { 40 }` line along with everything else. This is exactly how the standard library keeps its own doc examples both realistic and readable — imports and boilerplate get `# `-hidden, and the reader only sees the part that illustrates the point.

### `std::time::Instant` — rough manual timing

For a quick "is this obviously slow" sanity check, `Instant::now()` and `.elapsed()` need nothing beyond std:

```rust,editable
use std::time::Instant;

fn slow_sum(n: u64) -> u64 {
    (1..=n).sum()
}

fn main() {
    let start = Instant::now();
    let total = slow_sum(10_000_000);
    let elapsed = start.elapsed();

    println!("sum = {total}, took {elapsed:?}");
}
```

`Instant::now()` captures a monotonic timestamp — one that only ever moves forward, unaffected by the system clock being adjusted — and `.elapsed()` returns the `Duration` since that point. This is fine for eyeballing "does this take milliseconds or seconds," but a single measurement is noisy: CPU frequency scaling, other processes, and cold caches can all swing one run by 2x or more. Don't trust it to answer "did my optimization actually help."

### `criterion` — real statistically-sound benchmarking

Stable Rust has no built-in `cargo bench`. The original `#[bench]` attribute and `cargo bench` combo is part of the unstable `test` crate, nightly-only. For stable Rust, the ecosystem standard is the `criterion` crate: it runs your function thousands of times, applies statistical analysis to filter out noise, and — most usefully — compares each run against the *previous* run, reporting something like "4% faster, confidence interval doesn't include zero" instead of a single raw number.

```toml
# Cargo.toml
[dev-dependencies]
criterion = "0.5"

[[bench]]
name = "my_benchmark"
harness = false
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        n => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn bench_fibonacci(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);
```

```bash
cargo bench
```

`black_box` stops the compiler from being "too smart" — without it, the optimizer can see the result of `fibonacci(20)` is never used and delete the entire computation. `criterion_group!`/`criterion_main!` generate the `fn main` for this file, since it compiles as its own binary under `benches/`, the same way each `tests/*.rs` file compiles as its own crate.

## Common mistakes

- **Assuming a bare ` ``` ` fence in a doc comment is just illustrative.** It's compiled and run by `cargo test` by default. To show non-runnable or non-Rust code, use ` ```text ` or mark the block ` ```ignore `.
- **Doc-testing something private.** Doc-tests only see `pub` items, the same restriction as integration tests — there's nothing to test if the item isn't public.
- **Trusting one `Instant::now()`/`.elapsed()` measurement.** Background noise can swing a single run wildly. Run it several times and eyeball the spread, or better, reach for `criterion`.
- **Expecting `cargo bench` to work out of the box on stable.** The built-in `#[bench]`/`cargo bench` pair is nightly-only; on stable you need `criterion` (or a similar crate) with `harness = false`.
- **Forgetting `black_box`.** Without it, a hand-rolled micro-benchmark can have its entire body optimized away, since the compiler sees the result is never observably used — you end up benchmarking nothing.

## Your turn

This doc-test compiles fine but fails when `cargo test` actually runs it.

```rust
/// Doubles a number.
///
/// ```
/// assert_eq!(my_crate::double(3), 5);
/// ```
pub fn double(x: i32) -> i32 {
    x * 2
}
```

<details><summary>Show solution</summary>

`double(3)` is `6`, not `5` — the doc example asserts the wrong value. This is exactly the class of bug doc-tests exist to catch: a wrong example doesn't just mislead a reader, it fails `cargo test`.

```rust
/// Doubles a number.
///
/// ```
/// assert_eq!(my_crate::double(3), 6);
/// ```
pub fn double(x: i32) -> i32 {
    x * 2
}
```

Run `cargo test` and you'd see a `Doc-tests` section fail with the assertion panic, pointing at this exact doc comment — the same experience as any other failing test, just sourced from documentation instead of `tests/` or a `#[test]` function.

</details>

## Quick check

<div class="quiz" data-topic="doc-tests-and-benchmarks"></div>

## Remember this

- A fenced code block inside a `///` doc comment is compiled AND executed by `cargo test` — a broken example fails the build, not just the docs.
- Prefix a line with `# ` to compile-and-run it while hiding it from rendered documentation — ideal for imports and setup.
- `std::time::Instant::now()` + `.elapsed()` gives rough, noisy manual timing — good for "is this obviously too slow," not for real comparisons.
- Stable Rust has no built-in `cargo bench`; the `criterion` crate is the standard for statistically sound benchmarks.
- `criterion` compares each run to the last and reports whether a change is a real regression or just noise — and `black_box` keeps the optimizer from deleting what you're trying to measure.

## Go deeper

- [rustdoc book - Documentation tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html) — How doc-tests are collected and run.
- [Criterion.rs docs](https://docs.rs/criterion/) — The standard benchmarking crate.

**Next:**

- [File I/O](../runtime-and-ecosystem/file-io.md)

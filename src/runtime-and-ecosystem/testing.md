# Testing

> **Beginner** · Runtime & ecosystem

## What & why

A test is a tiny program that checks your real program still does what you think it does. Rust
bakes a test runner right into Cargo, so you never install anything — you just write a function,
tag it, and run `cargo test`. Tests are how you sleep at night after changing code.

## The idea, slowly

Imagine you wrote a function that adds two numbers. It works today. Next week you "improve" it and
quietly break it. Without a test, you find out when a user complains. With a test, you find out in
half a second, on your own machine, before anyone sees it.

A test in Rust is just a normal function with a special sticker on it. The sticker is `#[test]`.
When you run `cargo test`, Rust hunts down every function wearing that sticker, runs each one, and
reports which passed and which blew up.

### The three pieces of every test

1. **The sticker `#[test]`** — this is an *attribute*. It tells Cargo "this function is a test, run
   it when testing." A function without it is just a normal function and `cargo test` ignores it.
2. **An assertion** — a line that says "this had better be true." If it's true, nothing happens. If
   it's false, the test *panics* (crashes on purpose) and is marked as failed.
3. **A name** — pick a name that says what you're checking, like `adds_two_numbers`. When it fails,
   Rust prints that name, so a good name is half the debugging done.

The three assertions you'll use constantly:

- `assert!(condition)` — fails if the condition is `false`.
- `assert_eq!(a, b)` — fails if `a` is not equal to `b`. This is the workhorse.
- `assert_ne!(a, b)` — fails if `a` *is* equal to `b` (the "these must differ" check).

### Where tests live

For a small file, you put your tests at the bottom of the same file, inside a special module:

```rust
// This block goes in the SAME file as your code.
// Run it with:  cargo test

fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]            // "only compile this when testing"
mod tests {
    use super::*;       // pull in add() from the file above

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 2), 4);
    }

    #[test]
    fn adds_negatives() {
        assert_eq!(add(-1, -1), -2);
    }
}
```

That `#[cfg(test)]` line is the compiler thinking: *"Only build this module when the human runs
`cargo test`. In a real release build, pretend it isn't here."* So your tests add zero weight to
the shipped program.

The Playground can't run `cargo test`, but it *can* run a `main` that calls your function. So here
is the same `add` with a `main` you can press Run on, to prove the logic works:

```rust,editable
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    // A hand-rolled "test": if this is false, the program panics.
    assert_eq!(add(2, 2), 4);
    assert_eq!(add(-1, -1), -2);
    println!("All checks passed!");
}
```

Press Run. You'll see `All checks passed!`. Now change `a + b` to `a - b` and Run again — the
`assert_eq!` panics and prints the two numbers that didn't match. That panic is exactly what a
failing `cargo test` shows you.

### Running your tests

In a real project (not the Playground), you run:

```bash
cargo test
```

Rust builds your code, runs every `#[test]` function, and prints something like
`test result: ok. 2 passed; 0 failed`. To run only tests whose name contains "add":

```bash
cargo test add
```

### Unit tests vs integration tests

- **Unit tests** live next to your code (that `#[cfg(test)] mod tests` block). They can see private
  functions. Use them to check small pieces in isolation.
- **Integration tests** live in a separate top-level `tests/` folder. Each file there is compiled
  as its own little program that uses your crate *from the outside*, like a real user would. They
  only see your public API.

```bash
my_project/
├── src/
│   └── lib.rs        # your code + unit tests
└── tests/
    └── api.rs        # integration tests, one file = one test crate
```

Start with unit tests. Reach for integration tests when you want to check that the pieces work
together the way an outsider would use them.

### Testing that something *should* fail

Sometimes correct behavior *is* a panic (e.g. dividing by zero should blow up). Tag the test with
`#[should_panic]` and it passes only if the code panics:

```rust
#[test]
#[should_panic]
fn dividing_by_zero_panics() {
    let _ = 10 / 0;   // this panics — and that's what we want here
}
```

## Common mistakes

- **Forgetting `#[cfg(test)]` on the test module.** Without it your test code compiles into the real
  program, dragging in test-only imports and bloating the build. It still runs, but it's wrong hygiene.
- **A test with no assertion.** A `#[test]` function that never asserts anything *always passes* —
  it's checking nothing. Every test needs at least one `assert!`/`assert_eq!` or it's decoration.
- **Testing the language instead of your code.** `assert_eq!(2 + 2, 4)` tests Rust's `+`, not you.
  Test *your* functions and *your* logic.
- **Reusing state between tests.** Tests run in parallel by default and in any order. If two tests
  share a file or global, they can clobber each other. Keep each test self-contained.
- **Vague test names.** `test1` tells you nothing when it fails. `rejects_empty_username` tells you
  exactly what broke.

## Your turn

This program is meant to check that `double` doubles a number, but the assertion is wrong and it
won't even compile. Fix it so it prints `passed`.

```rust,editable
fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    assert_eq!(double(5), 25);
    println!("passed")
}
```

<details><summary>Show solution</summary>

Two problems. First, `double(5)` is `10`, not `25` — the expected value was wrong. Second, the
`println!` line was missing its semicolon.

```rust,editable
fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    assert_eq!(double(5), 10);   // 5 * 2 == 10
    println!("passed");
}
```

In a real project this same check would live in a `#[test]` function and you'd run it with
`cargo test`. The `assert_eq!` line is identical either way.

</details>

## Quick check

<div class="quiz" data-topic="testing"></div>

## Remember this

- A test is a function tagged with `#[test]`; run all of them with `cargo test`.
- `assert_eq!(a, b)` is the workhorse — it fails (panics) when `a != b`.
- Put unit tests in a `#[cfg(test)] mod tests` block in the same file; put integration tests in the
  top-level `tests/` folder.
- `#[cfg(test)]` means the test code is compiled only during testing, never in your shipped build.
- A test with no assertion always passes and checks nothing.

## Go deeper

- [Rust Book - Writing Automated Tests](https://doc.rust-lang.org/book/ch11-00-testing.html) — Unit and integration testing.

**Next:**

- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)
- [Clippy and formatting](../runtime-and-ecosystem/clippy-and-formatting.md)

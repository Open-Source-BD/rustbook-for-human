# Unit testing

> **Beginner** · Runtime & ecosystem

## What & why

A unit test is a small function that checks one piece of your code still behaves the way you expect — automatically, every time you run `cargo test`, instead of a human eyeballing output. Rust bakes the test runner right into Cargo: no framework to install, no config file to write. You tag a function `#[test]`, put an assertion inside it, and Cargo finds it, runs it, and tells you pass or fail. This lesson goes deep on the actual toolkit: the `assert!` family, `#[should_panic]`, why `#[cfg(test)]` matters, and the `cargo test` command itself.

## The idea, slowly

### The three pieces of every test

1. **The sticker `#[test]`** — an *attribute* that tells Cargo "this function is a test, run it when testing." A function without it is just a normal function; `cargo test` ignores it.
2. **An assertion** — a line that says "this had better be true." If it's true, nothing happens. If it's false, the test *panics* (crashes on purpose) and is marked failed.
3. **A name** — pick a name that describes what's being checked, like `rejects_empty_username`. When a test fails, Rust prints its name, so a good name is half the debugging done already.

### `assert!`, `assert_eq!`, `assert_ne!` — the assertion family

These three macros are how a test actually fails. All three panic (and so fail the test) when their condition isn't met:

```rust,editable
fn main() {
    let a = 2 + 2;

    assert!(a > 0);        // fails if the condition is false
    assert_eq!(a, 4);      // fails if the two sides are NOT equal
    assert_ne!(a, 5);      // fails if the two sides ARE equal

    println!("all three checks passed");
}
```

Press Run — it prints the success message. Now change `assert_eq!(a, 4)` to `assert_eq!(a, 5)` and Run again: the program panics and prints something like `assertion left == right failed`, along with both values. That's exactly the failure message `cargo test` would show you for a real test. Reach for `assert_eq!`/`assert_ne!` over plain `assert!(a == b)` whenever possible — on failure they print *both* sides, while `assert!` only tells you the condition was `false`.

### `#[cfg(test)] mod tests { use super::*; ... }` — tests that vanish from your shipped binary

In a real project, tests live in the same file as the code they check, inside a module wrapped in `#[cfg(test)]`:

```rust
// This lives in the SAME file as your code — e.g. src/lib.rs.
// Run it with: cargo test

fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]              // "only compile this module when testing"
mod tests {
    use super::*;         // pull add() from the parent module into scope

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

Two things happening here that beginners often skim past:

- **`#[cfg(test)]` is a compile-time switch, not a runtime one.** It's the compiler thinking: *"Only build this module at all when the human runs `cargo test`."* In a normal `cargo build` or `cargo build --release`, this module isn't just skipped — it isn't compiled in the first place. Your shipped binary is exactly as small as if the tests didn't exist. This also means a test module can freely use `dev-dependencies` (test-only crates listed under `[dev-dependencies]` in `Cargo.toml`) without those crates ever being linked into your real program.
- **`use super::*;` is what makes `add` visible.** `mod tests` is a child module, so it doesn't automatically see its parent's items. `super` means "the module I'm nested in," and `use super::*` imports everything from there — including private (non-`pub`) functions. This is the superpower unit tests have that integration tests (covered in the next lesson) don't: they can reach into your private internals because they're compiled as part of the *same* crate.

The Playground can't run `cargo test`, but it *can* run a `main` that calls your function directly, so you can still sanity-check the logic:

```rust,editable
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    assert_eq!(add(2, 2), 4);
    assert_eq!(add(-1, -1), -2);
    println!("both checks passed");
}
```

### `#[should_panic]` — when panicking IS the correct behavior

Sometimes the *correct* behavior of your code is to panic — indexing past the end of an array, for example. Tag the test `#[should_panic]` and it now passes only if the code inside panics:

```rust
#[cfg(test)]
mod tests {
    #[test]
    #[should_panic]
    fn reading_past_the_end_panics() {
        let numbers = [1, 2, 3];
        let _ = numbers[10]; // out of bounds — this panics, and that's the point
    }
}
```

Plain `#[should_panic]` passes on *any* panic, even one caused by an unrelated bug. Add `expected = "..."` to check the panic message actually contains the substring you meant:

```rust
#[cfg(test)]
mod tests {
    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn panics_with_the_right_message() {
        let numbers = [1, 2, 3];
        let _ = numbers[10];
    }
}
```

Now the test only passes if the panic message contains `"index out of bounds"`. If some *other* bug made the function panic with a different message, this version of the test correctly fails — the plain `#[should_panic]` version above would have passed by accident.

### `cargo test` basics

In a real project (not the Playground), running:

```bash
cargo test
```

builds your code, runs every `#[test]` function it finds, and prints a summary like `test result: ok. 2 passed; 0 failed`. To run only the tests whose name contains a substring — handy once you have hundreds of tests — pass it as an argument:

```bash
cargo test adds
```

That runs `adds_two_numbers` and `adds_negatives` (both contain `"adds"`) and skips everything else. The match is against the full test path (module path + function name), so `cargo test tests::adds` works too.

## Common mistakes

- **Forgetting `#[cfg(test)]` on the test module.** Without it, your test code compiles into every build, including release — and if that module uses a `dev-dependency` crate, your *normal* build can fail to compile, because dev-dependencies aren't linked outside test/bench/example builds.
- **A test with no assertion.** A `#[test]` function that never asserts anything *always passes* — it's checking nothing. Every real test needs at least one `assert!`/`assert_eq!`/`assert_ne!`.
- **`#[should_panic]` without `expected = "..."`.** It passes on *any* panic, so a test can accidentally pass for the wrong reason — the code panicked, just not from the bug you meant to check for.
- **Reading too much into the `assert_eq!` panic message.** It prints `left` and `right`, not `actual` and `expected` — Rust doesn't know which side you intended as which. The convention is `assert_eq!(actual, expected)`, but swapping the order still compiles and just flips which value shows as "left."
- **Reusing state between tests.** Tests run in parallel by default and in no guaranteed order. Two tests that share a file, an environment variable, or other global state can clobber each other and flake intermittently.

## More examples

### Validating a signup form's username
A signup form's username validator is a perfect candidate for tests — one function, several rules, and each rule deserves its own test so a failure points at exactly what broke.

```rust
fn is_valid_username(name: &str) -> bool {
    !name.is_empty() && name.len() <= 20 && name.chars().all(|c| c.is_alphanumeric() || c == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_a_normal_username() {
        assert!(is_valid_username("ferris_the_crab"));
    }

    #[test]
    fn rejects_an_empty_username() {
        assert!(!is_valid_username(""));
    }

    #[test]
    fn rejects_spaces() {
        assert!(!is_valid_username("has space"));
    }
}
```

### Calculating a shopping cart discount
A discount function has edge cases — no discount, a threshold just met, a threshold comfortably passed — and each one is a separate test instead of a mental note to check by hand.

```rust
fn discount_percent(cart_total: f64) -> f64 {
    if cart_total >= 100.0 {
        0.10
    } else if cart_total >= 50.0 {
        0.05
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_discount_below_fifty() {
        assert_eq!(discount_percent(20.0), 0.0);
    }

    #[test]
    fn five_percent_at_fifty() {
        assert_eq!(discount_percent(50.0), 0.05);
    }

    #[test]
    fn ten_percent_at_one_hundred() {
        assert_eq!(discount_percent(150.0), 0.10);
    }
}
```

### Parsing a config line, testing the error path
A config parser needs to fail loudly on bad input, not silently return garbage — testing the `Err` case is just as important as testing the happy path.

```rust
fn parse_port(line: &str) -> Result<u16, String> {
    line.trim()
        .parse::<u16>()
        .map_err(|_| format!("invalid port: {line}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_valid_port() {
        assert_eq!(parse_port("8080"), Ok(8080));
    }

    #[test]
    fn rejects_non_numeric_input() {
        assert!(parse_port("localhost").is_err());
    }
}
```

### Proving a stack panics on underflow
A stack-based structure that's documented to panic on underflow needs a test that proves it actually panics, not one that hopes it does.

```rust
struct FixedStack {
    items: Vec<i32>,
}

impl FixedStack {
    fn pop(&mut self) -> i32 {
        self.items.pop().expect("pop from an empty stack")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "pop from an empty stack")]
    fn popping_an_empty_stack_panics() {
        let mut stack = FixedStack { items: vec![] };
        stack.pop();
    }
}
```

## Your turn

This test module has two bugs: it won't compile, and even if it did, one test would fail for the wrong reason. Find both.

```rust
fn divide(a: i32, b: i32) -> i32 {
    a / b
}

#[cfg(test)]
mod tests {
    #[test]
    fn divides_evenly() {
        assert_eq!(divide(10, 2), 5);
    }

    #[test]
    #[should_panic(expected = "attempt to add with overflow")]
    fn dividing_by_zero_panics() {
        let _ = divide(10, 0);
    }
}
```

<details><summary>Show solution</summary>

Bug one: `mod tests` never brings `divide` into scope, so `divide(10, 2)` fails to compile with "cannot find function `divide` in this scope." It needs `use super::*;`.

Bug two: dividing by zero panics with the message `"attempt to divide by zero"`, not `"attempt to add with overflow"`. With the wrong `expected` string, `cargo test` reports the test as failed even though the code panicked correctly — the message just didn't match.

```rust
fn divide(a: i32, b: i32) -> i32 {
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;   // needed to see `divide` from the parent module

    #[test]
    fn divides_evenly() {
        assert_eq!(divide(10, 2), 5);
    }

    #[test]
    #[should_panic(expected = "attempt to divide by zero")]
    fn dividing_by_zero_panics() {
        let _ = divide(10, 0);
    }
}
```

`use super::*` is easy to forget because the compiler error ("cannot find function") looks like a typo, not a missing import. And `#[should_panic(expected = "...")]` is only useful if the string actually matches what the code panics with — when in doubt, panic it on purpose locally and copy the real message.

</details>

## Quick check

<div class="quiz" data-topic="unit-testing"></div>

## Remember this

- A test is a function tagged `#[test]`; run all of them with `cargo test`.
- `assert!`, `assert_eq!`, and `assert_ne!` panic — and so fail the test — on a false condition, unequal values, or equal values respectively.
- `#[cfg(test)] mod tests { use super::*; ... }` is the standard home for unit tests: `use super::*` gives access to private items, and `#[cfg(test)]` means the whole module is compiled only when testing, never in your shipped binary.
- `#[should_panic]` passes on any panic; `#[should_panic(expected = "...")]` also checks the panic message, so you know you're panicking for the right reason.
- `cargo test <substring>` runs only the tests whose name contains that substring.

## Go deeper

- [Rust Book - Writing Automated Tests](https://doc.rust-lang.org/book/ch11-00-testing.html) — Unit and integration testing.

**Next:**

- [Integration testing](../runtime-and-ecosystem/integration-testing.md)
- [Doc tests and benchmarks](../runtime-and-ecosystem/doc-tests-and-benchmarks.md)

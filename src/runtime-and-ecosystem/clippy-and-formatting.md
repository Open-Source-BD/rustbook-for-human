# Clippy and formatting

> **Beginner** · Runtime & ecosystem

## What & why

Clippy is Rust's **linter** — a tool that reads your code and points out things that are technically
correct but could be clearer, faster, or more idiomatic. Paired with `rustfmt` (the formatter),
it's like having a patient senior developer look over your shoulder for free. Run both regularly
and your Rust gets better without you memorizing every rule.

## The idea, slowly

### Compiler errors vs clippy warnings

You already know the compiler: it stops your program when something is *wrong*. Clippy is different
— it looks at code that already **compiles fine** and suggests how to make it *better*. The
compiler cares "does this work?"; clippy cares "is this the nice way to write it?"

For example, this compiles without complaint:

```rust
let x = 5;
if x == true {   // wait — x is a number, not a bool; this wouldn't compile,
}                // but clippy catches subtler style issues that DO compile
```

Clippy's specialty is the huge middle ground of code that works but isn't idiomatic. It knows
hundreds of common patterns and the cleaner Rust way to write each one.

### Running clippy

One command checks your whole project:

```bash
cargo clippy
```

You'll get warnings like this (imagine you wrote `if done == true`):

```text
warning: equality checks against true are unnecessary
 --> src/main.rs:3:8
  |
3 |     if done == true {
  |        ^^^^^^^^^^^^ help: try: `done`
```

Notice it doesn't just complain — it tells you the fix: `try: done`. Clippy almost always suggests
the better version, so you learn idiomatic Rust one warning at a time. Some fixes can even be
applied automatically with `cargo clippy --fix`.

### A few classic clippy catches

Once you've run clippy a few times, you start recognizing its favorite lessons:

- `if x == true` → just write `if x`.
- `x.len() == 0` → write `x.is_empty()` (clearer and sometimes faster).
- `return x;` on the last line of a function → drop the `return` and the `;`, just write `x`.
- Looping with an index to read a vector → use `for item in &vec` instead.
- Calling `.clone()` when a borrow would do → clippy nudges you toward the cheaper option.

None of these are *errors*. Your program runs fine either way. Clippy is teaching you to write Rust
the way experienced Rust programmers write it.

### rustfmt: the formatter half

Where clippy fixes *logic and style choices*, `rustfmt` fixes *layout* — spacing, indentation, line
breaks. One command reformats everything to the official standard:

```bash
cargo fmt
```

The two tools do different jobs and don't overlap: `cargo fmt` makes your code *look* standard,
`cargo clippy` makes your code *read* better. Run both.

### Make them part of your loop

The whole point is to run these *constantly*, not once a year. A healthy habit while working on any
project:

```bash
cargo fmt        # tidy the layout
cargo clippy     # catch style and correctness smells
cargo test       # make sure it still works
```

Many projects also run `cargo clippy` in CI (the automated checks on every pull request) and even
turn warnings into hard failures with `cargo clippy -- -D warnings`, so no un-idiomatic code sneaks
in. As a beginner you don't need that yet — just get in the habit of running clippy and reading
what it says.

## Common mistakes

- **Never running clippy at all.** You miss hundreds of small lessons and your code stays
  un-idiomatic longer than it needs to. It's one command — run it.
- **Ignoring warnings because "it compiles."** Compiling only means it *works*; clippy is about
  writing it *well*. The warnings are the free mentoring.
- **Blindly applying every suggestion without understanding it.** Clippy is usually right, but
  occasionally a lint doesn't fit your situation. Read the suggestion, understand *why*, then
  decide. You can silence a specific lint with `#[allow(clippy::lint_name)]` when you mean it.
- **Confusing clippy with rustfmt.** They're different tools: `cargo fmt` handles spacing and
  layout, `cargo clippy` handles style and logic smells. Running one doesn't do the other's job.
- **Fighting the formatter by hand.** Manually re-aligning code that `cargo fmt` will just rewrite
  wastes effort and muddies your diffs. Let the tool own layout.

## Your turn

Clippy can't run on the Playground, but this program shows two things it would flag. The code
*works* — press Run — but it isn't idiomatic. Rewrite it the way clippy would suggest.

```rust,editable
fn main() {
    let names = vec!["a", "b", "c"];

    if names.len() == 0 {
        println!("empty");
    }

    let mut i = 0;
    while i < names.len() {
        println!("{}", names[i]);
        i = i + 1;
    }
}
```

<details><summary>Show solution</summary>

```rust,editable
fn main() {
    let names = vec!["a", "b", "c"];

    if names.is_empty() {          // clearer than `.len() == 0`
        println!("empty");
    }

    for name in &names {           // iterate directly, no manual index
        println!("{name}");
    }
}
```

Why clippy prefers this:

- **`names.is_empty()`** instead of `names.len() == 0` — it says exactly what you mean and can be
  faster (no need to count everything just to compare with zero).
- **`for name in &names`** instead of a `while` loop with an index — it's shorter, can't go out of
  bounds, and is the standard Rust way to walk a collection. The manual `i = i + 1` counter is
  exactly the kind of thing clippy nudges you away from.

Both versions run identically. Clippy's job is helping you write the second one by habit.

</details>

## Quick check

<div class="quiz" data-topic="clippy-and-formatting"></div>

## Remember this

- The **compiler** stops code that's *wrong*; **clippy** improves code that already *works*.
- `cargo clippy` prints warnings *with suggested fixes* — it teaches idiomatic Rust one lint at a time.
- `cargo fmt` (formatter) handles layout/spacing; `cargo clippy` (linter) handles style and logic smells — different jobs.
- Classic catches: `x == true` → `x`, `.len() == 0` → `.is_empty()`, manual index loops → `for x in &v`.
- Run `cargo fmt`, `cargo clippy`, and `cargo test` as a regular loop, not once in a while.
- Read each suggestion to understand *why*; silence a lint deliberately with `#[allow(...)]` when it truly doesn't fit.

## Go deeper

- [Clippy](https://doc.rust-lang.org/clippy/) — The official linter guide.

**Next:**

- [Workspaces and crates](../runtime-and-ecosystem/workspaces-and-crates.md)

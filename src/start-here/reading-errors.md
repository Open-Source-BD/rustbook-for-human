# Reading compiler errors

> **Beginner** · Start here

## What & why

Rust's compiler says "no" a lot, especially while you're learning — and its error messages look like a wall of text with arrows and codes. Here's the secret: those messages are some of the most helpful in all of programming. They point at the exact spot, explain the problem in English, and often hand you the fix. Learning to *read* them calmly is the single highest-value skill for a beginner. Get this and you stop being stuck.

## The idea, slowly

When Rust rejects your code it's not scolding you. It caught a bug at your desk instead of letting it reach real users. Every error is the compiler saying: *"I found a problem here, and here's what I think is wrong."* Your job is just to read what it tells you, in order, without panicking.

### The anatomy of an error message

Let's take a small broken program. This one moves a value and then tries to use it again (don't worry about *why* that's illegal yet — this lesson is about reading the message, not ownership):

```rust
fn main() {
    let name = String::from("Rust");
    let other = name;             // value moves out of `name` here
    println!("{}", name);         // ...and we try to use `name` anyway
}
```

Rust refuses to build it and prints something like this:

```text
error[E0382]: borrow of moved value: `name`
 --> src/main.rs:4:20
  |
2 |     let name = String::from("Rust");
  |         ---- move occurs because `name` has type `String`, which does not implement the `Copy` trait
3 |     let other = name;
  |                 ---- value moved here
4 |     println!("{}", name);
  |                    ^^^^ value borrowed here after move
```

That looks like a lot. It isn't. Read it in five pieces, top to bottom:

- **`error[E0382]`** — the headline. `error` means the build failed. `E0382` is a searchable code; you can look it up (see below) for a fuller explanation.
- **`borrow of moved value: `name`` ** — the problem in plain English. Something used `name` after its value had moved away.
- **`--> src/main.rs:4:20`** — the location. File `src/main.rs`, line `4`, column `20`. This is where Rust wants you to look first.
- **The `|` diagram** — the compiler quotes your own code and draws under it. The underlines matter:
  - `----` marks related spots — here, where the value was *created* and where it *moved*.
  - `^^^^` points at the exact thing that's wrong — here, the `name` you tried to use too late.
- **The notes** — lines like *"move occurs because `name` has type `String`, which does not implement the `Copy` trait."* This is the compiler explaining *why*, in words. It's telling you `String` moves rather than copies.

Read like that, the message isn't a wall — it's a labeled diagram of exactly what happened.

### Read the FIRST error first

When you have several errors, Rust prints them all. **Start with the top one and fix only that.** Often one real mistake — a missing bracket, a wrong name — confuses the compiler and produces a cascade of follow-on errors that aren't really separate problems. Fix the first, rebuild, and watch a pile of the others vanish. Chasing the last error first usually wastes your time.

### When the compiler hands you the fix

Rust frequently suggests an actual repair, marked `help:`. For example, a missing `!` on `println`:

```text
error[E0423]: expected function, found macro `println`
 --> src/main.rs:2:5
  |
2 |     println("hi");
  |     ^^^^^^^ not a function
  |
help: use `!` to invoke the macro
  |
2 |     println!("hi");
  |            +
```

See that `help:` line and the `+` showing where to add the `!`? When Rust suggests a change, **try it first**, before you start guessing. It's right far more often than not. The fixed program compiles:

```rust,editable
fn main() {
    println!("hi");
}
```

### `warning` is not `error`

You'll also see yellow **`warning`** messages. A warning means *"this compiled and will run, but something looks off"* — like a variable you created and never used. Your program still works. Warnings are worth cleaning up, but they won't stop you. Only `error` blocks the build. Don't confuse "I have warnings" with "it's broken."

### Look up a code when you're stuck

Every `error[EXXXX]` code is documented. In the terminal:

```bash
rustc --explain E0382
```

That prints a longer, example-filled explanation of that specific error. There's also an online [error index](https://doc.rust-lang.org/error_codes/error-index.html). Use these when the inline message isn't enough — you're not the first person to hit that code.

## Common mistakes

- **Panicking at the size of the message and not reading it.** The text *looks* dense, so beginners skim or give up. But it's structured — headline, location, diagram, why. Read it slowly, top to bottom, and it's usually clear. The message almost always contains your answer.
- **Fixing the last error first.** One early mistake often spawns several later errors. If you fix the bottom one, you may be "fixing" a symptom of something above it. Always start at the first error and rebuild.
- **Ignoring the `help:` suggestion and guessing instead.** Rust's suggested fix is right most of the time. Trying random changes before reading `help:` turns a 10-second fix into a 10-minute fight.
- **Treating warnings like errors (or ignoring them forever).** A `warning` still compiles and runs; don't think your program is broken because you see yellow. But don't let them pile up unread either — some warnings are pointing at real mistakes.
- **Never using `rustc --explain`.** When an inline message baffles you, the code has a fuller write-up one command away. Beginners forget it exists.

## More examples

### A type mismatch
You read a value from somewhere text-based — a web form, a config file, a CLI flag — and forget it arrives as text, not a number. Rust's `error[E0308]: mismatched types` names the exact line and says plainly which type it expected.

```rust
fn main() {
    let count: i32 = "5"; // ERROR: expected `i32`, found `&str`
    println!("count = {count}");
}
```

### A missing semicolon that blames the next line
Drop a `;` after a `let`, and the error often points at the line *after* your mistake instead of the mistake itself — `expected ;, found keyword let`, aimed at line 3 even though line 2 is where the semicolon is missing.

```rust
fn main() {
    let price = 12
    let tax = 2;
    let total = price + tax;
    println!("total = {total}");
}
```

### A borrow-checker error
You grab a reference into a vector, then try to grow the vector while that reference is still alive — something a language like C++ would quietly let you do, and quietly corrupt later.

```rust
fn main() {
    let mut scores = vec![1, 2, 3];
    let first = &scores[0];
    scores.push(4); // ERROR: cannot borrow `scores` as mutable...
    println!("{first}");
}
```

### Wrong number of arguments
You add a parameter to a function mid-refactor and forget to update a call site somewhere else in the file — `error[E0061]` names the function and even suggests where to add the missing argument.

```rust
fn greet(name: &str, times: u32) {
    for _ in 0..times {
        println!("Hello, {name}!");
    }
}

fn main() {
    greet("Sam"); // ERROR: this function takes 2 arguments but 1 was supplied
}
```

### An unused variable — a warning, not an error
Quick prototyping often leaves a variable you set up but never got around to using — the program still compiles and runs, it just gets a friendly nudge.

```rust,editable
fn main() {
    let total = 42; // never used below -- Rust warns, but still runs
    println!("Program finished.");
}
```

## Your turn

This program is broken, and if you press Run the compiler will complain. **Read its message first** — find the location it points to and the `^^^^` underline — then fix the code so it prints `Score: 10`.

```rust,editable
fn main() {
    let score = 10
    println("Score: {}", score)
}
```

<details><summary>Show solution</summary>

The compiler points at two things: a missing `;` after `let score = 10`, and `println` used as a function instead of the `println!` macro (plus its own missing `;`). Read top to bottom, fix the first error, and the rest fall into place:

```rust,editable
fn main() {
    let score = 10;
    println!("Score: {}", score);
}
```

Notice how the fixes were exactly what the message described — the `;` it "expected" and the `!` its `help:` line suggested.

</details>

## Quick check

<div class="quiz" data-topic="reading-errors"></div>

## Remember this

- Error messages are structured: **code → plain-English problem → location → code diagram → why.** Read them top to bottom.
- The `-->` line is the location (`file:line:column`); `^^^^` points at the exact culprit.
- **Fix the first error first**, then rebuild — many later errors disappear on their own.
- When you see a `help:` suggestion, try it before guessing; it's usually right.
- A `warning` still compiles and runs; only `error` stops the build.
- Stuck on a code? Run `rustc --explain E0382` (with your code) for a fuller explanation.

## Go deeper

- [Rustc error index](https://doc.rust-lang.org/error_codes/error-index.html) — Search specific compiler errors.
- [Rust Book - Common Programming Concepts](https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html) — Where many first errors appear.

**Next:**

- [Variables and mutability](../language-basics/variables-and-mutability.md)
- [Ownership](../ownership/ownership.md)

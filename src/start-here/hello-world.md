# Hello, world

> **Beginner** · Start here

## What & why

Every language starts with a program that prints one line. In Rust that program teaches you the
three pieces you'll type in *every* program you ever write: an entry point, a macro call, and a
statement. Get comfortable with these now and the rest of Rust has a lot less to be scared of.

## The idea, slowly

Here is the whole program:

```rust,editable
fn main() {
    println!("Hello, world!");
}
```

Let's read it the way the compiler does, one piece at a time.

- **`fn main()`** — `fn` means "I'm defining a function." `main` is a special name: when you run
  a Rust program, it starts at `main`. Always. If `main` isn't there, there's nothing to run.
  Think of `main` as the front door of your program — the computer walks in through it.
- **`()`** — the empty parentheses mean "this function takes no inputs." Later your functions will
  take inputs and those go between the parentheses.
- **`{ ... }`** — the curly braces hold the *body*: the list of things to do. Everything between
  `{` and `}` runs top to bottom.
- **`println!("Hello, world!")`** — this prints a line of text. `println` = "print line" (it adds
  a newline at the end for you). The text you want to print goes in the quotes.
- **The `!`** — this is the surprising one. `println!` has an exclamation mark because it's a
  **macro**, not a normal function. You don't need to know how macros work yet. For now just
  remember: **if you see `!` after a name, it's a macro, and `println!` is the one you'll use
  constantly.** Forgetting the `!` is the #1 beginner error here.
- **The `;`** — the semicolon ends the statement. It's how you tell Rust "this instruction is
  finished, move to the next one." Most lines inside `{ }` end with `;`.

That's it. Front door (`main`), do one thing (`println!`), end the instruction (`;`).

### Print more than one line

Each `println!` is its own instruction, running in order:

```rust,editable
fn main() {
    println!("Learning Rust.");
    println!("One line at a time.");
}
```

### Print a value with `{}`

The curly braces `{}` inside the text are a **placeholder** — Rust fills them in:

```rust,editable
fn main() {
    let day = 3;
    println!("Day {} of learning Rust", day);
    // You can also name the value directly inside the braces:
    let name = "Shamirul";
    println!("Keep going, {name}!");
}
```

Don't worry about `let` yet (that's the next lesson). Just notice that `{}` is where a value gets
dropped into your text.

## Common mistakes

- **Forgetting the `!`.** `println("hi")` is wrong; `println!("hi")` is right. The compiler will
  say it can't find a function named `println` — that's your hint you dropped the `!`.
- **Forgetting the `;`.** Rust will complain it "expected `;`". Add it at the end of the line.
- **Mismatched quotes or braces.** Every `"` needs a closing `"`, every `{` a closing `}`. The
  compiler points at the line where it got confused.

## More examples

### Printing to stderr for diagnostics
Real programs often split their output: the actual result goes to one stream, debug notes go to another, so a script piping your output doesn't get polluted with noise.

```rust,editable
fn main() {
    println!("Result: 42");
    eprintln!("[debug] computed via loop, took 3 steps");
}
```

### A greeting with a hardcoded name
Setup scripts and installers love a little personal touch, even before you've learned how to take real input from a user.

```rust,editable
fn main() {
    let user = "Alice";
    println!("Welcome aboard, {user}! Let's get you set up.");
}
```

### Formatting a receipt line
A `{}` placeholder isn't limited to printing a value back out untouched — you can drop in the result of a calculation too.

```rust,editable
fn main() {
    let item = "coffee";
    let price = 4;
    let qty = 2;
    println!("{qty}x {item} = ${}", price * qty);
}
```

### A startup banner
Command-line tools often print a little header before they get to work, so you know what's running and that it actually started.

```rust,editable
fn main() {
    println!("=================================");
    println!(" MyApp v1.0 -- starting up");
    println!("=================================");
}
```

### A quick unit conversion
`println!` doubles as a fine one-off calculator display, long before you've learned functions or real user input.

```rust,editable
fn main() {
    let celsius = 24;
    let fahrenheit = celsius * 9 / 5 + 32;
    println!("{celsius}C is {fahrenheit}F");
}
```

## Your turn

This program is broken in **two** ways. Fix it so it prints `Hello, Rust!` on its own line. Press
▶ Run to check.

```rust,editable
fn main() {
    println("Hello, Rust!")
}
```

<details><summary>Show solution</summary>

Two fixes: add the `!` to make it the `println!` macro, and add the `;` to end the statement.

```rust,editable
fn main() {
    println!("Hello, Rust!");
}
```

</details>

## Quick check

<div class="quiz" data-topic="hello-world"></div>

## Remember this

- Executables start at `fn main()` — it's the front door.
- `!` means macro. `println!` is a macro, so it always has the `!`.
- Statements end with `;`.
- `{}` inside a string is a placeholder that gets filled with a value.

## Go deeper

- [The Rust Book - Hello, world](https://doc.rust-lang.org/book/ch01-02-hello-world.html) — The canonical first program.
- [Rust by Example - Hello World](https://doc.rust-lang.org/rust-by-example/hello.html) — A second view of the same concept.

**Next:**

- [Variables and mutability](../language-basics/variables-and-mutability.md)
- [Functions](../language-basics/functions.md)

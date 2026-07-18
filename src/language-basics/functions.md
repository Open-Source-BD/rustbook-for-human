# Functions

> **Beginner** · Language basics

## What & why

A function is a named chunk of code you can run whenever you want, as many times as you want. Instead of copying the same ten lines everywhere, you put them in a function and call it by name. You've already met one function on day one: `main`. Now you'll learn to write your own — to give them inputs and get answers back.

## The idea, slowly

### The shape of a function

Here's a function that adds two numbers:

```rust,editable
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let sum = add(2, 3);
    println!("sum is {sum}"); // 5
}
```

Let's read the first line the way the compiler does:

- **`fn add`** — `fn` means "I'm defining a function," and `add` is its name.
- **`(a: i32, b: i32)`** — these are the **parameters**: the inputs. Each one needs a name *and* a type. `a` is an `i32`, `b` is an `i32`. Rust never guesses parameter types — you must always write them.
- **`-> i32`** — the arrow says "this function hands back an `i32` when it's done." This is the **return type**. If a function returns nothing, you leave the arrow off entirely.
- **`{ a + b }`** — the body. This function's whole job is to compute `a + b`.

Then in `main`, `add(2, 3)` **calls** the function: it runs `add` with `a = 2` and `b = 3`, and the answer comes back and lands in `sum`.

### The big idea: expressions vs statements

This is the part that trips up newcomers, so go slow. Rust code is made of two things:

- A **statement** *does* something but produces no value. `let x = 5;` is a statement.
- An **expression** *evaluates to* a value. `2 + 3` is an expression — it becomes `5`.

Look again at the body of `add`:

```rust,editable
fn add(a: i32, b: i32) -> i32 {
    a + b       // no semicolon! this is the return value
}

fn main() {
    println!("{}", add(10, 20));
}
```

The last line is `a + b` with **no semicolon**. In Rust, the final expression in a function body — written without a semicolon — is what the function returns. There's no `return` keyword needed. The compiler thinks: "the last thing here is a value, and the function promised to return a value, so that's the answer."

Now watch what a single semicolon does:

```rust,editable
fn add(a: i32, b: i32) -> i32 {
    a + b;      // ERROR: the ; throws the value away
}

fn main() {
    println!("{}", add(1, 2));
}
```

Press Run. The error says something like *"mismatched types: expected `i32`, found `()`."* That `()` (called "unit") means "nothing." By adding `;` you turned the expression `a + b` into a statement — you computed the sum and then *threw it away*. The function now returns nothing, but you promised an `i32`. **A trailing semicolon is the number-one function bug in Rust.**

### You can use `return` too

The no-semicolon style is the idiomatic Rust way, but `return` also works and is required when you want to leave *early*:

```rust,editable
fn describe(n: i32) -> &'static str {
    if n < 0 {
        return "negative"; // leave early
    }
    "zero or positive"      // last expression, no semicolon
}

fn main() {
    println!("{}", describe(-4));
    println!("{}", describe(7));
}
```

Notice both styles appear here: an early `return` (with a semicolon, because it's a statement) and the final expression without one. Both are hand back a value.

### Functions that return nothing

If a function just *does* something (like printing) and has no answer to give, skip the arrow:

```rust,editable
fn greet(name: &str) {
    println!("Hello, {name}!");   // just does a thing; returns nothing
}

fn main() {
    greet("Shaon");
    greet("Rust");
}
```

`&str` is the type for a borrowed piece of text — you'll see it constantly. For now just read it as "some text."

### Order doesn't matter

Unlike some languages, you can call a function that's defined *below* where you call it. Rust reads the whole file before deciding, so `main` can call `add` even if `add` is written afterward. Arrange your code however reads best.

## Common mistakes

- **The trailing semicolon on the return value.** `fn f() -> i32 { x; }` returns `()`, not `x`. The compiler says *"expected `i32`, found `()`."* Remove the semicolon from the last line. This bites nearly everyone at first.
- **Forgetting parameter types.** `fn add(a, b)` won't compile. Every parameter needs a type: `fn add(a: i32, b: i32)`. Rust never infers these.
- **Forgetting the return type.** If your function hands back a value, you must declare it with `-> Type`. Without the arrow, Rust assumes the function returns nothing and complains when the body produces a value.
- **Mismatched return type.** If you say `-> i32` but the last expression is text, you get "mismatched types." The declared type and the actual returned value must agree.
- **Adding `;` after an `if`-expression you meant to return.** `fn f() -> i32 { if c { 1 } else { 2 }; }` throws the value away. Drop the final `;`.

## Your turn

This function is meant to double a number and return it, but it doesn't compile. Two things are wrong. Fix it. Press ▶ Run.

```rust,editable
fn double(n) {
    n * 2;
}

fn main() {
    let result = double(21);
    println!("double is {result}");
}
```

<details><summary>Show solution</summary>

The parameter needs a type, the function needs a return type, and the last line must lose its semicolon so the value is actually returned.

```rust,editable
fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    let result = double(21);
    println!("double is {result}"); // 42
}
```

`n: i32` gives the input a type, `-> i32` promises an answer, and removing the `;` after `n * 2` makes that the return value.

</details>

## Quick check

<div class="quiz" data-topic="functions"></div>

## Remember this

- Define a function with `fn name(params) -> ReturnType { body }`.
- Every parameter needs a type; Rust never guesses them.
- The **last expression with no semicolon** is the return value — no `return` keyword needed.
- Adding a `;` to that last line throws the value away and returns `()` (nothing) — a very common error.
- Use `return` to leave a function early; leave off `-> Type` when a function returns nothing.

## Go deeper

- [Rust Book - Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html) — Basic function syntax.

**Next:**

- [Control flow](../language-basics/control-flow.md)
- [Methods and impl blocks](../language-basics/methods-and-impls.md)

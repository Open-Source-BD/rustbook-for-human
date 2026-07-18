# Macros

> **Advanced** · Runtime & ecosystem

## What & why

A macro is code that writes code. Before your program is even type-checked, macros expand into
ordinary Rust that the compiler then compiles as if you'd typed it by hand. You've been using one
since lesson one: `println!`. The `!` is the giveaway — it's a macro. This lesson demystifies what
that `!` actually means and shows you how to write a simple macro of your own.

## The idea, slowly

Why does Rust need macros at all when it has functions? Because functions have limits a macro
doesn't:

- A function takes a **fixed** number of arguments. `println!` takes *any* number (`println!("{}")`
  vs `println!("{} {} {}", a, b, c)`). Only a macro can do that.
- A function's arguments are **values**. A macro's arguments are **pieces of code** (tokens), so a
  macro can generate whole `struct`s, `impl` blocks, or match arms.

Think of a function as a machine that processes *ingredients* at runtime, and a macro as a machine
that stamps out *source code* at compile time. By the time your program runs, the macro is long gone
— only the code it produced remains.

### The `!` you already know

Every time you write `println!`, `vec!`, `assert_eq!`, or `format!`, you're calling a macro. The `!`
distinguishes a macro call from a function call. That's why forgetting the `!` on `println` gives you
"cannot find function `println`" — there is no such *function*, only the macro.

```rust,editable
fn main() {
    let list = vec![1, 2, 3];        // vec! macro builds a Vec for you
    let msg = format!("list has {} items", list.len());  // format! macro
    println!("{}", msg);             // println! macro
}
```

`vec![1, 2, 3]` expands into code that makes a new `Vec` and pushes three items. You could write that
by hand every time; the macro saves you from it.

### Writing your own with `macro_rules!`

The everyday way to make a macro is `macro_rules!`. It works by *pattern matching* on the code you
pass in. Here's the smallest useful one:

```rust,editable
macro_rules! say {
    ($msg:expr) => {
        println!("{}", $msg);
    };
}

fn main() {
    say!("hello from a macro");
    say!(1 + 2);   // works with any expression, not just strings
}
```

Read the macro like this:

- `($msg:expr)` is the **pattern**. It means "capture one expression and call it `$msg`." The
  `:expr` part is a *fragment specifier* — it says what kind of code to expect (here, an expression).
- The part after `=>` is the **expansion** — the code to generate, with `$msg` substituted in.

So `say!(1 + 2)` expands, at compile time, into `println!("{}", 1 + 2);`. The compiler literally sees
that final line.

### Matching a variable number of arguments

The real power is repetition. This macro accepts *any* number of expressions and prints each:

```rust,editable
macro_rules! print_all {
    // $( ... ),*  means "zero or more of this pattern, separated by commas"
    ( $( $item:expr ),* ) => {
        $(
            println!("- {}", $item);
        )*
    };
}

fn main() {
    print_all!("apples", "bananas", "cherries");
    println!("---");
    print_all!(1, 2, 3, 4);
}
```

The `$( ... ),*` in the pattern says "match a comma-separated list." The matching `$( ... )*` in the
expansion says "repeat this generated code once per captured item." That's exactly how `println!`
and `vec!` accept any number of arguments — now you can too.

### Fragment specifiers, briefly

After the `$name:` you tell the macro what kind of code to accept. The common ones:

- `:expr` — an expression (`1 + 2`, `foo()`, `"hi"`)
- `:ident` — an identifier / name (`counter`, `my_func`)
- `:ty` — a type (`i32`, `String`)
- `:stmt`, `:block`, `:pat`, `:literal` — statements, blocks, patterns, literals

You don't need to memorize these — `:expr` covers most beginner cases. Just know they exist so error
messages like "expected expression" make sense.

### Declarative vs procedural macros

There are two families:

- **Declarative macros** — the `macro_rules!` kind above. Pattern-match code in, code out. This is
  what you'll write 95% of the time.
- **Procedural macros** — actual Rust programs that receive your code as a stream of tokens and can
  transform it however they like. They live in their own crate and are more advanced. The famous
  `#[derive(Debug)]` and Serde's `#[derive(Serialize)]` are procedural (derive) macros. You'll *use*
  these constantly but rarely *write* one early on.

### When NOT to reach for a macro

Macros are seductive and easy to overuse. A macro is harder to read, harder to debug, and IDE tools
understand it less well than a plain function. Rule of thumb: **if a normal function or generic can
do the job, use that.** Reach for a macro only when you truly need a variable argument count, or need
to generate code (like new types or trait implementations) that a function simply cannot produce.

## Common mistakes

- **Forgetting the `!` when calling a macro.** `vec[1,2,3]` or `println("hi")` fail because the
  compiler looks for a *function* of that name and doesn't find one. Macros always need the `!`.
- **Confusing macro arguments with values.** A macro receives *code*, not evaluated values. Side
  effects and evaluation happen wherever the expanded code puts them, which can surprise you (e.g. an
  argument used twice in the expansion runs twice).
- **Reaching for a macro when a function would do.** Macros hurt readability and tooling. Use them
  only for things functions can't do (variadic arguments, code generation).
- **Getting the repetition syntax slightly wrong.** In `$( ... ),*` the separator (`,`) and the `*`
  must both be present and match between the pattern and the expansion, or you'll get cryptic errors.
- **Expecting great error messages.** When a macro expands into broken code, the compiler points at
  the expansion, which can be confusing. Keep macros small so the generated code is easy to picture.

## Your turn

This macro is meant to build a greeting, but it won't compile — the pattern is missing something it
needs to capture the name. Fix it so `greet!("Ada")` prints `Hello, Ada!`.

```rust,editable
macro_rules! greet {
    () => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    greet!("Ada");
}
```

<details><summary>Show solution</summary>

The expansion uses `$name`, but the pattern `()` captures nothing — there's no `$name` to
substitute, and it's being called with an argument the empty pattern doesn't accept. Add a pattern
that captures one expression and calls it `$name`:

```rust,editable
macro_rules! greet {
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    greet!("Ada");
    greet!("Grace");   // works for any expression
}
```

Now `($name:expr)` captures the argument, and `$name` in the expansion gets replaced with it. At
compile time `greet!("Ada")` becomes `println!("Hello, {}!", "Ada");`.

</details>

## Quick check

<div class="quiz" data-topic="macros"></div>

## Remember this

- A macro writes code at compile time; the `!` (as in `println!`, `vec!`) marks a macro call.
- `macro_rules!` makes **declarative** macros by pattern-matching code: `($x:expr) => { ... }`.
- `$( ... ),*` matches and generates a repeated, comma-separated list — that's how variadic macros work.
- Procedural macros (like `#[derive(Debug)]`) are advanced code-generators you mostly *use*, not write.
- Prefer a plain function or generic; use a macro only when a function genuinely can't do the job.

## Go deeper

- [Rust Reference - Macros](https://doc.rust-lang.org/reference/macros.html) — Language reference material.

**Next:**

- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)
- [Unsafe Rust](../runtime-and-ecosystem/unsafe-rust.md)

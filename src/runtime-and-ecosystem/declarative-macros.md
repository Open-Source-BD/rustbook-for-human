# Declarative macros (macro_rules!)

> **Advanced** · Runtime & ecosystem

## What & why

A macro is code that writes code. You've used one since your very first program — `println!`. The `!` is the giveaway: it's not a function, it's a macro, and macros work completely differently from functions. A function takes *values* and runs at runtime. A macro takes *pieces of your source code* and runs at compile time, splicing in new Rust before the compiler has even checked that any of it makes sense. `macro_rules!` is how you write your own. It works by pattern-matching the tokens you pass in — literally the words and symbols, not their meaning — and stamping out expanded code in their place.

## The idea, slowly

### It's tokens in, code out — and it happens *before* type checking

Think of `macro_rules!` as a find-and-replace that runs on your source code, not on values. The compiler expands every macro call into plain Rust first, and only *after* that expansion does it start checking types. This has a real consequence: a macro can't catch a type error, because it never looks at types — it only ever sees tokens (words, punctuation, brackets).

```rust,editable
macro_rules! add {
    ($a:expr, $b:expr) => {
        $a + $b
    };
}

fn main() {
    let sum = add!(1, 2); // expands to: 1 + 2
    println!("{}", sum);

    // let bad = add!(1, "two"); // would expand to: 1 + "two"
    // That's a normal type error ("cannot add `{integer}` to `&str`"),
    // and it only shows up AFTER expansion — the macro itself has no idea
    // what a type even is. It just glued tokens together.
}
```

Uncomment that last block yourself and run it — the error you get is exactly the error you'd get from typing `1 + "two"` by hand. That's the proof: `add!` never validated anything, it just handed the compiler new source code.

### Anatomy of a rule: pattern `=>` expansion

Here's the smallest useful macro:

```rust,editable
macro_rules! say {
    ($msg:expr) => {
        println!("{}", $msg);
    };
}

fn main() {
    say!("hello from a macro");
    say!(1 + 2); // works with any expression, not just strings
}
```

Read it in two halves:

- **`($msg:expr)`** — the *pattern*. "Capture one expression from the call and name it `$msg`."
- **everything after `=>`** — the *expansion*. The code to generate, with `$msg` substituted wherever it appears.

`say!(1 + 2)` expands, at compile time, into `println!("{}", 1 + 2);`. That's the literal line the compiler goes on to build.

### Fragment specifiers: what kind of code can `$name` capture

The `:expr` in `$msg:expr` is a **fragment specifier** — it tells the macro what shape of code is allowed to fill that slot. The ones you'll meet constantly:

- **`expr`** — an expression: `1 + 2`, `foo()`, `"hi"`
- **`ident`** — a bare name: `counter`, `my_func`
- **`ty`** — a type: `i32`, `String`, `Vec<u8>`
- **`block`** — a `{ ... }` block

You can mix several in one pattern, with literal tokens (like `:`) required between them:

```rust,editable
macro_rules! let_zero {
    ($name:ident : $ty:ty) => {
        let $name: $ty = Default::default();
    };
}

fn main() {
    let_zero!(count: i32);
    let_zero!(label: String);
    println!("{} {:?}", count, label);
}
```

`$name` only accepts a bare identifier (`count`, not `1 + 1`), and `$ty` only accepts a type (`i32`, not a value). If you pass the wrong shape — say, an expression where the macro wants a type — you get a macro-matching error, not a type error, because matching happens before types exist to the compiler at all.

### The tokens aren't evaluated — they're just copied

Because a macro receives *code*, not a *value*, using `$x` more than once in the expansion runs that code more than once:

```rust,editable
macro_rules! twice {
    ($x:expr) => {
        { $x; $x }
    };
}

fn main() {
    let mut n = 0;
    twice!(n += 1); // expands to: { n += 1; n += 1; }
    println!("{}", n); // 2, not 1
}
```

If `$x` were an evaluated *value* being reused, `n += 1` would only have run once. But `twice!` doesn't get a value — it gets the tokens `n += 1` and pastes them in twice. This is one of the most common surprises when you start writing macros: think "copy-paste of code," never "capture of a result."

### Repetition: matching "as many as you like"

Real variadic macros — the kind that take any number of arguments, like `vec!` and `println!` — use repetition. Start with a macro that only handles one item:

```rust,editable
macro_rules! one_item_vec {
    ($x:expr) => {{
        let mut v = Vec::new();
        v.push($x);
        v
    }};
}

fn main() {
    let v = one_item_vec!(42);
    println!("{:?}", v);
}
```

(The double braces `{{ }}` aren't a typo — the outer pair is Rust's block-expression syntax so the expansion is a single expression; the inner pair is the block's contents.)

Now generalize it to any number of items with `$( ... ),*`:

```rust,editable
macro_rules! my_vec {
    ( $( $x:expr ),* ) => {{
        let mut v = Vec::new();
        $( v.push($x); )*
        v
    }};
}

fn main() {
    let v = my_vec![1, 2, 3];
    println!("{:?}", v);

    let words = my_vec!["a", "b", "c"];
    println!("{:?}", words);
}
```

Read the two halves separately:

- **In the pattern**, `$( $x:expr ),*` means "match zero or more expressions, separated by commas, and capture each one as `$x`."
- **In the expansion**, `$( v.push($x); )*` means "repeat this line once for every `$x` that got captured."

That's exactly how the real `vec!` macro in the standard library works. You've now built the same trick.

## Common mistakes

- **Forgetting the `!`.** `vec[1, 2, 3]` or `println("hi")` fail because the compiler goes looking for a *function* of that name and finds none — macros are always called with `!`.
- **Treating a macro argument like an already-evaluated value.** As `twice!` showed, an argument used twice in the expansion *runs* twice. If it has a side effect (like `n += 1` or a `println!`), that side effect repeats.
- **Repetition syntax that doesn't match between pattern and expansion.** In `$( $x:expr ),*` the separator (`,`) and the `*` in the pattern must line up with the `$( ... )*` in the expansion, or you get cryptic "no rules expected this token" errors.
- **Using the wrong fragment specifier.** Passing `1 + 1` where a pattern expects `:ident`, or a bare name where it expects `:ty`, fails to match — even though both "look like code" to you, the macro matcher is strict about the shape.
- **Reaching for a macro when a function would do.** Macros are harder to read and debug than functions, and tooling (autocomplete, go-to-definition) understands them less well. Use a macro only for what a function genuinely can't do — a variable number of arguments, or generating new code like struct fields or match arms.

## Your turn

This macro is supposed to build a `Vec` from any number of items, the way `vec!` does — but it only has a rule for a single expression, and it's being called with three. Fix it so `my_vec![1, 2, 3]` works.

```rust,editable
macro_rules! my_vec {
    ($x:expr) => {{
        let mut v = Vec::new();
        v.push($x);
        v
    }};
}

fn main() {
    let v = my_vec![1, 2, 3];
    println!("{:?}", v);
}
```

<details><summary>Show solution</summary>

The pattern `($x:expr)` only matches *one* expression. Calling `my_vec![1, 2, 3]` hands it three expressions separated by commas, which doesn't fit that shape at all — the compiler says something like `no rules expected the token ','`. The fix is to add repetition, both in the pattern (to capture a comma-separated list) and in the expansion (to push each captured item):

```rust,editable
macro_rules! my_vec {
    ( $( $x:expr ),* ) => {{
        let mut v = Vec::new();
        $( v.push($x); )*
        v
    }};
}

fn main() {
    let v = my_vec![1, 2, 3];
    println!("{:?}", v); // [1, 2, 3]

    let words = my_vec!["a", "b"];
    println!("{:?}", words); // ["a", "b"]
}
```

`$( $x:expr ),*` in the pattern says "zero or more expressions, comma-separated"; `$( v.push($x); )*` in the expansion says "repeat this line once per captured expression." Now the macro accepts any number of items, just like `vec!`.

</details>

## Quick check

<div class="quiz" data-topic="declarative-macros"></div>

## Remember this

- A macro operates on tokens (source code), not values — it fully expands *before* type checking runs.
- `macro_rules! name { (pattern) => { expansion }; }` — the pattern captures pieces of the call, the expansion is the code to generate.
- Fragment specifiers (`expr`, `ident`, `ty`, `block`, ...) constrain what shape of code a `$name` is allowed to capture.
- An argument used twice in the expansion *runs* twice — macros paste code, they don't cache evaluated values.
- `$( ... ),*` in a pattern captures a repeated, separated list; the matching `$( ... )*` in the expansion repeats generated code once per capture — that's how `vec!`-style variadic macros work.

## Go deeper

- [Rust Book - Macros](https://doc.rust-lang.org/book/ch20-05-macros.html) — Declarative macro syntax.
- [The Little Book of Rust Macros](https://veykril.github.io/tlborm/) — a deep dive once you want to go further than fragment specifiers and repetition.

**Next:**

- [Procedural macros (derive macros you use)](../runtime-and-ecosystem/procedural-macros-overview.md)

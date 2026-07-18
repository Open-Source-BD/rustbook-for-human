# References and dereference

> **Intermediate** · Ownership

## What & why

In the Borrowing lesson you used `&` to lend values around. This lesson slows down and looks at what
a reference actually *is*, and introduces its partner symbol `*` (dereference) — the way to reach
*through* a reference to touch the value on the other end. Once these two clicks, the `&` and `*`
you see everywhere in Rust stop looking like magic.

## The idea, slowly

### A reference is a signpost

A reference doesn't contain the value. It **points at** the value, the way a signpost doesn't
contain a town — it just points to where the town is. When you write `&value`, you make a signpost
that says "the real thing is over there."

```rust,editable
fn main() {
    let x = 10;
    let r = &x;        // r is a reference — a signpost pointing at x
    println!("x is {}", x);
    println!("r points at {}", r);   // Rust follows the signpost for you when printing
}
```

Both lines print `10`. `x` is the value; `r` is a signpost to it. Notice you didn't need any special
symbol to *print* through `r` — `println!` is polite and follows the signpost automatically. But not
everything does, and that's where `*` comes in.

### `*` follows the signpost

`*` means "go to where this reference points and give me the actual value there." It's called
**dereferencing** — literally "un-referencing," reaching through the pointer.

Watch what happens with arithmetic, where Rust will *not* silently follow the signpost:

```rust,editable
fn main() {
    let x = 10;
    let r = &x;

    // println!("{}", r + 1);   // ERROR: r is a signpost, not a number
    println!("{}", *r + 1);     // *r follows the signpost to get 10, then + 1 = 11
}
```

`r` by itself is a reference (a `&i32`), and you can't add `1` to a signpost. `*r` says "follow it,
get the `10`," and *then* `+ 1` works. The mental move is: **`&` makes a reference, `*` follows it
back to the value.** They are opposites.

### Changing a value through a `&mut` reference

Dereferencing really earns its keep with mutable references. To change the value a `&mut` points at,
you dereference with `*` and assign:

```rust,editable
fn main() {
    let mut count = 5;
    let r = &mut count;   // a mutable signpost to count

    *r += 1;              // follow the signpost, add 1 to the real value

    println!("{}", count);   // prints 6
}
```

`*r += 1` reads as: "go to where `r` points (that's `count`) and add 1 there." Without the `*`, you'd
be trying to add 1 to the signpost itself, which is meaningless — and the compiler says so.

### Why do methods like `.len()` not need `*`?

You may have noticed that in the Borrowing lesson you called `word.len()` on a `&String` and never
wrote a `*`. That's because Rust does a helpful automatic step called **deref coercion**: when you
call a method with `.`, Rust will quietly follow references for you as many times as needed to find
the method. So `word.len()` works whether `word` is a `String` or a `&String` or even a `&&String`.

```rust,editable
fn main() {
    let s = String::from("atlas");
    let r = &s;

    println!("{}", s.len());   // 5
    println!("{}", r.len());   // 5 — Rust auto-follows the reference for the method call
}
```

The rule of thumb: **the dot operator (`.`) follows references for you automatically; bare operators
like `+`, `+=`, and `==` do not.** So you mostly need `*` for arithmetic and assignment through a
reference, and rarely for method calls.

### `&str` vs `&String`: a tiny preview

You'll often see `&str` where you might expect `&String`. A `&str` is a reference to string text —
a very common, lightweight "view" of characters. Because of deref coercion, a `&String` can be used
almost anywhere a `&str` is wanted, so this just works:

```rust,editable
fn main() {
    let owned = String::from("hello");
    shout(&owned);            // &String is accepted where &str is asked for
}

fn shout(text: &str) {        // prefer &str for read-only text parameters
    println!("{}!", text.to_uppercase());
}
```

Don't worry about mastering `&str` yet — the **Slices** lesson (next) explains exactly what it is.
For now just know: writing your read-only text parameters as `&str` makes your functions accept
more kinds of callers, and you can pass a `&String` right in.

## Common mistakes

- **Using a reference where a value is needed.** Writing `r + 1` when `r` is `&i32` gives
  `cannot add {integer} to &{integer}`. You forgot to dereference — use `*r + 1`.
- **Adding `*` where the `.` already handles it.** You rarely need `(*r).len()`; just write
  `r.len()`. Over-dereferencing is a common beginner habit — let the dot do its job.
- **Trying `*r = ...` through a read-only `&`.** You can only assign through a `&mut`. Assigning
  through a plain `&` gives `cannot assign to ... behind a `&` reference`. Make it `&mut`.
- **Confusing `&` and `*` directions.** `&` *creates* a reference (value → signpost); `*` *follows*
  one (signpost → value). If a line feels backwards, check which direction you actually want.

## Your turn

This program tries to double a number through a mutable reference, but it doesn't compile. Fix it so
it prints `8`.

```rust,editable
fn main() {
    let mut n = 4;
    let r = &mut n;
    r = r * 2;
    println!("{}", n);
}
```

<details><summary>Show solution</summary>

`r` is a signpost, not a number, so `r * 2` is meaningless and `r = ...` tries to point the signpost
somewhere new instead of changing the value. Dereference with `*` to reach the real value and change
it there:

```rust,editable
fn main() {
    let mut n = 4;
    let r = &mut n;
    *r = *r * 2;      // follow the signpost on both sides: n becomes 4 * 2
    println!("{}", n); // prints 8
}
```

`*r` on the right reads the current value (4), and `*r =` on the left writes the new value back into
`n`. You could also write it as `*r *= 2;`.

</details>

## Quick check

<div class="quiz" data-topic="references-and-dereference"></div>

## Remember this

- A reference (`&`) is a signpost that points at a value; it doesn't hold the value itself.
- `*` dereferences — it follows the signpost back to the actual value.
- `&` and `*` are opposites: one makes a reference, the other follows it.
- The dot operator (`.`) auto-follows references for method calls; bare operators like `+` and `=`
  need you to write `*` yourself.

## Go deeper

- [Rust by Example - Deref](https://doc.rust-lang.org/rust-by-example/flow_control/match/destructuring/destructure_references.html) — Reference patterns and deref thinking.

**Next:**

- [Slices](../ownership/slices.md)
- [Lifetimes](../ownership/lifetimes.md)
- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

# Borrowing

> **Intermediate** · Ownership

## What & why

The last lesson ended on a frustrating note: passing a `String` into a function *gives it away*, and
then you can't use it anymore. Borrowing is the fix. It lets you **lend** a value to a function so
it can look at it (or even change it) and then hand it back — no giving away, no copying, no cost.
This is the "lend without giving away" idea from the Ownership lesson, made real.

## The idea, slowly

### The problem borrowing solves

Remember this from the last lesson? Passing `s` into a function moved it, and the line after broke:

```rust,editable
fn main() {
    let s = String::from("hello");
    greet(s);                         // s is MOVED into greet
    // println!("{}", s.len());       // ERROR: s was given away
}

fn greet(word: String) {
    println!("Hi, {}!", word);
}
```

That's a lot of ceremony just to *look* at a string. In real life, if a friend wants to read your
book, you don't sign the book over to them forever — you **lend** it, they read it, they give it
back. Rust has exactly that: a **reference**, written with an ampersand `&`.

### Lending with `&`

A reference is a way to say "let this function *use* my value without taking ownership of it." You
create one by putting `&` in front of the value, and the function says it wants one by putting `&`
in front of the type:

```rust,editable
fn main() {
    let s = String::from("hello");
    greet(&s);                                    // lend s (don't give it away)
    println!("the word was {} letters", s.len()); // s is STILL OURS — works!
}

fn greet(word: &String) {                          // "word" is a reference, not owned
    println!("Hi, {}!", word);
}
```

Run this. It prints the greeting **and** the length. Nothing moved. That's the whole point of
borrowing: `&s` hands the function a *reference* to the string, `s` keeps ownership, and after
`greet` finishes you can keep using `s` normally.

The act of making and using a reference is called **borrowing**. You "borrow" the value, the same
way your friend borrows the book. And just like a borrowed book, there are rules about what you're
allowed to do with something you don't own.

### What the compiler is thinking

When the function takes `&String`, the compiler thinks: *"This function is only borrowing. It does
not own this string, so when the function ends, it must NOT free the memory — the real owner back
in `main` is still using it."* When the function takes a plain `String`, the compiler thinks the
opposite: *"This function now owns it; when the function ends, drop it."* That one little `&` is
what tells Rust which of those two stories is true.

### Read-only by default: `&`

A plain `&` borrow is **read-only**. You can look, but you can't change:

```rust,editable
fn main() {
    let s = String::from("hello");
    let len = measure(&s);
    println!("{} is {} chars", s, len);
}

fn measure(word: &String) -> usize {
    word.len()          // reading is fine
    // word.push('!');  // ERROR: can't change a value you only borrowed read-only
}
```

This is like borrowing a library book: you may read it, but you may not scribble in it. If you try
to change it, the compiler stops you with `cannot borrow ... as mutable`.

### When you DO want to change it: `&mut`

Sometimes you *want* the function to change your value — say, add an exclamation mark. For that you
need a **mutable borrow**, written `&mut`. Three things all have to line up:

1. The original variable must be declared `mut` (it has to be changeable in the first place).
2. You pass it with `&mut`.
3. The function accepts `&mut`.

```rust,editable
fn main() {
    let mut s = String::from("hello");   // 1. must be mut
    add_excitement(&mut s);              // 2. lend it mutably
    println!("{}", s);                   // prints: hello!
}

fn add_excitement(word: &mut String) {   // 3. accepts &mut
    word.push('!');                      // now changing it is allowed
}
```

The value is still owned by `main` the whole time. We only *lent the right to change it* for the
duration of the call, then took it back. This is like lending your friend a pencil-and-paper form
and saying "go ahead, fill it in" — they modify your thing, but it's still yours.

### The one big rule: one writer, or many readers

Here's the rule that trips everyone up, so read it slowly. At any given moment, for one value, you
can have **either**:

- **any number of read-only (`&`) borrows** — many readers are fine, OR
- **exactly one mutable (`&mut`) borrow** — one writer, and nobody else.

You can never have a `&mut` at the same time as any other borrow. Why? Imagine one part of your
code is reading a list while another part is deleting items from it — the reader would see garbage.
Rust forbids that situation *at compile time* so it can never happen while the program runs.

```rust,editable
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;      // reader 1
    let r2 = &s;      // reader 2 — fine, many readers allowed
    println!("{} and {}", r1, r2);   // last use of r1 and r2

    let w = &mut s;   // now a writer — allowed, because r1/r2 are done being used
    w.push('!');
    println!("{}", w);
}
```

Think of it as a shared document: lots of people can *read* it at the same time, but the moment
someone wants to *edit*, everyone else has to step away. Rust enforces this so your data can never
change underneath you while you're looking at it.

## Common mistakes

- **Forgetting `&` on both sides.** If the value is `&s` but the function still says `word: String`,
  or vice versa, the types don't match and you get `mismatched types: expected String, found &String`.
  The `&` has to be on the value *and* on the parameter type.
- **Trying to mutate through a plain `&` borrow.** A read-only borrow can't call methods that change
  the value (like `.push`). The error is `cannot borrow ... as mutable, as it is behind a `&` reference`.
  Fix: use `&mut` everywhere and make the original variable `mut`.
- **A `&mut` while another borrow is alive.** `cannot borrow ... as mutable because it is also borrowed
  as immutable` means you still have a reader hanging around. The fix is usually to stop using the
  earlier reference before you start the mutable one.
- **Forgetting `mut` on the variable itself.** You can't take a `&mut` of something that was never
  declared `mut`. The error points you back to the `let` and says to add `mut`.

## Your turn

This program wants to add a `"."` to the end of the sentence, then print it. It doesn't compile.
Fix it so it prints `learning rust.` (Hint: three things have to line up for a mutable borrow.)

```rust,editable
fn main() {
    let sentence = String::from("learning rust");
    finish(sentence);
    println!("{}", sentence);
}

fn finish(text: &String) {
    text.push('.');
}
```

<details><summary>Show solution</summary>

Two problems: the function takes ownership (plain `String`) but we need it back, and it tries to
change a read-only borrow. Switch everything to a **mutable borrow** and make `sentence` mutable:

```rust,editable
fn main() {
    let mut sentence = String::from("learning rust");  // must be mut
    finish(&mut sentence);                             // lend it mutably
    println!("{}", sentence);                          // still ours — prints: learning rust.
}

fn finish(text: &mut String) {   // accept a mutable borrow
    text.push('.');              // now allowed to change it
}
```

The `&mut` lets `finish` change the string in place, and because it only *borrowed*, `sentence`
still belongs to `main` afterward.

</details>

## Quick check

<div class="quiz" data-topic="borrowing"></div>

## Remember this

- A reference (`&`) lets a function *use* a value without taking ownership — it borrows, then gives
  it back.
- Plain `&` is read-only; `&mut` lets you change the value (and needs the original to be `mut`).
- The rule: at one time you may have **many readers** *or* **one writer**, never both.
- Borrowing costs nothing and moves nothing — reach for it before you reach for `.clone()`.

## Go deeper

- [Rust Book - References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) — Borrowing rules.

**Next:**

- [References and dereference](../ownership/references-and-dereference.md)
- [Slices](../ownership/slices.md)
- [Lifetimes](../ownership/lifetimes.md)

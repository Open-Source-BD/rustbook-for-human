# Slices

> **Intermediate** · Ownership

## What & why

A slice is a borrowed *view* into part of a collection — a piece of a string or an array — without
copying it and without owning it. It's how you say "just this middle chunk" and pass it around
cheaply. Slices are everywhere in Rust, and they're the thing the mysterious `&str` type actually is.

## The idea, slowly

### A window onto a row of boxes

Picture a `String` as a row of labelled boxes, one per byte of text:

```text
 h   e   l   l   o
 0   1   2   3   4
```

A slice is a **window** you slide over that row to see just some of the boxes — say boxes 0, 1, 2.
The window doesn't copy the boxes and doesn't own them; it just says "look here, from this box up to
that box." You make one with `&thing[start..end]`:

```rust,editable
fn main() {
    let s = String::from("hello");
    let hi = &s[0..2];    // a window over boxes 0 and 1: "he"
    let lo = &s[2..5];    // boxes 2,3,4: "llo"
    println!("{} + {}", hi, lo);   // he + llo
}
```

The range `0..2` means **start at 0, stop *before* 2** — so it includes 0 and 1, not 2. That
"stop before the end number" rule is the one to burn into memory; it's the same everywhere ranges
appear in Rust.

### The `&` matters: a slice is a borrow

Notice the `&` in `&s[0..2]`. A slice is a kind of reference — a borrow — so all the borrowing rules
from two lessons ago still apply. The slice points into `s`'s memory; it does not own it. That's why
it's cheap (nothing is copied) and why it can't outlive `s` (more on that in the mistakes section).

### Handy shortcuts for the ends

You can leave off a number to mean "the very start" or "the very end":

```rust,editable
fn main() {
    let s = String::from("hello");
    println!("{}", &s[..2]);    // from the start up to 2  -> "he"
    println!("{}", &s[2..]);    // from 2 to the end       -> "llo"
    println!("{}", &s[..]);     // the whole thing         -> "hello"
}
```

`&s[..]` (the whole string as a slice) is common when a function wants a slice and you have the
whole string.

### Meet `&str`: the string slice

Here's the payoff. That `&str` type you keep seeing? **A `&str` is a string slice** — a borrowed
window into string text. When you slice a `String`, the result *is* a `&str`. And a plain text
literal like `"hello"` in your code is *also* a `&str` (it's a window into text baked into your
program). So these are the same type:

```rust,editable
fn main() {
    let owned = String::from("hello world");
    let piece: &str = &owned[0..5];   // "hello", a slice of the String
    let literal: &str = "hello";      // also a &str, baked into the program

    println!("{} == {} is {}", piece, literal, piece == literal);  // true
}
```

This is why the last lesson said to write read-only text parameters as `&str`: it accepts both
literals *and* slices of `String`s (and, thanks to deref coercion, whole `&String`s too). One
parameter type, lots of callers.

### A real reason to slice: return part of a string

Say you want the first word of a sentence. Instead of copying characters into a new `String`, you
return a *slice* — a window onto the original text. No allocation, no copy:

```rust,editable
fn main() {
    let sentence = String::from("learning rust today");
    let word = first_word(&sentence);
    println!("first word: {}", word);   // learning
}

fn first_word(s: &str) -> &str {
    for (i, ch) in s.char_indices() {
        if ch == ' ' {
            return &s[..i];    // window from start up to the first space
        }
    }
    s                          // no space found: the whole thing is one word
}
```

`first_word` returns a `&str` that borrows from `sentence` — a view, not a copy. This is the classic
example of *why* slices exist.

### Slices work on arrays too

Slices aren't just for strings. Any array or `Vec` can be sliced the same way, giving a `&[T]`
(a borrowed window over a sequence of `T`):

```rust,editable
fn main() {
    let numbers = [10, 20, 30, 40, 50];
    let middle = &numbers[1..4];   // a window over 20, 30, 40
    println!("{:?}", middle);      // [20, 30, 40]
    println!("sum = {}", middle.iter().sum::<i32>());   // 90
}
```

Same idea, same `start..end` rule, same "it's a borrow" behavior. Whenever a function only needs to
*read* a run of items, taking a slice (`&[T]` or `&str`) is the idiomatic choice — it works whether
the caller has an array, a `Vec`, or another slice.

## Common mistakes

- **Off-by-one from the exclusive end.** `&s[0..2]` gives you indices 0 and 1, *not* 2. Forgetting
  that the end is exclusive is the #1 slice bug. `[..2]` = "the first two."
- **Slicing a string in the middle of a character.** Rust strings are UTF-8 bytes, and some
  characters (like `é` or emoji) take more than one byte. Slicing between the bytes of one character
  panics at runtime with `byte index ... is not a char boundary`. For plain ASCII (a-z, 0-9) every
  character is one byte, so you're safe; just be careful with accented or non-Latin text.
- **Index out of range.** `&s[0..99]` on a 5-byte string panics with `byte index 99 is out of range`.
  A slice can't point past the end of what it borrows.
- **Letting the owner die first.** A slice borrows from a value, so it can't outlive that value.
  If you drop or move the original `String` while a slice of it is still in use, the compiler stops
  you — the window would be pointing at boxes that no longer exist.

## Your turn

This program wants to print the first three letters, `rus`. It doesn't compile. Fix it.

```rust,editable
fn main() {
    let word = String::from("rust");
    let start = word[0..3];
    println!("{}", start);
}
```

<details><summary>Show solution</summary>

A slice is a *borrow*, so it needs the `&`. Without it, you're asking to move a chunk of the string
out by value, which isn't allowed. Add `&`:

```rust,editable
fn main() {
    let word = String::from("rust");
    let start = &word[0..3];    // a borrowed window: "rus"
    println!("{}", start);
}
```

`&word[0..3]` makes a `&str` viewing bytes 0, 1, 2 — the letters `r`, `u`, `s` — without copying or
taking ownership.

</details>

## Quick check

<div class="quiz" data-topic="slices"></div>

## Remember this

- A slice is a borrowed **view** into part of a collection — no copy, no ownership.
- Make one with `&thing[start..end]`; the end index is **exclusive** (stops *before* it).
- `&str` *is* a string slice — that's why text literals and slices of a `String` share the type.
- Slices work on arrays and `Vec`s too, giving `&[T]`; prefer slice parameters for read-only access.
- A slice can't outlive the value it borrows from.

## Go deeper

- [Rust Book - Slices](https://doc.rust-lang.org/book/ch04-03-slices.html) — Borrowing part of a value.

**Next:**

- [Lifetimes](../ownership/lifetimes.md)
- [Collections](../abstractions/collections.md)

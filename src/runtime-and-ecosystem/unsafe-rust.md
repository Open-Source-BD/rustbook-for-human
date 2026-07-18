# Unsafe Rust

> **Advanced** · Runtime & ecosystem

## What & why

`unsafe` is a keyword that unlocks a handful of operations the compiler normally forbids because it
can't *prove* they're safe. It does **not** switch off safety for your whole program — it draws a
small marked box and says "inside here, I, the programmer, take responsibility for the rules." You'll
rarely write it, but you should understand it, because a lot of the safe standard library is built on
top of tiny, carefully audited unsafe blocks.

## The idea, slowly

Everything you've written so far is **safe Rust**: the compiler checks ownership, borrowing, and
types, and guarantees no dangling pointers, no data races, no reading freed memory. That guarantee is
Rust's whole selling point.

But the compiler is *conservative*. It rejects some things that are actually fine, simply because it
can't verify them. And some low-level tasks — talking to C libraries, writing a data structure at the
raw-memory level, poking hardware — inherently can't be proven safe by any compiler. For those cases,
`unsafe` lets you do five extra things:

1. **Dereference a raw pointer** (`*const T` / `*mut T`).
2. **Call an `unsafe` function** (including foreign C functions).
3. **Access or modify a mutable `static`** (global) variable.
4. **Implement an `unsafe` trait**.
5. **Access fields of a `union`**.

That's the *entire* list. `unsafe` gives you these five powers and nothing else. It does not turn off
the borrow checker for normal code, it doesn't let you ignore types, and it isn't a magic "make the
error go away" button.

### What `unsafe` really means: a promise

Inside an `unsafe` block, the compiler stops checking a few specific things and *trusts you* to keep
the rules it can no longer verify. You are signing a contract: "I promise this pointer is valid, this
memory is initialized, this C function does what its docs say." If you break the promise, you get the
exact bugs Rust normally prevents — crashes, corruption, security holes. That's why the advice is:
keep `unsafe` blocks tiny and stare at them hard.

### Raw pointers

A raw pointer is like a reference with the safety training wheels removed. You can *create* raw
pointers in safe code; you can only *dereference* them (follow them to the value) inside `unsafe`.

```rust,editable
fn main() {
    let x = 42;

    let p = &x as *const i32;   // make a raw pointer (safe so far)

    unsafe {
        // Dereferencing needs unsafe: the compiler can't guarantee p is valid.
        println!("p points at {}", *p);
    }
}
```

Creating `p` is safe — a pointer is just a number. Following it with `*p` is where things could go
wrong (what if it pointed at freed memory?), so *that* requires `unsafe`. Here it's clearly fine
because `x` is right there, alive, on the stack.

### Calling an unsafe function

Some functions are marked `unsafe fn` because calling them wrongly causes undefined behavior. Calling
one requires an `unsafe` block, which is you saying "I've read the contract and I'm meeting it."

```rust,editable
// A function that is only correct if `index` is within bounds.
unsafe fn get_unchecked(slice: &[i32], index: usize) -> i32 {
    // std has slice::get_unchecked; we fake the idea here.
    *slice.as_ptr().add(index)
}

fn main() {
    let numbers = [10, 20, 30];

    let value = unsafe {
        // WE promise index 1 is in bounds. If we lied, this is UB.
        get_unchecked(&numbers, 1)
    };

    println!("value = {}", value);   // 20
}
```

The whole point of the `unsafe fn` marking is to force every caller to *acknowledge* the danger with
an `unsafe` block, so it's visible in the code and in code review.

### The golden pattern: wrap unsafe in a safe API

Well-written Rust doesn't scatter `unsafe` everywhere. It hides a small unsafe core behind a safe
function that *checks the conditions first*, so callers never touch `unsafe` at all. The standard
library does this constantly — `Vec`, for instance, is a safe wrapper around unsafe raw-memory code.

```rust,editable
// Safe on the outside, unsafe (checked) on the inside.
fn third_element(slice: &[i32]) -> Option<i32> {
    if slice.len() > 2 {
        // We just proved index 2 is valid, so the unsafe deref is sound.
        Some(unsafe { *slice.as_ptr().add(2) })
    } else {
        None
    }
}

fn main() {
    println!("{:?}", third_element(&[1, 2, 3, 4]));   // Some(3)
    println!("{:?}", third_element(&[1, 2]));         // None — no crash
}
```

Callers of `third_element` never write `unsafe`. The dangerous operation is boxed in, guarded by a
bounds check that makes the promise true. This is the responsible way to use `unsafe`.

### When do you actually need it?

Honestly, as a beginner (and often for years): **almost never in application code.** You reach for
`unsafe` when:

- Calling into C libraries (FFI — the next lesson).
- Writing a low-level data structure where you manage memory yourself.
- Doing a performance-critical trick after you've *measured* that the safe version is too slow.

If you're writing a web app, a CLI, or a normal service, you can go a very long time without ever
typing `unsafe`. Treat wanting it as a signal to double-check there isn't a safe way first.

## Common mistakes

- **Using `unsafe` to silence a borrow-checker error.** It doesn't do that. `unsafe` only unlocks the
  five specific operations above; a normal ownership error inside an `unsafe` block is still an error.
  If the borrow checker is complaining, fix the design, don't reach for `unsafe`.
- **Making the `unsafe` block bigger than necessary.** Wrap only the actual dangerous operation, not a
  whole function of ordinary code. A small block is easy to audit; a huge one hides the real risk.
- **Breaking the unspoken contract.** Dereferencing a dangling or misaligned pointer, calling a C
  function with wrong arguments, or reading uninitialized memory is *undefined behavior* — the program
  may crash, corrupt data, or appear to work then fail later. There is no partial credit.
- **Not documenting why it's sound.** Every `unsafe` block should have a comment explaining *why* the
  promise holds ("index checked above," "pointer came from a live `Vec`"). Future you needs it.
- **Assuming `unsafe` is faster by default.** It isn't magic speed. Often the safe version optimizes
  to identical machine code. Only reach for it after measuring a real bottleneck.

## Your turn

Unsafe/low-level code is best reasoned about rather than fiddled with blindly, so this is a "what's
wrong here" exercise. The function below claims to be safe but has a serious bug. What's the problem,
and how would you make it genuinely sound?

```rust,ignore
fn first_element(slice: &[i32]) -> i32 {
    // "It's fine, index 0 always exists... right?"
    unsafe { *slice.as_ptr() }
}
```

<details><summary>Show solution</summary>

The bug: an *empty* slice has no element 0. If someone calls `first_element(&[])`, `slice.as_ptr()`
points at nothing valid, and dereferencing it is **undefined behavior** — a crash or garbage. The
function pretends to be safe but can trigger UB from perfectly ordinary safe input, which is exactly
what you must never do.

Make the promise true by checking before you dereference, and return an `Option` so an empty slice
has a real answer:

```rust,ignore
fn first_element(slice: &[i32]) -> Option<i32> {
    if slice.is_empty() {
        None
    } else {
        // SAFETY: we just checked the slice is non-empty, so index 0 is valid.
        Some(unsafe { *slice.as_ptr() })
    }
}
```

Now the unsafe deref only runs when we've *proven* there's an element there, and the empty case
returns `None` instead of corrupting memory. Better still, plain safe Rust already does this:
`slice.first().copied()`. Prefer the safe standard-library method whenever one exists.

</details>

## Quick check

<div class="quiz" data-topic="unsafe-rust"></div>

## Remember this

- `unsafe` unlocks exactly five operations (raw-pointer deref, unsafe fn calls, mutable statics, unsafe traits, unions) — nothing more.
- It does **not** disable the borrow checker or safety for the rest of your program; it's a small, marked promise.
- Break the promise (dangling pointer, wrong FFI call, uninitialized memory) and you get undefined behavior.
- The right pattern is a *safe* API wrapping a small, checked `unsafe` core — like `Vec` does.
- Keep unsafe blocks tiny, document why they're sound, and prefer a safe alternative whenever one exists.

## Go deeper

- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) — Unsafe code and invariants.

**Next:**

- [FFI](../runtime-and-ecosystem/ffi.md)
- [Macros](../runtime-and-ecosystem/macros.md)

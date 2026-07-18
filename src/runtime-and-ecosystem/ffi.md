# FFI

> **Advanced** · Runtime & ecosystem

## What & why

FFI stands for **Foreign Function Interface** — it's how Rust talks to code written in *another*
language, almost always C. You use it to call an existing C library (image decoders, databases,
the operating system) from Rust, or to let a C program call *your* Rust code. The hard part isn't
the syntax; it's agreeing with the other language about how data is shaped, who frees memory, and
what happens when things go wrong.

## The idea, slowly

### Two languages meeting at a border

Imagine two countries that speak different languages, meeting at a border crossing. Inside Rust,
everyone follows Rust's strict rules: the borrow checker watches every value, memory is freed
automatically, strings know their length. Inside C, none of that is true — C strings are just
bytes that end in a zero, nobody checks anything, and you free memory by hand.

FFI is the border crossing between them. At that border, Rust's guarantees **stop**. The compiler
can check your Rust up to the edge, but once a value crosses into C, Rust has no idea what happens
to it. That's why *everything* about FFI is marked `unsafe`: you are telling the compiler "I've
checked this by hand, trust me."

### The `extern` block: declaring foreign functions

To call a C function, you first *declare* it so Rust knows its name and its signature. You do that
in an `extern "C"` block. The `"C"` part is the **ABI** — the "application binary interface," the
low-level agreement about how arguments are passed in registers and on the stack. C and Rust don't
naturally agree on this, so you spell it out.

```rust
// This declares a function that lives in the C standard library.
// Rust does NOT define it here — it just promises "this exists somewhere."
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    // Calling a foreign function is ALWAYS unsafe, because Rust can't verify
    // that `abs` actually behaves the way we claimed.
    let result = unsafe { abs(-5) };
    println!("abs(-5) = {result}");
}
```

This example links against the C standard library, so it will **not** run on the Playground's Run
button reliably. Put it in a real project and run `cargo run`. The point to absorb: you *declare*
the function's shape, and every call sits inside `unsafe { }`.

### Going the other way: exposing Rust to C

Sometimes you want C (or Python, or Node, or a game engine) to call *your* Rust function. Two
things have to happen:

- **`extern "C"`** on the function tells Rust to use the C calling convention so C knows how to
  call it.
- **`#[unsafe(no_mangle)]`** stops Rust from "mangling" the name. Normally Rust scrambles function
  names into long unique symbols; C wouldn't be able to find `add` if it were renamed to something
  like `_ZN3add17h9f...`. `no_mangle` keeps the name exactly `add`.

```rust
// In a real library crate (a `cdylib` or `staticlib`), C can now call `add`.
#[unsafe(no_mangle)]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

> On older Rust you'll see plain `#[no_mangle]`; modern editions prefer the explicit
> `#[unsafe(no_mangle)]` because exporting a raw symbol is itself an unsafe promise. Both compile;
> the `unsafe(...)` form is the current recommendation.

### The real challenge: data layout and ownership

Simple numbers like `i32` cross the border fine — C and Rust agree on what a 32-bit integer is.
The trouble starts with anything bigger:

- **Strings.** A Rust `String` knows its length and is *not* zero-terminated. A C string is just
  bytes ending in a `\0`. They are not interchangeable. You convert with `std::ffi::CString`
  (Rust → C) and `CStr` (C → Rust).
- **Structs.** Rust is free to reorder struct fields for efficiency. C never does. If you share a
  struct across the border, you must add `#[repr(C)]` so Rust lays it out exactly the way C
  expects.
- **Ownership.** This is the big one. If Rust allocates memory and hands a pointer to C, *who
  frees it?* If both free it, you get a crash. If neither frees it, you leak. FFI has no borrow
  checker to sort this out — you decide the rule and document it loudly.

### The golden pattern: wrap the unsafe part

The professional move is to keep all the scary `unsafe` FFI calls in one small private module, and
wrap them in a normal, *safe* Rust function that the rest of your program uses. The unsafe code is
tiny and auditable; everyone else gets a friendly, checked interface.

## Common mistakes

- **Forgetting `#[repr(C)]` on shared structs.** Rust may reorder or pad fields differently than C,
  so the two sides read each other's data at the wrong offsets. It compiles, then corrupts data at
  runtime — the worst kind of bug.
- **Assuming a Rust `String` is a C string.** It isn't zero-terminated and can contain interior
  nulls, so passing its bytes straight to C reads past the end or stops early. Convert with
  `CString`/`CStr`.
- **Getting the ABI wrong (`extern "C"` missing).** Without the right ABI, arguments land in the
  wrong places and the call quietly produces garbage or crashes.
- **Confusing ownership across the border.** Freeing memory on the wrong side (or on both sides)
  causes double-frees and use-after-free. There's no compiler to catch it — you must define and
  document who owns what.
- **Skipping `unsafe` mentally.** FFI *compiles* to real machine calls with zero checking. Treat
  every boundary as a place a bug can hide.

## Your turn

This one is a **spot-the-bug**, because FFI needs a real toolchain and can't run on the Playground.
Here is a struct a beginner wants to share with a C library. Two things are wrong for FFI. What are
they, and why do they bite?

```rust
// Meant to be passed by pointer into a C function.
struct Point {
    x: i32,
    y: i32,
}

extern {
    fn draw_point(p: *const Point);
}
```

<details><summary>Show solution</summary>

Two fixes:

```rust
#[repr(C)]              // 1. force C-compatible field layout
struct Point {
    x: i32,
    y: i32,
}

extern "C" {           // 2. name the ABI explicitly
    fn draw_point(p: *const Point);
}

fn main() {
    let p = Point { x: 3, y: 4 };
    unsafe { draw_point(&p); }   // and every call is unsafe
}
```

Why each matters:

1. **`#[repr(C)]`** — without it, Rust is allowed to reorder or pad the fields however it likes, so
   C might read `x` where Rust put `y`. It compiles cleanly and then corrupts data at runtime.
2. **`extern "C"`** — a bare `extern` doesn't state the ABI clearly. Naming `"C"` guarantees Rust
   and C agree on how arguments and pointers are passed.

And notice the call itself is wrapped in `unsafe { }` — dereferencing a raw pointer in C code is
something only *you* can vouch for.

</details>

## Quick check

<div class="quiz" data-topic="ffi"></div>

## Remember this

- FFI is the border between Rust and another language (usually C); Rust's safety guarantees stop at
  that border.
- `extern "C" { ... }` **declares** foreign functions; calling them is always `unsafe`.
- `#[unsafe(no_mangle)] pub extern "C" fn` **exposes** a Rust function to C with an unscrambled name.
- Put `#[repr(C)]` on any struct that crosses the boundary, and convert strings with `CString`/`CStr`.
- Decide explicitly who owns and frees memory — there is no borrow checker across FFI.
- Wrap the tiny unsafe FFI core in a safe Rust API for everyone else to use.

## Go deeper

- [Rust Reference - FFI](https://doc.rust-lang.org/reference/items/external-blocks.html) — Extern blocks and ABIs.

**Next:**

- [Serde and JSON](../runtime-and-ecosystem/serde-and-json.md)
- [CLI apps](../runtime-and-ecosystem/cli-apps.md)

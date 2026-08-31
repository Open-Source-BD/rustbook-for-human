# Lifetime elision and 'static

> **Advanced** · Ownership

## What & why

Lifetimes are the compiler's sticky notes for references: "this borrow is only good for as long as X." Most functions that take and return references never write one down, because three simple rules cover the shapes that show up constantly — the compiler fills in the sticky note itself. This page covers those rules, what happens when a *struct* needs to hold a reference, and the much-misunderstood `'static` — which means "can live for the whole program," not "is a global."

## The idea, slowly

### A quick reminder of why lifetimes exist

A reference can never outlive the data it points to — that's the core rule the borrow checker enforces. Sometimes a function's signature needs to describe *how* an output reference relates to the input references it came from:

```rust,editable
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    let s1 = String::from("hello");
    let s2 = String::from("hi");
    println!("{}", longest(&s1, &s2));
}
```

`<'a>` here says: "the returned reference lives no longer than the shorter of `a` and `b`'s lifetimes" — the compiler needs that written down because there are *two* input references, and it can't guess which one the output borrows from.

### The three elision rules

Writing `<'a>` everywhere would be exhausting, so the compiler applies three rules first, and only asks you to annotate when they don't produce a complete answer:

1. **Each elided (unwritten) reference in the input gets its own distinct lifetime.**
2. **If there's exactly one input lifetime, it's assigned to every elided output lifetime.**
3. **If one of the inputs is `&self` or `&mut self` (i.e. this is a method), `self`'s lifetime is assigned to every elided output lifetime.**

If none of these rules pin down the output, the compiler stops and asks you to write the lifetime yourself — which is exactly what happened with `longest` above (two input lifetimes, no `&self`, so rule 2 and rule 3 both fail to apply).

```rust,editable
fn first_word(s: &str) -> &str {
    // desugars to: fn first_word<'a>(s: &'a str) -> &'a str   (rule 2)
    s.split_whitespace().next().unwrap_or("")
}

struct Wrapper {
    text: String,
}

impl Wrapper {
    fn text(&self) -> &str {
        // desugars to: fn text<'a>(&'a self) -> &'a str        (rule 3)
        &self.text
    }
}

fn main() {
    println!("{}", first_word("hello world"));

    let w = Wrapper { text: String::from("hi there") };
    println!("{}", w.text());
}
```

**What the compiler is thinking:** elision isn't magic — it's a fixed, mechanical desugaring that runs *before* borrow checking. `fn first_word(s: &str) -> &str` and `fn first_word<'a>(s: &'a str) -> &'a str` are the exact same function as far as the compiler is concerned; the first form just lets you skip typing something rule 2 would have inferred anyway.

### A struct holding a borrowed reference

A struct that stores a reference has to say how long that reference — and therefore every instance of the struct — is allowed to live:

```rust,editable
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn first_sentence(&self) -> &str {
        // elided via rule 3, and self's own lifetime is tied to 'a
        self.text.split('.').next().unwrap_or("")
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let excerpt = Excerpt { text: &novel[..] };
    println!("{}", excerpt.first_sentence());
    // `excerpt` can't outlive `novel` — the compiler enforces that at compile time.
}
```

`Excerpt<'a>` says "an `Excerpt` can't outlive the string slice it borrows from." The compiler now rejects any code that would let `excerpt` be used after `novel` is dropped — the same guarantee a single borrowed reference gets, extended to a whole struct.

### `'static`: string literals live for the whole program

```rust,editable
fn greeting() -> &'static str {
    "hello, world" // string literals are baked into the compiled binary
}

fn main() {
    let s: &'static str = "I live forever";
    println!("{}", greeting());
    println!("{s}");
}
```

String literals have type `&'static str` because the text is embedded directly in the binary at compile time — it's never freed, so it's valid for the entire run of the program. This is the "obvious" meaning of `'static`, and it's the one people usually learn first.

### `'static` in a trait bound: not "is global"

The confusing case is a bound like `T: 'static` on a generic function. It does **not** mean the *value* is a global constant that lives forever — it means "`T` contains no references that could expire early." A type satisfies `T: 'static` either by owning all its data outright, or by only borrowing data that is itself `'static`.

```rust,editable
fn print_it<T: std::fmt::Debug + 'static>(value: T) {
    println!("{value:?}");
}

fn main() {
    let owned = String::from("owned data"); // a normal, short-lived local variable
    print_it(owned); // OK: `String` owns its bytes, so it satisfies 'static trivially

    let n = 5;
    print_it(n); // OK: i32 owns its data too
}
```

`owned` is an ordinary local `String` that will be dropped like any other value — nothing about it is "global." It satisfies `T: 'static` simply because it doesn't *borrow* anything with a shorter lifetime. Contrast that with an actual borrow:

```rust,editable
fn print_it<T: std::fmt::Debug + 'static>(value: T) {
    println!("{value:?}");
}

fn main() {
    let text = String::from("short-lived");
    let borrowed: &str = &text;
    // print_it(borrowed); // ERROR: `borrowed` doesn't satisfy 'static
    println!("{borrowed}");
}
```

Uncommenting `print_it(borrowed)` fails to compile: `&text` only lives as long as `text` does, which is nowhere near `'static`, so `&str` here can't satisfy the bound. Swap it for an owned `String` (or a genuine `&'static str`, like a string literal) and it compiles again.

## Common mistakes

- **Reading `'static` as "this is a global."** It means "no borrow inside this value expires before the program theoretically could end" — an owned `String` or `i32` satisfies it trivially, even as a completely ordinary, short-lived local variable.
- **Reaching for `'static` to make a lifetime error disappear.** It usually just relocates the bug — now you can't pass in a borrowed value at all where a `'static` bound is required. Prefer fixing the ownership (clone the data, or store an owned type) over forcing a `'static` bound.
- **Expecting elision to work with two-or-more distinct input references and no `&self`.** The compiler won't guess which input the output borrows from; that's exactly when you must annotate explicitly, like `longest<'a>` above.
- **Forgetting a struct that holds a reference needs a lifetime parameter at all.** `struct Excerpt { text: &str }` alone doesn't compile — the compiler demands a named lifetime so it knows how long an `Excerpt` is allowed to live.

## More examples

### Two elided input lifetimes with no relation
A logging helper takes a tag and a message as separate references but never ties them together in its return type — the compiler gives each its own lifetime and never needs them to match.

```rust,editable
fn longer_len(a: &str, b: &str) -> usize {
    // desugars to fn longer_len<'a, 'b>(a: &'a str, b: &'b str) -> usize
    // 'a and 'b never need to relate, because nothing borrows from either in the return
    a.len().max(b.len())
}

fn main() {
    let tag = "INFO";
    let message = "server started";
    println!("{}", longer_len(tag, message));
}
```

### A `'static` string constant
An app's version string is baked into the binary and needs to be readable from anywhere, for the entire run of the program.

```rust,editable
static APP_VERSION: &str = "2.4.0";

fn main() {
    println!("running version {APP_VERSION}");
}
```

### A generic function with a `T: 'static` bound
A simple type-erased cache needs to guarantee that whatever you hand it doesn't contain a short-lived borrow, so it can hold onto the value safely.

```rust,editable
use std::any::Any;

fn store<T: 'static>(value: T) -> Box<dyn Any> {
    Box::new(value)
}

fn main() {
    let boxed = store(String::from("cached result"));
    if let Some(text) = boxed.downcast_ref::<String>() {
        println!("{text}");
    }
}
```

### A struct with a lifetime parameter used across two methods
A support ticket wraps a borrowed code string and offers two different views on it — a getter and a VIP check — both tied to the same lifetime.

```rust,editable
struct Ticket<'a> {
    code: &'a str,
}

impl<'a> Ticket<'a> {
    fn code(&self) -> &str {
        self.code
    }

    fn is_vip(&self) -> bool {
        self.code.starts_with("VIP")
    }
}

fn main() {
    let raw = String::from("VIP-1234");
    let ticket = Ticket { code: &raw };
    println!("{} vip={}", ticket.code(), ticket.is_vip());
}
```

### Where `'static` shows up for real: spawning a thread
`std::thread::spawn` requires everything the closure captures to be `'static`, because the new thread might outlive the function that spawned it — an owned value satisfies that automatically.

```rust,editable
use std::thread;

fn main() {
    let report = String::from("nightly build passed");
    let handle = thread::spawn(move || {
        println!("{report}");
    });
    handle.join().unwrap();
}
```

## Your turn

This struct is supposed to hold a borrowed word, but it's missing something.

```rust,editable
struct Highlight {
    word: &str, // missing lifetime specifier
}

fn main() {
    let text = String::from("Rust is fun");
    let h = Highlight { word: &text[0..4] };
    println!("{}", h.word);
}
```

<details><summary>Show solution</summary>

A struct can't hold a reference without declaring how long that reference — and the struct itself — is allowed to live. Add a lifetime parameter and use it on the field:

```rust,editable
struct Highlight<'a> {
    word: &'a str, // tied to whatever it borrows from
}

fn main() {
    let text = String::from("Rust is fun");
    let h = Highlight { word: &text[0..4] };
    println!("{}", h.word); // "Rust"
}
```

`Highlight<'a>` now says "a `Highlight` can't outlive the string slice it points to," so the compiler can check that `h` never gets used after `text` would have gone out of scope.

</details>

## Quick check

<div class="quiz" data-topic="lifetime-elision-and-static"></div>

## Remember this

- Elision rule 1: every elided input reference gets its own lifetime.
- Elision rule 2: with exactly one input lifetime, it's assigned to all elided outputs.
- Elision rule 3: with `&self`/`&mut self`, `self`'s lifetime is assigned to all elided outputs.
- When none of the rules apply (e.g. two input references, no `&self`), you must annotate the lifetime yourself.
- A struct holding a reference needs a lifetime parameter tying the struct's validity to the data it borrows.
- `'static` means "can live for the whole program" — string literals are `'static`; a `T: 'static` bound just means `T` owns its data or only borrows `'static` data, not that the value itself is global.

## Go deeper

- [Rust Reference - Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html) — The exact elision rules.

**Next:**

- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)
- [Traits](../abstractions/traits-basics.md)

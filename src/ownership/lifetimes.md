# Lifetimes

> **Intermediate** · Ownership

## What & why

A lifetime is Rust's way of tracking **how long a reference stays valid** — how long the thing it
points at is guaranteed to exist. Most of the time Rust figures this out silently and you never write
a lifetime at all. This lesson is about the handful of times you *do* have to write one, so that when
you meet the strange-looking `'a` syntax it feels ordinary instead of terrifying.

## The idea, slowly

### The danger lifetimes protect against

Think back to slices and references: a reference is a signpost pointing at a value it doesn't own.
Now imagine the value gets thrown away while the signpost still exists. The signpost would point at
nothing — an empty lot where the house used to be. Reading through it would be a serious bug (in C
this is the infamous "dangling pointer"; it causes crashes and security holes).

Rust makes that **impossible**. This does not compile:

```rust,editable
fn main() {
    let r;
    {
        let value = 42;
        r = &value;        // r points at value...
    }                      // ...but value is dropped HERE, at the end of the block
    // println!("{}", r);  // ERROR: r would point at something that no longer exists
}
```

The compiler says `value` does not live long enough. It has been tracking, for every reference, the
"lifetime" of the thing it points at, and it noticed `r` tries to outlive `value`. That tracking is
what lifetimes *are*. Usually it happens completely behind the scenes.

### Lifetimes are a description, not a command

Here is the single most important sentence in this lesson: **a lifetime annotation does not make
anything live longer. It only describes a relationship that already exists.** Writing `'a` is like
labelling two boxes "these go together" — it doesn't create anything, it just tells the compiler how
the pieces relate so it can check them. If you remember nothing else, remember that.

### When Rust needs your help

Rust can figure lifetimes out on its own almost always. The exception is when a function *returns* a
reference and there's more than one reference coming in — because then Rust can't tell which input
the output borrows from. Look at this function that returns the longer of two strings:

```rust,editable
fn main() {
    let a = String::from("short");
    let b = String::from("a longer one");
    let result = longest(&a, &b);
    println!("longest is: {}", result);
}

fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() > right.len() {
        left
    } else {
        right
    }
}
```

The returned `&str` borrows from *either* `left` or `right` — the compiler genuinely cannot tell
which, because it depends on the lengths at runtime. So it asks you to spell out the relationship.
That's what the `'a`s do.

### Reading the `'a` syntax out loud

Let's decode `fn longest<'a>(left: &'a str, right: &'a str) -> &'a str` slowly:

- **`<'a>`** — "I'm introducing a lifetime name called `a`." The apostrophe is just Rust's way of
  writing lifetime names; `'a` is read "tick-a." It's a made-up label, like a variable name. You
  could call it `'thing`, but everyone uses short names like `'a`.
- **`left: &'a str`** — "`left` is a reference that lives at least as long as `'a`."
- **`right: &'a str`** — "`right` also lives at least as long as `'a`."
- **`-> &'a str`** — "the reference I return also lives as long as `'a`."

Put together, you're telling the compiler: *"The thing I hand back borrows from these inputs, so it's
only valid for as long as **both** of them are valid."* Now the compiler has enough information to
check every call and reject any that would keep the result alive too long.

### Seeing it catch a real bug

Because you told the compiler the result borrows from the inputs, it can now stop you from misusing
it. This does not compile, and that's a *good* thing:

```rust,editable
fn main() {
    let a = String::from("short");
    let result;
    {
        let b = String::from("a longer one");
        result = longest(&a, &b);   // result might borrow from b
    }                               // b is dropped here
    // println!("{}", result);      // ERROR: result could be pointing at dropped b
}

fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() > right.len() { left } else { right }
}
```

Without the lifetime, Rust couldn't have known `result` might depend on `b`. With it, the compiler
connects the dots and refuses to let `result` outlive `b`. The `'a` didn't change how the program
runs — it gave the compiler the *information* to catch the mistake.

### Why you've rarely seen this before

You wrote functions with references for two whole lessons without a single `'a`. That's because Rust
has built-in shortcuts (called *elision rules*) that fill lifetimes in automatically for the common,
unambiguous cases — like a function taking one reference and returning one. You only reach for
explicit `'a` when the relationship is genuinely ambiguous, as with two inputs and a borrowed output.
So: don't go sprinkling `'a` everywhere. Write your code normally, and add lifetimes only when the
compiler asks — its error message will even suggest the annotation.

## Common mistakes

- **Thinking `'a` extends how long data lives.** It does not allocate or prolong anything. If your
  data is dropped too early, adding lifetimes won't save it — you have to restructure so the data
  lives long enough (e.g. return an owned `String` instead of a borrow).
- **Adding lifetimes before the compiler asks.** Rust's elision handles most cases. Annotating
  everything by hand is noise and often wrong. Write it plain first; add `'a` only when you see
  `missing lifetime specifier`.
- **Returning a reference to a local variable.** A function can't return a reference to something it
  created inside itself — that local is dropped when the function ends. The error is
  `cannot return reference to local variable`. The fix is usually to return the owned value (`String`)
  instead of a `&str`.
- **Reading `'a` as a type.** `'a` is not a type like `i32`; it's a *label* for a duration. It goes
  in the `<...>` alongside generic type parameters but means "how long," not "what kind."

## More examples

### A struct holding two independently-lived references
A search result might pair a snippet from a document with a highlighted term from a completely separate query string — the two don't have to share a lifespan.

```rust,editable
struct Match<'a, 'b> {
    snippet: &'a str,
    term: &'b str,
}

fn main() {
    let document = String::from("Rust makes systems programming approachable");
    let query = String::from("systems");
    let m = Match { snippet: &document[5..], term: &query };
    println!("found '{}' in: {}", m.term, m.snippet);
}
```

### Picking a display name, with a tie-break rule
A profile page shows the longer of a user's nickname or real name, but on a tie it should prefer the nickname — deepening the classic "return the longer slice" example with real logic.

```rust,editable
fn pick_display_name<'a>(nickname: &'a str, real_name: &'a str) -> &'a str {
    if nickname.len() >= real_name.len() {
        nickname
    } else {
        real_name
    }
}

fn main() {
    let nickname = String::from("Kai");
    let real_name = String::from("Kai Anderson");
    println!("{}", pick_display_name(&nickname, &real_name));
}
```

### A generic function with a lifetime bound
Finding the largest item in a list of scores or prices works the same way regardless of the item type, as long as you can compare them — and the result still borrows from the original list.

```rust,editable
fn largest<'a, T: PartialOrd>(items: &'a [T]) -> &'a T {
    let mut max = &items[0];
    for item in items {
        if item > max {
            max = item;
        }
    }
    max
}

fn main() {
    let prices = [12.5, 8.0, 21.75, 15.0];
    println!("highest price: {}", largest(&prices));
}
```

### Why returning a reference to a local variable fails
This is the shape of the mistake lifetimes exist to prevent — shown here as a description, not code you can run:

```rust
fn make_greeting(name: &str) -> &str {
    let greeting = format!("Hello, {name}!"); // greeting is LOCAL to this function
    &greeting
    // ERROR: cannot return reference to local variable `greeting`.
    // `greeting` is dropped the instant this function ends, so any reference
    // to it would dangle immediately. No lifetime annotation can fix this —
    // the real fix is to return the owned `String` itself (drop the `&`).
}
```

## Your turn

This function is supposed to return the first of two string slices, but it won't compile. The
compiler says it's `missing lifetime specifier`. Add what it needs.

```rust,editable
fn main() {
    let a = String::from("first");
    let b = String::from("second");
    println!("{}", pick(&a, &b));
}

fn pick(x: &str, y: &str) -> &str {
    x
}
```

<details><summary>Show solution</summary>

The function returns a reference but takes two, so Rust can't tell which one the output borrows from.
Introduce a lifetime `'a` and tie the inputs and the output together:

```rust,editable
fn main() {
    let a = String::from("first");
    let b = String::from("second");
    println!("{}", pick(&a, &b));
}

fn pick<'a>(x: &'a str, y: &'a str) -> &'a str {
    x
}
```

The `'a` tells the compiler the returned reference lives as long as the inputs, so it can safely
check every call. (Even though this function only ever returns `x`, Rust wants the relationship
spelled out because *both* parameters share the annotation.)

</details>

## Quick check

<div class="quiz" data-topic="lifetimes"></div>

## Remember this

- A lifetime tracks **how long a reference is valid** — Rust uses it to forbid dangling references.
- A lifetime annotation *describes* a relationship; it never makes data live longer.
- You mostly need explicit `'a` only when a function returns a reference and takes more than one.
- `'a` is a label for a duration, written in `<...>`, read "tick-a."
- Write code plainly first and add lifetimes only when the compiler asks for them.

## Go deeper

- [Rust Book - Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) — Where lifetime syntax is introduced.

**Next:**

- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)
- [Traits](../abstractions/traits.md)

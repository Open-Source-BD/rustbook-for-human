# Traits

> **Intermediate** · Abstractions

## What & why

A trait is a **list of things a type promises it can do**. It lets you write one function that works with *any* type keeping that promise, instead of writing the same function over and over for each concrete type. If you've ever wished you could say "I don't care what this thing actually is, as long as it can be printed / compared / summarized," traits are how you say exactly that.

## The idea, slowly

### Think of a trait as a job description, not a family tree

"Barista" is a job description: anyone who can *take an order*, *make a coffee*, and *hand it over* can do the job. The job description doesn't care whether you're tall, short, or left-handed — it only lists the *behavior* required. A trait works the same way: it lists behavior (methods), and any type that provides that behavior "qualifies," no matter how unrelated the types are otherwise.

### Defining a trait, and implementing it for a type

A trait is a name plus a list of method *signatures* — the method's shape, without a body:

```rust,editable
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    headline: String,
}

struct Tweet {
    handle: String,
    text: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("ARTICLE: {}", self.headline)
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.handle, self.text)
    }
}

fn main() {
    let a = Article { headline: String::from("Rust 2.0 announced") };
    let t = Tweet { handle: String::from("rustlang"), text: String::from("ship it") };

    println!("{}", a.summarize());
    println!("{}", t.summarize());
}
```

Read it slowly:

- `trait Summary { fn summarize(&self) -> String; }` says "anything that is `Summary` must have a `summarize` method that returns a `String`." The `;` after the signature means there's no body — the trait only describes the *promise*, not how to keep it.
- `impl Summary for Article { ... }` is where `Article` actually keeps that promise. `Tweet` keeps the same promise in a completely different way. Neither type knows the other exists.
- `&self` borrows the value the method is called on — same `&` you've seen everywhere else.

**What the compiler is thinking:** when it sees `a.summarize()`, it looks for an `impl Summary for Article` block. Found it, method matches, done. Delete that `impl` block and the error becomes `no method named 'summarize' found for struct 'Article'` — the compiler is telling you the promise was never kept for that type.

### Default method bodies: behavior for free

A trait method can come with a body. Any type that implements the trait gets that body automatically unless it chooses to override it:

```rust,editable
trait Summary {
    fn summarize(&self) -> String;

    // default method — built entirely out of summarize()
    fn headline(&self) -> String {
        format!("[SUMMARY] {}", self.summarize())
    }
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        self.title.clone()
    }
    // headline() is not written here — we get the default for free
}

fn main() {
    let a = Article { title: String::from("Ferris learns to fly") };
    println!("{}", a.headline()); // [SUMMARY] Ferris learns to fly
}
```

`Article` only implemented `summarize`, but `headline` came along for free because the trait already knew how to build it out of `summarize`. This is how a lot of the standard library works: implement one small required method, and a whole family of related methods unlock automatically (`Iterator` is the biggest example of this pattern — more on that later in the course).

A type can also override a default if it has a better way to do it — just write the method with a body in the `impl` block, same as any required method.

### Trait bounds: writing a function against the promise, not the type

The payoff of a trait is writing **one** function that works for anything implementing it. This is called a **trait bound**, and there are two equivalent-looking spellings:

```rust,editable
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        self.title.clone()
    }
}

// spelling 1: impl Trait in argument position (sugar)
fn announce_a(item: &impl Summary) {
    println!("Breaking: {}", item.summarize());
}

// spelling 2: a generic type parameter with a trait bound
fn announce_b<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

fn main() {
    let a = Article { title: String::from("Rust ships const generics") };
    announce_a(&a);
    announce_b(&a);
}
```

`fn announce_a(item: &impl Summary)` reads as "a reference to *some type* that implements `Summary` — I don't care which one." `fn announce_b<T: Summary>(item: &T)` says the same thing more explicitly: "there's a type `T`, and I require `T: Summary`." Both compile to the same thing. The generic spelling (`<T: Summary>`) is the one you *need* once a type has to show up more than once with the guarantee it's the *same* type both times — `impl Trait` sugar can't express that:

```rust,editable
trait Summary {
    fn summarize(&self) -> String;
}

// impl Trait can't say "same T twice" — this needs the generic form
fn longer_summary<T: Summary>(a: &T, b: &T) -> String {
    // both a and b are guaranteed to be the same concrete type
    let sa = a.summarize();
    let sb = b.summarize();
    if sa.len() >= sb.len() { sa } else { sb }
}

struct Note(String);
impl Summary for Note {
    fn summarize(&self) -> String { self.0.clone() }
}

fn main() {
    let n1 = Note(String::from("short"));
    let n2 = Note(String::from("a much longer note here"));
    println!("{}", longer_summary(&n1, &n2));
}
```

### `where` clauses: the same bounds, easier to read

Once a function needs several type parameters with several bounds each, cramming everything into the `<...>` list gets hard to read:

```rust,editable
use std::fmt::Debug;

trait Summary {
    fn summarize(&self) -> String;
}

// hard to read: bounds crowd the signature
fn report_a<T: Summary + Clone, U: Debug + Clone>(item: &T, meta: &U) -> String {
    format!("{} ({:?})", item.summarize(), meta)
}

// same bounds, moved into a where clause — the signature stays scannable
fn report_b<T, U>(item: &T, meta: &U) -> String
where
    T: Summary + Clone,
    U: Debug + Clone,
{
    format!("{} ({:?})", item.summarize(), meta)
}

struct Note(String);
impl Summary for Note {
    fn summarize(&self) -> String { self.0.clone() }
}
impl Clone for Note {
    fn clone(&self) -> Self { Note(self.0.clone()) }
}

fn main() {
    let n = Note(String::from("meeting at 5"));
    println!("{}", report_a(&n, &"tag-1"));
    println!("{}", report_b(&n, &"tag-2"));
}
```

`report_a` and `report_b` are identical to the compiler — `where` is purely a readability tool. Reach for it once you have more than one bound, or bounds that combine multiple traits with `+`.

### Not inheritance

If you come from Java or Python, resist "trait = base class." A trait is not a parent that a type *is a kind of*. It's a *capability* a type *has*. One type can implement many unrelated traits (`Summary` **and** `Clone` **and** `Debug`), and none of them is its "parent." Think **"can do,"** not **"is a."**

## Common mistakes

- **Forgetting the `impl` block.** Writing `trait Summary { ... }` alone does nothing for `Article`. You must write `impl Summary for Article`. The error is `the trait bound 'Article: Summary' is not satisfied` or `no method named 'summarize' found` — both mean "you never told me how this type keeps the promise."
- **Calling a trait method with no bound on the generic type.** `fn f<T>(x: T) { x.summarize(); }` fails with `no method named 'summarize' found for type parameter 'T'`, because *unbounded* `T` could be literally anything — the compiler has zero information about it. The fix is always to add the bound: `fn f<T: Summary>(x: T)`.
- **Mixing up `;` and a body in a trait definition.** `fn summarize(&self) -> String;` (with `;`) is a *required* method. `fn summarize(&self) -> String { ... }` (with a body) is a *default* method. Swapping these changes what implementers must write.
- **Calling a trait method without the trait in scope.** If a trait lives in another module or crate, you must `use` it before its methods are callable on a value, even if the type already implements it. The error is `method not found`, fixed with `use path::to::Trait;`.
- **Thinking traits carry data.** Traits describe behavior, not fields. If you want shared *state*, that's what a struct is for — a trait can require a method that exposes the state, but it can't hold the state itself.

## Your turn

This program wants `announce` to work for any type with a `summarize` method, but it doesn't compile.

```rust,editable
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        self.title.clone()
    }
}

fn announce<T>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

fn main() {
    let a = Article { title: String::from("Rust turns 10") };
    announce(&a);
}
```

<details><summary>Show solution</summary>

`T` in `fn announce<T>` has no bound, so the compiler treats it as "could be absolutely anything" — it has no idea `summarize` exists. Add the trait bound:

```rust,editable
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        self.title.clone()
    }
}

fn announce<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

fn main() {
    let a = Article { title: String::from("Rust turns 10") };
    announce(&a);
}
```

`T: Summary` tells the compiler "whatever concrete type fills in `T`, it will have `summarize`" — that's the whole bound, and it's what makes `item.summarize()` legal inside the generic function.

</details>

## Quick check

<div class="quiz" data-topic="traits-basics"></div>

## Remember this

- A trait is a **list of behavior** (method signatures) a type promises to provide.
- `impl TraitName for TypeName { ... }` is where a type actually keeps the promise.
- `fn f<T: Trait>(x: T)` and `fn f(x: &impl Trait)` both mean "accept anything implementing `Trait`"; use the `<T: Trait>` form when the same type has to appear more than once.
- Default method bodies give implementers free behavior built on top of the required methods.
- `where` clauses hold the exact same bounds as `<T: ...>` — use them once a signature has more than one bound to keep it readable.
- Traits are **"can do," not "is a"** — capabilities, not inheritance.

## Go deeper

- [Rust Book - Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) — Trait definitions and bounds.

**Next:**

- [Trait objects and dyn](../abstractions/trait-objects-and-dyn.md)
- [Generics](../abstractions/generics.md)

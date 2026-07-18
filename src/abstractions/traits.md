# Traits

> **Intermediate** · Abstractions

## What & why

A trait is a **list of things a type promises it can do**. It lets you write one function that works with *any* type keeping that promise, instead of writing the same function over and over for each type. If you've ever wished you could say "I don't care what this thing is, as long as it can be printed," traits are how you say exactly that.

## The idea, slowly

Think of a trait like a **job description**, not a person. "Barista" is a job description: anyone who can *take an order*, *make coffee*, and *hand it over* can do the job. A barista job description doesn't care whether you're tall, short, left-handed, whatever — it only lists the *behavior* required. A trait is the same: it lists behavior (functions), and any type that provides that behavior "qualifies."

### Defining a trait

A trait is just a name plus a list of function *signatures* — the function's shape, without the body:

```rust,editable
trait Greet {
    fn hello(&self) -> String;
}

struct Dog;
struct Robot;

impl Greet for Dog {
    fn hello(&self) -> String {
        String::from("Woof!")
    }
}

impl Greet for Robot {
    fn hello(&self) -> String {
        String::from("BEEP BOOP")
    }
}

fn main() {
    let d = Dog;
    let r = Robot;
    println!("{}", d.hello());
    println!("{}", r.hello());
}
```

Read it slowly:

- `trait Greet { fn hello(&self) -> String; }` says: "Anything that is `Greet` must have a `hello` method that returns a `String`." Notice the `;` after the signature — no body. The trait only describes the *promise*.
- `impl Greet for Dog { ... }` says: "Here is how `Dog` keeps that promise." This is the *implementation*.
- `&self` means the method borrows the value it's called on (it can read the thing but doesn't take ownership). You saw `&` in the Borrowing lesson — same idea.

**What the compiler is thinking:** when it sees `d.hello()`, it checks "does `Dog` have a `hello` method?" It finds the `impl Greet for Dog` block, and it's happy. If you deleted that block, the compiler would say `no method named 'hello' found for struct 'Dog'`.

### Using a trait as a function requirement (trait bounds)

Here's the payoff. You can write **one** function that accepts *anything* that implements `Greet`:

```rust,editable
trait Greet {
    fn hello(&self) -> String;
}

struct Dog;
impl Greet for Dog {
    fn hello(&self) -> String { String::from("Woof!") }
}

fn announce(thing: &impl Greet) {
    println!("It says: {}", thing.hello());
}

fn main() {
    let d = Dog;
    announce(&d);
}
```

`&impl Greet` reads as "a reference to *some type* that implements `Greet`." You don't name the exact type. The function only relies on the *promise* (that `hello` exists), so it works for `Dog`, `Robot`, or any future type you write that implements `Greet`. This is the whole point of traits: **write against the promise, not the concrete type.**

### Default methods: free behavior

A trait can provide a *default* body. Types get it for free unless they override it:

```rust,editable
trait Greet {
    fn hello(&self) -> String;

    // default method — uses hello() to build a longer message
    fn greet_loudly(&self) -> String {
        format!("{}!!!", self.hello())
    }
}

struct Cat;
impl Greet for Cat {
    fn hello(&self) -> String { String::from("Meow") }
    // we don't write greet_loudly — we get the default
}

fn main() {
    let c = Cat;
    println!("{}", c.greet_loudly()); // Meow!!!
}
```

`Cat` only wrote `hello`, but got `greet_loudly` for free because the trait supplied a default. Standard library traits do this a lot — one required method unlocks many free ones.

### Not inheritance

If you come from Java or Python, resist the urge to think "trait = base class." A trait is not a parent that `Dog` *is a kind of*. A trait is a *capability* a type *has*. A single type can implement many unrelated traits (be `Greet` **and** `Clone` **and** `Debug`), and none of them is its "parent." Think **"can do,"** not **"is a."**

## Common mistakes

- **Forgetting the `impl` block.** Defining `trait Greet` alone does nothing for `Dog`. You must write `impl Greet for Dog`. The error is `the trait bound 'Dog: Greet' is not satisfied` or `no method named 'hello' found` — both mean "you never told me how this type keeps the promise."
- **Leaving the `;` off a trait method signature — or adding a body when you meant a signature.** Inside a `trait`, `fn hello(&self) -> String;` (with `;`) is a *required* method. `fn hello(&self) -> String { ... }` (with a body) is a *default* method. Mixing these up changes the meaning.
- **Trying to call a trait method without the trait in scope.** In bigger programs, if a trait lives in another module, you must `use` it before its methods are callable. The error is `method not found`, and the fix is a `use path::to::Trait;` line.
- **Thinking traits work like class inheritance.** There's no "override the parent's state." Traits carry behavior, not fields. If you find yourself wanting shared *data*, that's a struct's job, not a trait's.

## Your turn

This program wants `announce` to work for any greeter, but it doesn't compile. Fix it so it prints `It says: Quack`.

```rust,editable
trait Greet {
    fn hello(&self) -> String;
}

struct Duck;

fn announce(thing: &impl Greet) {
    println!("It says: {}", thing.hello());
}

fn main() {
    let d = Duck;
    announce(&d);
}
```

<details><summary>Show solution</summary>

`Duck` never says *how* it greets, so it doesn't implement `Greet`. Add the `impl` block:

```rust,editable
trait Greet {
    fn hello(&self) -> String;
}

struct Duck;

impl Greet for Duck {
    fn hello(&self) -> String {
        String::from("Quack")
    }
}

fn announce(thing: &impl Greet) {
    println!("It says: {}", thing.hello());
}

fn main() {
    let d = Duck;
    announce(&d);
}
```

The trait is only a promise; the `impl` block is where `Duck` actually keeps it.

</details>

## Quick check

<div class="quiz" data-topic="traits"></div>

## Remember this

- A trait is a **list of behavior** (method signatures) a type promises to provide.
- You make a type keep the promise with `impl TraitName for TypeName { ... }`.
- `fn f(x: &impl Trait)` lets one function accept *any* type that implements the trait.
- Traits can supply **default methods** so types get behavior for free.
- Traits are **"can do," not "is a"** — they are capabilities, not inheritance.

## Go deeper

- [Rust Book - Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) — Trait definitions and bounds.

**Next:**

- [Generics](../abstractions/generics.md)
- [Iterators](../abstractions/iterators.md)
- [Closures](../abstractions/closures.md)

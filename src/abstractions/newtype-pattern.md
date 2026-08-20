# The newtype pattern

> **Intermediate** · Abstractions

## What & why

`UserId` and `OrderId` might both just be a `u64` under the hood — but a `u64` is a `u64` to the compiler, so nothing stops you from accidentally calling `charge(order_id, user_id)` with the arguments swapped. The **newtype pattern** wraps an existing type in a one-field tuple struct — `struct UserId(u64);` — to create a genuinely distinct type at compile time, for free at runtime. It's how Rust gets type-safe units (`Meters` vs `Feet`), prevents ID mix-ups, and even works around a rule that would otherwise block you from implementing a trait you don't own on a type you don't own.

## The idea, slowly

### A one-field wrapper is a brand new type

A tuple struct with a single field is just a label the compiler now enforces:

```rust,editable
struct Meters(f64);
struct Feet(f64);

fn main() {
    let height = Meters(1.8);
    let track_length = Feet(400.0);

    // Both are "just f64" underneath, but they are NOT interchangeable:
    // let mixed: Meters = track_length; // compile error: expected Meters, found Feet

    println!("{} meters, {} feet", height.0, track_length.0);
}
```

At runtime `Meters(1.8)` is exactly one `f64` in memory — the wrapper costs nothing (this is called a "zero-cost abstraction"). At compile time, though, `Meters` and `Feet` are unrelated types. Pass a `Feet` where a `Meters` is expected and you get a type error immediately, not a silently wrong distance calculation three functions later.

### Preventing mixed-up IDs

This is the newtype pattern's bread-and-butter use case. Two IDs backed by the same primitive type are easy to swap by accident — the newtype makes that swap a compile error instead of a runtime bug:

```rust,editable
struct UserId(u64);
struct OrderId(u64);

fn charge(user: UserId, order: OrderId) {
    println!("charging user #{} for order #{}", user.0, order.0);
}

fn main() {
    // charge(OrderId(1), UserId(2)); // compile error: arguments in the wrong order
    charge(UserId(2), OrderId(1));    // correct order, and the compiler checked it
}
```

Without the wrapper, both parameters would just be `u64`, and swapping them compiles fine — it's a bug that only shows up when the wrong user gets charged for the wrong order. With `UserId` and `OrderId` as distinct types, the compiler catches the swap at the call site, every time.

### The orphan rule, and how wrapping sidesteps it

Rust has a rule (the "orphan rule") that blocks you from implementing a trait for a type when **you own neither the trait nor the type**. This exists to prevent two different crates from both implementing the same foreign trait for the same foreign type in incompatible ways. Concretely: you can't write `impl std::fmt::Display for Vec<String>` in your own crate, because you own neither `Display` (that's `std`'s) nor `Vec` (also `std`'s).

Wrapping the foreign type in a newtype *you* define fixes this — now you own the type (the wrapper), even though the trait is still foreign:

```rust,editable
use std::fmt;

struct Names(Vec<String>);

impl fmt::Display for Names {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0.join(", "))
    }
}

fn main() {
    let names = Names(vec!["Alice".to_string(), "Bob".to_string()]);
    println!("{}", names); // Alice, Bob
}
```

**What the compiler is thinking:** the orphan rule only cares about the type in the `impl ... for TYPE` slot. `Names` is a type defined right here in this crate, so `impl fmt::Display for Names` is allowed — even though `Display` itself comes from `std` and the data inside is still a `Vec<String>`.

### Getting at the inner value

A newtype doesn't automatically inherit the wrapped type's methods — `Meters` doesn't gain `f64`'s methods just by wrapping one. You reach in with `.0` (tuple structs index their single field as `.0`):

```rust,editable
struct Meters(f64);

fn main() {
    let d = Meters(42.0);
    let doubled = Meters(d.0 * 2.0); // reach in with .0, then rewrap
    println!("{}", doubled.0);
}
```

For a wrapper you want to feel more like the type it holds (e.g. calling `String` methods directly on a newtype around `String`), implement `Deref` so `.` auto-forwards to the inner value — or implement `From`/`Into` so converting between the wrapper and the inner type is a clean `.into()` instead of manual `.0` plumbing everywhere.

## Common mistakes

- **Overusing newtypes for every primitive.** Wrapping every `u64` and `String` in the codebase adds `.0` noise everywhere and slows readers down. Reach for a newtype when mixing two values up would be a *real bug* (IDs, units, currencies) — not reflexively.
- **Expecting inherited methods.** `struct Meters(f64)` does not gain `f64::sqrt()` or arithmetic operators automatically. You need `.0` to get at the inner value, or explicit trait impls (`Deref`, `Add`, ...) to forward behavior.
- **Forgetting the newtype has no `Display`/`Debug` by default.** Printing a bare `Meters(1.8)` with `{}` fails to compile until you either `#[derive(Debug)]` (for `{:?}`) or implement `Display` yourself (for `{}`) — wrapping a printable type doesn't make the wrapper printable.
- **Reaching for a newtype when the orphan rule isn't actually the problem.** If you own the type already, just `impl Trait for YourType` directly — no wrapper needed. Newtypes solve orphan-rule blocks and type confusion, not every design problem.

## Your turn

This function tries to print a `Meters` value directly. It doesn't compile:

```rust,editable
struct Meters(f64);

fn describe_distance(m: Meters) {
    println!("distance: {} meters", m);
}

fn main() {
    let d = Meters(42.0);
    describe_distance(d);
}
```

<details><summary>Show solution</summary>

The error is `Meters doesn't implement std::fmt::Display` (or `{:?}` isn't implemented either, since there's no `derive(Debug)`). Wrapping an `f64` in `Meters` does **not** make `Meters` itself printable — the newtype is a brand new type with no methods or trait impls of its own by default. Reach into the wrapper with `.0` to get the printable `f64` back out:

```rust,editable
struct Meters(f64);

fn describe_distance(m: Meters) {
    println!("distance: {} meters", m.0); // .0 gets the inner f64
}

fn main() {
    let d = Meters(42.0);
    describe_distance(d); // distance: 42 meters
}
```

(Alternatively, `#[derive(Debug)]` on `Meters` and printing with `{:?}` would also compile — but it prints `Meters(42.0)`, not a clean `42`. Implementing `Display` by hand gives full control over the format.)

</details>

## Quick check

<div class="quiz" data-topic="newtype-pattern"></div>

## Remember this

- `struct Meters(f64);` creates a type distinct from `f64` at compile time, at zero cost at runtime.
- A newtype prevents accidentally passing a `UserId` where an `OrderId` is expected, even though both are the same primitive underneath.
- The orphan rule blocks `impl ForeignTrait for ForeignType` — wrapping `ForeignType` in a newtype you own sidesteps it, because you now own the type in the `impl` slot.
- Access the inner value with `.0`, or implement `Deref`/`From` to make the wrapper more ergonomic to use.

## Go deeper

- [Rust Book - Using the Newtype Pattern](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html#using-the-newtype-pattern-to-implement-external-traits-on-external-types) — Newtype and the orphan rule.

**Next:**

- [Operator overloading](../abstractions/operator-overloading.md)
- [Generics](../abstractions/generics.md)

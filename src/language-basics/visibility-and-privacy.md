# Visibility and privacy

> **Beginner** · Language basics

## What & why

Think of modules as rooms in a house. Anything you put in a room stays in that room — and in any room nested inside it — unless you put a sign on the door saying it's open. That's Rust's privacy model: **everything is private by default**, scoped to the module that defines it and that module's descendants. Deciding what to mark `pub`, and how widely, is how a crate keeps a small, stable public API while its internals stay free to change.

## The idea, slowly

### Private by default

```rust,editable
mod kitchen {
    fn secret_recipe() -> &'static str {
        "garlic butter"
    }

    pub fn serve() -> &'static str {
        secret_recipe() // fine: same module can see its own private items
    }
}

fn main() {
    println!("{}", kitchen::serve()); // OK: serve is pub
    // println!("{}", kitchen::secret_recipe()); // ERROR: private
}
```

`secret_recipe` has no visibility modifier, so it's private to `kitchen` — visible to code inside `kitchen` (like `serve`), invisible to everything outside it (like `main`). `serve` is marked `pub`, so it's the crack in the door that lets outside code reach in.

### `pub`: open to anyone who can reach the module

`pub` exposes an item to any code that can name the path to it — including, if this crate is published as a library, code outside the crate entirely. It's the widest visibility Rust has.

### `pub(crate)`: open within your crate, closed to the outside world

```rust,editable
mod inner {
    pub(crate) fn helper() -> i32 { 42 } // visible anywhere in this crate...
    pub fn public_api() -> i32 { helper() } // ...but only this is visible outside it
}

fn main() {
    println!("{}", inner::helper());     // OK: same crate
    println!("{}", inner::public_api()); // OK: fully public
}
```

If this crate were published as a library, downstream users could call `public_api()` but would have no way to reach `helper()` at all — `pub(crate)` is perfect for "shared internal plumbing" that different modules of *your own* code need to call, without it becoming part of your promised API.

### `pub(super)`: open to just the parent module

```rust,editable
mod outer {
    pub fn from_outer() -> i32 {
        inner::only_for_outer()
    }

    mod inner {
        pub(super) fn only_for_outer() -> i32 { 7 } // visible to `outer`, no further
    }
}

fn main() {
    println!("{}", outer::from_outer());
    // outer::inner::only_for_outer(); // ERROR: not visible outside `outer`
}
```

`pub(super)` is a narrower `pub(crate)` — "visible one level up," useful when a submodule needs to hand something back to its immediate parent without exposing it any further.

### `pub use`: re-exporting so callers don't need your internal layout

```rust,editable
mod shapes {
    pub mod circle {
        pub fn area(r: f64) -> f64 {
            std::f64::consts::PI * r * r
        }
    }
}

pub use shapes::circle::area; // flatten the path at the crate root

fn main() {
    println!("{:.2}", area(2.0));                  // via the re-export
    println!("{:.2}", shapes::circle::area(2.0));   // the real path still works too
}
```

`pub use` re-exports an item under a new, usually shorter, path. Callers write `area(...)` instead of `shapes::circle::area(...)`, and if you later reorganize your internal modules, you only need to update the `pub use` line — callers' code doesn't break.

### A `pub` struct's fields are still private by default

```rust,editable
mod account {
    pub struct Account {
        pub id: u32,
        balance: f64, // private, even though Account itself is pub
    }

    impl Account {
        pub fn new(id: u32, balance: f64) -> Account {
            Account { id, balance }
        }

        pub fn balance(&self) -> f64 {
            self.balance
        }
    }
}

fn main() {
    let acc = account::Account::new(1, 100.0);
    println!("{}", acc.id);        // OK: `id` is pub
    println!("{}", acc.balance()); // OK: through a public getter
    // println!("{}", acc.balance); // ERROR: field `balance` is private
}
```

**What the compiler is thinking:** `pub` on a struct only answers "can code outside this module even name this type?" It says nothing about the fields — each field's visibility is decided separately, field by field. This is what makes "public struct, private field, public getter" such a common pattern: it lets you change how `balance` is stored later without breaking anyone who calls `.balance()`.

## Common mistakes

- **Marking a struct `pub` and assuming its fields come along for free.** Each field needs its own `pub`; a `pub` struct with no `pub` fields is unconstructible and unreadable from outside its module (unless you provide public methods).
- **Reaching for `pub` "to be safe."** Every `pub` item is a permanent promise to your callers — widening visibility later is easy, narrowing it is a breaking change. Start with the narrowest visibility that works (`pub(crate)`/`pub(super)`) and widen only when something genuinely needs to leave the crate.
- **Forgetting `pub(crate)` is invisible to downstream users of a published crate.** It's for sharing across your own modules, not for exposing an API.
- **Expecting privacy to be file-scoped.** Privacy follows the module tree, not the filesystem — two modules can share a file, or one module can span several files, and visibility rules only ever care about the module structure.

## Your turn

This program tries to construct an item type from outside the module that defines it.

```rust,editable
mod inventory {
    struct Item {
        name: String,
        pub price: f64,
    }

    pub fn cheapest_name() -> String {
        let item = Item { name: String::from("Widget"), price: 9.99 };
        item.name
    }
}

fn main() {
    println!("{}", inventory::cheapest_name());
    let item = inventory::Item { name: String::from("Gadget"), price: 4.5 };
    println!("{}", item.price);
}
```

<details><summary>Show solution</summary>

`Item` itself has no `pub` — the *type* is private to `inventory`, so `inventory::Item` can't even be named from `main`, regardless of any individual field's visibility. Making `Item` public but keeping `name` private also means outside code can't build one with a struct literal (it can't fill in a private field) — so it needs a public constructor:

```rust,editable
mod inventory {
    pub struct Item {
        name: String,
        pub price: f64,
    }

    impl Item {
        pub fn new(name: &str, price: f64) -> Item {
            Item { name: name.to_string(), price }
        }
    }

    pub fn cheapest_name() -> String {
        let item = Item::new("Widget", 9.99);
        item.name
    }
}

fn main() {
    println!("{}", inventory::cheapest_name());
    let item = inventory::Item::new("Gadget", 4.5);
    println!("{}", item.price); // OK: `price` is pub
}
```

`Item` is now `pub` so its name is reachable from outside `inventory`; `name` stays private (only `inventory`'s own code ever touches it directly); and `Item::new` is the public door for constructing one, since a struct literal can't set a private field from outside its module.

</details>

## Quick check

<div class="quiz" data-topic="visibility-and-privacy"></div>

## Remember this

- Everything is private by default, scoped to its defining module and that module's descendants.
- `pub` exposes an item to anyone who can reach the module — including, for a library crate, outside users.
- `pub(crate)` exposes something across your whole crate, but never to downstream users of a published crate.
- `pub(super)` exposes something to just the parent module, one level up.
- `pub use` re-exports an item under a new path, letting callers ignore your internal module layout.
- A `pub` struct's fields are still private unless each one is marked `pub` individually.

## Go deeper

- [Rust Reference - Visibility and Privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html) — Exact privacy rules.

**Next:**

- [Structs](../language-basics/structs.md)
- [Workspaces and crates](../runtime-and-ecosystem/workspaces-and-crates.md)

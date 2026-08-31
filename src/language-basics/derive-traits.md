# Derivable traits

> **Beginner** · Language basics

## What & why

Every struct or enum you write eventually needs the same handful of boring abilities: print itself for debugging, get copied, get compared for equality, get a sensible default, get sorted. Writing those by hand for every type would be pure boilerplate — so Rust lets the compiler generate a mechanical, field-by-field implementation with one line: `#[derive(...)]`. It's the single most common attribute in everyday Rust code.

## The idea, slowly

### `#[derive(Debug)]` — printable for developers

```rust,editable
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{p:?}"); // Point { x: 1, y: 2 }
}
```

This generates an implementation of `std::fmt::Debug` that prints the struct's name and every field's value. It's the first derive most people reach for, because without it `{:?}` — and therefore most debugging — doesn't compile.

### `#[derive(Clone)]` and `#[derive(Copy)]`

`Clone` gives you an explicit `.clone()` method that makes a deep copy — you always have to *ask* for it. `Copy` is different: it's a marker that changes what assignment *means*. Without `Copy`, `let b = a;` **moves** `a` into `b` (`a` becomes unusable). With `Copy`, that same line silently duplicates the value instead, and both `a` and `b` stay usable.

```rust,editable
#[derive(Debug, Clone, Copy)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = a; // copied, not moved — `a` is still valid
    println!("{a:?} {b:?}");
}
```

`Copy` only works when *every* field is itself `Copy` — no `String`, `Vec`, `Box`, or anything else that owns heap data, because those can't be safely duplicated by just copying bits. And `Copy` requires `Clone` (`trait Copy: Clone`) — a `Copy` type is always also a `Clone` type, since "copy" is really just "the cheap, implicit version of clone."

### `#[derive(PartialEq, Eq)]` — equality

`PartialEq` gives you `==` and `!=`, comparing every field. `Eq` is a marker with no methods — it promises the comparison is *fully* reflexive (`a == a` is always `true`), which floats can't promise because `NaN != NaN`. That's why `f64`/`f32` implement `PartialEq` but not `Eq`.

```rust,editable
#[derive(Debug, PartialEq, Eq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = Point { x: 1, y: 2 };
    println!("{}", a == b); // true — compared field by field
}
```

### `#[derive(Hash)]` — usable as a HashMap/HashSet key

```rust,editable
use std::collections::HashSet;

#[derive(Debug, PartialEq, Eq, Hash)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut seen = HashSet::new();
    seen.insert(Point { x: 1, y: 2 });
    println!("{}", seen.contains(&Point { x: 1, y: 2 })); // true
}
```

`HashMap`/`HashSet` keys need both `Eq` and `Hash` — `Eq` so two equal keys are recognized as the same key, `Hash` so they land in the same bucket.

### `#[derive(Default)]` — a sensible zero value

```rust,editable
#[derive(Debug, Default)]
struct Config {
    verbose: bool,
    retries: u32,
    name: String,
}

fn main() {
    let c = Config::default();
    println!("{c:?}"); // Config { verbose: false, retries: 0, name: "" }

    let c2 = Config { retries: 3, ..Default::default() }; // override just one field
    println!("{c2:?}");
}
```

`Default` fills every field with *its* type's default (`false`, `0`, `""`, `None`, ...). The `..Default::default()` struct-update syntax is the everyday pattern for "give me the default, except for this one field."

### `#[derive(PartialOrd, Ord)]` — comparison and sorting

Derived ordering compares fields **in declaration order**, top to bottom — exactly like comparing tuples. The first field is the most significant.

```rust,editable
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Version {
    major: u32,
    minor: u32,
    patch: u32,
}

fn main() {
    let mut versions = vec![
        Version { major: 1, minor: 2, patch: 0 },
        Version { major: 1, minor: 0, patch: 5 },
        Version { major: 2, minor: 0, patch: 0 },
    ];
    versions.sort();
    println!("{versions:?}"); // ordered by major, then minor, then patch
}
```

`PartialOrd` gives you `<`, `<=`, `>`, `>=`; `Ord` (which requires `Eq`) is what `.sort()`, `BTreeMap` keys, and `BinaryHeap` actually need, because it promises *every* pair of values can be compared — floats can't derive `Ord` for the same `NaN` reason they can't derive `Eq`.

### Why deriving fails, and when to hand-write instead

**What the compiler is thinking:** `#[derive(Trait)]` expands to "implement `Trait` by calling `Trait`'s method on every field, in order." That only type-checks if every field's type *already* implements `Trait`. One field without `Debug` blocks `#[derive(Debug)]` on the whole struct — the derive doesn't skip it, it fails to compile.

Hand-write the trait instead of deriving when the mechanical, field-by-field behavior isn't the behavior you want:

- A case-insensitive string wrapper needs custom `PartialEq`/`Hash` so `"Rust"` and `"rust"` compare and hash as equal.
- A struct with an internal cache field shouldn't have that field affect equality.
- A priority queue often wants `Ord` based on just one field (or reversed), not every field in declaration order.

## Common mistakes

- **Deriving `Copy` on a struct with a `String`/`Vec`/`Box` field.** Fails with "the trait `Copy` may not be implemented for this type" — those fields own heap data and can't be bitwise-duplicated safely.
- **Deriving `Eq`/`Ord` on a struct containing an `f64`/`f32` field.** Floats aren't `Eq`/`Ord` because of `NaN`; you can derive `PartialEq`/`PartialOrd` on them, but not the stricter traits.
- **Assuming a missing field trait gets silently skipped.** It doesn't — the whole `#[derive(...)]` fails to compile if any field lacks that trait.
- **Assuming derived ordering compares "by importance."** It compares fields in the order you *wrote* them in the struct — reorder the fields to change sort priority, or hand-write `Ord`.

## More examples

### Snapshotting a game save before risking it
`Clone` gives a checkpoint an independent copy to fall back to — mutating `current` afterward can't touch `checkpoint`, because they no longer share any data.

```rust,editable
#[derive(Debug, Clone)]
struct GameSave {
    level: u32,
    hp: u32,
}

fn main() {
    let checkpoint = GameSave { level: 3, hp: 80 };
    let mut current = checkpoint.clone(); // keep the checkpoint safe before risking hp
    current.hp -= 30; // took damage

    println!("checkpoint: {:?}", checkpoint);
    println!("current: {:?}", current);
}
```

### Deduplicating scanned badge IDs at a gate
`PartialEq`, `Eq`, and `Hash` together are what let a struct sit inside a `HashSet` — here that's the difference between silently re-admitting a badge and catching a repeat scan.

```rust,editable
use std::collections::HashSet;

#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
struct BadgeId(u32);

fn main() {
    let mut checked_in: HashSet<BadgeId> = HashSet::new();
    let scans = [BadgeId(101), BadgeId(102), BadgeId(101), BadgeId(103)];

    for badge in scans {
        if !checked_in.insert(badge) {
            println!("badge {} already checked in", badge.0);
        }
    }
    println!("{} unique badges scanned", checked_in.len());
}
```

### Sorting a to-do list by priority
Deriving `Ord` on `Task` means `.sort()` just works — it compares `priority` first because that's the field declared first, exactly the order a to-do list should sort by.

```rust,editable
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Task {
    priority: u8,
    name: String,
}

fn main() {
    let mut todos = vec![
        Task { priority: 2, name: String::from("write report") },
        Task { priority: 1, name: String::from("fix critical bug") },
        Task { priority: 3, name: String::from("reply to email") },
    ];

    todos.sort();

    for task in &todos {
        println!("[{}] {}", task.priority, task.name);
    }
}
```

### Defaulting an API pagination request
`Default` plus `..Default::default()` lets a request override just the fields a caller cares about — here, only the page number — while every other field falls back sensibly.

```rust,editable
#[derive(Debug, Default)]
struct Pagination {
    page: u32,
    per_page: u32,
    sort_desc: bool,
}

fn main() {
    let default_request = Pagination::default();
    println!("{:?}", default_request);

    let page_two = Pagination { page: 2, ..Default::default() };
    println!("{:?}", page_two);
}
```

## Your turn

This struct tries to derive `Copy`, but one of its fields makes that impossible.

```rust,editable
#[derive(Debug, Clone, Copy)]
struct Player {
    name: String,
    score: u32,
}

fn main() {
    let p1 = Player { name: String::from("Ferris"), score: 10 };
    let p2 = p1; // relies on Copy
    println!("{} {}", p1.name, p2.name);
}
```

<details><summary>Show solution</summary>

`String` owns a heap allocation and doesn't implement `Copy`, so `Player` can't derive `Copy` either — the compiler rejects the whole `#[derive(...)]` line. Keep `Clone` (which `String` does support) and copy explicitly when you need two independent values:

```rust,editable
#[derive(Debug, Clone)]
struct Player {
    name: String,
    score: u32,
}

fn main() {
    let p1 = Player { name: String::from("Ferris"), score: 10 };
    let p2 = p1.clone(); // explicit deep copy, since Player isn't Copy
    println!("{} {}", p1.name, p2.name);
}
```

</details>

## Quick check

<div class="quiz" data-topic="derive-traits"></div>

## Remember this

- `#[derive(Debug)]` enables `{:?}` printing; add it to nearly every type you define.
- `Clone` is an explicit deep copy (`.clone()`); `Copy` makes assignment implicitly duplicate — only for types where every field is itself `Copy`, and `Copy` requires `Clone`.
- `PartialEq`/`Eq` enable `==`; `PartialOrd`/`Ord` enable `<` and sorting — floats can't derive `Eq`/`Ord` because of `NaN`.
- `Hash` (together with `Eq`) is what lets a type be a `HashMap`/`HashSet` key.
- `Default` fills every field with its type's default value; `..Default::default()` overrides just some fields.
- Deriving requires *every* field to implement that trait — one missing field fails the whole derive.
- Hand-write a trait instead of deriving when the mechanical field-by-field behavior isn't the behavior you actually want.

## Go deeper

- [Rust Book - Derivable Traits (Appendix C)](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html) — Every standard derivable trait.

**Next:**

- [Enums](../language-basics/enums.md)
- [Operator overloading](../abstractions/operator-overloading.md)

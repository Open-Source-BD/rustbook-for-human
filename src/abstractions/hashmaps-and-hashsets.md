# HashMaps and HashSets

> **Intermediate** · Abstractions

## What & why

A `Vec` finds things by *position* — index 0, 1, 2. A lot of real data doesn't have a natural position; it has a natural *name*. "How many times did `"the"` appear?" "What's the user with id `42`?" `HashMap<K, V>` is Rust's lookup table: you choose a key, and it maps that key to a value, like a real dictionary maps a word to its definition. `HashSet<T>` is the same idea with the values dropped — it only tracks *which keys exist*, for fast membership checks and de-duplication.

## The idea, slowly

### `HashMap` basics: insert, get, overwrite

```rust,editable
use std::collections::HashMap;

fn main() {
    let mut ages: HashMap<&str, i32> = HashMap::new();
    ages.insert("Alice", 30);
    ages.insert("Bob", 25);

    // insert on an existing key OVERWRITES the old value
    ages.insert("Bob", 26);

    match ages.get("Alice") {
        Some(age) => println!("Alice is {}", age),
        None => println!("no Alice on file"),
    }

    for (name, age) in &ages {
        println!("{} is {}", name, age);
    }
}
```

- **`use std::collections::HashMap;`** — unlike `Vec`, `HashMap` isn't automatically in scope. Forget this line and you get `cannot find type 'HashMap' in this scope`.
- **`.insert(key, value)`** adds a pair, or **replaces** the value if the key is already present — a map holds each key exactly once.
- **`.get(key)`** returns `Option<&V>` — `Some(&value)` if the key exists, `None` if it doesn't — because a lookup by key can always miss.

### The entry API: insert-or-update without a double lookup

The single most common `HashMap` pattern is "if this key exists, update its value; otherwise, insert a default." Writing that with `get`/`insert` means checking the map twice. `.entry(key).or_insert(default)` does it in one step, and hands back a mutable reference you can modify directly:

```rust,editable
use std::collections::HashMap;

fn main() {
    let text = "the quick fox jumps over the lazy fox";
    let mut counts: HashMap<&str, i32> = HashMap::new();

    for word in text.split_whitespace() {
        // "give me a mutable reference to word's count, inserting 0 first if missing"
        let count = counts.entry(word).or_insert(0);
        *count += 1;
    }

    let mut pairs: Vec<_> = counts.into_iter().collect();
    pairs.sort();
    println!("{:?}", pairs);
    // [("fox", 2), ("jumps", 1), ("lazy", 1), ("over", 1), ("quick", 1), ("the", 2)]
}
```

`.entry(word)` looks at the slot for `word` without removing it from the map. `.or_insert(0)` says "if that slot is empty, put `0` there first" — either way, it hands back `&mut i32` pointing straight at the count for `word`. `*count += 1` then dereferences and increments it. One line, one lookup, no separate "does it exist" branch. This is the idiomatic way to build counts, group items, or accumulate into a map — reach for `entry` before reaching for `get` + `insert`.

`or_insert_with(|| ...)` is the lazy version, for when the default is expensive to build (it only runs the closure if the key was actually missing); `or_default()` uses the value type's `Default` implementation instead of a value you supply.

### Custom key types need `Eq` and `Hash`

Any type can be a `HashMap` key *if* the compiler can hash it and compare it for equality — that's what makes "look up this exact key" possible. Built-in types like `&str` and `i32` already implement both. Your own struct needs to opt in explicitly:

```rust,editable
use std::collections::HashMap;

#[derive(PartialEq, Eq, Hash, Debug)]
struct UserId(u32);

fn main() {
    let mut names: HashMap<UserId, &str> = HashMap::new();
    names.insert(UserId(1), "Alice");
    names.insert(UserId(2), "Bob");

    println!("{:?}", names.get(&UserId(1))); // Some("Alice")
}
```

`#[derive(PartialEq, Eq, Hash)]` asks the compiler to generate "compare field-by-field" and "hash field-by-field" for `UserId` automatically. Without it, `HashMap<UserId, _>` fails to compile with `the trait bound 'UserId: Eq' is not satisfied` (and the same for `Hash`) — the map genuinely cannot function as a lookup table without both. `Eq` is what lets it confirm "is this the same key," and `Hash` is what lets it find the right bucket in the first place.

### `HashSet`: membership and uniqueness, no values attached

A `HashSet<T>` is, conceptually, a `HashMap<T, ()>` — every key present, no values to go with them. Use it whenever the question is just "have I seen this?" or "give me only the distinct items":

```rust,editable
use std::collections::HashSet;

fn main() {
    let mut seen: HashSet<&str> = HashSet::new();

    for word in ["apple", "banana", "apple", "cherry", "banana"] {
        if seen.insert(word) {
            println!("new word: {}", word); // only prints on the first sighting
        }
    }

    println!("distinct count: {}", seen.len()); // 3
    println!("contains banana: {}", seen.contains("banana")); // true
}
```

`.insert(value)` returns `true` if the value was newly added and `false` if it was already present — that return value is what makes the "only print on first sighting" trick work in one line. `.contains(value)` is the O(1)-on-average membership check that's the whole reason to reach for a `HashSet` instead of scanning a `Vec` with `.contains()` (which is O(n)).

### Iteration order is not guaranteed

```rust,editable
use std::collections::HashMap;

fn main() {
    let mut m = HashMap::new();
    m.insert("z", 1);
    m.insert("a", 2);
    m.insert("m", 3);

    for (k, _) in &m {
        print!("{} ", k); // order is unspecified — don't rely on it
    }
    println!();
}
```

`HashMap` and `HashSet` scatter keys across memory based on their hash, specifically so lookups are fast — there's no relationship between insertion order and iteration order, and it can even change between runs of the *same* program (Rust randomizes the hash seed per-process as a security measure against denial-of-service attacks on the hashing). If you need sorted or insertion-ordered iteration, that's not what `HashMap` is for — the next lesson covers `BTreeMap`, which keeps keys sorted by design.

## Common mistakes

- **Forgetting `use std::collections::HashMap;`.** It's in the standard library but not in the default prelude. Missing the `use` gives `cannot find type 'HashMap' in this scope`.
- **Using `get`+`insert` where `entry` would do the job in one lookup.** Not wrong, just more code and an extra map traversal — `counts.entry(word).or_insert(0)` replaces a multi-line `if let`/`else` almost every time.
- **A custom key type missing `Eq`/`Hash`.** The error is a compile-time `the trait bound '...: Eq' is not satisfied` (or `Hash`). Add `#[derive(PartialEq, Eq, Hash)]` to the struct — it's a compile error, not a runtime surprise, precisely so you catch it before shipping.
- **Assuming a `HashMap` preserves insertion order.** It doesn't, and the order can differ between runs of the same program. Don't build logic that depends on it.
- **Calling `.insert()` on a `HashMap` and expecting an error on a duplicate key.** It silently overwrites the old value instead. If you need to know whether a key already existed, check the return value of `.insert()` — it's `Some(old_value)` on overwrite, `None` if the key was new.

## Your turn

This program wants to track which `Point`s have been visited, but it doesn't compile.

```rust,editable
use std::collections::HashMap;

struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut visited: HashMap<Point, bool> = HashMap::new();
    visited.insert(Point { x: 1, y: 2 }, true);

    println!("{}", visited.contains_key(&Point { x: 1, y: 2 }));
}
```

<details><summary>Show solution</summary>

`Point` has no `Eq` or `Hash` implementation, so the compiler can't put it in a `HashMap` as a key — it wouldn't know how to hash a `Point` into a bucket, or how to confirm two `Point`s are "the same key." The error is `the trait bound 'Point: Eq' is not satisfied` (and the same for `Hash`). Derive both:

```rust,editable
use std::collections::HashMap;

#[derive(PartialEq, Eq, Hash)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut visited: HashMap<Point, bool> = HashMap::new();
    visited.insert(Point { x: 1, y: 2 }, true);

    println!("{}", visited.contains_key(&Point { x: 1, y: 2 })); // true
}
```

`Hash` needs `Eq` (not just `PartialEq`) alongside it — `Eq` promises the equality check is total and reflexive, which is what lets the map trust "same hash bucket, then compare equal" as proof of "same key."

</details>

## Quick check

<div class="quiz" data-topic="hashmaps-and-hashsets"></div>

## Remember this

- `HashMap<K, V>` looks up values by key; `.insert(k, v)` adds or overwrites, `.get(k)` returns `Option<&V>`.
- `map.entry(key).or_insert(default)` is the standard insert-or-update pattern — one lookup instead of two.
- Custom key types need `#[derive(PartialEq, Eq, Hash)]`; a missing derive is a compile error, not a runtime bug.
- `HashSet<T>` tracks membership and uniqueness only — `.insert()` returns `false` if the value was already present.
- Iteration order is unspecified and can change between runs — use `BTreeMap`/`BTreeSet` when order matters.

## Go deeper

- [std::collections::HashMap docs](https://doc.rust-lang.org/std/collections/struct.HashMap.html) — Entry API and full method list.

**Next:**

- [BTreeMap, VecDeque, and BinaryHeap](../abstractions/other-collections.md)
- [Iterator basics](../abstractions/iterator-basics.md)

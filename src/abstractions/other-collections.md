# BTreeMap, VecDeque, and BinaryHeap

> **Intermediate** · Abstractions

## What & why

`Vec` and `HashMap` cover most everyday needs, but the standard library ships a few more collections built for specific access patterns. Picking the right one is about *how* you touch the data, not just *what* you store: do you need keys to come out sorted? Do you need to add and remove from *both* ends cheaply? Do you always want "the biggest one, right now"? `BTreeMap`/`BTreeSet`, `VecDeque`, and `BinaryHeap` each answer one of those questions well.

## The idea, slowly

### `BTreeMap` and `BTreeSet`: sorted keys, on purpose

A `HashMap` gives you fast lookups but scrambled iteration order. A `BTreeMap<K, V>` gives up a little lookup speed in exchange for keeping keys **always in sorted order**:

```rust,editable
use std::collections::BTreeMap;

fn main() {
    let mut scores = BTreeMap::new();
    scores.insert("charlie", 3);
    scores.insert("alice", 9);
    scores.insert("bob", 5);

    // iterates in KEY order, every time, regardless of insertion order
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }
    // alice: 9
    // bob: 5
    // charlie: 3

    // range queries: "give me everything from bob onward"
    for (name, score) in scores.range("bob"..) {
        println!("from bob: {} = {}", name, score);
    }
}
```

`HashMap` is O(1) on average for `get`/`insert`; `BTreeMap` is O(log n) — technically slower, but the difference rarely matters in practice, and you get two things `HashMap` cannot offer: deterministic, sorted iteration, and `.range(...)` queries ("every key between X and Y") which are impossible to express efficiently on a hash table. Reach for `BTreeMap` when you need the data *in order* — leaderboards, timestamps, anything you'd otherwise sort after the fact — and `HashMap` when you just need fast point lookups and don't care about order.

`BTreeSet<T>` is to `BTreeMap` what `HashSet` is to `HashMap`: a sorted set of unique values, with the same `.insert()`/`.contains()` interface, iterated in ascending order.

Just like a `HashMap` key needs `Eq + Hash`, a `BTreeMap` key needs `Ord` (which itself requires `Eq` and `PartialOrd`) — the map needs to be able to say "is this key less than, equal to, or greater than that one" to keep itself sorted:

```rust,editable
use std::collections::BTreeMap;

#[derive(PartialEq, Eq, PartialOrd, Ord, Debug)]
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let mut releases = BTreeMap::new();
    releases.insert(Version { major: 1, minor: 2 }, "bugfix release");
    releases.insert(Version { major: 1, minor: 0 }, "initial release");
    releases.insert(Version { major: 2, minor: 0 }, "breaking release");

    for (v, note) in &releases {
        println!("{}.{}: {}", v.major, v.minor, note);
    }
    // 1.0: initial release
    // 1.2: bugfix release
    // 2.0: breaking release
}
```

`#[derive(Ord)]` compares struct fields **in declaration order** — `major` first, then `minor` as a tiebreaker — which is exactly the ordering you'd want for a version number.

### `VecDeque`: cheap push/pop at both ends

`Vec` is fast at the back (`push`/`pop` are O(1)) but slow at the front — `insert(0, x)` or removing the first element has to shift every other element over, an O(n) operation. `VecDeque` ("double-ended queue") is a ring buffer that makes *both* ends O(1):

```rust,editable
use std::collections::VecDeque;

fn main() {
    let mut queue: VecDeque<i32> = VecDeque::new();

    queue.push_back(1);  // [1]
    queue.push_back(2);  // [1, 2]
    queue.push_front(0); // [0, 1, 2]  — O(1), unlike Vec::insert(0, _)

    println!("{:?}", queue);

    while let Some(front) = queue.pop_front() {
        print!("{} ", front); // 0 1 2 — first in, first out
    }
    println!();
}
```

Internally, a `VecDeque` is still backed by one contiguous allocation, but it's treated as a *ring*: the logical "front" can start partway through the buffer and wrap around, so adding to the front never has to shift everything else. That makes it the natural fit for anything queue-shaped: a task queue processed in arrival order, a sliding window that drops old entries off the front while new ones arrive at the back, or a breadth-first-search frontier. `VecDeque` can also be indexed (`queue[i]`) and iterated like a `Vec`, so it isn't purely a specialist tool — but plain `Vec` is still the better default when you only ever push and pop the *back*, since it has slightly less overhead.

### `BinaryHeap`: always pop the biggest

A `BinaryHeap<T>` doesn't keep its elements in any visible order — but calling `.pop()` always hands you back the **largest** remaining element, in O(log n):

```rust,editable
use std::collections::BinaryHeap;

fn main() {
    let mut heap = BinaryHeap::new();
    heap.push(3);
    heap.push(7);
    heap.push(1);
    heap.push(5);

    while let Some(biggest) = heap.pop() {
        print!("{} ", biggest); // 7 5 3 1 — largest first, every time
    }
    println!();
}
```

This is a **max-heap** by default, and it's the standard tool for a priority queue: "process the most urgent task next," "always merge the two smallest lists first," "keep the top-K largest values seen so far." `T` needs `Ord` for the same reason `BTreeMap` keys do — the heap has to be able to compare elements to know which one is "biggest."

### A min-heap with `std::cmp::Reverse`

Sometimes you want the *smallest* element first instead — cheapest task, earliest deadline. `BinaryHeap` doesn't have a separate "min mode"; instead, you flip the ordering by wrapping each value in `std::cmp::Reverse`, which swaps what "greater" means for that value:

```rust,editable
use std::collections::BinaryHeap;
use std::cmp::Reverse;

fn main() {
    let mut min_heap = BinaryHeap::new();
    min_heap.push(Reverse(3));
    min_heap.push(Reverse(7));
    min_heap.push(Reverse(1));
    min_heap.push(Reverse(5));

    while let Some(Reverse(smallest)) = min_heap.pop() {
        print!("{} ", smallest); // 1 3 5 7 — smallest first
    }
    println!();
}
```

`Reverse(x)` is a thin wrapper whose `Ord` implementation is the *opposite* of `x`'s — so "the heap's biggest `Reverse` value" is really "the smallest wrapped value." Popping still calls the same `.pop()`; you just unwrap the `Reverse` to get the plain value back out. This is the idiomatic way to get min-heap behavior without a different collection type.

## Common mistakes

- **Defaulting to `VecDeque` everywhere.** If you only ever push and pop the *back*, plain `Vec` has less overhead and is the better default — reach for `VecDeque` specifically when you need the *front* to be cheap too.
- **Expecting `BinaryHeap` iteration to come out sorted.** Only repeated `.pop()` guarantees largest-first order; iterating with `for x in &heap` (or `.iter()`) visits elements in unspecified internal order.
- **Pushing plain values when you wanted a min-heap.** `BinaryHeap::push(x)` always feeds the max-heap ordering. Forgetting to wrap in `Reverse(x)` gives you largest-first when you wanted smallest-first — a logic bug, not a compile error, so it's easy to miss.
- **Giving a `BTreeMap` or `BinaryHeap` a key/element type without `Ord`.** The error is `the trait bound '...: Ord' is not satisfied`. For a custom struct, add `#[derive(PartialEq, Eq, PartialOrd, Ord)]` — all four are needed, since `Ord` itself depends on the other three.
- **Choosing `BTreeMap` purely out of habit.** If you never need sorted iteration or range queries, `HashMap`'s average O(1) lookups are faster than `BTreeMap`'s O(log n) — don't pay for ordering you don't use.

## Your turn

This program wants a version-sorted release log using `BTreeMap`, but it doesn't compile.

```rust,editable
use std::collections::BTreeMap;

struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let mut releases: BTreeMap<Version, &str> = BTreeMap::new();
    releases.insert(Version { major: 1, minor: 0 }, "initial release");
    releases.insert(Version { major: 1, minor: 2 }, "bugfix release");

    for (v, note) in &releases {
        println!("{}.{}: {}", v.major, v.minor, note);
    }
}
```

<details><summary>Show solution</summary>

`Version` has no ordering implementation, so `BTreeMap` — which must keep its keys sorted at all times — has no way to decide where a new `Version` belongs relative to the others. The error is `the trait bound 'Version: Ord' is not satisfied`. Derive the full comparison chain:

```rust,editable
use std::collections::BTreeMap;

#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let mut releases: BTreeMap<Version, &str> = BTreeMap::new();
    releases.insert(Version { major: 1, minor: 0 }, "initial release");
    releases.insert(Version { major: 1, minor: 2 }, "bugfix release");

    for (v, note) in &releases {
        println!("{}.{}: {}", v.major, v.minor, note);
    }
    // 1.0: initial release
    // 1.2: bugfix release
}
```

`Ord` requires `Eq` and `PartialOrd` underneath it, so all four traits need deriving together. With them in place, `#[derive(Ord)]` compares `major` first and `minor` as the tiebreaker — field declaration order — which happens to be exactly the version ordering you want.

</details>

## Quick check

<div class="quiz" data-topic="other-collections"></div>

## Remember this

- `BTreeMap`/`BTreeSet` keep keys sorted at all times (O(log n) operations) and support range queries — pick them over `HashMap`/`HashSet` when order matters.
- Keys in a `BTreeMap`/`BTreeSet` need `Ord` (`#[derive(PartialEq, Eq, PartialOrd, Ord)]` on a custom struct).
- `VecDeque` gives O(1) push/pop at **both** the front and back, unlike `Vec` which is O(n) at the front — the natural fit for queues and sliding windows.
- `BinaryHeap` is a max-heap by default: `.pop()` always returns the largest remaining element.
- Wrap values in `std::cmp::Reverse` to get min-heap behavior out of the same `BinaryHeap`.

## Go deeper

- [std::collections module docs](https://doc.rust-lang.org/std/collections/index.html) — A comparison table of every std collection.

**Next:**

- [Strings and `str`](../abstractions/strings-and-str.md)

# Collections

> **Beginner** · Abstractions

## What & why

A collection is a container that holds *many* values and can **grow or shrink** while your program runs. The two you'll use constantly are `Vec` (a growable list) and `HashMap` (a lookup table of key → value). Arrays have a fixed size decided at compile time; collections don't, which is why almost all real programs lean on them.

## The idea, slowly

### `Vec`: a list that grows

`Vec<T>` (say "vector") is an ordered list of items, all of the same type `T`. Think of it as a row of numbered boxes that you can keep adding boxes to on the end.

```rust,editable
fn main() {
    let mut shopping = Vec::new(); // an empty list
    shopping.push("milk");         // add to the end
    shopping.push("bread");
    shopping.push("eggs");

    println!("I need {} items", shopping.len());
    println!("First item: {}", shopping[0]); // index from 0

    for item in &shopping {
        println!("- {}", item);
    }
}
```

Notice a few things:

- **`let mut`** — the list has to be `mut` (mutable) because `push` changes it. Leave off `mut` and the compiler says `cannot borrow shopping as mutable`.
- **`Vec::new()`** starts empty. The compiler figures out it's a `Vec` of `&str` from the first thing you `push`. If you push nothing, you'd need to tell it the type: `Vec::<i32>::new()`.
- **`shopping[0]`** reads by position, counting from `0`. Asking for an index that doesn't exist (like `shopping[99]`) **panics** — the program crashes on purpose rather than reading garbage.
- **`for item in &shopping`** — the `&` borrows the list so the loop can look without taking ownership. Without the `&`, the loop would *consume* the vector and you couldn't use it afterward.

There's a handy shortcut for building a vector with values already in it:

```rust,editable
fn main() {
    let nums = vec![10, 20, 30]; // the vec! macro
    println!("{:?}", nums);      // {:?} prints the whole list: [10, 20, 30]
}
```

`vec![...]` is a macro (note the `!`) that creates a `Vec` pre-filled. And `{:?}` is the "debug" placeholder — it can print whole collections at once, which plain `{}` can't.

### Safer access with `.get()`

Because `shopping[99]` crashes, Rust gives you `.get()` for when you're not sure the index exists. It hands back an `Option` instead of crashing:

```rust,editable
fn main() {
    let nums = vec![1, 2, 3];
    match nums.get(10) {
        Some(value) => println!("found {}", value),
        None => println!("nothing at index 10"),
    }
}
```

`Some(value)` means "yes, there was something here." `None` means "empty — no crash." You'll meet `Option` properly in the Error Handling lesson; for now just know `.get()` is the polite, crash-free way to index.

### `HashMap`: look things up by key

A `Vec` finds things by *position* (0, 1, 2...). A `HashMap<K, V>` finds things by a **key** you choose — a name, an id, anything. Think of a real dictionary: you look up a *word* (the key) to get its *definition* (the value).

```rust,editable
use std::collections::HashMap;

fn main() {
    let mut ages = HashMap::new();
    ages.insert("Alice", 30);
    ages.insert("Bob", 25);

    // look up by key
    if let Some(age) = ages.get("Alice") {
        println!("Alice is {}", age);
    }

    // overwriting a key replaces the old value
    ages.insert("Bob", 26);

    for (name, age) in &ages {
        println!("{} is {}", name, age);
    }
}
```

Key points:

- **`use std::collections::HashMap;`** — unlike `Vec`, `HashMap` isn't automatically available, so you bring it in with a `use` line at the top. Forgetting this gives `cannot find type HashMap in this scope`.
- **`.insert(key, value)`** adds a pair. Insert the same key again and it **overwrites** the old value — a map holds each key only once.
- **`.get("Alice")`** returns an `Option` again (`Some` if the key exists, `None` if not), because the key might not be there.
- **Order is not guaranteed.** Looping a `HashMap` may print entries in any order. If order matters, use a `Vec` or sort first.

## Common mistakes

- **Forgetting `mut` before pushing or inserting.** `push` and `insert` change the collection, so it must be declared `let mut`. The error is `cannot borrow as mutable`.
- **Indexing out of bounds.** `v[99]` on a short vector **panics at runtime** with `index out of bounds`. When unsure, use `v.get(99)` and handle the `Option`.
- **Forgetting `use std::collections::HashMap;`.** `HashMap` lives in the standard library but isn't in scope by default. Without the `use`, you get `cannot find type HashMap`.
- **Expecting a `HashMap` to keep insertion order.** It doesn't. If you loop it and print, the order can change run to run. Don't rely on it.
- **Trying to print a collection with `{}`.** Use `{:?}` (debug) for whole vectors and maps; plain `{}` only works for single simple values.

## Your turn

This program should collect three scores and print the total, but it doesn't compile. Two things are wrong. Fix it so it prints `Total: 60`.

```rust,editable
fn main() {
    let scores = Vec::new();
    scores.push(10);
    scores.push(20);
    scores.push(30);

    let mut total = 0;
    for s in scores {
        total += s;
    }
    println!("Total: {}", total);
}
```

<details><summary>Show solution</summary>

`scores` is modified by `push`, so it needs `mut`. (The program actually *does* compile as written once `mut` is added — but a common companion mistake is consuming the vector in the loop and then trying to use it after; borrowing with `&` avoids that.)

```rust,editable
fn main() {
    let mut scores = Vec::new(); // add mut
    scores.push(10);
    scores.push(20);
    scores.push(30);

    let mut total = 0;
    for s in &scores {           // borrow so scores survives the loop
        total += s;
    }
    println!("Total: {}", total);
    println!("(still have {} scores)", scores.len());
}
```

`mut` lets you push; borrowing with `&scores` lets the loop read without eating the vector.

</details>

## Quick check

<div class="quiz" data-topic="collections"></div>

## Remember this

- `Vec<T>` is a growable, ordered list; index it from `0`, add with `.push()`.
- Use `.get(i)` (returns an `Option`) when an index might not exist — `v[i]` panics if it's out of bounds.
- `HashMap<K, V>` looks up **values by key**; add pairs with `.insert()`, and remember `use std::collections::HashMap;`.
- Collections that you modify must be declared `let mut`.
- Print whole collections with `{:?}` (debug), not `{}`.

## Go deeper

- [Rust Book - Collections](https://doc.rust-lang.org/book/ch08-00-common-collections.html) — Vec, String, and HashMap.

**Next:**

- [Strings and `str`](../abstractions/strings-and-str.md)
- [Iterators](../abstractions/iterators.md)

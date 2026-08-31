# Vectors

> **Beginner** · Abstractions

## What & why

Arrays in Rust have a size fixed at compile time — `[i32; 3]` is always exactly 3 integers, forever. Almost nothing in real programs works that way: shopping carts grow, search results come back with an unknown count, logs accumulate one line at a time. `Vec<T>` is Rust's growable list — a row of same-typed boxes you can keep adding to (or removing from) while the program runs. It's the collection you reach for by default.

## The idea, slowly

### Building one: `Vec::new()` vs `vec![...]`

```rust,editable
fn main() {
    let mut a: Vec<i32> = Vec::new(); // empty, type must be known somehow
    a.push(1);
    a.push(2);

    let b = vec![10, 20, 30]; // vec! macro — pre-filled, type inferred

    println!("{:?}", a);
    println!("{:?}", b);
}
```

`Vec::new()` starts empty and figures out its element type either from an annotation (`Vec<i32>`) or from the first thing you push into it. `vec![...]` is a macro (note the `!`) that builds a `Vec` already holding the values you list — reach for it whenever you know the starting contents up front. `{:?}` is the "debug" format specifier; it can print a whole collection at once, which plain `{}` cannot.

### `push` and `pop`

```rust,editable
fn main() {
    let mut stack = Vec::new();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    println!("{:?}", stack); // [1, 2, 3]

    // pop returns Option<T> — Some(value) if there was one, None if empty
    match stack.pop() {
        Some(top) => println!("popped {}", top), // popped 3
        None => println!("nothing to pop"),
    }
    println!("{:?}", stack); // [1, 2]
}
```

`push` adds to the end; `pop` removes and returns the *last* element. Because an empty `Vec` has nothing to pop, `pop()` hands back an `Option<T>` instead of just `T` — `Some(value)` if something was there, `None` if the vector was empty. This is the same "don't crash, tell the caller" pattern you've already met with `Option`.

### Indexing: `v[i]` panics, `.get(i)` doesn't

```rust,editable
fn main() {
    let nums = vec![10, 20, 30];

    println!("{}", nums[1]); // 20 — fine, index 1 exists

    match nums.get(10) {
        Some(n) => println!("found {}", n),
        None => println!("nothing at index 10"), // this runs
    }

    // nums[10]; // would PANIC: index out of bounds
}
```

`v[i]` reads by position, counting from `0`, and **panics** (crashes the program on purpose) if `i` is out of range. `.get(i)` is the crash-free alternative — it returns `Option<&T>`, `Some(&value)` if the index exists and `None` if it doesn't. Use `v[i]` when you already know the index is valid (e.g. you just checked `v.len()`); use `.get(i)` whenever the index comes from somewhere you don't fully trust, like user input.

### Iterating

```rust,editable
fn main() {
    let nums = vec![1, 2, 3];

    for n in &nums {
        // n: &i32 — borrowing, nums still usable afterward
        print!("{} ", n);
    }
    println!();

    let mut mutable_nums = vec![1, 2, 3];
    for n in &mut mutable_nums {
        *n *= 10; // n: &mut i32 — modify in place
    }
    println!("{:?}", mutable_nums); // [10, 20, 30]

    for n in nums {
        // n: i32 — this CONSUMES nums; it can't be used after this loop
        print!("{} ", n);
    }
    println!();
}
```

`for x in &v` borrows and yields `&T` — the vector is untouched and usable afterward. `for x in &mut v` borrows mutably and yields `&mut T` — you can modify elements through it. `for x in v` (no `&`) takes ownership of the vector and hands you owned `T` values one at a time; after that loop, `v` is gone. Reach for `&v` by far the most often.

### Sorting: `sort` and `sort_by`

```rust,editable
fn main() {
    let mut nums = vec![5, 1, 4, 2, 3];
    nums.sort(); // ascending, uses the type's natural ordering
    println!("{:?}", nums); // [1, 2, 3, 4, 5]

    let mut words = vec!["pear", "fig", "kiwi"];
    words.sort_by(|a, b| a.len().cmp(&b.len())); // custom comparator: shortest first
    println!("{:?}", words); // ["fig", "kiwi", "pear"]

    let mut people = vec![("Bea", 41), ("Al", 30), ("Cy", 25)];
    people.sort_by_key(|p| p.1); // sort by age — often clearer than sort_by
    println!("{:?}", people); // [("Cy", 25), ("Al", 30), ("Bea", 41)]
}
```

`sort()` works for types with a natural order (numbers, strings, ...). `sort_by` takes a closure that compares two elements and returns an `Ordering` — use it for custom rules. `sort_by_key` is the common special case "sort by this one field," and reads more clearly than a full comparator when that's all you need.

### `retain`: keep only what passes a test

```rust,editable
fn main() {
    let mut nums = vec![1, 2, 3, 4, 5, 6];
    nums.retain(|&n| n % 2 == 0); // keep only even numbers
    println!("{:?}", nums); // [2, 4, 6]
}
```

`retain` walks the vector and removes every element for which the closure returns `false`, in place — no separate "filter into a new vector" step needed when you just want to prune what's already there.

### `dedup`: only removes *consecutive* duplicates

```rust,editable
fn main() {
    let mut nums = vec![1, 1, 2, 2, 2, 1, 3];
    nums.dedup();
    println!("{:?}", nums); // [1, 2, 1, 3] — NOT fully deduplicated!

    let mut nums2 = vec![1, 1, 2, 2, 2, 1, 3];
    nums2.sort();   // [1, 1, 1, 2, 2, 2, 3]
    nums2.dedup();  // now every duplicate is adjacent
    println!("{:?}", nums2); // [1, 2, 3]
}
```

`dedup` only collapses runs of *adjacent* equal elements — it does not scan the whole vector for duplicates anywhere. If you want every duplicate gone regardless of position, `sort()` first so equal elements become neighbors, then `dedup()`.

### `Vec::with_capacity`: avoid reallocating while you grow

```rust,editable
fn main() {
    let mut a = Vec::new(); // capacity 0 — first few pushes reallocate
    for i in 0..5 {
        a.push(i);
    }

    let mut b: Vec<i32> = Vec::with_capacity(5); // room for 5 reserved up front
    for i in 0..5 {
        b.push(i); // none of these pushes need to reallocate
    }

    println!("{:?} {:?}", a, b);
}
```

A `Vec` is backed by one contiguous block of heap memory. When it runs out of room, `push` has to allocate a bigger block, copy every existing element over, and free the old block — an O(n) operation that happens occasionally as a vector grows (Rust's standard library roughly doubles capacity each time, so this happens less and less often, but it still happens). If you know up front roughly how many elements you'll end up with, `Vec::with_capacity(n)` reserves that space once, so the pushes that follow don't trigger any reallocation at all. `v.len()` is how many elements are actually there; `v.capacity()` is how much room is reserved — they're allowed to differ.

## Common mistakes

- **Forgetting `mut`.** `push`, `pop`, `sort`, `retain`, and `dedup` all mutate the vector, so it must be `let mut`. The error is `cannot borrow as mutable`.
- **Indexing out of bounds.** `v[99]` on a short vector **panics at runtime** with `index out of bounds`. When the index isn't already known to be valid, use `v.get(99)` and handle the `Option` instead.
- **Treating `pop()` as if it returns the value directly.** It returns `Option<T>`, because there might be nothing left to pop. `let x: i32 = v.pop();` is a type error — you need `v.pop().unwrap()` (if you're sure), or a `match`/`if let`.
- **Expecting `dedup()` to remove all duplicates.** It only merges *adjacent* equal runs. Duplicates scattered through an unsorted vector survive `dedup()` untouched — sort first.
- **Skipping `Vec::with_capacity` in a hot loop.** Repeatedly pushing into a `Vec::new()` when you already know the final size causes avoidable reallocations and copies. Not wrong, just slower than it needs to be.
- **Trying to print a `Vec` with `{}`.** Use `{:?}` (debug format) for whole vectors; plain `{}` only works for single values with a `Display` implementation.

## More examples

### Shopping cart total
Once prices are in a `Vec`, `.iter().sum()` turns "add up every item" into one line instead of a hand-rolled loop.

```rust,editable
fn main() {
    let cart = vec![19.99, 5.50, 3.25, 12.00];
    let total: f64 = cart.iter().sum();
    println!("cart total: ${:.2}", total);
}
```

### Deduplicating scraped URLs
A scraper that follows links will see the same page more than once. Sorting then `dedup`-ing turns a messy list of visited pages into the distinct set.

```rust,editable
fn main() {
    let mut urls = vec![
        "site.com/a".to_string(),
        "site.com/b".to_string(),
        "site.com/a".to_string(),
        "site.com/c".to_string(),
        "site.com/b".to_string(),
    ];

    urls.sort();
    urls.dedup();

    println!("{} unique pages found", urls.len());
    println!("{:?}", urls);
}
```

### An undo history as a stack
A text editor's undo button always undoes the *most recent* action — exactly what `push`/`pop` on a `Vec` give you for free.

```rust,editable
fn main() {
    let mut history: Vec<String> = Vec::new();
    history.push("typed 'hello'".to_string());
    history.push("bolded text".to_string());
    history.push("inserted image".to_string());

    if let Some(last_action) = history.pop() {
        println!("undoing: {}", last_action);
    }
    println!("remaining history: {:?}", history);
}
```

### Chunking a list into batches
An email service that only accepts 2 recipients per request needs the full list broken into fixed-size groups first — `.chunks(n)` does exactly that without any manual index math.

```rust,editable
fn main() {
    let emails = vec!["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com"];

    for (i, batch) in emails.chunks(2).enumerate() {
        println!("sending batch {}: {:?}", i + 1, batch);
    }
}
```

### Removing an item by value
Banning a user should remove every occurrence of their name from a list, not just one — `retain` keeps everything that *doesn't* match.

```rust,editable
fn main() {
    let mut usernames = vec!["alice", "spam_bot", "bob", "spam_bot", "carol"];
    usernames.retain(|&name| name != "spam_bot");
    println!("{:?}", usernames);
}
```

## Your turn

This program should pop the top of a stack and print it, but it doesn't compile.

```rust,editable
fn main() {
    let mut stack = vec![1, 2, 3];
    let top: i32 = stack.pop();
    println!("top: {}", top);
}
```

<details><summary>Show solution</summary>

`stack.pop()` returns `Option<i32>`, not `i32` directly — the vector might have been empty, so `pop` has to be able to say "nothing here." The annotation `let top: i32 = ...` demands an `i32`, and the compiler catches the mismatch (`expected i32, found Option<i32>`) before the program ever runs.

```rust,editable
fn main() {
    let mut stack = vec![1, 2, 3];

    match stack.pop() {
        Some(top) => println!("top: {}", top),
        None => println!("stack was empty"),
    }
}
```

Handling both cases with `match` (or `.unwrap()` if you're certain the vector is non-empty) is what `pop`'s `Option` return type is asking you to do.

</details>

## Quick check

<div class="quiz" data-topic="vectors"></div>

## Remember this

- `Vec::new()` starts empty; `vec![...]` builds one pre-filled. Both need `let mut` to be modified.
- `v[i]` panics on an out-of-range index; `v.get(i)` returns `Option<&T>` instead — no crash.
- `pop()` returns `Option<T>`, not `T`, because the vector might be empty.
- `for x in &v` borrows (vector stays usable); `for x in v` consumes it.
- `sort`/`sort_by`/`sort_by_key` reorder in place; `retain` keeps only elements passing a test; `dedup` removes only *adjacent* duplicates, so sort first if you want them all gone.
- `Vec::with_capacity(n)` reserves space up front and avoids the reallocate-and-copy cost of growing one push at a time.

## Go deeper

- [std::vec::Vec docs](https://doc.rust-lang.org/std/vec/struct.Vec.html) — Full Vec API.

**Next:**

- [HashMaps and HashSets](../abstractions/hashmaps-and-hashsets.md)
- [Iterator basics](../abstractions/iterator-basics.md)

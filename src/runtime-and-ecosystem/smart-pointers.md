# Smart pointers

> **Advanced** · Runtime & ecosystem

## What & why

A smart pointer is a value that *points at* some data but also carries extra abilities — like owning
the data on the heap, or letting several owners share it. `Box`, `Rc`, and `Arc` are the three you'll
meet first. They solve problems plain ownership can't: putting a value on the heap, sharing one value
among many owners, and doing that safely across threads.

## The idea, slowly

A plain variable *is* its value, sitting right there. A **pointer** is a value whose job is to say
"the real thing is over there." A **smart** pointer adds a little brain: it knows how to clean up
after itself, count how many owners it has, or hand out shared access. In Rust, smart pointers are
just structs that own something and clean it up when they're dropped — no magic.

### `Box<T>` — put one thing on the heap

By default your values live on the **stack** (fast, fixed-size, automatic). Sometimes you need a
value on the **heap** instead — because it's large, or because its size isn't known at compile time.
`Box<T>` is the simplest smart pointer: it holds a single value on the heap and owns it.

```rust,editable
fn main() {
    let boxed = Box::new(42);   // the 42 lives on the heap; `boxed` points at it
    println!("boxed holds {}", boxed);   // use it just like the value
    println!("doubled: {}", *boxed * 2); // * "dereferences" to reach the value
}
```

You use a `Box` almost exactly like the value inside it — Rust auto-dereferences in most places. When
`boxed` goes out of scope, it frees the heap memory automatically. Single owner, heap storage, zero
fuss.

#### Box's real job: recursive types

The classic reason you *need* a Box: a type that contains itself. Picture a linked list where each
node holds the next. Without a Box, the compiler can't figure out how big a node is (it would be
infinitely large), so it errors. A Box breaks the cycle because a Box is always pointer-sized:

```rust,editable
// A tiny linked list. Each node points to the next via a Box.
enum List {
    Node(i32, Box<List>),   // Box makes the size finite and known
    End,
}

use List::{Node, End};

fn main() {
    let list = Node(1, Box::new(Node(2, Box::new(Node(3, Box::new(End))))));

    // walk the list and print each value
    let mut current = &list;
    while let Node(value, next) = current {
        println!("{}", value);
        current = next;
    }
}
```

The compiler is thinking: *"A `List` might contain another `List` — how big is that? Infinite! But a
`Box<List>` is just a pointer, a fixed known size. Now I can compute the size. Fine."*

### `Rc<T>` — many owners, one value (single thread)

Ownership's core rule is "one owner." But sometimes several parts of your program genuinely need to
*share* ownership of the same data, and you can't say which one should free it. `Rc<T>` ("Reference
Counted") lets a value have **multiple owners**. It keeps a count of how many owners exist; when the
last one goes away, the value is dropped.

```rust,editable
use std::rc::Rc;

fn main() {
    let name = Rc::new(String::from("shared name"));

    let a = Rc::clone(&name);   // +1 owner
    let b = Rc::clone(&name);   // +1 owner

    println!("value: {}", name);
    println!("owners right now: {}", Rc::strong_count(&name));  // 3

    drop(a);
    drop(b);
    println!("owners after dropping two: {}", Rc::strong_count(&name)); // 1
}
```

`Rc::clone` is cheap — it does **not** copy the String. It makes another handle pointing at the same
String and bumps the owner count by one. (We write `Rc::clone(&name)` rather than `name.clone()` by
convention, to make it obvious this is a cheap reference-count bump, not a deep copy.)

### `Arc<T>` — like `Rc`, but safe across threads

`Rc` is fast because its counter is *not* thread-safe — two threads bumping it at once could corrupt
it, so the compiler forbids sending an `Rc` to another thread. When you need shared ownership
*across threads*, use `Arc<T>` ("Atomically Reference Counted"). It's the exact same idea with a
thread-safe counter. It's very slightly slower, which is why `Rc` still exists for single-threaded use.

```rust,editable
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);
    let mut handles = vec![];

    for id in 0..3 {
        let data = Arc::clone(&data);   // each thread gets its own handle
        handles.push(thread::spawn(move || {
            println!("thread {} sees {:?}", id, data);
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
}
```

The mental rule: **`Rc` for one thread, `Arc` when threads are involved.** Same behavior, `Arc` just
pays a small cost to be thread-safe.

### Choosing between them

- Need a value on the heap with a single owner? → **`Box<T>`**
- Need several owners of the same value, single-threaded? → **`Rc<T>`**
- Need several owners across threads? → **`Arc<T>`**
- Just one owner and normal size? → you don't need a smart pointer at all; use the plain value.

Note that `Rc` and `Arc` give shared *read* access. To also *mutate* shared data you combine them
with an interior-mutability type (`RefCell` for `Rc`, `Mutex` for `Arc`) — that's the very next lesson.

## Common mistakes

- **Reaching for a smart pointer when a plain value works.** Most code needs none of these. Use the
  simplest thing that compiles; add `Box`/`Rc`/`Arc` only when you hit the specific problem it solves.
- **Thinking `Rc::clone` copies the data.** It doesn't — it just adds an owner and bumps a counter.
  The underlying value is shared, not duplicated.
- **Using `Rc` across threads.** It won't compile (`Rc` isn't `Send`). The compiler is protecting you
  from a data race on the counter. Switch to `Arc`.
- **Expecting to mutate through `Rc`/`Arc`.** They hand out shared (immutable) access. To mutate
  shared data, pair them with `RefCell` (single-thread) or `Mutex` (multi-thread).
- **Creating reference cycles with `Rc`.** If two `Rc`s point at each other, their counts never reach
  zero and the memory leaks. Use `Weak` references to break cycles (an advanced follow-up).

## Your turn

This program wants two owners to share the same string via `Rc`, then print how many owners there
are. It won't compile because of a missing import and a wrong clone. Fix it.

```rust,editable
fn main() {
    let text = Rc::new(String::from("hi"));
    let second = text.clone_rc();
    println!("owners: {}", Rc::strong_count(&text));
    println!("{} {}", text, second);
}
```

<details><summary>Show solution</summary>

Two problems: `Rc` needs to be imported from `std::rc`, and there's no `.clone_rc()` method — the way
to add an owner is `Rc::clone(&text)`.

```rust,editable
use std::rc::Rc;

fn main() {
    let text = Rc::new(String::from("hi"));
    let second = Rc::clone(&text);   // add a second owner (cheap: just bumps the count)
    println!("owners: {}", Rc::strong_count(&text));   // 2
    println!("{} {}", text, second);
}
```

`Rc::clone(&text)` makes `second` a co-owner of the same String, and `Rc::strong_count` reports `2`.

</details>

## Quick check

<div class="quiz" data-topic="smart-pointers"></div>

## Remember this

- A smart pointer owns data and adds an ability (heap storage, shared ownership) while acting like the value inside.
- `Box<T>` = single owner, value on the heap; needed for recursive types and large values.
- `Rc<T>` = multiple owners of one value, single-threaded; `Rc::clone` bumps an owner count, it doesn't copy.
- `Arc<T>` = the thread-safe version of `Rc`; use it whenever threads share ownership.
- `Rc`/`Arc` give shared read access; combine with `RefCell`/`Mutex` to mutate shared data.

## Go deeper

- [Rust Book - Smart Pointers](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) — Box, Rc, RefCell, and more.

**Next:**

- [Interior mutability](../runtime-and-ecosystem/interior-mutability.md)
- [Concurrency](../runtime-and-ecosystem/concurrency.md)

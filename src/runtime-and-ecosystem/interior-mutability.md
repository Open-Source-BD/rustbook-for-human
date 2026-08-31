# Interior mutability

> **Advanced** · Runtime & ecosystem

## What & why

Normally Rust's rule is simple: to change a value you need a `&mut` (mutable) reference, and you can
only have one at a time. Interior mutability is a carefully controlled *exception* — it lets you
change data even when all you're holding is a shared `&` reference. The catch is that the safety
check moves from *compile time* to *runtime*. `Cell`, `RefCell`, and (for threads) `Mutex` are the
tools that do this.

## The idea, slowly

Rust's borrowing rules, from the outside, say: **many readers OR one writer, never both.** The
compiler enforces this by tracking `&` (shared, read-only) and `&mut` (exclusive, read-write)
references. It's brilliant, but occasionally too strict — there are safe patterns it can't *prove*
are safe. Interior mutability is the escape hatch: a type that lets you mutate through a shared `&`,
and takes on the job of enforcing the rules *itself, at runtime*, instead of asking the compiler.

Think of `&mut` as a physical key that only one person can hold. Interior mutability is like a room
with a *sign-in sheet* by the door instead of a key: anyone can walk up (shared `&`), but the sheet
enforces "only one person editing at a time" — and if you break the rule, you find out the moment you
try, not before.

### `RefCell<T>` — borrow rules checked at runtime

`RefCell` is the one you'll meet most. From the outside it looks immutable (you hold a plain `&` to
it), but it hands out mutable access on request through two methods:

- `.borrow()` gives you a shared read handle (`Ref`).
- `.borrow_mut()` gives you an exclusive write handle (`RefMut`).

`RefCell` keeps a little counter and enforces "many readers or one writer" at *runtime*. Break the
rule and it **panics** instead of failing to compile.

```rust,editable
use std::cell::RefCell;

fn main() {
    let value = RefCell::new(String::from("rust"));

    value.borrow_mut().push('!');   // mutate through a shared &
    value.borrow_mut().push('!');

    println!("{}", value.borrow()); // read it: "rust!!"
}
```

The compiler is thinking: *"`value` is not declared `mut`, and I only ever see shared `&` to it. Yet
it's being mutated? Normally I'd reject that — but `RefCell` promised to police the borrows itself at
runtime, so I'll allow it."*

#### The runtime panic you must respect

Because the check is at runtime, you can write code that compiles fine but *panics* when it runs, if
you hold a read and a write borrow at the same time:

```rust,editable
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    let reader = data.borrow();        // read borrow is alive...
    // data.borrow_mut();              // <- uncomment: PANIC "already borrowed"
    println!("reading: {:?}", reader); // reader still in use here

    // reader is dropped at end of scope; now a write borrow would be fine
    drop(reader);
    data.borrow_mut().push(4);
    println!("after: {:?}", data.borrow());
}
```

Uncomment the middle line and Run: it compiles, then panics with `already borrowed: BorrowMutError`.
That's `RefCell` doing at runtime the exact job the compiler normally does at compile time. The
borrow rules never went away — they just moved.

### `Cell<T>` — the simpler cousin for `Copy` values

`Cell<T>` is a lighter version for small `Copy` types (numbers, `bool`). It doesn't hand out
references at all; you just `.get()` a copy out or `.set()` a new value in. Because it never lends a
reference, it can't have a borrow conflict, so it never panics.

```rust,editable
use std::cell::Cell;

fn main() {
    let counter = Cell::new(0);

    counter.set(counter.get() + 1);
    counter.set(counter.get() + 1);

    println!("counter = {}", counter.get());   // 2
}
```

Use `Cell` for simple `Copy` values, `RefCell` for everything else.

### The famous combo: `Rc<RefCell<T>>`

Remember from the last lesson that `Rc<T>` lets many owners share a value — but only for *reading*.
Pair it with `RefCell` and you get **shared ownership that can also be mutated**: `Rc<RefCell<T>>`.
Several owners, any of whom can change the inside. This shows up constantly in tree and graph
structures.

```rust,editable
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2, 3]));

    let a = Rc::clone(&shared);   // another owner
    let b = Rc::clone(&shared);   // and another

    a.borrow_mut().push(4);       // mutate through one owner
    b.borrow_mut().push(5);       // mutate through another

    println!("{:?}", shared.borrow());   // [1, 2, 3, 4, 5]
}
```

Both `a` and `b` co-own the vector *and* can push to it. `Rc` provides the sharing, `RefCell`
provides the mutability.

### For threads: `Mutex<T>` and `RwLock<T>`

`Cell` and `RefCell` are **single-threaded only** — they aren't safe to share across threads, and the
compiler won't let you. The thread-safe equivalents are:

- **`Mutex<T>`** — like `RefCell` but for threads. `.lock()` gives exclusive access; other threads
  wait. Instead of panicking on conflict, threads *block* until the lock is free.
- **`RwLock<T>`** — allows many simultaneous readers OR one writer, for when reads vastly outnumber writes.

You saw `Arc<Mutex<T>>` in the concurrency lesson — that's the multi-threaded twin of
`Rc<RefCell<T>>`: shared ownership plus safe mutation, across threads.

| Single-threaded | Multi-threaded (across threads) |
| --------------- | ------------------------------- |
| `Rc<T>`         | `Arc<T>`                        |
| `RefCell<T>`    | `Mutex<T>` / `RwLock<T>`        |
| `Rc<RefCell<T>>`| `Arc<Mutex<T>>`                 |

## Common mistakes

- **Forgetting the check is now at runtime.** `RefCell` code that violates borrow rules compiles but
  **panics** when it runs. You've traded a compile error for a crash, so test the paths.
- **Holding a borrow longer than you meant.** A `Ref`/`RefMut` from `.borrow()`/`.borrow_mut()` keeps
  the borrow alive until it's dropped. Store it in a variable that lingers and you can accidentally
  block a later borrow and panic. Keep borrows short; `drop` them early if needed.
- **Using `RefCell` across threads.** It isn't thread-safe and won't compile in a threaded context.
  Use `Mutex` (or `RwLock`) instead.
- **Reaching for interior mutability to dodge good design.** It's for genuine patterns the compiler
  can't prove (shared graphs, callbacks). If a plain `&mut` or restructuring works, prefer that —
  interior mutability adds runtime cost and a panic risk.
- **Confusing `Cell` and `RefCell`.** `Cell` is for `Copy` values via `get`/`set` and never panics;
  `RefCell` lends references and enforces borrows at runtime.

## More examples

### A logger that records messages through a shared `&self`
Logging methods usually take `&self`, not `&mut self`, so every caller can hold a shared reference — `RefCell` lets `log` push onto an internal `Vec` anyway.

```rust,editable
use std::cell::RefCell;

struct Logger {
    messages: RefCell<Vec<String>>,
}

impl Logger {
    fn new() -> Self {
        Logger { messages: RefCell::new(Vec::new()) }
    }

    fn log(&self, message: &str) {
        self.messages.borrow_mut().push(message.to_string());
    }
}

fn main() {
    let logger = Logger::new();
    logger.log("server started");
    logger.log("listening on port 8080");

    println!("{:?}", logger.messages.borrow());
}
```

### Counting cache hits inside a read-only lookup
A cache's `get` method looks read-only from the outside, but tracking how often it's hit needs to mutate a counter every call — `Cell` handles that without changing `get`'s `&self` signature.

```rust,editable
use std::cell::Cell;

struct Cache {
    value: i32,
    hits: Cell<u32>,
}

impl Cache {
    fn get(&self) -> i32 {
        self.hits.set(self.hits.get() + 1);
        self.value
    }
}

fn main() {
    let cache = Cache { value: 42, hits: Cell::new(0) };

    cache.get();
    cache.get();
    cache.get();

    println!("value looked up {} times", cache.hits.get());
}
```

### Two systems mutating shared game state
A damage system and a healing system both need to change the same player's health — `Rc<RefCell<Player>>` lets both hold an owner and mutate the same struct instead of copying it back and forth.

```rust,editable
use std::cell::RefCell;
use std::rc::Rc;

struct Player {
    health: i32,
}

fn main() {
    let player = Rc::new(RefCell::new(Player { health: 100 }));

    let damage_system = Rc::clone(&player);
    let healing_system = Rc::clone(&player);

    damage_system.borrow_mut().health -= 30;
    healing_system.borrow_mut().health += 10;

    println!("player health: {}", player.borrow().health);
}
```

### Flipping a maintenance-mode flag read by many handlers
Every request handler needs to check the same maintenance flag, but none of them own it — `Cell<bool>` lets any of them read it and lets one admin action flip it.

```rust,editable
use std::cell::Cell;

struct AppState {
    maintenance_mode: Cell<bool>,
}

fn handle_request(state: &AppState) {
    if state.maintenance_mode.get() {
        println!("503: site is under maintenance");
    } else {
        println!("200: serving request normally");
    }
}

fn main() {
    let state = AppState { maintenance_mode: Cell::new(false) };

    handle_request(&state);

    state.maintenance_mode.set(true);
    handle_request(&state);
}
```

## Your turn

This program wants to increment a counter that lives behind a shared `RefCell`, then print it. It
won't compile because it tries to mutate through a plain method instead of borrowing mutably. Fix it.

```rust,editable
use std::cell::RefCell;

fn main() {
    let count = RefCell::new(0);

    count.set(count.get() + 1);   // RefCell has no get/set!
    count.set(count.get() + 1);

    println!("count = {}", count.borrow());
}
```

<details><summary>Show solution</summary>

`get`/`set` belong to `Cell`, not `RefCell`. With a `RefCell` you get a *mutable borrow* and change
the value through it:

```rust,editable
use std::cell::RefCell;

fn main() {
    let count = RefCell::new(0);

    *count.borrow_mut() += 1;   // borrow mutably, then use * to reach the value
    *count.borrow_mut() += 1;

    println!("count = {}", count.borrow());   // 2
}
```

Each `count.borrow_mut()` hands you an exclusive write handle; `*` dereferences it so `+= 1` changes
the number inside. Each borrow is released at the end of its statement, so they don't conflict. (For a
plain number like this, `Cell` with `get`/`set` would also work — but `borrow_mut` is the `RefCell` way.)

</details>

## Quick check

<div class="quiz" data-topic="interior-mutability"></div>

## Remember this

- Interior mutability lets you mutate through a shared `&`, moving the borrow check from compile time to runtime.
- `RefCell<T>`: `.borrow()` / `.borrow_mut()` enforce "many readers or one writer" at runtime — and **panic** if you break it.
- `Cell<T>` is the simpler `get`/`set` version for `Copy` values; it never panics.
- `Rc<RefCell<T>>` = shared ownership plus mutation, single-threaded; `Arc<Mutex<T>>` is the thread-safe twin.
- `RefCell`/`Cell` are single-threaded only; use `Mutex`/`RwLock` across threads.

## Go deeper

- [Rust Book - Interior Mutability](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) — How runtime checks fit the model.

**Next:**

- [Unsafe Rust](../runtime-and-ecosystem/unsafe-rust.md)
- [Concurrency](../runtime-and-ecosystem/concurrency.md)

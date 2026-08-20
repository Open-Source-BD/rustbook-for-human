# Shared state: Arc and Mutex

> **Advanced** · Runtime & ecosystem

## What & why

Channels are great when work flows in one direction, but sometimes several threads genuinely need to read and write the *same* piece of data — a shared counter, a cache, a connection pool. Rust's standard answer is `Arc<Mutex<T>>`: `Arc` lets multiple threads co-own the same value, and `Mutex` makes sure only one of them touches it at a time. Together they let you share mutable state without a data race — and the compiler won't even let you try it any other way.

## The idea, slowly

### Why plain shared state doesn't compile

If you've used `Rc<RefCell<T>>` for shared mutable state in single-threaded code, the instinct is to reach for it here too. It won't compile across threads:

```rust,ignore
use std::rc::Rc;
use std::cell::RefCell;
use std::thread;

fn main() {
    let counter = Rc::new(RefCell::new(0));
    let counter2 = Rc::clone(&counter);

    thread::spawn(move || {
        *counter2.borrow_mut() += 1;   // ERROR: `Rc` cannot be sent between threads safely
    });
}
```

`Rc`'s reference count isn't updated atomically — two threads bumping it at the same instant could corrupt it. The compiler marks `Rc` (and `RefCell`) as **not** safe to send across threads, so this fails at compile time instead of racing at runtime. You need their thread-safe siblings: `Arc` instead of `Rc`, `Mutex` instead of `RefCell`.

### `Arc`: shared ownership, and cloning it is cheap

`Arc<T>` stands for **A**tomically **R**eference **C**ounted. Cloning an `Arc` doesn't copy the data inside — it bumps a counter and hands back another pointer to the same value:

```rust,editable
use std::sync::Arc;

fn main() {
    let data = Arc::new(String::from("shared"));
    println!("count after creation: {}", Arc::strong_count(&data)); // 1

    let clone1 = Arc::clone(&data);
    let clone2 = Arc::clone(&data);
    println!("count after two clones: {}", Arc::strong_count(&data)); // 3

    drop(clone1);
    println!("count after dropping one: {}", Arc::strong_count(&data)); // 2

    println!("all three point at the same string: {clone2}");
}
```

`Arc::clone(&data)` is the idiomatic way to write it (rather than `data.clone()`) — it makes it obvious at a glance that you're bumping a refcount, not doing a deep, expensive copy. The underlying `String` is only ever freed once the *last* `Arc` pointing at it is dropped.

### `Mutex`: one at a time, enforced by a lock

`Mutex<T>` wraps a value and only lets one thread touch it at a time. `.lock()` blocks until the lock is free, then hands back a `MutexGuard<T>` — a smart pointer that derefs to `&mut T` and **automatically releases the lock when it's dropped**, no manual unlock call needed:

```rust,editable
use std::sync::Mutex;

fn main() {
    let count = Mutex::new(0);

    {
        let mut guard = count.lock().unwrap(); // blocks until the lock is free
        *guard += 1;
    } // <- guard drops here, lock releases automatically

    println!("count = {}", *count.lock().unwrap());
}
```

`.lock()` actually returns `Result<MutexGuard<T>, PoisonError<...>>`, not the guard directly — the `Err` case only happens if some other thread panicked while holding the lock (Rust calls the mutex "poisoned" after that, as a warning that the data might be in a weird half-updated state). `.unwrap()` is the common shortcut when you're confident that won't happen; real long-running services sometimes recover from a poisoned lock instead of panicking too.

### Combining them: `Arc<Mutex<T>>` across threads

Put the two together and you get real shared mutable state, safely:

```rust,editable
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0)); // shared, lockable number
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter); // clone the handle, not the number
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // lock it — others wait
            *num += 1;                              // safely add 1
        }); // lock releases here, when `num` goes out of scope
        handles.push(handle);
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("final count: {}", *counter.lock().unwrap()); // 5
}
```

Each thread gets its own `Arc` handle (cheap clone) pointing at the same `Mutex`, locks it just long enough to increment the number, and releases it immediately when the guard drops at the end of the closure. Five threads, zero data races, guaranteed final count of 5.

### Deadlock risk: locking two mutexes out of order

A `Mutex` only guarantees *one thread at a time* — it says nothing about *order*. If two threads need to lock two different mutexes, and they lock them in different orders, you can get a deadlock: each thread holds one lock and waits forever for the other.

```rust,ignore
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let a = Arc::new(Mutex::new(0));
    let b = Arc::new(Mutex::new(0));

    let (a1, b1) = (Arc::clone(&a), Arc::clone(&b));
    let t1 = thread::spawn(move || {
        let _guard_a = a1.lock().unwrap();                          // t1 grabs `a` first
        std::thread::sleep(std::time::Duration::from_millis(50));
        let _guard_b = b1.lock().unwrap();                          // ...then wants `b`
    });

    let (a2, b2) = (Arc::clone(&a), Arc::clone(&b));
    let t2 = thread::spawn(move || {
        let _guard_b = b2.lock().unwrap();                          // t2 grabs `b` first
        std::thread::sleep(std::time::Duration::from_millis(50));
        let _guard_a = a2.lock().unwrap();                          // ...then wants `a`
    });

    t1.join().unwrap();
    t2.join().unwrap();
    // t1 ends up holding `a`, waiting for `b`.
    // t2 ends up holding `b`, waiting for `a`.
    // Neither can proceed. This hangs forever.
}
```

(This example is deliberately not runnable here — it would hang the page.) `t1` locks `a` then reaches for `b`; `t2` locks `b` then reaches for `a`. If they interleave unluckily, each ends up waiting on a lock the other is holding, and neither ever lets go. Rust's compiler can't catch this for you — deadlocks are a *runtime* problem, not a type error. The fix is a discipline, not a language feature: **always lock mutexes in the same global order everywhere in your code.** If every code path locks `a` before `b`, this interleaving simply can't happen.

## Common mistakes

- **Locking two mutexes in inconsistent order across different code paths.** The classic deadlock. Always lock in the same global order.
- **Holding a `MutexGuard` longer than necessary** — across a slow computation or (in async code) an `.await` — blocks every other thread waiting on that lock. Keep locked sections short.
- **Reaching for `Rc<RefCell<T>>` instead of `Arc<Mutex<T>>` across threads.** `Rc` and `RefCell` aren't `Send`/`Sync`; the compiler refuses to let them cross a thread boundary.
- **Locking the same `Mutex` twice on one thread** (e.g. a helper function locks it again while you're still holding the outer guard) — you deadlock against yourself, waiting for a lock only you hold.
- **Forgetting `.lock()` returns a `Result`.** `.unwrap()` is fine for lessons and quick scripts; production code sometimes needs to handle a poisoned mutex instead of panicking.

## Your turn

This program tries to have five threads increment a shared counter. It doesn't compile.

```rust,editable
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..5 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("final count: {}", *counter.lock().unwrap());
}
```

<details><summary>Show solution</summary>

The first loop iteration's `move` closure takes ownership of `counter` outright. There's only one `counter` — by the second iteration, it's already been moved away, so the compiler reports `use of moved value: counter`. A bare `Mutex` has no way to be shared between threads; it can only be *owned* by one place.

The fix is `Arc<Mutex<T>>`: wrap the mutex in an `Arc`, and clone the `Arc` (not the mutex) for each thread.

```rust,editable
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0)); // <-- wrap in Arc so it can be shared
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter); // <-- clone the handle for this thread
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("final count: {}", *counter.lock().unwrap()); // 5
}
```

`Arc::clone` bumps a refcount instead of consuming the only copy, so every thread — and `main` afterward — gets its own handle to the same `Mutex`.

</details>

## Quick check

<div class="quiz" data-topic="shared-state-mutex-and-arc"></div>

## Remember this

- `Arc<T>` is `Rc<T>`'s thread-safe sibling: `Arc::clone` bumps an atomic refcount (cheap) — it doesn't copy the data.
- `mutex.lock()` blocks until the lock is free, then hands back a `MutexGuard` that derefs to `&mut T`.
- The `MutexGuard` unlocks automatically when it's dropped (goes out of scope) — there's no manual unlock call.
- `Arc<Mutex<T>>` together give thread-safe shared ownership plus exclusive access; a bare shared mutable reference across threads simply won't compile.
- Locking two mutexes in different orders on different threads is a classic deadlock — always lock in the same global order.

## Go deeper

- [Rust Book - Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html) — Arc, Mutex, and deadlock pitfalls.

**Next:**

- [Async and await basics](../runtime-and-ecosystem/async-basics.md)
- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

# Concurrency

> **Intermediate** · Runtime & ecosystem

## What & why

Concurrency means doing more than one thing at a time — running several *threads* so your program
isn't stuck waiting. Most languages let you do this and then let you shoot yourself in the foot with
data races (two threads scribbling on the same value at once). Rust's big trick is that the same
ownership rules you already learned make whole classes of those bugs *impossible to compile*. That's
why the Rust crowd calls it "fearless concurrency."

## The idea, slowly

A **thread** is like hiring a second worker. Your `main` function is one worker. When you *spawn* a
thread, a second worker starts running some code at the same time, on its own. If your machine has
multiple CPU cores, they can genuinely run at the same instant.

### Spawning a thread

```rust,editable
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // this closure runs on a NEW thread
        for i in 1..=3 {
            println!("  [worker] step {}", i);
        }
    });

    println!("[main] I spawned a worker");

    // Wait for the worker to finish before main ends:
    handle.join().unwrap();
    println!("[main] worker is done");
}
```

Press Run a few times. `thread::spawn` takes a **closure** (the `|| { ... }` bit — a chunk of code
to run) and starts it on a new thread. It hands you back a `JoinHandle`. That handle's `.join()`
method means "pause here until that thread finishes." Without the `join`, `main` might end while the
worker is still mid-sentence — and when `main` ends, the whole program stops, cutting the worker off.

### The problem: sharing data between threads

Here's where other languages get dangerous. What if the worker thread wants to use a value that
`main` also owns? Rust makes you be explicit. This is a compile error:

```rust,ignore
use std::thread;

fn main() {
    let name = String::from("Shamirul");

    let handle = thread::spawn(|| {
        println!("worker sees {}", name);   // ERROR: might outlive `name`
    });

    handle.join().unwrap();
}
```

The compiler is thinking: *"This thread borrows `name`, but I can't prove the thread finishes before
`name` is dropped. If `main` ended first, the thread would be reading freed memory. I won't allow it."*
The fix is to **move** ownership of `name` into the thread with the `move` keyword:

```rust,editable
use std::thread;

fn main() {
    let name = String::from("Shamirul");

    let handle = thread::spawn(move || {          // `move` gives the thread ownership
        println!("worker sees {}", name);
    });

    handle.join().unwrap();
    // `name` now belongs to the thread; main can't use it anymore.
}
```

`move` says "hand this value over to the new thread entirely." Now the thread owns `name`, so there's
no dangling reference and the compiler is happy.

### Talking between threads: channels

If threads can't just share variables freely, how do they communicate? The cleanest way is a
**channel** — think of it as a pipe. One end sends messages, the other end receives them. Rust's
standard channel lives in `std::sync::mpsc` (which stands for "multi-producer, single-consumer").

```rust,editable
use std::sync::mpsc;
use std::thread;

fn main() {
    // tx = transmitter (sender), rx = receiver
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        for word in ["hello", "from", "the", "worker"] {
            tx.send(word.to_string()).unwrap();   // push a message into the pipe
        }
        // when tx is dropped here, the channel closes
    });

    // rx is an iterator: it yields each message until the channel closes
    for received in rx {
        println!("main got: {}", received);
    }
}
```

Press Run. The worker sends four words down the pipe; `main` receives them one by one. Because we
*moved* `tx` into the thread, ownership is clear and there's no shared mutable mess. This
send-messages-not-memory style is the safest way to do concurrency and the one to reach for first.

### Sharing state safely: Arc and Mutex

Sometimes you genuinely need several threads touching one value. The safe combo is `Arc<Mutex<T>>`:

- **`Arc<T>`** = "Atomically Reference Counted" — lets multiple threads *co-own* the same value.
- **`Mutex<T>`** = "mutual exclusion" — a lock, so only one thread can touch the inside at a time.

```rust,editable
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));   // shared, lockable number
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter);   // clone the handle, not the number
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();   // lock it — others wait
            *num += 1;                                // safely add 1
        }); // lock releases here when `num` goes out of scope
        handles.push(handle);
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("final count: {}", *counter.lock().unwrap());  // 5
}
```

`Arc::clone` doesn't copy the number — it makes another *handle* pointing at the same number and
bumps a counter. `.lock()` gives you exclusive access; while you hold the lock, other threads wait
their turn. This is how you share mutable state without a data race.

### Send and Sync — the marks that make it safe

You'll see two trait names in error messages: `Send` and `Sync`. You rarely write them yourself, but
know what they mean:

- **`Send`** = "this type is safe to *move* to another thread." Most types are.
- **`Sync`** = "this type is safe to *share by reference* across threads."

The compiler checks these automatically. When it says a type "cannot be sent between threads safely,"
it means you tried to move something across a thread boundary that isn't safe (like an `Rc`, which is
the non-thread-safe cousin of `Arc`). The fix is usually swapping to the thread-safe version.

### Concurrency is not the same as parallelism

- **Concurrency** = *dealing with* many things at once (structuring your program into independent
  tasks). You can have concurrency on a single core by rapidly switching between tasks.
- **Parallelism** = *doing* many things at the literal same instant (needs multiple cores).

Threads give you both when the hardware allows. Don't stress the distinction; just know they're not
synonyms.

## Common mistakes

- **Forgetting `move` on the closure.** If the thread uses an owned value from outside, you almost
  always need `thread::spawn(move || ...)`, or the compiler complains the borrow might outlive the data.
- **Forgetting to `.join()`.** If `main` ends before your threads finish, the program exits and cuts
  them off mid-work. Join the handles when you need the results.
- **Reaching for `Rc` across threads.** `Rc` is single-threaded only and won't compile across a
  thread boundary. Use `Arc` for shared ownership between threads.
- **Locking the same `Mutex` twice in one thread.** If you already hold the lock and try to lock it
  again before releasing, your program freezes forever (a deadlock). Keep locked sections short.
- **Sharing mutable data without a lock.** Rust simply won't let you share a raw `&mut` across
  threads. Wrap it in `Mutex` (or `RwLock`) so access is coordinated.

## Your turn

This program tries to have a worker thread greet a name that `main` owns, then joins it. It doesn't
compile. Fix it so the worker can use `name`.

```rust,editable
use std::thread;

fn main() {
    let name = String::from("Ada");

    let handle = thread::spawn(|| {
        println!("Hello, {}!", name);
    });

    handle.join().unwrap();
}
```

<details><summary>Show solution</summary>

The closure borrows `name`, but the compiler can't prove the thread finishes before `name` is
dropped. Add the `move` keyword so the thread *takes ownership* of `name`:

```rust,editable
use std::thread;

fn main() {
    let name = String::from("Ada");

    let handle = thread::spawn(move || {   // <-- move
        println!("Hello, {}!", name);
    });

    handle.join().unwrap();
}
```

Now the thread owns `name` outright, there's no dangling reference, and it compiles. (After the
`move`, `main` can no longer use `name` — it belongs to the thread.)

</details>

## Quick check

<div class="quiz" data-topic="concurrency"></div>

## Remember this

- `thread::spawn(|| { ... })` starts a new thread; `.join()` waits for it to finish.
- Use `move` to give a thread ownership of values it uses from outside.
- Channels (`std::sync::mpsc`) let threads talk by *sending messages*, the safest sharing style.
- For shared mutable state across threads, use `Arc<Mutex<T>>`: `Arc` for shared ownership, `Mutex` for one-at-a-time access.
- `Send`/`Sync` are the compiler's marks for "safe across threads"; `Rc` is single-threaded, `Arc` is its thread-safe version.

## Go deeper

- [Rust Book - Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html) — Threads, channels, and safety.

**Next:**

- [Async and await](../runtime-and-ecosystem/async-await.md)
- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

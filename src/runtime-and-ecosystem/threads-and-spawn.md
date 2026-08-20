# Threads and spawn

> **Intermediate** · Runtime & ecosystem

## What & why

Most programs run one instruction at a time, on one thread. `std::thread::spawn` lets you hand a chunk of work to a *second* worker that runs at the same time as the rest of your program — genuinely at the same instant, if your machine has more than one CPU core. It hands you back a `JoinHandle`: a receipt you can trade in later for the thread's result. Two things make this safe in Rust: the closure you spawn almost always has to be `move`, and a crash inside that thread doesn't take your whole program down with it.

## The idea, slowly

### Spawning a thread

Think of `main` as your first worker. `thread::spawn` hires a second one and hands it a closure to run on its own.

```rust,editable
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        // this closure runs on a NEW thread
        for i in 1..=3 {
            println!("  [worker] step {i}");
        }
    });

    println!("[main] spawned a worker");

    handle.join().unwrap(); // wait here until the worker finishes
    println!("[main] worker is done");
}
```

Press Run a few times and watch the order shuffle a little — `[main] spawned a worker` and `[worker] step 1` can interleave differently each run, because they're genuinely racing. `thread::spawn` returns immediately with a `JoinHandle`; it does **not** wait for the closure to finish. `.join()` is what pauses the current thread until the spawned one completes. Skip it, and `main` might exit while the worker is still mid-sentence — when `main` ends, the whole process ends, cutting the worker off.

### Why the closure usually needs `move`

Here's where Rust gets strict. If the closure uses a value that `main` also owns, this is a compile error:

```rust,ignore
use std::thread;

fn main() {
    let name = String::from("Shamirul");

    let handle = thread::spawn(|| {
        println!("worker sees {name}");   // ERROR: closure may outlive `name`
    });

    handle.join().unwrap();
}
```

The compiler's reasoning: *"This closure borrows `name`. `thread::spawn` needs the closure to live for `'static` — it might run for as long as it wants, possibly outliving this function's stack frame. I can't prove `name` will still be alive when the thread reads it. I won't allow it."* The fix is to **move** ownership of `name` into the thread:

```rust,editable
use std::thread;

fn main() {
    let name = String::from("Shamirul");

    let handle = thread::spawn(move || {   // `move` gives the thread ownership
        println!("worker sees {name}");
    });

    handle.join().unwrap();
    // `name` now belongs to the thread; main can't use it anymore.
}
```

`move` says "hand this value over to the new thread entirely." Now the thread owns `name` outright — there's no borrowed reference that could dangle, so the compiler is happy. This is why you'll see `thread::spawn(move || { ... })` far more often than `thread::spawn(|| { ... })` in real code: as soon as the closure touches anything from the outside, it needs to own it.

### `JoinHandle` and `.join()`: getting a value back

A spawned closure can return a value, not just print things. Whatever the closure evaluates to (its last expression) becomes the thread's result:

```rust,editable
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        let mut total = 0;
        for i in 1..=10 {
            total += i;
        }
        total // this becomes the thread's result
    });

    match handle.join() {
        Ok(total) => println!("sum = {total}"),
        Err(_) => println!("the thread panicked"),
    }
}
```

`.join()` itself returns a `Result<T, Box<dyn Any + Send + 'static>>` — **not** the bare value `T`. `Ok(total)` carries whatever the closure returned; `Err(payload)` only shows up if the thread panicked, and `payload` is the panic's message, boxed up. That's why `.join().unwrap()` is so common in small examples: it says "I'm confident this thread won't panic, just give me the value" — but it's worth knowing that unwrap is skipping over a real `Result`, not a formality.

### A panic in a spawned thread doesn't crash the whole program

This is the part that surprises people coming from languages where any uncaught error kills the process. In Rust, each thread unwinds on its own:

```rust,editable
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        let v = vec![1, 2, 3];
        println!("{}", v[10]); // out of bounds: this panics
    });

    match handle.join() {
        Ok(_) => println!("worker finished normally"),
        Err(_) => println!("worker panicked, but main is still alive"),
    }

    println!("main keeps going after the crash was contained");
}
```

Press Run. You'll see Rust's usual panic message printed (that's the runtime reporting the crash, same as any panic), and then — critically — `main` keeps executing. The panic only unwound *that thread's* stack; `.join()` caught it as `Err` instead of propagating it. If you have several worker threads, one panicking doesn't stop the others. The only way a worker's panic reaches `main` is if you `.unwrap()` (or `.expect()`) the `Err` yourself — that re-panics, but now on the thread that called `.join()`, which is a choice you made, not something Rust forces on you.

## Common mistakes

- **Forgetting `move`.** If the closure uses an owned value from outside, you almost always need `thread::spawn(move || ...)`, or the compiler complains the borrow might outlive the data.
- **Forgetting to `.join()`.** If `main` ends before your threads finish, the program exits and cuts them off mid-work. Join the handles when you need the results (or need to guarantee the work completed).
- **Printing `handle.join()` directly.** It's a `Result`, not the value inside — you need `.unwrap()` or a `match`/`if let` to get at `T`.
- **`.join().unwrap()` on a thread that might legitimately panic.** That turns "one worker failed" into "the thread that's waiting for it also panics." Match on the `Err` explicitly if a failure shouldn't be fatal.
- **Spawning a thread per tiny unit of work.** Each OS thread has real overhead (its own stack, kernel bookkeeping). For lots of small, short-lived tasks, reach for a thread pool (e.g. the `rayon` crate) instead of spawning thousands of threads.

## Your turn

This program sums a vector on a worker thread and prints the total. It has two bugs — the closure can't see `numbers`, and the final `println!` doesn't do what it looks like.

```rust,editable
use std::thread;

fn main() {
    let numbers = vec![10, 20, 30, 40];

    let handle = thread::spawn(|| {
        let total: i32 = numbers.iter().sum();
        total
    });

    let total = handle.join();
    println!("total = {total}");
}
```

<details><summary>Show solution</summary>

Two separate problems:

1. The closure borrows `numbers`, but `thread::spawn` needs a `'static` closure — add `move` so the thread owns `numbers` outright.
2. `handle.join()` returns a `Result<i32, _>`, not an `i32`. `Result` doesn't implement `Display`, so `println!("{total}")` fails to compile. Call `.unwrap()` to get the actual number out.

```rust,editable
use std::thread;

fn main() {
    let numbers = vec![10, 20, 30, 40];

    let handle = thread::spawn(move || {   // <-- move: the thread now owns `numbers`
        let total: i32 = numbers.iter().sum();
        total
    });

    let total = handle.join().unwrap();    // <-- unwrap the Result to get the i32
    println!("total = {total}");
}
```

Now it compiles and prints `total = 100`.

</details>

## Quick check

<div class="quiz" data-topic="threads-and-spawn"></div>

## Remember this

- `thread::spawn(move || { ... })` starts a new OS thread immediately; `move` is needed because the closure might outlive the caller's stack frame.
- `.join()` blocks until the thread finishes and returns a `Result<T, Box<dyn Any + Send>>` — `Ok(value)` is the closure's return value.
- A panic inside a spawned thread does **not** crash the whole program — only that thread unwinds, and `.join()` reports it as `Err`.
- `.join().unwrap()` turns a worker's panic into a panic on the thread that called it — match the `Err` explicitly if you want to contain the failure.
- Spawning a thread per tiny task is expensive; for lots of small jobs, use a thread pool (e.g. `rayon`) instead.

## Go deeper

- [Rust Book - Using Threads](https://doc.rust-lang.org/book/ch16-01-threads.html) — Spawning and joining threads.

**Next:**

- [Channels (mpsc)](../runtime-and-ecosystem/channels-mpsc.md)
- [Shared state: Arc and Mutex](../runtime-and-ecosystem/shared-state-mutex-and-arc.md)

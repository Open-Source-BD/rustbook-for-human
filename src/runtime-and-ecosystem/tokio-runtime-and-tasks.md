# The Tokio runtime and tasks

> **Intermediate** · Runtime & ecosystem

## What & why

The previous lesson ended on a cliffhanger: `async`/`.await` compile and run fine, but nothing
inside an async function ever executes unless something is actively driving it forward. That
"something" is a **runtime** — and in the Rust ecosystem, that overwhelmingly means **Tokio**.
This lesson is about actually using it: starting it with `#[tokio::main]`, running background
work with `tokio::spawn`, combining futures with `join!` and `select!`, and the single most
common way beginners accidentally sabotage all of it — blocking the very thread async code
depends on.

## The idea, slowly

### `#[tokio::main]`: sugar for "build a runtime, then run this on it"

`main` can't normally be `async` — nothing would ever call `.await` on it. `#[tokio::main]`
fixes that by rewriting your function into ordinary, synchronous code that builds a Tokio
runtime and blocks on your async body. Roughly, this:

```rust
#[tokio::main]
async fn main() {
    println!("hello from async main");
}
```

expands to something like this:

```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            println!("hello from async main");
        });
}
```

`Builder::new_multi_thread()` sets up a small pool of OS worker threads (by default, roughly
one per CPU core). `block_on` is the executor loop from the previous lesson made concrete: it
repeatedly polls your top-level future — parking when it's waiting, resuming when it's
ready — until it finishes, and only then does `main` return. This needs the `tokio` crate and
will not run on the Playground; in a real project:

```bash
cargo new asyncplay && cd asyncplay
cargo add tokio --features full
# paste your code into src/main.rs
cargo run
```

### `tokio::spawn`: run a task concurrently in the background

`tokio::spawn(future)` is `thread::spawn`'s async cousin: hand it a future, and Tokio schedules
it to run **concurrently** with everything else, immediately returning a `JoinHandle` you can
later `.await` to get its result. Unlike `.await`ing a future directly (which runs it in place,
blocking the rest of *this* task until it's done), a spawned task runs independently — the
caller keeps going right away.

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        "task result".to_string()
    });

    println!("spawned — the task is already running concurrently");
    let result = handle.await.unwrap(); // wait for it, and get its value
    println!("got: {result}");
}
```

Here's the part that surprises almost everyone the first time: a spawned future must be
**`'static`** (own everything it touches, borrowing nothing with a shorter lifetime) and
**`Send`** (safe to hand across threads). Why so strict? Tokio's default scheduler can move a
task between worker threads at any `.await` point, and the task might keep running long after
the function that spawned it has returned. Tokio genuinely cannot guarantee a borrowed local
will still be alive, or that a non-thread-safe type won't get torn across threads — so it
simply refuses to compile code that risks it.

```rust
#[tokio::main]
async fn main() {
    let name = String::from("rustacean");
    let handle = tokio::spawn(async {
        println!("hello, {name}"); // borrows `name` from main — not 'static
    });
    handle.await.unwrap();
}
```

This fails with error `E0373`: *"async block may outlive the current function, but it borrows
`name`, which is owned by the current function."* The fix — and the almost-always-correct
instinct — is `move`, so the task owns its own copy instead of borrowing:

```rust
#[tokio::main]
async fn main() {
    let name = String::from("rustacean");
    let handle = tokio::spawn(async move {
        println!("hello, {name}"); // now owned by the task
    });
    handle.await.unwrap();
}
```

### `tokio::join!`: run several futures concurrently, wait for all of them

`join!(a, b, c)` starts all its futures and drives them concurrently — while one is waiting on
I/O, another can make progress — and only returns once **every** one of them has finished, as a
tuple of their results, in the order you wrote them.

```rust
async fn fetch(name: &str) -> String {
    // pretend this is a network call
    format!("{name}-done")
}

#[tokio::main]
async fn main() {
    // both run concurrently; if each "takes" 50ms, this takes ~50ms total, not 100ms
    let (a, b) = tokio::join!(fetch("one"), fetch("two"));
    println!("{a} {b}");
}
```

Reach for `join!` whenever you need several independent results before you can continue, and
there's no reason to fetch them one after another.

### `tokio::select!`: race several futures, take whichever finishes first

`select!` is a different shape entirely: it polls several branches concurrently, and the moment
**any one** of them completes, its arm runs — and every other branch is immediately dropped,
mid-flight, uncompleted. It doesn't wait for the rest; it doesn't finish them later. They're
simply cancelled.

```rust
use std::time::Duration;

async fn fetch(name: &str) -> String {
    format!("{name}-done")
}

#[tokio::main]
async fn main() {
    tokio::select! {
        result = fetch("fast") => {
            println!("fast finished first: {result}");
        }
        _ = tokio::time::sleep(Duration::from_secs(5)) => {
            println!("timed out after 5s");
        }
    }
}
```

This is exactly the shape a timeout takes: race the real work against a timer, and whichever
resolves first wins — the loser is simply abandoned. Use `join!` when you need *all* the
results; use `select!` when you need *whichever comes first* and the rest becomes irrelevant.

### Blocking calls stall the whole worker thread

Tokio's concurrency trick only works because tasks *cooperate*: each one runs until it hits an
`.await` on something not yet ready, then politely steps aside so the worker thread can run
other tasks. A genuinely blocking call — `std::thread::sleep`, a synchronous file read, a
long CPU-bound loop with no `.await` in it — doesn't step aside. It monopolizes the OS thread
running it, and every other task scheduled on that same thread simply cannot make progress
until the blocking call returns, no matter how "ready" they are.

This is measurable, not theoretical. Running two tasks on a single-worker-thread runtime:

```rust
use std::time::{Duration, Instant};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let start = Instant::now();

    let blocking = tokio::spawn(async move {
        println!("[{:?}] blocking task: starting", start.elapsed());
        std::thread::sleep(Duration::from_millis(200)); // freezes the whole worker thread
        println!("[{:?}] blocking task: done", start.elapsed());
    });

    let quick = tokio::spawn(async move {
        println!("[{:?}] quick task: ran", start.elapsed());
    });

    blocking.await.unwrap();
    quick.await.unwrap();
}
```

`quick` has nothing to wait on — it should print almost instantly. But it doesn't print until
*after* `blocking` finishes its 200ms sleep, because `std::thread::sleep` never yields: it just
freezes the one worker thread both tasks share. Swap that line for
`tokio::time::sleep(Duration::from_millis(200)).await` and `quick` prints within microseconds,
because the async sleep yields the thread instead of hogging it.

The default multi-thread runtime has several worker threads, which hides this for a while — but
the instant you have more blocking tasks than spare worker threads, the same freeze happens.
When you genuinely need to run blocking or CPU-heavy work inside an async program, hand it to
`tokio::task::spawn_blocking`, which moves the closure onto a separate thread pool set aside for
exactly this, so it never stalls the async workers:

```rust
let result = tokio::task::spawn_blocking(|| {
    // real blocking work: heavy computation, a blocking library call, etc.
    std::thread::sleep(std::time::Duration::from_millis(10));
    42
}).await.unwrap();
```

## Common mistakes

- **Forgetting `move` on a spawned task.** `tokio::spawn(async { ... })` that borrows a local
  fails with `E0373` ("may outlive the current function"). Add `move` so the task owns what it
  needs — by far the most common first Tokio error.
- **Calling a blocking function inside an async task.** `std::thread::sleep`, synchronous
  `std::fs` calls, or a tight CPU loop all freeze the worker thread they run on, stalling every
  other task scheduled there. Use `tokio::time::sleep`, `tokio::fs`, or `spawn_blocking`.
- **Assuming `select!`'s losing branches still finish.** They don't — they're dropped mid-flight
  the instant another branch wins. If a branch has side effects partway through, those may never
  complete.
- **Reaching for `join!` when you actually wanted a race, or `select!` when you actually needed
  every result.** They're not interchangeable: `join!` always waits for all; `select!` always
  cancels the rest.
- **Missing the `tokio` dependency or `#[tokio::main]` entirely.** Async code with no runtime
  either fails to compile (`.await` needs async context) or panics at runtime with something
  like "there is no reactor running" — a sure sign nothing is driving your futures.

## Your turn

This spawns a task that greets a name captured from `main`. It refuses to compile.

```rust
#[tokio::main]
async fn main() {
    let name = String::from("rustacean");
    let handle = tokio::spawn(async {
        println!("hello, {name}");
    });
    handle.await.unwrap();
}
```

<details><summary>Show solution</summary>

The compiler rejects this with error `E0373`: the async block borrows `name` from `main`, but
`tokio::spawn` requires everything the task touches to be `'static` — fully owned, not borrowed
from a stack frame that might disappear while the task is still running on some worker thread.

The fix is `move`, so the task takes ownership of its own copy of `name` instead of borrowing
it:

```rust
#[tokio::main]
async fn main() {
    let name = String::from("rustacean");
    let handle = tokio::spawn(async move {
        println!("hello, {name}"); // owned by the task now
    });
    handle.await.unwrap();
}
```

`async move` captures `name` by value, so the task no longer depends on `main`'s stack frame at
all — it can safely be scheduled on any worker thread, for as long as it needs.

</details>

## Quick check

<div class="quiz" data-topic="tokio-runtime-and-tasks"></div>

## Remember this

- `#[tokio::main] async fn main() { ... }` builds a Tokio runtime and blocks on your async body
  — it's the executor from the previous lesson, made concrete.
- `tokio::spawn(future)` runs a future concurrently in the background and requires it to be
  `'static` + `Send`; forgetting `move` on captured locals is the classic first error (`E0373`).
- `tokio::join!(a, b)` runs futures concurrently and waits for **all** of them; `tokio::select!`
  races futures and proceeds with whichever finishes **first**, dropping the rest.
- Blocking calls (`std::thread::sleep`, synchronous file I/O, tight CPU loops) inside an async
  task freeze the whole worker thread they run on — every other task scheduled there stalls too.
- For real blocking or CPU-heavy work, use `tokio::task::spawn_blocking` to move it off the
  async worker threads entirely.

## Go deeper

- [Tokio docs](https://docs.rs/tokio/) — The de facto standard async runtime.

**Next:**

- [Declarative macros (macro_rules!)](../runtime-and-ecosystem/declarative-macros.md)
- [Web services](../runtime-and-ecosystem/web-services.md)

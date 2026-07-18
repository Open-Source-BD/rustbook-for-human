# Async and await

> **Intermediate** · Runtime & ecosystem

## What & why

Async is Rust's way to handle lots of *waiting* efficiently — waiting on a network request, a
database, a file — without hiring a whole thread for each wait. Instead of one thread sitting idle
while a download finishes, an async task steps aside and lets other work run, then picks back up when
the data arrives. It's the model behind fast web servers. It's also the trickiest beginner topic in
Rust, so we'll go slowly.

## The idea, slowly

Imagine a restaurant with one waiter. A *blocking* (normal) waiter takes your order, then stands at
your table doing nothing until your food is cooked, ignoring every other table. Absurd, right? An
*async* waiter takes your order, sends it to the kitchen, and immediately goes to serve other tables.
When your food is ready, they come back. Same one waiter, far more tables served — because the
waiting time is spent on other work.

That's async. The "waiting" is I/O (network, disk, timers). The "serving other tables" is running
other tasks while one is parked waiting.

### `async fn` gives you a future, not a result

When you mark a function `async`, calling it does **not** run it. It hands you back a **future** — a
value that represents "some work that will produce a result later."

```rust,ignore
async fn fetch_value() -> String {
    // pretend this talks to a server
    String::from("ready")
}

fn main() {
    let fut = fetch_value();   // NOTHING has run yet!
    // `fut` is a future. The body of fetch_value hasn't executed.
}
```

The compiler is thinking: *"`async fn` isn't a normal function. I'll rewrite its body into a little
state machine and return that as a future. It just sits there, inert, until something drives it."*
A future that nobody drives does nothing — this surprises everyone at first.

### `.await` drives a future to completion

To actually *get* the `String`, you `.await` the future. `.await` means: *"Run this future. If it
needs to wait for I/O, park me and let other tasks run; wake me when it's ready."* You can only use
`.await` inside an `async` function.

```rust,ignore
async fn fetch_value() -> String {
    String::from("ready")
}

async fn use_it() {
    let value = fetch_value().await;   // now it actually runs
    println!("got: {}", value);
}
```

So `async` and `.await` come as a pair: `async` *makes* futures, `.await` *runs* them (from inside
other async code).

### Something has to run the top future: the executor

Here's the catch that trips up every beginner. `.await` only works inside `async` code. But `main`
is a normal function. So who runs the very first future? A piece of software called an **executor**
(also called a runtime). It's the "engine" that takes your top-level future and actually spins the
state machines, parking and waking tasks.

Rust the *language* gives you `async` and `.await`. It does **not** ship an executor. You pick one
from the ecosystem. By far the most popular is **Tokio**:

```rust,ignore
// Cargo.toml needs:  tokio = { version = "1", features = ["full"] }
// This will NOT run on the Playground — make a real cargo project.

async fn fetch_value() -> String {
    String::from("ready")
}

#[tokio::main]                    // this macro sets up the executor for you
async fn main() {
    let value = fetch_value().await;
    println!("got: {}", value);
}
```

The `#[tokio::main]` attribute is doing a lot of quiet work: it lets `main` be `async`, spins up the
Tokio runtime, and drives your top-level future to completion. Without a runtime like this, your
async code compiles but never actually runs — the futures just sit there.

> **Why can't I press Run on these?** The Playground has no Tokio and can't do real network/disk I/O,
> so async examples are shown, not run. To try them, `cargo new asyncplay`, add the tokio line to
> `Cargo.toml`, paste the code into `src/main.rs`, and `cargo run`.

### Doing two things at once with `join!`

The real payoff: run multiple awaits *concurrently* instead of one-after-another. If two downloads
each take 1 second, awaiting them in sequence takes 2 seconds; joining them takes about 1.

```rust,ignore
use tokio::join;

async fn download(name: &str) -> String {
    // imagine a real network call here
    format!("data for {}", name)
}

#[tokio::main]
async fn main() {
    // both start, both run while the other waits — not one then the other
    let (a, b) = join!(download("alpha"), download("beta"));
    println!("{} / {}", a, b);
}
```

`join!` polls both futures together. This is where async earns its keep: overlapping the *waiting*.

### Threads vs async — which do I use?

- **Threads** (previous lesson) are best for *CPU-heavy* work — crunching numbers on multiple cores.
- **Async** is best for *I/O-heavy* work — thousands of connections that spend most of their time
  waiting. One thread can juggle thousands of async tasks because they're mostly idle.

A web server handling 10,000 slow connections wants async. A program computing prime numbers on 8
cores wants threads. Many real programs use both.

## Common mistakes

- **Expecting an `async fn` to run when called.** Calling it only builds a future. Nothing happens
  until you `.await` it (or hand it to the runtime). Un-awaited futures are a classic silent bug —
  the compiler even warns "future must be used."
- **Forgetting the runtime.** Async code needs an executor. No `#[tokio::main]` (or equivalent) means
  your futures never get driven. "It compiles but does nothing" usually means no runtime.
- **Using `.await` outside async.** `.await` is only legal inside an `async fn` or `async` block.
  In a normal function you must hand the future to a runtime instead.
- **Blocking inside async.** Calling a slow *blocking* function (like `std::thread::sleep` or a
  synchronous file read) inside an async task freezes the whole thread and stalls every other task on
  it. Use the async versions (`tokio::time::sleep`, `tokio::fs`) instead.
- **Awaiting sequentially when you meant concurrently.** `a().await; b().await;` runs them one after
  the other. Use `join!` to overlap their waiting.

## Your turn

Async can't run on the Playground, so this is a "what's wrong here" exercise. This code is supposed
to print the fetched value, but it prints nothing useful and the compiler warns about an unused
future. What are the **two** problems, and how do you fix them?

```rust,ignore
async fn fetch() -> String {
    String::from("hello")
}

fn main() {
    let value = fetch();          // problem 1
    println!("{}", value.await);  // problem 2
}
```

<details><summary>Show solution</summary>

**Problem 1:** `fetch()` just creates a future; its body never runs on its own. **Problem 2:**
`.await` is used inside `main`, but `main` is a *normal* function, and `.await` is only allowed
inside `async` code. On top of that, there's no runtime to drive the future.

The fix is to make `main` async and give it a runtime with `#[tokio::main]`, then `.await` the
future inside it:

```rust,ignore
// Cargo.toml:  tokio = { version = "1", features = ["full"] }

async fn fetch() -> String {
    String::from("hello")
}

#[tokio::main]
async fn main() {
    let value = fetch().await;    // await inside async main, driven by the runtime
    println!("{}", value);
}
```

Now `main` is async, Tokio provides the executor, and `.await` actually runs `fetch` to completion.

</details>

## Quick check

<div class="quiz" data-topic="async-await"></div>

## Remember this

- An `async fn` returns a **future**; calling it runs nothing until the future is awaited or driven.
- `.await` runs a future to completion and can only be used inside `async` code.
- Rust the language has `async`/`.await` but ships **no executor** — you pick a runtime like Tokio.
- `#[tokio::main]` turns `main` into an async entry point and drives your top future.
- Async is for I/O-bound waiting; threads are for CPU-bound crunching. Use `join!` to overlap awaits.

## Go deeper

- [Async book](https://rust-lang.github.io/async-book/) — Official async learning material.

**Next:**

- [CLI apps](../runtime-and-ecosystem/cli-apps.md)
- [Serde and JSON](../runtime-and-ecosystem/serde-and-json.md)

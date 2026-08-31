# Async and await basics

> **Intermediate** · Runtime & ecosystem

## What & why

Most of a slow program's time isn't spent computing — it's spent **waiting**: for a network
reply, a database, a file, a timer. A thread that blocks on each of those wastes the entire
thread doing nothing. Async is Rust's way to describe "work that involves waiting" so that
waiting never ties up a whole OS thread. This lesson is only about the **language-level
mental model** — what `async fn` and `.await` actually do, mechanically, when you write them.
It's the trickiest beginner topic in Rust, so we go slowly, and we deliberately stop short of
running real async programs — that's the next lesson, once you have a runtime (Tokio) to
actually execute this stuff.

## The idea, slowly

### An `async fn` is a recipe card, not a cooked meal

Imagine you hand someone a recipe card instead of a meal. The card describes every step —
chop this, boil that, wait for the oven — but handing it over doesn't cook anything. Nobody's
touched a stove. That card just sits there until someone actually starts following it.

That's exactly what happens when you call an `async fn`. Marking a function `async` changes
what "calling" it means: instead of running the body, Rust hands you back a **`Future`** — a
value describing the work to be done, completely inert until something drives it forward.

```rust,editable
async fn fetch_value() -> String {
    println!("fetch_value: actually running now");
    "ready".to_string()
}

fn main() {
    let future = fetch_value();               // the recipe card, not the meal
    println!("called fetch_value — but did its println fire?");
    drop(future); // thrown away, unstarted — its body never ran a single line
}
```

Run this and only the second `println!` shows up. The first one — *inside* `fetch_value` —
never fires, because `fetch_value`'s body never executed. Calling the function just built a
`Future` object and handed it to you; nothing inside it ran.

**What the compiler is thinking:** when it sees `async fn`, it doesn't compile a function that
runs top to bottom like normal. It rewrites the body into a state machine — a struct that
remembers "which step am I on" — and implements a trait for it, roughly:

```rust
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`poll` is "take one step, or as many steps as you can without waiting." It returns
`Poll::Ready(value)` if the work finished, or `Poll::Pending` if it hit a point where it has
to wait for something. Calling an `async fn` just builds one of these state machines sitting
at step zero. Nobody has called `poll` on it yet — so nothing has happened.

### `.await` follows the recipe — and steps aside instead of standing frozen

Handing someone a recipe card is useless without someone actually cooking. `.await` is what
turns "here's a future" into "actually do this, and here's the value when it's done." But it
does something smarter than just blocking until finished: at every step that requires
waiting — water boiling, an oven preheating — `.await` steps aside and lets *other* work happen
in the meantime, then comes back the instant that step is ready.

Concretely: `.await` repeatedly calls `poll` on the future. Every time `poll` returns
`Poll::Pending` (this step needs to wait), control returns to whatever is running the show
instead of the CPU sitting there spinning or the thread blocking. Other tasks get a turn.
When the thing being waited on becomes ready, this future gets polled again and picks up
exactly where it left off.

This is the core difference from a normal blocking call. `std::thread::sleep(dur)` freezes the
*entire OS thread* — nothing else on that thread can run until it wakes up. An `.await` on an
async sleep, by contrast, gives up its turn so the thread can go do other useful work, then
resumes later. Same waiting, wildly different cost.

`.await` is also restricted: you can only write it inside `async` code (an `async fn` or an
`async` block), because only that code has been rewritten into a pollable state machine that
knows how to pause and resume.

```rust,editable
async fn fetch_value() -> String {
    "ready".to_string()
}

async fn use_it() {
    let value = fetch_value().await;  // legal: .await inside an async fn
    println!("got: {value}");
}

fn main() {
    let _future = use_it();  // still just a recipe card — nothing ran
    println!("main finished, but use_it's body never executed");
}
```

Notice `use_it` itself is `async` — it can `.await` inside itself, but calling `use_it()` from
`main` (a normal, non-async function) still only builds another future. `main` never `.await`s
it, so, again, nothing inside `use_it` (or the `fetch_value` it awaits) ever runs.

### Nothing runs on its own — something has to drive the top future

Here's the catch that trips up every beginner: `.await` only works *inside* async code. But
`main` is a normal function by default. So who follows the very first recipe card? Something
has to repeatedly call `poll` on your top-level future until it's done — parking it while it
waits, waking it back up when it's ready. That something is called an **executor** (or
runtime).

Rust the *language* gives you `async` and `.await` — the syntax for writing and following
recipe cards. It ships **no executor**. Without one, an async program compiles perfectly and
does absolutely nothing at runtime, because nothing is ever calling `poll`. You have to bring
your own kitchen coordinator. The overwhelmingly popular choice in the ecosystem is **Tokio**,
which is exactly what the next lesson is about.

If you write a future and just let it drop without ever awaiting or handing it to a runtime,
the compiler tries to warn you:

```rust,editable
async fn fetch_value() -> String {
    "ready".to_string()
}

fn main() {
    fetch_value(); // statement, result discarded
    println!("done");
}
```

Run this and the compiler prints `warning: unused implementer of \`Future\` that must be
used`, with a note: `futures do nothing unless you .await or poll them`. That warning exists
specifically because "I called an async function and assumed it ran" is the single most common
async mistake.

## Common mistakes

- **Assuming calling an `async fn` runs it.** It only builds a `Future`. Nothing executes until
  something `.await`s or polls it.
- **Using `.await` outside async code.** `.await` is only legal inside an `async fn` or `async`
  block. Writing `value.await` in a plain `fn main()` is a compile error:
  `` `await` is only allowed inside `async` functions and blocks `` (error `E0728`).
- **Letting a future drop unused.** A future you never `.await` or spawn never runs, even if you
  called the function that created it. The compiler's `unused implementer of Future` warning is
  your safety net — don't ignore it.
- **Treating `.await` as "just wait, like a blocking call."** It behaves very differently: while
  waiting, it yields control so other work can run on the same thread. A real blocking call
  (`std::thread::sleep`, synchronous file I/O) has no such courtesy — it freezes the thread.
- **Expecting async to speed up CPU-bound work.** Async concurrency comes from *not blocking
  while waiting on I/O*. If there's no waiting — just a tight computation — async adds
  bookkeeping overhead for no benefit. Plain threads (or nothing at all) are usually the right
  tool there.

## More examples

### Requesting a weather forecast
Calling `get_forecast` doesn't hit the network — it builds a `Future` describing the call, and dropping that future without awaiting it means the request never goes out.

```rust,editable
async fn get_forecast(city: &str) -> String {
    println!("get_forecast: calling the weather API for {city}");
    format!("sunny in {city}")
}

fn main() {
    let forecast = get_forecast("Dhaka");
    println!("holding a Future — the API call above hasn't happened yet");
    drop(forecast);
}
```

### Chaining a login into a dashboard load
One `async fn` can `.await` another to sequence steps — but that inner sequencing only ever plays out once something drives the *outer* future, which `main` never does here.

```rust,editable
async fn log_in(user: &str) -> bool {
    println!("log_in: checking credentials for {user}");
    true
}

async fn load_dashboard(user: &str) -> String {
    let ok = log_in(user).await;
    if ok {
        format!("dashboard for {user}")
    } else {
        String::from("access denied")
    }
}

fn main() {
    let dashboard = load_dashboard("shaon");
    println!("built the login+dashboard future, but log_in's println never ran");
    drop(dashboard);
}
```

### Queuing ad-hoc work with an async block
You don't need a named `async fn` for a one-off task — an `async { ... }` block is a future too, built and left unstarted exactly the same way.

```rust,editable
fn main() {
    let task = async {
        println!("task: uploading screenshot");
        "upload complete"
    };
    println!("task queued — but did 'uploading screenshot' print?");
    drop(task);
}
```

### Firing a metrics ping and forgetting to await it
Calling `ping_metrics(...)` as a bare statement looks like a fire-and-forget call, but it's really an unused `Future` — the compiler's warning is the only thing standing between this and a metrics ping that silently never happens.

```rust,editable
async fn ping_metrics(event: &str) {
    println!("ping_metrics: recording {event}");
}

fn main() {
    ping_metrics("checkout_completed"); // looks fire-and-forget, but it isn't
    println!("checkout finished — did the metrics ping actually fire?");
}
```

## Your turn

This is supposed to fetch a value and print it. It has **two** separate compile errors. Find
both before checking the solution.

```rust,editable
async fn fetch() -> String {
    String::from("hello")
}

fn main() {
    let value = fetch();          // problem 1
    println!("{}", value.await);  // problem 2
}
```

<details><summary>Show solution</summary>

**Problem 1:** `fetch()` only creates a future — calling it does not run the function body.
**Problem 2:** `.await` is used inside `main`, but `main` is an ordinary (non-async) function,
and `.await` is only legal inside `async` code. The compiler rejects this with error `E0728`:
`` `await` is only allowed inside `async` functions and blocks ``.

The syntax fix is to move the `.await` into an `async` function:

```rust,editable
async fn fetch() -> String {
    String::from("hello")
}

async fn run() {
    let value = fetch().await;   // now legal — inside async code
    println!("{value}");
}

fn main() {
    let _future = run();
    println!("main finished, but run()'s body never executed — nothing polled it");
}
```

This compiles cleanly — but notice it *still* doesn't print `"hello"`. `run()` builds a future,
and `main` just drops it. Nobody ever called `.await` on `run()` itself, because `main` isn't
async and can't be (not without help). Fixing the syntax errors got you a program that compiles
and runs, but the async work genuinely never executes, because there's still no executor
driving it. That's not a bug in this exercise — it's the exact wall every async Rust program
alone hits, and the next lesson (the Tokio runtime) is precisely what gets you past it.

</details>

## Quick check

<div class="quiz" data-topic="async-basics"></div>

## Remember this

- Calling an `async fn` does not run its body — it immediately returns a `Future`, a paused
  state machine sitting at step zero.
- `.await` drives a future forward by polling it, and only works inside `async` code.
- While a future is waiting on something, `.await` yields control back instead of blocking the
  OS thread — that's the entire efficiency win over a blocking call.
- `async`/`.await` are just language syntax. Rust ships no executor — you need a runtime (like
  Tokio) to actually drive a future to completion.
- A future you never `.await` or spawn never runs, even though the compiler happily let you
  create it — watch for the `unused implementer of Future` warning.

## Go deeper

- [Async book](https://rust-lang.github.io/async-book/) — Official async learning material.

**Next:**

- [The Tokio runtime and tasks](../runtime-and-ecosystem/tokio-runtime-and-tasks.md)

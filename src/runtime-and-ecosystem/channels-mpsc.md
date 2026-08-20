# Channels (mpsc)

> **Intermediate** · Runtime & ecosystem

## What & why

Once you have more than one thread, they usually need to talk. Rust's guiding motto for this is: *"do not communicate by sharing memory; share memory by communicating."* Instead of several threads reaching into the same variable, they pass ownership of values down a pipe. `std::sync::mpsc` (**m**ulti-**p**roducer, **s**ingle-**c**onsumer) gives you exactly that pipe: a `Sender` you can clone for as many producer threads as you want, and one `Receiver` that reads whatever arrives.

## The idea, slowly

### A channel is a pipe with two ends

`mpsc::channel()` returns a `(Sender, Receiver)` pair — conventionally named `tx` (transmitter) and `rx` (receiver).

```rust,editable
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        for word in ["hello", "from", "the", "worker"] {
            tx.send(word.to_string()).unwrap(); // push a message into the pipe
        }
        // when `tx` is dropped here (closure ends), the channel starts closing
    });

    for received in rx {
        println!("main got: {received}");
    }
}
```

Press Run. The worker thread pushes four words down the pipe; `main` reads them one at a time. We moved `tx` into the thread with `move`, so ownership of the sending end is unambiguous — there's no shared mutable anything here, just values traveling through a pipe.

### `.send()` moves ownership, it doesn't copy

`Sender::send` takes the value by ownership: `fn send(&self, t: T) -> Result<(), SendError<T>>`. Once you send a value, it's gone from your side — the receiving thread owns it now.

```rust,ignore
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let msg = String::from("hello");

    tx.send(msg).unwrap();
    println!("{msg}"); // ERROR: `msg` was moved into `send`
}
```

`msg` moved into `send`, so using it afterward is the same "use after move" error you'd get anywhere else in Rust. If you genuinely need to keep a copy on the sending side, clone it *before* sending: `tx.send(msg.clone())`. This is exactly the behavior you want for concurrency — the receiver gets a value it fully owns, with no risk of the sender also touching it at the same time.

### Many producers, one receiver: cloning the `Sender`

The "multi-producer" half of mpsc means `Sender` implements `Clone`. Each clone is a separate handle to the *same* underlying pipe, so several threads can all send into one `Receiver`.

```rust,editable
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        let tx = tx.clone();               // each thread gets its own handle to the pipe
        thread::spawn(move || {
            tx.send(format!("worker {id} says hi")).unwrap();
        });
    }
    drop(tx); // the original handle must go too, or the channel never looks "empty"

    for msg in rx {
        println!("{msg}");
    }
}
```

`tx.clone()` is cheap — like `Arc`, it's bumping a reference count under the hood, not duplicating the channel. Notice the `drop(tx)` after the loop: the original `tx` was never moved anywhere (only its clones were), so it's still alive in `main`'s scope. If we left it there, the receiving loop below would wait forever for a message that's never coming — see the next section for why.

### The receiver as an iterator: `for msg in rx`

`Receiver<T>` implements `IntoIterator`. A `for msg in rx` loop blocks on each iteration until a message arrives, and the loop **ends automatically once every `Sender` (the original and all its clones) has been dropped.** That's the channel's built-in "we're done" signal — no manual "stop" message required.

This cuts both ways:

- Drop every sender (let them go out of scope, or `drop()` them explicitly) once you're done producing, and the loop finishes cleanly.
- Leave even one `Sender` clone alive somewhere — including an unused original sitting in `main` — and the loop waits forever, because as far as the channel knows, someone might still send.

## Common mistakes

- **Using a value after sending it.** `.send()` moves ownership; if you need the value afterward, clone it first.
- **Leaving a stray `Sender` alive.** A forgotten clone (or the original `tx`, if you only ever used clones) keeps the channel open forever, so `for msg in rx` never returns.
- **Blindly `.unwrap()`-ing `.send()` in a long-running producer.** `send` returns `Err` once the `Receiver` has been dropped — if the reader gave up early, unwrapping panics the sender. Handle the `Result` if that's a real possibility.
- **Trying to clone the `Receiver`.** Only `Sender` is `Clone`. With `std::sync::mpsc` there's always exactly one consumer — if you need multiple readers, look at a different crate (or hand out work via a shared queue instead).
- **Assuming `send()` blocks.** The default channel is unbounded — `send` returns immediately, buffering the value. If you want backpressure (the sender blocks when the buffer is full), use `mpsc::sync_channel(bound)` instead.

## Your turn

This program spawns three worker threads that each send a message, then reads them all in `main`. It doesn't compile.

```rust,editable
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        thread::spawn(move || {
            tx.send(format!("message from worker {id}")).unwrap();
        });
    }

    for msg in rx {
        println!("{msg}");
    }
}
```

<details><summary>Show solution</summary>

The first loop iteration moves `tx` into its closure (`move ||`). By the second iteration, `tx` has already been moved away — there's nothing left to give the next thread. The compiler reports `use of moved value: tx`.

Fix it by cloning `tx` inside the loop, so each thread gets its own handle, and drop the original once you're done handing out clones:

```rust,editable
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        let tx = tx.clone();          // give this thread its own handle
        thread::spawn(move || {
            tx.send(format!("message from worker {id}")).unwrap();
        });
    }
    drop(tx); // main's original copy must go too, or the channel never closes

    for msg in rx {
        println!("{msg}");
    }
}
```

Now every thread sends through its own clone, the original is dropped once handed out, and once all three worker threads finish (dropping their clones too), the `for msg in rx` loop ends on its own.

</details>

## Quick check

<div class="quiz" data-topic="channels-mpsc"></div>

## Remember this

- `mpsc` = multi-producer, single-consumer: clone `Sender` for more producer threads, but there's only ever one `Receiver`.
- `.send(value)` moves `value` across the channel — the receiving thread gets ownership, not a reference.
- `for msg in rx` blocks and yields messages until **every** `Sender` (original plus clones) has been dropped, then the loop ends.
- A stray `Sender` clone left alive anywhere keeps the channel open forever — drop what you don't need.
- `.send()` returns a `Result` that becomes `Err` once the `Receiver` is gone — don't blindly `.unwrap()` it in a long-running producer.

## Go deeper

- [std::sync::mpsc docs](https://doc.rust-lang.org/std/sync/mpsc/index.html) — Channel API reference.

**Next:**

- [Shared state: Arc and Mutex](../runtime-and-ecosystem/shared-state-mutex-and-arc.md)

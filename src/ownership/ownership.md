# Ownership

> **Intermediate** · Ownership

## What & why

Ownership is *the* idea that makes Rust different. It's how Rust keeps your program's memory safe
without a garbage collector and without you calling `free()` by hand. It feels strange for a few
days, and then it clicks and the rest of the language suddenly makes sense. This is the lesson
worth going slow on.

## The idea, slowly

### The problem every language has to solve

Your program uses memory to hold values — a string, a list, a picture. At some point that memory
has to be given back, or your program leaks and slowly eats the machine. Languages solve this in
different ways:

- Some (Python, JavaScript, Java) run a **garbage collector**: a background process that
  occasionally pauses your program and cleans up. Easy for you, but it costs speed and control.
- Some (C, C++) make **you** free memory by hand. Fast, but forget once and you get crashes and
  security holes.

Rust picks a third path: **ownership rules that the compiler checks for you, before the program
ever runs.** No pauses, no manual freeing, no leaks. The catch is you have to learn the rules.

### The three rules

1. Every value has exactly **one owner** (a variable that owns it).
2. There can only be **one owner at a time**.
3. When the owner goes out of scope (its `{ }` block ends), the value is **dropped** — its memory
   is freed automatically.

Think of a value like a physical object and the owner like the person holding it. Only one person
holds it at a time. When that person leaves the room, the object is thrown away.

### "Move": handing the object over

Watch what happens when you assign one variable to another:

```rust,editable
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;               // the value MOVES from s1 to s2
    println!("{}", s2);        // fine — s2 owns it now
    // println!("{}", s1);     // ERROR if you uncomment: s1 no longer owns anything
}
```

`let s2 = s1;` does **not** make a copy of the string. It *moves* ownership from `s1` to `s2`.
After the move, `s1` is empty — using it is a compile error. Rust does this so two variables can
never both think they own (and both try to free) the same memory.

Uncomment the `s1` line and press Run. Read the error. The compiler literally says
`value borrowed here after move`. That message is your friend — it's Rust catching a bug for you
at compile time instead of at 2am in production.

### Why doesn't this happen with numbers?

```rust,editable
fn main() {
    let x = 5;
    let y = x;                 // x is COPIED, not moved
    println!("x = {}, y = {}", x, y);  // both work fine!
}
```

Small, fixed-size values like integers implement a trait called `Copy`. They're so cheap to
duplicate that Rust just copies them instead of moving. So `x` is still usable. The rule of thumb:
**simple stack values (numbers, `bool`, `char`) copy; things that own heap data (like `String`,
`Vec`) move.**

### Moving into a function

Passing a value to a function moves it too, unless it's a `Copy` type:

```rust,editable
fn main() {
    let s = String::from("hi");
    takes_it(s);               // s is moved INTO the function
    // println!("{}", s);      // ERROR: s was moved away
}

fn takes_it(text: String) {
    println!("got: {}", text);
} // text goes out of scope here and the String is dropped
```

This is annoying at first — "I just want to *use* the string, not give it away!" That's exactly
what the **next lesson, borrowing**, is for: a way to *lend* a value without giving up ownership.

## Common mistakes

- **Thinking assignment copies.** For `String`, `Vec`, and most types, `let b = a;` *moves*. `a`
  is gone afterward. Don't assume everything behaves like a number.
- **"Use after move" errors.** If the compiler says a value was "moved," you tried to use a
  variable after its value went somewhere else. The fix is usually to borrow (next lesson) or to
  `.clone()` if you really do want a separate copy.
- **Reaching for `.clone()` too fast.** Cloning works but makes a full copy every time. Fine while
  learning; later you'll prefer borrowing to avoid the cost.

## More examples

### Round-tripping a string through a function
Sometimes a function needs to transform a `String` and hand it right back, rather than just borrowing it — useful as one step in a small text-processing pipeline.

```rust,editable
fn shout(mut text: String) -> String {
    text.push('!');
    text.to_uppercase()
}

fn main() {
    let message = String::from("hello");
    let message = shout(message); // ownership goes in, comes back out
    println!("{message}");
}
```

### Moving a `Vec` into a background thread
Spawning a worker thread to crunch a batch of numbers means handing it full ownership of that data — the main thread can't be trusted to keep using it while another thread works on it.

```rust,editable
use std::thread;

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    let handle = thread::spawn(move || {
        let total: i32 = numbers.iter().sum();
        println!("sum computed on another thread: {total}");
    });

    handle.join().unwrap();
    // numbers is gone here — it was moved into the closure
}
```

### Ownership transfer through a struct field
Placing an order takes ownership of the customer's shipping address — the struct becomes the new home for that `String`, and it moves along with the order.

```rust,editable
struct Order {
    item: String,
    shipping_address: String,
}

fn main() {
    let address = String::from("221B Baker Street");
    let order = Order {
        item: String::from("teapot"),
        shipping_address: address, // address moves into the struct
    };
    println!("Shipping {} to {}", order.item, order.shipping_address);
}
```

### Cloning when you genuinely need two independent copies
A template config should stay untouched while you customize a copy for a specific environment — cloning gives you two `Vec`s that can each change independently.

```rust,editable
fn main() {
    let template = vec![String::from("debug=false"), String::from("port=80")];
    let mut staging = template.clone();
    staging.push(String::from("env=staging"));

    println!("template: {:?}", template); // untouched
    println!("staging: {:?}", staging);   // has the extra line
}
```

## Your turn

This program doesn't compile — it uses `s` after moving it into `greet`. Fix it so it prints the
greeting **and** the length `5`, without removing either `println!`. (Hint: one small `.clone()`,
or think about what you learned — borrowing is coming in the next lesson.)

```rust,editable
fn main() {
    let s = String::from("hello");
    greet(s);
    println!("the word was {} letters", s.len()); // error: s was moved
}

fn greet(word: String) {
    println!("Hi, {}!", word);
}
```

<details><summary>Show solution</summary>

The quickest fix while you're still learning is to give `greet` its own clone, leaving the
original `s` untouched:

```rust,editable
fn main() {
    let s = String::from("hello");
    greet(s.clone());          // hand over a copy
    println!("the word was {} letters", s.len()); // s is still ours
}

fn greet(word: String) {
    println!("Hi, {}!", word);
}
```

The *better* fix (once you finish the Borrowing lesson) is to lend a reference with `&` so nothing
moves at all: `greet(&s)` and `fn greet(word: &String)`. No clone, no cost.

</details>

## Quick check

<div class="quiz" data-topic="ownership"></div>

## Remember this

- Each value has exactly one owner; there's only one owner at a time.
- When the owner's scope ends, the value is dropped (memory freed) automatically.
- Assigning or passing an owning type (`String`, `Vec`, …) **moves** it; the old variable can't be
  used afterward.
- Simple `Copy` types (numbers, `bool`, `char`) are copied instead of moved.
- To use a value without giving it away, **borrow** it — that's the next lesson.

## Go deeper

- [Rust Book - Understanding Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html) — The main ownership chapter.

**Next:**

- [Borrowing](../ownership/borrowing.md)
- [References and dereference](../ownership/references-and-dereference.md)
- [Slices](../ownership/slices.md)

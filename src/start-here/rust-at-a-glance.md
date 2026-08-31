# Rust at a glance

> **Beginner** · Start here

## What & why

Before you learn any language, it helps to know what it's *for* and what shape it has — a map before the streets. This page is that map. It tells you what Rust is good at, the one big idea that makes it different, and the order to learn things in so you don't get lost. Read it once, don't try to memorize it, and come back whenever you feel unsure where you are.

## The idea, slowly

Rust is a language for writing programs that need to be **fast** and **not crash**. That's the whole pitch. Big companies use it for web servers, command-line tools, game engines, operating systems, and parts of your browser. But you don't need to build any of that. You just need to know *why* people reach for Rust, because that "why" explains every strange thing the language will ask of you.

### The trade every language makes

Every programming language has to answer one hard question: **who cleans up the memory?**

When your program makes a value — a piece of text, a list of numbers, an image — the computer sets aside some memory to hold it. When you're done with that value, the memory has to be handed back, or your program slowly eats the whole machine. There are three classic ways to handle this:

- **The garbage collector way** (Python, JavaScript, Java, Go). A hidden helper runs in the background, notices when you're done with things, and cleans up for you. Comfortable — but it pauses your program at random moments and costs speed.
- **The do-it-yourself way** (C, C++). You clean up by hand. Total control and blazing speed — but forget once, clean up twice, or use a value after cleaning it, and you get crashes and security holes. This is where a huge share of real-world bugs come from.
- **The Rust way.** You don't clean up by hand, and there's no background helper. Instead the **compiler** reads your code before it ever runs and works out exactly when each value is finished. If your code is unsafe, it *refuses to build* and tells you why.

That third path is the entire personality of Rust. You get the speed of the do-it-yourself way with the safety of the garbage-collected way. The price is that the compiler is strict, and while you're learning it will say "no" a lot. That's not the compiler being mean. Think of it as a very careful coworker reading over your shoulder, catching bugs at your desk instead of letting them reach real users at 2am.

### "Explicit by default" — what that means for you

Rust likes you to **say what you mean**. It rarely does surprising things behind your back. A tiny example:

```rust,editable
fn main() {
    println!("Rust is explicit by default");
}
```

That prints one line. Nothing hidden, nothing magic. As lessons go on you'll notice Rust makes you spell things out — whether a value can change, who owns it, what type it is when it's unclear. It feels like extra typing at first. The payoff is that when you read Rust code later, it tells you the truth about what it does. There are far fewer "wait, how did *that* happen?" moments.

### The one idea to fear (a little) and then love

If you remember only one word from this whole page, remember **ownership**. It's Rust's rule for who is responsible for each value and when it gets cleaned up. Ownership is why the "who cleans up memory?" question gets answered for free. It's also the thing that confuses every beginner for a few days and then suddenly clicks, after which the rest of the language makes sense. You have a whole lesson on it later. For now just know: it's coming, it's the heart of Rust, and struggling with it at first is completely normal.

### The order that won't overwhelm you

Rust is a big language, but you learn a small useful slice first and grow from there. A sane path:

1. **Get set up** — install the tools, print "Hello, world", learn to read the compiler's error messages (that last skill is worth gold).
2. **Language basics** — variables, types, functions, `if`/`match`, loops. This is the ordinary stuff every language has.
3. **Ownership and borrowing** — the Rust-specific core. Go slow here.
4. **Everyday building blocks** — structs, enums, and the standard library's collections and strings.
5. **The ecosystem** — error handling, testing, and pulling in other people's code.

Don't jump ahead to macros, `unsafe`, or async on day one. Those are advanced rooms in the house; you'll find the doors when you're ready.

## Common mistakes

- **Trying to learn everything at once.** Rust has a lot of surface area, and the docs are thorough to a fault. If you read the whole official book in one sitting you'll drown. The map above exists so you can learn one slice, use it, and only then move on.
- **Starting with the hard, flashy features.** Macros (the `!` things), `unsafe`, and async look powerful and get talked about a lot online. They are *not* where you begin. Beginners who start there get discouraged fast. Orient with this page, then go to install and ownership.
- **Reading a compiler "no" as failure.** When Rust rejects your code it's doing its job — catching a bug before it ships. The error message usually contains the fix. Treat red text as help, not punishment.

## More examples

### Spot the safety net
In a scripting or garbage-collected language, handing a value to a new home while still holding onto the original name is completely normal. Rust asks first — and refuses to build code that tries it.

```rust
fn main() {
    let ticket = String::from("boarding-pass-482");
    let queue = vec![ticket];       // ticket's value moves into the vector
    println!("Printing: {ticket}"); // ERROR: `ticket` was already moved
    println!("Queue: {:?}", queue);
}
```

### A systems mindset vs. a scripting mindset
A scripting language lets you write `total = sum([19.99, 4.50, 12.00])` without a second thought. Rust wants the types settled before it builds anything at all — that upfront precision is what "systems language" buys you.

```rust,editable
fn main() {
    let prices: [f64; 3] = [19.99, 4.50, 12.00];
    let total: f64 = prices.iter().sum();
    println!("Cart total: ${total:.2}");
}
```

### Let Cargo run the whole project
You clone someone else's Rust project and just want to try it, without first learning how its build is wired together.

```bash
cargo run
```

### No silent number conversions
Your quantity comes from a small counter type and your price from a bigger currency type — Rust won't quietly mix them for you, so the conversion has to show up in the code.

```rust,editable
fn main() {
    let quantity: u8 = 200;
    let price_cents: u32 = 350;
    let total_cents = quantity as u32 * price_cents;
    println!("Total: {} cents", total_cents);
}
```

### Errors as values, not exceptions
Some of your input will be messy — a form field, a config line, a CSV column — and instead of an exception that can crash the program if nobody catches it, Rust hands you back a value you're required to look at.

```rust,editable
fn main() {
    let entries = vec!["3", "7", "oops", "12"];
    for text in entries {
        match text.parse::<i32>() {
            Ok(n) => println!("{n} is a valid number"),
            Err(_) => println!("'{text}' is not a number -- no crash, just a value"),
        }
    }
}
```

## Your turn

You can't really "break" a map, so here's a hands-on task instead. Run the program below as-is and read the output. Then change the text inside the quotes to your own sentence — maybe why *you* want to learn Rust — and run it again. Notice that nothing surprising happens: what you typed is exactly what prints. That predictability is the point.

```rust,editable
fn main() {
    println!("Rust is explicit by default");
}
```

<details><summary>Show solution</summary>

There's nothing to fix here — the goal is just to confirm the tool works and to feel how Rust does exactly what you wrote. For example:

```rust,editable
fn main() {
    println!("I am learning Rust so my programs are fast and never crash.");
}
```

If your line printed, your setup works and you're ready for the real lessons.

</details>

## Quick check

<div class="quiz" data-topic="rust-at-a-glance"></div>

## Remember this

- Rust exists to make programs that are both **fast** and **safe from memory bugs**, with no garbage collector.
- The compiler checks your code *before* it runs and refuses to build unsafe code — strictness now saves crashes later.
- **Ownership** is the core idea that makes everything else make sense; it's coming in a later lesson.
- Rust is **explicit by default** — it rarely does hidden things, so code tells you the truth.
- Learn in slices: setup → basics → ownership → structs/enums → ecosystem. Skip macros and `unsafe` for now.

## Go deeper

- [The Rust Book](https://doc.rust-lang.org/book/) — Start with the official learning path.
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — Short runnable examples.

**Next:**

- [Install Rust](../start-here/install-rust.md)
- [Cargo basics](../start-here/cargo-basics.md)
- [Ownership](../ownership/ownership.md)

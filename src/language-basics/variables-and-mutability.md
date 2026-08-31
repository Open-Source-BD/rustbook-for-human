# Variables and mutability

> **Beginner** · Language basics

## What & why

A variable is a name you give to a value so you can use it later. In most languages a variable can be changed whenever you like. Rust flips that default: once you name a value, it's **locked** unless you explicitly ask for permission to change it. This one habit prevents a huge class of "wait, who changed this?" bugs, so it's worth understanding early.

## The idea, slowly

### Naming a value with `let`

You create a variable with the keyword `let`:

```rust,editable
fn main() {
    let name = "Rust";
    println!("Learning {name}");
}
```

Read `let name = "Rust";` as "let the name `name` stand for the text `Rust`." From now on, wherever you write `name`, Rust reads `"Rust"`.

Notice you didn't tell Rust that `name` is text. Rust figured it out from the value on the right. This is called **type inference** — the compiler is quietly thinking "the right-hand side is text, so `name` is text." You'll learn to add types by hand in the next lesson; for now, let Rust guess.

### The surprise: variables don't change by default

Try to change a variable and Rust stops you:

```rust,editable
fn main() {
    let count = 1;
    count = 2;          // ERROR: cannot assign twice to immutable variable
    println!("{count}");
}
```

Press Run and read the error: *"cannot assign twice to immutable variable `count`."* **Immutable** just means "cannot be changed." By default, every `let` you write is immutable.

Why would a language do this? Think of it like writing a value in ink instead of pencil. If you know a value can never change, you can trust it everywhere. The compiler is on your side here: it's saying "you told me `count` was 1, and now you're changing it — did you mean to?"

### Asking permission with `mut`

When you *do* want a value to change, add the word `mut` (short for "mutable," meaning "changeable"):

```rust,editable
fn main() {
    let mut count = 1;   // mut = "I plan to change this"
    count += 1;          // now allowed
    count += 1;
    println!("count is {count}"); // 3
}
```

`let mut count` tells both Rust *and* the next human who reads your code: "keep an eye on this one, it moves." That little `mut` is a promise you make on purpose.

### Shadowing: a new variable wearing the same name

There's a second thing that looks like changing a value but isn't. You can write `let` twice with the same name:

```rust,editable
fn main() {
    let name = "Rust";
    let name = name.len();   // a brand-new variable, also called `name`
    println!("the name has {name} letters"); // 4
}
```

This is called **shadowing**. The second `let name` does not change the first one. It creates a **completely new variable** that happens to reuse the name `name`. The old one is still there underneath, just hidden (shadowed) — like a new sticky note stuck over an old one.

Here's the part beginners love: because it's a brand-new variable, its **type can be different**. The first `name` was text; the second `name` is a number (the length). You could never do that with `mut`, because `mut` changes a value *in place* and the type must stay the same.

So there are two different ideas:

- **`mut`** — same variable, value changes, type stays the same.
- **Shadowing** — new variable reusing the name, type may change.

Use `mut` when you're genuinely updating one thing over time (a counter, a running total). Use shadowing when you want to transform a value into a new form and don't need the old one anymore.

### Constants (a quick mention)

If you have a value that's fixed forever and known at compile time, you can use `const` instead of `let`. Constants are always written in `SCREAMING_SNAKE_CASE` and need a type:

```rust,editable
const MAX_TRIES: u32 = 3;

fn main() {
    println!("You get {MAX_TRIES} tries");
}
```

You don't need `const` often as a beginner. Just recognize it when you see it: "a name for a value that never, ever changes."

## Common mistakes

- **Trying to reassign without `mut`.** `let x = 1; x = 2;` fails with *"cannot assign twice to immutable variable."* The fix is `let mut x = 1;`. This is the single most common early error, and the compiler even suggests adding `mut`.
- **Thinking shadowing mutates the old value.** It doesn't. `let x = 5; let x = x + 1;` makes a new `x`. If you expected to see the old value somewhere else, you'll be confused — nothing changed the first one, it's just hidden.
- **Adding `mut` you never use.** If you write `let mut x = 5;` but never change `x`, Rust warns: *"variable does not need to be mutable."* Drop the `mut`. It's a hint that your intent and your code disagree.
- **Confusing `const` and `let`.** `const` needs an uppercase name and an explicit type, and can't use `mut`. If you try `const x = 5;` you'll get an error asking for the type.

## More examples

### Running total for a shopping cart
Ringing up items one at a time means the total genuinely changes as you go — a textbook job for `mut`.

```rust,editable
fn main() {
    let mut cart_total = 0.0;
    cart_total += 12.99;
    cart_total += 4.50;
    cart_total += 7.25;
    println!("cart total: ${cart_total:.2}");
}
```

### Shadowing to convert units step by step
User input arrives as text, but you need a number, and then you need it in a different unit. Shadowing lets you reuse one name as the value transforms.

```rust,editable
fn main() {
    let temp = "98.6"; // raw input, as text
    let temp: f64 = temp.parse().unwrap(); // now a number
    let temp = (temp - 32.0) * 5.0 / 9.0;  // now Celsius
    println!("{temp:.1}C");
}
```

### A `const` for app-wide config
Things like a retry limit or a max file size don't change while the program runs, and every function that needs them should agree on the same value — that's what `const` is for.

```rust,editable
const MAX_LOGIN_ATTEMPTS: u32 = 3;

fn main() {
    let mut attempts = 0;
    while attempts < MAX_LOGIN_ATTEMPTS {
        attempts += 1;
        println!("attempt {attempts} of {MAX_LOGIN_ATTEMPTS}");
    }
    println!("locked out");
}
```

### Why swapping needs a temporary variable
If you write `a = b; b = a;`, the first line already overwrote `a`, so the second line just copies `b` back into itself. You need somewhere to stash the original value first.

```rust,editable
fn main() {
    let mut a = "left";
    let mut b = "right";

    let temp = a;   // hold a's value before it's overwritten
    a = b;
    b = temp;

    println!("a={a}, b={b}");
}
```

### Shadowing only lasts inside its block
A shadowed name doesn't leak out of the `{ }` it was created in — once the block ends, the outer variable is back, untouched.

```rust,editable
fn main() {
    let status = "pending";
    {
        let status = "approved"; // only shadows inside this block
        println!("inside: {status}");
    }
    println!("outside: {status}"); // original still stands
}
```

## Your turn

This program wants to count up to 3, then relabel the result as a message. It's broken in two places. Fix it so it prints the count going `1, 2, 3` and then a final line. Press ▶ Run.

```rust,editable
fn main() {
    let total = 1;
    total += 1;
    total += 1;
    println!("total is {total}");

    let total = format!("final total: {total}");
    println!("{total}");
}
```

<details><summary>Show solution</summary>

The counter needs `mut` because we change it in place. The second `let total` is fine — that's shadowing, turning the number into a text message, which is allowed.

```rust,editable
fn main() {
    let mut total = 1;
    total += 1;
    total += 1;
    println!("total is {total}");

    let total = format!("final total: {total}");
    println!("{total}");
}
```

The only real bug was the missing `mut`. The re-`let` at the bottom was already correct shadowing.

</details>

## Quick check

<div class="quiz" data-topic="variables-and-mutability"></div>

## Remember this

- `let` names a value; by default that value is **immutable** (can't be changed).
- Add `mut` when you genuinely need to reassign: `let mut x = ...`.
- **Shadowing** (`let x` twice) makes a *new* variable with the same name — it can even change the type.
- `mut` = same variable changes in place; shadowing = new variable, old one hidden.
- Mutability is a deliberate choice you announce, not a free-for-all default.

## Go deeper

- [Rust Book - Variables and Mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html) — Core syntax and examples.

**Next:**

- [Data types](../language-basics/data-types.md)
- [Functions](../language-basics/functions.md)
- [Control flow](../language-basics/control-flow.md)

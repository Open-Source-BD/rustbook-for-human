# Methods and impl blocks

> **Intermediate** · Language basics

## What & why

A method is a function that belongs *to* a type. Instead of `area(rectangle)`, you write `rectangle.area()` — the data and the behavior that acts on it live together. You've been calling methods all along: `text.len()`, `numbers.push(5)`, `String::from("hi")`. This lesson shows you how to write your own, using `impl` blocks, and how to pick the right `self` so ownership stays happy.

## The idea, slowly

### The `impl` block: attaching behavior to a type

You define a struct (the data), then write an `impl` block ("implementation") to hang methods on it:

```rust,editable
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle { width: 3, height: 4 };
    println!("area is {}", rect.area()); // 12
}
```

Read `impl Rectangle { ... }` as "here are the things a `Rectangle` can do." Inside, `area` looks almost like a normal function, except its first parameter is the special word `self`. When you call `rect.area()`, Rust passes `rect` in as `self` automatically. So inside the method, `self` *is* the rectangle you called it on, and `self.width` reaches its field.

The dot before `area` is the giveaway: `rect.area()` is method-call syntax, and `self` is the value on the left of the dot.

### The three receivers: `&self`, `&mut self`, `self`

The first parameter of a method — called the **receiver** — comes in three flavors, and choosing the right one is really a question about ownership (remember the Ownership lesson):

- **`&self`** — "let me *look at* the data." Borrows the value immutably. Use this when the method only reads. Most methods are `&self`.
- **`&mut self`** — "let me *change* the data." Borrows mutably. Use this when the method needs to modify a field.
- **`self`** — "give me the value; I'm taking it." Takes ownership, consuming the value. Use this rarely — only when the method transforms the value into something else and the original shouldn't be used afterward.

Here they are side by side:

```rust,editable
struct Counter {
    count: u32,
}

impl Counter {
    fn get(&self) -> u32 {          // reads only → &self
        self.count
    }

    fn increment(&mut self) {       // changes a field → &mut self
        self.count += 1;
    }

    fn into_total(self) -> u32 {    // consumes self → self
        self.count
    }
}

fn main() {
    let mut c = Counter { count: 0 };
    c.increment();
    c.increment();
    println!("count is {}", c.get()); // 2

    let total = c.into_total();       // c is consumed here
    println!("final total {total}");
    // c can no longer be used — it was moved into into_total
}
```

Think of `&self` as borrowing your friend's book to read it, `&mut self` as borrowing it to scribble a note, and `self` as them *giving* you the book for keeps. The compiler enforces this: to call `increment`, the variable must be `mut`, because you're borrowing it mutably.

### Associated functions: methods without a receiver

Some functions belong to a type but don't act on an existing instance — most commonly, functions that *create* one. These leave off `self` entirely and are called **associated functions**. You call them with `::` instead of a dot:

```rust,editable
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // no self → associated function, a constructor
    fn new(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }

    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle::new(3, 4);   // :: because there's no instance yet
    let sq = Rectangle::square(5);
    println!("{} and {}", rect.area(), sq.area());
}
```

You already know one of these: `String::from("hi")`. `from` is an associated function on `String` — no existing string to act on, so it uses `::` and returns a fresh one. `new` is the conventional name for a constructor, but it's just a regular associated function, nothing magic.

The pattern to remember: **`Type::function()` when there's no instance yet (creating one); `value.method()` when you already have one.**

### Methods keep code tidy

Why put behavior in an `impl` instead of loose functions? Because the logic that belongs to a type lives *with* that type. Anyone reading `Rectangle` sees everything it can do in one place, and calling `rect.area()` reads better than `area(&rect)`. It's the same reason you bundle data into a struct — grouping what belongs together.

## Common mistakes

- **Using `&self` when you need to mutate.** If a method changes a field, it must take `&mut self`. With `&self` you'll get *"cannot assign to `self.x`, which is behind a `&` reference."* Switch the receiver to `&mut self`.
- **Calling a `&mut self` method on a non-`mut` value.** `let c = Counter { ... }; c.increment();` fails because `c` isn't `mut`. The variable must be `let mut c` to allow the mutable borrow.
- **Mixing up `.` and `::`.** Associated functions (no `self`) are called with `::`: `Rectangle::new(...)`. Methods (with `self`) are called with a dot: `rect.area()`. Using the wrong one is a common early error.
- **Accidentally consuming with `self`.** A method that takes `self` (no `&`) *moves* the value; you can't use the variable afterward. If you only meant to read, use `&self` so the caller keeps ownership.
- **Forgetting `self` inside the method.** Fields are `self.width`, not just `width`. Without `self.`, Rust looks for a local variable named `width` and won't find one.

## Your turn

This program defines a `BankAccount` with a deposit method, but it won't compile. The deposit method can't change the balance, and the account it's called on isn't declared right. Fix both. Press ▶ Run.

```rust,editable
struct BankAccount {
    balance: u32,
}

impl BankAccount {
    fn deposit(&self, amount: u32) {
        self.balance += amount;
    }
}

fn main() {
    let account = BankAccount { balance: 100 };
    account.deposit(50);
    println!("balance is {}", account.balance);
}
```

<details><summary>Show solution</summary>

`deposit` changes a field, so it needs `&mut self`. And to call a `&mut self` method, `account` must be declared `mut`.

```rust,editable
struct BankAccount {
    balance: u32,
}

impl BankAccount {
    fn deposit(&mut self, amount: u32) {
        self.balance += amount;
    }
}

fn main() {
    let mut account = BankAccount { balance: 100 };
    account.deposit(50);
    println!("balance is {}", account.balance); // 150
}
```

The `&mut self` lets the method modify `balance`, and `let mut account` allows the mutable borrow.

</details>

## Quick check

<div class="quiz" data-topic="methods-and-impls"></div>

## Remember this

- Methods live in an `impl Type { ... }` block and take a **receiver** as their first parameter.
- `&self` borrows to **read** (most methods), `&mut self` borrows to **change**, `self` **consumes** the value (rare).
- Calling a `&mut self` method requires the variable to be `mut`.
- **Associated functions** have no `self` (often constructors like `new`) and are called with `Type::function()`.
- Method calls use a dot (`value.method()`); associated functions use `::` (`Type::func()`). `String::from` is a familiar example.

## Go deeper

- [Rust Book - Methods](https://doc.rust-lang.org/book/ch05-03-method-syntax.html) — Receiver forms and impl blocks.

**Next:**

- [Traits](../abstractions/traits.md)
- [Generics](../abstractions/generics.md)

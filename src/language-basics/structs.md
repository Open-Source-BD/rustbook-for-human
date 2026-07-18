# Structs

> **Beginner** · Language basics

## What & why

A struct lets you glue several related values together into one named type. Instead of juggling three loose variables — `user_id`, `user_name`, `user_active` — you bundle them into a single `User` value that carries all three. Structs are how you model the "things" in your program: a user, a point, a config, an order. They're one of the two building blocks of Rust types (enums are the other).

## The idea, slowly

### Defining a struct

You define a struct with the `struct` keyword and a list of **fields**, each with a name and a type:

```rust,editable
struct User {
    id: u64,
    name: String,
    active: bool,
}

fn main() {
    println!("defined a User struct");
}
```

Think of this as designing a form: a `User` always has an `id`, a `name`, and an `active` flag. This is just the *blueprint* — no actual user exists yet. It's like a cookie cutter, not a cookie.

By convention, struct names use `CamelCase` (each word capitalized) and field names use `snake_case` (lowercase with underscores).

### Creating an instance

To make an actual `User`, you fill in every field by name:

```rust,editable
struct User {
    id: u64,
    name: String,
    active: bool,
}

fn main() {
    let user = User {
        id: 1,
        name: String::from("Shaon"),
        active: true,
    };

    println!("user id is {}", user.id);   // reach a field with a dot
    println!("name is {}", user.name);
}
```

`User { id: 1, name: ..., active: true }` is a **struct literal**: you list each field and the value it should hold. You must fill in *every* field — Rust won't let you forget one. Once you have a `user`, you read a field with a dot: `user.id`, `user.name`. Same dot you'd use in many languages.

### Changing a field needs `mut`

Just like plain variables, a struct is immutable unless you say `mut`. And it's the *whole* struct that's mutable or not — you can't make just one field changeable:

```rust,editable
struct User {
    id: u64,
    name: String,
    active: bool,
}

fn main() {
    let mut user = User {
        id: 1,
        name: String::from("Shaon"),
        active: true,
    };

    user.active = false;   // allowed because `user` is mut
    println!("active? {}", user.active);
}
```

Drop the `mut` and `user.active = false;` fails with "cannot assign to ... immutable." The `mut` on `let` covers every field of the struct.

### A constructor pattern

Typing out every field each time gets old, especially when some values are always the same. A common habit is to write a function that builds the struct for you:

```rust,editable
struct User {
    id: u64,
    name: String,
    active: bool,
}

fn new_user(id: u64, name: String) -> User {
    User {
        id,
        name,          // shorthand: field `name` gets the variable `name`
        active: true,  // sensible default
    }
}

fn main() {
    let user = new_user(7, String::from("Rust"));
    println!("{} is active? {}", user.name, user.active);
}
```

Two things to notice. First, `active: true` bakes in a default so callers don't have to think about it. Second, the **field init shorthand**: when a variable has the *same name* as the field (`id`, `name`), you can write just `id` instead of `id: id`. Rust matches them up. It's a small convenience you'll see everywhere.

(Later you'll learn to attach this constructor *to* the type as `User::new(...)` using an `impl` block — that's the Methods lesson. This plain function does the same job for now.)

### Tuple structs: names without field names

Sometimes you want a distinct type but the fields don't need names. A **tuple struct** gives you that:

```rust,editable
struct Point(i32, i32);   // two i32s, no field names

fn main() {
    let origin = Point(0, 0);
    println!("x = {}, y = {}", origin.0, origin.1);  // reach by position
}
```

`Point(0, 0)` looks like a tuple but it's its own named type — a `Point` can't be mixed up with some other `(i32, i32)`. You reach into it by position (`.0`, `.1`) like a tuple. Use these sparingly; named fields are usually clearer.

### Why bother, instead of loose variables?

You *could* track `id`, `name`, and `active` as three separate variables. But then nothing ties them together — you could pass the wrong `name` with the wrong `id` and Rust couldn't help. Bundling them in a `User` makes "a user" a real thing the compiler understands, so you can pass one value around, and the pieces travel together and stay in sync.

## Common mistakes

- **Forgetting a field in the literal.** `User { id: 1 }` when the struct also needs `name` and `active` fails with *"missing fields."* You must provide every field when constructing (unless you use struct update syntax to copy the rest from another instance).
- **Trying to make one field mutable.** There's no `mut` on individual fields. Mutability lives on the binding: `let mut user = ...` makes the whole struct changeable. If `user` isn't `mut`, no field can be assigned.
- **Confusing the blueprint with an instance.** `struct User { ... }` defines the type; it does not create a user. You still need `let user = User { ... }` to get an actual value.
- **Wrong field name or type.** `User { naem: ... }` (typo) or putting a number where a `String` goes is a compile error. Fields must match the definition exactly.
- **Reaching into a struct with `::` instead of `.`.** Fields use a dot: `user.name`. The `::` is for paths and associated functions, not field access.

## Your turn

This program defines a `Book` and tries to build and update one, but it won't compile. There are two problems. Fix it so it prints the title and the updated year. Press ▶ Run.

```rust,editable
struct Book {
    title: String,
    year: u32,
}

fn main() {
    let book = Book {
        title: String::from("Rust for Humans"),
    };

    book.year = 2026;
    println!("{} ({})", book.title, book.year);
}
```

<details><summary>Show solution</summary>

The literal is missing the `year` field (every field is required), and `book` must be `mut` before you can change `year`.

```rust,editable
struct Book {
    title: String,
    year: u32,
}

fn main() {
    let mut book = Book {
        title: String::from("Rust for Humans"),
        year: 2025,
    };

    book.year = 2026;
    println!("{} ({})", book.title, book.year);
}
```

Now both fields are provided and the `mut` allows the update.

</details>

## Quick check

<div class="quiz" data-topic="structs"></div>

## Remember this

- A `struct` bundles related named values (fields) into one type — a blueprint, not a value.
- Create one with a struct literal, filling in **every** field: `User { id: 1, name: ..., active: true }`.
- Read fields with a dot (`user.name`); mutating any field needs `let mut` on the whole binding.
- Field init shorthand: `name` instead of `name: name` when the variable and field share a name.
- Tuple structs (`struct Point(i32, i32)`) are named types with positional fields; use named fields when you can.

## Go deeper

- [Rust Book - Structs](https://doc.rust-lang.org/book/ch05-01-defining-structs.html) — How to define and instantiate structs.

**Next:**

- [Methods and impl blocks](../language-basics/methods-and-impls.md)
- [Traits](../abstractions/traits.md)

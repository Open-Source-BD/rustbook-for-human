# Generics

> **Intermediate** · Abstractions

## What & why

Generics let you write a function or type **once** and use it with many different types, without copy-pasting a version for each. The magic word is a stand-in name (usually `T`) that means "some type — I'll tell you which one when I use it." It's how `Vec<T>` can hold numbers *or* strings *or* your own structs from a single definition.

## The idea, slowly

Imagine writing a "return the first item" function. Without generics you'd write one for `Vec<i32>`, another for `Vec<String>`, another for `Vec<bool>`... all identical except the type. That's silly. Generics let you write it once with a placeholder.

### A placeholder for a type

`T` is just a name — a variable, but for *types* instead of values:

```rust,editable
fn first<T>(items: &[T]) -> &T {
    &items[0]
}

fn main() {
    let nums = [10, 20, 30];
    let words = ["red", "green", "blue"];

    println!("{}", first(&nums));  // works with i32
    println!("{}", first(&words)); // works with &str
}
```

Read `fn first<T>(items: &[T]) -> &T`:

- `<T>` right after the name means "I'm introducing a type placeholder called `T`." You *declare* it here, like declaring a variable, before you use it.
- `items: &[T]` means "a slice of some type `T`." (A slice `&[T]` is a borrowed view of a list — you saw slices earlier.)
- `-> &T` means "I return a reference to that same type `T`."

**What the compiler is thinking:** when you call `first(&nums)`, the compiler notices `nums` is `[i32; 3]`, so it decides "`T` is `i32` this time" and stamps out a version of `first` specialized to `i32`. When you call `first(&words)`, it stamps out another for `&str`. You wrote one function; the compiler quietly generated the concrete ones. This is why generics are called **zero-cost**: at runtime there's no guessing, just the specific machine code, as fast as if you'd hand-written each version.

### Generics need bounds to *do* anything

Here's the catch that trips everyone up. Inside a generic function, `T` could be *anything*, so the compiler only lets you do things that work for *every possible* type. You can't add two `T`s, or print a `T`, or compare them — unless you *promise* that `T` can do those things. You make that promise with a **trait bound**.

```rust,editable
fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut biggest = items[0];
    for &item in items {
        if item > biggest {
            biggest = item;
        }
    }
    biggest
}

fn main() {
    let nums = [3, 7, 2, 9, 4];
    let chars = ['a', 'z', 'm'];
    println!("{}", largest(&nums));  // 9
    println!("{}", largest(&chars)); // z
}
```

`<T: PartialOrd + Copy>` reads as "`T` is some type that supports `PartialOrd` (can be compared with `>`) **and** `Copy` (can be duplicated cheaply)." Those are the two abilities the function actually uses: `item > biggest` needs comparison, and `let mut biggest = items[0]` needs a copy. The `+` means "and also."

**Try it:** delete `PartialOrd` from the bound and run. The compiler says `binary operation > cannot be applied to type T` — because you removed the promise that `T` can be compared. The bound isn't red tape; it's you telling the compiler exactly what `T` is allowed to do.

### Generic structs

Types can be generic too. That's exactly how the standard library defines things like `Option<T>` and `Vec<T>`:

```rust,editable
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let ints = Pair { first: 1, second: 2 };
    let words = Pair { first: "hi", second: "bye" };

    println!("{} {}", ints.first, ints.second);
    println!("{} {}", words.first, words.second);
}
```

One `Pair` definition, usable with any type. `Pair<i32>` and `Pair<&str>` are both real types the compiler builds from your single template.

## Common mistakes

- **Using an operation without the matching bound.** Trying `a > b` or `a + b` or `println!("{a}")` on a bare `T` fails, because not every type supports it. The error names the missing trait, e.g. `T doesn't implement std::fmt::Display`. The fix is to add that trait to the bound: `<T: Display>`.
- **Forgetting to *declare* `<T>` before using it.** `fn first(items: &[T])` (no `<T>`) makes the compiler think `T` is a real type it should already know, giving `cannot find type T in this scope`. Declare it: `fn first<T>(...)`.
- **Reaching for generics when one concrete type is fine.** Generics earn their keep when *several* real types will flow through. If only `i32` ever passes, a generic just adds noise. Add the placeholder when real variety shows up, not before.
- **Confusing generics with trait objects (`dyn`).** `<T: Greet>` picks one concrete type per call and is resolved at compile time. `&dyn Greet` mixes different types at runtime. For most beginner code, generics are what you want.

## More examples

### Finding the smallest, not the largest
The same shape of function works whether you want the max or the min — only the comparison direction changes, and the bound needed is identical.

```rust,editable
fn smallest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut min = items[0];
    for &item in items {
        if item < min {
            min = item;
        }
    }
    min
}

fn main() {
    let prices = [19.99, 4.50, 12.25];
    let scores = [88, 92, 71, 95];
    println!("cheapest: {}", smallest(&prices));
    println!("lowest score: {}", smallest(&scores));
}
```

### A generic struct holding one value
Not every generic type needs two fields like `Pair<T>` — sometimes you just want a single value wrapped with some extra behavior, usable with whatever type shows up.

```rust,editable
struct Wrapper<T> {
    value: T,
}

impl<T> Wrapper<T> {
    fn get(&self) -> &T {
        &self.value
    }
}

fn main() {
    let w1 = Wrapper { value: 42 };
    let w2 = Wrapper { value: String::from("hello") };
    println!("{}", w1.get());
    println!("{}", w2.get());
}
```

### Two independent type parameters
A label and a value rarely share a type — `combine` accepts any two types at all, as long as both can be displayed.

```rust,editable
use std::fmt::Display;

fn combine<T: Display, U: Display>(label: T, value: U) -> String {
    format!("{}: {}", label, value)
}

fn main() {
    println!("{}", combine("age", 30));
    println!("{}", combine('x', 3.14));
}
```

### Constraining a generic just enough to print it
Sometimes the only thing a function does with `T` is print it for debugging — so the only bound it needs is `Debug`, nothing more.

```rust,editable
use std::fmt::Debug;

fn dump<T: Debug>(label: &str, item: T) {
    println!("{} = {:?}", label, item);
}

fn main() {
    dump("nums", vec![1, 2, 3]);
    dump("pair", (true, "yes"));
}
```

### Clamping a value into a range
A generic isn't just for comparing two values — `clamp_value` works on any type that can be ordered, whether that's a game score, a volume level, or a price.

```rust,editable
fn clamp_value<T: PartialOrd>(value: T, min: T, max: T) -> T {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

fn main() {
    println!("{}", clamp_value(15, 0, 10));   // 10
    println!("{}", clamp_value(-5, 0, 10));   // 0
    println!("{}", clamp_value(4.5, 0.0, 10.0)); // 4.5
}
```

## Your turn

This function is supposed to return the bigger of two values, for any comparable type. It doesn't compile. Fix the bound so it prints `9` and `z`.

```rust,editable
fn max_of<T>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

fn main() {
    println!("{}", max_of(4, 9));
    println!("{}", max_of('a', 'z'));
}
```

<details><summary>Show solution</summary>

The body compares with `>` and returns one of the values, so `T` must promise it can be **compared** (`PartialOrd`) and **copied** (`Copy`, since `a` and `b` are used by value):

```rust,editable
fn max_of<T: PartialOrd + Copy>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

fn main() {
    println!("{}", max_of(4, 9));
    println!("{}", max_of('a', 'z'));
}
```

Without `PartialOrd` the `>` isn't allowed; the bound grants exactly the ability the code uses.

</details>

## Quick check

<div class="quiz" data-topic="generics"></div>

## Remember this

- A generic type parameter like `T` is a **placeholder for a type**, chosen when you call the code.
- Declare it in angle brackets first: `fn name<T>(...)` or `struct Name<T>`.
- Inside a generic, you can only use abilities you **promise** via trait bounds: `<T: PartialOrd + Copy>`.
- The `+` in a bound means "and also this trait."
- Generics are **zero-cost**: the compiler generates a specialized version per concrete type, so there's no runtime penalty.

## Go deeper

- [Rust Book - Generics](https://doc.rust-lang.org/book/ch10-01-syntax.html) — The basics of generic syntax.

**Next:**

- [Collections](../abstractions/collections.md)
- [Iterators](../abstractions/iterators.md)
- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

# Trait objects and dyn

> **Intermediate** · Abstractions

## What & why

Once you can write `fn f<T: Trait>(x: T)`, a new problem shows up: what if you need a *single collection* that holds many different concrete types, as long as they all implement the same trait — a `Vec` of shapes where some are circles and some are squares? Generics can't do that; each generic function is compiled separately per type, so there's no single `T` that means "circle or square." `dyn Trait` is Rust's answer: a way to talk about "some type implementing `Trait`" *at runtime*, paid for with a small, explicit cost.

## The idea, slowly

### Static dispatch: generics become copies, not runtime checks

When you write a generic function and call it with a concrete type, the compiler doesn't emit one flexible function — it stamps out a **separate copy for every type you call it with**. This is called **monomorphization**:

```rust,editable
trait Shape {
    fn area(&self) -> f64;
}

struct Circle {
    r: f64,
}
struct Square {
    side: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.r * self.r
    }
}
impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn print_area<T: Shape>(s: &T) {
    println!("{:.2}", s.area());
}

fn main() {
    let c = Circle { r: 2.0 };
    let sq = Square { side: 3.0 };
    print_area(&c);  // compiler generates print_area::<Circle>
    print_area(&sq); // compiler generates a SEPARATE print_area::<Square>
}
```

Behind the scenes, this compiles as if you'd written `print_area_circle` and `print_area_square` by hand — two separate functions, each knowing its exact type at compile time. There's no lookup at runtime; the call to `s.area()` jumps straight to `Circle::area` or `Square::area` because the compiler already knows which one. This is **static dispatch**: fast, and free of any runtime cost — but it means `T` is always one fixed type per call site. You cannot put a `Circle` and a `Square` in the same `Vec<T>`, because `Vec<T>` requires every element to be the *same* `T`.

### The problem: mixed types, one interface

```rust,editable
trait Shape {
    fn area(&self) -> f64;
}

struct Circle { r: f64 }
struct Square { side: f64 }
impl Shape for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r }
}
impl Shape for Square {
    fn area(&self) -> f64 { self.side * self.side }
}

fn main() {
    // This does NOT compile: Circle and Square are different types,
    // and Vec<T> needs one T for every element.
    // let shapes = vec![Circle { r: 2.0 }, Square { side: 3.0 }];

    // dyn Trait is the escape hatch: "I don't know or care which
    // concrete Shape this is, only that it has .area()."
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    for s in &shapes {
        println!("{:.2}", s.area());
    }
}
```

`Vec<Box<dyn Shape>>` reads as "a growable list of boxed *something-that-implements-Shape*, and every element can be a different concrete type." That's exactly the flexibility monomorphized generics can't offer.

### Why `dyn Trait` needs a pointer

`dyn Shape` on its own is not a normal, usable type — it's **unsized** (Rust calls this "dynamically sized"). A `Circle` is some fixed number of bytes; a `Square` is a different fixed number of bytes. `dyn Shape` means "whichever one of these it turns out to be," and the compiler can't reserve stack space for a value whose size it doesn't know at compile time. That's why `dyn Shape` by itself doesn't compile as a variable or a `Vec` element — it has to sit behind a pointer (`Box<dyn Shape>`, `&dyn Shape`, or `Rc<dyn Shape>`), because a pointer is always the same fixed size (one machine word) no matter what it points to.

The pointer isn't just an address, either — it's a **fat pointer**: the address of the actual data, plus the address of a **vtable** (a small table of function pointers — one per trait method — generated once per concrete type). Calling `s.area()` through a `dyn Shape` looks up `area` in the vtable and jumps through it. That lookup is the "small runtime cost" of dynamic dispatch — one extra indirection compared to the direct call generics get for free.

**What the compiler is thinking:** with `Box<dyn Shape>`, it doesn't need to know *which* `Shape` at compile time — it only needs to know the `Box` is one pointer wide and that the vtable it points to has an `area` slot. That's enough to generate code that works for every current and future `Shape` implementer, without a single monomorphized copy per type.

### Object safety: not every trait can become `dyn`

A trait can only become a trait object (`dyn Trait`) if the compiler can build that vtable — every method needs a fixed, known-in-advance shape. This property is traditionally called **object safety** (the compiler itself calls it **dyn compatibility**, the more current name for the same idea). Two common things break it:

```rust
trait Container {
    // generic method — breaks object safety.
    // A vtable would need one slot per possible T, which is unbounded.
    fn wrap<T>(&self, value: T) -> Vec<T> {
        vec![value]
    }
}
```

A method that takes a generic type parameter (`fn wrap<T>(...)`) can't go in a vtable, because the vtable would need a different function pointer for *every possible `T`* — there's no fixed list. Same problem with a method that returns `Self` by value: the caller side wouldn't know how much space to reserve, since `Self` could be any concrete implementer.

If you try to write `Box<dyn Container>` for a trait like the one above, the compiler refuses with something like `the trait 'Container' is not dyn compatible ... because method 'wrap' has generic type parameters`. The fix is usually one of: keep the generic method but mark it `where Self: Sized` (which excludes it from the trait-object interface while keeping it for static-dispatch callers), split the trait into a dyn-compatible part and a generic-only part, or just accept that trait and use generics/`impl Trait` instead of `dyn`.

### A third option: `impl Trait` in return position

Sometimes you don't need a *collection* of mixed types — you just want to return "some type that implements `Iterator`" without writing out its long, awkward real name. `impl Trait` in return position does that, and it's resolved entirely at compile time (no vtable, no `Box` required):

```rust,editable
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

fn main() {
    let add5 = make_adder(5);
    println!("{}", add5(10)); // 15
}
```

`-> impl Fn(i32) -> i32` means "this returns *some* concrete type that implements `Fn(i32) -> i32` — I'm not going to name it (closures don't even have nameable types), but the caller can use it as if it does." Unlike `dyn Trait`, every call to `make_adder` must return the *same* concrete type — you can't have one branch return one closure type and another branch return a different one. If you need that, you're back to `Box<dyn Fn(i32) -> i32>`.

| | Static dispatch (`T: Trait` / generics) | `impl Trait` return | `dyn Trait` |
|---|---|---|---|
| Dispatch cost | none — direct call | none — direct call | one vtable lookup |
| Can mix concrete types? | no — one `T` per call site | no — one hidden type per function | yes, behind `Box`/`&`/`Rc` |
| Needs a pointer? | no | no | yes (unsized) |
| Binary size | bigger (copy per type) | normal | normal |

## Common mistakes

- **Writing `dyn Trait` as a bare value or return type.** `fn make() -> dyn Shape { ... }` fails with `doesn't have a size known at compile-time`. It needs a pointer: `Box<dyn Shape>` (owned, heap-allocated) or `&dyn Shape` (borrowed).
- **Trying to put a trait with a generic method behind `dyn`.** The error `the trait '...' is not dyn compatible` means the trait isn't object-safe — usually a generic method or a method returning `Self`.
- **Reaching for `dyn Trait` by default.** If you always know the concrete type at each call site and never need to mix types in one collection, plain generics (`T: Trait`) are faster and give better compiler error messages — save `dyn` for when you genuinely need runtime-chosen, mixed types.
- **Forgetting `impl Trait` return position must be one concrete type per function.** `if cond { return ClosureA } else { return ClosureB }` from an `-> impl Fn(...)` function fails to compile, because the two branches are different underlying closure types even though both implement `Fn`. Use `Box<dyn Fn(...)>` if the concrete type genuinely varies.
- **Confusing `Box<dyn Trait>` with `Box<T>`.** `Box<T>` still knows exactly which `T` it holds and dispatches statically — only writing `dyn` in the type turns on dynamic dispatch.

## Your turn

This program wants a `Vec` that holds both `Circle` and `Square` shapes behind one interface, but it doesn't compile.

```rust,editable
trait Shape {
    fn area(&self) -> f64;
}

struct Circle {
    r: f64,
}
struct Square {
    side: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.r * self.r
    }
}
impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn main() {
    let shapes: Vec<dyn Shape> = vec![Circle { r: 2.0 }, Square { side: 3.0 }];

    for s in &shapes {
        println!("{:.2}", s.area());
    }
}
```

<details><summary>Show solution</summary>

`Vec<dyn Shape>` tries to store `dyn Shape` directly as the element type, but `dyn Shape` is unsized — the compiler doesn't know how many bytes a "some kind of Shape" takes up, since `Circle` and `Square` are different sizes. Every trait-object element has to sit behind a pointer:

```rust,editable
trait Shape {
    fn area(&self) -> f64;
}

struct Circle {
    r: f64,
}
struct Square {
    side: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.r * self.r
    }
}
impl Shape for Square {
    fn area(&self) -> f64 {
        self.side * self.side
    }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    for s in &shapes {
        println!("{:.2}", s.area());
    }
}
```

`Box<dyn Shape>` is a fixed-size fat pointer (data address + vtable address) no matter which `Shape` it points to, so `Vec` is happy to store many of them side by side even though the things they point to are different sizes.

</details>

## Quick check

<div class="quiz" data-topic="trait-objects-and-dyn"></div>

## Remember this

- Generics (`T: Trait`) use **static dispatch**: the compiler monomorphizes a separate copy per concrete type, so calls are direct and free — but every call site has exactly one `T`.
- `dyn Trait` uses **dynamic dispatch**: one shared function per method, looked up through a vtable at runtime — a small cost that buys the ability to mix concrete types.
- `dyn Trait` is unsized and must live behind a pointer: `Box<dyn Trait>` (owned), `&dyn Trait` (borrowed), or `Rc<dyn Trait>` (shared).
- A trait is **object-safe** only if the compiler can build a fixed vtable for it — generic methods and methods returning `Self` break that.
- `impl Trait` in return position is a third option: "some fixed concrete type, resolved at compile time" — no vtable, no pointer required, but every return path must produce the same underlying type.

## Go deeper

- [Rust Book - Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — When and how to use dyn Trait.

**Next:**

- [Generics](../abstractions/generics.md)
- [Smart pointers](../runtime-and-ecosystem/smart-pointers.md)

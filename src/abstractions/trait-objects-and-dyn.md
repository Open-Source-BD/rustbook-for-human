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

## More examples

### Total area across mixed shapes
A floor-plan tool needs one number — total square footage — from a list of rooms that are circles, rectangles, and triangles all mixed together. `dyn Shape` is what lets one loop handle all three.

```rust,editable
trait Shape {
    fn area(&self) -> f64;
}
struct Circle { r: f64 }
struct Rectangle { w: f64, h: f64 }
struct Triangle { base: f64, height: f64 }
impl Shape for Circle { fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r } }
impl Shape for Rectangle { fn area(&self) -> f64 { self.w * self.h } }
impl Shape for Triangle { fn area(&self) -> f64 { 0.5 * self.base * self.height } }

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { r: 1.0 }),
        Box::new(Rectangle { w: 2.0, h: 3.0 }),
        Box::new(Triangle { base: 4.0, height: 2.0 }),
    ];
    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("total area: {:.2}", total);
}
```

### `&dyn Trait` vs `impl Trait` as a parameter
Both spellings accept "anything that implements `Named`," but they read differently and fit different callers — `impl Trait` is the everyday default, `&dyn Trait` is what you reach for when the caller already has a trait object on hand.

```rust,editable
trait Named {
    fn name(&self) -> &str;
}
struct Robot { label: String }
impl Named for Robot { fn name(&self) -> &str { &self.label } }

// impl Trait: compiler picks one concrete type per call site
fn greet_impl(n: &impl Named) {
    println!("hello, {} (impl Trait)", n.name());
}
// &dyn Trait: same call works through a vtable, useful when the caller
// only has a trait object handy (e.g. from a Vec<Box<dyn Named>>)
fn greet_dyn(n: &dyn Named) {
    println!("hello, {} (dyn Trait)", n.name());
}

fn main() {
    let r = Robot { label: String::from("R2") };
    greet_impl(&r);
    greet_dyn(&r);
}
```

### A plugin-style callback list
A build tool wants to run an arbitrary list of registered steps in order, without knowing ahead of time how many there are or what each one does — `Vec<Box<dyn Fn()>>` is a list of "callable things," not a list of one specific closure type.

```rust,editable
fn main() {
    let handlers: Vec<Box<dyn Fn()>> = vec![
        Box::new(|| println!("handler 1: sending email")),
        Box::new(|| println!("handler 2: logging event")),
        Box::new(|| println!("handler 3: updating cache")),
    ];

    for handle in &handlers {
        handle();
    }
}
```

### Storing a trait object in a struct field
An app that might notify users by email today and by SMS tomorrow doesn't want its `App` struct locked to one concrete notifier type — it just stores "something that can notify."

```rust,editable
trait Notifier {
    fn notify(&self, msg: &str);
}
struct EmailNotifier;
impl Notifier for EmailNotifier {
    fn notify(&self, msg: &str) { println!("EMAIL: {}", msg); }
}

struct App {
    notifier: Box<dyn Notifier>,
}

fn main() {
    let app = App { notifier: Box::new(EmailNotifier) };
    app.notifier.notify("build finished");
}
```

### Trait objects without `Box`: borrowed, not owned
When the concrete values already live on the stack and you just need a temporary mixed-type list, a borrowed `&dyn Trait` skips the heap allocation `Box` would need.

```rust,editable
trait Animal {
    fn speak(&self) -> String;
}
struct Dog;
struct Cat;
impl Animal for Dog { fn speak(&self) -> String { String::from("Woof") } }
impl Animal for Cat { fn speak(&self) -> String { String::from("Meow") } }

fn main() {
    let dog = Dog;
    let cat = Cat;
    // no heap allocation needed — just borrow each one as a trait object
    let animals: Vec<&dyn Animal> = vec![&dog, &cat];

    for a in &animals {
        println!("{}", a.speak());
    }
}
```

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

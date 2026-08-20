# Operator overloading

> **Intermediate** · Abstractions

## What & why

`1 + 2` and `p1 + p2` look like the same kind of thing, but for your own struct, `+` doesn't mean anything until you tell the compiler what it means. In Rust, every operator is secretly a trait method — `a + b` is shorthand the compiler expands to `Add::add(a, b)`. Implement the matching trait from `std::ops` (`Add`, `Sub`, `Mul`, `Index`, ...) for your own type, and it gets to use `+`, `-`, `*`, `[]`, and friends, exactly like a built-in number or collection would.

## The idea, slowly

### Operators desugar to trait methods

There's no special compiler magic for `+` — it's a lookup. When the compiler sees `a + b`, it looks for an `Add` implementation for `a`'s type and rewrites the expression as a call to it:

```rust,editable
use std::ops::Add;

fn main() {
    let sum = 3.add(4); // exactly what 3 + 4 desugars to for integers
    println!("{}", sum);
    println!("{}", 3 + 4); // identical result, normal syntax
}
```

Integers implement `Add` in the standard library, which is *why* `3 + 4` works at all. Every arithmetic and indexing operator in Rust follows this same rule: a symbol is really a method call on a trait, dressed up in familiar syntax.

### Implementing `Add` for your own type

To make `+` work on a struct, implement `std::ops::Add` for it. The trait has one associated type (`Output`, what the `+` expression evaluates to) and one method (`add`, what actually runs):

```rust,editable
use std::ops::Add;

#[derive(Clone, Copy, Debug)]
struct Point { x: i32, y: i32 }

impl Add for Point {
    type Output = Point;
    fn add(self, rhs: Point) -> Point {
        Point { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 3, y: 4 };
    let p3 = p1 + p2; // calls Add::add(p1, p2)
    println!("{:?}", p3); // Point { x: 4, y: 6 }
}
```

**What the compiler is thinking:** `p1 + p2` is rewritten to `Add::add(p1, p2)` before type checking even happens. It then checks that `Point` implements `Add`, that `add` accepts a `Point` on the right-hand side, and that the result type matches how `p3` is used. `Sub` and `Mul` work identically — `impl Sub for Point { type Output = Point; fn sub(self, rhs: Point) -> Point { ... } }` is all `p1 - p2` needs.

Notice `Point` derives `Copy`. Most `std::ops` traits (including `Add`) take `self` by value, which *moves* (or copies, for `Copy` types) the left-hand operand. For a small struct like `Point`, deriving `Copy` means `p1 + p2` doesn't consume `p1` — you can keep using it afterward. For a non-`Copy` type, `self + rhs` would move `self`, so you'd only be able to use the sum, not the original operands, unless you implement `Add` for references instead (`impl Add for &Point`).

### `Index` and `IndexMut`: making `container[key]` work

The same idea extends to `[]`. Implement `Index` (read) and `IndexMut` (read-write) to make your own type support subscript syntax:

```rust,editable
use std::ops::Index;

struct Grid {
    cells: Vec<i32>,
    width: usize,
}

impl Index<(usize, usize)> for Grid {
    type Output = i32;
    fn index(&self, (row, col): (usize, usize)) -> &i32 {
        &self.cells[row * self.width + col]
    }
}

fn main() {
    let grid = Grid { cells: vec![1, 2, 3, 4, 5, 6], width: 3 };
    println!("{}", grid[(1, 2)]); // row 1, col 2 -> cells[1*3 + 2] = cells[5] = 6
}
```

`grid[(1, 2)]` desugars to `*Index::index(&grid, (1, 2))` — `index` returns a reference, and the `[]` syntax automatically dereferences it for you. `IndexMut` follows the same shape but returns `&mut Output`, which is what lets `grid[(1, 2)] = 9;` work as an assignment.

### When overloading helps — and when a named method is clearer

Operator overloading is a judgment call, not a default. It earns its place when the operator's meaning is exactly what the reader would expect from ordinary math or collection syntax: `Point + Point` reads naturally as vector addition; `Matrix * Matrix` reads naturally as matrix multiplication; `grid[(row, col)]` reads naturally as indexing.

It goes wrong when `+` does something a reader wouldn't guess from the symbol — merging two `Config` structs with "last one wins" semantics, or a `+` that has side effects like writing to a file. In those cases a named method (`config.merged_with(other)`, `log.append(entry)`) is far clearer than a surprising operator, because the name tells the reader what actually happens instead of leaning on a symbol to imply it.

## Common mistakes

- **Overloading an operator with surprising semantics.** `+` that mutates one of its operands, has side effects, or doesn't correspond to what "addition" would mean for your type is worse than a named method — readers bring assumptions to `+` that your code should honor, not violate.
- **Assuming `Add` gives you `+=` for free.** `AddAssign` (which powers `+=`) is a *separate* trait from `Add`. Implementing one does not implement the other — if you want both `p1 + p2` and `p += p2` to work, you implement both `Add` and `AddAssign`.
- **Forgetting most `std::ops` traits take `self` by value.** If your type isn't `Copy`, `p1 + p2` moves `p1` (and `p2`), so you can't use them again afterward. Either derive `Copy` for small value-like types, or implement the operator for references (`impl Add for &Point`) so operands are borrowed instead of consumed.
- **Mismatched `Output` type.** `type Output = Point` must match what `add`'s body actually returns and what call sites expect. A mismatch shows up as a type error at the `+` expression itself, which can look confusing if you don't already know operators are trait calls.

## Your turn

`Point` implements `Add`, but this code also tries to use `+=`. It doesn't compile:

```rust,editable
use std::ops::Add;

#[derive(Clone, Copy, Debug)]
struct Point { x: i32, y: i32 }

impl Add for Point {
    type Output = Point;
    fn add(self, rhs: Point) -> Point {
        Point { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

fn main() {
    let mut p = Point { x: 1, y: 2 };
    p += Point { x: 3, y: 4 };
    println!("{:?}", p);
}
```

<details><summary>Show solution</summary>

The error is `binary assignment operation += cannot be applied to type Point`. Implementing `Add` only teaches the compiler what `p1 + p2` means — `+=` is a *different* operator backed by a *different* trait, `AddAssign`, which `Point` doesn't implement yet. Add it:

```rust,editable
use std::ops::{Add, AddAssign};

#[derive(Clone, Copy, Debug)]
struct Point { x: i32, y: i32 }

impl Add for Point {
    type Output = Point;
    fn add(self, rhs: Point) -> Point {
        Point { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

impl AddAssign for Point {
    fn add_assign(&mut self, rhs: Point) {
        self.x += rhs.x;
        self.y += rhs.y;
    }
}

fn main() {
    let mut p = Point { x: 1, y: 2 };
    p += Point { x: 3, y: 4 };
    println!("{:?}", p); // Point { x: 4, y: 6 }
}
```

Each operator symbol maps to its own trait — `+` to `Add`, `+=` to `AddAssign`, `-` to `Sub`, `-=` to `SubAssign`, and so on. Implementing one never implies the other; you implement each operator you actually want to support.

</details>

## Quick check

<div class="quiz" data-topic="operator-overloading"></div>

## Remember this

- Operators are trait methods in disguise: `a + b` desugars to `Add::add(a, b)`.
- `impl Add for Point { type Output = Point; fn add(self, rhs: Point) -> Point { ... } }` enables `p1 + p2`.
- `Index`/`IndexMut` enable `container[key]` syntax for your own collection-like types.
- `+` and `+=` are separate traits (`Add` and `AddAssign`) — implementing one doesn't give you the other.
- Only implement an operator when its meaning is unambiguous — don't overload `+` for something that isn't really addition; use a named method instead.

## Go deeper

- [std::ops module docs](https://doc.rust-lang.org/std/ops/index.html) — Every overloadable operator trait.

**Next:**

- [Unit testing](../runtime-and-ecosystem/unit-testing.md)

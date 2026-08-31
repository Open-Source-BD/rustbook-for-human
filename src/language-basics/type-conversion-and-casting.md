# Type conversion and casting

> **Beginner** · Language basics

## What & why

Rust never converts types behind your back. No language-level "42" + 1 silently becoming 43, no integer quietly widening into a float mid-expression. Every conversion is a decision you write down, and Rust gives you four different tools for four different situations: `as` for "just reinterpret these bits, I know what I'm doing," `From`/`Into` for conversions that always succeed, `TryFrom`/`TryInto` for conversions that might fail, and `FromStr` for turning text into a typed value. Picking the right one is something you'll do constantly, so it's worth understanding what each one actually promises.

## The idea, slowly

### `as`: the no-questions-asked cast

`as` is a manual cast between primitive types. It always compiles, it never panics, and it never checks whether the result "makes sense" — it just reinterprets the bits according to fixed rules. Think of it like pouring water from a big jug into a small cup: Rust won't stop you, it'll just let the extra spill out.

```rust,editable
fn main() {
    let big: i64 = 300;
    let small = big as u8; // u8 only holds 0..=255
    println!("{small}"); // 44
}
```

300 in binary is `1 0010 1100`. A `u8` only keeps the low 8 bits: `0010 1100`, which is 44. That's what "truncation" means for `as` — it's not rounding or clamping, it's chopping off the bits that don't fit.

Casting a negative signed number to an unsigned type follows the same "keep the bit pattern" rule, which can be surprising:

```rust,editable
fn main() {
    let n: i32 = -1;
    let u = n as u8;
    println!("{u}"); // 255
}
```

`-1i32` is stored as all 1-bits (two's complement). Keeping the low 8 bits gives `1111 1111`, which as an unsigned `u8` is 255 — not 0, not an error.

**What the compiler is thinking:** `as` is a promise from you, not a proof. The compiler checks that the cast is *legal* (you can't `as`-cast a `String` to an `i32`), but it does zero checking on whether the *value* fits. That's the whole point — it's the fast, unchecked path.

### Casting between integer widths

Going from a smaller type to a bigger one (**widening**) always preserves the value — for signed integers the sign bit is extended, for unsigned integers the top is filled with zeros. Going from bigger to smaller (**narrowing**) keeps only the low bits and can change the value entirely.

```rust,editable
fn main() {
    let small: i16 = -5;
    let widened = small as i64; // sign-extended: still -5
    println!("{widened}");

    let n: i64 = 70_000;
    let narrowed = n as i16; // i16 only holds -32768..=32767
    println!("{narrowed}"); // 4464 — not 70000, and not an error
}
```

### Float-to-int casts: truncation, and saturation at the edges

Casting a float to an integer with `as` truncates toward zero (it drops the fractional part, it doesn't round):

```rust,editable
fn main() {
    let x = 3.9_f64;
    println!("{}", x as i32); // 3, not 4

    let neg = -3.9_f64;
    println!("{}", neg as i32); // -3, not -4
}
```

What happens when the float is way out of range for the target integer? Rust **saturates** instead of producing garbage — the result clamps to the target type's min or max:

```rust,editable
fn main() {
    let huge = 1e20_f64;
    println!("{}", huge as i32); // i32::MAX (2147483647)

    let tiny = -1e20_f64;
    println!("{}", tiny as i32); // i32::MIN
}
```

### `From` and `Into`: conversions that always succeed

`From`/`Into` are for conversions between richer types that can never fail — every input has a valid output. You implement `From`, and Rust hands you `Into` automatically: the standard library has a blanket implementation `impl<T, U> Into<U> for T where U: From<T>`, so writing one trait gives you both directions of API.

```rust,editable
struct Feet(f64);
struct Meters(f64);

impl From<Feet> for Meters {
    fn from(f: Feet) -> Meters {
        Meters(f.0 * 0.3048)
    }
}

fn main() {
    let f = Feet(10.0);
    let m: Meters = Meters::from(f); // explicit direction
    println!("{:.2}", m.0);

    let f2 = Feet(10.0);
    let m2: Meters = f2.into(); // same conversion, via the free Into
    println!("{:.2}", m2.0);
}
```

Only implement `From` when the conversion is *total* — every possible `Feet` value must become a valid `Meters` value. If some inputs can't be converted, `From` is the wrong trait.

### `TryFrom` and `TryInto`: conversions that can fail

When a conversion might not be possible — like fitting a big number into a small integer type — reach for `TryFrom`/`TryInto`, which return a `Result` instead of an unconditional value:

```rust,editable
use std::convert::TryFrom;

fn main() {
    let ok: i32 = 200;
    let too_big: i32 = 300;

    println!("{:?}", u8::try_from(ok));      // Ok(200)
    println!("{:?}", u8::try_from(too_big)); // Err(...) — 300 doesn't fit in a u8
}
```

Unlike `as`, `u8::try_from(300)` doesn't silently wrap to 44 — it tells you the conversion was impossible and lets you decide what to do about it. This is the tool to reach for whenever an out-of-range value represents a real bug you want to catch, not a value you're happy to truncate.

### Parsing text with `FromStr`

Turning a string into a number (or any type that implements it) goes through the `FromStr` trait, called via `.parse()`:

```rust,editable
fn main() {
    let good: Result<i32, _> = "42".parse();
    let bad: Result<i32, _> = "abc".parse();

    println!("{good:?}"); // Ok(42)
    println!("{bad:?}");  // Err(ParseIntError { .. })

    let n: i32 = "42".parse().unwrap(); // target type inferred from the `let`
    println!("{n}");

    let m = "42".parse::<i32>().unwrap(); // or spell it out with turbofish
    println!("{m}");
}
```

`.parse::<i32>()` works because `i32` implements `FromStr` — `.parse()` is really just calling `FromStr::from_str` for you. Since parsing text can always fail (the text might not be a valid number), it returns a `Result`, exactly like `TryFrom`.

## Common mistakes

- **Using `as` to shrink a value and being surprised later.** `as` never panics and never warns — it truncates or wraps silently. If out-of-range input would be a bug, use `TryFrom`/`TryInto` instead.
- **Assuming `as` clamps negative numbers to zero when casting to an unsigned type.** It doesn't — it reinterprets the bit pattern, so `-1i32 as u8` is `255`, not `0`.
- **Implementing `From` for a conversion that can actually fail.** `From` promises the conversion always succeeds. If some inputs are invalid, implement `TryFrom` and return `Err` for them.
- **Calling `.unwrap()` on `.parse()` or `try_from()` with untrusted input** (user input, file contents, network data). That crashes the whole program on the first bad value instead of handling the error.

## More examples

### Parsing a CLI-style argument
Command-line arguments always arrive as text, even when they represent a number, so parsing with a fallback is the everyday pattern for reading them safely.

```rust,editable
fn main() {
    let args = ["quantity", "12"];
    let quantity: i32 = args[1].parse().unwrap_or(0);
    println!("ordering {quantity} units");
}
```

### Safely fitting a value into a pixel channel
A computed brightness value might come out too large for a single color channel, so `TryFrom` lets you check instead of silently corrupting the color.

```rust,editable
use std::convert::TryFrom;

fn main() {
    let brightness: i32 = 240;
    match u8::try_from(brightness) {
        Ok(channel) => println!("pixel channel: {channel}"),
        Err(_) => println!("value doesn't fit in a byte"),
    }
}
```

### Truncating a request ID into a small bucket
Hashing or bucketing schemes sometimes *want* the wraparound behavior of `as` — you're deliberately keeping only the low bits to spread values across a fixed number of buckets.

```rust,editable
fn main() {
    let request_id: u32 = 4_294_967_290; // near u32::MAX
    let bucket = request_id as u8; // wraps around, keeps only low 8 bits
    println!("bucket: {bucket}");
}
```

### Turning an enum into its numeric score
Enums can carry an explicit numeric value, and `as` reads it back out — handy for things like priority levels you want to compare or sort.

```rust,editable
enum Priority {
    Low = 1,
    Medium = 5,
    High = 10,
}

fn main() {
    let level = Priority::Medium as i32;
    println!("priority score: {level}");
}
```

### `From` for a total, always-valid unit conversion
Minutes-to-seconds can never fail — every minute count has a valid seconds count — so this is exactly the kind of conversion `From` is meant for.

```rust,editable
struct Seconds(u32);

impl From<u32> for Seconds {
    fn from(minutes: u32) -> Seconds {
        Seconds(minutes * 60)
    }
}

fn main() {
    let duration: Seconds = 5.into(); // 5 minutes -> seconds
    println!("{} seconds", duration.0);
}
```

## Your turn

This function is supposed to clamp an `i32` down into a `u8`, returning `0` for anything out of range. It doesn't compile.

```rust,editable
use std::convert::TryFrom;

fn to_byte(n: i32) -> u8 {
    u8::try_from(n) // forgot to handle the Result
}

fn main() {
    println!("{}", to_byte(50));
    println!("{}", to_byte(300));
}
```

<details><summary>Show solution</summary>

`u8::try_from(n)` returns `Result<u8, TryFromIntError>`, but `to_byte` promises to return a plain `u8`. The fix is to actually handle both outcomes of the `Result`:

```rust,editable
use std::convert::TryFrom;

fn to_byte(n: i32) -> u8 {
    match u8::try_from(n) {
        Ok(b) => b,
        Err(_) => 0, // out of range: fall back instead of crashing
    }
}

fn main() {
    println!("{}", to_byte(50));  // 50
    println!("{}", to_byte(300)); // 0
}
```

`try_from` hands back a `Result` precisely because the conversion can fail — the compiler won't let you treat that `Result` as if it were the value itself. `match` (or `.unwrap_or(0)`, or `?` in a function that itself returns `Result`) is how you unpack it.

</details>

## Quick check

<div class="quiz" data-topic="type-conversion-and-casting"></div>

## Remember this

- `as` casts numbers by keeping/extending bits — it always compiles, never panics, and can silently truncate or wrap.
- Widening (small type → big type) always preserves the value; narrowing (big type → small type) can change it.
- Float-to-int `as` casts truncate toward zero, and saturate to the target's min/max instead of producing garbage for out-of-range floats.
- `From`/`Into` are for conversions that always succeed — implement `From`, and `Into` comes for free.
- `TryFrom`/`TryInto` return `Result` for conversions that can fail — reach for these when an out-of-range value is a real bug.
- `"text".parse::<T>()` converts a string into `T` via `FromStr`, returning `Result<T, T::Err>`.

## Go deeper

- [Rust Book - Type Conversions](https://doc.rust-lang.org/rust-by-example/types/cast.html) — `as` casting rules.
- [std::convert docs](https://doc.rust-lang.org/std/convert/index.html) — From, Into, TryFrom, TryInto.

**Next:**

- [Formatting with format!](../language-basics/formatting-with-format.md)
- [Functions](../language-basics/functions.md)

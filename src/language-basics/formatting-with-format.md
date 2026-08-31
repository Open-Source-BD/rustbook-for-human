# Formatting with format!

> **Beginner** · Language basics

## What & why

Almost every program needs to turn data into text — a log line, an error message, a report. Rust doesn't make you glue strings together with `+`; instead `println!`, `format!`, `write!`, and `eprintln!` all share one formatting mini-language, written inside `{}`. Learn that language once and you can print, build strings, log to stderr, and write into files with the same syntax.

## The idea, slowly

### The four macros: where the text goes

- `println!` — prints to stdout, with a trailing newline.
- `print!` — prints to stdout, no newline.
- `eprintln!` / `eprint!` — same, but to stderr (the channel for errors/logs, kept separate from normal output).
- `format!` — builds and *returns* a `String` instead of printing anything.
- `write!` / `writeln!` — write formatted text into anything that implements `std::fmt::Write` (like a `String`) or `std::io::Write` (like a file), returning a `Result` you're expected to handle.

```rust,editable
use std::fmt::Write;

fn main() {
    let name = "Ferris";

    println!("Hello, {name}!"); // stdout + newline
    print!("no newline here ");  // stays on the same line
    println!("<- still here");

    eprintln!("this goes to stderr, not stdout"); // for errors/logs

    let s = format!("{name} says hi"); // builds a String, prints nothing
    println!("{s}");

    let mut buf = String::new();
    write!(buf, "{name} again").unwrap(); // write! returns a Result — must be handled
    println!("{buf}");
}
```

### `{}` (Display) vs `{:?}` / `{:#?}` (Debug)

`{}` uses the `Display` trait — clean, user-facing output. `{:?}` uses `Debug` — a developer-facing dump of a value's structure, and `{:#?}` is the same thing "pretty-printed" across multiple lines. Most built-in types implement both; your own types get `Debug` for free with `#[derive(Debug)]`, but `Display` has to be written by hand (more on that below).

```rust,editable
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{p:?}");  // Point { x: 1, y: 2 }
    println!("{p:#?}"); // pretty-printed across multiple lines

    let v = vec![1, 2, 3];
    println!("{v:?}"); // [1, 2, 3]

    // println!("{p}"); // ERROR: `Point` doesn't implement Display
}
```

**What the compiler is thinking:** `{:?}` isn't "print whatever you can figure out" — it's a real trait bound. If the type doesn't implement `Debug`, `{p:?}` fails to *compile*, not fails silently at runtime. That's why `#[derive(Debug)]` shows up on almost every struct in real code: it's cheap insurance for the day you need to inspect a value.

### Positional, named, and captured arguments

```rust,editable
fn main() {
    println!("{} scored {}", "Alice", 90);          // positional, implicit order
    println!("{0} scored {1}, {0} wins", "Bob", 88); // explicit index, reused

    let name = "Ferris";
    let score = 100;
    println!("{name} scored {score}");                 // captures variables directly
    println!("{n} scored {s}", n = name, s = score);   // named arguments
}
```

Captured identifiers (`{name}`) only work for plain variable names already in scope — not expressions or field access like `{player.score}`. For those you still pass the value as a regular argument: `println!("{}", player.score)`.

Format strings are checked at **compile time**: reference an argument that doesn't exist, or write invalid syntax inside `{}`, and the build fails right there — it never becomes a runtime surprise.

### Width, precision, alignment, and fill

Inside the braces, after a `:`, you can control exactly how a value is padded:

```rust,editable
fn main() {
    let value = 3.14159;
    println!("[{value:>8.2}]"); // right-align, width 8, 2 decimals: [    3.14]
    println!("[{value:<8.2}]"); // left-align:                      [3.14    ]
    println!("[{value:^8.2}]"); // center-align:                    [  3.14  ]

    let n = 7;
    println!("{n:03}"); // zero-padded to width 3: 007

    println!("[{:*>10}]", "hi"); // fill char '*', right-align, width 10: [********hi]

    let long = "Hello, world!";
    println!("{long:.5}"); // precision on a string truncates it: Hello
}
```

The pattern is `{value:fill align width.precision}` — `fill` is the padding character (default space), `align` is `<` / `>` / `^` (left/right/center), `width` is the minimum total characters, and `.precision` means "decimal places" for floats but "max length" for strings.

### Writing your own `Display`

`Debug` is mechanical and derived; `Display` is what you write by hand when you want *your* type to print the way an end user should see it:

```rust,editable
use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 3, y: 4 };
    println!("{p}"); // (3, 4) — via our Display impl
}
```

Inside `fmt`, you use `write!(f, ...)` — the same macro family, now writing into the formatter Rust gave you.

## Common mistakes

- **Printing `Debug` output where a user will see it.** `{:?}` is for developers debugging; implement `Display` for anything a real user reads.
- **Forgetting `#[derive(Debug)]`.** `{:?}` on a type without it is a compile error ("the trait `Debug` is not implemented"), not a blank line at runtime.
- **Dropping the `Result` from `write!`.** `write!`/`writeln!` can fail (writing to a file, for instance), so Rust warns on an unused `Result` — call `.unwrap()`, handle it with `?`, or `.expect(...)`.
- **Trying to format a field access or expression as a captured identifier**, like `{player.score}` — only bare variable names can be captured; expressions must be passed as arguments.

## More examples

### Aligning a printed receipt
Left-aligning the item name and right-aligning the price inside a fixed width is what makes a loop of `println!` calls line up into neat columns instead of a ragged list.

```rust,editable
fn main() {
    let items = [("Coffee", 4.50), ("Bagel", 3.25), ("Orange Juice", 2.75)];

    for (name, price) in items {
        println!("{name:<15}${price:>6.2}");
    }
}
```

### Drawing a download progress bar
A fill character combined with left-alignment turns a plain string into a growing bar — the filled portion is real text, and the format spec pads the rest with `-` up to the target width.

```rust,editable
fn main() {
    let percent = 65;
    let filled = "#".repeat((percent / 5) as usize);
    println!("[{:-<20}] {}%", filled, percent);
}
```

### Printing a color as a CSS hex code
`{:02X}` formats a byte as two uppercase hex digits, zero-padded — string that together for red, green, and blue and you get exactly the `#RRGGBB` format a browser expects.

```rust,editable
fn main() {
    let (r, g, b) = (255u8, 99u8, 71u8); // tomato red
    println!("#{:02X}{:02X}{:02X}", r, g, b);
}
```

### A countdown timer's own `Display`
Writing `Display` by hand lets `Countdown` decide it should always print as zero-padded `MM:SS`, no matter how the caller formats it — the conversion from raw seconds lives in one place.

```rust,editable
use std::fmt;

struct Countdown {
    total_seconds: u32,
}

impl fmt::Display for Countdown {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let minutes = self.total_seconds / 60;
        let seconds = self.total_seconds % 60;
        write!(f, "{:02}:{:02}", minutes, seconds)
    }
}

fn main() {
    let timer = Countdown { total_seconds: 125 };
    println!("time remaining: {}", timer);
}
```

## Your turn

This program has two formatting mistakes. Find them before running it.

```rust,editable
struct Player {
    name: String,
    score: u32,
}

fn main() {
    let p = Player { name: String::from("Ferris"), score: 42 };
    println!("{p}");
    println!("score: {p.score}");
}
```

<details><summary>Show solution</summary>

`Player` doesn't implement `Display`, so `{p}` fails to compile. And `{p.score}` isn't a valid captured identifier — capturing only works for plain variable names, not field access, so it's an invalid format string on top of the missing `Display` impl.

```rust,editable
use std::fmt;

struct Player {
    name: String,
    score: u32,
}

impl fmt::Display for Player {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} ({})", self.name, self.score)
    }
}

fn main() {
    let p = Player { name: String::from("Ferris"), score: 42 };
    println!("{p}");                // now uses our Display impl: Ferris (42)
    println!("score: {}", p.score); // field access passed as a normal argument
}
```

Implementing `Display` fixes the first `println!`; passing `p.score` as an ordinary positional argument (instead of trying to capture it) fixes the second.

</details>

## Quick check

<div class="quiz" data-topic="formatting-with-format"></div>

## Remember this

- `println!`/`print!` write to stdout, `eprintln!`/`eprint!` write to stderr, `format!` returns a `String`, `write!`/`writeln!` write into any `fmt::Write`/`io::Write` target.
- `{}` uses `Display` (user-facing); `{:?}`/`{:#?}` use `Debug` (developer-facing, derivable).
- Arguments can be positional (`{}`/`{0}`), named (`{n = value}`), or captured directly from a variable in scope (`{name}`) — but captures only work for plain identifiers, not expressions.
- `{value:fill align width.precision}` controls padding: alignment (`<`/`>`/`^`), minimum width, and decimal places (floats) or max length (strings).
- Format strings are checked at compile time, so a typo in `{}` is a build failure, not a runtime bug.

## Go deeper

- [std::fmt docs](https://doc.rust-lang.org/std/fmt/index.html) — Full formatting syntax reference.

**Next:**

- [Functions](../language-basics/functions.md)
- [Derivable traits](../language-basics/derive-traits.md)

# CLI apps

> **Intermediate** · Runtime & ecosystem

## What & why

A CLI (command-line interface) app is a program you run in the terminal by typing its name, maybe
with some options, like `git commit -m "hi"`. Rust is a great fit for these: they start instantly,
ship as a single file, and never crash from a missing runtime. This lesson covers the three things
every CLI needs — reading arguments, printing to the right place, and exiting with the right code.

## The idea, slowly

### What is an "argument," really?

When you type `myapp hello --loud` in a terminal, the shell hands your program a list of words:
`["myapp", "hello", "--loud"]`. The first word is always the program's own name. Everything after
is input *you* have to make sense of. Rust gives you that list through `std::env::args()`:

```rust,editable
fn main() {
    // Collect the arguments into a vector of Strings.
    let args: Vec<String> = std::env::args().collect();
    println!("{args:?}");
    println!("You passed {} argument(s) (including the program name).", args.len());
}
```

Run this on the Playground and you'll see just the program name, because the Playground runs with
no extra arguments. In a real project, `cargo run -- hello --loud` would show all three. (The `--`
tells cargo "everything after this belongs to *my* program, not to cargo.")

### Reading a specific argument

`args[0]` is the program name, so the *first real* argument is `args[1]`. But what if the user
forgot to pass it? Indexing `args[1]` when it doesn't exist would **panic**. The safe way is
`.get(1)`, which returns an `Option`:

```rust,editable
fn main() {
    let args: Vec<String> = std::env::args().collect();

    // .get(1) is safe: Some(value) if it exists, None if it doesn't.
    match args.get(1) {
        Some(name) => println!("Hello, {name}!"),
        None => println!("Usage: greet <name>"),
    }
}
```

This runs on the Playground (it just prints the usage line, since there's no argument). The lesson:
never assume the user gave you input. `.get()` + `match` turns "missing argument" into a polite
message instead of a crash.

### stdout vs stderr: two separate pipes

Your terminal actually has **two** output streams:

- **stdout** ("standard out") — the program's *real result*. The data. The answer.
- **stderr** ("standard error") — messages *about* the run: progress, warnings, errors.

Why two? Because people pipe programs together. If someone runs `myapp > results.txt`, only stdout
goes into the file; stderr still shows on screen. If you print your error messages to stdout, they
get mixed into `results.txt` and ruin the data. So the rule is: **real output to stdout, everything
else to stderr.**

```rust,editable
fn main() {
    // println! writes to stdout — the actual result.
    println!("42");

    // eprintln! writes to stderr — status and errors.
    eprintln!("done computing");
}
```

`println!` = stdout. `eprintln!` (note the extra `e`) = stderr. That one letter is the whole
difference.

### Exit codes: telling the shell if you succeeded

When a program finishes, it returns a small number to the shell. `0` means success; anything else
means failure. Other tools and scripts rely on this — `myapp && echo ok` only prints `ok` if myapp
exited `0`. You set it with `std::process::exit`:

```rust,editable
fn main() {
    let ok = false;
    if !ok {
        eprintln!("error: something went wrong");
        std::process::exit(1);   // non-zero = failure
    }
    println!("all good");
}
```

A tidier alternative: make `main` return `Result<(), E>`. If it returns `Ok`, Rust exits `0`; if it
returns `Err`, Rust prints the error to stderr and exits non-zero for you.

### When to reach for clap

Parsing `--flags` and `--options=values` by hand gets painful fast. For anything beyond a couple of
arguments, the ecosystem standard is **clap**. You describe your arguments as a struct with
attributes, and clap generates the parser, the `--help` text, and the error messages:

```rust
use clap::Parser;

#[derive(Parser)]
#[command(about = "Greets a person")]
struct Cli {
    /// Who to greet
    name: String,

    /// Say it loudly
    #[arg(long)]
    loud: bool,
}

fn main() {
    let cli = Cli::parse();
    let greeting = format!("Hello, {}!", cli.name);
    if cli.loud {
        println!("{}", greeting.to_uppercase());
    } else {
        println!("{greeting}");
    }
}
```

clap is an external crate, so this won't run on the Playground. In a real project, add it and run
it:

```bash
cargo add clap --features derive
cargo run -- Shamirul --loud
```

You get `--help`, `--version`, and friendly "missing argument" errors for free — that's the whole
reason clap exists.

## Common mistakes

- **Indexing `args[1]` directly.** If the user didn't pass that argument, the program panics with
  an ugly backtrace. Use `.get(1)` and handle the `None` case with a usage message.
- **Printing errors to stdout.** They get mixed into piped/redirected output and corrupt the real
  result. Send status and errors to **stderr** with `eprintln!`.
- **Always exiting `0`.** If your program fails but returns `0`, scripts think it succeeded and
  keep going. Exit non-zero on failure (or return `Err` from `main`).
- **Hand-parsing complex flags.** Rolling your own `--option` parser is bug-prone and gives users
  no `--help`. Use clap once you have more than one or two arguments.
- **Forgetting the `--` with `cargo run`.** `cargo run hello` passes `hello` to *cargo*; you need
  `cargo run -- hello` to pass it to your program.

## Your turn

This program should greet the argument the user passed, but it crashes when run with no argument.
Fix it so that with no argument it prints `Usage: greet <name>` instead of panicking.

```rust,editable
fn main() {
    let args: Vec<String> = std::env::args().collect();
    let name = &args[1];               // panics if there is no args[1]
    println!("Hello, {name}!");
}
```

<details><summary>Show solution</summary>

Use `.get(1)` so a missing argument becomes `None` instead of a panic, and print the usage line to
stderr:

```rust,editable
fn main() {
    let args: Vec<String> = std::env::args().collect();

    match args.get(1) {
        Some(name) => println!("Hello, {name}!"),
        None => {
            eprintln!("Usage: greet <name>");
            std::process::exit(1);       // non-zero: we failed to do the job
        }
    }
}
```

`args[1]` panics the instant the index is out of range. `.get(1)` returns an `Option`, so "no
argument" is just `None` — a case you handle calmly. Sending the usage message to stderr and
exiting `1` also tells any calling script that this run didn't succeed.

</details>

## Quick check

<div class="quiz" data-topic="cli-apps"></div>

## Remember this

- `std::env::args()` gives the argument list; `args[0]` is the program name, real arguments start at `args[1]`.
- Use `.get(1)` (not `args[1]`) so a missing argument is `None`, not a panic.
- **stdout** (`println!`) is for real output; **stderr** (`eprintln!`) is for status and errors — keep them separate.
- Exit `0` for success, non-zero for failure; or return `Result` from `main` and let Rust do it.
- For anything beyond a couple of arguments, use **clap** — it generates the parser and `--help` for you.

## Go deeper

- [Rust Book - Command Line Programs](https://doc.rust-lang.org/book/ch12-00-an-io-project.html) — CLI project example.

**Next:**

- [Logging and tracing](../runtime-and-ecosystem/logging-and-tracing.md)
- [Web services](../runtime-and-ecosystem/web-services.md)

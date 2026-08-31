# Args, exit codes, and subprocesses

> **Intermediate** · Runtime & ecosystem

## What & why

A command-line program talks to the outside world in three ways: it reads arguments the user typed, it reports success or failure through its exit code, and sometimes it shells out to another program entirely. `std::env::args()`, `std::process::ExitCode`, and `std::process::Command` are the three tools for each job — and each has a sharp edge that trips people up the first time.

## The idea, slowly

### `std::env::args()` — the first element is the program name

`std::env::args()` returns an iterator of `String`s: your program's raw command-line arguments. The gotcha is that **the very first element is always the path/name of the program itself**, not the first real argument — exactly like `argv[0]` in C. Forget this and your "first argument" is actually your own binary's name.

```rust,editable
fn main() {
    let all_args: Vec<String> = std::env::args().collect();
    println!("raw args (index 0 is the program itself): {all_args:?}");

    // Skip the program name to get the arguments a user actually typed.
    let real_args: Vec<String> = std::env::args().skip(1).collect();
    println!("real args: {real_args:?}");
}
```

On the Playground you'll see `all_args` holds just one element (the program path) since no arguments were passed — which is exactly the point: index `0` is never a "real" argument, it's metadata about the process. Real CLI code almost always starts with `.skip(1)` before parsing.

### `ExitCode` vs. `std::process::exit` — one of them skips cleanup

A process reports success or failure to whatever invoked it (a shell, a CI pipeline, another program) through its **exit code**: `0` conventionally means success, anything else means failure. Rust gives you two ways to set it, and they are *not* interchangeable:

- Return `std::process::ExitCode` from `main`. This is a normal function return — everything on the stack gets cleaned up (`Drop` runs) exactly like returning from any other function.
- Call `std::process::exit(code)`. This terminates the process **immediately**, wherever it's called from. It never returns, and — this is the part that surprises people — it does **not** run `Drop` for anything still on the stack.

```rust,editable
struct Guard;

impl Drop for Guard {
    fn drop(&mut self) {
        println!("cleaning up");
    }
}

fn main() {
    let _guard = Guard;
    println!("about to call process::exit");
    std::process::exit(0); // terminates right here — "cleaning up" never prints
}
```

Now compare it to returning `ExitCode` normally:

```rust,editable
use std::process::ExitCode;

struct Guard;

impl Drop for Guard {
    fn drop(&mut self) {
        println!("cleaning up");
    }
}

fn main() -> ExitCode {
    let _guard = Guard;
    println!("about to return ExitCode");
    ExitCode::SUCCESS // main returns normally — Drop runs on the way out
}
```

Run both. The first never prints "cleaning up" — `process::exit` cut the process off before `_guard`'s destructor got a chance to run. The second does, because returning is a normal function exit. If your program holds anything that needs cleanup on exit — a temp file to delete, a lock to release, a buffered writer to flush — prefer returning `ExitCode` from `main` (or from a helper that `main` calls) over reaching for `process::exit` mid-function.

### `Command` — spawning another program

`std::process::Command` builds and runs a *subprocess*: another program entirely, running as its own OS process. You get two very different ways to run it:

- `.output()` **captures** the subprocess's stdout and stderr into memory and hands them back to you as `Vec<u8>`, along with the exit status. Nothing the subprocess prints appears on your program's own terminal — you get it as data instead.
- `.status()` lets the subprocess **inherit** your program's stdin/stdout/stderr directly — its output goes straight to the real terminal, just like if you'd typed the command yourself — and you only get back the exit status, no captured text.

```rust
// Spawning processes isn't allowed on the Playground — run this in a real project.
use std::process::Command;

fn main() {
    let output = Command::new("echo")
        .arg("captured, not printed directly")
        .output()
        .expect("failed to run echo");

    println!("stdout was: {}", String::from_utf8_lossy(&output.stdout));
    println!("exit status: {}", output.status);
}
```

```rust
// Spawning processes isn't allowed on the Playground — run this in a real project.
use std::process::Command;

fn main() {
    // .status() inherits the terminal directly — this line prints itself,
    // you never see it as a String in your own program.
    let status = Command::new("echo")
        .arg("prints straight to the terminal")
        .status()
        .expect("failed to run echo");

    println!("exited with: {status}");
}
```

Reach for `.output()` when you need to *do something with* what the subprocess printed (parse it, log it, check for a specific error string). Reach for `.status()` when you just want the subprocess to behave like a normal command the user is watching run — a linter, a build tool, anything where its own progress output is useful as-is.

## Common mistakes

- **Forgetting to skip `args()[0]`.** Parsing "the first argument" without `.skip(1)` silently treats your own program's path as the user's first input.
- **Calling `std::process::exit()` when something needs to run `Drop` first.** It skips destructors for everything still on the stack — files may not flush, locks may not release. Prefer returning `ExitCode` from `main` so cleanup runs normally.
- **Assuming `.output()` also prints to the terminal.** It doesn't — the subprocess's output is captured into memory as bytes, not shown to the user. If you want the user to see it, you have to `println!` it yourself (or use `.status()` instead).
- **Ignoring the exit status.** A subprocess can *run successfully* (no error spawning it) but still *fail its own job* (nonzero exit code) — always check `output.status.success()` or `status.success()` rather than assuming "it ran" means "it worked."
- **Buffering huge output with `.output()`.** It holds all of stdout/stderr in memory at once — fine for a linter's summary, risky for a subprocess that streams megabytes of logs.

## More examples

### Counting repeated verbosity flags
A CLI that supports `-v -v -v` for increasing verbosity just counts how many times the flag shows up in the skipped argument list.

```rust,editable
fn main() {
    // Run locally as `myapp -v -v -v input.txt` to see verbosity climb.
    let real_args: Vec<String> = std::env::args().skip(1).collect();
    let verbosity = real_args.iter().filter(|a| a.as_str() == "-v").count();
    println!("verbosity level: {verbosity}");
}
```

### Distinct exit codes for different failures
A conversion tool can signal *why* it failed — no arguments versus a bad file type — with different `ExitCode` values, which lets a calling script react differently to each case.

```rust,editable
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();

    if args.is_empty() {
        eprintln!("usage: convert <file>");
        return ExitCode::from(2); // usage error
    }
    if !args[0].ends_with(".csv") {
        eprintln!("error: expected a .csv file");
        return ExitCode::from(1); // processing error
    }
    println!("converting {}", args[0]);
    ExitCode::SUCCESS
}
```

### Searching a log file and reading grep's exit status
`grep` exits `1` when it simply finds no matches — not a crash — so a tool that shells out to it has to treat a nonzero status as "nothing found," not "something broke."

```rust
// Spawning processes isn't allowed on the Playground — run this in a real project.
use std::process::Command;

fn main() {
    let output = Command::new("grep")
        .args(["ERROR", "app.log"])
        .output()
        .expect("failed to run grep");

    // grep exits 1 when it simply finds nothing — that's not a crash, just "no matches".
    if output.status.success() {
        println!("found errors:\n{}", String::from_utf8_lossy(&output.stdout));
    } else {
        println!("no ERROR lines in app.log");
    }
}
```

### Running cargo fmt as a pre-commit check
`.status()` lets `cargo fmt --check`'s own diff print straight to the terminal, so a pre-commit hook can just check the exit status and let the user see exactly what's unformatted.

```rust
// Spawning processes isn't allowed on the Playground — run this in a real project.
use std::process::Command;

fn main() {
    // .status() inherits the terminal, so cargo fmt's own diff output shows up as-is.
    let status = Command::new("cargo")
        .args(["fmt", "--check"])
        .current_dir("path/to/project")
        .status()
        .expect("failed to run cargo fmt");

    if !status.success() {
        eprintln!("code isn't formatted — run `cargo fmt` before committing");
    }
}
```

## Your turn

This program is supposed to print a usage message and fail with a nonzero exit code when no argument is given — but it doesn't compile.

```rust,editable
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("usage: tool <name>");
        return; // bug!
    }
    println!("hello, {}", args[0]);
    ExitCode::SUCCESS
}
```

<details><summary>Show solution</summary>

`main` is declared to return `ExitCode`, so *every* path out of the function must produce an `ExitCode` — including the early return. A bare `return;` returns `()` (the empty tuple), not an `ExitCode`, so the compiler rejects it with a type mismatch: `expected \`ExitCode\`, found \`()\``.

```rust,editable
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("usage: tool <name>");
        return ExitCode::FAILURE; // now every path returns an ExitCode
    }
    println!("hello, {}", args[0]);
    ExitCode::SUCCESS
}
```

The fix is to return an actual `ExitCode` value on the early-exit path too — `ExitCode::FAILURE` signals "this run didn't succeed" to whatever invoked the program, exactly the way a nonzero exit code should.

</details>

## Quick check

<div class="quiz" data-topic="process-and-command"></div>

## Remember this

- `std::env::args()` always includes the program name as the first element — skip it (`.skip(1)`) before parsing real arguments.
- Return `std::process::ExitCode` from `main` instead of calling `std::process::exit` mid-function — returning still runs `Drop` for everything on the stack; `exit` skips it entirely.
- `Command::new("prog").arg("x").output()` captures stdout/stderr/exit status as data; `.status()` inherits the parent's real streams and only returns the exit status.
- A subprocess can spawn successfully but still fail its job — always check `.status.success()`, don't assume "it ran" means "it worked."
- `.output()` buffers everything in memory — fine for small output, risky for a subprocess producing a lot of it.

## Go deeper

- [std::process docs](https://doc.rust-lang.org/std/process/index.html) — Command, ExitCode, and process control.

**Next:**

- [CLI apps](../runtime-and-ecosystem/cli-apps.md)
- [Threads and spawn](../runtime-and-ecosystem/threads-and-spawn.md)

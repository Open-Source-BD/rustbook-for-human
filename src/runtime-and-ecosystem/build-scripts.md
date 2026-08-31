# Build scripts (build.rs)

> **Advanced** · Runtime & ecosystem

## What & why

Some things need to happen *before* your crate can even be compiled — generating Rust code from a schema, compiling a bundled C library, or stamping in the current git commit hash. `build.rs` is Cargo's answer: a small, separate Rust program that Cargo compiles and runs automatically, ahead of the real build, purely to prepare things the real build needs. Think of it as a pre-flight checklist that runs itself — you don't invoke it, Cargo notices it's there and just does it.

## The idea, slowly

### Cargo runs it for you — no wiring required

Drop a file named `build.rs` next to your crate's `Cargo.toml` (same folder, not inside `src/`), and the next `cargo build` compiles and runs it *before* compiling anything else in the crate. There's no flag to pass and nothing to register — the filename and location are the entire configuration:

```
mytool/
├── Cargo.toml
├── build.rs        <- Cargo finds this automatically
└── src/
    └── main.rs
```

```rust
// build.rs
fn main() {
    println!("cargo::warning=this build script ran!");
}
```

That's a complete, valid build script. It's a normal Rust binary with its own `fn main` — but the *point* of what it prints only means something when Cargo itself runs it and reads its output, which is why you won't see the same effect just pasting this into a generic Rust runner.

### Talking to Cargo: specially-formatted `println!` lines

A build script can't directly poke Cargo's internals — instead it prints lines to stdout in a format Cargo watches for, each one a small instruction. The most important ones:

- `println!("cargo::rerun-if-changed=PATH");` — only re-run this build script if `PATH` changes. Without at least one of these, Cargo re-runs the script on *every* build, which is slow and unnecessary.
- `println!("cargo::rustc-env=KEY=VALUE");` — sets an environment variable that the crate's own code can read at compile time with `env!("KEY")`.
- `println!("cargo::rustc-link-lib=foo");` / `cargo::rustc-link-search=PATH` — tell the linker about a native library to link against and where to find it.
- `println!("cargo::rustc-cfg=my_flag");` — defines a custom `cfg` the main crate can check with `#[cfg(my_flag)]`.
- `println!("cargo::warning=message");` — prints a warning visible during the build, without failing it.

Cargo only parses **stdout** for these — anything printed with `eprintln!` (stderr) is just shown as ordinary diagnostic text, never treated as an instruction.

### Reading the value back: `env!`

`cargo::rustc-env` and reading it with `env!` are a matched pair — the build script sets the variable, and your crate's normal code reads it as if it were baked in at compile time:

```rust
// build.rs
fn main() {
    println!("cargo::rustc-env=BUILD_TIME=2026-08-20");
}
```

```rust
// src/main.rs
fn main() {
    println!("built at {}", env!("BUILD_TIME"));
}
```

`env!` (unlike `std::env::var`) resolves at *compile* time — the value gets baked directly into the binary, and if the variable was never set, the crate fails to compile with a clear error rather than panicking later at runtime.

### Common real uses

**Code generation from a schema.** A build script can read a `.proto` or GraphQL schema file, generate matching Rust structs into `OUT_DIR` (a directory Cargo gives every build script to write into), and the main crate pulls the generated file in with `include!`:

```rust
// build.rs
fn main() {
    println!("cargo::rerun-if-changed=schema.proto");
    // ... run a codegen library, writing output into OUT_DIR ...
}
```

**Compiling and linking a bundled C library**, typically with the `cc` crate:

```rust
// build.rs
fn main() {
    cc::Build::new()
        .file("src/vendor/foo.c")
        .compile("foo");
}
```

**Embedding build metadata**, like the current git commit hash, so the compiled binary can report exactly what it was built from:

```rust
// build.rs
use std::process::Command;

fn main() {
    let output = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .expect("failed to run git");
    let git_hash = String::from_utf8(output.stdout).unwrap();

    println!("cargo::rustc-env=GIT_HASH={}", git_hash.trim());
    println!("cargo::rerun-if-changed=.git/HEAD");
}
```

```rust
// src/main.rs
fn main() {
    println!("version {}", env!("GIT_HASH"));
}
```

## Common mistakes

- **Forgetting `cargo::rerun-if-changed`.** Without it, Cargo's default re-run heuristics may not notice that a file your build script depends on changed, and it keeps using stale generated output.
- **Slow or network-dependent build scripts.** Every `cargo build` pays this cost — a build script that hits the network makes builds slower, flakier, and non-reproducible offline. Keep them fast and self-contained.
- **Printing to `eprintln!` and expecting Cargo to notice.** Only stdout lines are parsed as instructions; stderr output is just shown as text (visible with `-vv` or on failure), never acted on.
- **Assuming the build script runs on the *target* platform.** It always runs on the *host* machine building the crate, even when cross-compiling for something else entirely — reading `cfg!(target_os = ...)` inside `build.rs` reports the host, not the target. Use the `CARGO_CFG_TARGET_OS` environment variable instead if the target matters.
- **Panicking with no message when required input is missing.** A build script failure aborts the entire build, so a bare `.unwrap()` on a missing file leaves whoever hits it with a cryptic backtrace instead of a clear reason.

## More examples

### Generating a lookup table into `OUT_DIR`
A game precomputes a table of sine values at build time instead of shipping a hand-typed array, writing the generated Rust source into `OUT_DIR` for the crate to pull in.

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest = Path::new(&out_dir).join("sine_table.rs");

    let mut code = String::from("pub const SINE_TABLE: [f64; 4] = [");
    for i in 0..4 {
        let angle = i as f64 * std::f64::consts::PI / 2.0;
        code.push_str(&format!("{:?}, ", angle.sin()));
    }
    code.push_str("];\n");

    fs::write(&dest, code).unwrap();
    println!("cargo::rerun-if-changed=build.rs");
}
```

```rust
// src/main.rs
include!(concat!(env!("OUT_DIR"), "/sine_table.rs"));

fn main() {
    println!("{:?}", SINE_TABLE);
}
```

### Failing fast when a required config file is missing
A server crate would rather refuse to compile than start up later with a confusing runtime error, so its build script checks for `config.toml` up front and panics with a message that says exactly what to do.

```rust
// build.rs
use std::path::Path;

fn main() {
    if !Path::new("config.toml").exists() {
        panic!("config.toml is missing — copy config.toml.example and fill it in first");
    }
    println!("cargo::rerun-if-changed=config.toml");
}
```

### Linking a bundled SQLite library
When the native library is already compiled and just needs linking, `cargo::rustc-link-search` and `cargo::rustc-link-lib` tell the linker where to look and what to link against, no `cc` crate required.

```rust
// build.rs
fn main() {
    println!("cargo::rustc-link-search=native=vendor/sqlite");
    println!("cargo::rustc-link-lib=static=sqlite3");
    println!("cargo::rerun-if-changed=vendor/sqlite");
}
```

### Gating platform-specific code behind a build-time check
A build script can inspect the compilation target and emit a custom `cfg` flag, letting the main crate pick an OS-specific code path with an ordinary `#[cfg(...)]`.

```rust
// build.rs
fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("linux") {
        println!("cargo::rustc-cfg=has_epoll");
    }
}
```

```rust
// src/main.rs
fn main() {
    #[cfg(has_epoll)]
    println!("using epoll for event polling");

    #[cfg(not(has_epoll))]
    println!("falling back to a portable poller");
}
```

## Your turn

This crate's `build.rs` sets a version string, and `main.rs` tries to read it back with `env!` — but the crate fails to compile with `error: environment variable APP_VERSION not defined at compile time`:

```rust
// build.rs
fn main() {
    println!("cargo::rustc-env=BUILD_VERSION=1.2.3");
}
```

```rust
// src/main.rs
fn main() {
    println!("running version {}", env!("APP_VERSION"));
}
```

<details><summary>Show solution</summary>

The build script sets `BUILD_VERSION`, but `main.rs` reads `APP_VERSION` — a plain name mismatch. `env!` looks up the exact key given to it at compile time; it has no idea `BUILD_VERSION` was "meant" to be the version.

```rust
// build.rs
fn main() {
    println!("cargo::rustc-env=APP_VERSION=1.2.3");
}
```

```rust
// src/main.rs
fn main() {
    println!("running version {}", env!("APP_VERSION"));
}
```

Either rename the key in `build.rs` to match what `main.rs` reads, or vice versa — the two sides just have to agree on the exact name. This kind of drift is easy to introduce during a rename, since nothing connects the two `KEY` strings except you keeping them in sync by hand.

</details>

## Quick check

<div class="quiz" data-topic="build-scripts"></div>

## Remember this

- A `build.rs` at the crate root is compiled and run by Cargo automatically, before the rest of the crate builds — no extra configuration needed.
- Communicate with Cargo via specially-formatted `println!` lines on **stdout**: `cargo::rerun-if-changed=...`, `cargo::rustc-env=...`, `cargo::rustc-link-lib=...`, and more.
- `cargo::rustc-env=KEY=VALUE` pairs with `env!("KEY")` in your normal code to bake a compile-time value into the binary.
- Common real uses: generating Rust code from a schema, compiling/linking a bundled C library, and embedding build metadata like a git commit hash.
- The build script always runs on the **host** machine, not the target — don't assume `cfg!` inside it reflects a cross-compilation target.

## Go deeper

- [Cargo Book - Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html) — What build.rs can do and how Cargo talks to it.

**Next:**

- [Docs and rustfmt](../runtime-and-ecosystem/docs-and-rustfmt.md)

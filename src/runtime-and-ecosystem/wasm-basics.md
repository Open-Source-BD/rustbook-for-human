# Rust and WebAssembly

> **Advanced** · Runtime & ecosystem

## What & why

WebAssembly (WASM) is a compact, sandboxed instruction format that browsers (and other hosts) can run at near-native speed. Rust has no garbage collector and a tiny runtime, which makes it an unusually good fit for compiling into that sandbox — you get real performance in the browser without shipping a language runtime alongside it. `wasm-bindgen` is the piece that makes this actually usable: it generates the glue code so Rust functions can be called from JavaScript, and JavaScript values can flow into Rust, without you hand-writing any of the marshalling.

## The idea, slowly

### A sealed appliance, not a normal program

A `.wasm` module is more like a sealed appliance than a regular executable — it runs inside a sandbox with no access to the outside world except what its host (the browser) explicitly hands it. It can't open a file, spawn a thread the way `std::thread` expects to, or open a raw socket, because the browser simply doesn't expose those capabilities to WASM code. Everything Rust code compiled to WASM does, it does by calling into JavaScript functions the host provides — which is exactly what `wasm-bindgen` sets up.

### The `wasm32-unknown-unknown` target

Rust can compile to many targets beyond your own machine. The one for the browser (and generic WASM hosts) is `wasm32-unknown-unknown` — 32-bit WASM, no particular vendor, no particular OS (hence "unknown-unknown", since there's no operating system underneath it). You add it once per machine:

```bash
rustup target add wasm32-unknown-unknown
```

and then build for it explicitly:

```bash
cargo build --target wasm32-unknown-unknown --release
```

That alone produces a raw `.wasm` binary — a real artifact, but not yet something convenient to call from JavaScript. For that, you need `wasm-bindgen`.

### `#[wasm_bindgen]`: the interop glue, generated for you

Mark a function `pub` and attach `#[wasm_bindgen]`, and the macro generates everything needed to call it from JavaScript — converting a Rust `String` to and from a JS string, matching up numeric types, and emitting a small `.d.ts`/JS wrapper so the function looks like a normal JS function on the other side:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
```

After building, this becomes callable from JavaScript as plainly as:

```js
import { greet } from "./pkg/mytool.js";
console.log(greet("Ferris")); // "Hello, Ferris!"
```

You never write the conversion code between `&str` and a JS string yourself — `#[wasm_bindgen]` generated it at compile time.

### `wasm-pack build`: packaging the result

Compiling to `wasm32-unknown-unknown` gives you a `.wasm` file; `wasm-bindgen`'s macro prepares your code to be called correctly — but something still has to run the `wasm-bindgen` post-processing step and assemble a package JavaScript can actually `import`. That's `wasm-pack`:

```bash
cargo install wasm-pack
wasm-pack build --target web
```

This compiles your crate to WASM, runs the `wasm-bindgen` CLI over the result, and writes a `pkg/` folder containing the `.wasm` binary, a generated JS module, type definitions, and a `package.json` — ready to import directly in a web page (`--target web`) or publish to npm.

### Not every crate compiles to WASM

Because the browser sandbox has no filesystem, no OS threads, and no raw sockets, any crate that assumes those exist can fail to compile for `wasm32-unknown-unknown`, or compile but panic the moment it's actually called. Concretely:

- `std::fs` calls have nothing to read or write — there's no filesystem underneath.
- `std::thread::spawn` doesn't work the normal way — the browser's main thread model doesn't match native OS threads (real WASM threading exists, but needs special support, not plain `std::thread`).
- TCP/UDP sockets aren't available at all — browsers only expose networking through `fetch` and `WebSocket`, which JavaScript has to bridge in for you.

When a dependency needs one of these, look for a WASM-specific alternative, or feature-gate the native-only code path out with `#[cfg(not(target_arch = "wasm32"))]`.

### Panics: from an opaque crash to a real message

By default, a panic in Rust compiled to WASM surfaces in the browser console as something like `RuntimeError: unreachable executed` — no message, no file, no line number, because the panic message never makes it across to JavaScript on its own. During development, install a panic hook so panics get forwarded to `console.error` with the real message:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
```

`#[wasm_bindgen(start)]` marks this function to run automatically the moment the module is loaded, so the hook is installed before anything else has a chance to panic. From then on, a panic prints its actual message and location to the browser console instead of a bare, unhelpful runtime error.

## Common mistakes

- **Forgetting to add the target before building.** `cargo build --target wasm32-unknown-unknown` fails immediately if the target was never installed — run `rustup target add wasm32-unknown-unknown` once per machine first.
- **Using `std::fs`, real OS threads, or sockets in code that needs to run in the browser.** It may compile, but fails or panics the moment it actually runs in the sandbox, since none of those capabilities exist there.
- **Skipping the panic hook.** Without `console_error_panic_hook::set_once()`, every panic during development shows up as an unreadable, message-free JS exception — costing real debugging time for something a one-line hook fixes.
- **Passing large or complex data across the JS/Rust boundary casually.** Each call across the boundary has real conversion cost; for big payloads, prefer typed arrays or a crate like `serde-wasm-bindgen` over many small calls.
- **Using the wrong `--target` with `wasm-pack build`.** `--target web` produces an ES module you initialize yourself; the default `--target bundler` assumes a bundler like webpack is doing that step. Mixing them up breaks the import style you expected in your JS code.

## More examples

None of these compile on the Playground — they need `wasm-bindgen` (and sometimes `web-sys`) and a
real `wasm32-unknown-unknown` build. Read them as patterns to try in a `wasm-pack` project.

### Transforming a string for a browser UI

A common reason to reach for WASM at all: doing text processing fast, in a function shared between
a Rust backend and a Rust-compiled-to-WASM frontend, instead of writing the logic twice.

```rust
use wasm_bindgen::prelude::*;

/// Turns "Hello World" into a URL-friendly "hello-world".
#[wasm_bindgen]
pub fn slugify(input: &str) -> String {
    input
        .to_lowercase()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-")
}
```

Called from JavaScript as `slugify("Hello World")`, returning `"hello-world"` — the same slug logic
your server already trusts, now running client-side with no round trip to the API.

### Exposing a struct with methods, not just a function

`#[wasm_bindgen]` isn't limited to free functions — put it on an `impl` block too, and JavaScript
gets something that behaves like a real class:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Counter {
    value: i32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter {
        Counter { value: 0 }
    }

    pub fn increment(&mut self) {
        self.value += 1;
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}
```

From JavaScript: `const c = new Counter(); c.increment(); c.value(); // 1` — `new`, method calls,
and reading fields all just work, generated from ordinary Rust methods.

### Calling `console.log` from Rust

Before pulling in the whole `web-sys` crate, the smallest way to reach the browser console is to
bind directly to it — this is the same pattern the `wasm-bindgen` guide's own console-log example
uses:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn process_order(order_id: u32) {
    log(&format!("processing order #{order_id}"));
}
```

The `extern "C"` block declares a function that already exists on the JS side (`console.log`);
calling `log(...)` from Rust is really calling straight into the browser's console.

### Loading a `--target web` package in an actual page

`wasm-pack build --target web` produces an ES module you load directly with a `<script
type="module">` tag — no bundler required for a quick demo:

```bash
wasm-pack build --target web
```

```html
<script type="module">
  import init, { greet } from "./pkg/mytool.js";

  async function run() {
    await init(); // fetches and instantiates the .wasm file
    console.log(greet("Ferris"));
  }

  run();
</script>
```

The `init()` call matters: with `--target web`, the module doesn't load the `.wasm` binary until you
await `init()` yourself, so nothing bound with `#[wasm_bindgen]` is callable before that line runs.

### Sharing one crate between native and WASM builds

A crate that's meant to run both as a native CLI *and* compiled to WASM needs two implementations of
anything that touches the filesystem — `#[cfg]` picks the right one per target, at compile time:

```rust
#[cfg(not(target_arch = "wasm32"))]
fn log_to_file(message: &str) {
    // native builds can write straight to disk
    std::fs::write("app.log", message).ok();
}

#[cfg(target_arch = "wasm32")]
fn log_to_file(message: &str) {
    // the browser has no filesystem -- forward to the console instead
    web_sys::console::log_1(&message.into());
}
```

Every other caller in the crate just calls `log_to_file(...)` normally — the `#[cfg]` attributes
make sure only one of the two versions is even compiled, depending on the target.

## Your turn

This crate is meant to expose a `greet` function to JavaScript via `wasm-bindgen`, but `wasm-pack build --target web` fails with `Error: crate-type must be cdylib to compile to wasm32-unknown-unknown`:

```toml
[package]
name = "greeter"
version = "0.1.0"
edition = "2021"

[dependencies]
wasm-bindgen = "0.2"
```

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
```

<details><summary>Show solution</summary>

By default a Rust library compiles to an `rlib` — a format meant for other Rust crates to link against, not something `wasm-bindgen`'s tooling can turn into a `.wasm` module plus JS glue. It needs a `cdylib` (a C-compatible dynamic library) artifact to post-process instead. Add a `[lib]` section declaring it:

```toml
[package]
name = "greeter"
version = "0.1.0"
edition = "2021"

[dependencies]
wasm-bindgen = "0.2"

[lib]
crate-type = ["cdylib", "rlib"]
```

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
```

Keeping `"rlib"` alongside `"cdylib"` means the crate can still be used as a normal Rust dependency (in tests, or from another native crate) as well as compiled to WASM — `wasm-pack build --target web` now finds the `cdylib` artifact it needs and produces a working `pkg/` directory.

</details>

## Quick check

<div class="quiz" data-topic="wasm-basics"></div>

## Remember this

- `#[wasm_bindgen]` on a function or struct exposes it to JavaScript, generating the marshalling code automatically.
- Build with the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`), then `wasm-pack build` runs the compile *and* the bindgen step, producing a ready-to-import `pkg/` directory.
- Not every crate compiles to WASM — anything depending on threads, the filesystem, or raw sockets has nothing to run on in the browser sandbox.
- `Cargo.toml` needs `crate-type = ["cdylib", "rlib"]` in `[lib]` — `wasm-bindgen`'s tooling needs the `cdylib` artifact to post-process.
- Set a panic hook (`console_error_panic_hook::set_once()`) during development so panics show a real message instead of an opaque JS exception.

## Go deeper

- [wasm-bindgen guide](https://rustwasm.github.io/wasm-bindgen/) — Rust/JS interop reference.
- [Rust and WebAssembly book](https://rustwasm.github.io/docs/book/) — End-to-end WASM workflow.

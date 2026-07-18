# Web services

> **Intermediate** · Runtime & ecosystem

## What & why

A web service is a program that sits and waits for HTTP requests — a browser or an app asks for
`/products`, and your program sends back an answer (usually JSON). Rust is excellent for this:
services are fast, use little memory, and rarely crash. This lesson explains the shared shape of
*every* Rust web server before you pick a framework like Axum.

## The idea, slowly

### A web server is a waiter

Picture a restaurant. A **request** is a customer's order; a **response** is the plate you bring
back. The server (your program) runs forever, taking orders and returning plates. Each kind of
order maps to a **route** — a URL path plus a method (GET, POST, ...) — and each route has a
**handler**, the function that prepares that particular dish.

- `GET /health` → handler returns "ok"
- `GET /products` → handler returns a JSON list of products
- `POST /products` → handler reads JSON from the request and creates a product

That request-in, response-out shape is identical across Axum, Actix, and Warp. Learn it once.

### Handlers are just functions that return data

The core idea that makes Rust web servers click: **a handler is an ordinary async function, and its
return value becomes the response.** You don't manually write bytes to a socket; you return a
value, and the framework turns it into HTTP.

```rust
// The simplest possible handler: takes nothing, returns some text.
async fn health() -> &'static str {
    "ok"
}
```

That `async` keyword matters. A web server juggles thousands of connections at once, and it can't
afford to freeze while one slow database call finishes. `async` lets a handler *pause* (while
waiting for the database) so the server can serve other requests in the meantime, then resume. You
don't manage that yourself — an async runtime called **Tokio** does.

### Wiring routes with Axum

Axum (the framework in a real backend like yours) lets you build a **router**: a table mapping
paths to handlers. Then you hand it to a server that listens on a port:

```rust
use axum::{routing::get, Router};

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() {
    // Build the routing table: GET /health -> health handler.
    let app = Router::new().route("/health", get(health));

    // Listen for connections on port 4000.
    let listener = tokio::net::TcpListener::bind("0.0.0.0:4000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

This needs Tokio and Axum, so it will **not** run on the Playground. In a real project:

```bash
cargo add axum
cargo add tokio --features full
cargo run
```

Then visit `http://localhost:4000/health` and you'll see `ok`. Read the flow: `Router::new()`
starts an empty routing table, `.route("/health", get(health))` adds one entry, and `axum::serve`
runs the loop forever. `#[tokio::main]` is what turns your `async fn main` into a real program by
starting the Tokio runtime.

### Returning JSON (where serde comes in)

Text is the "hello world" of web servers; real APIs return **JSON**. This is where the serde lesson
pays off: you return a struct wrapped in `Json`, and Axum + serde serialize it for you.

```rust
use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
struct Product {
    id: u64,
    name: String,
}

// Returning Json<T> makes the response JSON automatically.
async fn get_product() -> Json<Product> {
    Json(Product { id: 1, name: String::from("Keyboard") })
}
```

The handler just returns data; the framework handles serialization and sets the right headers. This
is why "async and serialization usually show up together" — almost every real handler returns a
serde-serializable type.

### Shared state: the database connection

Handlers usually need something shared, like a database connection pool. You don't make a new
connection per request; you create it once at startup and share it. Axum passes it in through
`State`:

```rust
use axum::extract::State;

#[derive(Clone)]
struct AppState {
    // e.g. a database connection pool
    db: String,
}

async fn list_products(State(state): State<AppState>) -> String {
    format!("querying with {}", state.db)
}
```

At startup you build the state once and attach it with `.with_state(state)`. Every handler that
asks for `State<AppState>` gets a cheap clone of the shared handle — exactly how a real Axum +
SeaORM backend shares its database connection across all routes.

### The one rule about blocking

Because async lets handlers pause and share threads, there's a trap: if a handler does a **slow
blocking** operation (a heavy computation, or `std::thread::sleep`, or blocking file I/O), it
freezes the thread and *other requests can't run*. The rule: inside async handlers, use async
versions of things (async database calls, `tokio::time::sleep`), or move heavy blocking work off to
a dedicated thread. Don't quietly drop blocking code into an async handler.

## Common mistakes

- **Forgetting `#[tokio::main]` (or a runtime).** `async fn main` alone doesn't run — async code
  needs a runtime to drive it. Without Tokio started, nothing happens.
- **Blocking inside an async handler.** A slow synchronous call (big computation, `thread::sleep`,
  blocking I/O) freezes the thread and stalls other requests. Use async equivalents or offload the
  work.
- **Making a new database connection per request.** That's slow and exhausts the database. Build a
  connection pool once at startup and share it via `State`.
- **Returning a type that isn't a valid response.** A handler must return something Axum can turn
  into a response (`&str`, `String`, `Json<T>`, a status code, ...). Returning a bare struct that
  doesn't implement the response trait won't compile.
- **Forgetting `#[derive(Serialize)]` on JSON responses.** `Json(value)` needs `value` to be
  serializable; without the derive you get a trait-bound error.

## Your turn

This is a **spot-the-bug**, since a web server can't run on the Playground. This handler is supposed
to return a product as JSON, but it won't compile. There are **two** problems. What are they?

```rust
use axum::Json;

struct Product {
    id: u64,
    name: String,
}

fn get_product() -> Json<Product> {
    Json(Product { id: 1, name: String::from("Keyboard") })
}
```

<details><summary>Show solution</summary>

```rust
use axum::Json;
use serde::Serialize;

#[derive(Serialize)]                 // 1. Json<T> requires T: Serialize
struct Product {
    id: u64,
    name: String,
}

async fn get_product() -> Json<Product> {   // 2. handlers must be async
    Json(Product { id: 1, name: String::from("Keyboard") })
}
```

The two fixes:

1. **`#[derive(Serialize)]`** — wrapping a value in `Json<T>` only works if `T` can be serialized.
   Without the derive, serde has no idea how to turn `Product` into JSON, and the trait bound fails.
2. **`async fn`** — Axum handlers must be async so they can pause on slow work without blocking the
   server. A plain `fn` won't satisfy Axum's handler requirement.

</details>

## Quick check

<div class="quiz" data-topic="web-services"></div>

## Remember this

- Every web server is a loop: **request in, response out**; a *route* (path + method) maps to a *handler*.
- A handler is an `async fn` whose **return value becomes the response** — you return data, the framework builds the HTTP.
- `async` + the **Tokio** runtime let one server juggle thousands of requests; start it with `#[tokio::main]`.
- Return `Json<T>` (with `T: Serialize`) to send JSON — this is why serde and web services go together.
- Build shared resources (like a DB pool) **once** and pass them to handlers via `State`.
- Never do slow **blocking** work inside an async handler — it stalls other requests.

## Go deeper

- [Axum docs](https://docs.rs/axum/) — Popular Rust web framework docs.

**Next:**

- [FFI](../runtime-and-ecosystem/ffi.md)
- [Logging and tracing](../runtime-and-ecosystem/logging-and-tracing.md)

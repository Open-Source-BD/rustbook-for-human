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

## More examples

These snippets need Axum, serde, and Tokio, so none of them run on the Playground — read them the
way you'd read a recipe, then try the shapes in a real `cargo new` project.

### Returning a list, not just one item

A dashboard rarely wants a single record — it wants the whole list. The pattern is identical to a
single `Json<T>` response, just with `Vec<T>` as the type:

```rust
use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct Task {
    id: u64,
    title: String,
    done: bool,
}

async fn list_tasks() -> Json<Vec<Task>> {
    Json(vec![
        Task { id: 1, title: "Write lesson".into(), done: true },
        Task { id: 2, title: "Review PR".into(), done: false },
    ])
}

fn router() -> Router {
    Router::new().route("/tasks", get(list_tasks))
}
```

### Reading a piece of the URL with `Path`

A profile page needs to know *which* user was requested. Axum captures a segment of the URL and
hands it to your handler as a typed value — no manual string splitting:

```rust
use axum::{extract::Path, routing::get, Router};

async fn get_user(Path(id): Path<u64>) -> String {
    format!("looking up user #{id}")
}

fn router() -> Router {
    // matches GET /users/42, /users/7, ...
    Router::new().route("/users/{id}", get(get_user))
}
```

Axum parses `id` straight into a `u64` for you; if someone requests `/users/not-a-number`, the
request is rejected before your handler even runs.

### Reading `?q=...&limit=...` with `Query`

Search boxes and filters live in the query string, not the path. `Query<T>` deserializes it into a
struct the same way `Json<T>` deserializes a request body:

```rust
use axum::{extract::Query, routing::get, Router};
use serde::Deserialize;

#[derive(Deserialize)]
struct SearchParams {
    q: String,
    limit: Option<u32>,
}

async fn search(Query(params): Query<SearchParams>) -> String {
    let limit = params.limit.unwrap_or(10);
    format!("searching for '{}' (limit {})", params.q, limit)
}

fn router() -> Router {
    // GET /search?q=rust&limit=5
    Router::new().route("/search", get(search))
}
```

`limit` is `Option<u32>` because it's fine for a caller to omit it — `unwrap_or(10)` supplies a
sensible default when they do.

### One shared pool, many handlers

The earlier `AppState` example showed one handler reading shared state. The real payoff shows up
once *several* handlers share the exact same pool — nobody opens a fresh database connection per
route:

```rust
use axum::{extract::State, routing::get, Router};
use std::sync::Arc;

// In a real app this would be a sqlx::PgPool or similar connection pool.
struct Db;

#[derive(Clone)]
struct AppState {
    db: Arc<Db>,
}

async fn list_products(State(state): State<AppState>) -> String {
    let _pool = &state.db; // the same pool every handler shares
    "querying products".to_string()
}

async fn list_orders(State(state): State<AppState>) -> String {
    let _pool = &state.db; // no new connection created here either
    "querying orders".to_string()
}

fn router(state: AppState) -> Router {
    Router::new()
        .route("/products", get(list_products))
        .route("/orders", get(list_orders))
        .with_state(state)
}
```

Cloning `AppState` is cheap — it's just cloning the `Arc`, a reference count bump, not the database
connection itself.

### Combining `Path` and `State` in one handler

Real handlers usually need more than one extractor at once — here, the URL supplies *which* user,
and shared state supplies *how* to look them up:

```rust
use axum::{extract::{Path, State}, routing::get, Json, Router};
use serde::Serialize;

#[derive(Clone)]
struct AppState {
    db: std::sync::Arc<String>, // pretend connection pool
}

#[derive(Serialize)]
struct User {
    id: u64,
    name: String,
}

async fn get_user(State(_state): State<AppState>, Path(id): Path<u64>) -> Json<User> {
    Json(User { id, name: format!("user-{id}") })
}

fn router(state: AppState) -> Router {
    Router::new().route("/users/{id}", get(get_user)).with_state(state)
}
```

Axum extractors compose freely like this — list as many as the handler needs, in any order, and
each one pulls out exactly the piece of the request it's responsible for.

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

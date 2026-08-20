# HTTP clients with reqwest

> **Intermediate** · Runtime & ecosystem

## What & why

Your program needs data from somewhere else on the internet — a weather API, a GitHub repo's stats, a payment gateway. That's an HTTP request: send a URL, get bytes back. `reqwest` is the crate almost every async Rust project uses to make those requests, and it plugs directly into `serde` so the response body turns into a real Rust struct in one step. Get it wrong and your program either wastes network connections or silently treats an API's error message as if it were the data you asked for.

## The idea, slowly

### One client, reused everywhere

Think of `reqwest::Client` like a phone line, not a single phone call. Setting one up costs a bit of work — DNS resolution, TLS handshakes, keep-alive connections. `Client` remembers those connections internally (**connection pooling**), so the *next* request to the same host is fast. Build a brand-new `Client` for every request and you throw that pool away each time, paying the setup cost again and again.

```rust
use reqwest::Client;

async fn run() {
    let client = Client::new(); // build ONCE
    let _ = fetch_repo(&client, "https://api.github.com/repos/rust-lang/rust").await;
    let _ = fetch_repo(&client, "https://api.github.com/repos/tokio-rs/tokio").await;
    // both calls reuse client's connection pool
}
```

In a real app, you build the `Client` at startup and pass a reference to it — or clone it, since `Client` is cheap to clone (it's an `Arc` under the hood) — into whatever code needs to make requests.

### Making a request and deserializing the body

`reqwest` is async, so every call needs `.await`. The typical shape is: `.get(url)` builds the request, `.send().await?` actually performs it and hands back a `Response`, and `.json::<T>().await?` reads the body and deserializes it into your own serde type — no manual string parsing.

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct Repo {
    name: String,
    stargazers_count: u32,
}

async fn fetch_repo(client: &reqwest::Client, url: &str) -> reqwest::Result<Repo> {
    let response = client.get(url).send().await?;
    let repo = response.json::<Repo>().await?;
    Ok(repo)
}
```

Read that slowly: `send()` returns a `Result<Response, Error>`, so `?` unwraps it or bubbles the error up. `json::<Repo>()` is where serde does its work — it reads the body text as JSON and builds a `Repo` from it, also returning a `Result` because the body might not match the shape you expect.

This needs two external crates plus an async runtime, so the Playground can't run it. In a real project:

```bash
cargo add reqwest --features json
cargo add serde --features derive
cargo add tokio --features full
```

### A non-2xx status is NOT automatically an error

This is the trap that catches almost everyone the first time. `.send().await` only returns `Err` for things like "couldn't reach the server" or "connection reset" — genuine network failures. A server that responds with `404 Not Found` or `500 Internal Server Error` still counts as a *successful* HTTP exchange as far as `reqwest` is concerned: you got a response, it just carries a status code you might not like.

```rust
async fn fetch_status(client: &reqwest::Client, url: &str) -> reqwest::Result<()> {
    let response = client.get(url).send().await?; // Ok even for a 404!

    if response.status().is_success() {
        println!("got it: {}", response.text().await?);
    } else {
        println!("server said no: {}", response.status());
    }
    Ok(())
}
```

You have two options: check `.status()` yourself (as above), or call `.error_for_status()` on the response, which turns a non-2xx status into an `Err` for you so `?` can propagate it like any other failure:

```rust
async fn fetch_ok(client: &reqwest::Client, url: &str) -> reqwest::Result<String> {
    let response = client.get(url).send().await?.error_for_status()?; // 4xx/5xx -> Err here
    response.text().await
}
```

### Setting a timeout

An HTTP call with no timeout can, worst case, hang forever if the server never responds. Always set one, either per-client (applies to every request made through it) or per-request:

```rust
use std::time::Duration;

fn build_client() -> reqwest::Result<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
}
```

Now any request through that client that takes longer than 10 seconds fails with a timeout `Error` instead of hanging your program.

## Common mistakes

- **Building a new `Client` per request.** You lose connection pooling and pay setup costs repeatedly. Build one `Client` at startup and reuse it — it's cheap to `.clone()`.
- **Assuming a 404/500 is automatically an `Err`.** It isn't — `.send().await?` only errors on network-level failures. Check `.status()` or call `.error_for_status()` to treat bad status codes as errors.
- **Calling `.json::<T>()` on an error response.** If the server's error body doesn't match your success struct's shape, deserializing fails with a confusing "missing field" error instead of the real problem (a 404). Check the status *before* parsing the body as your success type.
- **No timeout set.** A slow or dead server can hang your request indefinitely. Set `.timeout(...)` on the client or the request.
- **Forgetting `.await`.** Every `reqwest` call here is async; a missing `.await` gives you a `Future` that never runs, not the value you wanted — the compiler flags the type mismatch.

## Your turn

This function fetches a user profile by id. When the user doesn't exist, the API responds `404 Not Found` with a body like `{"error": "not found"}` — but the code below never checks the status before trying to parse a `User` out of it.

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
}

async fn get_user(client: &reqwest::Client, id: u64) -> Result<User, reqwest::Error> {
    let url = format!("https://api.example.com/users/{id}");
    let response = client.get(&url).send().await?;
    let user = response.json::<User>().await?; // uh oh
    Ok(user)
}
```

What happens when `id` doesn't exist? `send().await?` succeeds (a 404 is still a valid HTTP response), so execution reaches `.json::<User>()`. That tries to deserialize `{"error": "not found"}` into a `User`, which has no `id` or `name` fields in that body — you get a baffling `missing field 'id'` deserialize error instead of a clear "user not found."

<details><summary>Show solution</summary>

Check the status before parsing the body as a `User` — `.error_for_status()` is the one-line fix:

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
}

async fn get_user(client: &reqwest::Client, id: u64) -> Result<User, reqwest::Error> {
    let url = format!("https://api.example.com/users/{id}");
    let response = client
        .get(&url)
        .send()
        .await?
        .error_for_status()?; // 404/500/etc become a real Err here
    let user = response.json::<User>().await?;
    Ok(user)
}
```

Now a 404 returns a `reqwest::Error` describing the bad status, right where it happened — instead of a confusing deserialize failure two steps later. The caller sees "request failed with status 404," not "missing field."

</details>

## Quick check

<div class="quiz" data-topic="http-clients-reqwest"></div>

## Remember this

- Build one `reqwest::Client` and reuse it across requests — it internally pools connections; a new client per request throws that pooling away.
- `.get(url).send().await?` performs the request; `.json::<MyType>().await?` deserializes the body via serde in the same chain.
- A non-2xx response is **not** automatically an `Err` — check `.status()` or call `.error_for_status()` before trusting the body matches your success type.
- Always set a timeout (`.timeout(Duration::from_secs(10))` on the client or request) — an unbounded HTTP call can hang forever.
- `reqwest::Client` is cheap to `.clone()` (it's an `Arc` internally), so sharing it across tasks/handlers is normal.

## Go deeper

- [reqwest docs](https://docs.rs/reqwest/) — Async HTTP client API.

**Next:**

- [Databases with sqlx](../runtime-and-ecosystem/databases-and-sqlx.md)
- [Web services](../runtime-and-ecosystem/web-services.md)

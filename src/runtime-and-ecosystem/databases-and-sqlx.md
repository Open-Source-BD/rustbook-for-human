# Databases with sqlx

> **Intermediate** · Runtime & ecosystem

## What & why

Almost every real backend needs to talk to a database. `sqlx` is Rust's async SQL toolkit for Postgres, MySQL, and SQLite — but unlike a traditional ORM, it doesn't hide SQL behind a chain of `.where().order_by()` method calls. You write real SQL strings, and `sqlx` compiles them against your actual database schema so a typo in a column name is a **compile error**, not a bug that only shows up in production.

## The idea, slowly

### Not an ORM — SQL you write yourself, checked for you

An ORM (object-relational mapper) tries to make the database disappear behind Rust method calls. `sqlx` takes the opposite approach: you write the SQL, and it earns your trust by checking that SQL against the *real* database — the columns exist, the types line up, the query is syntactically valid Postgres/MySQL/SQLite.

```rust
use sqlx::PgPool;

#[derive(sqlx::FromRow)]
struct User {
    id: i64,
    name: String,
}

async fn get_user(pool: &PgPool, id: i64) -> sqlx::Result<User> {
    sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
}
```

`query_as::<_, User>(...)` says "run this SQL and map each row into a `User`." `.bind(id)` fills in the `$1` placeholder safely. `.fetch_one` runs it and expects exactly one row back.

### `query!` and `query_as!`: checked against a LIVE database at compile time

The macro versions — `sqlx::query!` and `sqlx::query_as!` — go one step further than the function calls above. While you run `cargo build`, sqlx actually connects to a real database (via a `DATABASE_URL` environment variable, or a saved offline cache) and asks it: "is this SQL valid? What columns and types does this query return?" It then generates code that matches — so a typo like `SELCT` or a renamed column fails your *build*, not a customer's request.

```rust
async fn get_user_checked(pool: &sqlx::PgPool, id: i64) -> sqlx::Result<(i64, String)> {
    let row = sqlx::query!("SELECT id, name FROM users WHERE id = $1", id)
        .fetch_one(pool)
        .await?;
    Ok((row.id, row.name))
}
```

This is the headline feature: your database schema effectively becomes part of the type system while you're building.

### One pool, created once, shared everywhere

Opening a database connection is expensive — a TCP handshake, authentication, session setup. You don't want to pay that cost on every query. `sqlx::PgPool` is a pool of already-open connections that your whole app shares: create it once at startup, then hand a reference (or `Arc<PgPool>`) to every part of your code that needs the database.

```rust
async fn start_app() -> sqlx::Result<()> {
    let pool = sqlx::PgPool::connect("postgres://user:pass@localhost/mydb").await?;

    // pass &pool (or clone it — PgPool clones cheaply, it's a handle to the pool)
    let user = get_user(&pool, 1).await?;
    println!("{}", user.name);
    Ok(())
}
```

`PgPool` is cheap to `.clone()` — cloning it doesn't open new connections, it just hands out another handle to the same shared pool.

```bash
cargo add sqlx --features runtime-tokio,postgres,macros
cargo add tokio --features full
```

### Bound parameters, not string formatting

`$1`, `$2`, ... are placeholders. You give sqlx the value separately via `.bind(...)` (or as extra arguments to `query!`), and the database driver sends the query text and the values as *separate* pieces — never mashed together into one string. This is what makes SQL injection basically impossible if you stick to it: user input is always data, never part of the SQL syntax.

```rust
// good: name travels as data, never as SQL text
sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE name = $1")
    .bind(name)
    .fetch_optional(pool)
    .await
```

Format a variable straight into the SQL string instead, and you've reopened the exact hole parameterized queries exist to close.

## Common mistakes

- **String-formatting values into SQL.** `format!("... WHERE name = '{}'", name)` reintroduces SQL injection and throws away sqlx's whole safety story. Always use `$1`, `$2`, ... with `.bind(...)`.
- **Opening a new connection per query instead of sharing a pool.** Each connection is expensive to set up; under real traffic this exhausts the database's connection limit fast. Create one `PgPool` at startup and share it.
- **No live database (or offline cache) at build time.** The `query!`/`query_as!` macros need to reach a real database (via `DATABASE_URL`) or a saved `.sqlx` offline cache to check your SQL while compiling. CI pipelines that forget this get a build failure with "set DATABASE_URL" even though the SQL is fine.
- **Treating sqlx like an ORM.** There's no `.where()`/`.order_by()` chain — you write the SQL yourself. Trying to build queries piece-by-piece in Rust fights the library instead of using it.
- **Mismatched Rust/SQL types.** A `NULL`-able SQL column mapped to a non-`Option` Rust field is a compile error with `query!` (which is the point — it caught a real mismatch), not a bug to silence.

## More examples

### Creating a post and getting its id back
Inserting a row often isn't enough by itself — a `RETURNING id` clause hands back the database-generated primary key in the same round trip.

```rust
use sqlx::PgPool;

async fn create_post(pool: &PgPool, title: &str) -> sqlx::Result<i64> {
    sqlx::query_scalar("INSERT INTO posts (title) VALUES ($1) RETURNING id")
        .bind(title)
        .fetch_one(pool)
        .await
}
```

### Updating a user's email address
An account-settings form's "save" button is just an `UPDATE` with two bound parameters — the row to change and the new value, never raw SQL text.

```rust
use sqlx::PgPool;

async fn update_email(pool: &PgPool, user_id: i64, new_email: &str) -> sqlx::Result<()> {
    sqlx::query("UPDATE users SET email = $1 WHERE id = $2")
        .bind(new_email)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}
```

### Transferring money without leaving an account half-updated
Moving money between two accounts has to be all-or-nothing — a transaction makes sure a crash between the two updates can't leave one account debited and the other never credited.

```rust
use sqlx::PgPool;

async fn transfer_funds(
    pool: &PgPool,
    from_account: i64,
    to_account: i64,
    amount_cents: i64,
) -> sqlx::Result<()> {
    let mut tx = pool.begin().await?;

    sqlx::query("UPDATE accounts SET balance_cents = balance_cents - $1 WHERE id = $2")
        .bind(amount_cents)
        .bind(from_account)
        .execute(&mut *tx)
        .await?;

    sqlx::query("UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2")
        .bind(amount_cents)
        .bind(to_account)
        .execute(&mut *tx)
        .await?;

    tx.commit().await
}
```

### Paginating a blog's list of posts
A blog's archive page can't load every post at once — `LIMIT` and `OFFSET`, bound the same way as any other value, fetch just the page the reader asked for.

```rust
use sqlx::PgPool;

#[derive(sqlx::FromRow)]
struct Post {
    id: i64,
    title: String,
}

async fn list_posts_page(pool: &PgPool, page: i64, page_size: i64) -> sqlx::Result<Vec<Post>> {
    sqlx::query_as::<_, Post>("SELECT id, title FROM posts ORDER BY id LIMIT $1 OFFSET $2")
        .bind(page_size)
        .bind(page * page_size)
        .fetch_all(pool)
        .await
}
```

## Your turn

This function looks up a user by name — but it builds the SQL by formatting `name` straight into the query string instead of using a bound parameter.

```rust
use sqlx::PgPool;

#[derive(sqlx::FromRow)]
struct User {
    id: i64,
    name: String,
}

async fn find_user_by_name(pool: &PgPool, name: &str) -> sqlx::Result<Option<User>> {
    let query = format!("SELECT id, name FROM users WHERE name = '{}'", name);
    sqlx::query_as::<_, User>(&query)
        .fetch_optional(pool)
        .await
}
```

What's wrong? If someone calls `find_user_by_name(&pool, "x' OR '1'='1")`, the formatted string becomes `SELECT id, name FROM users WHERE name = 'x' OR '1'='1'` — the attacker's input escaped the quotes and rewrote the query's logic to match *every* row. That's a SQL injection vulnerability, and it also throws away everything sqlx offers for query safety.

<details><summary>Show solution</summary>

Use a bound parameter (`$1`) and `.bind(name)` instead of formatting the string:

```rust
use sqlx::PgPool;

#[derive(sqlx::FromRow)]
struct User {
    id: i64,
    name: String,
}

async fn find_user_by_name(pool: &PgPool, name: &str) -> sqlx::Result<Option<User>> {
    sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE name = $1")
        .bind(name)
        .fetch_optional(pool)
        .await
}
```

Now `name` always travels to the database as a *value*, never as part of the SQL text — the driver sends the query shape and the data separately, so there's no string for an attacker to "escape out of." This also means the query text is a fixed `&'static str` that sqlx can check once, instead of a different string on every call.

</details>

## Quick check

<div class="quiz" data-topic="databases-and-sqlx"></div>

## Remember this

- `sqlx` isn't an ORM — you write real SQL, and it checks that SQL for you instead of hiding it.
- `sqlx::query!`/`sqlx::query_as!` connect to a **live database at compile time** (or use a saved offline cache) to verify your SQL and infer result types.
- Create one `PgPool` (`PgPool::connect(...).await?`) at startup and share it (e.g. via `Arc` or app state) — don't open a new connection per query.
- Always use bound parameters (`$1`, `$2`, ...) with `.bind(...)` instead of formatting SQL strings by hand — that's what makes SQL injection basically impossible.
- `PgPool` is cheap to `.clone()` — it's a handle to the shared pool, not a new set of connections.

## Go deeper

- [sqlx docs](https://docs.rs/sqlx/) — Async SQL toolkit.

**Next:**

- [CLI apps](../runtime-and-ecosystem/cli-apps.md)
- [Web services](../runtime-and-ecosystem/web-services.md)

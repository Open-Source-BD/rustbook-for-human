# File I/O

> **Intermediate** · Runtime & ecosystem

## What & why

Reading and writing files is how a program remembers things after it closes. Rust's `std::fs`
module gives you direct, no-magic functions for this — but every one of them can *fail* (the file
might be missing, locked, or full disk), so Rust forces you to handle that failure. This lesson is
really two lessons in a trench coat: files, and the `Result` error handling that files demand.

## The idea, slowly

Talking to a file is talking to the outside world, and the outside world is unreliable. The disk
could be full. The file could have been deleted a millisecond ago. You might not have permission.
Because any of these can happen, almost every file function in Rust returns a `Result` — a value
that is either `Ok(the_data)` or `Err(what_went_wrong)`. Rust will not let you use the data until
you've said what happens in the `Err` case. That's the whole "treat failure as part of the design"
idea.

### Reading a whole file into a String

The simplest possible read:

```rust
// This needs a real file on disk — run it in a cargo project, not the Playground.
use std::fs;

fn main() {
    let text = fs::read_to_string("notes.txt")
        .expect("could not read notes.txt");
    println!("The file says: {}", text);
}
```

`fs::read_to_string("notes.txt")` returns a `Result<String, io::Error>`. The `.expect("...")` says:
*"If this is `Ok`, hand me the String inside. If it's `Err`, crash and print my message."* `.expect`
is fine for tiny scripts, but crashing is rude in real software — we'll do better in a moment.

The compiler is thinking: *"This function can fail. I will hand the human a `Result`, and I refuse
to let them pretend the failure can't happen. They must unwrap it, `.expect` it, or propagate it."*

### Writing a String to a file

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;

fn main() {
    fs::write("greeting.txt", "Hello from Rust!")
        .expect("could not write greeting.txt");
    println!("Wrote the file.");
}
```

`fs::write` creates the file if it doesn't exist, or **overwrites** it completely if it does. There
is no "oops" — if the file was there, its old contents are gone. If you want to *add* to a file
instead of replacing it, you open it in append mode (shown below).

### The `?` operator — the grown-up way to handle failure

Sprinkling `.expect` everywhere means your program panics at the first hiccup. The professional
pattern is to let errors *bubble up* to the caller using the `?` operator. `?` means: *"If this is
`Ok`, give me the value and keep going. If it's `Err`, stop this function right now and return that
error to whoever called me."*

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;
use std::io;

fn load_notes() -> Result<String, io::Error> {
    let text = fs::read_to_string("notes.txt")?;   // ? here
    Ok(text)
}

fn main() {
    match load_notes() {
        Ok(text) => println!("Notes: {}", text),
        Err(e)   => println!("Sorry, couldn't load notes: {}", e),
    }
}
```

Notice that a function using `?` must itself return a `Result` (or `Option`), because `?` needs
somewhere to send the error. That's why `load_notes` returns `Result<String, io::Error>`. This is
the single most common shape of real Rust I/O code.

### Appending instead of overwriting

When you want to add lines to a log without erasing it, open the file with `OpenOptions`:

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs::OpenOptions;
use std::io::Write;

fn main() -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .create(true)   // make it if missing
        .append(true)   // add to the end, don't erase
        .open("log.txt")?;

    writeln!(file, "another log line")?;   // writeln! adds a newline
    Ok(())
}
```

See how `main` itself returns `std::io::Result<()>`? Rust lets `main` return a `Result` so you can
use `?` right inside it. `()` (the empty tuple) means "on success there's no interesting value to
return, just the fact that it worked."

### Why can't I just run these on the Playground?

The Rust Playground has no real filesystem you can trust — there's no `notes.txt` sitting there, and
writes vanish. So the blocks above are marked to *show* nicely without a broken Run button. To
actually try file I/O, make a tiny project with `cargo new fileplay`, drop the code into
`src/main.rs`, put a `notes.txt` next to `Cargo.toml`, and run `cargo run`.

### One thing you *can* run: handling a Result

Error handling itself doesn't need a filesystem. Here's a runnable program that mimics the exact
shape of file code — a function that returns a `Result`, unwrapped with `match`:

```rust,editable
// Pretend this is "reading a file" — it returns Ok or Err just like fs::read_to_string.
fn read_config(name: &str) -> Result<String, String> {
    if name == "config.txt" {
        Ok(String::from("theme=dark"))
    } else {
        Err(format!("no such file: {}", name))
    }
}

fn main() {
    match read_config("config.txt") {
        Ok(contents) => println!("Loaded: {}", contents),
        Err(problem) => println!("Failed: {}", problem),
    }

    match read_config("missing.txt") {
        Ok(contents) => println!("Loaded: {}", contents),
        Err(problem) => println!("Failed: {}", problem),
    }
}
```

Press Run. You'll see one success and one failure — exactly the two paths real file code deals with.

## Common mistakes

- **Ignoring the `Result`.** If you call `fs::write(...)` and never look at the result, Rust warns
  you (`unused Result that must be used`). That warning is real — you just threw away the answer to
  "did it actually work?"
- **Using `.unwrap()`/`.expect()` in real programs.** They crash the whole program on the first
  error. Fine for a throwaway script; bad for anything a user touches. Prefer `?` and handle the
  error where it makes sense.
- **Forgetting that `fs::write` overwrites.** It replaces the entire file. If you meant to add to
  it, you needed `OpenOptions::new().append(true)`.
- **Using `?` in a function that returns `()`.** `?` needs to return an error somewhere. The
  function it lives in must return `Result` (or `Option`), including `main` if you use `?` there.
- **Assuming a path is relative to your source file.** File paths are relative to where the program
  is *run from* (the working directory), not where the `.rs` file lives. This trips up everyone once.

## More examples

### Counting lines in a server access log
Log files are read far more often than they're parsed structurally — `.lines().count()` answers "how many requests came in" without building anything fancier.

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;

fn main() {
    let text = fs::read_to_string("access.log").expect("could not read access.log");
    let line_count = text.lines().count();
    println!("access.log has {line_count} entries");
}
```

### Backing up a save file before overwriting it
A game that's about to write new save data first wants a safety copy — `fs::copy` duplicates a file in one call instead of a manual read-then-write.

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;

fn main() {
    fs::copy("save.dat", "save.dat.bak")
        .expect("could not back up save.dat");
    println!("backup written to save.dat.bak");
}
```

### Refusing to clobber an existing export file
A "generate report" button that silently overwrites yesterday's export is a bug waiting to be reported — checking `Path::exists()` first lets the program refuse instead of destroying data.

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;
use std::path::Path;

fn main() {
    let path = "report.csv";
    if Path::new(path).exists() {
        println!("refusing to overwrite {path} — it already exists");
    } else {
        fs::write(path, "id,total\n").expect("could not create report.csv");
        println!("wrote a fresh {path}");
    }
}
```

### Cleaning up a temp file after a batch job
A batch job that writes intermediate scratch data shouldn't leave it lying around when it's done — `fs::remove_file` deletes it explicitly instead of hoping the OS cleans up.

```rust
// Needs a real filesystem — run in a cargo project.
use std::fs;

fn main() {
    let tmp_path = "batch_job.tmp";
    fs::write(tmp_path, "intermediate data").expect("could not write temp file");

    // ... batch job would read/process the temp file here ...

    fs::remove_file(tmp_path).expect("could not remove temp file");
    println!("cleaned up {tmp_path}");
}
```

## Your turn

This is a "spot the bug" exercise (file I/O can't run on the Playground). The function below is
supposed to read a file and return its contents, but it won't compile. What's wrong, and how do
you fix it?

```rust,ignore
use std::fs;

fn load(path: &str) -> String {
    let text = fs::read_to_string(path)?;   // hmm...
    text
}
```

<details><summary>Show solution</summary>

The `?` operator can only be used in a function that returns a `Result` (or `Option`), because `?`
needs somewhere to send the error if the read fails. This function claims to return a plain `String`,
so there's nowhere for the error to go — the compiler rejects it.

Fix it by making the return type a `Result`:

```rust,ignore
use std::fs;
use std::io;

fn load(path: &str) -> Result<String, io::Error> {
    let text = fs::read_to_string(path)?;   // ? now has somewhere to return an error
    Ok(text)                                // success case must be wrapped in Ok
}
```

Now `?` works: on success it unwraps the String, and on failure it returns the `io::Error` to the
caller. Note the success value also had to be wrapped in `Ok(...)`.

</details>

## Quick check

<div class="quiz" data-topic="file-io"></div>

## Remember this

- Almost every `std::fs` function returns a `Result` because file access can always fail.
- `fs::read_to_string(path)` reads a whole file; `fs::write(path, data)` writes (and **overwrites**) one.
- The `?` operator unwraps `Ok` or early-returns `Err` — but only inside a function that returns `Result`/`Option`.
- Use `OpenOptions::new().append(true)` to add to a file instead of erasing it.
- Prefer `?` over `.unwrap()`/`.expect()` in real programs so failures are handled, not crashes.

## Go deeper

- [std::fs docs](https://doc.rust-lang.org/std/fs/index.html) — Standard file APIs.

**Next:**

- [Serde and JSON](../runtime-and-ecosystem/serde-and-json.md)
- [CLI apps](../runtime-and-ecosystem/cli-apps.md)

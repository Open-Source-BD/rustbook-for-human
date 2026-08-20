# Regex and text processing

> **Intermediate** · Runtime & ecosystem

## What & why

Regular expressions are a powerful way to describe patterns in text — "four digits, a dash, two digits" — and check, find, or extract them. Rust's standard library has no regex support at all; the ecosystem standard is the `regex` crate. But regex is also easy to reach for out of habit when a plain `str` method would be clearer, faster to write, and dependency-free. This lesson covers both: the std tools worth trying first, and `regex` done properly when you actually need pattern matching.

## The idea, slowly

### Try plain `str` methods first

Before adding a dependency, ask: is this really a *pattern*, or just a fixed piece of text? A huge amount of "text processing" is actually just splitting, trimming, and checking prefixes/suffixes — all built into `str`, no regex required.

```rust,editable
fn main() {
    let email = "shaon@example.com";

    // Splitting on a literal character — no pattern matching needed.
    if let Some((user, domain)) = email.split_once('@') {
        println!("user: {user}, domain: {domain}");
    }

    let line = "   hello world   ";
    println!("trimmed: {:?}", line.trim());

    let path = "src/main.rs";
    println!("is a rust file: {}", path.ends_with(".rs"));
    println!("lives under src/: {}", path.starts_with("src/"));
    println!("contains 'main': {}", path.contains("main"));
}
```

Every one of those reads clearly, compiles instantly, and needs zero extra crates. `split_once`, `trim`, `starts_with`, `ends_with`, and `contains` cover a surprising fraction of what people reach for regex to do. Save regex for when the shape you're matching genuinely varies — repeated digits, optional parts, alternatives — not fixed substrings.

### Compiling a `Regex` — once

When you do need real pattern matching, add the crate:

```bash
cargo add regex
```

`Regex::new(pattern)` **compiles** the pattern into a matching engine, and that compilation step is the expensive part — meaningfully more work than actually running a match. Compile a pattern exactly once, and reuse the same `Regex` for every match after that.

```rust
// regex is an external crate — add it first (above), then run in a real project.
use regex::Regex;

fn main() {
    let re = Regex::new(r"^\d{3}-\d{4}$").unwrap();

    for candidate in ["555-1234", "hello", "000-0000", "12-3456"] {
        println!("{candidate}: {}", re.is_match(candidate));
    }
}
```

Notice the pattern is written as a **raw string**, `r"..."`. Regex syntax leans heavily on backslashes (`\d` for a digit, `\s` for whitespace), and Rust's normal string literals treat backslashes as escape sequences too — so without the `r` prefix, the compiler tries to interpret `\d` as an *escape character* in a Rust string, not as regex syntax, and rejects it outright. `r"..."` turns backslashes back into plain, literal characters.

### `.find()` and `.captures()` — with named groups

`.is_match()` just answers yes/no. `.find()` returns the matched text itself; `.captures()` breaks a match into its labeled pieces:

```rust
use regex::Regex;

fn main() {
    let re = Regex::new(r"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})").unwrap();
    let text = "Order placed 2026-08-20, shipped 2026-08-22.";

    for caps in re.captures_iter(text) {
        println!("year={} month={} day={}", &caps["year"], &caps["month"], &caps["day"]);
    }
}
```

`(?<year>\d{4})` names that group `year`, so you pull it out with `&caps["year"]` instead of a fragile numeric index like `&caps[1]`. If you later add or reorder groups in the pattern, code that reads by name keeps working; code that reads by number silently breaks.

### The hot-loop trap, and compiling once for real

`Regex::new` inside a loop — or worse, inside a function called per item — recompiles the same pattern every single time, throwing away the one expensive step over and over. The fix is to compile it once, up front, and pass the compiled `Regex` around. For a value that needs to live for your whole program without an explicit "pass it everywhere" plumbing job, `std::sync::LazyLock` builds it lazily on first use and then reuses it:

```rust
use regex::Regex;
use std::sync::LazyLock;

static WORD_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\w+").unwrap());

fn count_words(text: &str) -> usize {
    WORD_RE.find_iter(text).count() // same compiled Regex, every call
}

fn main() {
    println!("{}", count_words("the quick brown fox jumps"));
    println!("{}", count_words("regex, compiled exactly once"));
}
```

`WORD_RE` compiles its pattern the *first* time it's touched, no matter how many times `count_words` runs afterward — exactly the "compile once, reuse forever" shape you want.

## Common mistakes

- **Compiling a `Regex` inside a loop or a frequently-called function.** This dominates the runtime cost of "using regex" — always compile once (module-level `LazyLock`, or once at startup) and reuse the same `Regex` value.
- **Forgetting the raw string prefix.** Writing `"\d{4}"` instead of `r"\d{4}"` fights Rust's own string escaping, not the regex engine — and it's a compile error, not a regex error, so read the compiler's message carefully.
- **Porting a pattern from another language that uses backreferences or lookaround.** The `regex` crate deliberately doesn't support them, to guarantee linear-time matching (no catastrophic backtracking). A pattern that worked in Python or JS may need rewriting.
- **Reaching for regex when a `str` method would do.** A pattern like `"starts with http"` doesn't need `Regex::new(r"^http")` when `s.starts_with("http")` says the same thing without a dependency.
- **Reading captures by numeric index.** `&caps[1]` breaks silently if the pattern's groups are ever reordered; named groups (`&caps["name"]`) are self-documenting and safer to refactor.

## Your turn

This program is supposed to check whether some text looks like a date — but it doesn't compile.

```rust
use regex::Regex;

fn main() {
    let re = Regex::new("\d{4}-\d{2}-\d{2}").unwrap(); // bug!
    println!("{}", re.is_match("2026-08-20"));
}
```

<details><summary>Show solution</summary>

The pattern is written as a normal Rust string, `"\d{4}-\d{2}-\d{2}"`, not a raw string. Rust tries to interpret `\d` as a character escape sequence in the string literal itself — and `\d` isn't a valid one — so this fails to even *compile*, with an error like `unknown character escape: \`d\``, well before the regex engine ever sees the pattern.

```rust
use regex::Regex;

fn main() {
    let re = Regex::new(r"\d{4}-\d{2}-\d{2}").unwrap(); // r"" = raw string
    println!("{}", re.is_match("2026-08-20"));
}
```

Adding the `r` prefix makes it a raw string, where backslashes are just literal characters with no special meaning to Rust — so `\d` reaches the regex engine exactly as written, where *it* interprets it as "any digit." Any regex pattern with backslashes should be written as a raw string as a matter of habit.

</details>

## Quick check

<div class="quiz" data-topic="regex-and-text-processing"></div>

## Remember this

- Std has no regex — the `regex` crate is the ecosystem standard, built on a linear-time (non-backtracking) engine.
- `Regex::new(pattern)` compiles the pattern once; compiling is the expensive part, so reuse the same `Regex` instead of recreating it per call or per loop iteration.
- `.is_match()` for yes/no, `.find()` for the matched text, `.captures()` for pieces — named groups (`(?<name>...)`) read better than numeric indices.
- Regex patterns almost always need a raw string (`r"..."`) so backslashes reach the regex engine literally instead of being eaten by Rust's own string escaping.
- Reach for plain `str` methods (`split`, `trim`, `starts_with`, `contains`) first — regex is for genuine patterns, not fixed substrings.

## Go deeper

- [regex crate docs](https://docs.rs/regex/) — Full pattern syntax and API.

**Next:**

- [Random numbers](../runtime-and-ecosystem/random-numbers.md)
- [HTTP clients with reqwest](../runtime-and-ecosystem/http-clients-reqwest.md)

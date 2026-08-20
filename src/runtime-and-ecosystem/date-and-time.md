# Dates and time

> **Intermediate** · Runtime & ecosystem

## What & why

"Time" in a program actually means two different things, and mixing them up causes real bugs. Sometimes you want to know *how long something took* — a stopwatch. Sometimes you want to know *what calendar date and time it is* — a clock. Rust's standard library gives you a proper stopwatch (`Instant`) and a raw wall clock (`SystemTime`), but deliberately has no calendar type at all — no year, month, day, timezone. For real dates you reach for the `chrono` crate, the ecosystem's answer to "what day is it, and how do I format it?"

## The idea, slowly

### `Instant` — a stopwatch that can't lie to you

`Instant::now()` captures a point on a **monotonic** clock: one that only ever moves forward, and is completely unaffected by someone adjusting the system clock (daylight saving, NTP sync, a user manually changing their laptop's date). Call `.elapsed()` on it later to get a `Duration` — exactly how much time has passed.

```rust,editable
use std::time::Instant;

fn main() {
    let start = Instant::now();

    let mut sum: u64 = 0;
    for i in 0..1_000_000u64 {
        sum = sum.wrapping_add(i);
    }

    let elapsed = start.elapsed();
    println!("summed to {sum} in {elapsed:?}");
}
```

`Instant` is deliberately *opaque* — you can't turn one into a calendar date, print it as "August 20th," or serialize it to disk and compare it after a restart. It only makes sense compared to another `Instant` from the same run of the same program. That narrowness is the whole point: it exists for exactly one job, measuring elapsed time, and it's immune to the ways a wall clock can jump around.

### `SystemTime` — the real wall clock, which *can* jump

`SystemTime::now()` gives you the actual wall-clock time — the one a user could change by fiddling with their system settings, or that an NTP sync could nudge backward by a few milliseconds. That's exactly why comparing two `SystemTime`s returns a `Result`, not a plain `Duration`:

```rust,editable
use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    let now = SystemTime::now();
    match now.duration_since(UNIX_EPOCH) {
        Ok(elapsed) => println!("seconds since the Unix epoch: {}", elapsed.as_secs()),
        Err(e) => println!("system clock is set before 1970: {e}"),
    }
}
```

A `Duration` in Rust can never be negative, but a wall clock genuinely *can* go backward relative to some reference point. So `duration_since` hands back `Err` instead of pretending a negative duration makes sense. The compiler is thinking: *"You asked for the gap between two wall-clock readings — I can't promise that gap is positive, so you get a `Result`, not a bare `Duration`."* Use `SystemTime` for timestamps you want to store or display (`SystemTime::now()` as "when did this happen"); use `Instant` when you're timing how long something takes.

### `chrono` — actual calendar dates, formatting, and parsing

Neither `Instant` nor `SystemTime` knows what a "month" or a "timezone" is — they're just points on a clock. For real calendar work (dates, formatting, parsing, timezones), the ecosystem standard is `chrono`.

```bash
cargo add chrono
```

```rust
// chrono is an external crate — add it first (above), then run in a real project.
use chrono::{DateTime, Utc};

fn main() {
    let now: DateTime<Utc> = Utc::now();
    println!("now (UTC): {}", now.format("%Y-%m-%d %H:%M:%S"));

    // Parsing text back into a real date:
    let parsed = DateTime::parse_from_rfc3339("2026-08-20T15:30:00Z")
        .expect("invalid timestamp");
    println!("parsed: {}", parsed.format("%A, %B %d, %Y"));
}
```

`chrono::Utc::now()` returns a `DateTime<Utc>` — a real calendar timestamp that knows its own timezone (UTC, in this case). `.format("%Y-%m-%d %H:%M:%S")` uses `strftime`-style format specifiers (`%Y` = 4-digit year, `%m` = month, `%d` = day, and so on) to turn it into readable text; `DateTime::parse_from_rfc3339` goes the other direction, turning text into a `DateTime`. If you want the *local* timezone instead of UTC, `chrono::Local::now()` gives you a `DateTime<Local>` — but be deliberate about which one you're using, since comparing a `Utc` time to a `Local` time without converting first is a classic source of off-by-several-hours bugs.

## Common mistakes

- **Using `SystemTime` to measure how long something took.** It can jump backward if the system clock is adjusted mid-measurement, silently producing a wrong (or `Err`-returning) duration. `Instant` is immune to this — use it for timing.
- **Expecting `Instant` to tell you a calendar date.** It has no `.format()` method and can't be turned into "August 20th" — it's just an opaque stopwatch reading. Reach for `chrono` when you need an actual date.
- **Mixing up `%M` and `%m` in a format string.** `%m` is the month, `%M` is minutes — one letter case flips an entire field. Always check a format string against real output once.
- **Comparing a `Utc` time to a `Local` time directly.** They represent the same instant differently depending on the machine's timezone; convert one to match the other (`.with_timezone(&Utc)`) before comparing.
- **Assuming `duration_since` always succeeds.** It returns `Err` if the earlier time is actually later — don't reach for `.unwrap()` on it without thinking about why that `Result` exists.

## Your turn

This program is supposed to print how long a loop took — but it doesn't compile.

```rust,editable
use std::time::Instant;

fn main() {
    let now = Instant::now();
    println!("{}", now.format("%Y-%m-%d")); // bug!
}
```

<details><summary>Show solution</summary>

`Instant` has no `.format()` method — it isn't a calendar date at all, just an opaque point on a monotonic clock with no year, month, or day attached to it. The compiler rejects this with something like `no method named \`format\` found for struct \`Instant\` in the current scope`. Formatting like `"%Y-%m-%d"` is a `chrono` `DateTime` operation, not something any `std::time` type can do.

```rust,editable
use std::time::Instant;

fn main() {
    let start = Instant::now();
    // ... do some work ...
    let elapsed = start.elapsed();
    println!("{elapsed:?}"); // Duration implements Debug — this is what Instant is for
}
```

`Instant` only ever answers "how much time passed" via `.elapsed()`, which returns a `Duration` you can `{:?}`-print directly. If what you actually want is "what's today's date, formatted nicely," that's `chrono::Utc::now().format("%Y-%m-%d")` — a completely different type, for a completely different question.

</details>

## Quick check

<div class="quiz" data-topic="date-and-time"></div>

## Remember this

- `Instant::now()` + `.elapsed()` measures elapsed time for timing code — monotonic, immune to system clock changes, and can't be turned into a calendar date.
- `SystemTime` is the real wall clock — use it for timestamps, not for measuring durations, since it can jump if the clock is adjusted.
- `chrono::DateTime<Utc>` / `Local` is the standard type for actual calendar dates: `.format(...)` to print, `DateTime::parse_from_rfc3339(...)` to parse.
- `duration_since` returns a `Result`, not a bare `Duration`, because a wall clock can genuinely go backward.
- Be explicit about `Utc` vs. `Local` — comparing across them without converting is a classic off-by-hours bug.

## Go deeper

- [std::time docs](https://doc.rust-lang.org/std/time/index.html) — Instant, Duration, SystemTime.
- [chrono docs](https://docs.rs/chrono/) — Calendar dates, timezones, formatting.

**Next:**

- [Regex and text processing](../runtime-and-ecosystem/regex-and-text-processing.md)
- [Random numbers](../runtime-and-ecosystem/random-numbers.md)

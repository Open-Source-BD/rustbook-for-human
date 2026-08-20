# Random numbers

> **Beginner** · Runtime & ecosystem

## What & why

Games, simulations, sampling, tests that want varied input — plenty of programs need randomness, and Rust's standard library deliberately has none. Generating good random numbers is a real algorithmic problem (predictable "randomness" is a security bug waiting to happen), so it lives in the `rand` crate instead of std, where it can evolve independently. `rand` covers the everyday needs — a random number in a range, picking a random element, shuffling a list — and also lets you pin down a specific, reproducible sequence when that's what you actually want.

## The idea, slowly

### A random number in a range

```bash
cargo add rand
```

```rust
// rand is an external crate — add it first (above), then run in a real project.
use rand::Rng;

fn main() {
    let mut rng = rand::rng(); // the default thread-local generator

    let roll: u32 = rng.random_range(1..=6); // inclusive range: 1 through 6
    println!("rolled a {roll}");

    let coin: bool = rng.random();
    println!("heads: {coin}");
}
```

`rand::rng()` hands you the default, thread-local random number generator — reach for it first; it's fast, and good enough for games, sampling, and everyday randomness. `.random_range(1..=6)` needs the `Rng` trait in scope (`use rand::Rng;`) because `random_range` and `random` are trait methods, not inherent ones. Notice the range is `1..=6`, with `..=` — an *inclusive* range, so a real six-sided die can actually roll a 6. A plain `1..6` would only ever produce 1 through 5.

### Picking and shuffling — bring `SliceRandom` into scope

Random-ness on a `&[T]` slice — picking one random element, or shuffling the whole thing in place — lives behind a *different* trait, `rand::seq::SliceRandom`. Without it imported, `.choose()` and `.shuffle()` simply don't exist on your slice as far as the compiler is concerned.

```rust
use rand::seq::SliceRandom;

fn main() {
    let mut rng = rand::rng();

    let colors = ["red", "green", "blue", "yellow"];
    if let Some(pick) = colors.choose(&mut rng) {
        println!("picked: {pick}");
    }

    let mut deck: Vec<u32> = (1..=10).collect();
    deck.shuffle(&mut rng);
    println!("shuffled: {deck:?}");
}
```

`.choose(&mut rng)` returns `Option<&T>` — `None` if the slice is empty, since there's obviously nothing to pick then. `.shuffle(&mut rng)` reorders the elements in place (hence `&mut deck`) rather than returning a new collection.

### Reproducible sequences with a seeded RNG

The default `rand::rng()` is intentionally unpredictable — every run gives a different sequence, which is exactly what you want for an actual game. But sometimes you want the *opposite*: a test that always rolls the same "random" numbers so it's not flaky, or a simulation you can re-run and get identical output to compare against. For that, seed a specific generator instead of using the default one:

```rust
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

fn main() {
    let mut rng = StdRng::seed_from_u64(42);
    let rolls: Vec<u32> = (0..5).map(|_| rng.random_range(1..=6)).collect();
    println!("{rolls:?}"); // identical output every single run
}
```

`StdRng::seed_from_u64(42)` builds a generator whose entire sequence is determined by the seed `42` — run this program a hundred times and `rolls` prints the exact same five numbers every time. Change the seed, get a different (but again fully reproducible) sequence. This is the tool for "I need randomness, but I also need to be able to reproduce a specific run" — tests, simulations, and debugging a bug report that only happens with "unlucky" random input.

## Common mistakes

- **Forgetting to import `rand::seq::SliceRandom`.** `.choose()` and `.shuffle()` live on that trait, not directly on slices — without `use rand::seq::SliceRandom;`, the compiler says something like `no method named \`choose\` found for reference \`&[...]\``.
- **Using a half-open range where you meant inclusive.** `rng.random_range(1..6)` can never produce `6` — for "a die roll from 1 to 6" or "a random index up to and including the last element," you almost always want `..=`.
- **Assuming the default RNG is safe for security-sensitive randomness.** `rand::rng()`'s default algorithm is built for speed and statistical quality, not guaranteed unpredictability against an attacker — check `rand`'s docs (and consider a CSPRNG) before generating tokens, session ids, or anything security-relevant.
- **Using the default thread RNG in a test that needs to be deterministic.** A test built on `rand::rng()` can pass locally and flake in CI (or vice versa) purely from which random values it happened to draw — seed a `StdRng` in tests instead.
- **Calling `.choose()` on a possibly-empty slice and immediately `.unwrap()`-ing.** It returns `Option<&T>` specifically because an empty slice has nothing to choose — handle the `None` case, or make sure emptiness is actually impossible first.

## Your turn

This program is supposed to pick a random name from a list — but it doesn't compile.

```rust
use rand::Rng;

fn main() {
    let mut rng = rand::rng();
    let names = ["Alice", "Bob", "Chen"];
    let picked = names.choose(&mut rng).unwrap(); // bug!
    println!("chosen: {picked}");
}
```

<details><summary>Show solution</summary>

`.choose()` is a method from the `rand::seq::SliceRandom` trait, not something slices have built in — and only `rand::Rng` is imported here. The compiler rejects this with something like `no method named \`choose\` found for array \`[&str; 3]\` in the current scope`, and (helpfully) usually suggests the missing trait by name.

```rust
use rand::Rng;
use rand::seq::SliceRandom;

fn main() {
    let mut rng = rand::rng();
    let names = ["Alice", "Bob", "Chen"];
    let picked = names.choose(&mut rng).unwrap(); // now SliceRandom is in scope
    println!("chosen: {picked}");
}
```

Adding `use rand::seq::SliceRandom;` alongside `use rand::Rng;` brings `.choose()` (and `.shuffle()`) into scope for the slice. Two different jobs — "give me a random number" vs. "do something random with a collection" — live on two different traits, and Rust only gives you the methods for traits you've actually imported.

</details>

## Quick check

<div class="quiz" data-topic="random-numbers"></div>

## Remember this

- Std has no random number generator — `rand` is the ecosystem standard.
- `rand::rng().random_range(1..=6)` generates a random value in a range; use `..=` for an inclusive upper bound (like a real die).
- `.choose(&mut rng)` / `.shuffle(&mut rng)` need `rand::seq::SliceRandom` imported — without it, the compiler says the methods don't exist.
- `.choose()` returns `Option<&T>` because an empty slice has nothing to pick.
- Seed a specific generator (`StdRng::seed_from_u64(42)`) instead of the default thread RNG when you need a reproducible sequence — tests, simulations, or reproducing a bug exactly.

## Go deeper

- [rand crate docs](https://docs.rs/rand/) — RNGs, ranges, and distributions.

**Next:**

- [HTTP clients with reqwest](../runtime-and-ecosystem/http-clients-reqwest.md)

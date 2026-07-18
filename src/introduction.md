# Rust for Humans

Rust is worth learning, but most resources explain it like you already know it. This one
doesn't. It's built for the person who reads a chapter, feels like they get it, then forgets
half of it three days later. (That's normal. It's how brains work. This site is designed to
fight it.)

## How to use this site

You learn and remember by **doing**, not by reading. So every lesson gives you four ways to make
it stick:

1. **Read the idea, slowly.** Each topic is explained in plain English first — the *why* before
   the *how*. No wall of jargon.

2. **Run the code.** Every code box has a **▶ Run** button. It runs real Rust in your browser.
   Don't just read it — **change it, break it, run it again.** Seeing the compiler yell at you
   (and then fixing it) is how the rules move from "I read that" to "I know that."

   ```rust,editable
   fn main() {
       let name = "you";
       println!("Hello, {name}! Try changing this line and press Run.");
   }
   ```

3. **Do the "Your turn" exercise.** A small broken program you have to fix. If you can fix it,
   you understood it. If you can't, the lesson above has the answer.

4. **Take the quick check.** A couple of questions at the end of each lesson. Getting them wrong
   is useful — the explanation tells you exactly what you missed.

Then, whenever you feel Rust slipping away, open the **[Review & flashcards](review.md)** page.
It reshuffles the key questions from everything you've learned and shows the ones you marked
"shaky" first. Ten minutes there beats rereading a whole chapter.

## The path

The lessons are ordered so each one builds on the last. Start at the top of the sidebar and work
down:

- **Start here** — install Rust, run your first program, read compiler errors without panicking.
- **Language basics** — variables, types, functions, structs, enums, pattern matching.
- **Ownership** — the part that feels hard at first and then makes everything else click.
- **Abstractions** — traits, generics, iterators, closures, error handling.
- **Runtime & ecosystem** — testing, concurrency, async, and the tools you use every day.

You don't have to rush. Do one lesson, run every example, take the quiz. Come back tomorrow and
do the next one. Slow and sticky beats fast and forgotten.

Ready? Open **[Rust at a glance](start-here/rust-at-a-glance.md)**.

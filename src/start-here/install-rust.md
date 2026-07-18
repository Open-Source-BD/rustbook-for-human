# Install Rust

> **Beginner** · Start here

## What & why

Before you can run a single line of Rust on your own machine, you need the tools installed. The good news: there's one official installer that sets up everything and keeps it updated, so you don't have to hunt down pieces. This lesson walks you through it slowly and shows you how to check that it worked.

## The idea, slowly

To write Rust locally you need three things, and they come as a bundle:

- **`rustc`** — the compiler. It turns your Rust code into a program the computer can run.
- **`cargo`** — the project manager. You'll actually type `cargo` far more than `rustc`. It builds, runs, tests, and pulls in other people's code. (It has its own lesson next.)
- **`rustup`** — the installer and updater. It installs `rustc` and `cargo`, and later keeps them up to date.

Think of `rustup` as the app store, and `rustc` + `cargo` as the apps it installs and keeps current. You install `rustup` once; after that it manages the rest.

### Why one installer instead of your system's package manager

You might be tempted to run something like `apt install rustc` on Linux, or grab Rust from Homebrew. It usually works for a day and then hurts. Distro packages are often **old**, they're **hard to update** on Rust's fast release cycle, and they can't easily switch between the stable, beta, and nightly versions of Rust. `rustup` is the official tool built exactly for this job. Use it unless you have a specific, known reason not to.

### Installing it

Go to **[rustup.rs](https://rustup.rs/)** in your browser. It shows you the exact command for your operating system.

On macOS or Linux it's a single line you paste into your terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

On Windows, rustup.rs gives you a small installer to download and double-click (you'll also want the Visual Studio C++ build tools, which the installer points you to). Either way, when it asks you to choose an option, just press Enter for the **standard default install**. The defaults are the right choice for beginners.

While it runs, here's what the installer is "thinking": *download rustup, then use it to download the current stable compiler and cargo, then add them to your PATH so your terminal can find them.* That last part — PATH — is the one that trips people up, so read the next section.

### Making your terminal find the tools

After installing, the tools live in a folder like `~/.cargo/bin`. Your terminal only runs commands it can find on its **PATH** (a list of folders it searches). The installer adds that folder to your PATH — but a terminal window that was already open won't notice the change.

The fix is simple: **close your terminal and open a new one** (or run `source "$HOME/.cargo/env"`). This is the single most common "I installed it but nothing works" cause. If a command isn't found, restart the terminal first, before you assume anything is actually broken.

### Checking that it worked

Open a fresh terminal and run these three commands:

```bash
rustc --version
cargo --version
rustup --version
```

Each should print a version number, something like `rustc 1.XX.0`. If you see three version lines, you're done — the compiler, the project manager, and the updater are all installed and reachable.

### Keeping it current

Rust ships a new stable version roughly every six weeks. Updating is one command:

```bash
rustup update
```

That's `rustup` doing its "app store" job: fetch the latest stable `rustc` and `cargo` and swap them in. Run it now and then; you don't need to babysit it.

## Common mistakes

- **Installing from a distro package or Homebrew "because it's easier."** You often get an old version that's a pain to update and can't switch toolchains. When a tutorial assumes a recent Rust and yours is ancient, you'll waste an afternoon confused. Use `rustup` from rustup.rs.
- **"Command not found" right after installing.** This almost always means your open terminal hasn't picked up the new PATH yet. Close it and open a new one (or `source "$HOME/.cargo/env"`) *before* you start debugging. Restart first, panic later.
- **Skipping the version check.** If you don't run `rustc --version` and `cargo --version`, you won't know whether the install actually took until something fails mid-lesson. Confirm up front — it takes five seconds.
- **On Windows, missing the C++ build tools.** Rust needs a linker. The rustup installer tells you if you're missing the Visual Studio build tools; follow its prompt rather than ignoring it, or builds will fail with a confusing linker error.

## Your turn

This lesson has no code to fix — the exercise is to actually install and verify. Do this now:

1. Go to [rustup.rs](https://rustup.rs/) and run the command it gives you for your OS, accepting the standard defaults.
2. **Close your terminal and open a brand-new one.**
3. Run the three checks below.

```bash
rustc --version
cargo --version
rustup --version
```

<details><summary>Show solution</summary>

Success looks like three lines, each with a version number, for example:

```bash
rustc 1.79.0 (129f3b996 2024-06-10)
cargo 1.79.0 (ffa9cf99a 2024-06-03)
rustup 1.27.1 (54dd3d00f 2024-04-24)
```

Your exact numbers will differ and will be higher than these. If instead you see "command not found", open a *new* terminal (the PATH change hasn't reached your old one) or run `source "$HOME/.cargo/env"`, then try again. Three version lines means you're ready for the next lesson.

</details>

## Quick check

<div class="quiz" data-topic="install-rust"></div>

## Remember this

- Install with **rustup** from [rustup.rs](https://rustup.rs/); accept the standard defaults.
- `rustup` manages `rustc` (the compiler) and `cargo` (the project manager) and keeps them updated.
- After installing, **open a new terminal** so PATH updates — this fixes most "command not found" cases.
- Confirm with `rustc --version` and `cargo --version`; both should print version numbers.
- Update anytime with `rustup update`. Prefer rustup over distro/Homebrew packages.

## Go deeper

- [rustup](https://rustup.rs/) — Official installer.
- [Cargo Book - Getting Started](https://doc.rust-lang.org/cargo/getting-started/installation.html) — What Cargo expects from the toolchain.

**Next:**

- [Cargo basics](../start-here/cargo-basics.md)
- [Hello, world](../start-here/hello-world.md)

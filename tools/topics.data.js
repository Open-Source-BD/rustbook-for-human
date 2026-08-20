const topics = [
  {
    slug: "rust-at-a-glance",
    title: "Rust at a glance",
    category: "Start here",
    level: "Beginner",
    summary:
      "A quick map of what Rust is for, how the language is shaped, and which topics matter first.",
    description:
      "Rust puts memory safety, speed, and explicit control into the same language. New readers need a map before they need details, so this page explains the shape of the language and what the rest of the docs will teach.",
    takeaways: [
      "Rust is a systems language with strong safety checks.",
      "Ownership is the core concept that makes the rest click.",
      "Cargo and the standard library are the daily tools you use most."
    ],
    example: `fn main() {
    println!("Rust is explicit by default");
}`,
    pitfalls: [
      "Do not start with macros or unsafe code.",
      "Use this page to orient yourself, then move to Cargo and ownership."
    ],
    prereq: [],
    next: ["install-rust", "cargo-basics", "ownership"],
    tags: ["overview", "beginner", "language"],
    links: [
      {
        label: "The Rust Book",
        href: "https://doc.rust-lang.org/book/",
        note: "Start with the official learning path."
      },
      {
        label: "Rust by Example",
        href: "https://doc.rust-lang.org/rust-by-example/",
        note: "Short runnable examples."
      }
    ]
  },
  {
    slug: "install-rust",
    title: "Install Rust",
    category: "Start here",
    level: "Beginner",
    summary: "Install the toolchain with rustup and confirm the compiler, formatter, and Cargo work.",
    description:
      "Rustup manages toolchains, targets, and updates. This is the first operational step because every later doc assumes `cargo`, `rustc`, and `rustfmt` are available.",
    takeaways: [
      "Use rustup to manage stable, beta, and nightly toolchains.",
      "Check `rustc --version` and `cargo --version` after installation.",
      "Install a toolchain target when you need cross-compilation."
    ],
    example: `rustup update
rustc --version
cargo --version`,
    pitfalls: [
      "Do not install Rust from a distro package unless you know why you need it.",
      "If PATH looks wrong, restart your shell before debugging the toolchain."
    ],
    prereq: ["rust-at-a-glance"],
    next: ["cargo-basics", "hello-world"],
    tags: ["toolchain", "rustup", "setup"],
    links: [
      {
        label: "rustup",
        href: "https://rustup.rs/",
        note: "Official installer."
      },
      {
        label: "Cargo Book - Getting Started",
        href: "https://doc.rust-lang.org/cargo/getting-started/installation.html",
        note: "What Cargo expects from the toolchain."
      }
    ]
  },
  {
    slug: "cargo-basics",
    title: "Cargo basics",
    category: "Start here",
    level: "Beginner",
    summary: "Create projects, build them, run them, and manage dependencies with Cargo.",
    description:
      "Cargo is the project manager, build tool, test runner, and dependency manager. Most Rust workflows start and end with Cargo commands, so this page is the practical center of the docs.",
    takeaways: [
      "Use `cargo new` to start an app or library.",
      "Use `cargo run`, `cargo test`, and `cargo build` every day.",
      "Dependencies live in `Cargo.toml`."
    ],
    example: `cargo new hello-rust
cd hello-rust
cargo run`,
    pitfalls: [
      "Cargo caches builds; stale errors are often fixed with `cargo clean` only when necessary.",
      "The lockfile matters for applications; keep it committed."
    ],
    prereq: ["install-rust"],
    next: ["hello-world", "modules-and-crates", "unit-testing"],
    tags: ["cargo", "projects", "dependencies"],
    links: [
      {
        label: "Cargo Book",
        href: "https://doc.rust-lang.org/cargo/",
        note: "The full reference."
      },
      {
        label: "Cargo manifest reference",
        href: "https://doc.rust-lang.org/cargo/reference/manifest.html",
        note: "How `Cargo.toml` is structured."
      }
    ]
  },
  {
    slug: "hello-world",
    title: "Hello, world",
    category: "Start here",
    level: "Beginner",
    summary: "Build the smallest Rust program and understand what `fn main` means.",
    description:
      "This is the first runnable program. It teaches the structure of an executable crate, the entry point, and how output is printed.",
    takeaways: [
      "Executables start at `fn main()`.",
      "Macros use `!`, so `println!` is a macro call.",
      "Braces and semicolons matter from the first line."
    ],
    example: `fn main() {
    println!("Hello, world!");
}`,
    pitfalls: [
      "Do not forget the semicolon after `println!`.",
      "Remember that `println!` writes a newline automatically."
    ],
    prereq: ["cargo-basics"],
    next: ["variables-and-mutability", "functions"],
    tags: ["hello-world", "entrypoint", "macro"],
    links: [
      {
        label: "The Rust Book - Hello, world",
        href: "https://doc.rust-lang.org/book/ch01-02-hello-world.html",
        note: "The canonical first program."
      },
      {
        label: "Rust by Example - Hello World",
        href: "https://doc.rust-lang.org/rust-by-example/hello.html",
        note: "A second view of the same concept."
      }
    ]
  },
  {
    slug: "reading-errors",
    title: "Reading compiler errors",
    category: "Start here",
    level: "Beginner",
    summary: "Learn how to turn Rust compiler messages into a debugging workflow.",
    description:
      "Rust errors are dense, but they are also precise. The first skill every learner needs is reading the primary message, the label, and the suggested fix without skipping around.",
    takeaways: [
      "Read the first error first; follow secondary notes after that.",
      "Look for the span label and the suggested change.",
      "Many borrow checker errors explain the exact conflict."
    ],
    example: `error[E0382]: borrow of moved value: \`name\`
  --> src/main.rs:5:13
   |
2  | let name = String::from("Rust");
   |     ---- move occurs because \`name\` has type \`String\`
5  | println!("{}", name);`,
    pitfalls: [
      "Do not fix the last error in the list first if the first one changes the AST shape.",
      "If the compiler suggests a change, try it before guessing."
    ],
    prereq: ["hello-world"],
    next: ["variables-and-mutability", "ownership"],
    tags: ["errors", "debugging", "compiler"],
    links: [
      {
        label: "Rustc error index",
        href: "https://doc.rust-lang.org/error_codes/error-index.html",
        note: "Search specific compiler errors."
      },
      {
        label: "Rust Book - Common Programming Concepts",
        href: "https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html",
        note: "Where many first errors appear."
      }
    ]
  },
  {
    slug: "variables-and-mutability",
    title: "Variables and mutability",
    category: "Language basics",
    level: "Beginner",
    summary: "Understand `let`, shadowing, and when a value can change.",
    description:
      "Rust makes mutability explicit. A variable is immutable unless you say otherwise, and shadowing is a separate idea from mutation.",
    takeaways: [
      "Use `let` for bindings and `let mut` for mutation.",
      "Shadowing creates a new binding with the same name.",
      "Mutability is a design choice, not a default."
    ],
    example: `let name = "Rust";
let mut count = 1;
count += 1;
let name = name.len();`,
    pitfalls: [
      "Shadowing is not the same as changing a value in place.",
      "Use `mut` only when you really need reassignment."
    ],
    prereq: ["hello-world"],
    next: ["data-types", "functions", "control-flow"],
    tags: ["variables", "mutability", "let"],
    links: [
      {
        label: "Rust Book - Variables and Mutability",
        href: "https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html",
        note: "Core syntax and examples."
      }
    ]
  },
  {
    slug: "data-types",
    title: "Data types",
    category: "Language basics",
    level: "Beginner",
    summary: "Work with scalar types, compound types, and type inference.",
    description:
      "Rust prefers knowing the shape of your data early. Scalars are small, compound types combine values, and type annotations help when inference cannot decide.",
    takeaways: [
      "Integers and floats are explicit about width and sign.",
      "Tuples and arrays are fixed shape; vectors are dynamic collections.",
      "Strings are not one type, which matters later."
    ],
    example: `let age: u32 = 32;
let coords: (i32, i32) = (8, 13);
let names = ["a", "b", "c"];`,
    pitfalls: [
      "Integer defaults may surprise you if you mix signed and unsigned values.",
      "Arrays and vectors solve different problems."
    ],
    prereq: ["variables-and-mutability"],
    next: ["type-conversion-and-casting", "functions", "control-flow"],
    tags: ["types", "inference", "arrays"],
    links: [
      {
        label: "Rust Book - Data Types",
        href: "https://doc.rust-lang.org/book/ch03-02-data-types.html",
        note: "Scalars and compound types."
      }
    ]
  },
  {
    slug: "type-conversion-and-casting",
    title: "Type conversion and casting",
    category: "Language basics",
    level: "Beginner",
    summary: "Move between types on purpose with `as`, `From`/`Into`, and `TryFrom`/`TryInto`.",
    description:
      "Rust never converts types silently. `as` does lossy numeric/primitive casts, `From`/`Into` do infallible conversions between richer types, and `TryFrom`/`TryInto` handle conversions that can fail. Knowing which one to reach for is a daily decision.",
    takeaways: [
      "`as` is for primitive casts and can silently truncate.",
      "`From`/`Into` are for conversions that always succeed.",
      "`TryFrom`/`TryInto` return a `Result` for conversions that can fail."
    ],
    example: `let big: i64 = 300;
let small = big as u8; // truncates, no error

let n: i32 = "42".parse().unwrap(); // via FromStr
let coerced: i64 = i64::from(42i32); // via From`,
    pitfalls: [
      "`as` between numeric types can silently truncate or wrap; it never panics.",
      "Prefer `TryFrom`/`TryInto` over `as` when an out-of-range value is a real bug you want to catch."
    ],
    prereq: ["data-types"],
    next: ["formatting-with-format", "functions"],
    tags: ["casting", "from-into", "tryfrom"],
    links: [
      {
        label: "Rust Book - Type Conversions",
        href: "https://doc.rust-lang.org/rust-by-example/types/cast.html",
        note: "`as` casting rules."
      },
      {
        label: "std::convert docs",
        href: "https://doc.rust-lang.org/std/convert/index.html",
        note: "From, Into, TryFrom, TryInto."
      }
    ]
  },
  {
    slug: "formatting-with-format",
    title: "Formatting with format!",
    category: "Language basics",
    level: "Beginner",
    summary: "Build strings and print output with `format!`, `println!`, and format specifiers.",
    description:
      "`println!`, `format!`, and `write!` all share the same formatting language. Knowing `{}` vs `{:?}`, padding, precision, and named arguments removes the need for manual string concatenation almost everywhere.",
    takeaways: [
      "`{}` uses `Display`; `{:?}` (and `{:#?}`) uses `Debug`.",
      "`format!` returns a `String` instead of printing it.",
      "Width, precision, and alignment are controlled inside the braces, e.g. `{value:>8.2}`."
    ],
    example: `let name = "Rust";
let version = 1;
let line = format!("{name} {version:03}");
println!("{line}");
println!("{:#?}", vec![1, 2, 3]);`,
    pitfalls: [
      "`Debug` output is for developers; implement `Display` for user-facing text.",
      "Forgetting `#[derive(Debug)]` on a struct makes `{:?}` fail to compile, not print blank."
    ],
    prereq: ["type-conversion-and-casting"],
    next: ["functions", "derive-traits"],
    tags: ["format", "println", "display"],
    links: [
      {
        label: "std::fmt docs",
        href: "https://doc.rust-lang.org/std/fmt/index.html",
        note: "Full formatting syntax reference."
      }
    ]
  },
  {
    slug: "functions",
    title: "Functions",
    category: "Language basics",
    level: "Beginner",
    summary: "Define functions, pass parameters, and return values with explicit types.",
    description:
      "Functions are plain and direct in Rust. Parameters have types, return values are explicit, and expressions often do the real work.",
    takeaways: [
      "Function signatures show the contract up front.",
      "The last expression can return a value without `return`.",
      "Functions are the default unit of reuse."
    ],
    example: `fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
    pitfalls: [
      "A semicolon turns an expression into a statement and removes the return value.",
      "Parameter types are required."
    ],
    prereq: ["variables-and-mutability"],
    next: ["control-flow", "methods-and-impls"],
    tags: ["functions", "expressions", "parameters"],
    links: [
      {
        label: "Rust Book - Functions",
        href: "https://doc.rust-lang.org/book/ch03-03-how-functions-work.html",
        note: "Basic function syntax."
      }
    ]
  },
  {
    slug: "control-flow",
    title: "Control flow",
    category: "Language basics",
    level: "Beginner",
    summary: "Use `if`, `loop`, `while`, and `for` in Rust’s expression-oriented style.",
    description:
      "Control flow in Rust is familiar but stricter than many languages. Conditions must be booleans, loops are expressive, and `if` can return values.",
    takeaways: [
      "`if` is an expression, not just a statement.",
      "`for` is the usual choice for iterating over a collection.",
      "`loop` is the most general form."
    ],
    example: `let score = 81;
let grade = if score >= 70 { "pass" } else { "retry" };

for item in [1, 2, 3] {
    println!("{item}");
}`,
    pitfalls: [
      "Rust does not treat integers as booleans.",
      "Use `for` instead of indexing a collection manually when possible."
    ],
    prereq: ["data-types"],
    next: ["modules-and-crates", "pattern-matching"],
    tags: ["if", "loop", "for"],
    links: [
      {
        label: "Rust Book - Control Flow",
        href: "https://doc.rust-lang.org/book/ch03-05-control-flow.html",
        note: "Conditionals and loops."
      }
    ]
  },
  {
    slug: "comments-and-documentation",
    title: "Comments and documentation",
    category: "Language basics",
    level: "Beginner",
    summary: "Use regular comments for notes and doc comments for generated API docs.",
    description:
      "Rust separates human notes from documentation comments. Doc comments are part of the API surface and feed `cargo doc`.",
    takeaways: [
      "Use `//` for local notes and `///` for public items.",
      "Doc comments become rendered documentation.",
      "Keep comments near the reason, not the obvious code."
    ],
    example: `/// Returns the active profile name.
pub fn profile_name() -> &'static str {
    "stable"
}`,
    pitfalls: [
      "Do not comment what the code already says.",
      "Prefer doc comments for public APIs and tests for behavior."
    ],
    prereq: ["functions"],
    next: ["modules-and-crates", "docs-and-rustfmt"],
    tags: ["docs", "comments", "api"],
    links: [
      {
        label: "Rust by Example - Documentation",
        href: "https://doc.rust-lang.org/rust-by-example/meta/doc.html",
        note: "How doc comments work."
      }
    ]
  },
  {
    slug: "modules-and-crates",
    title: "Modules and crates",
    category: "Language basics",
    level: "Beginner",
    summary: "Organize code with modules, visibility, and crate boundaries.",
    description:
      "Modules shape the internal organization of a project, while crates are the compilation unit. This is the first page where Rust’s file layout and public API model start to matter.",
    takeaways: [
      "Use modules to group related code.",
      "`pub` decides what crosses the boundary.",
      "A crate can be a binary or a library."
    ],
    example: `mod parser {
    pub fn parse(input: &str) -> usize {
        input.len()
    }
}`,
    pitfalls: [
      "File layout and module layout are related but not identical.",
      "Keep visibility as narrow as possible."
    ],
    prereq: ["cargo-basics", "comments-and-documentation"],
    next: ["visibility-and-privacy", "structs", "workspaces-and-crates"],
    tags: ["modules", "visibility", "crates"],
    links: [
      {
        label: "Rust Book - Modules",
        href: "https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html",
        note: "Module basics."
      }
    ]
  },
  {
    slug: "visibility-and-privacy",
    title: "Visibility and privacy",
    category: "Language basics",
    level: "Beginner",
    summary: "Control what's public with `pub`, `pub(crate)`, and re-exports.",
    description:
      "Everything in Rust is private by default, one level at a time. Deciding what to expose — and at what scope — is how a crate keeps a small, stable public API while its internals stay free to change.",
    takeaways: [
      "Items are private to their module and its children unless marked `pub`.",
      "`pub(crate)` exposes something across your crate but not to downstream users.",
      "`pub use` re-exports an item so callers don't need to know your internal module layout."
    ],
    example: `mod inner {
    pub(crate) fn helper() -> i32 { 42 }
    pub fn public_api() -> i32 { helper() }
}

pub use inner::public_api;`,
    pitfalls: [
      "A struct being `pub` does not make its fields `pub` — each field needs its own visibility.",
      "Over-exposing internals makes later refactors breaking changes for users."
    ],
    prereq: ["modules-and-crates"],
    next: ["structs", "workspaces-and-crates"],
    tags: ["visibility", "pub", "modules"],
    links: [
      {
        label: "Rust Reference - Visibility and Privacy",
        href: "https://doc.rust-lang.org/reference/visibility-and-privacy.html",
        note: "Exact privacy rules."
      }
    ]
  },
  {
    slug: "structs",
    title: "Structs",
    category: "Language basics",
    level: "Beginner",
    summary: "Model named data with structs and build them with struct literals or constructors.",
    description:
      "Structs are the straightforward way to bundle related values into a named type. They work well for records, state, and domain objects.",
    takeaways: [
      "Struct fields are named and typed.",
      "Use `impl` blocks to attach methods.",
      "Structs are a better default than parallel variables."
    ],
    example: `struct User {
    id: u64,
    name: String,
}

let user = User { id: 1, name: String::from("Shaon") };`,
    pitfalls: [
      "Using too many plain tuples makes code hard to read.",
      "Clone only when ownership demands it."
    ],
    prereq: ["visibility-and-privacy"],
    next: ["derive-traits", "methods-and-impls", "traits-basics"],
    tags: ["structs", "data-model", "impl"],
    links: [
      {
        label: "Rust Book - Structs",
        href: "https://doc.rust-lang.org/book/ch05-01-defining-structs.html",
        note: "How to define and instantiate structs."
      }
    ]
  },
  {
    slug: "derive-traits",
    title: "Derivable traits",
    category: "Language basics",
    level: "Beginner",
    summary: "Get `Debug`, `Clone`, `PartialEq`, `Default`, and ordering for free with `#[derive(...)]`.",
    description:
      "Most of the boilerplate traits every struct or enum needs — printing for debugging, cloning, equality, a sensible default, ordering — don't need to be hand-written. `#[derive(...)]` generates a mechanical, field-by-field implementation, and it's the first attribute most Rust code reaches for.",
    takeaways: [
      "`#[derive(Debug)]` enables `{:?}` printing; do it on every type you'll ever inspect.",
      "`Clone` makes an explicit deep copy; `Copy` (only for small stack-only data) makes assignment implicit.",
      "`PartialEq`/`Eq` enable `==`; `PartialOrd`/`Ord` enable `<`, sorting, and `Ord`-based collections."
    ],
    example: `#[derive(Debug, Clone, PartialEq, Default)]
struct Point {
    x: i32,
    y: i32,
}

let a = Point::default();
let b = a.clone();
println!("{a:?} {}", a == b);`,
    pitfalls: [
      "Deriving requires every field to also implement that trait — a field without `Debug` blocks `#[derive(Debug)]` on the whole struct.",
      "`Copy` requires `Clone` and only works when every field is itself `Copy` (no `String`, `Vec`, etc.)."
    ],
    prereq: ["structs"],
    next: ["enums", "operator-overloading"],
    tags: ["derive", "debug", "traits"],
    links: [
      {
        label: "Rust Book - Derivable Traits (Appendix C)",
        href: "https://doc.rust-lang.org/book/appendix-03-derivable-traits.html",
        note: "Every standard derivable trait."
      }
    ]
  },
  {
    slug: "enums",
    title: "Enums",
    category: "Language basics",
    level: "Beginner",
    summary: "Represent one value from a known set, often with data attached to each variant.",
    description:
      "Enums are one of Rust’s strongest features because they model state directly. Variants can carry data, which makes enums the backbone of many domain models.",
    takeaways: [
      "An enum is not just a tag; variants can hold values.",
      "Use enums for state machines and option-like data.",
      "Pattern matching usually follows enum design."
    ],
    example: `enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}`,
    pitfalls: [
      "Do not overuse structs when an enum would make the state clearer.",
      "Match exhaustively so new variants do not become silent bugs."
    ],
    prereq: ["derive-traits"],
    next: ["pattern-matching", "result-and-option"],
    tags: ["enums", "variants", "state"],
    links: [
      {
        label: "Rust Book - Enums",
        href: "https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html",
        note: "Variant-driven data."
      }
    ]
  },
  {
    slug: "pattern-matching",
    title: "Pattern matching",
    category: "Language basics",
    level: "Intermediate",
    summary: "Use `match`, `if let`, and destructuring to handle structured data safely.",
    description:
      "Pattern matching lets you branch on shape, not just on primitive values. It is one of the main ways Rust turns enums into readable code.",
    takeaways: [
      "`match` is exhaustive and checked by the compiler.",
      "`if let` is a compact form for one-pattern cases.",
      "Patterns also work in `let` bindings and function arguments."
    ],
    example: `match message {
    Message::Quit => println!("bye"),
    Message::Write(text) => println!("{text}"),
    Message::Move { x, y } => println!("{x}, {y}"),
}`,
    pitfalls: [
      "Leave no variant unhandled unless you intentionally use `_`.",
      "Use pattern matching when branching on shape, not just on values."
    ],
    prereq: ["enums", "control-flow"],
    next: ["methods-and-impls", "result-and-option"],
    tags: ["match", "destructuring", "if-let"],
    links: [
      {
        label: "Rust Book - Match",
        href: "https://doc.rust-lang.org/book/ch06-02-match.html",
        note: "The core matching story."
      }
    ]
  },
  {
    slug: "methods-and-impls",
    title: "Methods and impl blocks",
    category: "Language basics",
    level: "Intermediate",
    summary: "Attach behavior to a type and use `self`, `&self`, or `&mut self` as needed.",
    description:
      "Methods make a type feel complete. The `impl` block groups construction and behavior together and is where many Rust APIs begin to feel idiomatic.",
    takeaways: [
      "Use `impl` to keep type-specific logic next to the type.",
      "`self` consumes, `&self` borrows, and `&mut self` mutates.",
      "Associated functions are methods without a receiver."
    ],
    example: `impl User {
    fn display_name(&self) -> &str {
        &self.name
    }
}`,
    pitfalls: [
      "Do not reach for globals when the data belongs to a type.",
      "Use the receiver that matches the ownership story."
    ],
    prereq: ["structs", "functions"],
    next: ["traits-basics", "generics"],
    tags: ["methods", "impl", "self"],
    links: [
      {
        label: "Rust Book - Methods",
        href: "https://doc.rust-lang.org/book/ch05-03-method-syntax.html",
        note: "Receiver forms and impl blocks."
      }
    ]
  },
  {
    slug: "ownership",
    title: "Ownership",
    category: "Ownership",
    level: "Intermediate",
    summary: "Learn the rule set that makes Rust memory-safe without a garbage collector.",
    description:
      "Ownership is the central idea in Rust. Each value has a single owner, moves are explicit, and the compiler uses those rules to enforce safety at compile time.",
    takeaways: [
      "Each value has one owner at a time.",
      "When ownership moves, the original binding can no longer be used.",
      "Scope ends are where drops usually happen."
    ],
    example: `let s1 = String::from("hello");
let s2 = s1;
// s1 is no longer valid here`,
    pitfalls: [
      "Do not assume every type behaves like a copied number.",
      "Ownership is about resource management, not just syntax."
    ],
    prereq: ["variables-and-mutability", "data-types"],
    next: ["borrowing", "references-and-dereference", "slices"],
    tags: ["ownership", "move", "memory"],
    links: [
      {
        label: "Rust Book - Ownership",
        href: "https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html",
        note: "The main ownership chapter."
      }
    ]
  },
  {
    slug: "borrowing",
    title: "Borrowing",
    category: "Ownership",
    level: "Intermediate",
    summary: "Pass references instead of moving ownership when you only need access.",
    description:
      "Borrowing lets many functions inspect or temporarily mutate data without taking ownership. It is the practical counterpart to ownership.",
    takeaways: [
      "References let code use data without owning it.",
      "Mutable borrows are exclusive.",
      "Borrowing keeps APIs flexible."
    ],
    example: `fn length(value: &String) -> usize {
    value.len()
}`,
    pitfalls: [
      "You cannot mix an active mutable borrow with other borrows of the same value.",
      "A borrow cannot outlive the data it points at."
    ],
    prereq: ["ownership"],
    next: ["references-and-dereference", "slices", "lifetimes"],
    tags: ["borrowing", "references", "access"],
    links: [
      {
        label: "Rust Book - References and Borrowing",
        href: "https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html",
        note: "Borrowing rules."
      }
    ]
  },
  {
    slug: "references-and-dereference",
    title: "References and dereference",
    category: "Ownership",
    level: "Intermediate",
    summary: "Use `&`, `&mut`, and `*` to work with borrowed data and pointer-like values.",
    description:
      "References are values that point to other data. Dereferencing reaches through the reference, and Rust’s coercions remove a lot of boilerplate when used well.",
    takeaways: [
      "Use `&` to borrow a value.",
      "Use `*` when you need the underlying value.",
      "The compiler often inserts deref coercions automatically."
    ],
    example: `let value = String::from("atlas");
let len = value.as_str().len();
let first = &value[..1];`,
    pitfalls: [
      "Do not manually dereference unless the type requires it.",
      "Remember that many API methods already borrow for you."
    ],
    prereq: ["borrowing"],
    next: ["slices", "lifetimes", "smart-pointers"],
    tags: ["dereference", "refs", "borrows"],
    links: [
      {
        label: "Rust by Example - Deref",
        href: "https://doc.rust-lang.org/rust-by-example/flow_control/match/destructuring/destructure_references.html",
        note: "Reference patterns and deref thinking."
      }
    ]
  },
  {
    slug: "slices",
    title: "Slices",
    category: "Ownership",
    level: "Intermediate",
    summary: "Work with views into arrays and strings without taking ownership.",
    description:
      "Slices are borrowed views into a sequence. They are a standard Rust pattern for APIs that need part of a collection instead of the whole thing.",
    takeaways: [
      "Slices do not own their data.",
      "String slices and array slices are both common.",
      "Use slices for search, parsing, and windowing."
    ],
    example: `let text = String::from("rust");
let slice = &text[0..2];`,
    pitfalls: [
      "String indexing is not byte-indexing in a naive way.",
      "A slice cannot survive the value it borrows from."
    ],
    prereq: ["borrowing"],
    next: ["lifetimes", "vectors"],
    tags: ["slices", "str", "borrowed-view"],
    links: [
      {
        label: "Rust Book - Slices",
        href: "https://doc.rust-lang.org/book/ch04-03-slices.html",
        note: "Borrowing part of a value."
      }
    ]
  },
  {
    slug: "lifetimes",
    title: "Lifetimes",
    category: "Ownership",
    level: "Intermediate",
    summary: "Explain how long references remain valid so the compiler can prove safety.",
    description:
      "Lifetimes describe reference validity. Most of the time Rust infers them, but when they matter you need to understand what is being related to what.",
    takeaways: [
      "Lifetimes track relationships between references.",
      "The compiler usually infers them.",
      "Lifetime annotations express constraints, not memory allocation."
    ],
    example: `fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() > right.len() { left } else { right }
}`,
    pitfalls: [
      "A lifetime annotation does not make data live longer.",
      "It only tells the compiler how reference validity is connected."
    ],
    prereq: ["borrowing", "references-and-dereference"],
    next: ["lifetime-elision-and-static", "traits-basics"],
    tags: ["lifetimes", "references", "annotations"],
    links: [
      {
        label: "Rust Book - Validating References with Lifetimes",
        href: "https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html",
        note: "Where lifetime syntax is introduced."
      }
    ]
  },
  {
    slug: "lifetime-elision-and-static",
    title: "Lifetime elision and 'static",
    category: "Ownership",
    level: "Advanced",
    summary: "Know when the compiler infers lifetimes for you, and what `'static` really means.",
    description:
      "Most functions never write a lifetime annotation because three elision rules cover the common shapes automatically. This page covers those rules, structs that hold references, and the much-misunderstood `'static` bound — which means \"can live for the whole program,\" not \"is a global.\"",
    takeaways: [
      "The elision rules: each elided input gets its own lifetime; if there's exactly one input lifetime, it's assigned to all elided outputs; if one input is `&self`/`&mut self`, its lifetime is assigned to elided outputs.",
      "A struct holding a reference needs a lifetime parameter that ties the struct's validity to the data it borrows.",
      "`'static` means the reference (or bound) can live for the entire program — string literals are `'static`, but a `'static` bound on a generic just means \"contains no non-'static borrows,\" not \"is global.\""
    ],
    example: `struct Excerpt<'a> {
    text: &'a str,
}

fn first_word(s: &str) -> &str { // elided: output borrows from the one input
    s.split_whitespace().next().unwrap_or("")
}`,
    pitfalls: [
      "`'static` on a trait bound (`T: 'static`) does not mean the value lives forever — it means it owns its data or only borrows `'static` data.",
      "Reaching for `'static` to silence a lifetime error usually just moves the bug; prefer fixing ownership first."
    ],
    prereq: ["lifetimes"],
    next: ["smart-pointers", "traits-basics"],
    tags: ["lifetimes", "elision", "static"],
    links: [
      {
        label: "Rust Reference - Lifetime elision",
        href: "https://doc.rust-lang.org/reference/lifetime-elision.html",
        note: "The exact elision rules."
      }
    ]
  },
  {
    slug: "traits-basics",
    title: "Traits",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Define shared behavior and use it to build reusable, polymorphic APIs.",
    description:
      "Traits are Rust’s behavior contracts. They let many types share the same interface and power both static and dynamic polymorphism.",
    takeaways: [
      "Traits describe what a type can do.",
      "Trait bounds shape generic APIs.",
      "Implement traits for your own types when it makes the API clearer."
    ],
    example: `trait Render {
    fn render(&self) -> String;
}`,
    pitfalls: [
      "Do not force inheritance thinking onto traits.",
      "Prefer the simplest bound that says what you need."
    ],
    prereq: ["methods-and-impls"],
    next: ["trait-objects-and-dyn", "generics"],
    tags: ["traits", "behavior", "polymorphism"],
    links: [
      {
        label: "Rust Book - Traits",
        href: "https://doc.rust-lang.org/book/ch10-02-traits.html",
        note: "Trait definitions and bounds."
      }
    ]
  },
  {
    slug: "trait-objects-and-dyn",
    title: "Trait objects and dyn",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Choose between static dispatch (generics), dynamic dispatch (`dyn Trait`), and `impl Trait`.",
    description:
      "A generic function is monomorphized into one copy per concrete type — fast, but it can't hold a mixed collection of types behind one interface. `Box<dyn Trait>` (or `&dyn Trait`) trades a small runtime cost (a vtable lookup) for that flexibility. `impl Trait` is a third option for \"some concrete type I don't want to name.\"",
    takeaways: [
      "`dyn Trait` is dynamically sized — it's almost always used behind `Box<dyn Trait>`, `&dyn Trait`, or `Rc<dyn Trait>`.",
      "Use `dyn Trait` when you need a `Vec<Box<dyn Trait>>` of mixed concrete types; use generics when you don't.",
      "`impl Trait` in return position means \"some fixed type implementing this trait\" — resolved at compile time, no vtable."
    ],
    example: `trait Shape {
    fn area(&self) -> f64;
}

struct Circle { r: f64 }
impl Shape for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r }
}

let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle { r: 2.0 })];
for s in &shapes {
    println!("{}", s.area());
}`,
    pitfalls: [
      "Not every trait can become a trait object — generic methods and `Self`-returning methods break \"object safety.\"",
      "`dyn Trait` alone isn't a concrete type; it must be behind a pointer (`&`, `Box`, `Rc`, ...)."
    ],
    prereq: ["traits-basics"],
    next: ["generics", "smart-pointers"],
    tags: ["dyn", "trait-objects", "dispatch"],
    links: [
      {
        label: "Rust Book - Trait Objects",
        href: "https://doc.rust-lang.org/book/ch18-02-trait-objects.html",
        note: "When and how to use dyn Trait."
      }
    ]
  },
  {
    slug: "generics",
    title: "Generics",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Write code that works for many types while staying statically checked.",
    description:
      "Generics let one implementation serve many concrete types. They pair naturally with traits and are a big part of Rust’s zero-cost abstraction story.",
    takeaways: [
      "Generics reduce duplication without giving up type safety.",
      "Trait bounds narrow what a generic function can do.",
      "Use explicit types when inference cannot keep up."
    ],
    example: `fn first<T: Clone>(items: &[T]) -> Option<T> {
    items.first().cloned()
}`,
    pitfalls: [
      "Do not introduce generics unless they make the API simpler for callers.",
      "Type parameters should describe real variability."
    ],
    prereq: ["trait-objects-and-dyn"],
    next: ["vectors", "iterator-basics", "smart-pointers"],
    tags: ["generics", "type-parameters", "bounds"],
    links: [
      {
        label: "Rust Book - Generics",
        href: "https://doc.rust-lang.org/book/ch10-01-syntax.html",
        note: "The basics of generic syntax."
      }
    ]
  },
  {
    slug: "vectors",
    title: "Vectors",
    category: "Abstractions",
    level: "Beginner",
    summary: "Use `Vec<T>`, Rust's growable array, for the majority of everyday collection work.",
    description:
      "`Vec<T>` is the collection you reach for by default: contiguous, heap-allocated, growable. This page covers building one, pushing/popping, indexing safely with `.get`, iterating, sorting, and the common mutation methods (`retain`, `dedup`, `drain`).",
    takeaways: [
      "`vec![...]` and `Vec::new()` are the two ways to start one.",
      "Indexing with `v[i]` panics out of bounds; `v.get(i)` returns `Option<&T>` instead.",
      "`sort`, `retain`, and `dedup` cover most in-place cleanup you'll need."
    ],
    example: `let mut items = vec![3, 1, 2];
items.push(4);
items.sort();
items.retain(|&n| n != 1);
println!("{items:?}"); // [2, 3, 4]`,
    pitfalls: [
      "Repeated `push` in a hot loop without `Vec::with_capacity` causes avoidable reallocations.",
      "Indexing out of bounds panics — use `.get()` when the index isn't already known to be valid."
    ],
    prereq: ["generics"],
    next: ["hashmaps-and-hashsets", "iterator-basics"],
    tags: ["vec", "collections", "growable"],
    links: [
      {
        label: "std::vec::Vec docs",
        href: "https://doc.rust-lang.org/std/vec/struct.Vec.html",
        note: "Full Vec API."
      }
    ]
  },
  {
    slug: "hashmaps-and-hashsets",
    title: "HashMaps and HashSets",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Index data by key with `HashMap<K, V>` and track uniqueness with `HashSet<T>`.",
    description:
      "`HashMap` is the daily tool for \"look this up by key\" data — counting, caching, grouping. `HashSet` is a `HashMap<T, ()>` in spirit: membership without values. The entry API is the idiomatic way to insert-or-update without a double lookup.",
    takeaways: [
      "`map.entry(key).or_insert(default)` is the standard insert-or-update pattern.",
      "Keys need `Eq + Hash`; `#[derive(PartialEq, Eq, Hash)]` gets a struct there.",
      "Iteration order is unspecified — use `BTreeMap` when you need sorted order."
    ],
    example: `use std::collections::HashMap;

let mut counts: HashMap<&str, i32> = HashMap::new();
for word in ["a", "b", "a"] {
    *counts.entry(word).or_insert(0) += 1;
}
println!("{counts:?}");`,
    pitfalls: [
      "Don't rely on iteration order — it can even change between runs of the same program.",
      "A missing `Hash`/`Eq` derive on a custom key type is a compile error, not a runtime surprise — fix it at the type."
    ],
    prereq: ["vectors"],
    next: ["other-collections", "iterator-basics"],
    tags: ["hashmap", "hashset", "entry-api"],
    links: [
      {
        label: "std::collections::HashMap docs",
        href: "https://doc.rust-lang.org/std/collections/struct.HashMap.html",
        note: "Entry API and full method list."
      }
    ]
  },
  {
    slug: "other-collections",
    title: "BTreeMap, VecDeque, and BinaryHeap",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Pick the right collection by access pattern: sorted keys, a double-ended queue, or a priority queue.",
    description:
      "Beyond `Vec` and `HashMap`, the standard library has a handful of collections for specific access patterns: `BTreeMap`/`BTreeSet` for keys in sorted order, `VecDeque` for a ring buffer with cheap push/pop at both ends, and `BinaryHeap` for always-get-the-max priority queues.",
    takeaways: [
      "`BTreeMap` keeps keys sorted and costs O(log n) instead of HashMap's amortized O(1) — pick it when you need range queries or ordered iteration.",
      "`VecDeque` gives O(1) push/pop at both the front and back, unlike `Vec` which is O(n) at the front.",
      "`BinaryHeap` always pops the largest element first; wrap items in `Reverse` for a min-heap."
    ],
    example: `use std::collections::{VecDeque, BinaryHeap};

let mut queue: VecDeque<i32> = VecDeque::new();
queue.push_back(1);
queue.push_front(0);

let mut heap = BinaryHeap::from([3, 1, 4, 1, 5]);
println!("{:?}", heap.pop()); // Some(5)`,
    pitfalls: [
      "Don't default to `VecDeque` for everything — plain `Vec` is faster when you only ever push/pop the back.",
      "`BinaryHeap` iteration order is arbitrary; only `.pop()` guarantees max-first."
    ],
    prereq: ["hashmaps-and-hashsets"],
    next: ["strings-and-str"],
    tags: ["btreemap", "vecdeque", "binaryheap"],
    links: [
      {
        label: "std::collections module docs",
        href: "https://doc.rust-lang.org/std/collections/index.html",
        note: "A comparison table of every std collection."
      }
    ]
  },
  {
    slug: "strings-and-str",
    title: "Strings and `str`",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Understand the difference between owned strings and borrowed string slices.",
    description:
      "String handling is a common source of confusion, mostly because Rust distinguishes owned text from borrowed text. That split is a feature, not a nuisance.",
    takeaways: [
      "`String` owns and can grow.",
      "`str` is a borrowed string slice.",
      "Text APIs usually accept `&str` for flexibility."
    ],
    example: `let owned = String::from("atlas");
let borrowed: &str = &owned;`,
    pitfalls: [
      "String length is byte length, not user-perceived character count.",
      "Do not assume `String` and `&str` are interchangeable without borrowing."
    ],
    prereq: ["other-collections", "borrowing"],
    next: ["iterator-basics", "file-io"],
    tags: ["string", "str", "text"],
    links: [
      {
        label: "Rust Book - Storing UTF-8 Encoded Text with Strings",
        href: "https://doc.rust-lang.org/book/ch08-02-strings.html",
        note: "How Rust treats text."
      }
    ]
  },
  {
    slug: "iterator-basics",
    title: "Iterator basics",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Understand the `Iterator` trait and the difference between `iter`, `iter_mut`, and `into_iter`.",
    description:
      "Every `for` loop desugars to a call to `.into_iter()` and repeated `.next()` calls. Knowing what each of the three iteration methods borrows (or doesn't) is the first thing that unblocks most iterator-related borrow-checker errors.",
    takeaways: [
      "`.iter()` yields `&T` (borrowed), `.iter_mut()` yields `&mut T`, `.into_iter()` yields `T` (owned, consumes the collection).",
      "`for x in &v` is sugar for `.iter()`; `for x in v` is sugar for `.into_iter()`.",
      "An iterator does nothing until something pulls values from it with `.next()` (directly, or via a `for` loop or a consumer like `.collect()`)."
    ],
    example: `let items = vec![1, 2, 3];

for x in &items {      // borrows: items still usable after
    println!("{x}");
}

for x in items {       // owns: items is moved and gone after this
    println!("{x}");
}`,
    pitfalls: [
      "Using `for x in items` when you still need `items` afterward moves it out from under you.",
      "An unconsumed iterator does nothing — `items.iter().map(...)` alone runs no code without `.collect()`, a `for` loop, or another consumer."
    ],
    prereq: ["strings-and-str"],
    next: ["iterator-adaptors", "closures"],
    tags: ["iterators", "iter", "into-iter"],
    links: [
      {
        label: "Rust Book - Processing a Series of Items with Iterators",
        href: "https://doc.rust-lang.org/book/ch13-02-iterators.html",
        note: "Iterator fundamentals."
      }
    ]
  },
  {
    slug: "iterator-adaptors",
    title: "Iterator adaptors",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Chain lazy transformations with `map`, `filter`, `fold`, `zip`, `enumerate`, and `collect`.",
    description:
      "Adaptors like `map` and `filter` build up a lazy pipeline that does no work until a consumer (`collect`, `sum`, `for_each`, a `for` loop) pulls values through it. This is the idiomatic replacement for most manual index-based loops.",
    takeaways: [
      "Adaptors (`map`, `filter`, `zip`, `enumerate`, `take`, `skip`, ...) are lazy — chain as many as you like before paying any cost.",
      "Consumers (`collect`, `sum`, `count`, `fold`, `for_each`) are what actually run the pipeline.",
      "`collect()` needs a target type — either a type annotation or the turbofish, `::<Vec<_>>()`."
    ],
    example: `let evens_squared: Vec<i32> = (1..10)
    .filter(|n| n % 2 == 0)
    .map(|n| n * n)
    .collect();
println!("{evens_squared:?}"); // [4, 16, 36, 64]`,
    pitfalls: [
      "A long adaptor chain with no consumer at the end silently does nothing — the compiler warns \"unused `Map` that must be used.\"",
      "Chaining more than ~4-5 adaptors often reads worse than a plain `for` loop with a comment — clarity beats cleverness."
    ],
    prereq: ["iterator-basics"],
    next: ["closures", "result-and-option"],
    tags: ["iterators", "map", "collect"],
    links: [
      {
        label: "std::iter::Iterator docs",
        href: "https://doc.rust-lang.org/std/iter/trait.Iterator.html",
        note: "The full list of adaptor and consumer methods."
      }
    ]
  },
  {
    slug: "closures",
    title: "Closures",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Create small callable values that capture their environment.",
    description:
      "Closures are lightweight, local pieces of behavior. They make iterator chains, callbacks, and short transformations more readable. Rust infers which of `Fn`, `FnMut`, or `FnOnce` a closure implements from how it uses its captures.",
    takeaways: [
      "Closures can capture by borrow, mutable borrow, or move.",
      "`Fn` can be called repeatedly and only borrows; `FnMut` can mutate captures; `FnOnce` consumes its captures and runs once.",
      "`move` forces capture by value — required when the closure outlives the current scope, e.g. moving into a thread."
    ],
    example: `let threshold = 10;
let is_big = |value: i32| value > threshold; // Fn, borrows threshold

let mut total = 0;
let mut add = |n: i32| total += n;           // FnMut, mutates a capture
add(5);`,
    pitfalls: [
      "Keep closures small; named functions are clearer for complex logic.",
      "A closure returned from a function usually needs `move` — otherwise it borrows locals that are about to go out of scope."
    ],
    prereq: ["iterator-adaptors"],
    next: ["result-and-option", "threads-and-spawn"],
    tags: ["closures", "capture", "callback"],
    links: [
      {
        label: "Rust Book - Closures",
        href: "https://doc.rust-lang.org/book/ch13-01-closures.html",
        note: "How closures capture state."
      }
    ]
  },
  {
    slug: "result-and-option",
    title: "Option and Result",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Model absence with `Option` and failure with `Result`, and chain them with combinators instead of nested `match`.",
    description:
      "`Option<T>` and `Result<T, E>` are how Rust makes \"might not have a value\" and \"might fail\" part of the type, forcing the compiler to check both branches. Beyond `match`, both types have a rich set of combinators — `map`, `and_then`, `unwrap_or`, `ok_or` — that chain transformations without unwrapping early.",
    takeaways: [
      "`Option<T>` = `Some(v)` or `None` — a value might be missing (Rust's safe replacement for null).",
      "`Result<T, E>` = `Ok(v)` or `Err(e)` — an operation might fail with a reason.",
      "`.map()` transforms the success case, `.and_then()` chains another fallible step, `.unwrap_or(default)` supplies a fallback, `.ok_or(err)` turns an `Option` into a `Result`."
    ],
    example: `fn parse_positive(text: &str) -> Option<i32> {
    text.parse::<i32>().ok().filter(|&n| n > 0)
}

let doubled = parse_positive("21").map(|n| n * 2).unwrap_or(0);
println!("{doubled}"); // 42`,
    pitfalls: [
      "`unwrap()` in real code crashes the whole program on the first `None`/`Err` — fine for tests, risky for anything a user runs.",
      "Confusing `Option` (nothing to explain) with `Result` (a reason it failed) leads to awkward conversions later — pick based on whether there's an error to report."
    ],
    prereq: ["closures"],
    next: ["the-question-mark-operator", "custom-error-types"],
    tags: ["result", "option", "combinators"],
    links: [
      {
        label: "Rust Book - Error Handling",
        href: "https://doc.rust-lang.org/book/ch09-00-error-handling.html",
        note: "Option, Result, and `?`."
      }
    ]
  },
  {
    slug: "the-question-mark-operator",
    title: "The ? operator",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Propagate `Result`/`Option` failures without writing a `match` at every fallible step.",
    description:
      "The `?` operator unpacks an `Ok`/`Some` and hands you the value, or — on `Err`/`None` — returns immediately from the enclosing function with that error (converting it via `From` if needed). It only works inside a function that itself returns `Result` or `Option`, which now includes `fn main`.",
    takeaways: [
      "`expr?` means: on success, give me the inner value; on failure, return early from this function with the error.",
      "`?` calls `From::from` on the error, so a function can return one error type while `?`-ing through several different underlying error types.",
      "`fn main() -> Result<(), E>` lets you use `?` directly in `main`."
    ],
    example: `use std::num::ParseIntError;

fn double_from_text(text: &str) -> Result<i32, ParseIntError> {
    let n = text.parse::<i32>()?; // returns Err early, or unwraps Ok
    Ok(n * 2)
}

fn main() -> Result<(), ParseIntError> {
    println!("{}", double_from_text("10")?);
    Ok(())
}`,
    pitfalls: [
      "Using `?` in a function that doesn't return `Result`/`Option` is a compile error — change the return type or handle the error with `match` instead.",
      "The happy path still needs an explicit `Ok(value)` — `?` only handles the early-return side, not the final return."
    ],
    prereq: ["result-and-option"],
    next: ["custom-error-types", "error-crates-thiserror-and-anyhow"],
    tags: ["question-mark", "error-propagation", "result"],
    links: [
      {
        label: "Rust Book - Propagating Errors",
        href: "https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html",
        note: "Where the ? operator is introduced."
      }
    ]
  },
  {
    slug: "custom-error-types",
    title: "Custom error types",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Design an error enum that implements `std::error::Error` so `?` can convert into it automatically.",
    description:
      "A real function usually has more than one way to fail. The idiomatic pattern is an enum with one variant per failure mode, implementing `Display` (for a human message) and `std::error::Error`, plus a `From<SourceError>` impl per underlying error type so `?` converts automatically.",
    takeaways: [
      "One enum variant per distinct failure mode keeps the caller's `match` meaningful.",
      "Implement `Display` + `std::error::Error`; `impl From<X> for MyError` for each source error lets `?` auto-convert.",
      "The `source()` method on `Error` lets callers walk the underlying cause chain."
    ],
    example: `use std::fmt;

#[derive(Debug)]
enum ConfigError {
    Missing(String),
    Invalid(std::num::ParseIntError),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ConfigError::Missing(key) => write!(f, "missing key: {key}"),
            ConfigError::Invalid(e) => write!(f, "invalid value: {e}"),
        }
    }
}
impl std::error::Error for ConfigError {}
impl From<std::num::ParseIntError> for ConfigError {
    fn from(e: std::num::ParseIntError) -> Self { ConfigError::Invalid(e) }
}`,
    pitfalls: [
      "Forgetting `impl std::error::Error` means your type won't compose with other error-handling code that expects `Box<dyn Error>`.",
      "Writing this by hand for every project is exactly what `thiserror` automates — see the next page before hand-rolling a large error enum."
    ],
    prereq: ["the-question-mark-operator"],
    next: ["error-crates-thiserror-and-anyhow", "builder-pattern"],
    tags: ["errors", "std-error-error", "from"],
    links: [
      {
        label: "std::error::Error docs",
        href: "https://doc.rust-lang.org/std/error/trait.Error.html",
        note: "The trait every error type should implement."
      }
    ]
  },
  {
    slug: "error-crates-thiserror-and-anyhow",
    title: "thiserror and anyhow",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Use `thiserror` to derive library error enums and `anyhow` for quick, context-rich application errors.",
    description:
      "Hand-writing `Display` and `From` impls for every error enum is repetitive enough that almost every real Rust project pulls in one of two crates: `thiserror` derives all that boilerplate for a library's precise error enum, while `anyhow::Error` is a single catch-all error type for applications that just want to propagate any error upward with added context.",
    takeaways: [
      "`thiserror`: `#[derive(Error)]` plus `#[error(\"...\")]` per variant generates `Display` and `std::error::Error` for you.",
      "`anyhow::Result<T>` = `Result<T, anyhow::Error>` — any error type converts into it via `?`, so it's the fast default for `main` and application code.",
      "Rule of thumb: `thiserror` for libraries (callers need to match on specific variants), `anyhow` for binaries/applications (callers just want to log or exit)."
    ],
    example: `// library crate
#[derive(thiserror::Error, Debug)]
enum ConfigError {
    #[error("missing key: {0}")]
    Missing(String),
    #[error("invalid value")]
    Invalid(#[from] std::num::ParseIntError),
}

// application crate
fn run() -> anyhow::Result<()> {
    let n: i32 = "42".parse()?;
    anyhow::ensure!(n > 0, "expected a positive number");
    Ok(())
}`,
    pitfalls: [
      "Using `anyhow` in a library's public API forces every downstream caller into `anyhow` too — keep it at the application boundary.",
      "`anyhow::Error` erases the concrete type, so callers can't `match` on it — only use it where callers just propagate or log."
    ],
    prereq: ["custom-error-types"],
    next: ["builder-pattern", "logging-and-tracing"],
    tags: ["thiserror", "anyhow", "errors"],
    links: [
      {
        label: "thiserror docs",
        href: "https://docs.rs/thiserror/",
        note: "Derive macro for error enums."
      },
      {
        label: "anyhow docs",
        href: "https://docs.rs/anyhow/",
        note: "Catch-all error type for applications."
      }
    ]
  },
  {
    slug: "builder-pattern",
    title: "The builder pattern",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Construct complex values step by step when a struct has many optional fields.",
    description:
      "Rust has no constructor overloading and no named/optional function arguments, so a struct with many optional fields quickly makes a plain constructor unreadable. The builder pattern — a separate type with chainable setter methods and a final `.build()` — is the idiomatic answer, and it's everywhere in the ecosystem (`reqwest::Client::builder()`, `std::process::Command`).",
    takeaways: [
      "Each setter takes `mut self` (or `&mut self`) and returns `Self`, so calls chain: `Builder::new().name(\"x\").port(8080).build()`.",
      "`.build()` is where required-field validation happens, often returning a `Result`.",
      "Prefer `Default` + struct-update syntax (`..Default::default()`) for simpler cases before reaching for a full builder."
    ],
    example: `#[derive(Default)]
struct RequestBuilder {
    url: String,
    timeout_ms: u32,
}

impl RequestBuilder {
    fn url(mut self, url: &str) -> Self { self.url = url.into(); self }
    fn timeout_ms(mut self, ms: u32) -> Self { self.timeout_ms = ms; self }
}

let req = RequestBuilder::default().url("https://example.com").timeout_ms(500);`,
    pitfalls: [
      "A builder for a struct with only two or three fields is usually overkill — a plain constructor or `Default` + struct update is clearer.",
      "Forgetting to return `Self` from a setter breaks the chain with a confusing type error at the next `.method()` call."
    ],
    prereq: ["error-crates-thiserror-and-anyhow"],
    next: ["newtype-pattern", "operator-overloading"],
    tags: ["builder-pattern", "api-design", "structs"],
    links: [
      {
        label: "Rust API Guidelines - Builders",
        href: "https://rust-lang.github.io/api-guidelines/type-safety.html#builders-enable-construction-of-complex-values-c-builder",
        note: "When and how to use a builder."
      }
    ]
  },
  {
    slug: "newtype-pattern",
    title: "The newtype pattern",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Wrap an existing type in a single-field tuple struct to get a new, distinct type for free.",
    description:
      "`struct Meters(f64);` creates a type that's distinct from `f64` at compile time, at zero runtime cost. It's how Rust gets type-safe units, prevents mixing up two `String`-based IDs, and works around the orphan rule (implementing a foreign trait for a foreign type by wrapping it first).",
    takeaways: [
      "A newtype prevents accidentally passing a `UserId` where an `OrderId` is expected, even though both are `String` underneath.",
      "The orphan rule blocks `impl ForeignTrait for ForeignType` — wrapping `ForeignType` in a newtype you own sidesteps it.",
      "Access the inner value with `.0`, or implement `Deref`/`From` to make the wrapper more ergonomic to use."
    ],
    example: `struct UserId(u64);
struct OrderId(u64);

fn charge(user: UserId, order: OrderId) { /* ... */ }

// charge(OrderId(1), UserId(2)); // compile error: wrong types, caught immediately
charge(UserId(2), OrderId(1));`,
    pitfalls: [
      "Overusing newtypes for every primitive adds `.0` noise everywhere — reach for one when mixing values up would be a real bug, not by default.",
      "A newtype doesn't inherit the inner type's methods automatically — you need `Deref` or explicit forwarding methods."
    ],
    prereq: ["builder-pattern"],
    next: ["operator-overloading", "generics"],
    tags: ["newtype", "type-safety", "tuple-struct"],
    links: [
      {
        label: "Rust Book - Using the Newtype Pattern",
        href: "https://doc.rust-lang.org/book/ch20-02-advanced-traits.html#using-the-newtype-pattern-to-implement-external-traits-on-external-types",
        note: "Newtype and the orphan rule."
      }
    ]
  },
  {
    slug: "operator-overloading",
    title: "Operator overloading",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Implement `std::ops` traits like `Add` and `Index` so your types work with `+`, `[]`, and friends.",
    description:
      "Operators in Rust are just trait methods — `a + b` desugars to `Add::add(a, b)`. Implementing the matching trait from `std::ops` (`Add`, `Sub`, `Mul`, `Index`, `Neg`, ...) lets your own types use familiar operator syntax instead of named methods.",
    takeaways: [
      "`impl Add for Point { type Output = Point; fn add(self, rhs: Point) -> Point { ... } }` enables `p1 + p2`.",
      "`Index`/`IndexMut` enable `container[key]` syntax for your own collection-like types.",
      "Only implement an operator when its meaning is unambiguous — don't overload `+` for something that isn't really addition."
    ],
    example: `use std::ops::Add;

#[derive(Clone, Copy, Debug)]
struct Point { x: i32, y: i32 }

impl Add for Point {
    type Output = Point;
    fn add(self, rhs: Point) -> Point {
        Point { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

let p = Point { x: 1, y: 2 } + Point { x: 3, y: 4 };`,
    pitfalls: [
      "Operator overloading that surprises the reader (e.g. `+` that mutates or has side effects) is worse than a named method — keep semantics obvious.",
      "Most `std::ops` traits consume `self` by value — implement them for `Copy` types, or explicitly handle ownership for non-`Copy` ones."
    ],
    prereq: ["newtype-pattern"],
    next: ["unit-testing"],
    tags: ["operator-overloading", "std-ops", "traits"],
    links: [
      {
        label: "std::ops module docs",
        href: "https://doc.rust-lang.org/std/ops/index.html",
        note: "Every overloadable operator trait."
      }
    ]
  },
  {
    slug: "unit-testing",
    title: "Unit testing",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Write `#[test]` functions next to the code they test with Cargo's built-in test runner.",
    description:
      "Rust testing lives close to the code: a `#[cfg(test)] mod tests` block at the bottom of the same file, using the `assert!` family of macros. `cargo test` finds and runs every `#[test]` function in the crate.",
    takeaways: [
      "`#[test]` marks a function as a test; `cargo test` discovers and runs all of them.",
      "`assert!`, `assert_eq!`, and `assert_ne!` panic (failing the test) with a readable diff on mismatch.",
      "`#[cfg(test)]` on the containing module means test-only code doesn't ship in the release binary."
    ],
    example: `fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_numbers() {
        assert_eq!(add(2, 2), 4);
    }

    #[test]
    #[should_panic]
    fn divide_by_zero_panics() {
        let _ = 1 / (1 - 1);
    }
}`,
    pitfalls: [
      "A test should explain intent, not just cover lines — one focused assertion per test reads better than five unrelated ones.",
      "`cargo test` runs tests in parallel by default; tests that share mutable global state (files, env vars) can flake."
    ],
    prereq: ["cargo-basics", "functions"],
    next: ["integration-testing", "doc-tests-and-benchmarks"],
    tags: ["tests", "cargo", "assert"],
    links: [
      {
        label: "Rust Book - Writing Automated Tests",
        href: "https://doc.rust-lang.org/book/ch11-00-testing.html",
        note: "Unit and integration testing."
      }
    ]
  },
  {
    slug: "integration-testing",
    title: "Integration testing",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Test your crate's public API from the outside using the `tests/` directory.",
    description:
      "Each file directly under `tests/` is compiled as its own separate crate that depends on your library through its public API only — the same way a real consumer would. This catches things unit tests inside the crate can't: whether your `pub` surface actually works end to end.",
    takeaways: [
      "Each `tests/*.rs` file is its own crate; use `use my_crate::...;` exactly as an external user would.",
      "Integration tests only see `pub` items — they can't reach into private internals the way `#[cfg(test)]` unit tests can.",
      "A `tests/common/mod.rs` (not `tests/common.rs`) is the idiomatic way to share setup helpers without it being treated as its own test file."
    ],
    example: `// tests/api.rs
use my_crate::add;

#[test]
fn public_add_works() {
    assert_eq!(add(2, 2), 4);
}`,
    pitfalls: [
      "Integration tests only apply to library crates (they need something to import) — a pure binary crate has nothing to `use`.",
      "Each file in `tests/` recompiles the whole crate separately, so a large integration suite can noticeably slow `cargo test`."
    ],
    prereq: ["unit-testing"],
    next: ["doc-tests-and-benchmarks"],
    tags: ["tests", "integration", "public-api"],
    links: [
      {
        label: "Rust Book - Test Organization",
        href: "https://doc.rust-lang.org/book/ch11-03-test-organization.html",
        note: "Unit vs integration test layout."
      }
    ]
  },
  {
    slug: "doc-tests-and-benchmarks",
    title: "Doc tests and benchmarks",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Keep documentation examples honest with doc-tests, and measure performance with Criterion.",
    description:
      "A code block inside a `///` doc comment is compiled and run by `cargo test` — so your README-style usage examples can never silently rot out of date. For performance, `std::time::Instant` gives rough manual timing, but the `criterion` crate is the standard for statistically sound micro-benchmarks (stable Rust doesn't have built-in `cargo bench`).",
    takeaways: [
      "A ` ```rust ` block inside `///` is compiled and executed as a test — a wrong example fails `cargo test`, not just looks stale.",
      "Prefix a doc-test line with `# ` to include setup code that's compiled but hidden from the rendered docs.",
      "`criterion` runs each benchmark many times and reports statistically meaningful results, unlike a single `Instant::now()` timing."
    ],
    example: `/// Adds two numbers.
///
/// \`\`\`
/// assert_eq!(my_crate::add(2, 2), 4);
/// \`\`\`
pub fn add(a: i32, b: i32) -> i32 { a + b }`,
    pitfalls: [
      "Doc-tests run as their own mini-crate, so they can't see private items — same restriction as integration tests.",
      "A single `Instant::now()`/`elapsed()` measurement is noisy; don't trust it for anything beyond a rough sanity check."
    ],
    prereq: ["integration-testing"],
    next: ["file-io"],
    tags: ["doctest", "benchmarking", "criterion"],
    links: [
      {
        label: "rustdoc book - Documentation tests",
        href: "https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html",
        note: "How doc-tests are collected and run."
      },
      {
        label: "Criterion.rs docs",
        href: "https://docs.rs/criterion/",
        note: "The standard benchmarking crate."
      }
    ]
  },
  {
    slug: "file-io",
    title: "File I/O",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Read and write files with `std::fs` and treat failures as part of the design.",
    description:
      "File I/O is where ownership, error handling, and system APIs meet. The standard library keeps the APIs direct and predictable.",
    takeaways: [
      "Most file operations return `Result`.",
      "Use `read_to_string` for simple text cases.",
      "Buffering matters when data is large."
    ],
    example: `use std::fs;

let text = fs::read_to_string("notes.txt")?;`,
    pitfalls: [
      "Assume file access can fail at any point.",
      "Do not ignore encodings when text is involved."
    ],
    prereq: ["result-and-option", "strings-and-str"],
    next: ["environment-and-config", "serde-and-json"],
    tags: ["fs", "io", "files"],
    links: [
      {
        label: "std::fs docs",
        href: "https://doc.rust-lang.org/std/fs/index.html",
        note: "Standard file APIs."
      }
    ]
  },
  {
    slug: "environment-and-config",
    title: "Environment variables and config",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Read environment variables and load `.env`/config files the way real apps configure themselves.",
    description:
      "Almost every deployable app needs configuration from outside the binary — API keys, ports, feature flags. `std::env::var` reads real environment variables; the `dotenvy` crate loads a `.env` file into the environment for local development; and config crates (or plain `serde` + a TOML/JSON file) handle richer structured settings.",
    takeaways: [
      "`std::env::var(\"KEY\")` returns `Result<String, VarError>` — missing vars are errors, not empty strings.",
      "`dotenvy::dotenv()` loads a `.env` file into the process environment early in `main`, mainly for local dev; never commit real secrets in it.",
      "For structured config (multiple settings, defaults, layered sources), deserialize a TOML/JSON file into a `#[derive(Deserialize)]` struct instead of many loose env-var reads."
    ],
    example: `use std::env;

fn main() {
    dotenvy::dotenv().ok(); // load .env if present, ignore if missing
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .expect("PORT must be a number");
    println!("listening on {port}");
}`,
    pitfalls: [
      "`.env` files are for local development convenience — production secrets belong in the platform's real secret manager, not a checked-in file.",
      "`env::var` panics-adjacent code (`.unwrap()`) on a missing var crashes at startup with a confusing message — prefer a clear `.expect(\"EXPLAIN_WHAT_IS_MISSING\")`."
    ],
    prereq: ["file-io"],
    next: ["process-and-command", "cfg-and-feature-flags"],
    tags: ["env-vars", "dotenv", "config"],
    links: [
      {
        label: "std::env docs",
        href: "https://doc.rust-lang.org/std/env/index.html",
        note: "Environment and process introspection."
      },
      {
        label: "dotenvy docs",
        href: "https://docs.rs/dotenvy/",
        note: ".env file loading."
      }
    ]
  },
  {
    slug: "process-and-command",
    title: "Args, exit codes, and subprocesses",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Read CLI arguments, control the process exit code, and spawn other programs with `std::process::Command`.",
    description:
      "`std::env::args` gives raw command-line arguments, `std::process::exit` (or returning `ExitCode` from `main`) controls the process's exit status, and `std::process::Command` is how a Rust program shells out to another program and captures its output.",
    takeaways: [
      "`std::env::args()` always includes the program name as the first element — skip it before parsing real arguments.",
      "Return `std::process::ExitCode` from `main` instead of calling `std::process::exit` mid-function — it still runs destructors on the way out.",
      "`Command::new(\"prog\").arg(\"x\").output()` runs a subprocess and captures stdout/stderr/exit status; `.status()` runs it inheriting the parent's streams."
    ],
    example: `use std::process::{Command, ExitCode};

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("usage: tool <name>");
        return ExitCode::FAILURE;
    }

    let output = Command::new("echo").arg(&args[0]).output().unwrap();
    print!("{}", String::from_utf8_lossy(&output.stdout));
    ExitCode::SUCCESS
}`,
    pitfalls: [
      "`std::process::exit()` skips running destructors (`Drop`) for everything still on the stack — prefer returning `ExitCode` from `main` when you can.",
      "`Command::output()` buffers all of stdout/stderr in memory — for long-running or high-volume subprocesses, stream instead."
    ],
    prereq: ["environment-and-config"],
    next: ["cli-apps", "threads-and-spawn"],
    tags: ["env-args", "exit-code", "subprocess"],
    links: [
      {
        label: "std::process docs",
        href: "https://doc.rust-lang.org/std/process/index.html",
        note: "Command, ExitCode, and process control."
      }
    ]
  },
  {
    slug: "threads-and-spawn",
    title: "Threads and spawn",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Run work in parallel with `std::thread::spawn` and collect results with `.join()`.",
    description:
      "`thread::spawn` starts an OS thread running a closure and hands back a `JoinHandle`. Because the closure might outlive the current stack frame, it must be `move` — capturing owned copies of whatever data it needs instead of borrowing.",
    takeaways: [
      "`thread::spawn` requires a `move` closure — it can't borrow data that might not outlive the new thread.",
      "`.join()` blocks until the thread finishes and returns a `Result` with the closure's return value (or the panic payload).",
      "A panic in a spawned thread doesn't crash the whole program — it's reported through `.join()`'s `Err`, and other threads keep running."
    ],
    example: `use std::thread;

let data = vec![1, 2, 3];
let handle = thread::spawn(move || {
    data.iter().sum::<i32>()
});

let sum = handle.join().unwrap();
println!("{sum}");`,
    pitfalls: [
      "Forgetting to `.join()` a handle means the main thread might exit before the spawned thread finishes its work.",
      "Spawning a thread per unit of small work is expensive — for many short-lived tasks, use a thread pool (e.g. `rayon`) instead."
    ],
    prereq: ["process-and-command"],
    next: ["channels-mpsc", "shared-state-mutex-and-arc"],
    tags: ["threads", "spawn", "join"],
    links: [
      {
        label: "Rust Book - Using Threads",
        href: "https://doc.rust-lang.org/book/ch16-01-threads.html",
        note: "Spawning and joining threads."
      }
    ]
  },
  {
    slug: "channels-mpsc",
    title: "Channels (mpsc)",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Send values between threads with `std::sync::mpsc` instead of sharing memory directly.",
    description:
      "\"Do not communicate by sharing memory; share memory by communicating.\" `mpsc::channel()` gives a `Sender`/`Receiver` pair — many senders (it's multi-producer), one receiver — that moves ownership of each value across the channel, sidestepping locking entirely for that data.",
    takeaways: [
      "`mpsc` = multi-producer, single-consumer: clone the `Sender` for multiple producer threads, but there's only one `Receiver`.",
      "`.send(value)` moves `value` across the channel; the receiving thread gets ownership, not a reference.",
      "Iterating a `Receiver` directly (`for msg in rx`) blocks and ends automatically once every `Sender` has been dropped."
    ],
    example: `use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    for i in 0..3 {
        tx.send(i).unwrap();
    }
});

for received in rx {
    println!("got {received}");
}`,
    pitfalls: [
      "The `for msg in rx` loop never ends if a `Sender` clone is still alive somewhere and never dropped — the receiver waits forever.",
      "`.send()` returns a `Result` that's an error once the receiver has been dropped — don't silently `.unwrap()` it in long-running producers."
    ],
    prereq: ["threads-and-spawn"],
    next: ["shared-state-mutex-and-arc"],
    tags: ["channels", "mpsc", "message-passing"],
    links: [
      {
        label: "std::sync::mpsc docs",
        href: "https://doc.rust-lang.org/std/sync/mpsc/index.html",
        note: "Channel API reference."
      }
    ]
  },
  {
    slug: "shared-state-mutex-and-arc",
    title: "Shared state: Arc and Mutex",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Share mutable data safely across threads with `Arc<Mutex<T>>`.",
    description:
      "When threads genuinely need to share the same mutable data (not just pass messages), the standard pattern is `Arc<Mutex<T>>`: `Arc` gives thread-safe shared ownership (a reference count), and `Mutex` gives exclusive access to the data inside, enforced at runtime by blocking any other thread trying to lock it at the same time.",
    takeaways: [
      "`Arc<T>` is `Rc<T>`'s thread-safe sibling — clone it cheaply to share ownership across threads.",
      "`mutex.lock()` blocks until the lock is free, then returns a `MutexGuard` that derefs to `&mut T` and unlocks automatically when dropped.",
      "The type system enforces this: a plain (non-`Arc`, non-`Mutex`) shared mutable reference across threads simply won't compile (`T` isn't `Send`/`Sync`)."
    ],
    example: `use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..5 {
    let counter = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        *counter.lock().unwrap() += 1;
    }));
}
for h in handles { h.join().unwrap(); }
println!("{}", *counter.lock().unwrap()); // 5`,
    pitfalls: [
      "Locking two mutexes in inconsistent order across different code paths is a classic deadlock — always lock in the same global order.",
      "Holding a `MutexGuard` longer than necessary (e.g. across an `.await` or a slow computation) blocks every other thread waiting on that lock."
    ],
    prereq: ["channels-mpsc"],
    next: ["async-basics", "smart-pointers"],
    tags: ["arc", "mutex", "shared-state"],
    links: [
      {
        label: "Rust Book - Shared-State Concurrency",
        href: "https://doc.rust-lang.org/book/ch16-03-shared-state.html",
        note: "Arc, Mutex, and deadlock pitfalls."
      }
    ]
  },
  {
    slug: "async-basics",
    title: "Async and await basics",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Understand `async fn`, `.await`, and why futures do nothing until polled.",
    description:
      "An `async fn` doesn't run its body when called — it immediately returns a `Future` that represents the eventual work. Nothing happens until that future is `.await`ed inside another async context or handed to an executor. This laziness is the core mental model async Rust builds on.",
    takeaways: [
      "Calling an `async fn` returns a `Future` immediately — the body hasn't run yet.",
      "`.await` drives the future forward and yields control back to the executor while waiting on I/O, instead of blocking the OS thread.",
      "`async`/`.await` alone is just language syntax — you need a runtime (like Tokio) to actually execute a future to completion."
    ],
    example: `async fn fetch_value() -> String {
    "ready".to_string()
}

async fn run() {
    let future = fetch_value();  // nothing has run yet
    let value = future.await;    // now it actually executes
    println!("{value}");
}`,
    pitfalls: [
      "Not every problem needs async — for CPU-bound work with no I/O waiting, plain threads are often simpler and just as fast.",
      "A future that's created but never `.await`ed (or spawned) never runs — the compiler warns about this."
    ],
    prereq: ["shared-state-mutex-and-arc"],
    next: ["tokio-runtime-and-tasks"],
    tags: ["async", "await", "future"],
    links: [
      {
        label: "Async book",
        href: "https://rust-lang.github.io/async-book/",
        note: "Official async learning material."
      }
    ]
  },
  {
    slug: "tokio-runtime-and-tasks",
    title: "The Tokio runtime and tasks",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Run async code with `#[tokio::main]`, spawn concurrent tasks, and run futures concurrently with `join!`/`select!`.",
    description:
      "Tokio is the dominant async runtime: it schedules futures onto a thread pool and drives them to completion. `#[tokio::main]` wraps `fn main` in a runtime; `tokio::spawn` runs a future concurrently as its own task; `tokio::join!` and `tokio::select!` combine multiple futures without spawning.",
    takeaways: [
      "`#[tokio::main] async fn main() { ... }` is sugar for building a runtime and blocking on your async main body.",
      "`tokio::spawn(future)` runs a future concurrently in the background — like `thread::spawn`, but for async tasks, and it needs `'static` + `Send` data.",
      "`tokio::join!(a, b)` runs both futures concurrently and waits for both; `tokio::select!` races several futures and proceeds with whichever finishes first."
    ],
    example: `#[tokio::main]
async fn main() {
    let (a, b) = tokio::join!(
        fetch("one"),
        fetch("two"),
    );
    println!("{a} {b}");
}

async fn fetch(name: &str) -> String {
    format!("{name}-done")
}`,
    pitfalls: [
      "Blocking calls (`std::thread::sleep`, synchronous file I/O) inside an async task stall the whole worker thread — use `tokio::time::sleep` and Tokio's async I/O instead.",
      "`tokio::spawn` requires the future to be `'static` and its captures to be `Send` — a common first error when a spawned task borrows a non-thread-safe local."
    ],
    prereq: ["async-basics"],
    next: ["declarative-macros", "web-services"],
    tags: ["tokio", "async", "spawn"],
    links: [
      {
        label: "Tokio docs",
        href: "https://docs.rs/tokio/",
        note: "The de facto standard async runtime."
      }
    ]
  },
  {
    slug: "declarative-macros",
    title: "Declarative macros (macro_rules!)",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Generate repetitive code by matching token patterns with `macro_rules!`.",
    description:
      "`macro_rules!` defines a macro as a set of pattern-to-expansion rules over token trees — matching things like expressions (`$x:expr`), identifiers (`$x:ident`), or repeated groups (`$($x:expr),*`) and expanding them into real code at compile time, before type checking runs.",
    takeaways: [
      "A macro operates on syntax (token trees), not values — it runs before type checking, unlike a function.",
      "Fragment specifiers (`expr`, `ident`, `ty`, `block`, ...) constrain what a `$name` can match.",
      "`$(...)* ` / `$(...),*` repeats a pattern over a comma- (or other-) separated list, which is how `vec![1, 2, 3]`-style macros are built."
    ],
    example: `macro_rules! max {
    ($a:expr, $b:expr) => {
        if $a > $b { $a } else { $b }
    };
}

fn main() {
    println!("{}", max!(3, 7)); // 7
}`,
    pitfalls: [
      "A macro is not a shortcut for unclear API design — prefer a normal function or generic until the repeated pattern is real and syntax-level.",
      "Macro error messages point at the expansion, not the call site as clearly as a function would — keep macros small and well-documented."
    ],
    prereq: ["tokio-runtime-and-tasks"],
    next: ["procedural-macros-overview"],
    tags: ["macros", "macro-rules", "metaprogramming"],
    links: [
      {
        label: "Rust Book - Macros",
        href: "https://doc.rust-lang.org/book/ch20-05-macros.html",
        note: "Declarative macro syntax."
      }
    ]
  },
  {
    slug: "procedural-macros-overview",
    title: "Procedural macros (derive macros you use)",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Understand what `#[derive(Serialize)]`, `#[derive(clap::Parser)]`, and similar attribute macros actually do.",
    description:
      "Most Rust developers never write a procedural macro, but they use them constantly — `#[derive(Serialize, Deserialize)]` from serde, `#[derive(Parser)]` from clap, `#[tokio::main]`. A proc macro is a separate crate (`proc-macro = true`) that receives your code as a token stream and generates new Rust code at compile time.",
    takeaways: [
      "Three kinds: derive macros (`#[derive(X)]`), attribute macros (`#[tokio::main]`), and function-like macros (`sqlx::query!(...)`).",
      "A proc macro must live in its own crate with `proc-macro = true` in `Cargo.toml` — you can't define one in the same crate that uses it.",
      "`cargo expand` shows you the actual generated code, which is the fastest way to understand what a derive macro is doing."
    ],
    example: `#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct User {
    id: u64,
    name: String,
}
// expands (roughly) to real Serialize/Deserialize impls for User`,
    pitfalls: [
      "Writing your own proc macro is a significant jump in complexity (parsing with `syn`, generating with `quote`) — reach for an existing derive before building one.",
      "Proc macro compile errors can be confusing since they point into generated code — `cargo expand` is the standard way to debug them."
    ],
    prereq: ["declarative-macros"],
    next: ["smart-pointers"],
    tags: ["proc-macros", "derive", "serde"],
    links: [
      {
        label: "Rust Reference - Procedural Macros",
        href: "https://doc.rust-lang.org/reference/procedural-macros.html",
        note: "How proc macros work under the hood."
      }
    ]
  },
  {
    slug: "smart-pointers",
    title: "Smart pointers",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Use pointer-like types such as `Box`, `Rc`, and `Arc` when ownership needs more structure.",
    description:
      "Smart pointers wrap ownership patterns that plain values cannot express. They are useful when indirection, shared ownership, or heap allocation is the right tool.",
    takeaways: [
      "`Box` gives heap allocation with single ownership.",
      "`Rc` is for shared ownership in single-threaded code.",
      "`Arc` is the thread-safe shared counterpart."
    ],
    example: `let boxed = Box::new(42);
let shared = std::rc::Rc::new(String::from("atlas"));`,
    pitfalls: [
      "Use the simplest pointer type that solves the problem.",
      "Shared ownership adds complexity; avoid it unless necessary."
    ],
    prereq: ["procedural-macros-overview"],
    next: ["interior-mutability", "threads-and-spawn"],
    tags: ["box", "rc", "arc"],
    links: [
      {
        label: "Rust Book - Smart Pointers",
        href: "https://doc.rust-lang.org/book/ch15-00-smart-pointers.html",
        note: "Box, Rc, RefCell, and more."
      }
    ]
  },
  {
    slug: "interior-mutability",
    title: "Interior mutability",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Mutate through a shared reference using runtime-checked wrappers.",
    description:
      "Interior mutability is the escape hatch that keeps Rust ergonomic for certain shared-state patterns. The compiler still helps, but some checks happen at runtime.",
    takeaways: [
      "Use `RefCell` when borrow rules need to be enforced at runtime.",
      "Use `Mutex` or `RwLock` for shared concurrent state.",
      "Interior mutability is a deliberate tradeoff."
    ],
    example: `use std::cell::RefCell;

let value = RefCell::new(String::from("rust"));
value.borrow_mut().push('!');`,
    pitfalls: [
      "Runtime borrow errors are still errors.",
      "Do not use interior mutability to avoid thinking."
    ],
    prereq: ["smart-pointers"],
    next: ["unsafe-rust", "shared-state-mutex-and-arc"],
    tags: ["refcell", "mutex", "mutability"],
    links: [
      {
        label: "Rust Book - Interior Mutability",
        href: "https://doc.rust-lang.org/book/ch15-05-interior-mutability.html",
        note: "How runtime checks fit the model."
      }
    ]
  },
  {
    slug: "unsafe-rust",
    title: "Unsafe Rust",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Step outside the compiler’s normal guarantees when you need low-level control.",
    description:
      "Unsafe Rust does not turn off safety for the whole program; it allows specific operations that the compiler cannot prove safe on its own. This is a sharp tool and should stay rare.",
    takeaways: [
      "`unsafe` is a promise to uphold invariants manually.",
      "Unsafe code often wraps into a safe abstraction.",
      "Document the contract loudly when you use it."
    ],
    example: `unsafe fn raw_ptr_len(ptr: *const u8, len: usize) -> usize {
    len
}`,
    pitfalls: [
      "Do not use unsafe as a shortcut around ownership.",
      "Keep unsafe blocks small and well reviewed."
    ],
    prereq: ["interior-mutability", "lifetime-elision-and-static"],
    next: ["ffi", "declarative-macros"],
    tags: ["unsafe", "raw-pointers", "invariants"],
    links: [
      {
        label: "The Rustonomicon",
        href: "https://doc.rust-lang.org/nomicon/",
        note: "Unsafe code and invariants."
      }
    ]
  },
  {
    slug: "ffi",
    title: "FFI",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Call into C and expose Rust functions safely across language boundaries.",
    description:
      "Foreign function interfaces connect Rust to existing systems code. The main challenge is not syntax but agreeing on layout, ownership, and error handling across the boundary.",
    takeaways: [
      "Use `extern` and `#[no_mangle]` carefully.",
      "Data layout and ownership must be explicit.",
      "Wrap raw interfaces in safe Rust when possible."
    ],
    example: `#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
    pitfalls: [
      "ABI mismatches are real bugs, not style issues.",
      "Treat FFI as unsafe by default."
    ],
    prereq: ["unsafe-rust"],
    next: ["wasm-basics", "serde-and-json"],
    tags: ["ffi", "c", "abi"],
    links: [
      {
        label: "Rust Reference - FFI",
        href: "https://doc.rust-lang.org/reference/items/external-blocks.html",
        note: "Extern blocks and ABIs."
      }
    ]
  },
  {
    slug: "date-and-time",
    title: "Dates and time",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Measure elapsed time with `std::time`, and work with calendar dates using the `chrono` crate.",
    description:
      "The standard library covers monotonic elapsed-time measurement (`Instant`) and durations, but has no calendar/timezone-aware date type. For anything involving actual dates, timestamps, or timezones, the ecosystem standard is the `chrono` crate.",
    takeaways: [
      "`Instant::now()` + `.elapsed()` measures elapsed time for timing code — it's monotonic and unaffected by system clock changes.",
      "`SystemTime` represents wall-clock time (can go backward if the clock is adjusted) — use it for timestamps, not for measuring durations.",
      "`chrono::DateTime<Utc>` (or `Local`) is the standard type for calendar dates, formatting, and parsing timestamps."
    ],
    example: `use std::time::Instant;

let start = Instant::now();
// ... work ...
println!("took {:?}", start.elapsed());

let now = chrono::Utc::now();
println!("{}", now.format("%Y-%m-%d %H:%M:%S"));`,
    pitfalls: [
      "Using `SystemTime` to measure elapsed durations is subtly wrong if the system clock changes mid-measurement — use `Instant` for that.",
      "Timezone bugs are easy to introduce silently — be explicit about whether you're storing/comparing `Utc` or `Local` times."
    ],
    prereq: ["ffi"],
    next: ["regex-and-text-processing", "random-numbers"],
    tags: ["time", "chrono", "instant"],
    links: [
      {
        label: "std::time docs",
        href: "https://doc.rust-lang.org/std/time/index.html",
        note: "Instant, Duration, SystemTime."
      },
      {
        label: "chrono docs",
        href: "https://docs.rs/chrono/",
        note: "Calendar dates, timezones, formatting."
      }
    ]
  },
  {
    slug: "regex-and-text-processing",
    title: "Regex and text processing",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Match and extract patterns from text with the `regex` crate, plus the std-only tools worth knowing first.",
    description:
      "Rust has no regex support in the standard library — the `regex` crate is the ecosystem standard, backed by a linear-time (non-backtracking) engine. But for simple cases, `str` methods (`split`, `trim`, `starts_with`, `contains`) are often faster to write and read than a regex.",
    takeaways: [
      "`Regex::new(pattern)` compiles a pattern once — compile it a single time (e.g. via `std::sync::LazyLock` or at startup), not per call, since compiling is the expensive part.",
      "`.is_match()`, `.find()`, `.captures()` cover most use cases; named capture groups (`(?<year>\\d{4})`) make extraction readable.",
      "Reach for plain `str` methods before regex when the pattern is a fixed substring or simple split — it's clearer and avoids the dependency."
    ],
    example: `use regex::Regex;

let re = Regex::new(r"(?<year>\\d{4})-(?<month>\\d{2})").unwrap();
if let Some(caps) = re.captures("2026-08-20") {
    println!("year={}", &caps["year"]);
}`,
    pitfalls: [
      "Compiling a `Regex` inside a hot loop (instead of once, up front) dominates the runtime cost — always compile once and reuse.",
      "Rust's `regex` crate deliberately doesn't support backreferences/lookaround (for guaranteed linear-time matching) — a pattern from another language may not port directly."
    ],
    prereq: ["date-and-time"],
    next: ["random-numbers", "http-clients-reqwest"],
    tags: ["regex", "text", "pattern-matching"],
    links: [
      {
        label: "regex crate docs",
        href: "https://docs.rs/regex/",
        note: "Full pattern syntax and API."
      }
    ]
  },
  {
    slug: "random-numbers",
    title: "Random numbers",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Generate random values, ranges, and shuffles with the `rand` crate.",
    description:
      "The standard library has no random number generator — `rand` is the ecosystem standard. `rand::rng()` (thread-local) covers most everyday needs: random numbers in a range, picking a random element, or shuffling a `Vec`.",
    takeaways: [
      "`rand::rng().random_range(1..=6)` generates a random value in a range — inclusive ranges use `..=`.",
      "`slice.choose(&mut rng)` picks a random element; `slice.shuffle(&mut rng)` shuffles in place (needs the `rand::seq` traits in scope).",
      "For reproducible sequences (tests, simulations), seed a specific RNG (e.g. `StdRng::seed_from_u64(42)`) instead of the default thread RNG."
    ],
    example: `use rand::Rng;

let mut rng = rand::rng();
let roll: u32 = rng.random_range(1..=6);
println!("rolled {roll}");`,
    pitfalls: [
      "The default RNG is not cryptographically suited for security-sensitive uses without picking the right algorithm — check `rand`'s docs before using it for tokens/secrets.",
      "Forgetting to import `rand::seq::SliceRandom` (or the current crate's equivalent trait) is why `.choose()`/`.shuffle()` \"don't exist\" on a slice."
    ],
    prereq: ["regex-and-text-processing"],
    next: ["http-clients-reqwest"],
    tags: ["rand", "random", "shuffle"],
    links: [
      {
        label: "rand crate docs",
        href: "https://docs.rs/rand/",
        note: "RNGs, ranges, and distributions."
      }
    ]
  },
  {
    slug: "serde-and-json",
    title: "Serde and JSON",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Serialize and deserialize structured data with the ecosystem’s most common data format.",
    description:
      "Serde is not in the standard library, but it is central to the Rust ecosystem. It makes external data feel like ordinary Rust types.",
    takeaways: [
      "Derive `Serialize` and `Deserialize` for many data models.",
      "Serde handles common data format work cleanly.",
      "Keep data types simple and explicit."
    ],
    example: `#[derive(serde::Serialize, serde::Deserialize)]
struct User {
    id: u64,
    name: String,
}`,
    pitfalls: [
      "Plan for missing or extra fields.",
      "Make the wire format part of the contract."
    ],
    prereq: ["structs", "result-and-option"],
    next: ["http-clients-reqwest", "web-services"],
    tags: ["serde", "json", "serialization"],
    links: [
      {
        label: "Serde docs",
        href: "https://docs.rs/serde/",
        note: "Canonical ecosystem docs."
      },
      {
        label: "serde_json docs",
        href: "https://docs.rs/serde_json/",
        note: "JSON support on docs.rs."
      }
    ]
  },
  {
    slug: "http-clients-reqwest",
    title: "HTTP clients with reqwest",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Make outbound HTTP requests and deserialize JSON responses with `reqwest`.",
    description:
      "`reqwest` is the ecosystem-standard async HTTP client, built on Tokio. It combines naturally with serde: `.json::<T>()` deserializes a response body directly into your own type, and `reqwest::Client` should be built once and reused for connection pooling.",
    takeaways: [
      "Build one `reqwest::Client` and reuse it across requests — it internally pools connections; creating a new client per request throws that away.",
      "`.send().await?` performs the request; `.json::<MyType>().await?` deserializes the body via serde in one step.",
      "Always set a timeout (`.timeout(Duration::from_secs(10))` on the client or request) — an unbounded HTTP call can hang forever."
    ],
    example: `#[derive(serde::Deserialize)]
struct Repo { name: String, stars: u32 }

async fn fetch_repo(client: &reqwest::Client, url: &str) -> reqwest::Result<Repo> {
    client.get(url).send().await?.json::<Repo>().await
}`,
    pitfalls: [
      "Creating a new `Client` per request loses connection pooling and is a common performance mistake — build one and pass it around (e.g. in app state).",
      "A non-2xx response doesn't automatically become an `Err` — check `.status()` or call `.error_for_status()` explicitly."
    ],
    prereq: ["serde-and-json"],
    next: ["databases-and-sqlx", "web-services"],
    tags: ["reqwest", "http", "async"],
    links: [
      {
        label: "reqwest docs",
        href: "https://docs.rs/reqwest/",
        note: "Async HTTP client API."
      }
    ]
  },
  {
    slug: "databases-and-sqlx",
    title: "Databases with sqlx",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Run async, compile-time-checked SQL queries against Postgres/MySQL/SQLite with `sqlx`.",
    description:
      "`sqlx` is an async SQL toolkit that (unlike a traditional ORM) lets you write real SQL, while its `query!`/`query_as!` macros connect to your database at compile time to verify the query and infer result types. A `PgPool`/connection pool is created once and shared across your app.",
    takeaways: [
      "`sqlx::query_as!(MyStruct, \"SELECT ...\")` checks the SQL against the real database schema at compile time and maps rows into your struct.",
      "Create one connection pool (`PgPool::connect(...).await?`) at startup and share it (e.g. via `Arc` or app state) — don't open a new connection per query.",
      "Always use bound parameters (`$1`, `$2` for Postgres) instead of formatting SQL strings by hand — sqlx's macros make raw string interpolation the harder path anyway, which is the point."
    ],
    example: `#[derive(sqlx::FromRow)]
struct User { id: i64, name: String }

async fn get_user(pool: &sqlx::PgPool, id: i64) -> sqlx::Result<User> {
    sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await
}`,
    pitfalls: [
      "The compile-time-checked `query!` macros need a live database (or a saved `.sqlx` offline cache) available at build time — CI setups often forget this.",
      "Opening a connection per request instead of sharing a pool exhausts the database's connection limit under real load."
    ],
    prereq: ["http-clients-reqwest"],
    next: ["cli-apps", "web-services"],
    tags: ["sqlx", "database", "postgres"],
    links: [
      {
        label: "sqlx docs",
        href: "https://docs.rs/sqlx/",
        note: "Async SQL toolkit."
      }
    ]
  },
  {
    slug: "cli-apps",
    title: "CLI apps",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Build command-line tools with `clap`, clear output, and correct exit behavior.",
    description:
      "Rust is a strong fit for CLI applications. `std::env::args` works for trivial cases, but almost every real CLI uses `clap`'s derive API to turn a struct into a full `--help`-generating argument parser with almost no boilerplate.",
    takeaways: [
      "`#[derive(clap::Parser)]` on a struct turns its fields into flags/positional args, with `--help` and `--version` generated for free.",
      "Exit codes should reflect success or failure — return `ExitCode` or use `std::process::exit` with a meaningful non-zero code on failure.",
      "Keep stdout (real output, meant to be piped) and stderr (logs, errors, progress) distinct."
    ],
    example: `use clap::Parser;

#[derive(Parser)]
struct Cli {
    /// Name to greet
    name: String,
    #[arg(short, long, default_value_t = 1)]
    count: u8,
}

fn main() {
    let cli = Cli::parse();
    for _ in 0..cli.count {
        println!("Hello, {}!", cli.name);
    }
}`,
    pitfalls: [
      "Treat the shell as part of the interface — quoting, exit codes, and stdout/stderr separation are all part of a CLI's contract.",
      "Do not print machine-readable output and user-facing prose to the same stream."
    ],
    prereq: ["result-and-option", "process-and-command"],
    next: ["logging-and-tracing", "databases-and-sqlx"],
    tags: ["cli", "clap", "tools"],
    links: [
      {
        label: "Rust Book - Command Line Programs",
        href: "https://doc.rust-lang.org/book/ch12-00-an-io-project.html",
        note: "CLI project example."
      },
      {
        label: "clap docs",
        href: "https://docs.rs/clap/",
        note: "The standard argument-parsing crate."
      }
    ]
  },
  {
    slug: "logging-and-tracing",
    title: "Logging and tracing",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Observe your program with structured logs and request spans.",
    description:
      "Good Rust docs should show how to see what a program is doing. Logging and tracing matter for debugging, observability, and production support.",
    takeaways: [
      "Logs are events; tracing adds structure and spans.",
      "Prefer stable labels and useful fields.",
      "Keep debug output separate from the user-facing CLI."
    ],
    example: `println!("starting sync");
// real apps usually use a logging facade`,
    pitfalls: [
      "Do not leak secrets into logs.",
      "Pick one observability style and use it consistently."
    ],
    prereq: ["cli-apps", "result-and-option"],
    next: ["cfg-and-feature-flags", "docs-and-rustfmt"],
    tags: ["logging", "tracing", "observability"],
    links: [
      {
        label: "tracing crate docs",
        href: "https://docs.rs/tracing/",
        note: "Common Rust tracing ecosystem."
      }
    ]
  },
  {
    slug: "cfg-and-feature-flags",
    title: "cfg and Cargo feature flags",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Compile code conditionally with `#[cfg(...)]` and toggle optional functionality with Cargo features.",
    description:
      "`#[cfg(...)]` includes or excludes code at compile time based on conditions like target OS or a custom flag. Cargo features (declared in `[features]` in `Cargo.toml`) are the standard way to make optional functionality (and optional dependencies) opt-in, which `#[cfg(feature = \"...\")]` then checks in code.",
    takeaways: [
      "`#[cfg(target_os = \"linux\")]` (or `windows`, `test`, `debug_assertions`, ...) conditionally compiles an item for that context only.",
      "A Cargo feature declared in `[features]` becomes checkable in code via `#[cfg(feature = \"my_feature\")]`.",
      "`optional = true` on a dependency plus a same-named feature is the standard way to make a heavy dependency opt-in."
    ],
    example: `// Cargo.toml
// [features]
// json = ["dep:serde_json"]

#[cfg(feature = "json")]
fn to_json(value: &str) -> String {
    serde_json::to_string(value).unwrap()
}

#[cfg(target_os = "linux")]
fn platform_note() -> &'static str { "linux" }`,
    pitfalls: [
      "Features are additive across a dependency graph — if any crate in the build enables a feature, it's on for everyone, so features should never be used to change behavior in conflicting ways.",
      "Forgetting to test with `--no-default-features` (or specific feature combinations) means feature-gated code paths can silently bit-rot."
    ],
    prereq: ["logging-and-tracing"],
    next: ["build-scripts"],
    tags: ["cfg", "features", "conditional-compilation"],
    links: [
      {
        label: "Cargo Book - Features",
        href: "https://doc.rust-lang.org/cargo/reference/features.html",
        note: "Declaring and using Cargo features."
      },
      {
        label: "Rust Reference - Conditional compilation",
        href: "https://doc.rust-lang.org/reference/conditional-compilation.html",
        note: "Every #[cfg] predicate."
      }
    ]
  },
  {
    slug: "build-scripts",
    title: "Build scripts (build.rs)",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Run custom logic before compilation with `build.rs` — code generation, native linking, or compile-time metadata.",
    description:
      "A `build.rs` file at the crate root, if present, is compiled and run by Cargo before the rest of the crate builds. It's used to generate code, compile and link native C libraries (`cc` crate), embed build metadata, or set `cfg` flags for the main build based on the environment.",
    takeaways: [
      "Cargo compiles and runs `build.rs` automatically if it exists at the package root — no extra configuration needed.",
      "Communicate with Cargo by printing specially-formatted lines to stdout, e.g. `println!(\"cargo::rerun-if-changed=...\")` or `cargo::rustc-link-lib=...`.",
      "Common uses: generating Rust code from a schema (protobuf, GraphQL), compiling a bundled C library, or embedding the git commit hash into the binary."
    ],
    example: `// build.rs
fn main() {
    println!("cargo::rerun-if-changed=schema.proto");
    println!("cargo::rustc-env=BUILD_TIME={}", "2026-08-20");
}`,
    pitfalls: [
      "A slow or network-dependent build script makes every `cargo build` slower and less reproducible — keep them fast and offline where possible.",
      "Forgetting `cargo::rerun-if-changed` means Cargo may not notice a source the build script depends on has changed, and skip regenerating output."
    ],
    prereq: ["cfg-and-feature-flags"],
    next: ["docs-and-rustfmt"],
    tags: ["build-rs", "codegen", "cargo"],
    links: [
      {
        label: "Cargo Book - Build Scripts",
        href: "https://doc.rust-lang.org/cargo/reference/build-scripts.html",
        note: "What build.rs can do and how Cargo talks to it."
      }
    ]
  },
  {
    slug: "docs-and-rustfmt",
    title: "Docs and rustfmt",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Document public APIs and keep formatting consistent with the standard formatter.",
    description:
      "Rust tooling makes documentation generation and formatting part of the normal workflow. That helps the docs stay stable and easy to scan.",
    takeaways: [
      "Use `rustfmt` to keep formatting predictable.",
      "Document public APIs with doc comments.",
      "`cargo doc` turns source comments into browsable docs."
    ],
    example: `cargo fmt
cargo doc --open`,
    pitfalls: [
      "Do not hand-format code when the formatter already knows the rules.",
      "Write docs for the reader, not for yourself."
    ],
    prereq: ["comments-and-documentation", "unit-testing"],
    next: ["workspaces-and-crates", "clippy-and-formatting"],
    tags: ["docs", "rustfmt", "cargo-doc"],
    links: [
      {
        label: "rustfmt book",
        href: "https://rust-lang.github.io/rustfmt/",
        note: "Formatting rules and configuration."
      },
      {
        label: "cargo doc",
        href: "https://doc.rust-lang.org/cargo/commands/cargo-doc.html",
        note: "Generate browsable API docs."
      }
    ]
  },
  {
    slug: "workspaces-and-crates",
    title: "Workspaces and crates",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Split larger projects into multiple crates and coordinate them with a workspace.",
    description:
      "Workspaces let a multi-crate project share dependencies, targets, and build settings. They are the natural next step once a project grows beyond a single package.",
    takeaways: [
      "A workspace groups related crates together.",
      "Separate crates help with boundaries and compile times.",
      "Re-export carefully when you want a simpler public surface."
    ],
    example: `[workspace]
members = ["crates/api", "crates/core"]`,
    pitfalls: [
      "Do not split into crates before the boundaries are real.",
      "Keep dependency graphs understandable."
    ],
    prereq: ["modules-and-crates", "cargo-basics"],
    next: ["docs-and-rustfmt", "serde-and-json"],
    tags: ["workspace", "crates", "monorepo"],
    links: [
      {
        label: "Cargo Workspaces",
        href: "https://doc.rust-lang.org/cargo/reference/workspaces.html",
        note: "Multi-crate project structure."
      }
    ]
  },
  {
    slug: "clippy-and-formatting",
    title: "Clippy and formatting",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Use lints and formatting to keep code consistent and catch likely mistakes.",
    description:
      "Clippy gives opinionated feedback on Rust code. Combined with rustfmt, it keeps a project in a healthy, predictable shape.",
    takeaways: [
      "Clippy suggests improvements, not just errors.",
      "`rustfmt` keeps code style consistent.",
      "Tooling should be part of your normal loop."
    ],
    example: `cargo clippy
cargo fmt`,
    pitfalls: [
      "Treat lints as guidance, then decide intentionally.",
      "Do not manually fight the formatter."
    ],
    prereq: ["docs-and-rustfmt", "unit-testing"],
    next: ["workspaces-and-crates"],
    tags: ["clippy", "formatting", "lint"],
    links: [
      {
        label: "Clippy",
        href: "https://doc.rust-lang.org/clippy/",
        note: "The official linter guide."
      }
    ]
  },
  {
    slug: "web-services",
    title: "Web services",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Build HTTP services with async runtimes and request handlers.",
    description:
      "Rust web backends are usually built on async runtimes plus libraries like Axum, Actix, or Warp. The language docs should explain the shared shape before diving into framework choice.",
    takeaways: [
      "Requests and responses are plain data structures.",
      "Async and serialization usually show up together.",
      "Route handlers should stay small and composable."
    ],
    example: `async fn health() -> &'static str {
    "ok"
}`,
    pitfalls: [
      "Do not mix blocking code into async handlers without a plan.",
      "Keep your handler boundaries simple."
    ],
    prereq: ["tokio-runtime-and-tasks", "serde-and-json", "result-and-option"],
    next: ["ffi", "wasm-basics"],
    tags: ["web", "http", "backend"],
    links: [
      {
        label: "Axum docs",
        href: "https://docs.rs/axum/",
        note: "Popular Rust web framework docs."
      }
    ]
  },
  {
    slug: "wasm-basics",
    title: "Rust and WebAssembly",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Compile Rust to WebAssembly and call it from JavaScript with `wasm-bindgen`.",
    description:
      "Rust's small runtime and lack of a garbage collector make it a strong fit for WebAssembly — compiling to a `wasm32-unknown-unknown` target for use in the browser or other WASM hosts. `wasm-bindgen` generates the glue code that lets Rust functions and JS interoperate, and `wasm-pack` packages the result for npm.",
    takeaways: [
      "`#[wasm_bindgen]` on a function or struct exposes it to JavaScript, generating the marshalling code automatically.",
      "`wasm-pack build` compiles the crate to `wasm32-unknown-unknown` and emits a ready-to-import JS package.",
      "Not every crate compiles to WASM — anything depending on threads, the filesystem, or raw sockets typically needs a WASM-specific alternative or feature-gating."
    ],
    example: `use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}`,
    pitfalls: [
      "Passing complex Rust types across the WASM/JS boundary isn't free — large data transfers need serialization (often via `serde-wasm-bindgen`), not just a function call.",
      "Panics in Rust compiled to WASM abort into a JS exception by default with a much less helpful message — set a panic hook (`console_error_panic_hook`) during development."
    ],
    prereq: ["web-services"],
    next: [],
    tags: ["wasm", "wasm-bindgen", "webassembly"],
    links: [
      {
        label: "wasm-bindgen guide",
        href: "https://rustwasm.github.io/wasm-bindgen/",
        note: "Rust/JS interop reference."
      },
      {
        label: "Rust and WebAssembly book",
        href: "https://rustwasm.github.io/docs/book/",
        note: "End-to-end WASM workflow."
      }
    ]
  }
];

module.exports = topics;

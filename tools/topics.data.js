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
    next: ["hello-world", "modules-and-crates", "testing"],
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
    next: ["functions", "control-flow", "collections"],
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
    next: ["structs", "enums", "workspaces-and-crates"],
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
    prereq: ["modules-and-crates"],
    next: ["methods-and-impls", "traits"],
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
    prereq: ["structs"],
    next: ["pattern-matching", "error-handling"],
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
    next: ["methods-and-impls", "error-handling"],
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
    next: ["traits", "generics"],
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
    next: ["lifetimes", "collections"],
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
    next: ["smart-pointers", "traits"],
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
    slug: "traits",
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
    next: ["generics", "iterators", "closures"],
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
    prereq: ["traits"],
    next: ["collections", "iterators", "smart-pointers"],
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
    slug: "collections",
    title: "Collections",
    category: "Abstractions",
    level: "Beginner",
    summary: "Use `Vec`, `HashMap`, and other standard collections when shape matters.",
    description:
      "Collections solve the problems that fixed-size arrays cannot. They are the main data structures for dynamic application code.",
    takeaways: [
      "`Vec` grows, `HashMap` indexes by key, and both live in the standard library.",
      "Choose the collection by access pattern, not by habit.",
      "Borrowing and ownership still apply to collections."
    ],
    example: `let mut items = Vec::new();
items.push("cargo");
items.push("rust");`,
    pitfalls: [
      "Avoid repeated indexing when an iterator would be clearer.",
      "Remember that growing collections can reallocate."
    ],
    prereq: ["data-types", "ownership"],
    next: ["strings-and-str", "iterators"],
    tags: ["vec", "hashmap", "collections"],
    links: [
      {
        label: "Rust Book - Collections",
        href: "https://doc.rust-lang.org/book/ch08-00-common-collections.html",
        note: "Vec, String, and HashMap."
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
    prereq: ["collections", "borrowing"],
    next: ["iterators", "file-io"],
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
    slug: "iterators",
    title: "Iterators",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Process sequences with lazy, composable iteration instead of manual loops.",
    description:
      "Iterators are a core Rust abstraction for walking through data. They are lazy, chainable, and often clearer than manual indexing.",
    takeaways: [
      "`iter`, `iter_mut`, and `into_iter` mean different ownership things.",
      "Iterator adapters transform values without running immediately.",
      "Consumers like `collect` or `sum` finish the chain."
    ],
    example: `let doubled: Vec<i32> = [1, 2, 3]
    .into_iter()
    .map(|n| n * 2)
    .collect();`,
    pitfalls: [
      "Do not reach for `for` loops when a chain reads better.",
      "Be aware of whether the iterator yields owned values or borrows."
    ],
    prereq: ["collections", "traits"],
    next: ["closures", "error-handling"],
    tags: ["iterators", "lazy", "collect"],
    links: [
      {
        label: "Rust Book - Processing a Series of Items with Iterators",
        href: "https://doc.rust-lang.org/book/ch13-02-iterators.html",
        note: "Iterator fundamentals."
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
      "Closures are lightweight, local pieces of behavior. They make iterator chains, callbacks, and short transformations more readable.",
    takeaways: [
      "Closures can capture by borrow, mutable borrow, or move.",
      "Use them for short-lived behavior near the call site.",
      "They fit naturally with iterator adapters."
    ],
    example: `let threshold = 10;
let is_big = |value: i32| value > threshold;`,
    pitfalls: [
      "Keep closures small; named functions are clearer for complex logic.",
      "Capture mode matters when the closure outlives the original scope."
    ],
    prereq: ["iterators"],
    next: ["error-handling", "concurrency"],
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
    slug: "error-handling",
    title: "Error handling",
    category: "Abstractions",
    level: "Intermediate",
    summary: "Use `Result`, `Option`, and propagation to keep failures explicit.",
    description:
      "Rust makes failure part of the type system. That sounds strict, but it usually produces clearer code and better API contracts.",
    takeaways: [
      "`Option` means a value might be absent.",
      "`Result` means an operation can fail.",
      "The `?` operator is the common way to propagate errors."
    ],
    example: `fn read_port(text: &str) -> Result<u16, std::num::ParseIntError> {
    Ok(text.parse()?)
}`,
    pitfalls: [
      "Do not hide fallible code behind `unwrap` unless you really mean panic.",
      "Match on the error when the caller can act on it."
    ],
    prereq: ["pattern-matching", "generics"],
    next: ["testing", "file-io", "serde-and-json"],
    tags: ["result", "option", "error"],
    links: [
      {
        label: "Rust Book - Error Handling",
        href: "https://doc.rust-lang.org/book/ch09-00-error-handling.html",
        note: "Option, Result, and `?`."
      }
    ]
  },
  {
    slug: "testing",
    title: "Testing",
    category: "Runtime & ecosystem",
    level: "Beginner",
    summary: "Write unit and integration tests with Cargo's built-in test runner.",
    description:
      "Rust testing lives close to the code and is easy to run. The main decision is what to test and whether it belongs in a unit or integration test.",
    takeaways: [
      "Use `#[test]` for unit tests.",
      "Organize integration tests in `tests/`.",
      "Keep tests readable and narrowly focused."
    ],
    example: `#[test]
fn adds_numbers() {
    assert_eq!(2 + 2, 4);
}`,
    pitfalls: [
      "A test should explain intent, not just cover lines.",
      "Use failure messages when the assertion alone is not enough."
    ],
    prereq: ["cargo-basics", "functions"],
    next: ["docs-and-rustfmt", "clippy-and-formatting"],
    tags: ["tests", "cargo", "quality"],
    links: [
      {
        label: "Rust Book - Writing Automated Tests",
        href: "https://doc.rust-lang.org/book/ch11-00-testing.html",
        note: "Unit and integration testing."
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
    prereq: ["error-handling", "strings-and-str"],
    next: ["serde-and-json", "cli-apps"],
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
    slug: "concurrency",
    title: "Concurrency",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Share work across threads while keeping ownership and safety explicit.",
    description:
      "Rust concurrency uses the type system to help you avoid many classic data-race problems. The tradeoff is that you must be more explicit about sharing.",
    takeaways: [
      "Threads and channels are the basic building blocks.",
      "`Send` and `Sync` describe concurrency safety.",
      "Ownership rules still apply across threads."
    ],
    example: `use std::thread;

let handle = thread::spawn(|| {
    println!("work");
});`,
    pitfalls: [
      "Shared mutable state needs deliberate synchronization.",
      "Do not confuse parallelism with concurrency."
    ],
    prereq: ["ownership", "borrowing", "error-handling"],
    next: ["async-await", "smart-pointers"],
    tags: ["threads", "send", "sync"],
    links: [
      {
        label: "Rust Book - Fearless Concurrency",
        href: "https://doc.rust-lang.org/book/ch16-00-concurrency.html",
        note: "Threads, channels, and safety."
      }
    ]
  },
  {
    slug: "async-await",
    title: "Async and await",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Use asynchronous control flow for I/O-heavy work and understand the executor model.",
    description:
      "Async Rust is a model, not a single library. The language gives you `async` and `await`, and executors like Tokio or async-std run the futures.",
    takeaways: [
      "An async function returns a future.",
      "`.await` yields while waiting for I/O or other async work.",
      "Pick an executor ecosystem and stay consistent."
    ],
    example: `async fn fetch_value() -> String {
    "ready".to_string()
}`,
    pitfalls: [
      "Not every problem needs async.",
      "Avoid blocking work inside an async runtime when you can."
    ],
    prereq: ["concurrency", "error-handling"],
    next: ["cli-apps", "serde-and-json"],
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
    slug: "macros",
    title: "Macros",
    category: "Runtime & ecosystem",
    level: "Advanced",
    summary: "Generate code with declarative or procedural macros when plain functions are not enough.",
    description:
      "Macros are Rust’s metaprogramming system. They are powerful and easy to overuse, so the best docs explain when not to reach for them.",
    takeaways: [
      "Macros operate before type checking in many cases.",
      "`macro_rules!` is the common declarative form.",
      "Procedural macros are for parsing and transforming token streams."
    ],
    example: `macro_rules! say {
    ($msg:expr) => {
        println!("{}", $msg);
    };
}`,
    pitfalls: [
      "A macro is not a shortcut for unclear API design.",
      "Prefer normal code until the repeated pattern is real."
    ],
    prereq: ["functions", "pattern-matching"],
    next: ["docs-and-rustfmt", "unsafe-rust"],
    tags: ["macros", "metaprogramming", "tokens"],
    links: [
      {
        label: "Rust Reference - Macros",
        href: "https://doc.rust-lang.org/reference/macros.html",
        note: "Language reference material."
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
    prereq: ["ownership", "lifetimes"],
    next: ["interior-mutability", "concurrency"],
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
    next: ["unsafe-rust", "concurrency"],
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
    prereq: ["interior-mutability", "lifetimes"],
    next: ["ffi", "macros"],
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
    next: ["serde-and-json", "cli-apps"],
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
    prereq: ["structs", "error-handling"],
    next: ["cli-apps", "web-services"],
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
    slug: "cli-apps",
    title: "CLI apps",
    category: "Runtime & ecosystem",
    level: "Intermediate",
    summary: "Build command-line tools with clear arguments, output, and exit behavior.",
    description:
      "Rust is a strong fit for CLI applications because argument parsing, error handling, and file work all compose well. The docs should focus on user experience, not just code.",
    takeaways: [
      "Use `std::env::args` or a parser crate for anything non-trivial.",
      "Exit codes should reflect success or failure.",
      "Keep stdout and stderr distinct."
    ],
    example: `fn main() {
    let args: Vec<String> = std::env::args().collect();
    println!("{args:?}");
}`,
    pitfalls: [
      "Treat the shell as part of the interface.",
      "Do not print machine-readable output and user-facing prose to the same stream."
    ],
    prereq: ["error-handling", "file-io"],
    next: ["logging-and-tracing", "web-services"],
    tags: ["cli", "args", "tools"],
    links: [
      {
        label: "Rust Book - Command Line Programs",
        href: "https://doc.rust-lang.org/book/ch12-00-an-io-project.html",
        note: "CLI project example."
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
    prereq: ["cli-apps", "error-handling"],
    next: ["web-services", "docs-and-rustfmt"],
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
    prereq: ["comments-and-documentation", "testing"],
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
    prereq: ["docs-and-rustfmt", "testing"],
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
    prereq: ["async-await", "serde-and-json", "error-handling"],
    next: ["ffi", "logging-and-tracing"],
    tags: ["web", "http", "backend"],
    links: [
      {
        label: "Axum docs",
        href: "https://docs.rs/axum/",
        note: "Popular Rust web framework docs."
      }
    ]
  }
];

module.exports = topics;

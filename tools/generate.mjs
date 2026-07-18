// generate.mjs — ports the 43 topics from topics.data.js into an mdBook skeleton.
//
// Emits:
//   src/<category-dir>/<slug>.md   one lesson stub per topic (skipped if it already exists,
//                                  so Phase-B hand-edits are never clobbered; use --force to overwrite)
//   questions/<slug>.json          quiz + flashcard bank stub (skipped if it already exists)
//   src/SUMMARY.md                 the sidebar / table of contents (always regenerated)
//
// Run:  node tools/generate.mjs         (safe, incremental)
//       node tools/generate.mjs --force (overwrite lesson .md stubs)

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const topics = require("./topics.data.js");

const FORCE = process.argv.includes("--force");

// ---- category -> directory + display order --------------------------------
const CATEGORY_ORDER = [
  "Start here",
  "Language basics",
  "Ownership",
  "Abstractions",
  "Runtime & ecosystem",
];
const catDir = (cat) =>
  cat.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// slug -> topic, and slug -> relative md path (used for cross-links)
const bySlug = new Map(topics.map((t) => [t.slug, t]));
const mdPath = (t) => `${catDir(t.category)}/${t.slug}.md`;

// ---- example language detection -------------------------------------------
// Shell examples (rustup/cargo/rustc lines) render as bash; everything else as
// runnable, editable Rust.
function fenceFor(example) {
  const looksRust = /\bfn\s|\blet\s|println!|struct\s|enum\s|impl\s|->|use\s+std|;\s*$/m.test(example);
  const looksShell = /^\s*(\$\s*)?(rustup|cargo|rustc|rustfmt|clippy|mkdir|cd)\b/m.test(example);
  if (looksShell && !looksRust) return "bash";
  return "rust,editable";
}

// For runnable Rust: the mdBook playground needs a `fn main`. Snippets that
// don't define one get wrapped so the ▶ Run button actually works. Full
// programs (already containing `fn main`) are left untouched.
function runnableRust(example) {
  if (/\bfn\s+main\b/.test(example)) return example;
  const body = example
    .split("\n")
    .map((line) => (line.trim() ? `    ${line}` : line))
    .join("\n");
  return `fn main() {\n${body}\n}`;
}

// ---- markdown helpers ------------------------------------------------------
const bullets = (arr) => (arr && arr.length ? arr.map((x) => `- ${x}`).join("\n") : "");

function nextLinks(t) {
  if (!t.next || !t.next.length) return "";
  const items = t.next
    .map((slug) => {
      const nt = bySlug.get(slug);
      if (!nt) return null;
      return `- [${nt.title}](../${mdPath(nt)})`;
    })
    .filter(Boolean);
  return items.length ? `**Next:**\n\n${items.join("\n")}\n` : "";
}

function officialLinks(t) {
  if (!t.links || !t.links.length) return "";
  return t.links
    .map((l) => `- [${l.label}](${l.href})${l.note ? ` — ${l.note}` : ""}`)
    .join("\n");
}

function lessonMarkdown(t) {
  const fence = fenceFor(t.example);
  const code = fence === "bash" ? t.example : runnableRust(t.example);
  const pitfalls = bullets(t.pitfalls);
  const takeaways = bullets(t.takeaways);
  const links = officialLinks(t);
  const next = nextLinks(t);

  // Build the lesson as a list of sections, then join with blank lines so
  // spacing is always correct regardless of which optional sections exist.
  const sections = [
    `# ${t.title}`,
    `> **${t.level}** · ${t.category}`,
    `## What & why\n\n${t.summary}`,
    `## The idea, slowly\n\n${t.description}\n\n<!-- AUTHORING: expand this section into a patient, beginner-first explanation —\n     an analogy, what the compiler is "thinking", and small steps. -->`,
    `## See it run\n\n\`\`\`${fence}\n${code}\n\`\`\``,
  ];
  if (pitfalls) sections.push(`## Common mistakes\n\n${pitfalls}`);
  sections.push(
    `## Your turn\n\n<!-- AUTHORING: replace with a small broken program the reader must fix. -->\n\nTry changing the example above and run it. What breaks? What does the compiler tell you?`
  );
  sections.push(`## Quick check\n\n<div class="quiz" data-topic="${t.slug}"></div>`);
  if (takeaways) sections.push(`## Remember this\n\n${takeaways}`);
  if (links) sections.push(`## Go deeper\n\n${links}`);
  if (next) sections.push(next.trim());

  return sections.join("\n\n") + "\n";
}

function questionStub(t) {
  return JSON.stringify(
    {
      topic: t.slug,
      title: t.title,
      // quiz: array of { q, options:[...], answer: <index>, explain }
      quiz: [],
      // flashcards: array of { front, back }
      flashcards: [],
    },
    null,
    2
  );
}

// ---- write files -----------------------------------------------------------
let wroteMd = 0,
  skippedMd = 0,
  wroteQ = 0,
  skippedQ = 0;

for (const t of topics) {
  const dir = join(ROOT, "src", catDir(t.category));
  fs.mkdirSync(dir, { recursive: true });
  const mdFile = join(dir, `${t.slug}.md`);
  if (FORCE || !fs.existsSync(mdFile)) {
    fs.writeFileSync(mdFile, lessonMarkdown(t));
    wroteMd++;
  } else skippedMd++;

  const qFile = join(ROOT, "questions", `${t.slug}.json`);
  if (!fs.existsSync(qFile)) {
    fs.writeFileSync(qFile, questionStub(t));
    wroteQ++;
  } else skippedQ++;
}

// ---- SUMMARY.md (always regenerated) --------------------------------------
let summary = `# Summary\n\n[Introduction](introduction.md)\n`;
for (const cat of CATEGORY_ORDER) {
  const inCat = topics.filter((t) => t.category === cat);
  if (!inCat.length) continue;
  summary += `\n# ${cat}\n\n`;
  for (const t of inCat) summary += `- [${t.title}](${mdPath(t)})\n`;
}
summary += `\n---\n\n[Review & flashcards](review.md)\n`;
fs.writeFileSync(join(ROOT, "src", "SUMMARY.md"), summary);

// ---- bundle all question banks into one browser global --------------------
// The retention widget reads window.RUST_QUESTIONS instead of fetching JSON,
// so quizzes + flashcards work everywhere, including an offline `mdbook build`
// opened from disk. Regenerated on every run from questions/<slug>.json.
const banks = {};
for (const t of topics) {
  const qFile = join(ROOT, "questions", `${t.slug}.json`);
  try {
    banks[t.slug] = JSON.parse(fs.readFileSync(qFile, "utf8"));
  } catch {
    banks[t.slug] = { topic: t.slug, title: t.title, quiz: [], flashcards: [] };
  }
}
const order = topics.map((t) => ({ slug: t.slug, title: t.title, category: t.category }));
const bundle =
  "// AUTO-GENERATED by tools/generate.mjs — do not edit by hand.\n" +
  "window.RUST_QUESTIONS = " +
  JSON.stringify(banks) +
  ";\n" +
  "window.RUST_TOPIC_ORDER = " +
  JSON.stringify(order) +
  ";\n";
fs.writeFileSync(join(ROOT, "theme", "questions.data.js"), bundle);

console.log(
  `lessons: ${wroteMd} written, ${skippedMd} kept | questions: ${wroteQ} written, ${skippedQ} kept | SUMMARY.md regenerated`
);

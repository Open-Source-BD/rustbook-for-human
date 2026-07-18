// validate.mjs — sanity checks over the lessons and question banks.
// Run:  node tools/validate.mjs
// Exits non-zero if any ERROR is found. Warnings don't fail the build.

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const topics = require("./topics.data.js");

const catDir = (cat) =>
  cat.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let errors = 0,
  warns = 0;
const err = (m) => {
  console.log("ERROR  " + m);
  errors++;
};
const warn = (m) => {
  console.log("warn   " + m);
  warns++;
};

const REQUIRED_HEADINGS = [
  "## What & why",
  "## The idea, slowly",
  "## Your turn",
  "## Quick check",
  "## Remember this",
];

for (const t of topics) {
  const mdFile = join(ROOT, "src", catDir(t.category), `${t.slug}.md`);
  // ---- lesson markdown ----
  if (!fs.existsSync(mdFile)) {
    err(`${t.slug}: lesson file missing (${mdFile})`);
  } else {
    const md = fs.readFileSync(mdFile, "utf8");
    for (const h of REQUIRED_HEADINGS) {
      if (!md.includes(h)) err(`${t.slug}: missing section "${h}"`);
    }
    if (!md.includes(`data-topic="${t.slug}"`))
      err(`${t.slug}: quiz mount div missing or wrong slug`);
    if (md.includes("AUTHORING:"))
      err(`${t.slug}: leftover AUTHORING placeholder comment`);
    if (md.includes("Try changing the example above and run it. What breaks?"))
      warn(`${t.slug}: still has the stub "Your turn" placeholder text`);
    // editable rust blocks should look like complete programs.
    // Match fences only at line start (optionally indented) so nested,
    // `///`-prefixed doc-comment backticks don't end the block early.
    const blocks = [...md.matchAll(/^ {0,3}```rust,editable[^\n]*\n([\s\S]*?)^ {0,3}```/gm)].map(
      (m) => m[1]
    );
    blocks.forEach((b, i) => {
      if (!/\bfn\s+main\b/.test(b))
        warn(`${t.slug}: rust,editable block #${i + 1} has no fn main (Run may fail)`);
    });
  }

  // ---- question bank ----
  const qFile = join(ROOT, "questions", `${t.slug}.json`);
  if (!fs.existsSync(qFile)) {
    err(`${t.slug}: questions JSON missing`);
    continue;
  }
  let bank;
  try {
    bank = JSON.parse(fs.readFileSync(qFile, "utf8"));
  } catch (e) {
    err(`${t.slug}: questions JSON is invalid — ${e.message}`);
    continue;
  }
  if (!Array.isArray(bank.quiz) || bank.quiz.length === 0)
    warn(`${t.slug}: no quiz questions`);
  if (!Array.isArray(bank.flashcards) || bank.flashcards.length === 0)
    warn(`${t.slug}: no flashcards`);
  (bank.quiz || []).forEach((q, i) => {
    if (!q.q) err(`${t.slug}: quiz[${i}] missing question text`);
    if (!Array.isArray(q.options) || q.options.length < 2)
      err(`${t.slug}: quiz[${i}] needs at least 2 options`);
    if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= (q.options || []).length)
      err(`${t.slug}: quiz[${i}] answer index out of range`);
    if (!q.explain) warn(`${t.slug}: quiz[${i}] has no explanation`);
  });
  (bank.flashcards || []).forEach((c, i) => {
    if (!c.front || !c.back) err(`${t.slug}: flashcard[${i}] missing front/back`);
  });
}

console.log(`\n${topics.length} topics checked — ${errors} error(s), ${warns} warning(s)`);
process.exit(errors ? 1 : 0);

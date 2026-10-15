const fs = require("fs");
const path = require("path");
const { unzipSync } = require("fflate");

const file = process.argv[2];
const buf = fs.readFileSync(file);
const out = unzipSync(new Uint8Array(buf));

console.log(`${path.basename(file)}  —  ${(buf.length / 1024 / 1024).toFixed(2)} MB\n`);

const manifest = JSON.parse(Buffer.from(out["manifest.json"]).toString());
console.log("manifest:", JSON.stringify({ format: manifest.format, version: manifest.version, exportedAt: manifest.exportedAt, totalRows: manifest.totalRows }));

console.log("\nফাইলস:");
for (const name of Object.keys(out).sort()) {
  const size = (out[name].length / 1024).toFixed(0);
  console.log(`  ${name.padEnd(24)} ${String(size).padStart(7)} KB`);
}

// Parse each table back and check the ids survived — the restore upserts on them.
console.log("\nটেবিল যাচাই:");
let bad = 0;
for (const table of manifest.tables) {
  const rows = JSON.parse(Buffer.from(out[`${table}.json`]).toString());
  const key = table === "qb_question_meta" ? "question_id" : "id";
  const withKey = rows.filter((r) => r[key]).length;
  const ids = new Set(rows.map((r) => r[key]));
  const ok = withKey === rows.length && ids.size === rows.length && rows.length === manifest.counts[table];
  if (!ok) bad++;
  console.log(`  ${ok ? "✓" : "✗"} ${table.padEnd(18)} ${String(rows.length).padStart(6)} rows, ${ids.size} unique ${key}`);
}
console.log(`\nযাচাই ব্যর্থ টেবিল: ${bad}`);

// A spot-check that the Bengali text came through intact.
const qs = JSON.parse(Buffer.from(out["questions.json"]).toString());
const sample = qs.find((q) => /[ঀ-৿]/.test(q.question_text));
console.log(`\nনমুনা প্রশ্ন: ${sample.question_text.slice(0, 70)}`);
const withImg = qs.filter((q) => (q.explanation || "").includes("<img")).length;
console.log(`ছবিসহ ব্যাখ্যা: ${withImg}`);

// The CSV must open cleanly in Excel — check the quoting held.
const csv = Buffer.from(out["questions.csv"]).toString("utf8");
const lines = csv.split("\r\n");
console.log(`CSV: ${lines.length - 1} লাইন, হেডার → ${lines[0].slice(0, 60)}`);

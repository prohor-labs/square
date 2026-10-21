/**
 * Writes a zip of the whole question bank to backups/.
 *
 * The point is to be able to throw the bank away and put it back exactly as it
 * was, so every row goes out with its primary key intact — restoring is then an
 * upsert on that key, and uploading the same file twice changes nothing.
 *
 *   npm run backup:qb
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");
const { zipSync } = require("fflate");
require("dotenv").config({ path: ".env.local" });

const OUT_DIR = path.join(__dirname, "..", "backups");

/* Parents before children, so a restore can insert in one pass.
   exam_questions and question_tags hang off questions too — leaving them out
   would mean wiping the bank silently empties every exam built from it. */
const TABLES = [
  "containers",
  "items",
  "subitems",
  "topics",
  "questions",
  "mcq_options",
  "cq_parts",
  "tags",
  "question_tags",
  "qb_institutes",
  "qb_subjects",
  "qb_chapters",
  "qb_topics",
  "qb_question_topics",
  "qb_question_meta",
  "exam_questions",
  "new_subjects",
  "new_chapters",
  "new_topics",
  "new_questions",
  "new_mcq_options",
  "new_cq_parts",
];

/** Excel-friendly dump of the questions, for reading rather than restoring. */
function toCsv(rows) {
  const head = [
    "id",
    "question",
    "type",
    "source",
    "standard",
    "free",
    "bank",
    "unit",
    "subitem",
    "topic",
    "explanation",
    "question_image",
    "explanation_image",
  ];
  const cell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [head.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.question_text,
        r.type,
        r.source,
        r.standard,
        r.is_free,
        r.container,
        r.subitem_name,
        r.topic_name,
        r.subitem_name,
        r.explanation,
        r.question_image,
        r.explanation_image,
      ]
        .map(cell)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

(async () => {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  const files = {};
  const counts = {};
  let totalRows = 0;

  for (const table of TABLES) {
    const rows = await sql.unsafe(`SELECT * FROM ${table}`);
    counts[table] = rows.length;
    totalRows += rows.length;

    // Dates come back as JS Dates; store them as ISO strings so the file is
    // plain text and the restore does not depend on a timezone.
    const plain = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value instanceof Date ? value.toISOString() : value,
        ]),
      ),
    );

    files[`${table}.json`] = Buffer.from(JSON.stringify(plain, null, 0));
    process.stdout.write(
      `  ${table.padEnd(18)} ${String(rows.length).padStart(6)}\n`,
    );
  }

  /* The CSV joins the question to where it lives, which the JSON dumps keep in
     separate tables and would otherwise need four lookups to reconstruct.
     The new bank (`new_*`) is appended so both banks stay readable. */
  const readable = await sql`
    SELECT * FROM (
      SELECT q.id, q.question_text, q.type, q.source, q.standard, q.is_free,
             c.title AS container, s.name AS subitem_name, t.name AS topic_name,
             q.explanation, q.question_image, q.explanation_image
      FROM questions q
      JOIN subitems s ON s.id = q.subitem_id
      JOIN items i ON i.id = s.item_id
      JOIN containers c ON c.id = i.container_id
      LEFT JOIN topics t ON t.id = q.topic_id

      UNION ALL

      SELECT nq.id, nq.question_text, nq.type, nq.source, nq.standard, nq.is_free,
             'নতুন প্রশ্নব্যাংক' AS container, nc.name AS subitem_name,
             nt.name AS topic_name,
             nq.explanation, nq.question_image, nq.explanation_image
      FROM new_questions nq
      JOIN new_chapters nc ON nc.id = nq.chapter_id
      LEFT JOIN new_topics nt ON nt.id = nq.topic_id
    ) rows
    ORDER BY container, subitem_name, id`;
  files["questions.csv"] = Buffer.from(`﻿${toCsv(readable)}`, "utf8");

  const manifest = {
    format: "square-qb-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    totalRows,
    tables: TABLES,
    counts,
  };
  files["manifest.json"] = Buffer.from(JSON.stringify(manifest, null, 2));

  /* 0 = stored, 9 = maximum compression. */
  const zip = zipSync(files, { level: 9 });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(OUT_DIR, `question-bank-${stamp}.zip`);
  fs.writeFileSync(file, zip);

  console.log(
    `\n${path.relative(process.cwd(), file)}  —  ${(zip.length / 1024 / 1024).toFixed(2)} MB, ${totalRows} rows`,
  );

  await sql.end();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});

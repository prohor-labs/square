/**
 * Restores the zip into a scratch schema copy of the real tables, so the
 * restore path is exercised without touching live data.
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const file = path.join(__dirname, "..", "backups", process.argv[2]);
const TABLES = [
  "containers","items","subitems","topics","questions","mcq_options","cq_parts",
  "tags","question_tags","qb_institutes","qb_subjects","qb_chapters",
  "qb_question_meta","exam_questions",
];

(async () => {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const S = "restoretest";

  await sql.unsafe(`DROP SCHEMA IF EXISTS ${S} CASCADE`);
  await sql.unsafe(`CREATE SCHEMA ${S}`);

  // Mirror the live tables, constraints and all, into the scratch schema.
  for (const t of TABLES) {
    await sql.unsafe(`CREATE TABLE ${S}.${t} (LIKE public.${t} INCLUDING ALL)`);
  }

  // Move the data over using the same row order the real restore uses.
  const { unzipSync } = require("fflate");
  const files = unzipSync(new Uint8Array(fs.readFileSync(file)));
  const manifest = JSON.parse(Buffer.from(files["manifest.json"]).toString());

  const CHUNK = 400;

  const runRestore = async (pass) => {
    for (const table of [...TABLES].reverse()) {
      await sql.unsafe(`DELETE FROM ${S}.${table}`);
    }

    let inserted = 0;
    for (const table of TABLES) {
      const raw = files[`${table}.json`];
      if (!raw) continue;
      const rows = JSON.parse(Buffer.from(raw).toString());
      if (!rows.length) continue;

      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `"${c}"`).join(", ");

      for (let i = 0; i < rows.length; i += CHUNK) {
        const batch = rows.slice(i, i + CHUNK);
        const values = [];
        const params = [];
        for (const row of batch) {
          const marks = cols.map((c) => {
            params.push(
              row[c] === null || row[c] === undefined ? null : String(row[c]),
            );
            return `$${params.length}`;
          });
          values.push(`(${marks.join(", ")})`);
        }
        await sql.unsafe(
          `INSERT INTO ${S}.${table} (${colList}) VALUES ${values.join(", ")} ON CONFLICT DO NOTHING`,
          params,
        );
      }
      inserted += rows.length;
      console.log(`  ${table.padEnd(18)} ${String(rows.length).padStart(6)}`);
    }
    return inserted;
  };

  const first = await runRestore(1);
  console.log(`\nপ্রথমবার: ${first} রো (ফাইলে ছিল ${manifest.totalRows})`);

  // The point of the exercise: uploading the very same file again must land on
  // the very same rows, not a second copy of them.
  console.log("\n=== একই ফাইল দ্বিতীয়বার আপলোড ===");
  const second = await runRestore(2);
  console.log(`দ্বিতীয়বার: ${second} রো`);
  console.log(
    first === second ? "ফলাফল একই — ডুপ্লিকেট হয়নি ✓" : "ফলাফল আলাদা — ডুপ্লিকেট হয়েছে ✗",
  );
  console.log("");

  // Row-for-row against the live tables.
  console.log("=== লাইভ ডেটাবেসের সাথে তুলনা ===");
  let bad = 0;
  for (const t of TABLES) {
    const [a] = await sql.unsafe(`SELECT count(*)::int n FROM ${S}.${t}`);
    const [b] = await sql.unsafe(`SELECT count(*)::int n FROM public.${t}`);
    const ok = a.n === b.n;
    if (!ok) bad++;
    console.log(`  ${ok ? "✓" : "✗"} ${t.padEnd(18)} backup ${String(a.n).padStart(6)} | live ${String(b.n).padStart(6)}`);
  }

  // The joins the site actually runs have to survive.
  const [walk] = await sql.unsafe(`
    SELECT count(*)::int n FROM ${S}.questions q
    JOIN ${S}.subitems s ON s.id = q.subitem_id
    JOIN ${S}.items i ON i.id = s.item_id
    JOIN ${S}.containers c ON c.id = i.container_id`);
  console.log(`\nচেইন join (questions→container): ${walk.n} (সব প্রশ্ন হওয়া উচিত)`);

  const [meta] = await sql.unsafe(`
    SELECT count(*)::int n FROM ${S}.qb_question_meta m
    JOIN ${S}.questions q ON q.id = m.question_id
    JOIN ${S}.qb_chapters ch ON ch.id = m.chapter_id
    JOIN ${S}.qb_subjects sb ON sb.id = m.subject_id`);
  console.log(`বিষয়ভিত্তিক join: ${meta.n} (ডেটাবেসে বর্তমানে 7294)`);

  const [orphans] = await sql.unsafe(`
    SELECT count(*)::int n FROM ${S}.qb_question_meta m
    LEFT JOIN ${S}.questions q ON q.id = m.question_id WHERE q.id IS NULL`);
  console.log(`অনাথ প্রশ্নের মেটাডেটা: ${orphans.n} (অবশ্যই 0)`);

  const [dup] = await sql.unsafe(`
    SELECT count(*)::int n FROM (SELECT question_id FROM ${S}.qb_question_meta
    GROUP BY question_id HAVING count(*) > 1) x`);
  console.log(`duplicate মেটাডেটা: ${dup.n} (অবশ্যই 0)`);

  const [eq] = await sql.unsafe(`
    SELECT count(*)::int n FROM ${S}.exam_questions e
    LEFT JOIN ${S}.questions q ON q.id = e.question_id WHERE q.id IS NULL`);
  console.log(`ভাঙা পরীক্ষার প্রশ্ন: ${eq.n} (অবশ্যই 0)`);

  console.log(`\nমিলযোগ্যতার ভাঙা টেবিল: ${bad}`);
  await sql.unsafe(`DROP SCHEMA ${S} CASCADE`);
  console.log("স্ক্র্যাচ schema মুছে ফেলা হয়েছে।");

  await sql.end();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });

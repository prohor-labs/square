const postgres = require("postgres");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });
const FILE = "qb-nav-inspect2.txt";
const out = [];
const flush = () => fs.writeFileSync(FILE, out.join("\n"), "utf8");
const log = (...a) => { out.push(a.map(String).join(" ")); flush(); };

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15, onnotice: () => {} });

  const grp = await sql`
    SELECT group_name, unit_name, count(*)::int AS n
    FROM qb_question_meta WHERE group_name <> '' GROUP BY group_name, unit_name ORDER BY n DESC`;
  log("== group_name / unit_name ==");
  grp.forEach((r) => log("  [" + r.group_name + "] unit=[" + r.unit_name + "] n=" + r.n));

  const inst = await sql`
    SELECT i.type, i.name, count(*)::int AS n
    FROM qb_question_meta m JOIN qb_institutes i ON i.id = m.institute_id
    GROUP BY i.type, i.name ORDER BY i.type, n DESC`;
  log("== institute usage ==");
  inst.forEach((r) => log("  [" + r.type + "] " + r.name + " n=" + r.n));

  const subj = await sql`
    SELECT s.name, s.paper, count(*)::int AS n
    FROM qb_question_meta m JOIN qb_subjects s ON s.id = m.subject_id
    GROUP BY s.name, s.paper ORDER BY n DESC`;
  log("== subject usage ==");
  subj.forEach((r) => log("  " + r.name + " | paper=[" + r.paper + "] n=" + r.n));

  const allSubj = await sql`SELECT name, paper FROM qb_subjects ORDER BY order_no, name`;
  log("== all qb_subjects ==");
  allSubj.forEach((r) => log("  " + r.name + " | [" + r.paper + "]"));

  // subitem/container sample to reuse for demo
  const sub = await sql`SELECT s.id, s.name, s.slug FROM subitems s LIMIT 5`;
  log("== sample subitems ==");
  sub.forEach((r) => log("  " + r.id + " " + r.name + " " + r.slug));

  await sql.end();
  log("done");
}
main().catch((e) => log("FATAL: " + (e.stack || e.message)));

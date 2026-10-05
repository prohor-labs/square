/**
 * Read-only test of the admin students query (same SQL, no auth guard).
 */
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "./src/db";
import { batchEnrollments, batchMembers, batches, user } from "./src/db/schema";

const PAGE_SIZE = 25;

function buildFilter(search: string) {
  return search
    ? and(
        eq(user.role, "student"),
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(user.college, `%${search}%`),
          ilike(user.school, `%${search}%`),
          ilike(user.id, `%${search}%`),
        ),
      )
    : eq(user.role, "student");
}

async function run(search: string, page: number) {
  const filter = buildFilter(search);

  const countRows = await db.select({ n: count() }).from(user).where(filter);
  const total = countRows[0]?.n ?? 0;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clamped = Math.min(Math.max(1, page), pageCount);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      school: user.school,
      college: user.college,
      joinedAt: user.createdAt,
    })
    .from(user)
    .where(filter)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE)
    .offset((clamped - 1) * PAGE_SIZE);

  const userIds = rows.map((r) => r.id);
  let courseNames: string[] = [];
  if (userIds.length) {
    const [enr, mem] = await Promise.all([
      db
        .select({ userId: batchEnrollments.userId, batchName: batches.name })
        .from(batchEnrollments)
        .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
        .where(
          and(
            inArray(batchEnrollments.userId, userIds),
            eq(batchEnrollments.status, "active"),
          ),
        ),
      db
        .select({ userId: batchMembers.userId, batchName: batches.name })
        .from(batchMembers)
        .innerJoin(batches, eq(batchMembers.batchId, batches.id))
        .where(
          and(
            inArray(batchMembers.userId, userIds),
            eq(batchMembers.status, "active"),
          ),
        ),
    ]);
    const map = new Map<string, string[]>();
    for (const r of [...enr, ...mem]) {
      const l = map.get(r.userId) ?? [];
      if (!l.includes(r.batchName)) l.push(r.batchName);
      map.set(r.userId, l);
    }
    courseNames = [...map.values()].flat();
  }

  console.log('search="' + search + '"  requested page=' + page + "  -> clamped to " + clamped);
  console.log("  total=" + total + "  pageCount=" + pageCount + "  rows=" + rows.length);
  for (const r of rows.slice(0, 4)) {
    console.log(
      "    " +
        r.name.padEnd(22) +
        " | school=" +
        String(r.school).padEnd(14) +
        " | college=" +
        String(r.college).padEnd(22),
    );
  }
  console.log("  distinct course names: " + new Set(courseNames).size);
  console.log("");
}

async function main() {
  console.log("all students, page 1");
  await run("", 1);
  console.log("out-of-range page 999 (must clamp)");
  await run("", 999);
  console.log("bangla college search");
  await run("কলেজ", 1);
  console.log("email domain search");
  await run("@", 1);
  console.log("no match");
  await run("zzzz-no-such-student", 1);
  console.log("DONE");
}

main();

"use server";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { batchEnrollments, batches, batchMembers, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 25;

export interface AdminStudentRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image: string | null;
  readonly school: string | null;
  readonly college: string | null;
  readonly hscBatch: string | null;
  readonly joinedAt: Date;
  readonly courseCount: number;
  readonly courses: readonly string[];
}

export interface AdminStudentsResult {
  readonly rows: readonly AdminStudentRow[];
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
}

/** Throws unless the caller is a signed-in admin. */
async function assertAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("লগইন করা নেই");

  const row = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId));

  if (row[0]?.role !== "admin") throw new Error("অনুমতি নেই");
}

/** Admins excluded; search matches name, email, id, school or college. */
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

/**
 * Every student account in one list, searchable and paginated.
 *
 * A student's courses come from both access routes — a paid enrolment and a
 * direct member add — so the count here matches what the student sees on their
 * own profile and on the exams page.
 */
export async function getAdminStudents(options?: {
  search?: string;
  page?: number;
}): Promise<AdminStudentsResult> {
  await assertAdmin();

  const search = (options?.search ?? "").trim();
  const filter = buildFilter(search);

  // Total first, so an out-of-range page can be clamped before querying rows.
  const countRows = await db.select({ n: count() }).from(user).where(filter);
  const total = countRows[0]?.n ?? 0;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, options?.page ?? 1), pageCount);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      school: user.school,
      college: user.college,
      hscBatch: user.hscBatch,
      joinedAt: user.createdAt,
    })
    .from(user)
    .where(filter)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  if (rows.length === 0) {
    return { rows: [], total, page, pageCount };
  }

  const userIds = rows.map((r) => r.id);

  // Both access routes, resolved to batch names.
  const [enrollmentRows, memberRows] = await Promise.all([
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

  const coursesByUser = new Map<string, string[]>();
  for (const row of [...enrollmentRows, ...memberRows]) {
    const list = coursesByUser.get(row.userId) ?? [];
    if (!list.includes(row.batchName)) list.push(row.batchName);
    coursesByUser.set(row.userId, list);
  }

  return {
    rows: rows.map((row) => {
      const courses = coursesByUser.get(row.id) ?? [];
      return { ...row, courses, courseCount: courses.length };
    }),
    total,
    page,
    pageCount,
  };
}

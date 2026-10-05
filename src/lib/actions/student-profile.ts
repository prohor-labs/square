"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { batchEnrollments, batchMembers, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface EnrolledCourse {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly hscBatch: string;
  readonly badge: string | null;
  readonly image: string | null;
  /** How the student joined — paid enrolment or a direct member add. */
  readonly via: "enrollment" | "member";
}

/**
 * The courses a student is currently in.
 *
 * A student can arrive at a batch two ways: a paid enrolment record, or being
 * added directly as a member by an admin. Both grant access to that batch's
 * exams, so the profile must list both — otherwise it would disagree with the
 * exams page.
 */
export async function getStudentEnrolledCourses(
  userId: string,
): Promise<EnrolledCourse[]> {
  const [enrollments, memberships] = await Promise.all([
    db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.userId, userId),
        eq(batchEnrollments.status, "active"),
      ),
      with: {
        batch: {
          columns: {
            id: true,
            name: true,
            slug: true,
            hscBatch: true,
            badge: true,
            image: true,
          },
        },
      },
      orderBy: (row, { desc }) => [desc(row.enrolledAt)],
    }),
    db.query.batchMembers.findMany({
      where: and(
        eq(batchMembers.userId, userId),
        eq(batchMembers.status, "active"),
      ),
      with: {
        batch: {
          columns: {
            id: true,
            name: true,
            slug: true,
            hscBatch: true,
            badge: true,
            image: true,
          },
        },
      },
      orderBy: (row, { desc }) => [desc(row.joinedAt)],
    }),
  ]);

  const seen = new Set<string>();
  const courses: EnrolledCourse[] = [];

  for (const row of enrollments) {
    if (!row.batch || seen.has(row.batch.id)) continue;
    seen.add(row.batch.id);
    courses.push({ ...row.batch, via: "enrollment" });
  }

  for (const row of memberships) {
    if (!row.batch || seen.has(row.batch.id)) continue;
    seen.add(row.batch.id);
    courses.push({ ...row.batch, via: "member" });
  }

  return courses;
}

export interface StudentIdentity {
  readonly school: string | null;
  readonly college: string | null;
}

/** School and college as recorded on the signed-in student's own row. */
export async function getStudentIdentity(
  userId: string,
): Promise<StudentIdentity> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { school: true, college: true },
  });

  return { school: row?.school ?? null, college: row?.college ?? null };
}

/**
 * Saves the signed-in student's own school and college.
 *
 * Only the caller's own row is touched — the user id always comes from the
 * session, never from the payload, so a student cannot rewrite someone else's
 * profile by guessing an id.
 */
export async function updateStudentIdentity(data: {
  school?: string | null;
  college?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "লগইন করা নেই" };

    const clean = (value: string | null | undefined) => {
      const trimmed = (value ?? "").trim();
      return trimmed === "" ? null : trimmed;
    };

    await db
      .update(user)
      .set({ school: clean(data.school), college: clean(data.college) })
      .where(eq(user.id, userId));

    revalidatePath("/profile");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "তথ্য সেভ করা যায়নি",
    };
  }
}

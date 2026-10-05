"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { batchEnrollments, batchMembers } from "@/db/schema";

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

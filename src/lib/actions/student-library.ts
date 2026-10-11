"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  batchEnrollments,
  batches,
  batchMembers,
  courseClasses,
  examSubmissions,
  exams,
} from "@/db/schema";

/**
 * Batches the student is currently in, from both membership routes: a paid
 * enrolment and a direct batch member row. Same union the dashboard uses, so
 * the sidebar and the dashboard never disagree about what "my course" means.
 */
async function getEnrolledBatchIds(userId: string): Promise<string[]> {
  const [enrollments, memberships] = await Promise.all([
    db
      .select({ batchId: batchEnrollments.batchId })
      .from(batchEnrollments)
      .where(
        and(
          eq(batchEnrollments.userId, userId),
          eq(batchEnrollments.status, "active"),
        ),
      ),
    db
      .select({ batchId: batchMembers.batchId })
      .from(batchMembers)
      .where(
        and(eq(batchMembers.userId, userId), eq(batchMembers.status, "active")),
      ),
  ]);

  return Array.from(
    new Set([...enrollments, ...memberships].map((r) => r.batchId)),
  );
}

export interface StudentClass {
  readonly id: string;
  readonly batchId: string;
  readonly batchName: string;
  readonly title: string;
  readonly subject: string;
  readonly chapter: string | null;
  readonly description: string | null;
  readonly youtubeUrl: string;
  readonly durationMinutes: number;
  readonly orderIndex: number;
  readonly isLive: boolean;
  readonly createdAt: Date;
}

/**
 * Every published class across the student's courses, in one query. Fetching
 * per batch would mean one round trip per course the student is in.
 */
export async function getStudentClasses(
  userId: string,
): Promise<readonly StudentClass[]> {
  const batchIds = await getEnrolledBatchIds(userId);
  if (batchIds.length === 0) return [];

  const rows = await db
    .select({
      id: courseClasses.id,
      batchId: courseClasses.batchId,
      title: courseClasses.title,
      subject: courseClasses.subject,
      chapter: courseClasses.chapter,
      description: courseClasses.description,
      youtubeUrl: courseClasses.youtubeUrl,
      durationMinutes: courseClasses.durationMinutes,
      orderIndex: courseClasses.orderIndex,
      isLive: courseClasses.isLive,
      createdAt: courseClasses.createdAt,
      batchName: batches.name,
    })
    .from(courseClasses)
    .innerJoin(batches, eq(courseClasses.batchId, batches.id))
    .where(
      and(
        inArray(courseClasses.batchId, batchIds),
        eq(courseClasses.isPublished, true),
      ),
    )
    .orderBy(desc(courseClasses.createdAt));

  return rows.map((r) => ({
    ...r,
    durationMinutes: r.durationMinutes ?? 0,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
  }));
}

export interface StudentSubmission {
  readonly id: string;
  readonly examSlug: string;
  readonly examTitle: string;
  readonly examType: string;
  readonly score: number;
  readonly totalMarks: number;
  readonly attemptNumber: number;
  readonly timeTakenSeconds: number;
  readonly isLiveAttempt: boolean;
  readonly submittedAt: Date | null;
}

/**
 * The student's own exam attempts, newest first. Practice attempts are kept —
 * they belong on the performance page even though they stay out of the merit
 * list.
 */
export async function getStudentSubmissions(
  userId: string,
): Promise<readonly StudentSubmission[]> {
  const rows = await db
    .select({
      id: examSubmissions.id,
      score: examSubmissions.score,
      totalMarks: examSubmissions.totalMarks,
      attemptNumber: examSubmissions.attemptNumber,
      timeTakenSeconds: examSubmissions.timeTakenSeconds,
      isLiveAttempt: examSubmissions.isLiveAttempt,
      submittedAt: examSubmissions.submittedAt,
      examSlug: exams.slug,
      examTitle: exams.title,
      examType: exams.type,
    })
    .from(examSubmissions)
    .innerJoin(exams, eq(examSubmissions.examId, exams.id))
    .where(eq(examSubmissions.userId, userId))
    .orderBy(
      desc(examSubmissions.submittedAt),
      desc(examSubmissions.startedAt),
    );

  return rows.map((r) => ({
    ...r,
    score: Number.parseFloat(r.score) || 0,
    submittedAt:
      r.submittedAt instanceof Date
        ? r.submittedAt
        : new Date(r.submittedAt ?? 0),
  }));
}

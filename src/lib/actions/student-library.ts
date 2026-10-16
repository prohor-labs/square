"use server";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  batchArchivedExams,
  batchDetails,
  batchEnrollments,
  batchExams,
  batches,
  batchMembers,
  batchRoutineImages,
  courseClasses,
  examQuestions,
  examResponses,
  examSubmissions,
  exams,
  mcqOptions,
  questions,
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
  /** Course the exam was taken under; blank for a standalone practice exam. */
  readonly courseName: string;
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
      courseName: batches.name,
    })
    .from(examSubmissions)
    .innerJoin(exams, eq(examSubmissions.examId, exams.id))
    .leftJoin(batchExams, eq(examSubmissions.batchExamId, batchExams.id))
    .leftJoin(batches, eq(batches.id, batchExams.batchId))
    .where(eq(examSubmissions.userId, userId))
    .orderBy(
      desc(examSubmissions.submittedAt),
      desc(examSubmissions.startedAt),
    );

  return rows.map((r) => ({
    ...r,
    courseName: r.courseName ?? "",
    score: Number.parseFloat(r.score) || 0,
    submittedAt:
      r.submittedAt instanceof Date
        ? r.submittedAt
        : new Date(r.submittedAt ?? 0),
  }));
}

/**
 * Every question the student got wrong, with its options, newest first. A
 * question missed in three exams appears once — the bank is meant for review,
 * not for counting mistakes.
 */
export async function getWrongAnswers(userId: string): Promise<
  readonly {
    question: typeof questions.$inferSelect;
    options: (typeof mcqOptions.$inferSelect)[];
    examTitle: string;
    courseName: string;
  }[]
> {
  const rows = await db
    .select({
      question: questions,
      examTitle: exams.title,
      courseName: batches.name,
    })
    .from(examResponses)
    .innerJoin(
      examQuestions,
      eq(examResponses.examQuestionId, examQuestions.id),
    )
    .innerJoin(questions, eq(examQuestions.questionId, questions.id))
    .innerJoin(
      examSubmissions,
      eq(examResponses.submissionId, examSubmissions.id),
    )
    .innerJoin(exams, eq(examSubmissions.examId, exams.id))
    .leftJoin(batchExams, eq(examSubmissions.batchExamId, batchExams.id))
    .leftJoin(batches, eq(batches.id, batchExams.batchId))
    .where(
      and(
        eq(examResponses.isCorrect, false),
        eq(examSubmissions.userId, userId),
      ),
    )
    .orderBy(desc(examSubmissions.submittedAt));

  const firstSeen = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!firstSeen.has(row.question.id)) {
      firstSeen.set(row.question.id, row);
    }
  }
  if (firstSeen.size === 0) return [];

  const optionRows = await db
    .select()
    .from(mcqOptions)
    .where(inArray(mcqOptions.questionId, [...firstSeen.keys()]))
    .orderBy(mcqOptions.orderNo);

  const optionsByQuestion = new Map<
    string,
    (typeof mcqOptions.$inferSelect)[]
  >();
  for (const option of optionRows) {
    const list = optionsByQuestion.get(option.questionId) ?? [];
    list.push(option);
    optionsByQuestion.set(option.questionId, list);
  }

  return [...firstSeen.values()].map((row) => ({
    question: row.question,
    options: optionsByQuestion.get(row.question.id) ?? [],
    examTitle: row.examTitle,
    courseName: row.courseName ?? "",
  }));
}

export interface ArchiveExam {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly standard: string;
  readonly totalMarks: number;
  readonly durationMinutes: number;
  /** The courses in this student's list that archive the exam, by name. */
  readonly courses: readonly string[];
}

/**
 * Past exams archived for a course the student is enrolled in.
 *
 * The archive is kept per batch, so this only returns exams an admin ticked on
 * one of the student's own courses — an exam archived for some other batch is
 * invisible here.
 */
export async function getArchivedExams(
  userId: string,
): Promise<readonly ArchiveExam[]> {
  const batchIds = await getEnrolledBatchIds(userId);
  if (batchIds.length === 0) return [];

  const rows = await db
    .select({
      id: exams.id,
      slug: exams.slug,
      title: exams.title,
      standard: exams.standard,
      totalMarks: exams.totalMarks,
      durationMinutes: exams.durationMinutes,
      courseName: batches.name,
    })
    .from(batchArchivedExams)
    .innerJoin(exams, eq(exams.id, batchArchivedExams.examId))
    .innerJoin(batches, eq(batches.id, batchArchivedExams.batchId))
    .where(
      and(
        inArray(batchArchivedExams.batchId, batchIds),
        eq(exams.isPublished, true),
      ),
    )
    .orderBy(desc(batchArchivedExams.addedAt));

  const byId = new Map<string, ArchiveExam>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    const course = row.courseName;
    if (existing) {
      if (course && !existing.courses.includes(course)) {
        (existing.courses as string[]).push(course);
      }
      continue;
    }
    byId.set(row.id, {
      id: row.id,
      slug: row.slug,
      title: row.title,
      standard: row.standard,
      totalMarks: row.totalMarks,
      durationMinutes: row.durationMinutes,
      courses: course ? [course] : [],
    });
  }

  return [...byId.values()];
}

export interface StudentCourse {
  readonly batchId: string;
  readonly title: string;
  readonly liveCount: number;
  readonly recordedCount: number;
}

/**
 * Every course the student is in, with how many live and recorded classes each
 * has. The live and past class pages use this for their course picker.
 */
export async function getStudentCourseList(
  userId: string,
): Promise<readonly StudentCourse[]> {
  const batchIds = await getEnrolledBatchIds(userId);
  if (batchIds.length === 0) return [];

  const [courseRows, classRows] = await Promise.all([
    db
      .select({ batchId: batches.id, title: batches.name })
      .from(batches)
      .where(inArray(batches.id, batchIds)),
    db
      .select({ batchId: courseClasses.batchId, isLive: courseClasses.isLive })
      .from(courseClasses)
      .where(
        and(
          inArray(courseClasses.batchId, batchIds),
          eq(courseClasses.isPublished, true),
        ),
      ),
  ]);

  return courseRows.map((course) => {
    const own = classRows.filter((c) => c.batchId === course.batchId);
    return {
      batchId: course.batchId,
      title: course.title,
      liveCount: own.filter((c) => c.isLive).length,
      recordedCount: own.filter((c) => !c.isLive).length,
    };
  });
}

/**
 * Every course the student is in that has a routine to show.
 *
 * A course qualifies either because the admin added routine pictures or because
 * an older routine link is still on it, so nothing disappears mid-migration.
 */
export async function getStudentRoutines(userId: string): Promise<
  readonly {
    title: string;
    slug: string;
    /** Blank when the course has no legacy link. */
    routineUrl: string;
    batchId: string;
    hasImages: boolean;
  }[]
> {
  const batchIds = await getEnrolledBatchIds(userId);
  if (batchIds.length === 0) return [];

  const rows = await db
    .select({
      title: batches.name,
      slug: batches.slug,
      routineUrl: batchDetails.routineUrl,
      batchId: batches.id,
    })
    .from(batches)
    .innerJoin(batchDetails, eq(batchDetails.batchId, batches.id))
    .where(inArray(batches.id, batchIds));

  const counts = await db
    .select({
      batchId: batchRoutineImages.batchId,
      total: count(batchRoutineImages.id),
    })
    .from(batchRoutineImages)
    .where(inArray(batchRoutineImages.batchId, batchIds))
    .groupBy(batchRoutineImages.batchId);

  const pagesByBatch = new Map(
    counts.map((row) => [row.batchId, Number(row.total)]),
  );

  return rows
    .map((row) => ({
      title: row.title,
      slug: row.slug,
      routineUrl: row.routineUrl ?? "",
      batchId: row.batchId,
      hasImages: (pagesByBatch.get(row.batchId) ?? 0) > 0,
    }))
    .filter((row) => row.hasImages || Boolean(row.routineUrl));
}

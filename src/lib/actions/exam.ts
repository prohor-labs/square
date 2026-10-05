"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  batchEnrollments,
  batchExams,
  batchMembers,
  examQuestions,
  examResponses,
  examSubmissions,
  exams,
  user,
} from "@/db/schema";
import { isLiveAt } from "@/lib/exam-window";
import type { ExamDetail, ExamSubmission, LeaderboardEntry } from "@/types";

/**
 * Returns public practice exams that are published.
 */
export async function getPublishedExams() {
  try {
    const allAssignedBatchExams = await db
      .select({ examId: batchExams.examId })
      .from(batchExams);
    const assignedExamIds = allAssignedBatchExams.map((be) => be.examId);

    const list = await db.query.exams.findMany({
      where: and(eq(exams.isPublished, true), eq(exams.type, "practice")),
      orderBy: [desc(exams.createdAt)],
    });

    const unassignedPracticeExams = list.filter(
      (e) => !assignedExamIds.includes(e.id),
    );

    return { success: true, data: unassignedPracticeExams as ExamDetail[] };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch published exams",
      data: [],
    };
  }
}

/**
 * Get full exam details including questions and options for taking the exam.
 */
export async function getExamBySlug(slug: string) {
  try {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.slug, slug),
      with: {
        examQuestions: {
          orderBy: (eqs, { asc }) => [asc(eqs.orderNo)],
          with: {
            question: {
              with: {
                mcqOptions: {
                  orderBy: (opts, { asc }) => [asc(opts.orderNo)],
                },
                cqParts: {
                  orderBy: (parts, { asc }) => [asc(parts.orderNo)],
                },
              },
            },
          },
        },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };
    return { success: true, data: exam as unknown as ExamDetail };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam",
    };
  }
}

/**
 * Get all exams assigned to a student via their batch memberships.
 */
export async function getStudentExams(userId: string) {
  try {
    // 1. Get batch IDs from direct batch memberships
    const userBatchMemberships = await db.query.batchMembers.findMany({
      where: and(
        eq(batchMembers.userId, userId),
        eq(batchMembers.status, "active"),
      ),
    });

    const memberBatchIds = userBatchMemberships.map((bm) => bm.batchId);

    // 2. Get batch IDs from active course enrollments
    const userEnrollments = await db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.userId, userId),
        eq(batchEnrollments.status, "active"),
      ),
    });

    const enrolledBatchIds = userEnrollments.map((e) => e.batchId);

    const allBatchIds = Array.from(
      new Set([...memberBatchIds, ...enrolledBatchIds]),
    );

    if (allBatchIds.length === 0) return { success: true, data: [] };

    const bExams = await db.query.batchExams.findMany({
      where: inArray(batchExams.batchId, allBatchIds),
      with: {
        exam: true,
        // Needed for the "which batch is this for?" picker on live cards.
        batch: {
          columns: { id: true, name: true, hscBatch: true },
        },
      },
      orderBy: [desc(batchExams.assignedAt)],
    });

    return { success: true, data: bExams };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch student exams",
      data: [],
    };
  }
}

/**
 * Check if user can access an exam (either via batch assignment or it's a public practice exam).
 */
export async function checkExamAccess(userId: string, examId: string) {
  try {
    const [exam, currentUser] = await Promise.all([
      db.query.exams.findFirst({
        where: eq(exams.id, examId),
      }),
      db.query.user.findFirst({
        where: eq(user.id, userId),
      }),
    ]);

    if (!exam) return { allowed: false, error: "Exam not found" };

    // 1. Admin, moderator, or exam creator always has access to preview/take exams
    if (
      currentUser?.role === "admin" ||
      currentUser?.role === "moderator" ||
      exam.createdBy === userId
    ) {
      const firstBatchExam = await db.query.batchExams.findFirst({
        where: eq(batchExams.examId, examId),
      });
      return { allowed: true, batchExamId: firstBatchExam?.id || null };
    }

    if (exam.type === "practice" && exam.isPublished) {
      return { allowed: true, batchExamId: null };
    }

    const bExams = await db.query.batchExams.findMany({
      where: eq(batchExams.examId, examId),
    });

    if (bExams.length === 0)
      return { allowed: false, error: "Not assigned to any batch" };

    const targetBatchIds = bExams.map((be) => be.batchId);

    // Check previous submissions for this user
    const userSubmissions = await db.query.examSubmissions.findMany({
      where: and(
        eq(examSubmissions.examId, examId),
        eq(examSubmissions.userId, userId),
      ),
      orderBy: [desc(examSubmissions.startedAt)],
    });

    const previousAttemptsCount = userSubmissions.length;
    const latestSubmission = userSubmissions[0] || null;

    // 2. Direct batch membership check
    const membership = await db.query.batchMembers.findFirst({
      where: and(
        eq(batchMembers.userId, userId),
        inArray(batchMembers.batchId, targetBatchIds),
        eq(batchMembers.status, "active"),
      ),
    });

    if (membership) {
      const relatedBatchExam = bExams.find(
        (be) => be.batchId === membership.batchId,
      );
      return {
        allowed: true,
        batchExamId: relatedBatchExam?.id,
        previousAttemptsCount,
        latestSubmissionId: latestSubmission?.id || null,
        latestSubmissionStatus: latestSubmission?.status || null,
      };
    }

    // 3. Batch enrollment check
    const enrollment = await db.query.batchEnrollments.findFirst({
      where: and(
        eq(batchEnrollments.userId, userId),
        inArray(batchEnrollments.batchId, targetBatchIds),
        eq(batchEnrollments.status, "active"),
      ),
    });

    if (enrollment) {
      const relatedBatchExam = bExams.find(
        (be) => be.batchId === enrollment.batchId,
      );
      return {
        allowed: true,
        batchExamId: relatedBatchExam?.id || bExams[0]?.id || null,
        previousAttemptsCount,
        latestSubmissionId: latestSubmission?.id || null,
        latestSubmissionStatus: latestSubmission?.status || null,
      };
    }

    return { allowed: false, error: "You do not have access to this exam" };
  } catch (_error: unknown) {
    return { allowed: false, error: "Access check failed" };
  }
}

/**
 * Start an exam (creates in_progress submission)
 */
export async function startExamAction(
  examId: string,
  userId: string,
  batchExamId?: string,
) {
  try {
    // Determine attempt number
    const prevSubmissions = await db.query.examSubmissions.findMany({
      where: and(
        eq(examSubmissions.examId, examId),
        eq(examSubmissions.userId, userId),
      ),
    });

    const attemptNumber = prevSubmissions.length + 1;

    // Freeze whether this counts as a live attempt at the moment it starts.
    // Missing batchExamId means an open practice exam, which is never live.
    const scheduled = batchExamId
      ? await db.query.batchExams.findFirst({
          where: eq(batchExams.id, batchExamId),
        })
      : null;

    const isLiveAttempt = isLiveAt({
      startsAt: scheduled?.startsAt,
      endsAt: scheduled?.endsAt,
    });

    // We start with 0 marks, they will be updated on submit
    const res = await db
      .insert(examSubmissions)
      .values({
        examId,
        userId,
        batchExamId: batchExamId || null,
        score: "0",
        totalMarks: 0,
        attemptNumber,
        status: "in_progress",
        timeTakenSeconds: 0,
        isLiveAttempt,
      })
      .returning();

    return {
      success: true,
      submission: res[0] as ExamSubmission,
      isLiveAttempt,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start exam",
    };
  }
}

export interface SubmitResponsePayload {
  examQuestionId: string;
  selectedOptionId?: string | null;
  cqAnswerText?: string | null;
}

/**
 * Submit an exam (saves responses, calculates score)
 */
export async function submitExamAction(
  submissionId: string,
  responses: SubmitResponsePayload[],
  timeTakenSeconds: number,
) {
  try {
    const submission = await db.query.examSubmissions.findFirst({
      where: eq(examSubmissions.id, submissionId),
      with: {
        exam: true,
      },
    });

    if (!submission) return { success: false, error: "Submission not found" };
    if (submission.status !== "in_progress") {
      return { success: true, submission };
    }

    const exam = submission.exam;
    if (!exam) return { success: false, error: "Exam data missing" };

    const examQs = await db.query.examQuestions.findMany({
      where: eq(examQuestions.examId, exam.id),
      with: {
        question: {
          with: { mcqOptions: true },
        },
      },
    });

    let totalScore = 0;
    const negativeMark = parseFloat(exam.negativeMarking || "0");
    const totalExamMarks = examQs.reduce((acc, q) => acc + q.marks, 0);

    interface InsertResponse {
      submissionId: string;
      examQuestionId: string;
      selectedOptionId: string | null;
      cqAnswerText: string | null;
      isCorrect: boolean;
      marksObtained: string;
    }

    const insertResponses: InsertResponse[] = examQs.map((eqData) => {
      const userResp = responses.find((r) => r.examQuestionId === eqData.id);
      const selectedOptionId = userResp?.selectedOptionId || null;
      const cqAnswerText = userResp?.cqAnswerText || null;

      let isCorrect = false;
      let marksObtained = 0;

      if (!selectedOptionId && !cqAnswerText) {
        isCorrect = false;
        marksObtained = 0;
      } else if (eqData.question?.type === "mcq") {
        const correctOpt = eqData.question.mcqOptions.find((o) => o.isCorrect);
        if (correctOpt && correctOpt.id === selectedOptionId) {
          isCorrect = true;
          marksObtained = eqData.marks;
        } else if (selectedOptionId) {
          // Attempted but wrong -> negative marking
          isCorrect = false;
          marksObtained = -negativeMark;
        }
      } else {
        // CQ evaluation is manual later
        isCorrect = false;
        marksObtained = 0;
      }

      totalScore += marksObtained;

      return {
        submissionId,
        examQuestionId: eqData.id,
        selectedOptionId,
        cqAnswerText,
        isCorrect,
        marksObtained: marksObtained.toString(),
      };
    });

    if (insertResponses.length > 0) {
      await db
        .delete(examResponses)
        .where(eq(examResponses.submissionId, submissionId));
      await db.insert(examResponses).values(insertResponses);
    }

    const updated = await db
      .update(examSubmissions)
      .set({
        score: totalScore.toString(),
        totalMarks: totalExamMarks,
        status: "submitted",
        timeTakenSeconds,
        submittedAt: new Date(),
      })
      .where(eq(examSubmissions.id, submissionId))
      .returning();

    revalidatePath(`/exams/${exam.slug}`);
    return { success: true, submission: updated[0] };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit exam",
    };
  }
}

/**
 * Get detailed submission result.
 */
export async function getSubmissionResult(
  submissionId: string,
  userId: string,
) {
  try {
    const submission = await db.query.examSubmissions.findFirst({
      where: and(
        eq(examSubmissions.id, submissionId),
        eq(examSubmissions.userId, userId),
      ),
      with: {
        exam: true,
        responses: {
          with: {
            examQuestion: {
              with: {
                question: {
                  with: {
                    mcqOptions: true,
                    cqParts: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) return { success: false, error: "Result not found" };

    // Fetch all exam questions to guarantee 100% of questions are displayed in result
    const allExamQuestions = await db.query.examQuestions.findMany({
      where: eq(examQuestions.examId, submission.examId),
      orderBy: (eqs, { asc }) => [asc(eqs.orderNo)],
      with: {
        question: {
          with: {
            mcqOptions: true,
            cqParts: true,
          },
        },
      },
    });

    // Merge existing responses with full exam questions list
    const existingResponses = submission.responses || [];
    const completeResponses = allExamQuestions.map((eqData) => {
      const found = existingResponses.find(
        (r) => r.examQuestionId === eqData.id,
      );
      if (found) return found;
      return {
        id: `unattempted-${eqData.id}`,
        submissionId: submission.id,
        examQuestionId: eqData.id,
        selectedOptionId: null,
        cqAnswerText: null,
        isCorrect: false,
        marksObtained: "0",
        examQuestion: eqData,
      };
    });

    return {
      success: true,
      data: {
        ...submission,
        responses: completeResponses,
      },
    };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to fetch result" };
  }
}

/**
 * Get exam leaderboard.
 */
export async function getExamLeaderboard(examId: string) {
  try {
    // Only attempts that began inside the scheduled window reach the merit
    // list; practice attempts are deliberately excluded.
    const list = await db.query.examSubmissions.findMany({
      where: and(
        eq(examSubmissions.examId, examId),
        eq(examSubmissions.status, "submitted"),
        eq(examSubmissions.isLiveAttempt, true),
      ),
      with: {
        user: true,
      },
      orderBy: [
        asc(examSubmissions.attemptNumber),
        asc(examSubmissions.startedAt),
      ],
    });

    // Take only the FIRST attempt (attemptNumber === 1) for each user so subsequent practice attempts do not alter the merit list
    const firstAttemptsMap = new Map<string, (typeof list)[0]>();
    for (const sub of list) {
      if (!firstAttemptsMap.has(sub.userId)) {
        firstAttemptsMap.set(sub.userId, sub);
      }
    }

    const uniqueFirstAttempts = Array.from(firstAttemptsMap.values());

    // Sort by score DESC, then timeTakenSeconds ASC
    const sorted = uniqueFirstAttempts.sort((a, b) => {
      const scoreA = parseFloat(a.score);
      const scoreB = parseFloat(b.score);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });

    const leaderboard: LeaderboardEntry[] = sorted.map((s, idx) => ({
      rank: idx + 1,
      userId: s.userId,
      userName: s.user?.name || s.user?.email?.split("@")[0] || "Student",
      userImage: s.user?.image || null,
      userEmail: s.user?.email || null,
      score: s.score,
      totalMarks: s.totalMarks,
      timeTakenSeconds: s.timeTakenSeconds,
      submittedAt: s.submittedAt || null,
    }));

    return { success: true, data: leaderboard };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

/**
 * Get user's submission history.
 */
export async function getMySubmissions(userId: string) {
  try {
    const list = await db.query.examSubmissions.findMany({
      where: eq(examSubmissions.userId, userId),
      with: {
        exam: true,
      },
      orderBy: [desc(examSubmissions.startedAt)],
    });

    return { success: true, data: list };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to fetch submissions" };
  }
}

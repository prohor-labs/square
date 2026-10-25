"use server";

import { and, asc, desc, eq, notExists, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  batchExams,
  examQuestions,
  examResponses,
  examSubmissions,
  exams,
  user,
} from "@/db/schema";
import type { LeaderboardEntry } from "@/types";

export interface FreeExamListItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  standard: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: string;
  questionCount: number;
  participantsCount: number;
  createdAt: Date;
}

/**
 * Fetch the free exam portal list.
 *
 * Only exams that belong to no course. An exam linked to a batch through
 * `batch_exams` belongs to that batch, so it stays out of the public list even
 * when it is published and marked as practice.
 */
export async function getPublicFreeExamsListAction(): Promise<{
  success: boolean;
  data: FreeExamListItem[];
  error?: string;
}> {
  try {
    const list = await db.query.exams.findMany({
      where: and(
        eq(exams.isPublished, true),
        notExists(
          db
            .select({ one: sql`1` })
            .from(batchExams)
            .where(eq(batchExams.examId, exams.id)),
        ),
      ),
      orderBy: [desc(exams.createdAt)],
      with: {
        examQuestions: true,
        submissions: {
          where: eq(examSubmissions.status, "submitted"),
        },
      },
    });

    const formatted: FreeExamListItem[] = list.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      standard: e.standard || "HSC",
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      negativeMarking: e.negativeMarking,
      questionCount: e.examQuestions?.length || 0,
      participantsCount: e.submissions?.length || 0,
      createdAt: e.createdAt,
    }));

    return { success: true, data: formatted };
  } catch (error: unknown) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch free exams list",
    };
  }
}

/**
 * Fetch a single free exam details by slug (with instructions and preview)
 */
export async function getPublicFreeExamDetailsAction(slug: string) {
  try {
    const exam = await db.query.exams.findFirst({
      where: and(
        eq(exams.slug, slug),
        eq(exams.isPublished, true),
        // Same rule as the list: an exam linked to a course is never a free exam.
        notExists(
          db
            .select({ one: sql`1` })
            .from(batchExams)
            .where(eq(batchExams.examId, exams.id)),
        ),
      ),
      with: {
        examQuestions: true,
        submissions: {
          where: eq(examSubmissions.status, "submitted"),
        },
      },
    });

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    return {
      success: true,
      data: {
        ...exam,
        questionCount: exam.examQuestions?.length || 0,
        participantsCount: exam.submissions?.length || 0,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch exam details",
    };
  }
}

/**
 * Fetch exam questions for exam-taking without giving away the correct answers
 */
export async function getFreeExamQuestionsForTakingAction(slug: string) {
  try {
    const exam = await db.query.exams.findFirst({
      where: and(
        eq(exams.slug, slug),
        eq(exams.isPublished, true),
        // Same rule as the list: an exam linked to a course is never a free exam.
        notExists(
          db
            .select({ one: sql`1` })
            .from(batchExams)
            .where(eq(batchExams.examId, exams.id)),
        ),
      ),
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

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    // Sanitize question options to not expose isCorrect in the taking payload
    const sanitizedQuestions = exam.examQuestions.map((eqItem) => {
      const q = eqItem.question;
      return {
        examQuestionId: eqItem.id,
        orderNo: eqItem.orderNo,
        marks: eqItem.marks,
        section: eqItem.section,
        question: {
          id: q.id,
          questionText: q.questionText,
          questionImage: q.questionImage,
          explanationImage: q.explanationImage,
          type: q.type,
          marks: eqItem.marks,
          standard: q.standard,
          source: q.source,
          mcqOptions: q.mcqOptions.map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            image: opt.image,
            orderNo: opt.orderNo,
          })),
          cqParts: q.cqParts.map((part) => ({
            id: part.id,
            partKey: part.partKey,
            marks: part.marks,
            questionText: part.questionText,
            orderNo: part.orderNo,
          })),
        },
      };
    });

    return {
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          slug: exam.slug,
          description: exam.description,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          negativeMarking: exam.negativeMarking,
        },
        questions: sanitizedQuestions,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load exam questions",
    };
  }
}

/**
 * Start a guest attempt without login
 */
export async function startFreeGuestExamAction(payload: {
  examId: string;
  studentName: string;
  college?: string;
  phone?: string;
  hscBatch?: string;
}) {
  try {
    const studentName = payload.studentName.trim() || "Guest Student";
    const guestUserId = `guest_${nanoid(12)}`;
    const guestEmail = `${guestUserId}@free.square.internal`;

    // 1. Validate the exam first, with the same rule the free-exam list uses:
    //    a published exam that no course claims. Checking before any insert
    //    keeps guest rows from piling up for exams nobody may start.
    const exam = await db.query.exams.findFirst({
      where: and(
        eq(exams.id, payload.examId),
        eq(exams.isPublished, true),
        notExists(
          db
            .select({ one: sql`1` })
            .from(batchExams)
            .where(eq(batchExams.examId, exams.id)),
        ),
      ),
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    // 2. Create a guest user profile row to satisfy relational constraints
    await db.insert(user).values({
      id: guestUserId,
      name: studentName,
      email: guestEmail,
      emailVerified: false,
      role: "student",
      college: payload.college?.trim() || "N/A",
      hscBatch: payload.hscBatch?.trim() || "Free Exam",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submissionId = nanoid();

    // 3. Create in_progress submission
    await db.insert(examSubmissions).values({
      id: submissionId,
      examId: exam.id,
      userId: guestUserId,
      score: "0",
      totalMarks: exam.totalMarks,
      status: "in_progress",
      startedAt: new Date(),
    });

    return {
      success: true,
      data: {
        submissionId,
        guestUserId,
        studentName,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to start guest exam",
    };
  }
}

/**
 * Submit guest exam responses and evaluate instantly
 */
export async function submitFreeGuestExamAction(payload: {
  submissionId: string;
  examId: string;
  guestUserId: string;
  timeTakenSeconds: number;
  responses: Array<{
    examQuestionId: string;
    selectedOptionId?: string | null;
    cqAnswerText?: string | null;
  }>;
}) {
  try {
    const { submissionId, examId, responses, timeTakenSeconds } = payload;

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: {
              with: {
                mcqOptions: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    const examQs = exam.examQuestions;
    const negativeMark = parseFloat(exam.negativeMarking || "0");
    const totalExamMarks = examQs.reduce((acc, q) => acc + q.marks, 0);

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    interface InsertResponse {
      submissionId: string;
      examQuestionId: string;
      selectedOptionId: string | null;
      cqAnswerText: string | null;
      isCorrect: boolean;
      marksObtained: string;
    }

    const insertResponses: InsertResponse[] = [];

    for (const eqData of examQs) {
      const userResp = responses.find((r) => r.examQuestionId === eqData.id);
      const selectedOptionId = userResp?.selectedOptionId || null;
      const cqAnswerText = userResp?.cqAnswerText || null;

      let isCorrect = false;
      let marksObtained = 0;

      if (!selectedOptionId && !cqAnswerText) {
        unattemptedCount++;
        isCorrect = false;
        marksObtained = 0;
      } else if (eqData.question?.type === "mcq") {
        const correctOpt = eqData.question.mcqOptions.find((o) => o.isCorrect);
        if (correctOpt && correctOpt.id === selectedOptionId) {
          isCorrect = true;
          marksObtained = eqData.marks;
          correctCount++;
        } else if (selectedOptionId) {
          isCorrect = false;
          marksObtained = -negativeMark;
          wrongCount++;
        }
      }

      totalScore += marksObtained;

      insertResponses.push({
        submissionId,
        examQuestionId: eqData.id,
        selectedOptionId,
        cqAnswerText,
        isCorrect,
        marksObtained: marksObtained.toString(),
      });
    }

    if (insertResponses.length > 0) {
      await db.insert(examResponses).values(insertResponses);
    }

    // Update submission record
    const updated = await db
      .update(examSubmissions)
      .set({
        score: totalScore.toFixed(2),
        totalMarks: totalExamMarks,
        status: "submitted",
        timeTakenSeconds,
        submittedAt: new Date(),
      })
      .where(eq(examSubmissions.id, submissionId))
      .returning();

    revalidatePath(`/free-exam/${exam.slug}`);
    revalidatePath(`/free-exam/${exam.slug}/leaderboard`);
    revalidatePath("/free-exam");

    return {
      success: true,
      data: {
        submission: updated[0],
        totalScore,
        correctCount,
        wrongCount,
        unattemptedCount,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit exam attempt",
    };
  }
}

/**
 * Get detailed result for guest submission
 */
export async function getFreeExamResultAction(submissionId: string) {
  try {
    const submission = await db.query.examSubmissions.findFirst({
      where: eq(examSubmissions.id, submissionId),
      with: {
        user: true,
        exam: true,
        responses: {
          with: {
            examQuestion: {
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
        },
      },
    });

    if (!submission) {
      return { success: false, error: "Submission not found" };
    }

    // Fetch all exam questions to guarantee 100% of questions are displayed
    const allExamQuestions = await db.query.examQuestions.findMany({
      where: eq(examQuestions.examId, submission.examId),
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
    });

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

    submission.responses = completeResponses as any;

    // Calculate metrics
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    for (const r of completeResponses) {
      if (!r.selectedOptionId && !r.cqAnswerText) {
        unattemptedCount++;
      } else if (r.isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    const totalQuestions = submission.responses.length;
    const attemptedCount = correctCount + wrongCount;
    const accuracy =
      attemptedCount > 0
        ? Math.round((correctCount / attemptedCount) * 100)
        : 0;

    return {
      success: true,
      data: {
        submission,
        metrics: {
          correctCount,
          wrongCount,
          unattemptedCount,
          attemptedCount,
          totalQuestions,
          accuracy,
        },
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load exam result",
    };
  }
}

/**
 * Fetch live leaderboard by exam slug
 */
export async function getFreeExamLeaderboardAction(slug: string): Promise<{
  success: boolean;
  exam?: any;
  leaderboard: LeaderboardEntry[];
  error?: string;
}> {
  try {
    const exam = await db.query.exams.findFirst({
      where: and(eq(exams.slug, slug), eq(exams.isPublished, true)),
    });

    if (!exam) {
      return { success: false, leaderboard: [], error: "Exam not found" };
    }

    const list = await db.query.examSubmissions.findMany({
      where: and(
        eq(examSubmissions.examId, exam.id),
        eq(examSubmissions.status, "submitted"),
      ),
      with: {
        user: true,
      },
      orderBy: [
        asc(examSubmissions.attemptNumber),
        asc(examSubmissions.startedAt),
      ],
    });

    // Count only first attempt per student in merit leaderboard
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
      userName: s.user?.name || "Anonymous",
      userImage: s.user?.image || null,
      userEmail: s.user?.email || null,
      college: s.user?.college || null,
      hscBatch: s.user?.hscBatch || null,
      score: s.score,
      totalMarks: s.totalMarks,
      timeTakenSeconds: s.timeTakenSeconds,
      submittedAt: s.submittedAt || null,
    }));

    return {
      success: true,
      exam,
      leaderboard,
    };
  } catch (error: unknown) {
    return {
      success: false,
      leaderboard: [],
      error:
        error instanceof Error ? error.message : "Failed to load leaderboard",
    };
  }
}

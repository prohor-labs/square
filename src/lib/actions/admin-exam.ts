"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  batchExams,
  cqParts,
  examQuestions,
  examSubmissions,
  exams,
  mcqOptions,
  questions,
} from "@/db/schema";
import type { ExamDetail } from "@/types";

export async function createExamAction(data: {
  title: string;
  slug: string;
  description?: string;
  type: "practice" | "chapter_test" | "weekly" | "model_test" | "live_contest";
  standard?: "HSC" | "Varsity" | "Engineering" | "Medical";
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: string;
  showResultImmediately: boolean;
  isPublished: boolean;
  createdBy: string;
  batchId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  try {
    const { batchId, startsAt, endsAt, ...examValues } = data;
    const res = await db
      .insert(exams)
      .values({
        ...examValues,
        standard: examValues.standard || "HSC",
      })
      .returning();
    const createdExam = res[0] as unknown as ExamDetail;

    if (batchId && createdExam?.id) {
      // The schedule lives on the batch assignment, so it is stored here.
      // Both empty means the exam is always live.
      await db.insert(batchExams).values({
        batchId,
        examId: createdExam.id,
        startsAt: startsAt ?? null,
        endsAt: endsAt ?? null,
        isRequired: true,
      });
      revalidatePath(`/admin/batches/${batchId}`);
    }

    revalidatePath("/admin/exams");
    return { success: true, data: createdExam };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create exam",
    };
  }
}

export async function updateExamAction(id: string, data: Partial<ExamDetail>) {
  try {
    const updateData: Partial<typeof exams.$inferInsert> = {
      ...data,
      standard: data.standard as
        | ("Engineering" | "HSC" | "Medical" | "Varsity")
        | undefined,
      updatedAt: new Date(),
    };
    const res = await db
      .update(exams)
      .set(updateData)
      .where(eq(exams.id, id))
      .returning();
    revalidatePath(`/admin/exams/${id}`);
    revalidatePath("/admin/exams");
    return { success: true, data: res[0] as unknown as ExamDetail };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update exam",
    };
  }
}

export async function deleteExamAction(id: string) {
  try {
    await db.delete(exams).where(eq(exams.id, id));
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete exam",
    };
  }
}

export async function publishExamAction(id: string) {
  try {
    await db
      .update(exams)
      .set({ isPublished: true, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(exams.id, id));
    revalidatePath(`/admin/exams/${id}`);
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish exam",
    };
  }
}

export async function togglePublishExamAction(
  id: string,
  isPublished: boolean,
) {
  try {
    await db
      .update(exams)
      .set({ isPublished, updatedAt: sql`(CURRENT_TIMESTAMP)` })
      .where(eq(exams.id, id));
    revalidatePath(`/admin/exams/${id}/questions`);
    revalidatePath(`/admin/exams/${id}`);
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update exam status",
    };
  }
}

export async function addMultipleQuestionsToExamAction(
  examId: string,
  questionIds: string[],
) {
  try {
    if (!questionIds.length) return { success: true, count: 0 };

    const currentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId));

    let nextOrder = Number(currentCount[0]?.count || 0) + 1;

    const values = questionIds.map((qid) => ({
      examId,
      questionId: qid,
      orderNo: nextOrder++,
      marks: 1,
    }));

    await db.insert(examQuestions).values(values).onConflictDoNothing();

    revalidatePath(`/admin/exams/${examId}/questions`);
    return { success: true, count: values.length };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add questions to exam",
    };
  }
}

export async function importQuestionsDirectlyToExamAction(
  examId: string,
  questionsList: any[],
  chapterId?: string,
) {
  try {
    if (!questionsList || !questionsList.length) {
      return { success: false, error: "কোনো প্রশ্ন প্রদান করা হয়নি।" };
    }

    // If no chapterId given, find or fallback to first available subitem/chapter
    let targetChapterId = chapterId;
    if (!targetChapterId) {
      const firstSubitem = await db.query.subitems.findFirst();
      targetChapterId = firstSubitem?.id;
    }

    if (!targetChapterId) {
      return {
        success: false,
        error:
          "ডাটাবেজে কোনো অধ্যায় (Chapter) পাওয়া যায়নি। দয়া করে প্রশ্নব্যাংকে একটি বিষয়/অধ্যায় তৈরি করুন।",
      };
    }

    const insertedCount = await db.transaction(async (tx) => {
      let count = 0;
      const currentCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(examQuestions)
        .where(eq(examQuestions.examId, examId));
      let nextOrder = Number(currentCount[0]?.count || 0) + 1;

      for (const item of questionsList) {
        const qText = (
          item.questionText ||
          item.question_text ||
          item.question ||
          ""
        ).trim();
        if (!qText) continue;

        const resolvedType = (item.type || "mcq") === "cq" ? "cq" : "mcq";
        const resolvedStandard = (item.standard || "HSC") as
          | "HSC"
          | "Varsity"
          | "Engineering"
          | "Medical";
        const resolvedSource = (item.source || "Exam Import").trim();
        const resolvedExplanation =
          (item.explanation || item.solution || "").trim() || null;
        const marks = Number(item.marks) || 1;

        const [newQuestion] = await tx
          .insert(questions)
          .values({
            subitemId: targetChapterId!,
            type: resolvedType,
            source: resolvedSource,
            standard: resolvedStandard,
            questionText: qText,
            explanation: resolvedExplanation,
            isFree: false,
          })
          .returning();

        if (!newQuestion) continue;

        // Insert MCQ options
        if (resolvedType === "mcq") {
          const rawOptions =
            item.mcqOptions || item.mcq_options || item.options || [];
          if (Array.isArray(rawOptions) && rawOptions.length > 0) {
            const correctIndex =
              typeof item.correctIdx === "number"
                ? item.correctIdx
                : typeof item.correctIndex === "number"
                  ? item.correctIndex
                  : typeof item.correctOption === "number"
                    ? item.correctOption
                    : -1;

            const optionsToInsert = rawOptions.map((opt: any, idx: number) => {
              const optText = (
                typeof opt === "string"
                  ? opt
                  : opt.optionText || opt.option_text || opt.text || ""
              ).trim();

              const isOptCorrect =
                typeof opt === "object" && opt !== null && "isCorrect" in opt
                  ? Boolean(opt.isCorrect)
                  : typeof opt === "object" &&
                      opt !== null &&
                      "is_correct" in opt
                    ? Boolean(opt.is_correct)
                    : correctIndex === idx;

              return {
                questionId: newQuestion.id,
                optionText: optText,
                isCorrect: isOptCorrect,
                orderNo: idx + 1,
              };
            });

            if (
              !optionsToInsert.some((o) => o.isCorrect) &&
              optionsToInsert.length > 0
            ) {
              optionsToInsert[0].isCorrect = true;
            }

            await tx.insert(mcqOptions).values(optionsToInsert);
          }
        } else if (resolvedType === "cq") {
          const rawParts = item.cqParts || item.cq_parts || item.parts || [];
          if (Array.isArray(rawParts) && rawParts.length > 0) {
            const defaultKeys: Array<"a" | "b" | "c" | "d"> = [
              "a",
              "b",
              "c",
              "d",
            ];
            const partsToInsert = rawParts.map((pt: any, idx: number) => ({
              questionId: newQuestion.id,
              partKey: (pt.partKey || pt.part_key || defaultKeys[idx] || "a") as
                | "a"
                | "b"
                | "c"
                | "d",
              questionText: (
                pt.questionText ||
                pt.question_text ||
                pt.text ||
                ""
              ).trim(),
              answerText:
                (pt.answerText || pt.answer_text || pt.answer || "").trim() ||
                null,
              marks: typeof pt.marks === "number" ? pt.marks : idx + 1,
              orderNo: idx + 1,
            }));
            await tx.insert(cqParts).values(partsToInsert);
          }
        }

        // Add to Exam Questions
        await tx.insert(examQuestions).values({
          examId,
          questionId: newQuestion.id,
          orderNo: nextOrder++,
          marks,
        });

        count++;
      }

      return count;
    });

    revalidatePath(`/admin/exams/${examId}/questions`);
    return { success: true, count: insertedCount };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "প্রশ্ন সরাসরি ইমপোর্ট করতে ব্যর্থ হয়েছে",
    };
  }
}

export async function addQuestionToExamAction(
  examId: string,
  questionId: string,
  orderNo: number,
  marks: number,
  section?: string,
) {
  try {
    const res = await db
      .insert(examQuestions)
      .values({
        examId,
        questionId,
        orderNo,
        marks,
        section,
      })
      .returning();
    revalidatePath(`/admin/exams/${examId}/questions`);
    return { success: true, data: res[0] };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add question",
    };
  }
}

export async function removeQuestionFromExamAction(
  examQuestionId: string,
  examId: string,
) {
  try {
    await db.delete(examQuestions).where(eq(examQuestions.id, examQuestionId));
    revalidatePath(`/admin/exams/${examId}/questions`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove question",
    };
  }
}

export async function reorderExamQuestionsAction(
  examId: string,
  orderedIds: string[],
) {
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(examQuestions)
        .set({ orderNo: i + 1 })
        .where(eq(examQuestions.id, orderedIds[i]));
    }
    revalidatePath(`/admin/exams/${examId}/questions`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reorder questions",
    };
  }
}

export async function getExamWithQuestionsAdmin(examId: string) {
  try {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          orderBy: (eqs, { asc }) => [asc(eqs.orderNo)],
          with: {
            question: true,
          },
        },
      },
    });
    if (!exam) return { success: false, error: "Exam not found" };
    return { success: true, data: exam };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exam",
    };
  }
}

export async function getExamResultsAdmin(examId: string) {
  try {
    const list = await db.query.examSubmissions.findMany({
      where: eq(examSubmissions.examId, examId),
      with: {
        user: true,
      },
      orderBy: [desc(examSubmissions.submittedAt)],
    });
    return { success: true, data: list };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch results",
    };
  }
}

export async function getAllExamsAdmin() {
  try {
    const list = await db.query.exams.findMany({
      orderBy: [desc(exams.createdAt)],
    });
    return { success: true, data: list };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exams",
    };
  }
}

export async function getAllExamsWithBatchesAdmin() {
  try {
    const list = await db.query.exams.findMany({
      orderBy: [desc(exams.createdAt)],
      with: {
        batchExams: {
          with: { batch: true },
        },
      },
    });
    return { success: true, data: list };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch exams",
    };
  }
}

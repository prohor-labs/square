"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  containers,
  cqParts,
  items,
  mcqOptions,
  questions,
  subitems,
  topics,
} from "@/db/schema";
import type { CreateQuestionPayload, ImportQuestionItem } from "@/types";

export async function createContainerAction(
  title: string,
  slug: string,
  description?: string,
) {
  try {
    await db.insert(containers).values({
      title,
      slug,
      description,
    });
    revalidatePath("/admin/qb");
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create container",
    };
  }
}

export async function deleteContainerAction(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { error: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    await db.delete(containers).where(eq(containers.id, id));
    revalidatePath("/admin/qb");
    revalidatePath("/qb", "layout");
    revalidatePath("/qb");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting container:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete container",
    };
  }
}

export async function updateContainerAction(
  id: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    isPublic?: boolean;
  },
) {
  try {
    const finalSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
    await db
      .update(containers)
      .set({
        title: data.title.trim(),
        slug: finalSlug,
        description: data.description?.trim() || null,
        isPublic: data.isPublic ?? false,
      })
      .where(eq(containers.id, id));

    revalidatePath("/admin/qb");
    revalidatePath(`/admin/qb/${finalSlug}`);
    revalidatePath("/qb");
    revalidatePath(`/qb/${finalSlug}`);
    return { success: true, slug: finalSlug };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update container",
    };
  }
}

export async function createItemAction(
  containerId: string,
  qbSlug: string,
  idOrName: string,
  slug: string,
  name?: string,
  code?: string,
) {
  try {
    const finalName = name || idOrName;
    const finalId = slug || idOrName;
    await db.insert(items).values({
      id: finalId,
      containerId,
      name: finalName,
      slug,
      code,
    });
    revalidatePath(`/admin/qb/${qbSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

export async function deleteItemAction(itemId: string, qbSlug: string) {
  try {
    await db.delete(items).where(eq(items.id, itemId));
    revalidatePath(`/admin/qb/${qbSlug}`);
    revalidatePath(`/qb/${qbSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}

export async function updateItemAction(
  itemId: string,
  qbSlug: string,
  data: {
    name: string;
    slug: string;
    code?: string;
  },
) {
  try {
    const finalSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
    await db
      .update(items)
      .set({
        name: data.name.trim(),
        slug: finalSlug,
        code: data.code?.trim() || null,
      })
      .where(eq(items.id, itemId));

    revalidatePath(`/admin/qb/${qbSlug}`);
    revalidatePath(`/admin/qb/${qbSlug}/${finalSlug}`);
    revalidatePath(`/qb/${qbSlug}`);
    revalidatePath(`/qb/${qbSlug}/${finalSlug}`);
    return { success: true, slug: finalSlug };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

export async function createSubitemAction(
  itemId: string,
  qbSlug: string,
  itemSlug: string,
  name: string,
  slug: string,
  paper?: string,
) {
  try {
    await db.insert(subitems).values({
      itemId,
      name,
      slug,
      paper,
    });
    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create subitem",
    };
  }
}

export async function deleteSubitemAction(
  subitemId: string,
  qbSlug: string,
  itemSlug: string,
) {
  try {
    await db.delete(subitems).where(eq(subitems.id, subitemId));
    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}`);
    revalidatePath(`/qb/${qbSlug}/${itemSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete subitem",
    };
  }
}

export async function updateSubitemAction(
  subitemId: string,
  qbSlug: string,
  itemSlug: string,
  data: {
    name: string;
    slug: string;
    paper?: string;
    orderNo?: number;
  },
) {
  try {
    const finalSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const updatePayload: Record<string, unknown> = {
      name: data.name.trim(),
      slug: finalSlug,
    };
    if (data.paper !== undefined) {
      updatePayload.paper = data.paper?.trim() || null;
    }
    if (data.orderNo !== undefined) {
      updatePayload.orderNo = data.orderNo;
    }

    await db.update(subitems).set(updatePayload).where(eq(subitems.id, subitemId));

    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}`);
    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}/${finalSlug}`);
    revalidatePath(`/qb/${qbSlug}/${itemSlug}`);
    revalidatePath(`/qb/${qbSlug}/${itemSlug}/${finalSlug}`);
    return { success: true, slug: finalSlug };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update subitem",
    };
  }
}

export async function createTopicAction(
  subitemId: string,
  qbSlug: string,
  itemSlug: string,
  subitemSlug: string,
  name: string,
  slug: string,
) {
  try {
    await db.insert(topics).values({
      subitemId,
      name,
      slug,
    });
    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}/${subitemSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to create topic",
    };
  }
}

export async function deleteTopicAction(
  topicId: string,
  qbSlug: string,
  itemSlug: string,
  subitemSlug: string,
) {
  try {
    await db.delete(topics).where(eq(topics.id, topicId));
    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}/${subitemSlug}`);
    revalidatePath(`/qb/${qbSlug}/${itemSlug}/${subitemSlug}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete topic",
    };
  }
}

export async function updateTopicAction(
  topicId: string,
  qbSlug: string,
  itemSlug: string,
  subitemSlug: string,
  data: {
    name: string;
    slug: string;
  },
) {
  try {
    const finalSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-");
    await db
      .update(topics)
      .set({
        name: data.name.trim(),
        slug: finalSlug,
      })
      .where(eq(topics.id, topicId));

    revalidatePath(`/admin/qb/${qbSlug}/${itemSlug}/${subitemSlug}`);
    revalidatePath(
      `/admin/qb/${qbSlug}/${itemSlug}/${subitemSlug}/${finalSlug}`,
    );
    revalidatePath(`/qb/${qbSlug}/${itemSlug}/${subitemSlug}`);
    revalidatePath(`/qb/${qbSlug}/${itemSlug}/${subitemSlug}/${finalSlug}`);
    return { success: true, slug: finalSlug };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to update topic",
    };
  }
}


export async function createQuestionAction(payload: CreateQuestionPayload) {
  try {
    const questionId = await db.transaction(async (tx) => {
      const [question] = await tx
        .insert(questions)
        .values({
          subitemId: payload.chapterId,
          topicId: payload.topicId || null,
          type: payload.type,
          source: payload.source || "custom",
          standard:
            (payload.standard as
              | "HSC"
              | "Varsity"
              | "Engineering"
              | "Medical") || "HSC",
          questionText: payload.questionText,
          explanation: payload.explanation || null,
          isFree: Boolean(payload.isFree),
        })
        .returning();

      if (!question) {
        throw new Error("Failed to create question");
      }

      if (payload.type === "mcq" && payload.mcqOptions?.length) {
        const optionsToInsert = payload.mcqOptions.map((opt, idx: number) => ({
          questionId: question.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          orderNo: idx + 1,
        }));
        await tx.insert(mcqOptions).values(optionsToInsert);
      } else if (payload.type === "cq" && payload.cqParts?.length) {
        const partsToInsert = payload.cqParts.map((pt, idx: number) => ({
          questionId: question.id,
          partKey: pt.partKey as "a" | "b" | "c" | "d",
          questionText: pt.questionText,
          answerText: pt.answerText || null,
          marks: pt.marks,
          orderNo: idx + 1,
        }));
        await tx.insert(cqParts).values(partsToInsert);
      }

      return question.id;
    });

    revalidatePath("/admin/qb");
    revalidatePath("/qb", "layout");
    return { success: true, questionId };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create question",
    };
  }
}

export async function updateQuestionAction(
  id: string,
  payload: Partial<CreateQuestionPayload>,
) {
  try {
    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.topicId !== undefined) updateData.topicId = payload.topicId || null;
      if (payload.source !== undefined)
        updateData.source = payload.source || "custom";
      if (payload.standard !== undefined)
        updateData.standard = payload.standard;
      if (payload.questionText !== undefined)
        updateData.questionText = payload.questionText;
      if (payload.explanation !== undefined)
        updateData.explanation = payload.explanation || null;
      if (payload.isFree !== undefined)
        updateData.isFree = payload.isFree;

      if (Object.keys(updateData).length > 0) {
        await tx.update(questions).set(updateData).where(eq(questions.id, id));
      }

      if (payload.type === "mcq" && payload.mcqOptions) {
        await tx.delete(mcqOptions).where(eq(mcqOptions.questionId, id));
        if (payload.mcqOptions.length > 0) {
          const optionsToInsert = payload.mcqOptions.map(
            (opt, idx: number) => ({
              questionId: id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderNo: idx + 1,
            }),
          );
          await tx.insert(mcqOptions).values(optionsToInsert);
        }
      } else if (payload.type === "cq" && payload.cqParts) {
        await tx.delete(cqParts).where(eq(cqParts.questionId, id));
        if (payload.cqParts.length > 0) {
          const partsToInsert = payload.cqParts.map((pt, idx: number) => ({
            questionId: id,
            partKey: pt.partKey as "a" | "b" | "c" | "d",
            questionText: pt.questionText,
            answerText: pt.answerText || null,
            marks: pt.marks,
            orderNo: idx + 1,
          }));
          await tx.insert(cqParts).values(partsToInsert);
        }
      }
    });

    revalidatePath("/admin/qb");
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update question",
    };
  }
}

export async function deleteQuestionAction(questionId: string) {
  try {
    await db.delete(questions).where(eq(questions.id, questionId));
    revalidatePath("/admin/qb");
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete question",
    };
  }
}

export interface ImportDefaults {
  type?: "mcq" | "cq";
  standard?: string;
  source?: string;
  isFree?: boolean;
  topicId?: string;
}

export async function importQuestionsAction(
  chapterId: string,
  questionsList: readonly any[],
  topicIdOrDefaults?: string | ImportDefaults,
) {
  try {
    if (!questionsList || questionsList.length === 0) {
      return { error: "কোনো প্রশ্ন প্রদান করা হয়নি।" };
    }

    const defaults: ImportDefaults =
      typeof topicIdOrDefaults === "string"
        ? { topicId: topicIdOrDefaults }
        : topicIdOrDefaults || {};

    const insertedCount = await db.transaction(async (tx) => {
      let count = 0;

      for (const item of questionsList) {
        const qText = (
          item.questionText ||
          item.question_text ||
          item.question ||
          ""
        ).trim();
        if (!qText) continue;

        // Always enforce the manual selections from the page
        const resolvedType = (defaults.type || item.type || "mcq") === "cq" ? "cq" : "mcq";
        const resolvedStandard = (
          defaults.standard ||
          item.standard ||
          "HSC"
        ) as "HSC" | "Varsity" | "Engineering" | "Medical";
        const resolvedSource = (defaults.source || item.source || "Custom").trim();
        const resolvedIsFree = Boolean(
          defaults.isFree !== undefined
            ? defaults.isFree
            : (item.isFree ?? item.is_free ?? false),
        );
        const resolvedTopicId = defaults.topicId || item.topicId || item.topic_id || null;
        const resolvedExplanation = (item.explanation || item.solution || "").trim() || null;

        const [question] = await tx
          .insert(questions)
          .values({
            subitemId: chapterId,
            topicId: resolvedTopicId,
            type: resolvedType,
            source: resolvedSource,
            standard: resolvedStandard,
            questionText: qText,
            explanation: resolvedExplanation,
            isFree: resolvedIsFree,
          })
          .returning();

        if (!question) continue;
        count++;

        // Handle MCQ Options
        if (resolvedType === "mcq") {
          const rawOptions = item.mcqOptions || item.mcq_options || item.options || [];
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
                  : typeof opt === "object" && opt !== null && "is_correct" in opt
                    ? Boolean(opt.is_correct)
                    : correctIndex === idx;

              return {
                questionId: question.id,
                optionText: optText,
                isCorrect: isOptCorrect,
                orderNo: idx + 1,
              };
            });

            // Ensure at least one option is marked correct if not already
            if (!optionsToInsert.some((o) => o.isCorrect) && optionsToInsert.length > 0) {
              optionsToInsert[0].isCorrect = true;
            }

            await tx.insert(mcqOptions).values(optionsToInsert);
          }
        } else if (resolvedType === "cq") {
          // Handle CQ Parts
          const rawParts = item.cqParts || item.cq_parts || item.parts || [];
          if (Array.isArray(rawParts) && rawParts.length > 0) {
            const defaultKeys: Array<"a" | "b" | "c" | "d"> = ["a", "b", "c", "d"];
            const partsToInsert = rawParts.map((pt: any, idx: number) => ({
              questionId: question.id,
              partKey: (pt.partKey || pt.part_key || defaultKeys[idx] || "a") as
                | "a"
                | "b"
                | "c"
                | "d",
              questionText: (pt.questionText || pt.question_text || pt.text || "").trim(),
              answerText: (pt.answerText || pt.answer_text || pt.answer || "").trim() || null,
              marks: typeof pt.marks === "number" ? pt.marks : idx + 1,
              orderNo: idx + 1,
            }));
            await tx.insert(cqParts).values(partsToInsert);
          }
        }
      }

      return count;
    });

    revalidatePath("/admin/qb");
    return { success: true, count: insertedCount };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "প্রশ্ন ইমপোর্ট করতে ব্যর্থ হয়েছে",
    };
  }
}

export async function getQuestionsAdminAction(filters?: {
  chapterId?: string;
  topicId?: string;
  subjectId?: string;
  type?: string;
}) {
  try {
    const hasSpecificFilter = Boolean(
      filters?.chapterId || filters?.topicId || filters?.subjectId,
    );

    const list = await db.query.questions.findMany({
      where: (questions, { and, eq, isNull }) => {
        const conditions = [];
        if (filters?.chapterId) {
          conditions.push(eq(questions.subitemId, filters.chapterId));
        }
        if (filters?.topicId) {
          if (filters.topicId === "unassigned") {
            conditions.push(isNull(questions.topicId));
          } else {
            conditions.push(eq(questions.topicId, filters.topicId));
          }
        }
        if (filters?.type) {
          conditions.push(eq(questions.type, filters.type as "mcq" | "cq"));
        }
        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      limit: hasSpecificFilter ? undefined : 100,
      with: {
        mcqOptions: true,
        cqParts: true,
        topic: true,
      },
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
    });
    return list || [];
  } catch (error: unknown) {
    console.error("Error fetching questions:", error);
    return [];
  }
}

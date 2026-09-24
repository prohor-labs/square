"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  containers,
  cqParts,
  items,
  mcqOptions,
  questions,
  subitems,
  topics,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import type { CreateQuestionPayload } from "@/types";

export interface HierarchyTopic {
  id: string;
  name: string;
  slug: string;
}

export interface HierarchyChapter {
  id: string;
  name: string;
  slug: string;
  paper?: string | null;
  topics: HierarchyTopic[];
}

export interface HierarchySubject {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  chapters: HierarchyChapter[];
}

export interface HierarchyContainer {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  subjects: HierarchySubject[];
}

export async function getFullQbHierarchy(): Promise<HierarchyContainer[]> {
  try {
    const rawContainers = await db.query.containers.findMany({
      with: {
        items: {
          with: {
            subitems: {
              with: {
                topics: true,
              },
            },
          },
        },
      },
      orderBy: (containers, { asc }) => [asc(containers.createdAt)],
    });

    return rawContainers.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      isPublic: c.isPublic,
      subjects: (c.items || []).map((itm) => ({
        id: itm.id,
        name: itm.name,
        slug: itm.slug,
        code: itm.code,
        chapters: (itm.subitems || []).map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          paper: ch.paper,
          topics: (ch.topics || []).map((tp) => ({
            id: tp.id,
            name: tp.name,
            slug: tp.slug,
          })),
        })),
      })),
    }));
  } catch (error) {
    console.error("Error fetching QB hierarchy:", error);
    return [];
  }
}

export async function createQuickQuestionAction(payload: CreateQuestionPayload) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    if (!payload.chapterId || !payload.questionText?.trim()) {
      return { success: false, message: "অধ্যায় এবং প্রশ্নের বিবরণ আবশ্যক।" };
    }

    const questionId = await db.transaction(async (tx) => {
      const [question] = await tx
        .insert(questions)
        .values({
          subitemId: payload.chapterId,
          type: payload.type,
          source: payload.source?.trim() || "Custom",
          standard:
            (payload.standard as
              | "HSC"
              | "Varsity"
              | "Engineering"
              | "Medical") || "HSC",
          questionText: payload.questionText.trim(),
          explanation: payload.explanation?.trim() || null,
          isFree: Boolean(payload.isFree),
        })
        .returning();

      if (!question) {
        throw new Error("প্রশ্ন ডাটাবেজে সংরক্ষণ করা যায়নি");
      }

      if (payload.type === "mcq" && payload.mcqOptions?.length) {
        const optionsToInsert = payload.mcqOptions.map((opt, idx: number) => ({
          questionId: question.id,
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect,
          orderNo: idx + 1,
        }));
        await tx.insert(mcqOptions).values(optionsToInsert);
      }

      if (payload.type === "cq" && payload.cqParts?.length) {
        const partsToInsert = payload.cqParts.map((pt, idx: number) => ({
          questionId: question.id,
          partKey: (pt.partKey as "a" | "b" | "c" | "d") || "a",
          questionText: pt.questionText.trim(),
          answerText: pt.answerText?.trim() || null,
          marks: pt.marks,
          orderNo: idx + 1,
        }));
        await tx.insert(cqParts).values(partsToInsert);
      }

      return question.id;
    });

    try {
      revalidatePath("/qb");
      revalidatePath("/admin/qb");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return {
      success: true,
      questionId,
    };
  } catch (error: unknown) {
    console.error("Error creating quick question:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "প্রশ্ন যুক্ত করতে সমস্যা হয়েছে।",
    };
  }
}

export async function getRecentUploadedQuestions(limit = 10) {
  try {
    const rawQuestions = await db.query.questions.findMany({
      limit,
      orderBy: (questions, { desc }) => [desc(questions.createdAt)],
      with: {
        mcqOptions: true,
        cqParts: true,
        subitem: {
          with: {
            item: {
              with: {
                container: true,
              },
            },
          },
        },
      },
    });

    return rawQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      source: q.source,
      standard: q.standard,
      questionText: q.questionText,
      explanation: q.explanation,
      isFree: q.isFree,
      createdAt: q.createdAt,
      chapterName: q.subitem?.name || "অজ্ঞাত অধ্যায়",
      subjectName: q.subitem?.item?.name || "অজ্ঞাত বিষয়",
      containerTitle: q.subitem?.item?.container?.title || "অজ্ঞাত প্রশ্নব্যাংক",
      mcqOptions: q.mcqOptions.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        isCorrect: o.isCorrect,
      })),
      cqParts: q.cqParts.map((p) => ({
        id: p.id,
        partKey: p.partKey,
        questionText: p.questionText,
        marks: p.marks,
      })),
    }));
  } catch (error) {
    console.error("Error fetching recent questions:", error);
    return [];
  }
}

function slugifyYear(text: string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let converted = text.trim();
  bnDigits.forEach((bn, idx) => {
    converted = converted.replaceAll(bn, String(idx));
  });
  return (
    converted
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || `year-${Date.now()}`
  );
}

export interface ImportYearQuestionsPayload {
  containerId: string;
  yearName: string;
  questionsList: readonly any[];
  standard?: "HSC" | "Varsity" | "Engineering" | "Medical";
  type?: "mcq" | "cq";
  source?: string;
  isFree?: boolean;
}

export async function importYearBasedQuestionsAction(
  payload: ImportYearQuestionsPayload,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, error: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    if (!payload.containerId) {
      return { success: false, error: "প্রশ্নব্যাংক নির্বাচন করুন।" };
    }

    const yearName = payload.yearName?.trim();
    if (!yearName) {
      return { success: false, error: "সাল বা সেশন উল্লেখ করুন।" };
    }

    if (!payload.questionsList || payload.questionsList.length === 0) {
      return { success: false, error: "কোনো প্রশ্ন প্রদান করা হয়নি।" };
    }

    const container = await db.query.containers.findFirst({
      where: eq(containers.id, payload.containerId),
    });

    if (!container) {
      return { success: false, error: "প্রশ্নব্যাংক পাওয়া যায়নি।" };
    }

    const yearSlug = slugifyYear(yearName);

    // 1. Find or create the root/general item for this container
    let targetItem = await db.query.items.findFirst({
      where: (items, { and, eq, or }) =>
        and(
          eq(items.containerId, container.id),
          or(eq(items.code, "YEARS"), eq(items.name, "সালসমূহ")),
        ),
    });

    if (!targetItem) {
      targetItem = await db.query.items.findFirst({
        where: eq(items.containerId, container.id),
      });
    }

    if (!targetItem) {
      const newItemId = crypto.randomUUID();
      const uniqueItemSlug = `${container.slug}-years`;
      const [createdItem] = await db
        .insert(items)
        .values({
          id: newItemId,
          containerId: container.id,
          name: "সালসমূহ",
          slug: uniqueItemSlug,
          code: "YEARS",
        })
        .returning();
      targetItem = createdItem;
    }

    if (!targetItem) {
      return { success: false, error: "আইটেম তৈরি বা পাওয়া যায়নি।" };
    }

    // 2. Find or create the subitem (Year) under targetItem
    let targetSubitem = await db.query.subitems.findFirst({
      where: (subitems, { and, eq, or }) =>
        and(
          eq(subitems.itemId, targetItem.id),
          or(eq(subitems.name, yearName), eq(subitems.slug, yearSlug)),
        ),
    });

    if (!targetSubitem) {
      const [createdSubitem] = await db
        .insert(subitems)
        .values({
          itemId: targetItem.id,
          name: yearName,
          slug: yearSlug,
          orderNo: 0,
        })
        .returning();
      targetSubitem = createdSubitem;
    }

    if (!targetSubitem) {
      return { success: false, error: "সাল/সেশন রেকর্ড তৈরি করা সম্ভব হয়নি।" };
    }

    // 3. Insert questions into this subitem
    const defaultSource =
      payload.source?.trim() || `${container.title} ${yearName}`;
    const defaultStandard =
      payload.standard ||
      (container.title.includes("বুয়েট") ||
      container.title.includes("ইঞ্জিনিয়ারিং")
        ? "Engineering"
        : container.title.includes("মেডিকেল")
          ? "Medical"
          : "Varsity");

    const insertedCount = await db.transaction(async (tx) => {
      let count = 0;

      for (const itemData of payload.questionsList) {
        const qText = (
          itemData.questionText ||
          itemData.question_text ||
          itemData.question ||
          ""
        ).trim();
        if (!qText) continue;

        const resolvedType =
          (payload.type || itemData.type || "mcq") === "cq" ? "cq" : "mcq";
        const resolvedStandard = (payload.standard ||
          itemData.standard ||
          defaultStandard) as "HSC" | "Varsity" | "Engineering" | "Medical";
        const rawItemSource = (itemData.source || "").trim();
        const resolvedSource =
          rawItemSource &&
          !["csv import", "exam import", "custom"].includes(
            rawItemSource.toLowerCase(),
          )
            ? rawItemSource
            : defaultSource;
        const resolvedIsFree = Boolean(
          payload.isFree !== undefined
            ? payload.isFree
            : (itemData.isFree ?? itemData.is_free ?? false),
        );
        const resolvedExplanation =
          (itemData.explanation || itemData.solution || "").trim() || null;

        const [question] = await tx
          .insert(questions)
          .values({
            subitemId: targetSubitem.id,
            topicId: null,
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

        if (resolvedType === "mcq") {
          const rawOptions =
            itemData.mcqOptions || itemData.mcq_options || itemData.options || [];
          if (Array.isArray(rawOptions) && rawOptions.length > 0) {
            const correctIndex =
              typeof itemData.correctIdx === "number"
                ? itemData.correctIdx
                : typeof itemData.correctIndex === "number"
                  ? itemData.correctIndex
                  : typeof itemData.correctOption === "number"
                    ? itemData.correctOption
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

            if (
              !optionsToInsert.some((o) => o.isCorrect) &&
              optionsToInsert.length > 0
            ) {
              optionsToInsert[0].isCorrect = true;
            }

            await tx.insert(mcqOptions).values(optionsToInsert);
          }
        } else if (resolvedType === "cq") {
          const rawParts =
            itemData.cqParts || itemData.cq_parts || itemData.parts || [];
          if (Array.isArray(rawParts) && rawParts.length > 0) {
            const defaultKeys: Array<"a" | "b" | "c" | "d"> = [
              "a",
              "b",
              "c",
              "d",
            ];
            const partsToInsert = rawParts.map((pt: any, idx: number) => ({
              questionId: question.id,
              partKey: (pt.partKey ||
                pt.part_key ||
                defaultKeys[idx] ||
                "a") as "a" | "b" | "c" | "d",
              questionText: (
                pt.questionText ||
                pt.question_text ||
                pt.text ||
                ""
              ).trim(),
              answerText:
                (
                  pt.answerText ||
                  pt.answer_text ||
                  pt.answer ||
                  ""
                ).trim() || null,
              marks: typeof pt.marks === "number" ? pt.marks : idx + 1,
              orderNo: idx + 1,
            }));
            await tx.insert(cqParts).values(partsToInsert);
          }
        }
      }

      return count;
    });

    if (insertedCount === 0) {
      return {
        success: false,
        error:
          "কোনো প্রশ্ন সংরক্ষণ করা যায়নি। অনুগ্রহ করে নিশ্চিত করুন যে ফাইলের প্রতিটি প্রশ্নে সঠিক questionText ও বিকল্পসমূহ রয়েছে।",
      };
    }

    try {
      revalidatePath("/admin/qb");
      revalidatePath(`/admin/qb/${container.slug}`);
      revalidatePath("/qb");
      revalidatePath(`/qb/${container.slug}`);
      revalidatePath(
        `/qb/${container.slug}/${targetItem.slug}/${targetSubitem.slug}`,
      );
      revalidatePath("/poll");
      revalidatePath("/poll/config");
    } catch (err) {
      console.warn("Revalidate error:", err);
    }

    return {
      success: true,
      count: insertedCount,
      containerTitle: container.title,
      containerSlug: container.slug,
      itemSlug: targetItem.slug,
      yearName: targetSubitem.name,
      yearSlug: targetSubitem.slug,
      subitemId: targetSubitem.id,
    };
  } catch (error: unknown) {
    console.error("Error in importYearBasedQuestionsAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "প্রশ্ন আপলোড করতে সমস্যা হয়েছে।",
    };
  }
}

export async function getContainerYearsAction(containerId: string) {
  try {
    if (!containerId) return [];
    const container = await db.query.containers.findFirst({
      where: eq(containers.id, containerId),
      with: {
        items: {
          with: {
            subitems: {
              with: {
                questions: {
                  columns: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!container) return [];

    const allYears: Array<{
      id: string;
      name: string;
      slug: string;
      itemSlug: string;
      questionCount: number;
    }> = [];

    for (const itm of container.items || []) {
      for (const sub of itm.subitems || []) {
        allYears.push({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          itemSlug: itm.slug,
          questionCount: sub.questions?.length || 0,
        });
      }
    }

    return allYears;
  } catch (error) {
    console.error("Error fetching container years:", error);
    return [];
  }
}


"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { containers, questions } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { StandardCounts } from "@/lib/question-bank";

async function assertAdmin(): Promise<{ ok: boolean; message?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return { ok: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
  }
  return { ok: true };
}

/** Toggles a question's free flag. Free still exists for highlighting only —
 *  every question is readable regardless of this flag. */
export async function toggleQuestionFree(
  questionId: string,
  isFree: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false, message: guard.message };

    await db
      .update(questions)
      .set({ isFree })
      .where(eq(questions.id, questionId));

    revalidatePath("/qb");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "আপডেট করতে সমস্যা হয়েছে।",
    };
  }
}

/** Admin flag on a container. Kept as metadata only — it no longer gates
 *  access, since the question bank is open to every student. */
export async function setContainerPublic(
  containerId: string,
  isPublic: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false, message: guard.message };

    await db
      .update(containers)
      .set({ isPublic })
      .where(eq(containers.id, containerId));

    revalidatePath("/admin/qb");
    revalidatePath("/qb");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "আপডেট করতে সমস্যা হয়েছে।",
    };
  }
}

/**
 * Every question-bank container, with its question counts.
 *
 * No access filtering: every uploaded question is open to every student, so
 * there is no per-batch permission to grant. `standardCounts` feeds the bank
 * grouping, which picks a bank for containers not listed in the bank map.
 */
export async function getUserQbContainers(_userId?: string) {
  try {
    const allContainers = await db.query.containers.findMany({
      with: {
        items: {
          with: {
            subitems: {
              with: {
                questions: {
                  columns: { id: true, standard: true },
                },
              },
            },
          },
        },
      },
      orderBy: (rows, { asc }) => [asc(rows.createdAt)],
    });

    return allContainers.map((c) => {
      let questionsCount = 0;
      const standardCounts: Record<string, number> = {};

      for (const item of c.items ?? []) {
        for (const subitem of item.subitems ?? []) {
          for (const question of subitem.questions ?? []) {
            questionsCount += 1;
            standardCounts[question.standard] =
              (standardCounts[question.standard] ?? 0) + 1;
          }
        }
      }

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        itemsCount: c.items?.length ?? 0,
        questionsCount,
        standardCounts: standardCounts as StandardCounts,
      };
    });
  } catch (error) {
    console.error("Error fetching user QB containers:", error);
    return [];
  }
}

/**
 * Looks up a container for the student route.
 *
 * Every container is open to every student, so this only confirms the container
 * exists. `hasAccess` is always true and exists only to keep callers simple.
 */
export async function checkQbContainerAccess(
  containerSlug: string,
  _userId?: string,
) {
  try {
    const container = await db.query.containers.findFirst({
      where: eq(containers.slug, containerSlug),
    });

    if (!container) {
      return {
        exists: false,
        hasAccess: false,
        container: null,
      };
    }

    return {
      exists: true,
      hasAccess: true,
      container,
    };
  } catch (error) {
    console.error("Error checking QB container access:", error);
    return {
      exists: false,
      hasAccess: false,
      container: null,
    };
  }
}

"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { batchRoutineImages } from "@/db/schema";

/** One page of a course routine. */
export interface RoutineImage {
  readonly id: string;
  readonly batchId: string;
  readonly title: string | null;
  readonly imageUrl: string;
  readonly orderIndex: number;
  readonly isPublished: boolean;
  readonly createdAt: Date | null;
}

export interface RoutineImageResult {
  readonly success: boolean;
  readonly message?: string;
}

export async function getBatchRoutineImages(
  batchId: string,
): Promise<RoutineImage[]> {
  return db
    .select()
    .from(batchRoutineImages)
    .where(eq(batchRoutineImages.batchId, batchId))
    .orderBy(
      asc(batchRoutineImages.orderIndex),
      asc(batchRoutineImages.createdAt),
    );
}

export async function createBatchRoutineImage(
  batchId: string,
  payload: { readonly imageUrl: string; readonly title?: string },
): Promise<RoutineImageResult> {
  const imageUrl = payload.imageUrl.trim();
  if (!imageUrl) return { success: false, message: "ছবির লিঙ্ক দিন।" };
  if (!/^https?:\/\//i.test(imageUrl)) {
    return { success: false, message: "লিঙ্কটি http বা https দিয়ে শুরু হতে হবে।" };
  }

  // Appended to the end so the admin never has to count by hand.
  const existing = await db
    .select({ orderIndex: batchRoutineImages.orderIndex })
    .from(batchRoutineImages)
    .where(eq(batchRoutineImages.batchId, batchId));

  const nextOrder =
    existing.reduce((max, row) => Math.max(max, row.orderIndex), 0) + 1;

  await db.insert(batchRoutineImages).values({
    batchId,
    imageUrl,
    title: payload.title?.trim() || null,
    orderIndex: nextOrder,
  });

  return { success: true };
}

export async function updateBatchRoutineImage(
  id: string,
  payload: { readonly imageUrl?: string; readonly title?: string | null },
): Promise<RoutineImageResult> {
  const values: Record<string, unknown> = {};
  if (payload.imageUrl !== undefined) {
    const url = payload.imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      return {
        success: false,
        message: "লিঙ্কটি http বা https দিয়ে শুরু হতে হবে।",
      };
    }
    values.imageUrl = url;
  }
  if (payload.title !== undefined) {
    values.title = payload.title?.trim() || null;
  }
  if (Object.keys(values).length === 0) {
    return { success: false, message: "পরিবর্তন করার কিছু নেই।" };
  }

  await db
    .update(batchRoutineImages)
    .set(values)
    .where(eq(batchRoutineImages.id, id));
  return { success: true };
}

export async function deleteBatchRoutineImage(
  id: string,
): Promise<RoutineImageResult> {
  await db.delete(batchRoutineImages).where(eq(batchRoutineImages.id, id));
  return { success: true };
}

/** Puts the pages back in the order the admin picks. */
export async function reorderBatchRoutineImages(
  batchId: string,
  orderedIds: readonly string[],
): Promise<RoutineImageResult> {
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(batchRoutineImages)
        .set({ orderIndex: index + 1 })
        .where(eq(batchRoutineImages.id, id));
    }
  });

  return { success: true };
}

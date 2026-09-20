"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  batchDetails,
  batchEnrollmentRequests,
  batchExams,
  batches,
  batchMembers,
} from "@/db/schema";

export async function getBatchesAction() {
  try {
    const list = await db.query.batches.findMany({
      where: eq(batches.isActive, true),
      orderBy: (batches, { desc }) => [desc(batches.createdAt)],
    });
    return { data: list };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch batches",
    };
  }
}

export function normalizeHscBatch(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "HSC 26";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("27") || lower.includes("সাতাস") || lower.includes("২৭")) {
    return "HSC 27";
  }
  if (lower.includes("26") || lower.includes("ছাব্বিশ") || lower.includes("২৬")) {
    return "HSC 26";
  }
  if (
    lower.includes("admi") ||
    lower.includes("এডমিশন") ||
    lower.includes("এডমি") ||
    lower.includes("ভর্তি") ||
    lower.includes("varsity")
  ) {
    return "Admission";
  }
  return trimmed;
}

export async function createBatchAction(formData: FormData) {
  try {
    const id = nanoid();
    const slug = formData.get("slug") as string;
    const isPublished = formData.get("isPublished") === "false" ? false : true;

    await db.transaction(async (tx) => {
      await tx.insert(batches).values({
        id,
        name: formData.get("title") as string,
        slug,
        hscBatch: normalizeHscBatch(formData.get("hscBatch") as string),
        price: parseInt(formData.get("price") as string, 10),
        originalPrice:
          parseInt(formData.get("originalPrice") as string, 10) || null,
        description: formData.get("description") as string,
        image: formData.get("image") as string,
        isPublished,
        isActive: true,
      });

      await tx.insert(batchDetails).values({
        id: nanoid(),
        batchId: id,
        features: [],
        curriculum: [],
        mentorIds: [],
        faqs: [],
      });
    });
    revalidatePath("/admin/batches");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create batch",
    };
  }
}

export async function deleteBatchAction(batchId: string) {
  try {
    await db.delete(batches).where(eq(batches.id, batchId));
    revalidatePath("/admin/batches");
    return { success: true };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to delete" };
  }
}

export async function updateBatchAction(formData: FormData) {
  try {
    const batchId = formData.get("batchId") as string;
    const originalPriceRaw = formData.get("originalPrice") as string;
    const rawHscBatch = formData.get("hscBatch") as string;

    await db
      .update(batches)
      .set({
        name: formData.get("title") as string,
        slug: formData.get("slug") as string,
        hscBatch: normalizeHscBatch(rawHscBatch),
        price: parseInt(formData.get("price") as string, 10),
        originalPrice: originalPriceRaw ? parseInt(originalPriceRaw, 10) : null,
        description: formData.get("description") as string,
        image: formData.get("image") as string,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, batchId));

    revalidatePath("/admin/batches");
    return { success: true };
  } catch (_error: unknown) {
    return { success: false, error: "Failed to update" };
  }
}

export async function updateBatchDetailsAction(
  batchId: string,
  payload: {
    name?: string;
    slug?: string;
    subtitle?: string | null;
    hscBatch?: string;
    price?: number;
    originalPrice?: number | null;
    description?: string;
    image?: string;
    badge?: string | null;
    isPublished?: boolean;
    isActive?: boolean;
    features?: string[];
    curriculum?: any;
    instructors?: Array<{ name: string; role: string; institution: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    routineUrl?: string | null;
    routinePdfUrl?: string | null;
    telegramGroupUrl?: string | null;
    demoVideoUrl?: string | null;
    duration?: string | null;
    rating?: string | null;
    ratingCount?: string | null;
  },
) {
  try {
    await db.transaction(async (tx) => {
      // 1. Update batches table
      const batchUpdate: Record<string, any> = { updatedAt: new Date() };
      if (payload.name !== undefined) batchUpdate.name = payload.name;
      if (payload.slug !== undefined) batchUpdate.slug = payload.slug;
      if (payload.subtitle !== undefined) batchUpdate.subtitle = payload.subtitle;
      if (payload.hscBatch !== undefined)
        batchUpdate.hscBatch = normalizeHscBatch(payload.hscBatch);
      if (payload.price !== undefined) batchUpdate.price = payload.price;
      if (payload.originalPrice !== undefined)
        batchUpdate.originalPrice = payload.originalPrice;
      if (payload.description !== undefined)
        batchUpdate.description = payload.description;
      if (payload.image !== undefined) batchUpdate.image = payload.image;
      if (payload.badge !== undefined) batchUpdate.badge = payload.badge;
      if (payload.isPublished !== undefined)
        batchUpdate.isPublished = payload.isPublished;
      if (payload.isActive !== undefined)
        batchUpdate.isActive = payload.isActive;

      await tx.update(batches).set(batchUpdate).where(eq(batches.id, batchId));

      // 2. Check if batch_details exists
      const existingDetails = await tx.query.batchDetails.findFirst({
        where: eq(batchDetails.batchId, batchId),
      });

      const existingCurriculumObj =
        existingDetails?.curriculum &&
        typeof existingDetails.curriculum === "object" &&
        !Array.isArray(existingDetails.curriculum)
          ? (existingDetails.curriculum as Record<string, any>)
          : {};

      const curriculumData = {
        ...existingCurriculumObj,
        duration:
          payload.duration !== undefined
            ? payload.duration
            : existingCurriculumObj.duration || "১ বছর কমপ্লিট এক্সেস",
        rating:
          payload.rating !== undefined
            ? payload.rating
            : existingCurriculumObj.rating || "5.0",
        ratingCount:
          payload.ratingCount !== undefined
            ? payload.ratingCount
            : existingCurriculumObj.ratingCount || "50+",
        routinePdfUrl:
          payload.routinePdfUrl !== undefined
            ? payload.routinePdfUrl
            : existingCurriculumObj.routinePdfUrl || null,
        telegramGroupUrl:
          payload.telegramGroupUrl !== undefined
            ? payload.telegramGroupUrl
            : existingCurriculumObj.telegramGroupUrl || null,
      };

      const finalInstructors =
        payload.instructors !== undefined
          ? payload.instructors
          : Array.isArray(existingDetails?.mentorIds)
            ? existingDetails.mentorIds
            : [];

      const detailsData: Record<string, any> = {
        updatedAt: new Date(),
        features:
          payload.features !== undefined
            ? payload.features
            : existingDetails?.features || [],
        mentorIds: finalInstructors,
        faqs:
          payload.faqs !== undefined
            ? payload.faqs
            : existingDetails?.faqs || [],
        curriculum: curriculumData,
        routineUrl:
          payload.routinePdfUrl !== undefined
            ? payload.routinePdfUrl
            : payload.routineUrl !== undefined
              ? payload.routineUrl
              : existingDetails?.routineUrl || null,
        demoVideoUrl:
          payload.demoVideoUrl !== undefined
            ? payload.demoVideoUrl
            : existingDetails?.demoVideoUrl || null,
      };

      if (existingDetails) {
        await tx
          .update(batchDetails)
          .set(detailsData)
          .where(eq(batchDetails.batchId, batchId));
      } else {
        await tx.insert(batchDetails).values({
          id: nanoid(),
          batchId,
          features: detailsData.features,
          curriculum: detailsData.curriculum,
          mentorIds: detailsData.mentorIds,
          faqs: detailsData.faqs,
          routineUrl: detailsData.routineUrl,
          demoVideoUrl: detailsData.demoVideoUrl,
        });
      }
    });

    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath("/admin/batches");
    if (payload.slug) {
      revalidatePath(`/courses/${payload.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/");
    revalidatePath("/my-courses");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update course details",
    };
  }
}

export async function getAllBatchesAction() {
  try {
    const list = await db.query.batches.findMany({
      orderBy: [desc(batches.createdAt)],
    });
    return { success: true, data: list };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batches",
    };
  }
}

export async function getBatchDetailAction(id: string) {
  try {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
      with: {
        details: true,
        members: {
          with: { user: true },
        },
        batchExams: {
          with: { exam: true },
        },
      },
    });
    if (!batch) return { success: false, error: "Batch not found" };

    const rawDetails = (batch.details || {}) as any;
    const curriculumObj =
      rawDetails.curriculum &&
      typeof rawDetails.curriculum === "object" &&
      !Array.isArray(rawDetails.curriculum)
        ? rawDetails.curriculum
        : {};

    const instructors = Array.isArray(rawDetails.mentorIds)
      ? rawDetails.mentorIds
      : Array.isArray(rawDetails.instructors)
        ? rawDetails.instructors
        : [];
    const features = Array.isArray(rawDetails.features)
      ? rawDetails.features
      : [];
    const faqs = Array.isArray(rawDetails.faqs) ? rawDetails.faqs : [];
    const duration =
      curriculumObj.duration ||
      rawDetails.duration ||
      "১ বছর কমপ্লিট এক্সেস";
    const rating = curriculumObj.rating || rawDetails.rating || "5.0";
    const ratingCount =
      curriculumObj.ratingCount || rawDetails.ratingCount || "50+";
    const routinePdfUrl =
      rawDetails.routineUrl ||
      curriculumObj.routinePdfUrl ||
      rawDetails.routinePdfUrl ||
      "";
    const telegramGroupUrl =
      curriculumObj.telegramGroupUrl || rawDetails.telegramGroupUrl || "";

    const normalizedDetails = {
      ...rawDetails,
      instructors,
      mentorIds: instructors,
      features,
      faqs,
      duration,
      rating,
      ratingCount,
      routinePdfUrl,
      telegramGroupUrl,
      routineUrl: routinePdfUrl,
    };

    const memberUserIds = batch.members.map((m) => m.userId);
    let enrollmentRequests: (typeof batchEnrollmentRequests.$inferSelect)[] =
      [];
    if (memberUserIds.length > 0) {
      enrollmentRequests = await db.query.batchEnrollmentRequests.findMany({
        where: and(
          inArray(batchEnrollmentRequests.userId, memberUserIds),
          eq(batchEnrollmentRequests.batchId, batch.id),
        ),
      });
    }

    const membersWithRequests = batch.members.map((m) => {
      const request = enrollmentRequests.find((r) => r.userId === m.userId);
      return {
        ...m,
        enrollmentRequest: request
          ? {
              request,
              user: m.user,
              batch: batch,
            }
          : null,
      };
    });

    return {
      success: true,
      data: {
        ...batch,
        details: normalizedDetails,
        members: membersWithRequests,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch batch details",
    };
  }
}

export async function assignExamToBatchAction(
  batchId: string,
  examId: string,
  opts?: {
    startsAt?: string;
    endsAt?: string;
    maxAttempts?: number;
    isRequired?: boolean;
  },
) {
  try {
    const res = await db
      .insert(batchExams)
      .values({
        batchId,
        examId,
        startsAt: opts?.startsAt,
        endsAt: opts?.endsAt,
        maxAttempts: opts?.maxAttempts,
        isRequired: opts?.isRequired ?? true,
      })
      .returning();
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: res[0] };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign exam",
    };
  }
}

export async function removeExamFromBatchAction(
  batchExamId: string,
  batchId: string,
) {
  try {
    await db.delete(batchExams).where(eq(batchExams.id, batchExamId));
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove exam",
    };
  }
}

export async function addMemberToBatchAction(
  batchId: string,
  userId: string,
  role: "student" | "moderator" | "instructor" = "student",
) {
  try {
    const res = await db
      .insert(batchMembers)
      .values({
        batchId,
        userId,
        role,
      })
      .returning();
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: res[0] };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add member",
    };
  }
}

export async function removeMemberFromBatchAction(
  batchMemberId: string,
  batchId: string,
) {
  try {
    await db.delete(batchMembers).where(eq(batchMembers.id, batchMemberId));
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

export async function getBatchMembersAction(batchId: string) {
  try {
    const members = await db.query.batchMembers.findMany({
      where: eq(batchMembers.batchId, batchId),
      with: { user: true },
    });
    return { success: true, data: members };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch members",
    };
  }
}

export async function updateBatchExamAction(
  batchExamId: string,
  batchId: string,
  opts: {
    startsAt?: string | null;
    endsAt?: string | null;
    maxAttempts?: number | null;
    isRequired?: boolean;
  },
) {
  try {
    const res = await db
      .update(batchExams)
      .set({
        startsAt: opts.startsAt ?? undefined,
        endsAt: opts.endsAt ?? undefined,
        maxAttempts: opts.maxAttempts ?? undefined,
        isRequired: opts.isRequired ?? undefined,
      })
      .where(eq(batchExams.id, batchExamId))
      .returning();
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: res[0] };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update batch exam",
    };
  }
}

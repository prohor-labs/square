"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  batchEnrollments,
  batchMembers,
  batchQbAccess,
  batches,
  containers,
  items,
  questions,
  subitems,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getBatchQbAccess(batchId: string): Promise<string[]> {
  try {
    const records = await db
      .select({ containerId: batchQbAccess.containerId })
      .from(batchQbAccess)
      .where(eq(batchQbAccess.batchId, batchId));

    return records.map((r) => r.containerId);
  } catch (error) {
    console.error("Error fetching batch QB access:", error);
    return [];
  }
}

export async function setBatchQbAccess(
  batchId: string,
  containerIds: string[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    // Delete existing assignments for this batch
    await db.delete(batchQbAccess).where(eq(batchQbAccess.batchId, batchId));

    // Insert new assignments if any
    if (containerIds.length > 0) {
      const values = containerIds.map((cid) => ({
        batchId,
        containerId: cid,
      }));
      await db.insert(batchQbAccess).values(values);
    }

    try {
      revalidatePath(`/admin/batches/${batchId}`);
      revalidatePath("/admin/batches");
      revalidatePath("/qb", "layout");
      revalidatePath("/qb");
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating batch QB access:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "অ্যাক্সেস আপডেট করতে সমস্যা হয়েছে।",
    };
  }
}

export async function toggleBatchContainerAccess(
  batchId: string,
  containerId: string,
  enabled: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    if (enabled) {
      // Check if already assigned
      const existing = await db
        .select({ id: batchQbAccess.id })
        .from(batchQbAccess)
        .where(
          and(
            eq(batchQbAccess.batchId, batchId),
            eq(batchQbAccess.containerId, containerId),
          ),
        );

      if (existing.length === 0) {
        await db.insert(batchQbAccess).values({
          batchId,
          containerId,
        });
      }
    } else {
      await db
        .delete(batchQbAccess)
        .where(
          and(
            eq(batchQbAccess.batchId, batchId),
            eq(batchQbAccess.containerId, containerId),
          ),
        );
    }

    try {
      revalidatePath(`/admin/batches/${batchId}`);
      revalidatePath("/admin/batches");
      revalidatePath("/qb", "layout");
      revalidatePath("/qb");
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error toggling batch QB access:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "অ্যাক্সেস পরিবর্তন করতে সমস্যা হয়েছে।",
    };
  }
}

export async function toggleContainerPublic(
  containerId: string,
  isPublic: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    await db
      .update(containers)
      .set({ isPublic })
      .where(eq(containers.id, containerId));

    try {
      revalidatePath("/qb");
      revalidatePath("/admin/qb");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error toggling container public:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "আপডেট করতে সমস্যা হয়েছে।",
    };
  }
}

export async function toggleQuestionFree(
  questionId: string,
  isFree: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      return { success: false, message: "শুধুমাত্র অ্যাডমিন এক্সেস প্রয়োজন।" };
    }

    await db
      .update(questions)
      .set({ isFree })
      .where(eq(questions.id, questionId));

    try {
      revalidatePath("/qb");
    } catch (e) {
      console.warn("Revalidation warning:", e);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error toggling question free:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "আপডেট করতে সমস্যা হয়েছে।",
    };
  }
}

export async function getUserQbContainers(userId?: string) {
  try {
    // 1. Fetch all containers with items, subitems, questions count and assigned batches
    const allContainers = await db.query.containers.findMany({
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
        batchAccess: {
          with: {
            batch: true,
          },
        },
      },
      orderBy: (containers, { asc }) => [asc(containers.createdAt)],
    });

    // 2. Fetch user's active enrolled batches from both enrollments and batch members
    let userBatchIds: string[] = [];
    let isAdmin = false;

    if (userId) {
      const [userRecord, enrollmentRows, memberRows] = await Promise.all([
        db.select({ role: user.role }).from(user).where(eq(user.id, userId)),
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
            and(
              eq(batchMembers.userId, userId),
              eq(batchMembers.status, "active"),
            ),
          ),
      ]);

      isAdmin = userRecord[0]?.role === "admin";
      userBatchIds = Array.from(
        new Set([
          ...enrollmentRows.map((e) => e.batchId),
          ...memberRows.map((m) => m.batchId),
        ]),
      );
    }

    const mappedContainers = allContainers.map((c) => {
      const assignedBatches =
        c.batchAccess?.map((ba) => ({
          id: ba.batch.id,
          name: ba.batch.name,
          slug: ba.batch.slug,
          hscBatch: ba.batch.hscBatch,
        })) || [];

      const isEnrolled = assignedBatches.some((b) =>
        userBatchIds.includes(b.id),
      );
      // Strictly enforce access: only public containers or enrolled batch members have access on /qb
      const hasBatchAccess = Boolean(c.isPublic || isEnrolled);

      let accessType: "public" | "enrolled" | "admin" | "restricted" =
        "restricted";
      if (c.isPublic) {
        accessType = "public";
      } else if (isEnrolled) {
        accessType = "enrolled";
      } else if (isAdmin) {
        accessType = "admin";
      }

      const totalQuestionsCount = (c.items || []).reduce(
        (acc, it) =>
          acc +
          (it.subitems || []).reduce(
            (sacc, sub) => sacc + (sub.questions?.length || 0),
            0,
          ),
        0,
      );

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        isPublic: c.isPublic,
        itemsCount: c.items?.length || 0,
        questionsCount: totalQuestionsCount,
        hasAccess: hasBatchAccess,
        isEnrolled,
        isAdmin,
        accessType,
        assignedBatches,
      };
    });

    // Only return question banks the user has access to (public, enrolled in assigned batch, or admin).
    // Locked/unauthorized question banks are completely hidden from non-enrolled students.
    return mappedContainers.filter((c) => c.hasAccess || c.isAdmin);
  } catch (error) {
    console.error("Error fetching user QB containers:", error);
    return [];
  }
}

export async function checkQbContainerAccess(
  containerSlug: string,
  userId?: string,
) {
  try {
    const container = await db.query.containers.findFirst({
      where: eq(containers.slug, containerSlug),
      with: {
        batchAccess: {
          with: {
            batch: true,
          },
        },
      },
    });

    if (!container)
      return {
        exists: false,
        hasAccess: false,
        accessType: "restricted" as const,
        container: null,
        assignedBatches: [],
        isAdmin: false,
        isEnrolled: false,
      };

    const assignedBatches =
      container.batchAccess?.map((ba) => ({
        id: ba.batch.id,
        name: ba.batch.name,
        slug: ba.batch.slug,
        hscBatch: ba.batch.hscBatch,
      })) || [];

    let isAdmin = false;
    let userBatchIds: string[] = [];

    if (userId) {
      const [userRecord, enrollmentRows, memberRows] = await Promise.all([
        db.select({ role: user.role }).from(user).where(eq(user.id, userId)),
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
            and(
              eq(batchMembers.userId, userId),
              eq(batchMembers.status, "active"),
            ),
          ),
      ]);

      isAdmin = userRecord[0]?.role === "admin";
      userBatchIds = Array.from(
        new Set([
          ...enrollmentRows.map((e) => e.batchId),
          ...memberRows.map((m) => m.batchId),
        ]),
      );
    }

    if (container.isPublic) {
      return {
        exists: true,
        hasAccess: true,
        accessType: "public" as const,
        container,
        assignedBatches,
        isAdmin,
        isEnrolled: true,
      };
    }

    const isEnrolled = assignedBatches.some((b) => userBatchIds.includes(b.id));
    // Strictly enforce course access on student route: only enrolled batch members or public containers
    const hasAccess = Boolean(isEnrolled);

    let accessType: "public" | "enrolled" | "admin" | "restricted" =
      "restricted";
    if (isEnrolled) {
      accessType = "enrolled";
    } else if (isAdmin) {
      accessType = "admin";
    }

    return {
      exists: true,
      hasAccess,
      accessType,
      isEnrolled,
      isAdmin,
      container,
      assignedBatches,
    };
  } catch (error) {
    console.error("Error checking QB container access:", error);
    return {
      exists: false,
      hasAccess: false,
      accessType: "restricted" as const,
      container: null,
      assignedBatches: [],
      isAdmin: false,
      isEnrolled: false,
    };
  }
}

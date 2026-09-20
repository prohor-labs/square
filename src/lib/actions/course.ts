"use server";

import { and, desc, eq, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  batchEnrollmentRequests,
  batchEnrollments,
  batches,
} from "@/db/schema";
import { normalizeHscBatch } from "@/lib/actions/batch";
import { auth } from "@/lib/auth";

export async function getCourses(batch?: string) {
  let condition: SQL | undefined = eq(batches.isPublished, true);

  if (batch) {
    condition = and(condition, eq(batches.hscBatch, normalizeHscBatch(batch)));
  }

  const results = await db.query.batches.findMany({
    where: condition,
    with: {
      details: true,
    },
  });

  return results
    .map((b) => {
      const details = b.details as any;
      const curriculumObj =
        details?.curriculum &&
        typeof details.curriculum === "object" &&
        !Array.isArray(details.curriculum)
          ? details.curriculum
          : {};
      const instructors = Array.isArray(details?.mentorIds)
        ? details.mentorIds
        : Array.isArray(details?.instructors)
          ? details.instructors
          : [];
      const features = Array.isArray(details?.features) ? details.features : [];
      const faqs = Array.isArray(details?.faqs) ? details.faqs : [];
      const duration =
        curriculumObj.duration || details?.duration || "১ বছর কমপ্লিট এক্সেস";
      const rating = curriculumObj.rating || details?.rating || "5.0";
      const ratingCount =
        curriculumObj.ratingCount || details?.ratingCount || "50+";
      const routinePdfUrl =
        details?.routineUrl ||
        curriculumObj.routinePdfUrl ||
        details?.routinePdfUrl ||
        "";
      const telegramGroupUrl =
        curriculumObj.telegramGroupUrl || details?.telegramGroupUrl || "";

      return {
        ...b,
        title: b.name,
        name: b.name,
        features,
        instructors,
        mentorIds: instructors,
        faqs,
        duration,
        rating,
        ratingCount,
        routinePdfUrl,
        telegramGroupUrl,
        details: {
          ...details,
          features,
          instructors,
          mentorIds: instructors,
          faqs,
          duration,
          rating,
          ratingCount,
          routinePdfUrl,
          telegramGroupUrl,
        },
      };
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

export async function getFeaturedCourses() {
  const results = await db.query.batches.findMany({
    where: eq(batches.isPublished, true),
    orderBy: [desc(batches.createdAt)],
    limit: 6,
    with: {
      details: true,
    },
  });

  return results.map((b) => {
    const details = b.details as any;
    const curriculumObj =
      details?.curriculum &&
      typeof details.curriculum === "object" &&
      !Array.isArray(details.curriculum)
        ? details.curriculum
        : {};
    const instructors = Array.isArray(details?.mentorIds)
      ? details.mentorIds
      : Array.isArray(details?.instructors)
        ? details.instructors
        : [];
    const features = Array.isArray(details?.features) ? details.features : [];
    const faqs = Array.isArray(details?.faqs) ? details.faqs : [];
    const duration =
      curriculumObj.duration || details?.duration || "১ বছর কমপ্লিট এক্সেস";
    const rating = curriculumObj.rating || details?.rating || "5.0";
    const ratingCount =
      curriculumObj.ratingCount || details?.ratingCount || "50+";
    const routinePdfUrl =
      details?.routineUrl ||
      curriculumObj.routinePdfUrl ||
      details?.routinePdfUrl ||
      "";
    const telegramGroupUrl =
      curriculumObj.telegramGroupUrl || details?.telegramGroupUrl || "";

    return {
      ...b,
      title: b.name,
      name: b.name,
      features,
      instructors,
      mentorIds: instructors,
      faqs,
      duration,
      rating,
      ratingCount,
      routinePdfUrl,
      telegramGroupUrl,
      details: {
        ...details,
        features,
        instructors,
        mentorIds: instructors,
        faqs,
        duration,
        rating,
        ratingCount,
        routinePdfUrl,
        telegramGroupUrl,
      },
    };
  });
}

export async function getUserEnrollments(userId: string) {
  const enrollments = await db.query.batchEnrollments.findMany({
    where: eq(batchEnrollments.userId, userId),
    with: {
      batch: true,
    },
  });

  return enrollments;
}

export async function hasEnrolled(userId: string, batchId: string) {
  const enrollments = await getUserEnrollments(userId);
  return enrollments.some(
    (e: any) => e.batchId === batchId && e.status === "active",
  );
}

export async function checkEnrollmentStatus(userId: string, batchId: string) {
  // 1. First check if user has an active enrollment
  const activeEnrollment = await db.query.batchEnrollments.findFirst({
    where: and(
      eq(batchEnrollments.userId, userId),
      eq(batchEnrollments.batchId, batchId),
      eq(batchEnrollments.status, "active"),
    ),
  });

  if (activeEnrollment) {
    return { status: "active" as const };
  }

  // 2. Otherwise check enrollment requests (pending, rejected, etc.)
  const userReqs = await db.query.batchEnrollmentRequests.findMany({
    where: and(
      eq(batchEnrollmentRequests.userId, userId),
      eq(batchEnrollmentRequests.batchId, batchId),
    ),
    orderBy: [desc(batchEnrollmentRequests.createdAt)],
  });

  if (userReqs.length > 0) {
    return userReqs[0];
  }
  return null;
}

export async function getMyCourses(userId: string) {
  const enrollments = await db.query.batchEnrollments.findMany({
    where: eq(batchEnrollments.userId, userId),
    with: {
      batch: {
        with: { details: true },
      },
    },
  });

  return (
    enrollments
      .filter((e: any) => e.status === "active")
      .map((e: any) => {
        const details = e.batch?.details || {};
        const curriculumObj =
          details?.curriculum &&
          typeof details.curriculum === "object" &&
          !Array.isArray(details.curriculum)
            ? details.curriculum
            : {};
        const telegramGroupUrl =
          curriculumObj.telegramGroupUrl || details?.telegramGroupUrl || "";

        return {
          ...details,
          ...e.batch,
          id: e.batch?.id,
          batchDetailsId: details.id,
          enrollmentId: e.id,
          title: e.batch?.name,
          name: e.batch?.name,
          telegramGroupUrl,
          details: {
            ...details,
            telegramGroupUrl,
          },
          enrolledAt: e.enrolledAt,
          accessGrantedBy: e.accessGrantedBy,
        };
      }) || []
  );
}

export async function submitEnrollmentRequest(data: {
  userId?: string;
  batchId: string;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  amount?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("You must be logged in to enroll");
  }

  const batchId = data.batchId;
  const amount = data.amount || 0;
  const paymentMethod = data.paymentMethod;
  const transactionId = data.transactionId;
  const senderNumber = data.senderNumber;

  if (!batchId || !paymentMethod || !senderNumber) {
    throw new Error("Missing required fields");
  }

  await db.insert(batchEnrollmentRequests).values({
    id: nanoid(),
    userId: session.user.id,
    batchId,
    amount,
    paymentMethod,
    transactionId: transactionId || "N/A",
    senderNumber,
    status: "pending",
  });

  revalidatePath(`/courses/${batchId}`);
  revalidatePath("/dashboard");
}

export async function getUserCourseById(userId: string, batchId: string) {
  const enrollment = await db.query.batchEnrollments.findFirst({
    where: and(
      eq(batchEnrollments.userId, userId),
      eq(batchEnrollments.batchId, batchId),
    ),
    with: {
      batch: {
        with: { details: true, batchExams: { with: { exam: true } } },
      },
    },
  });

  if (enrollment?.status !== "active") return null;

  const details = enrollment.batch?.details || {};
  return {
    ...details,
    ...enrollment.batch,
    id: enrollment.batch?.id,
    title: enrollment.batch?.name,
    name: enrollment.batch?.name,
    details,
    enrolledAt: enrollment.enrolledAt,
  };
}

export async function getCourseWithDetailsBySlug(slug: string) {
  const b = await db.query.batches.findFirst({
    where: eq(batches.slug, slug),
    with: { details: true },
  });
  if (!b) return null;

  const details = b.details as any;
  const curriculumObj =
    details?.curriculum &&
    typeof details.curriculum === "object" &&
    !Array.isArray(details.curriculum)
      ? details.curriculum
      : {};

  const instructors = Array.isArray(details?.mentorIds)
    ? details.mentorIds
    : Array.isArray(details?.instructors)
      ? details.instructors
      : [];
  const features = Array.isArray(details?.features) ? details.features : [];
  const faqs = Array.isArray(details?.faqs) ? details.faqs : [];
  const duration =
    curriculumObj.duration || details?.duration || "১ বছর কমপ্লিট এক্সেস";
  const rating = curriculumObj.rating || details?.rating || "5.0";
  const ratingCount =
    curriculumObj.ratingCount || details?.ratingCount || "50+";
  const routinePdfUrl =
    details?.routineUrl ||
    curriculumObj.routinePdfUrl ||
    details?.routinePdfUrl ||
    "";
  const telegramGroupUrl =
    curriculumObj.telegramGroupUrl || details?.telegramGroupUrl || "";

  return {
    ...b,
    title: b.name,
    name: b.name,
    features,
    instructors,
    mentorIds: instructors,
    faqs,
    duration,
    rating,
    ratingCount,
    routinePdfUrl,
    telegramGroupUrl,
    details: {
      ...details,
      features,
      instructors,
      mentorIds: instructors,
      faqs,
      duration,
      rating,
      ratingCount,
      routinePdfUrl,
      telegramGroupUrl,
    },
  };
}

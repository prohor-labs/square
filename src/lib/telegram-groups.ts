import { and, asc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import {
  batchEnrollments,
  batchMembers,
  batchTelegramInvites,
  batches,
} from "@/db/schema";

const TELEGRAM_LINK_ERROR =
  "সঠিক প্রাইভেট Telegram গ্রুপ লিংক দিন (https://t.me/+... অথবা https://t.me/joinchat/...)";

export function normalizePrivateTelegramUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(TELEGRAM_LINK_ERROR);
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  const isPrivateInvite =
    /^\/\+[A-Za-z0-9_-]+$/.test(path) ||
    /^\/joinchat\/[A-Za-z0-9_-]+$/.test(path);

  if (
    parsed.protocol !== "https:" ||
    (parsed.hostname !== "t.me" && parsed.hostname !== "telegram.me") ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !isPrivateInvite
  ) {
    throw new Error(TELEGRAM_LINK_ERROR);
  }

  return `https://t.me${path}`;
}

export interface StudentTelegramGroup {
  readonly batchId: string;
  readonly courseName: string;
  readonly url: string;
}

export async function getStudentTelegramGroups(
  userId: string,
): Promise<readonly StudentTelegramGroup[]> {
  const selection = {
    batchId: batches.id,
    courseName: batches.name,
    url: batchTelegramInvites.url,
  };

  const [enrollments, memberships] = await Promise.all([
    db
      .select(selection)
      .from(batchEnrollments)
      .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
      .innerJoin(
        batchTelegramInvites,
        eq(batchEnrollments.batchId, batchTelegramInvites.batchId),
      )
      .where(
        and(
          eq(batchEnrollments.userId, userId),
          eq(batchEnrollments.status, "active"),
          or(
            isNull(batchEnrollments.expiresAt),
            gt(batchEnrollments.expiresAt, new Date()),
          ),
        ),
      )
      .orderBy(asc(batches.orderIndex), asc(batches.name)),
    db
      .select(selection)
      .from(batchMembers)
      .innerJoin(batches, eq(batchMembers.batchId, batches.id))
      .innerJoin(
        batchTelegramInvites,
        eq(batchMembers.batchId, batchTelegramInvites.batchId),
      )
      .where(
        and(
          eq(batchMembers.userId, userId),
          eq(batchMembers.status, "active"),
        ),
      )
      .orderBy(asc(batches.orderIndex), asc(batches.name)),
  ]);

  const groups = new Map<string, StudentTelegramGroup>();
  for (const row of [...enrollments, ...memberships]) {
    groups.set(row.batchId, row);
  }

  return [...groups.values()].sort((a, b) =>
    a.courseName.localeCompare(b.courseName, "bn"),
  );
}

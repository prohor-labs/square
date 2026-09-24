import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminSubitemsManager } from "@/components/admin/admin-subitems-manager";
import { db } from "@/db";
import { containers, items, subitems } from "@/db/schema";

import type { Item, Subitem } from "@/types";

export default async function AdminQbChaptersPage({
  params,
}: {
  readonly params: Promise<{ containerSlug: string; itemSlug: string }>;
}) {
  const { containerSlug, itemSlug } = await params;

  const qb = await db.query.containers.findFirst({
    where: eq(containers.slug, containerSlug),
  });

  if (!qb) notFound();

  const subject = await db.query.items.findFirst({
    where: and(eq(items.containerId, qb.id), eq(items.slug, itemSlug)),
  });

  if (!subject) notFound();

  const chapterList = await db.query.subitems.findMany({
    where: eq(subitems.itemId, subject.id),
    with: {
      topics: true,
      questions: true,
    },
    orderBy: (subitems, { asc }) => [asc(subitems.orderNo)],
  });

  const formattedSubject: Item = {
    ...subject,
    container_id: subject.containerId,
  };

  const formattedChapters: Subitem[] = chapterList.map((ch) => ({
    ...ch,
    item_id: ch.itemId,
    order_no: ch.orderNo,
    paper: ch.paper || undefined,
    topics: [{ count: ch.topics?.length || 0 }],
    questions: [{ count: ch.questions?.length || 0 }],
  }));

  return (
    <AdminSubitemsManager
      qb={qb}
      subject={formattedSubject}
      initialChapters={formattedChapters}
    />
  );
}

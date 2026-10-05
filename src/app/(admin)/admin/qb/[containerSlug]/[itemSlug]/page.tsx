import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminSubitemsManager } from "@/components/admin/admin-subitems-manager";
import { db } from "@/db";
import { containers, items, subitems } from "@/db/schema";

import type { Item, Subitem } from "@/types";

export default async function AdminQbYearsPage({
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

  const yearList = await db.query.subitems.findMany({
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

  const formattedYears: Subitem[] = yearList.map((year) => ({
    ...year,
    item_id: year.itemId,
    order_no: year.orderNo,
    paper: year.paper || undefined,
    topics: [{ count: year.topics?.length || 0 }],
    questions: [{ count: year.questions?.length || 0 }],
  }));

  return (
    <AdminSubitemsManager
      qb={qb}
      subject={formattedSubject}
      initialYears={formattedYears}
    />
  );
}

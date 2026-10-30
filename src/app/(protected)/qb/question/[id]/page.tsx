import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbQuestionView } from "@/components/qb/student/qb-question-view";
import { QbShell } from "@/components/qb/student/qb-shell";
import { getQbQuestionContext } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

/** One question, with the previous/next question of the same file. */
export default async function QbQuestionRoute({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const rawSet = Array.isArray(query.set) ? query.set[0] : query.set;

  const context = await getQbQuestionContext(id, rawSet?.trim() || undefined);
  if (!context) notFound();

  return (
    <QbShell>
      <QbQuestionView context={context} />
    </QbShell>
  );
}

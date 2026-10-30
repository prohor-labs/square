import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { BookOpen } from "@/components/icons";
import { QbPageView } from "@/components/qb/student/qb-page-view";
import { QbShell } from "@/components/qb/student/qb-shell";
import { getQbSubjectPage, readSegment } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

/**
 * `/qb/subject`, `/<subject>`, `/<subject>/<paper>`, `…/<chapter>` and
 * `…/<topic>`. A subject without a paper split skips that level, which is why
 * one catch-all segment serves both shapes.
 */
export default async function QbSubjectRoute({
  params,
  searchParams,
}: {
  readonly params: Promise<{ path?: readonly string[] }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const [{ path }, query] = await Promise.all([params, searchParams]);
  const segments = (path ?? []).map(readSegment);
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Number(rawPage);
  const rawSubject = Array.isArray(query.subject)
    ? query.subject[0]
    : query.subject;

  const data = await getQbSubjectPage(
    segments,
    Number.isFinite(page) && page > 0 ? page : 1,
    rawSubject?.trim() ?? "",
  );

  if (!data) notFound();

  return (
    <QbShell>
      <QbPageView
        data={data}
        icon={<BookOpen className="size-5" aria-hidden="true" />}
        eyebrow="বিষয়ভিত্তিক"
      />
    </QbShell>
  );
}

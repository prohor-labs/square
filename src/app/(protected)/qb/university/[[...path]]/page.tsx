import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Building } from "@/components/icons";
import { QbPageView } from "@/components/qb/student/qb-page-view";
import { QbShell } from "@/components/qb/student/qb-shell";
import { getQbUniversityPage, readSegment } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

/** `/qb/university`, `/<university>`, `/<university>/<unit>` and `…/<year>`. */
export default async function QbUniversityRoute({
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

  const data = await getQbUniversityPage(
    segments,
    Number.isFinite(page) && page > 0 ? page : 1,
    rawSubject?.trim() ?? "",
  );

  if (!data) notFound();

  return (
    <QbShell>
      <QbPageView
        data={data}
        icon={<Building className="size-5" aria-hidden="true" />}
        eyebrow="বিশ্ববিদ্যালয়ভিত্তিক"
      />
    </QbShell>
  );
}

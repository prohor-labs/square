import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Stethoscope } from "@/components/icons";
import { QbPageView } from "@/components/qb/student/qb-page-view";
import { QbShell } from "@/components/qb/student/qb-shell";
import { getQbMedicalPage, readSegment } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

/** `/qb/medical`, `/<category>` and `…/<year>`. */
export default async function QbMedicalRoute({
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

  const data = await getQbMedicalPage(
    segments,
    Number.isFinite(page) && page > 0 ? page : 1,
    rawSubject?.trim() ?? "",
  );

  if (!data) notFound();

  return (
    <QbShell>
      <QbPageView
        data={data}
        icon={<Stethoscope className="size-5" aria-hidden="true" />}
        eyebrow="মেডিকেলভিত্তিক"
      />
    </QbShell>
  );
}

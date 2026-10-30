import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Calculator } from "@/components/icons";
import { QbPageView } from "@/components/qb/student/qb-page-view";
import { QbShell } from "@/components/qb/student/qb-shell";
import { getQbEngineeringPage, readSegment } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

/** `/qb/engineering`, `/<institution>` and `…/<year>`. */
export default async function QbEngineeringRoute({
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

  const data = await getQbEngineeringPage(
    segments,
    Number.isFinite(page) && page > 0 ? page : 1,
  );

  if (!data) notFound();

  return (
    <QbShell>
      <QbPageView
        data={data}
        icon={<Calculator className="size-5" aria-hidden="true" />}
        eyebrow="ইঞ্জিনিয়ারিংভিত্তিক"
      />
    </QbShell>
  );
}

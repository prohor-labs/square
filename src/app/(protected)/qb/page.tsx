import type { ReactElement } from "react";
import { QbBrowser } from "@/components/qb/qb-browser";
import { getQbCounts, getQbQuestions } from "@/lib/actions/qb-browse";
import { parseQbQuery } from "@/lib/qb-browse-types";

export const dynamic = "force-dynamic";

/**
 * Reading the query string here rather than in the client means the first
 * paint already carries the right page of questions, and a link to a filtered
 * slice pastes straight into the address bar.
 */
export default async function QbPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const query = parseQbQuery((await searchParams) ?? {});

  const [initial, counts] = await Promise.all([
    getQbQuestions(query),
    getQbCounts(query),
  ]);

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-24 pt-3 sm:pt-6">
      <QbBrowser initial={initial} initialCounts={counts} initialQuery={query} />
    </div>
  );
}

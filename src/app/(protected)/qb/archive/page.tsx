import Link from "next/link";
import type { ReactElement } from "react";
import { ArrowLeft2 } from "@/components/icons";
import { QbBrowser } from "@/components/qb/qb-browser";
import { getQbCounts, getQbQuestions } from "@/lib/actions/qb-browse";
import { parseQbQuery } from "@/lib/qb-browse-types";

export const dynamic = "force-dynamic";

/**
 * The archived board/varsity/medical bank.
 *
 * Kept reachable from the new landing page so the questions that were imported
 * before the upload-based bank still have a home; it is not part of the four
 * new sections and is linked as an archive on purpose.
 */
export default async function QbArchivePage({
  searchParams,
}: {
  readonly searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
}): Promise<ReactElement> {
  const query = parseQbQuery((await searchParams) ?? {});

  const [initial, counts] = await Promise.all([
    getQbQuestions(query),
    getQbCounts(query),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-24 pt-3 sm:px-6 sm:pt-6">
      <Link
        href="/qb"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft2 className="size-3.5" aria-hidden="true" />
        নতুন প্রশ্নব্যাংকে ফিরুন
      </Link>
      <QbBrowser
        initial={initial}
        initialCounts={counts}
        initialQuery={query}
      />
    </div>
  );
}

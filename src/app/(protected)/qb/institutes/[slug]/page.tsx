import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbQuestionList } from "@/components/qb/QbQuestionList";
import { db } from "@/db";
import { qbInstitutes } from "@/db/schema";
import { getBookmarkedQuestionIds } from "@/lib/actions/qb-bookmarks";
import { getInstituteFacets, listQbQuestions } from "@/lib/actions/qb-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";
import { BASE_FILTERS, facetFilter, parseQbQuery } from "@/lib/qb-page";

export const dynamic = "force-dynamic";

/** The path segment under `/qb/institutes/` that names each exam. */
const TYPE_BY_SLUG: Record<string, string> = {
  board: "বোর্ড প্রশ্ন ব্যাংক",
  university: "ভার্সিটি প্রশ্ন ব্যাংক",
  engineering: "ইঞ্জিনিয়ারিং প্রশ্ন ব্যাংক",
  medical: "মেডিকেল প্রশ্ন ব্যাংক",
};

/**
 * One board or university, and its questions.
 *
 * The year, group and unit live in the filter rail rather than in the URL path.
 * A board's pages are years, and a university is one page with twelve years on
 * it — giving each year its own address would make twelve pages that all look
 * the same and none of them linkable from a search.
 */
export default async function QbInstitutePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const { slug } = await params;

  const [institute] = await db
    .select()
    .from(qbInstitutes)
    .where(eq(qbInstitutes.slug, slug))
    .limit(1);
  if (!institute) notFound();

  const query = new URLSearchParams(
    Object.entries((await searchParams) ?? {}).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  );

  const { filters, page } = parseQbQuery(query, {
    instituteId: institute.id,
  });

  const [facets, { rows, total }] = await Promise.all([
    getInstituteFacets(institute.id),
    listQbQuestions(filters),
  ]);

  const bookmarkedIds = await getBookmarkedQuestionIds(rows.map((r) => r.id));
  const session = await auth.api.getSession({ headers: await headers() });

  const isBoard = institute.type === "board";
  const sectionLabel = TYPE_BY_SLUG[institute.type] ?? "প্রশ্নব্যাংক";

  const filters_ = [
    ...BASE_FILTERS,
    // A board paper has no unit, and a university's years are its whole story —
    // showing the wrong one of the two for this page would just be noise.
    ...(isBoard
      ? [facetFilter("group", "গ্রুপ", facets.groups)]
      : [facetFilter("unit", "ইউনিট", facets.units)]),
    facetFilter("year", "বছর", facets.years),
  ];

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[
          { label: "প্রশ্নব্যাংক", href: "/qb" },
          { label: sectionLabel, href: `/qb/${institute.type}` },
          { label: institute.name },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {institute.name}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {toBengaliDigits(total)} টি প্রশ্ন ·{" "}
          {facets.years.length > 0
            ? `${toBengaliDigits(facets.years.length)} বছর`
            : "এখনো কোনো প্রশ্ন নেই"}
        </p>
      </div>

      <QbQuestionList
        questions={rows}
        total={total}
        page={page}
        filters={filters_}
        bookmarkedIds={bookmarkedIds}
        canBookmark={Boolean(session?.user)}
        emptyMessage="এই বছর বা ইউনিটে কোনো প্রশ্ন নেই। ফিল্টার একটু বদলে দেখুন।"
      />
    </div>
  );
}

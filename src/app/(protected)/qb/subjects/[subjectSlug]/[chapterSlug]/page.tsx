import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbQuestionList } from "@/components/qb/QbQuestionList";
import { QbSearchBar } from "@/components/qb/QbSearchBar";
import { getBookmarkedQuestionIds } from "@/lib/actions/qb-bookmarks";
import { getTopicsWithCounts, listQbQuestions } from "@/lib/actions/qb-library";
import {
  getChapterBySlug,
  getChapterExamTypes,
  getChapterFacets,
  getChapterInstitutes,
} from "@/lib/actions/qb-subject";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";
import { BASE_FILTERS, facetFilter, parseQbQuery } from "@/lib/qb-page";

export const dynamic = "force-dynamic";

/**
 * One chapter, seen from every exam at once.
 *
 * This is the page the whole bank is arranged around: a chapter of a subject,
 * with the board, medical, varsity and engineering questions that fall in it all
 * on the same page. Each question is one record, so a question that sat in
 * three papers appears once, with the three papers folded away under
 * "পরীক্ষায় এসেছে".
 */
export default async function QbChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectSlug: string; chapterSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const { subjectSlug, chapterSlug } = await params;

  const found = await getChapterBySlug(subjectSlug, chapterSlug);
  if (!found) notFound();
  const { chapter, subject } = found;

  const query = new URLSearchParams(
    Object.entries((await searchParams) ?? {}).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  );

  const { filters, page } = parseQbQuery(query, {
    chapterId: chapter.id,
    subjectId: subject.id,
  });

  const [examTypes, institutes, facets, topics, result, session] =
    await Promise.all([
      getChapterExamTypes(chapter.id),
      getChapterInstitutes(chapter.id, filters.examType),
      getChapterFacets(chapter.id, {
        examType: filters.examType,
        instituteId: filters.instituteId,
      }),
      getTopicsWithCounts(chapter.id),
      listQbQuestions(filters),
      auth.api.getSession({ headers: await headers() }),
    ]);

  const bookmarkedIds = await getBookmarkedQuestionIds(
    result.rows.map((r) => r.id),
  );

  // The chapter helpers return plain strings for their units and years, and
  // topics come back keyed by id; the rail wants value/label pairs.
  const topicFacets = topics.map((t) => ({
    value: t.id,
    label: t.name,
    questions: t.questions,
  }));
  const unitFacets = facets.units.map((u) => ({
    value: u,
    label: u,
    questions: 0,
  }));
  const yearFacets = facets.years.map((y) => ({
    value: y,
    label: y,
    questions: 0,
  }));

  // A topic appears as soon as the admin names one. Until then the filter would
  // be an empty select, so it is left out rather than shown empty.
  const filterList = [
    ...BASE_FILTERS,
    ...(topicFacets.length > 0
      ? [facetFilter("topic", "টপিক", topicFacets)]
      : []),
    {
      param: "institute",
      label: "বোর্ড / বিশ্ববিদ্যালয়",
      options: institutes.map((i) => ({
        value: i.id,
        label: i.name,
        questions: i.questions,
      })),
    },
    ...(unitFacets.length > 0
      ? [facetFilter("unit", "পত্র / ইউনিট", unitFacets)]
      : []),
    ...(yearFacets.length > 0 ? [facetFilter("year", "সাল", yearFacets)] : []),
  ];

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[
          { label: "প্রশ্নব্যাংক", href: "/qb" },
          { label: "বিষয় অনুযায়ী", href: "/qb/subjects" },
          { label: subject.name, href: `/qb/subjects/${subject.slug}` },
          { label: chapter.name },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {chapter.name}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {subject.name} · মোট {toBengaliDigits(chapter.questions)} টি প্রশ্ন ·{" "}
          {toBengaliDigits(result.total)} টি দেখানো হচ্ছে
        </p>
      </div>

      <QbSearchBar className="max-w-2xl" placeholder="এই অধ্যায়ের প্রশ্ন খুঁজুন..." />

      <QbQuestionList
        questions={result.rows}
        total={result.total}
        page={page}
        filters={filterList}
        sourceTabs
        examTypes={examTypes.map((e) => e.examType)}
        bookmarkedIds={bookmarkedIds}
        canBookmark={Boolean(session?.user)}
        searchActive={Boolean(filters.search)}
        emptyMessage="এই ফিল্টারে প্রশ্ন নেই। উৎস বা সাল বদলে দেখুন।"
      />
    </div>
  );
}

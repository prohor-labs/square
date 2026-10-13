import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ChapterSearch } from "@/components/qb/ChapterSearch";
import { RichText } from "@/components/qb/RichText";
import {
  getChapterBySlug,
  getChapterExamTypes,
  getChapterFacets,
  getChapterInstitutes,
  getChapterQuestions,
} from "@/lib/actions/qb-subject";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LETTERS = ["ক", "খ", "গ", "ঘ", "ঙ"];

/** Exam types grouped under one Bengali word, in the order the chips read. */
const SOURCE_LABELS: Readonly<Record<string, string>> = {
  board: "বোর্ড",
  university: "বিশ্ববিদ্যালয়",
  engineering: "ইঞ্জিনিয়ারিং",
  medical: "মেডিকেল",
  other: "অন্যান্য",
};

/** Board exams come from boards; everything else from a university. */
const SOURCE_GROUPS: Readonly<Record<string, string>> = {
  board: "বোর্ড",
  university: "বিশ্ববিদ্যালয়",
  engineering: "ইঞ্জিনিয়ারিং বিশ্ববিদ্যালয়",
  medical: "মেডিকেল কলেজ",
  other: "অন্য প্রতিষ্ঠান",
};

/**
 * A chapter, seen from every angle at once.
 *
 * The breakdown and the list read the same metadata rows, so the counts on the
 * chips always match the questions underneath them.
 */
export default async function QbChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectSlug: string; chapterSlug: string }>;
  searchParams?: Promise<{
    source?: string;
    institute?: string;
    unit?: string;
    year?: string;
    q?: string;
  }>;
}): Promise<ReactNode> {
  const { subjectSlug, chapterSlug } = await params;
  const filters = (await searchParams) ?? {};

  const found = await getChapterBySlug(subjectSlug, chapterSlug);
  if (!found) notFound();
  const { chapter, subject } = found;

  const [examTypes, institutes, page, facets] = await Promise.all([
    getChapterExamTypes(chapter.id),
    getChapterInstitutes(chapter.id, filters.source),
    getChapterQuestions(chapter.id, {
      examType: filters.source,
      instituteId: filters.institute,
      unitName: filters.unit,
      year: filters.year,
      search: filters.q,
      limit: 30,
    }),
    getChapterFacets(chapter.id, {
      examType: filters.source,
      instituteId: filters.institute,
    }),
  ]);

  // A stale or hand-edited link can name a source this chapter has none of.
  // Showing that chip, empty and selected, beats an empty list of choices and
  // no way back other than the "clear filters" link.
  const sources = examTypes.some((row) => row.examType === filters.source)
    ? examTypes
    : filters.source
      ? [{ examType: filters.source, questions: 0 }, ...examTypes]
      : examTypes;

  // One link that adds or replaces a single facet and keeps the rest, so a
  // student can narrow step by step instead of rebuilding the query each time.
  // Changing a facet drops the search box's text, because a search result is
  // rarely still relevant once the set it was drawn from has changed.
  const href = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      source: filters.source,
      institute: filters.institute,
      unit: filters.unit,
      year: filters.year,
      ...next,
    };
    if ("q" in next) merged.q = next.q;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    const search = query.toString();
    return `/qb/subjects/${subjectSlug}/${chapterSlug}${search ? `?${search}` : ""}`;
  };

  const anyFilter =
    filters.source || filters.institute || filters.unit || filters.year;
  const clearedHref = `/qb/subjects/${subjectSlug}/${chapterSlug}`;

  // Passed as an object literal so the search box can rebuild the query from it
  // without the useEffect depending on a fresh array on every render.
  const keptFilters = {
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.institute ? { institute: filters.institute } : {}),
    ...(filters.unit ? { unit: filters.unit } : {}),
    ...(filters.year ? { year: filters.year } : {}),
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-2 pb-12 md:py-8">
      <Link
        href={`/qb/subjects/${subjectSlug}`}
        className="w-fit text-xs font-bold text-primary hover:underline"
      >
        ← {subject.name}
        {subject.paper ? ` · ${subject.paper}` : ""}
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {chapter.name}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          মোট {toBengaliDigits(chapter.questions)} টি প্রশ্ন · সব উৎস থেকে
        </p>
      </div>

      {/* Which exam board or university the question came from. */}
      <section className="space-y-2">
        <FacetLabel>উৎস</FacetLabel>
        <div className="flex flex-wrap gap-2">
          <FacetChip
            active={!filters.source}
            href={href({ source: undefined })}
          >
            সব উৎস ({toBengaliDigits(chapter.questions)})
          </FacetChip>
          {sources.map((row) => (
            <FacetChip
              key={row.examType}
              active={filters.source === row.examType}
              href={href({ source: row.examType, institute: undefined })}
            >
              {SOURCE_LABELS[row.examType] ?? row.examType} (
              {toBengaliDigits(row.questions)})
            </FacetChip>
          ))}
        </div>
      </section>

      {/* Which board, university or college inside that choice. */}
      {institutes.length > 0 && (
        <section className="space-y-2">
          <FacetLabel>
            {filters.source
              ? (SOURCE_GROUPS[filters.source] ?? "প্রতিষ্ঠান")
              : "প্রতিষ্ঠান"}
          </FacetLabel>
          <div className="flex flex-wrap gap-2">
            {institutes.map((inst) => (
              <FacetChip
                key={inst.id}
                active={filters.institute === inst.id}
                href={href({
                  institute: inst.id,
                  unit: undefined,
                  year: undefined,
                })}
              >
                {inst.name} ({toBengaliDigits(inst.questions)})
              </FacetChip>
            ))}
          </div>
        </section>
      )}

      {/* The paper and the year, whenever the questions record them. */}
      {facets.units.length > 0 && (
        <section className="space-y-2">
          <FacetLabel>পত্র</FacetLabel>
          <div className="flex flex-wrap gap-2">
            <FacetChip active={!filters.unit} href={href({ unit: undefined })}>
              সব পত্র
            </FacetChip>
            {facets.units.map((unit) => (
              <FacetChip
                key={unit}
                active={filters.unit === unit}
                href={href({ unit })}
              >
                {unit}
              </FacetChip>
            ))}
          </div>
        </section>
      )}

      {facets.years.length > 0 && (
        <section className="space-y-2">
          <FacetLabel>সাল</FacetLabel>
          <div className="flex flex-wrap gap-2">
            <FacetChip active={!filters.year} href={href({ year: undefined })}>
              সব সাল
            </FacetChip>
            {facets.years.map((year) => (
              <FacetChip
                key={year}
                active={filters.year === year}
                href={href({ year })}
              >
                {year}
              </FacetChip>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <FacetLabel>প্রশ্ন ({toBengaliDigits(page.total)})</FacetLabel>
          {anyFilter && (
            <Link
              href={clearedHref}
              className="text-[11px] font-bold text-muted-foreground hover:text-primary"
            >
              ফিল্টার মুছুন
            </Link>
          )}
        </div>

        <Suspense>
          <ChapterSearch
            basePath={`/qb/subjects/${subjectSlug}/${chapterSlug}`}
            params={keptFilters}
          />
        </Suspense>

        {page.questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/10 px-5 py-12 text-center text-sm text-muted-foreground">
            এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {page.questions.map((question, index) => (
              <article
                key={question.id}
                className="rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-black text-primary tabular-nums">
                    {toBengaliDigits(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <RichText text={question.questionText} />

                    {question.options.length > 0 && (
                      <ul className="mt-2.5 flex flex-col gap-1.5">
                        {question.options.map((option, optionIndex) => (
                          <li
                            key={option.id}
                            className={cn(
                              "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed",
                              option.isCorrect
                                ? "border-emerald-500/40 bg-emerald-500/10"
                                : "border-border/60 bg-muted/20",
                            )}
                          >
                            <span
                              className={cn(
                                "font-black",
                                option.isCorrect
                                  ? "text-emerald-600"
                                  : "text-muted-foreground",
                              )}
                            >
                              {LETTERS[optionIndex] ?? optionIndex + 1}.
                            </span>
                            <span className="min-w-0 flex-1">
                              <RichText text={option.optionText} compact />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {question.explanation && (
                      <div className="mt-2.5 rounded-xl bg-muted/50 p-2.5 text-xs leading-relaxed">
                        <span className="font-bold">ব্যাখ্যা: </span>
                        <RichText text={question.explanation} compact />
                      </div>
                    )}

                    <p className="mt-2 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      {question.instituteName && (
                        <span>{question.instituteName}</span>
                      )}
                      {question.unitName && <span>· {question.unitName}</span>}
                      {question.year && <span>· {question.year}</span>}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {page.total > page.questions.length && (
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            {toBengaliDigits(page.questions.length)} /{" "}
            {toBengaliDigits(page.total)} টি দেখানো হচ্ছে
          </p>
        )}
      </section>
    </div>
  );
}

function FacetLabel({ children }: { readonly children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function FacetChip({
  active,
  href,
  children,
}: {
  readonly active: boolean;
  readonly href: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

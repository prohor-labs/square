import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ChapterQuestionsViewer } from "@/components/qb/ChapterQuestionsViewer";
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

/** What each exam board or university is called on the chip row. */
const SOURCE_LABELS: Readonly<Record<string, string>> = {
  board: "বোর্ড",
  university: "বিশ্ববিদ্যালয়",
  engineering: "ইঞ্জিনিয়ারিং",
  medical: "মেডিকেল",
  other: "অন্যান্য",
};

/** …and which institutions belong under it. */
const SOURCE_GROUPS: Readonly<Record<string, string>> = {
  board: "বোর্ড",
  university: "বিশ্ববিদ্যালয়",
  engineering: "ইঞ্জিনিয়ারিং বিশ্ববিদ্যালয়",
  medical: "মেডিকেল কলেজ",
  other: "অন্য প্রতিষ্ঠান",
};

/**
 * One chapter of a subject, seen from every side at once.
 *
 * The chips narrow the set; the questions themselves are handed to the same
 * viewer the exam-wise pages use, so a question looks and behaves identically
 * whichever way a student arrived at it.
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
  }>;
}): Promise<ReactElement> {
  const { subjectSlug, chapterSlug } = await params;
  const filters = (await searchParams) ?? {};

  const found = await getChapterBySlug(subjectSlug, chapterSlug);
  if (!found) notFound();
  const { chapter, subject } = found;

  const [examTypes, institutes, facets, questions] = await Promise.all([
    getChapterExamTypes(chapter.id),
    getChapterInstitutes(chapter.id, filters.source),
    getChapterFacets(chapter.id, {
      examType: filters.source,
      instituteId: filters.institute,
    }),
    getChapterQuestions(chapter.id, {
      examType: filters.source,
      instituteId: filters.institute,
      unitName: filters.unit,
      year: filters.year,
    }),
  ]);

  // One link per facet that keeps the others, so a student narrows step by step
  // instead of rebuilding the query. Changing a facet clears the others that
  // only make sense within it.
  const href = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      source: filters.source,
      institute: filters.institute,
      unit: filters.unit,
      year: filters.year,
      ...next,
    };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    const search = query.toString();
    return `/qb/subjects/${subjectSlug}/${chapterSlug}${search ? `?${search}` : ""}`;
  };

  // A hand-edited or stale link can name a source this chapter has none of.
  // Showing that chip, empty and selected, beats an empty row of choices with no
  // way back except the "clear filters" link.
  const sources = examTypes.some((row) => row.examType === filters.source)
    ? examTypes
    : filters.source
      ? [{ examType: filters.source, questions: 0 }, ...examTypes]
      : examTypes;

  const anyFilter =
    filters.source || filters.institute || filters.unit || filters.year;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground flex-wrap">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <Link
            href="/qb/subjects"
            className="hover:text-primary transition-colors"
          >
            বিষয়ভিত্তিক
          </Link>
          <span>/</span>
          <Link
            href={`/qb/subjects/${subjectSlug}`}
            className="hover:text-primary transition-colors"
          >
            {subject.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{chapter.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              {chapter.name}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {anyFilter
                ? "নির্বাচিত উৎস থেকে প্রশ্নগুলো অনুশীলন করুন"
                : "সব উৎস থেকে প্রশ্নগুলো অনুশীলন করুন"}
            </p>
          </div>
          {anyFilter && (
            <Link
              href={`/qb/subjects/${subjectSlug}/${chapterSlug}`}
              className="w-fit rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              ফিল্টার মুছুন
            </Link>
          )}
        </div>
      </div>

      <FacetRow label="উৎস">
        <FacetChip active={!filters.source} href={href({ source: undefined })}>
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
      </FacetRow>

      {institutes.length > 0 && (
        <FacetRow
          label={
            filters.source
              ? (SOURCE_GROUPS[filters.source] ?? "প্রতিষ্ঠান")
              : "প্রতিষ্ঠান"
          }
        >
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
        </FacetRow>
      )}

      {facets.units.length > 0 && (
        <FacetRow label="পত্র">
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
        </FacetRow>
      )}

      {facets.years.length > 0 && (
        <FacetRow label="সাল">
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
        </FacetRow>
      )}

      <div className="mt-6">
        <ChapterQuestionsViewer topics={[]} questions={questions} />
      </div>
    </div>
  );
}

function FacetRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
      <span className="shrink-0 text-xs font-bold text-muted-foreground sm:w-24">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FacetChip({
  active,
  href,
  children,
}: {
  readonly active: boolean;
  readonly href: string;
  readonly children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

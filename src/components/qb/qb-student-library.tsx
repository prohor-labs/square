"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight2, FileText } from "@/components/icons";
import type { QbFileSummary } from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const BLANK = "__blank__";

function shelfValue(value: string): string {
  return value.trim() || BLANK;
}

function shelfLabel(value: string, blankLabel: string): string {
  return value === BLANK ? blankLabel : value;
}

/** Years are stored as ASCII digits so sorting stays predictable. */
function yearLabel(value: string): string {
  return value === BLANK ? "বছর নেই" : toBengaliDigits(value);
}

function uniqueSorted(values: readonly string[], descending = false): string[] {
  return [...new Set(values.filter((value) => value !== ALL))].sort((a, b) =>
    descending ? b.localeCompare(a, "bn") : a.localeCompare(b, "bn"),
  );
}

interface UnitGroup {
  readonly unit: string;
  readonly files: QbFileSummary[];
}

interface YearGroup {
  readonly year: string;
  readonly units: UnitGroup[];
}

interface UniversityGroup {
  readonly university: string;
  readonly years: YearGroup[];
}

function groupFiles(files: readonly QbFileSummary[]): UniversityGroup[] {
  const universities = new Map<
    string,
    Map<string, Map<string, QbFileSummary[]>>
  >();

  for (const file of files) {
    const university = shelfValue(file.university);
    const year = shelfValue(file.year);
    const unit = shelfValue(file.unit);

    if (!universities.has(university)) universities.set(university, new Map());
    const years = universities.get(university);
    if (!years) continue;

    if (!years.has(year)) years.set(year, new Map());
    const units = years.get(year);
    if (!units) continue;

    const list = units.get(unit) ?? [];
    list.push(file);
    units.set(unit, list);
  }

  return [...universities.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "bn"))
    .map(([university, years]) => ({
      university,
      years: [...years.entries()]
        .sort(([a], [b]) => b.localeCompare(a, "bn"))
        .map(([year, units]) => ({
          year,
          units: [...units.entries()]
            .sort(([a], [b]) => a.localeCompare(b, "bn"))
            .map(([unit, list]) => ({ unit, files: list })),
        })),
    }));
}

function FileRow({
  file,
}: {
  readonly file: QbFileSummary;
}): React.ReactElement {
  return (
    <Link
      href={`/qb/file/${file.id}`}
      className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <FileText className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold">
          {file.fileName}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {toBengaliDigits(file.questionCount)} টি প্রশ্ন
        </span>
      </span>
      <ArrowRight2 className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export function QbStudentLibrary({
  files,
}: {
  readonly files: readonly QbFileSummary[];
}): React.ReactElement {
  const [university, setUniversity] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [unit, setUnit] = useState(ALL);

  const universities = useMemo(
    () => uniqueSorted(files.map((file) => shelfValue(file.university))),
    [files],
  );

  const years = useMemo(
    () =>
      uniqueSorted(
        files
          .filter(
            (file) =>
              university === ALL || shelfValue(file.university) === university,
          )
          .map((file) => shelfValue(file.year)),
        true,
      ),
    [files, university],
  );

  const units = useMemo(
    () =>
      uniqueSorted(
        files
          .filter(
            (file) =>
              (university === ALL ||
                shelfValue(file.university) === university) &&
              (year === ALL || shelfValue(file.year) === year),
          )
          .map((file) => shelfValue(file.unit)),
      ),
    [files, university, year],
  );

  const filtered = useMemo(
    () =>
      files.filter(
        (file) =>
          (university === ALL || shelfValue(file.university) === university) &&
          (year === ALL || shelfValue(file.year) === year) &&
          (unit === ALL || shelfValue(file.unit) === unit),
      ),
    [files, university, year, unit],
  );

  const groups = useMemo(() => groupFiles(filtered), [filtered]);
  const hasFilters = university !== ALL || year !== ALL || unit !== ALL;

  function resetFilters(): void {
    setUniversity(ALL);
    setYear(ALL);
    setUnit(ALL);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <nav
        aria-label="ব্রেডক্রাম"
        className="text-xs text-muted-foreground sm:text-sm"
      >
        প্রশ্নব্যাংক
      </nav>

      <header className="rounded-3xl border bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Question Bank
        </p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">
          বিশ্ববিদ্যালয়ভিত্তিক প্রশ্নব্যাংক
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          বিশ্ববিদ্যালয়, বছর ও ইউনিট বেছে নিন। প্রতিটি ফাইলে সেই পরীক্ষার প্রশ্নগুলো সাজানো
          আছে — ফাইলে ক্লিক করলে প্রশ্ন ও উত্তর দেখা যাবে।
        </p>
      </header>

      <section
        aria-label="ফিল্টার"
        className="grid gap-3 rounded-2xl border bg-card p-3 sm:grid-cols-3"
      >
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">
            বিশ্ববিদ্যালয়
          </span>
          <select
            value={university}
            onChange={(event) => {
              setUniversity(event.target.value);
              setYear(ALL);
              setUnit(ALL);
            }}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value={ALL}>সব বিশ্ববিদ্যালয়</option>
            {universities.map((value) => (
              <option key={value} value={value}>
                {shelfLabel(value, "সাধারণ")}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">
            বছর
          </span>
          <select
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              setUnit(ALL);
            }}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value={ALL}>সব বছর</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {yearLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">
            ইউনিট
          </span>
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value={ALL}>সব ইউনিট</option>
            {units.map((value) => (
              <option key={value} value={value}>
                {shelfLabel(value, "ইউনিট নেই")}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          {toBengaliDigits(filtered.length)} টি ফাইল
          {hasFilters ? " পাওয়া গেছে" : " আছে"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-primary underline underline-offset-2"
          >
            ফিল্টার রিসেট
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <FileText className="mx-auto size-9 text-muted-foreground/60" />
          <h2 className="mt-3 text-base font-extrabold">
            {files.length === 0
              ? "এখনো কোনো প্রশ্ন ফাইল যোগ হয়নি"
              : "এই ফিল্টারে কোনো ফাইল নেই"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {files.length === 0
              ? "অ্যাডমিন প্রশ্ন আপলোড করলে সেগুলো এখানে বিশ্ববিদ্যালয়, বছর ও ইউনিট অনুযায়ী দেখা যাবে।"
              : "অন্য বিশ্ববিদ্যালয়, বছর বা ইউনিট বেছে দেখুন।"}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              সব ফাইল দেখুন
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((universityGroup) => (
            <section key={universityGroup.university}>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black sm:text-xl">
                  {shelfLabel(universityGroup.university, "সাধারণ")}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="mt-3 flex flex-col gap-5">
                {universityGroup.years.map((yearGroup) => (
                  <div key={yearGroup.year}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-black text-background">
                        {yearLabel(yearGroup.year)}
                      </span>
                      <span className="h-px flex-1 bg-border/70" />
                    </div>

                    <div className="flex flex-col gap-3">
                      {yearGroup.units.map((unitGroup) => (
                        <div key={unitGroup.unit}>
                          <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                            {shelfLabel(unitGroup.unit, "ইউনিট নেই")}
                          </p>
                          <div
                            className={cn(
                              "grid gap-2",
                              unitGroup.files.length > 1
                                ? "sm:grid-cols-2"
                                : "grid-cols-1",
                            )}
                          >
                            {unitGroup.files.map((file) => (
                              <FileRow key={file.id} file={file} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

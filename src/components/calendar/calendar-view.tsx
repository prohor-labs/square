"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, Search } from "@/components/icons";
import {
  CALENDAR_CATEGORY_META,
  CALENDAR_CATEGORY_ORDER,
} from "@/lib/calendar";
import type {
  CalendarCategoryContent,
  CalendarTableGroup,
} from "@/lib/calendar-content";
import {
  daysUntil,
  endOfExamDay,
  findNextExam,
  formatCountdown,
  parseBengaliDate,
  splitRemaining,
  toBengaliDigits,
} from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import type { CalendarCategory } from "@/types";

/** One card per group (a university), each with its own column headers. */
interface InstituteCard {
  readonly group: CalendarTableGroup;
  readonly columns: readonly string[];
}

export function CalendarView({
  content = [],
}: {
  readonly content?: readonly CalendarCategoryContent[];
}) {
  const [category, setCategory] = useState<CalendarCategory>("medical");
  const [query, setQuery] = useState("");
  // null until mounted, so the server render and the first client render match
  // (Date.now() would otherwise differ and trip a hydration warning).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const categoryMeta = CALENDAR_CATEGORY_META[category];
  const categoryContent = content.find((item) => item.category === category);
  const sections = categoryContent?.sections ?? [];
  const trimmedQuery = query.trim().toLowerCase();

  // Cards stay grouped by section so a divider can separate them, which is
  // what the admin's "section" actually means.
  const visibleSections = useMemo(() => {
    return sections
      .map((section) => ({
        section,
        cards: section.groups
          .map((group) => ({ group, columns: section.columns }))
          .filter(
            ({ group }) =>
              !trimmedQuery ||
              group.label.toLowerCase().includes(trimmedQuery) ||
              group.rows.some((row) =>
                row.some((cell) => cell.toLowerCase().includes(trimmedQuery)),
              ),
          ),
      }))
      .filter(({ cards }) => cards.length > 0);
  }, [sections, trimmedQuery]);

  // Soonest exam across every category — the date is each section's last column.
  const nextExam = useMemo(() => {
    const rows = content.flatMap((item) =>
      item.sections.flatMap((section) =>
        section.groups.flatMap((group) =>
          group.rows.map((row) => {
            const dateText = row[row.length - 1] ?? "";
            const date = parseBengaliDate(dateText);
            if (!date) return null;
            return {
              groupLabel: group.label,
              // Date-only tables have no separate unit cell; using row[0] there
              // would repeat the date under the heading.
              label: row.length > 1 ? (row[0] ?? "") : "",
              dateText,
              date,
            };
          }),
        ),
      ),
    );
    return findNextExam(rows.filter((row) => row !== null));
  }, [content]);

  const lastFooter = sections[sections.length - 1]?.footer.trim();

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl sm:text-3xl flex items-center gap-2">
          <CalendarIcon className="size-7 text-primary" />
          ক্যালেন্ডার
        </h1>
        <p className="text-sm text-muted-foreground">
          ভর্তি পরীক্ষার সব তারিখ, বিশ্ববিদ্যালয় ও ইউনিট অনুযায়ী।
        </p>
      </div>

      <NextExamBanner nextExam={nextExam} now={now} />

      {/* Category tabs — always four across, compact on phones */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {CALENDAR_CATEGORY_ORDER.map((key) => {
          const meta = CALENDAR_CATEGORY_META[key];
          const Icon = meta.icon;
          const isActive = key === category;
          const sectionCount = content.find((item) => item.category === key)
            ?.sections.length;

          return (
            <button
              key={key}
              type="button"
              title={meta.label}
              onClick={() => {
                setCategory(key);
                setQuery("");
              }}
              aria-pressed={isActive}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 rounded-xl sm:rounded-2xl border bg-card p-1.5 sm:p-3.5 text-center sm:text-left transition-all hover:shadow-md",
                isActive
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "border-border hover:border-border/80",
              )}
            >
              {/* Phones show text only — four names fit across without icons. */}
              <span
                className={cn(
                  "hidden sm:flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : cn("bg-muted/40", meta.accent),
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-sm font-bold leading-tight truncate">
                  {meta.label}
                </span>
                <span className="hidden sm:block text-[11px] text-muted-foreground">
                  {sectionCount ? `${sectionCount}টি সারণি` : "তারিখ আসছে"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ইউনিট, বিশ্ববিদ্যালয় বা তারিখ খুঁজুন…"
          aria-label="ক্যালেন্ডার খুঁজুন"
          className="w-full h-11 pl-10 pr-4 rounded-xl sm:rounded-2xl border border-border bg-card text-sm shadow-xs outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Thumbnail */}
      {categoryContent?.thumbnail && (
        <div className="relative w-full aspect-[16/8] sm:aspect-[24/7] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
          <Image
            src={categoryContent.thumbnail}
            alt={
              categoryContent.thumbnailAlt || `${categoryMeta.label} ভর্তি পরীক্ষা`
            }
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* One card per institute, dividers between sections */}
      {visibleSections.length === 0 ? (
        <div className="bg-card border rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="size-14 rounded-full bg-muted/40 flex items-center justify-center mb-3">
            {trimmedQuery ? (
              <Search className={cn("size-6", categoryMeta.accent)} />
            ) : (
              <CalendarIcon className={cn("size-7", categoryMeta.accent)} />
            )}
          </div>
          <h3 className="font-bold text-sm text-foreground">
            {trimmedQuery
              ? `&quot;${query.trim()}&quot; দিয়ে কিছু পাওয়া যায়নি`
              : `${categoryMeta.label} — তথ্য সারণি এখনো যোগ করা হয়নি`}
          </h3>
        </div>
      ) : (
        <>
          {visibleSections.map(({ section, cards }, sectionIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: sections have no id, order is admin-defined
            <Fragment key={sectionIndex}>
              {sectionIndex > 0 && <SectionDivider title={section.title} />}

              {cards.map((card, cardIndex) => (
                <InstituteSection
                  // biome-ignore lint/suspicious/noArrayIndexKey: groups have no id, order is admin-defined
                  key={cardIndex}
                  card={card}
                  query={trimmedQuery}
                />
              ))}
            </Fragment>
          ))}

          {lastFooter && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
              <p className="text-sm font-semibold text-foreground whitespace-pre-line">
                {lastFooter}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionDivider({ title }: { readonly title: string }) {
  const label = title.trim();

  if (!label) return <div className="h-px w-full bg-border" aria-hidden />;

  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function NextExamBanner({
  nextExam,
  now,
}: {
  readonly nextExam: {
    readonly groupLabel: string;
    readonly label: string;
    readonly dateText: string;
    readonly date: Date;
  } | null;
  readonly now: number | null;
}) {
  const where = nextExam?.groupLabel.trim();

  return (
    <div className="relative rounded-2xl p-[2px] overflow-hidden">
      {/* Rotating red gradient that travels around the box. */}
      <div
        aria-hidden
        className="absolute inset-0 animate-spin [animation-duration:6s] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_200deg,rgb(239_68_68/0.85)_320deg,transparent_360deg)]"
      />
      <div className="relative rounded-[14px] border border-red-500/30 bg-card px-3 py-2.5 sm:px-5 sm:py-4 flex items-center gap-2.5 sm:gap-3 shadow-sm">
        {nextExam ? (
          <>
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <Clock className="size-3.5 sm:size-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  সবার আগে শুরু হবে
                </span>
                <span className="text-xs sm:text-base font-bold leading-snug">
                  {nextExam.dateText}
                  {where ? ` · ${where}` : ""}
                </span>
                {nextExam.label && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">
                    {nextExam.label}
                  </span>
                )}
              </div>
            </div>
            <CountdownBadge date={nextExam.date} now={now} size="lg" />
          </>
        ) : (
          <span className="text-xs sm:text-sm text-muted-foreground">
            আসন্ন কোনো পরীক্ষার তারিখ পাওয়া যায়নি।
          </span>
        )}
      </div>
    </div>
  );
}

/** Colour band by urgency: green when far away, red when imminent. */
function countdownTone(days: number): string {
  if (days < 0) return "bg-muted text-muted-foreground";
  if (days <= 30) return "bg-red-500/15 text-red-600 dark:text-red-400";
  if (days <= 90) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
}

function CountdownBadge({
  date,
  now,
  size = "sm",
}: {
  readonly date: Date | null;
  readonly now: number | null;
  readonly size?: "sm" | "lg";
}) {
  if (!date) {
    return (
      <span className="self-start sm:self-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground whitespace-nowrap">
        —
      </span>
    );
  }

  const days = daysUntil(date);
  const remaining = now === null ? null : endOfExamDay(date).getTime() - now;
  const tone = countdownTone(days);

  // Before mount (no client clock yet) and once the exam day is over, only the
  // day label shows.
  if (remaining === null || remaining <= 0) {
    return (
      <span
        className={cn(
          "self-start sm:self-center whitespace-nowrap rounded-full font-bold",
          size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-[11px]",
          tone,
        )}
      >
        {formatCountdown(days)}
      </span>
    );
  }

  const { days: wholeDays, clock } = splitRemaining(remaining);

  return (
    <span
      className={cn(
        // Phones get a single line (days + clock side by side); wider screens
        // stack them so the badge stays compact in the table column.
        "flex shrink-0 items-center sm:items-stretch sm:flex-col gap-1.5 sm:gap-px self-start rounded-lg sm:rounded-xl font-bold whitespace-nowrap tabular-nums",
        size === "lg"
          ? "px-2.5 py-1 text-[11px] sm:px-4 sm:py-2 sm:text-base"
          : "px-2 py-1 text-[10px] sm:rounded-xl sm:px-2.5 sm:text-[11px]",
        tone,
      )}
    >
      <span className="whitespace-nowrap">
        {toBengaliDigits(wholeDays)} দিন
      </span>
      <span
        className={cn(
          "font-semibold opacity-80 whitespace-nowrap",
          size === "lg" ? "text-[10px] sm:text-sm" : "text-[10px]",
        )}
      >
        {clock}
      </span>
    </span>
  );
}

function Highlight({
  text,
  query,
}: {
  readonly text: string;
  readonly query: string;
}) {
  if (!query || !text.toLowerCase().includes(query)) return <>{text}</>;

  const index = text.toLowerCase().indexOf(query);
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-300/70 px-0.5 text-foreground">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

function InstituteSection({
  card,
  query,
}: {
  readonly card: InstituteCard;
  readonly query: string;
}) {
  const { group, columns } = card;
  const dateColumnIndex = columns.length - 1;
  const heading = group.label.trim();

  return (
    <section className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Institute name bar — centred and prominent, one neutral tone for every
          category. Hidden when unnamed so a blank strip never shows. */}
      {heading && (
        <div className="flex items-center justify-center gap-2 bg-muted/60 border-b px-4 py-2.5 sm:py-3">
          <h2 className="text-center text-base sm:text-lg font-extrabold leading-snug text-foreground">
            <Highlight text={group.label} query={query} />
          </h2>
        </div>
      )}

      {/* Two per row on phones, four on wider screens. An odd last card simply
          leaves the trailing slot empty. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4">
        {group.rows.map((row, rowIndex) => (
          <UnitCard
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are rendered read-only
            key={rowIndex}
            row={row}
            dateColumnIndex={dateColumnIndex}
            query={query}
          />
        ))}
      </div>
    </section>
  );
}

function UnitCard({
  row,
  dateColumnIndex,
  query,
}: {
  readonly row: readonly string[];
  readonly dateColumnIndex: number;
  readonly query: string;
}) {
  const dateText = row[dateColumnIndex] ?? "";
  const date = parseBengaliDate(dateText);
  // Date-only tables have no unit cell, so the date becomes the heading.
  const label = row.length > 1 ? (row[0] ?? "") : "";

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-muted/15 p-3 text-center transition-colors hover:bg-muted/30">
      {label && (
        <p className="text-sm font-bold leading-tight">
          <Highlight text={label} query={query} />
        </p>
      )}
      <p className="text-xs text-muted-foreground leading-snug">
        <Highlight text={dateText} query={query} />
      </p>
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
          date
            ? countdownTone(daysUntil(date))
            : "bg-muted text-muted-foreground",
        )}
      >
        {date ? formatCountdown(daysUntil(date)) : "—"}
      </span>
    </div>
  );
}

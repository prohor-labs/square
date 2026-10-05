"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, Search } from "@/components/icons";
import type { CalendarCategoryContent } from "@/lib/calendar-content";
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

/**
 * Every admission exam date in one table, earliest first.
 *
 * The admin model nests category → section → group → row, which is awkward to
 * read across, so rows are flattened into columns here. A category switcher and
 * a card layout used to sit above this; the table covers every category at once,
 * so neither earned its place.
 */
export function CalendarView({
  content = [],
}: {
  readonly content?: readonly CalendarCategoryContent[];
}) {
  const [query, setQuery] = useState("");
  // null until mounted, so the server render and the first client render match
  // (Date.now() would otherwise differ and trip a hydration warning).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const trimmedQuery = query.trim().toLowerCase();

  // Soonest exam across every category — the date is each row's last cell.
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="বিশ্ববিদ্যালয়, ইউনিট বা তারিখ খুঁজুন…"
          aria-label="ক্যালেন্ডার খুঁজুন"
          className="w-full h-11 pl-10 pr-4 rounded-xl sm:rounded-2xl border border-border bg-card text-sm shadow-xs outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <AllDatesTable content={content} query={trimmedQuery} now={now} />
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

interface AllDatesRow {
  readonly key: string;
  readonly groupLabel: string;
  readonly unitLabel: string;
  readonly dateText: string;
  readonly date: Date | null;
}

/**
 * Every exam date from every category in one simple table, earliest first.
 *
 * The admin model is category → section → group → row, which is awkward to read
 * across. This flattens it: a row per exam, keeping the university and unit in
 * their own columns so nothing has to be parsed out of a free-text cell.
 */
function AllDatesTable({
  content,
  query,
  now,
}: {
  readonly content: readonly CalendarCategoryContent[];
  readonly query: string;
  readonly now: number | null;
}) {
  const rows = useMemo(() => {
    const collected: AllDatesRow[] = [];

    for (const item of content) {
      for (const section of item.sections) {
        for (const group of section.groups) {
          const groupLabel = group.label.trim();

          group.rows.forEach((row, index) => {
            // A single-cell row is a date-only table: the group is the
            // institute (e.g. "কুয়েট") and there is no unit, so the unit cell
            // stays empty rather than repeating the institute name.
            const hasUnit = row.length > 1;
            const unitLabel = hasUnit ? (row[0] ?? "").trim() : "";
            const dateText = row[row.length - 1] ?? "";

            collected.push({
              key: `${item.category}-${groupLabel}-${unitLabel}-${index}`,
              groupLabel,
              unitLabel,
              dateText,
              date: parseBengaliDate(dateText),
            });
          });
        }
      }
    }

    return collected;
  }, [content]);

  const visible = useMemo(() => {
    const matched = rows.filter(
      (row) =>
        !query ||
        row.groupLabel.toLowerCase().includes(query) ||
        row.unitLabel.toLowerCase().includes(query) ||
        row.dateText.toLowerCase().includes(query),
    );

    // Undated rows keep their original order and sink to the bottom.
    return [...matched].sort((a, b) => {
      if (a.date && b.date) return a.date.getTime() - b.date.getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
  }, [rows, query]);

  if (visible.length === 0) {
    return (
      <div className="bg-card border rounded-2xl shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="size-14 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Search className={cn("size-6", "text-muted-foreground")} />
        </div>
        <h3 className="font-bold text-sm text-foreground">
          {query
            ? `"${query.trim()}" দিয়ে কিছু পাওয়া যায়নি`
            : "এখনো কোনো তারিখ যোগ করা হয়নি"}
        </h3>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Phones scroll sideways; the columns are too many to stack. */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 sm:px-4 py-2.5 text-left font-bold whitespace-nowrap">
                বিশ্ববিদ্যালয় / বিভাগ
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-left font-bold whitespace-nowrap">
                ইউনিট
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-left font-bold whitespace-nowrap">
                পরীক্ষার তারিখ
              </th>
              <th className="px-3 sm:px-4 py-2.5 text-left font-bold whitespace-nowrap">
                বাকি
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              return (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="px-3 sm:px-4 py-2.5">
                    {row.groupLabel ? (
                      <Highlight text={row.groupLabel} query={query} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 font-semibold whitespace-nowrap">
                    <Highlight text={row.unitLabel} query={query} />
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                    <Highlight text={row.dateText} query={query} />
                  </td>
                  <td className="px-3 sm:px-4 py-2.5">
                    <CountdownBadge date={row.date} now={now} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-3 sm:px-4 py-2.5 text-[11px] text-muted-foreground border-t">
        মোট {toBengaliDigits(visible.length)} টি তারিখ · আগের তারিখ আগে দেখানো
        হয়েছে
      </p>
    </div>
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

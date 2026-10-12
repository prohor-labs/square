"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Star,
} from "@/components/icons";
import type { CalendarGroup } from "@/lib/calendar-content";
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

const TABS = [
  { id: "calendar", label: "ক্যালেন্ডার" },
  { id: "application", label: "আবেদন লিংক" },
  { id: "admit", label: "প্রবেশপত্র" },
  { id: "result", label: "রেজাল্ট" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const FAVORITES_KEY = "admission-calendar-favorites";

interface CalendarRow {
  readonly key: string;
  readonly groupLabel: string;
  readonly unitLabel: string;
  /** "ঢাকা বিশ্ববিদ্যালয় (A ইউনিট)" — the university and its unit in one cell. */
  readonly label: string;
  readonly dateText: string;
  readonly date: Date | null;
  readonly month: number | null;
}

/**
 * Every admission exam date in one place, split into the five reference tabs.
 *
 * The admin model nests category → section → group → row, which is awkward to
 * read across, so rows are flattened into a single list here and each tab
 * re-reads it with its own columns.
 */
export function CalendarView({
  content = [],
}: {
  readonly content?: readonly CalendarGroup[];
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("calendar");
  const [month, setMonth] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  // null until mounted, so the server render and the first client render match
  // (Date.now() would otherwise differ and trip a hydration warning).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Stars are a personal shortlist, so they live in the browser, not the DB.
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(FAVORITES_KEY) ?? "[]",
      );
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {
      // A corrupt entry should not break the page.
    }
  }, []);

  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const rows = useMemo<readonly CalendarRow[]>(() => {
    const collected: CalendarRow[] = [];

    for (const group of content) {
      const groupLabel = group.label.trim();

      group.rows.forEach((row, index) => {
        // The unit may be blank — the university is still worth listing.
        const unitLabel = (row[0] ?? "").trim();
        const dateText = row[1] ?? "";
        const date = parseBengaliDate(dateText);

        collected.push({
          key: `${groupLabel}-${unitLabel}-${index}`,
          groupLabel,
          unitLabel,
          label: unitLabel ? `${groupLabel} (${unitLabel})` : groupLabel,
          dateText,
          date,
          month: date ? date.getMonth() : null,
        });
      });
    }

    return collected;
  }, [content]);

  /** Earliest first; rows without a parsable date sink to the bottom. */
  const byDate = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.date && b.date) return a.date.getTime() - b.date.getTime();
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
      }),
    [rows],
  );

  // Only the months the schedule actually touches become a chip.
  const months = useMemo(() => {
    const present = new Set(
      rows.map((row) => row.month).filter((m) => m !== null),
    );
    return [...present].sort(
      (a, b) => (a as number) - (b as number),
    ) as number[];
  }, [rows]);

  const trimmed = query.trim().toLowerCase();

  const visible = useMemo(() => {
    const matched = byDate.filter(
      (row) =>
        (!trimmed ||
          row.label.toLowerCase().includes(trimmed) ||
          row.dateText.toLowerCase().includes(trimmed)) &&
        (month === null || row.month === month),
    );
    return matched;
  }, [byDate, trimmed, month]);

  const nextExam = useMemo(() => {
    const dated = rows
      .filter((row) => row.date !== null)
      .map((row) => ({
        groupLabel: row.label,
        label: "",
        dateText: row.dateText,
        date: row.date as Date,
      }));
    return findNextExam(dated);
  }, [rows]);

  const favoriteRows = useMemo(
    () => byDate.filter((row) => favorites.includes(row.key)),
    [byDate, favorites],
  );

  const otherRows = useMemo(
    () =>
      visible.filter((row) => row.unitLabel !== "" && row.groupLabel !== ""),
    [visible],
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {/* Headline */}
      <div className="space-y-1 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
          <CalendarIcon className="size-7 text-primary" />
          ইউনিভার্সিটি এডমিশন ক্যালেন্ডার ২০২৬-২৭
        </h1>
        <div className="mx-auto h-0.5 w-24 rounded-full bg-primary" />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-center text-xs text-muted-foreground">
        সর্বশেষ আপডেট:{" "}
        <span className="font-semibold text-foreground">
          {formatBengaliDate(new Date())}
        </span>
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

      {/* Tabs — one line, centred. On a narrow phone they scroll sideways. */}
      <div className="overflow-x-auto border-b no-scrollbar">
        <div className="flex w-max min-w-full justify-center">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id}
              className={cn(
                "shrink-0 border-b-[3px] px-4 py-2.5 text-sm font-semibold transition-colors",
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* The key remounts the panel on every switch so the animation replays. */}
      <div
        key={tab}
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {tab === "calendar" ? (
          <CalendarTab
            rows={visible}
            months={months}
            month={month}
            setMonth={setMonth}
            favorites={favorites}
            favoriteRows={favoriteRows}
            onToggle={toggleFavorite}
            query={trimmed}
            now={now}
          />
        ) : (
          <ReferenceTab
            id={tab}
            rows={tab === "result" ? otherRows : visible}
          />
        )}
      </div>
    </div>
  );
}

function CalendarTab({
  rows,
  months,
  month,
  setMonth,
  favorites,
  favoriteRows,
  onToggle,
  query,
  now,
}: {
  readonly rows: readonly CalendarRow[];
  readonly months: readonly number[];
  readonly month: number | null;
  readonly setMonth: (m: number | null) => void;
  readonly favorites: readonly string[];
  readonly favoriteRows: readonly CalendarRow[];
  readonly onToggle: (key: string) => void;
  readonly query: string;
  readonly now: number | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Month filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <Chip active={month === null} onClick={() => setMonth(null)}>
          সব মাস
        </Chip>
        {months.map((m) => (
          <Chip key={m} active={month === m} onClick={() => setMonth(m)}>
            {BENGALI_MONTHS[m]}
          </Chip>
        ))}
      </div>

      <p className="text-center text-sm font-semibold text-primary">
        {month === null
          ? "সব মাসের ভর্তি পরীক্ষা"
          : `${BENGALI_MONTHS[month]} মাসের ভর্তি পরীক্ষা`}
      </p>

      {/* Favourites */}
      {favoriteRows.length > 0 && (
        <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50/60 p-3 dark:bg-amber-500/5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            <Star className="size-4 fill-current" />
            আপনার প্রিয় কোর্স
          </h3>
          <DateTable
            rows={favoriteRows}
            favorites={favorites}
            onToggle={onToggle}
            query={query}
            now={now}
          />
        </section>
      )}

      <DateTable
        rows={rows}
        favorites={favorites}
        onToggle={onToggle}
        query={query}
        now={now}
      />
    </div>
  );
}

function DateTable({
  rows,
  favorites,
  onToggle,
  query,
  now,
}: {
  readonly rows: readonly CalendarRow[];
  readonly favorites: readonly string[];
  readonly onToggle: (key: string) => void;
  readonly query: string;
  readonly now: number | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-muted/40">
          <Search className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">
          {query ? `"${query}" দিয়ে কিছু পাওয়া যায়নি` : "এই মাসে কোনো তারিখ নেই"}
        </h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-primary text-primary-foreground">
            <th className="w-10 px-2 py-2.5 text-center font-bold">★</th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              বিশ্ববিদ্যালয় (ইউনিট)
            </th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              ভর্তি পরীক্ষার তারিখ
            </th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              সময় বাকি
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key}
              className={cn(
                "border-b last:border-b-0 hover:bg-primary/5",
                index % 2 === 1 && "bg-black/[0.02] dark:bg-white/[0.02]",
              )}
            >
              <td className="px-2 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onToggle(row.key)}
                  aria-label={
                    favorites.includes(row.key)
                      ? `${row.label} ফেভারিট থেকে সরান`
                      : `${row.label} ফেভারিটে যোগ করুন`
                  }
                  aria-pressed={favorites.includes(row.key)}
                  className="text-muted-foreground/50 transition-colors hover:text-amber-500"
                >
                  <Star
                    className={cn(
                      "size-4",
                      favorites.includes(row.key) &&
                        "fill-amber-400 text-amber-500",
                    )}
                  />
                </button>
              </td>
              <td className="px-3 py-2 font-medium">
                <Highlight text={row.label} query={query} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Highlight text={row.dateText} query={query} />
              </td>
              <td className="px-3 py-2">
                <CountdownBadge date={row.date} now={now} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The reference tabs share one table and differ only in their last two
 * columns. The dates already exist, so the other columns stay blank until the
 * application, admit-card and result data is entered.
 */
function ReferenceTab({
  id,
  rows,
}: {
  readonly id: Exclude<TabId, "calendar">;
  readonly rows: readonly CalendarRow[];
}) {
  const columns = {
    application: {
      middle: "আবেদনের সময়সীমা",
      last: "আবেদন লিংক",
    },
    admit: {
      middle: "প্রবেশপত্রের সময়সীমা",
      last: "প্রবেশপত্র",
    },
    result: {
      middle: "রেজাল্ট স্ট্যাটাস",
      last: "লিংক",
    },
  }[id];

  // Only the result tab has a status to show; the others still wait on their
  // own dates and links.
  const status = id === "result" ? "প্রকাশিত হয়নি" : "—";

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        কোনো তথ্য পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-primary text-primary-foreground">
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              বিশ্ববিদ্যালয় (ইউনিট)
            </th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              ভর্তি পরীক্ষার তারিখ
            </th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              {columns.middle}
            </th>
            <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
              {columns.last}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key}
              className={cn(
                "border-b last:border-b-0",
                index % 2 === 1 && "bg-black/[0.02] dark:bg-white/[0.02]",
              )}
            >
              <td className="px-3 py-2 font-medium">{row.label}</td>
              <td className="px-3 py-2 whitespace-nowrap">{row.dateText}</td>
              <td
                className={cn(
                  "px-3 py-2",
                  id === "result"
                    ? "font-bold text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {status}
              </td>
              <td className="px-3 py-2 text-muted-foreground">—</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        এই ট্যাবের তথ্য শীঘ্রই যোগ করা হবে
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function formatBengaliDate(date: Date): string {
  return `${toBengaliDigits(date.getDate())} ${
    BENGALI_MONTHS[date.getMonth()]
  }, ${date.getFullYear()}`;
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
  return (
    <div className="relative overflow-hidden rounded-2xl p-[2px]">
      {/* Rotating red gradient that travels around the box. */}
      <div
        aria-hidden
        className="absolute inset-0 animate-spin [animation-duration:6s] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_200deg,rgb(239_68_68/0.85)_320deg,transparent_360deg)]"
      />
      <div className="relative flex items-center gap-2.5 rounded-[14px] border border-red-500/30 bg-card px-3 py-2.5 shadow-xs sm:gap-3 sm:px-5 sm:py-4">
        {nextExam ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 sm:size-9 sm:rounded-xl dark:text-red-400">
                <Clock className="size-3.5 sm:size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-bold tracking-wider text-red-600 uppercase sm:text-[11px] dark:text-red-400">
                  সবার আগে শুরু হবে
                </span>
                <span className="text-xs font-bold leading-snug sm:text-base">
                  {nextExam.dateText} · {nextExam.groupLabel}
                </span>
              </div>
            </div>
            <CountdownBadge date={nextExam.date} now={now} size="lg" />
          </>
        ) : (
          <span className="text-xs text-muted-foreground sm:text-sm">
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
      <span className="self-start rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-muted-foreground sm:self-center">
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
          "self-start rounded-full font-bold whitespace-nowrap sm:self-center",
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
        "flex shrink-0 items-center gap-1.5 self-start rounded-lg font-bold whitespace-nowrap tabular-nums sm:flex-col sm:items-stretch sm:gap-px sm:rounded-xl",
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

const BENGALI_TO_ENGLISH: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const ENGLISH_TO_BENGALI = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const MS_PER_DAY = 86_400_000;

const BENGALI_MONTHS: Record<string, number> = {
  জানুয়ারি: 0,
  জানুয়ারী: 0,
  ফেব্রুয়ারি: 1,
  ফেব্রুয়ারী: 1,
  মার্চ: 2,
  এপ্রিল: 3,
  মে: 4,
  জুন: 5,
  জুলাই: 6,
  আগস্ট: 7,
  সেপ্টেম্বর: 8,
  অক্টোবর: 9,
  নভেম্বর: 10,
  ডিসেম্বর: 11,
};

// "০৫ ডিসেম্বর ২০২৬" — anchored on purpose so stray extra words are rejected.
const DATE_PATTERN =
  /^(\d{1,2})\s+(\p{Script=Bengali}[\p{Script=Bengali}\s]*?)\s+(\d{4})$/u;

// "০১/০৯ জানুয়ারি ২০২৭" — a stray slash crept into the admin's date. The month
// name right after it is unambiguous, so the day is read from the text before the
// slash and the rest is discarded rather than showing "—".
/**
 * Drops anything after a slash in the day slot, so "০১/০৯ জানুয়ারি ২০২৭"
 * becomes "০১ জানুয়ারি ২০২৭". Only a slash followed by digits is stripped, so a
 * slash elsewhere in the text still fails the pattern above.
 */
function normaliseSlashedDate(value: string): string {
  return value.replace(/^(\d{1,2})\/(?:\d{1,2})(?=\s)/, "$1");
}

export function toBengaliDigits(value: number | string): string {
  return String(value).replace(
    /\d/g,
    (digit) => ENGLISH_TO_BENGALI[Number(digit)] ?? digit,
  );
}

export function parseBengaliDate(value: string): Date | null {
  const normalized = value
    .replace(/[০-৯]/g, (digit) => BENGALI_TO_ENGLISH[digit] ?? digit)
    .trim()
    .replace(/\s+/g, " ");

  // "০১/০৯ জানুয়ারি ২০২৭" → "০১ জানুয়ারি ২০২৭", then parsed as usual.
  const cleaned = normaliseSlashedDate(normalized);

  const match = DATE_PATTERN.exec(cleaned);
  if (!match) return null;

  const month = BENGALI_MONTHS[match[2].trim()];
  if (month === undefined) return null;

  const day = Number(match[1]);
  const year = Number(match[3]);
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month, day);
  // Rejects impossible dates such as 31 February, which Date would roll over.
  if (date.getDate() !== day || date.getMonth() !== month) return null;

  return date;
}

/** Whole days from today to `date`. Negative once the day has passed. */
export function daysUntil(date: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Math.round absorbs the 23h/25h days around DST transitions.
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Only a calendar date is known for an exam, so the countdown targets the last
 * moment of that day — the timer keeps running through the exam day itself.
 */
export function endOfExamDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export interface RemainingTime {
  readonly days: number;
  /** Zero-padded HH:MM:SS in Bengali digits. */
  readonly clock: string;
}

/** Splits a millisecond gap into whole days plus a ticking clock. */
export function splitRemaining(milliseconds: number): RemainingTime {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => toBengaliDigits(value).padStart(2, "০");
  return {
    days,
    clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

export function formatCountdown(days: number): string {
  if (days === 0) return "আজকাল";
  if (days === 1) return "আগামীকাল";
  if (days > 1) return `${toBengaliDigits(days)} দিন বাকি`;
  if (days === -1) return "গতকাল";
  return `${toBengaliDigits(Math.abs(days))} দিন আগে`;
}

export interface DatedExamRow {
  /** University / institute name from the group header. */
  readonly groupLabel: string;
  /** Unit or exam name from the first cell. */
  readonly label: string;
  /** The raw date cell, shown as typed by the admin. */
  readonly dateText: string;
  readonly date: Date;
}

/** The soonest exam that has not happened yet, across every category. */
export function findNextExam(
  rows: readonly DatedExamRow[],
): DatedExamRow | null {
  let next: DatedExamRow | null = null;
  let nextDays = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    const days = daysUntil(row.date);
    if (days < 0 || days >= nextDays) continue;
    next = row;
    nextDays = days;
  }

  return next;
}

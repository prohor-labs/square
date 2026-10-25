/**
 * The shape of a question-bank slice, shared by the server actions that fetch
 * it and the client that renders it. Kept out of the "use server" module
 * because such a module may only export async functions.
 */

/**
 * What a student picks from the big cards. The bank holds no topic or chapter
 * hanging off a question, so the only real axis is who set the paper. "varsity"
 * is the label students recognise; the column stores "university".
 */
export type QbCategory = "all" | "board" | "varsity" | "medical";

/** The order the category cards appear in. */
export const QB_CATEGORIES: readonly QbCategory[] = [
  "all",
  "board",
  "varsity",
  "medical",
];

/**
 * A full request: one category, two independent toggles, a search term and a
 * page. The toggles stack with the category (AND), so "board + free" is a
 * legitimate slice rather than a mutually exclusive choice.
 */
export interface QbQuery {
  readonly category: QbCategory;
  readonly free: boolean;
  readonly explained: boolean;
  readonly search: string;
  readonly page: number;
}

export interface QbOption {
  readonly id: string;
  readonly text: string;
  readonly isCorrect: boolean;
  readonly orderNo: number;
}

export interface QbQuestion {
  readonly id: string;
  readonly text: string;
  readonly explanation: string | null;
  readonly isFree: boolean;
  readonly source: string;
  /** Exam tags on this question, e.g. ["board", "medical"]. */
  readonly examTypes: readonly string[];
  readonly options: readonly QbOption[];
}

export interface QbPage {
  readonly questions: readonly QbQuestion[];
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
}

/**
 * Every control reports the count it would produce if used next, so a student
 * sees "board + free = 12" before tapping instead of an empty page after.
 */
export interface QbCounts {
  readonly categories: Record<QbCategory, number>;
  readonly free: number;
  readonly explained: number;
}

/**
 * Small enough that a page loads instantly, large enough that stepping
 * through 3,200 questions does not take a hundred clicks.
 */
export const QB_PAGE_SIZE = 20;

/** Raw exam_type values map to the words students read. */
export const QB_EXAM_TYPE_LABELS: Readonly<Record<string, string>> = {
  board: "বোর্ড",
  university: "ভার্সিটি",
  engineering: "ইঞ্জিনিয়ারিং",
  medical: "মেডিকেল",
  other: "অন্যান্য",
};

/** A query param can arrive twice (`?c=a&c=b`); take the first. */
function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return first ?? "";
}

/**
 * Turns the query string into a query. Anything missing or malformed falls
 * back to the widest view, so a hand-edited or stale URL still renders.
 *
 * Params: `c` category, `free`/`exp` toggles, `q` search, `p` page.
 */
export function parseQbQuery(
  params: Record<string, string | string[] | undefined>,
): QbQuery {
  const rawCategory = readParam(params.c);
  const parsedPage = Number.parseInt(readParam(params.p), 10);

  return {
    category: QB_CATEGORIES.includes(rawCategory as QbCategory)
      ? (rawCategory as QbCategory)
      : "all",
    free: readParam(params.free) === "1",
    explained: readParam(params.exp) === "1",
    search: readParam(params.q),
    page: Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage),
  };
}

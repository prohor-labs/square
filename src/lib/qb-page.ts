import "server-only";

import type {
  QbFilterDef,
  QbFilterOption,
} from "@/components/qb/QbFilterPanel";
import { QB_PAGE_SIZE } from "@/components/qb/QbQuestionList";
import type { QB_EXAM_TYPES } from "@/db/schema";
import type { QbQuestionFilters } from "@/lib/actions/qb-library";

/**
 * Turning a URL into a query.
 *
 * Every filter on every page is a query parameter, so this is the single place
 * that decides what "year=2023&type=mcq" means. Keeping it in one file is what
 * stops the sidebar and the question list from quietly disagreeing about which
 * questions are on screen.
 */

export const QB_EXAM_TYPE_SET = new Set<string>([
  "board",
  "university",
  "engineering",
  "medical",
  "other",
]);

export interface QbPageQuery {
  readonly filters: QbQuestionFilters;
  readonly page: number;
  readonly offset: number;
}

function read(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value && value !== "all" ? value : undefined;
}

export function parseQbQuery(
  params: URLSearchParams,
  /**
   * Dimensions the path already fixed. A page under /qb/institutes/[slug]
   * passes the institute here, so a hand-edited query string cannot widen it
   * into a different board's questions.
   */
  pinned?: Partial<QbQuestionFilters>,
): QbPageQuery {
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const offset = (page - 1) * QB_PAGE_SIZE;

  const exam = read(params, "exam");
  const examType =
    exam && QB_EXAM_TYPE_SET.has(exam)
      ? (exam as (typeof QB_EXAM_TYPES)[number])
      : undefined;

  const type = read(params, "type");
  const questionType =
    type === "mcq" || type === "cq" ? (type as "mcq" | "cq") : undefined;

  return {
    page,
    offset,
    filters: {
      examType,
      year: read(params, "year"),
      groupName: read(params, "group"),
      unitName: read(params, "unit"),
      subjectId: read(params, "subject"),
      chapterId: read(params, "chapter"),
      topicId: read(params, "topic"),
      onlyUnfiled: read(params, "unfiled") === "1",
      type: questionType,
      search: read(params, "q"),
      limit: QB_PAGE_SIZE,
      offset,
      // Pinned last, so a query string cannot override the dimension the path
      // already fixed.
      ...pinned,
    },
  };
}

/** The two things every question list can be narrowed by. */
export const BASE_FILTERS: readonly QbFilterDef[] = [
  {
    param: "type",
    label: "প্রশ্নের ধরন",
    options: [
      { value: "mcq", label: "এমসিকিউ" },
      { value: "cq", label: "লিখিত" },
    ],
  },
];

/**
 * Builds the exam filter, listing only the exams that actually hold questions.
 *
 * An engineering tab over an empty bank is worse than no tab: it looks like
 * something is missing when it is simply not filled in yet.
 */
export function examTypeFilter(available: readonly string[]): QbFilterDef {
  const labels: Record<string, string> = {
    board: "বোর্ড",
    university: "ভার্সিটি",
    engineering: "ইঞ্জিনিয়ারিং",
    medical: "মেডিকেল",
  };
  const options: QbFilterOption[] = available
    .filter((type) => labels[type])
    .map((type) => ({ value: type, label: labels[type] }));

  return { param: "exam", label: "পরীক্ষার ধরন", options };
}

export function facetFilter(
  param: string,
  label: string,
  facets: readonly { value: string; label: string; questions: number }[],
  dependsOn?: readonly string[],
): QbFilterDef {
  return {
    param,
    label,
    options: facets.map((f) => ({
      value: f.value,
      label: f.label,
      questions: f.questions,
    })),
    ...(dependsOn ? { dependsOn } : {}),
  };
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The only two course categories a batch can sit in. */
export const HSC_BATCH_TAGS = ["Academic", "Admission"] as const;
export type HscBatchTag = (typeof HSC_BATCH_TAGS)[number];

/**
 * Folds whatever a form or an old row sends into one of the two categories.
 * The "HSC 26" / "HSC 27" tags this replaces all belong to Academic.
 */
export function normalizeHscBatch(raw?: string | null): HscBatchTag {
  if (!raw || typeof raw !== "string") return "Academic";
  const lower = raw.trim().toLowerCase();

  if (
    lower.includes("admi") ||
    lower.includes("এডমিশন") ||
    lower.includes("এডমি") ||
    lower.includes("ভর্তি") ||
    lower.includes("varsity")
  ) {
    return "Admission";
  }
  return "Academic";
}

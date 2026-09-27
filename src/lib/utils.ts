import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeHscBatch(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "HSC 26";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("27") || lower.includes("সাতাস") || lower.includes("২৭")) {
    return "HSC 27";
  }
  if (lower.includes("26") || lower.includes("ছাব্বিশ") || lower.includes("২৬")) {
    return "HSC 26";
  }
  if (
    lower.includes("admi") ||
    lower.includes("এডমিশন") ||
    lower.includes("এডমি") ||
    lower.includes("ভর্তি") ||
    lower.includes("varsity")
  ) {
    return "Admission";
  }
  return trimmed;
}

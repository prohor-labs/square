import { DHAKA_TIMEZONE } from "@/lib/date";

/**
 * Which part of a scheduled exam window we are in.
 * - `live`     → started within the window (counts towards the merit list)
 * - `practice` → window missed, or no window was set at all by the admin
 * - `upcoming` → the window has not opened yet, so taking is blocked
 */
export type ExamWindowStatus = "live" | "practice" | "upcoming";

export interface ExamWindow {
  readonly status: ExamWindowStatus;
  /** ms left before the window closes; only meaningful while `live`. */
  readonly remainingMs: number;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
}

export interface ExamWindowInput {
  readonly startsAt?: string | null;
  readonly endsAt?: string | null;
}

const MS_PER_MINUTE = 60_000;

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "২৫:৩০" style mm:ss, used by the live countdown chip. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "০:০০";
  const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % MS_PER_MINUTE) / 1000);

  const pad = (value: number) =>
    String(value)
      .padStart(2, "0")
      .replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

/** Locale helpers used by the exam cards so every card renders alike. */
export const EXAM_TIMEZONE = DHAKA_TIMEZONE;

/**
 * Classifies an exam attempt against its schedule. `now` is injectable so the
 * server and the client agree when a render straddles a boundary.
 */
export function getExamWindow(
  input: ExamWindowInput,
  now: number = Date.now(),
): ExamWindow {
  const startsAt = parse(input.startsAt);
  const endsAt = parse(input.endsAt);

  // No schedule at all → always live, per the agreed rule.
  if (!startsAt && !endsAt) {
    return { status: "live", remainingMs: 0, startsAt: null, endsAt: null };
  }

  // Only an end, no start: live from the beginning of time until the end.
  if (!startsAt && endsAt) {
    const remainingMs = endsAt.getTime() - now;
    return {
      status: remainingMs > 0 ? "live" : "practice",
      remainingMs: Math.max(0, remainingMs),
      startsAt: null,
      endsAt,
    };
  }

  // Only a start, no end: live from the start onwards, never closes.
  if (startsAt && !endsAt) {
    return {
      status: now >= startsAt.getTime() ? "live" : "upcoming",
      remainingMs: 0,
      startsAt,
      endsAt: null,
    };
  }

  const startMs = startsAt?.getTime() ?? 0;
  const endMs = endsAt?.getTime() ?? 0;

  if (now < startMs) {
    return { status: "upcoming", remainingMs: 0, startsAt, endsAt };
  }
  if (now <= endMs) {
    return { status: "live", remainingMs: endMs - now, startsAt, endsAt };
  }
  return { status: "practice", remainingMs: 0, startsAt, endsAt };
}

/** True when an attempt started right now must count as a live attempt. */
export function isLiveAt(
  input: ExamWindowInput,
  now: number = Date.now(),
): boolean {
  return getExamWindow(input, now).status === "live";
}

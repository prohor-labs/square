import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

type CardIcon = "stack" | "layers" | "book";

const ICON_PATHS: Record<CardIcon, React.ReactNode> = {
  stack: (
    <>
      <path d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z" />
      <path d="m4 12 8 3.5 8-3.5" />
    </>
  ),
  layers: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z" />
      <path d="M5 19.5A1.5 1.5 0 0 1 6.5 18H19v3H6.5A1.5 1.5 0 0 1 5 19.5Z" />
    </>
  ),
};

export interface QbNavCardProps {
  readonly href: string;
  readonly title: string;
  readonly meta: string;
  readonly questions: number;
  readonly icon: CardIcon;
  /** Defaults to the category accent when omitted. */
  readonly accent?: string;
}

/**
 * Shared card for every level of the question bank.
 *
 * Flat rather than glossy: a hairline border, a muted wash on hover and a thin
 * accent rail, so a screen full of them stays calm. Two per row on phones, four
 * from `lg`.
 */
export function QbNavCard({
  href,
  title,
  meta,
  questions,
  icon,
  accent = "text-primary",
}: QbNavCardProps) {
  return (
    <a
      href={href}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:p-5 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* Accent rail on the left edge marks the level at a glance. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-30 transition-opacity group-hover:opacity-100",
          accent,
        )}
        style={{ backgroundColor: "currentColor" }}
      />

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm sm:text-base font-bold leading-snug text-foreground line-clamp-2">
          {title}
        </h3>
        <span
          className={cn(
            "shrink-0 size-8 sm:size-9 rounded-xl bg-muted/60 flex items-center justify-center",
            accent,
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 sm:size-4.5"
            aria-hidden
          >
            {ICON_PATHS[icon]}
          </svg>
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2 text-[11px] sm:text-xs">
        <span className="text-muted-foreground truncate">{meta}</span>
        <span className="text-muted-foreground/40">•</span>
        <span className="font-bold text-foreground whitespace-nowrap">
          {toBengaliDigits(questions)} টি প্রশ্ন
        </span>
      </div>
    </a>
  );
}

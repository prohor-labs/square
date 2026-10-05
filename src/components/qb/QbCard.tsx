import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/**
 * White on red, used by every card in the question bank.
 *
 * One palette rather than a hue per name: with only a handful of cards at the
 * bank and unit levels, a different wash on each one pulled the eye towards the
 * colour instead of the label.
 */
const COLORS = {
  /* A true red rather than a pink wash — two lighter passes (#fdeeee, #f6c8c8)
     both read as pale pink and washed the navy name out. */
  background: "linear-gradient(150deg, #f4bcbc 0%, #e38282 52%, #eea8a8 100%)",
  text: "#1b2a47",
  subText: "#7a3b40",
  pill: "#1e3a5f",
  /** The soft white shape sweeping in from the left edge. */
  shapeLeft: "rgba(255,255,255,0.94)",
  /** The smaller circle sitting over the right-hand end. */
  shapeRight: "rgba(255,255,255,0.6)",
} as const;

/**
 * The two white shapes, positioned as in the reference artwork. Both square
 * cards share one placement since their proportions match; the wide year box is
 * much flatter, so it needs its own.
 */
function Shapes({ flat }: { flat: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full",
          flat
            ? "-left-[8%] -top-[78%] size-[56%]"
            : "-left-[22%] -top-[40%] size-[66%]",
        )}
        style={{ backgroundColor: COLORS.shapeLeft }}
      />
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full",
          flat
            ? "-bottom-[60%] right-[10%] size-[30%]"
            : "-bottom-[20%] right-[8%] size-[32%]",
        )}
        style={{ backgroundColor: COLORS.shapeRight }}
      />
    </>
  );
}

export interface QbCardProps {
  readonly href: string;
  readonly title: string;
  readonly subtitle: string;
  readonly questions: number;
  /**
   * "wide" is the square tile for banks and institutes, where there are only a
   * handful. "compact" is the same square tile at a smaller type size, used for
   * units. "row" is the flat box used for the long list of years.
   */
  readonly variant?: "wide" | "compact" | "row";
}

/**
 * Flat, static card — no animation and no hover movement. The white shapes and
 * the red wash are the whole decoration; the name and the count are the content.
 */
export function QbCard({
  href,
  title,
  subtitle,
  questions,
  variant = "compact",
}: QbCardProps) {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

  if (variant === "row") {
    return (
      <a
        href={href}
        className={cn(
          "group relative flex h-[72px] items-center overflow-hidden rounded-2xl border border-border/40 p-3 shadow-sm sm:h-[78px]",
          focusRing,
        )}
        style={{ background: COLORS.background }}
      >
        <Shapes flat />

        <div className="relative z-10 min-w-0 flex-1 pr-[4.5rem] sm:pr-24">
          <h3
            className="truncate text-sm font-black leading-snug"
            style={{ color: COLORS.text }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="truncate text-[11px] font-medium leading-snug"
              style={{ color: COLORS.subText }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <span
          className="absolute right-3 top-1/2 shrink-0 -translate-y-1/2 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-white sm:text-xs"
          style={{ backgroundColor: COLORS.pill }}
        >
          {toBengaliDigits(questions)} টি প্রশ্ন
        </span>
      </a>
    );
  }

  /* Square tile, shared by banks and units — only the type size differs. The
     name sits on the first line with the full width to itself and the count
     underneath; side by side there was not enough room once the grids went two
     per row, and every name clipped to two characters. */
  const big = variant === "wide";

  return (
    <a
      href={href}
      className={cn(
        "group relative flex aspect-square flex-col justify-center overflow-hidden rounded-2xl border border-border/40 p-3 shadow-sm sm:p-4",
        focusRing,
      )}
      style={{ background: COLORS.background }}
    >
      <Shapes flat={false} />

      <h3
        className={cn(
          "relative z-10 font-black leading-tight",
          big
            ? "line-clamp-3 text-center text-[15px] sm:text-lg md:text-xl"
            : "line-clamp-2 text-center text-[13px] sm:text-base",
        )}
        style={{ color: COLORS.text }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          className={cn(
            "relative z-10 mt-1 line-clamp-1 text-center font-medium leading-snug",
            big ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]",
          )}
          style={{ color: COLORS.subText }}
        >
          {subtitle}
        </p>
      )}

      <span
        className={cn(
          "relative z-10 self-start rounded-full font-bold whitespace-nowrap text-white",
          big
            ? "mt-3 px-2.5 py-1 text-[10px] sm:text-xs"
            : "mt-2 px-2 py-0.5 text-[9px] sm:text-[10px]",
        )}
        style={{ backgroundColor: COLORS.pill }}
      >
        {toBengaliDigits(questions)} টি প্রশ্ন
      </span>
    </a>
  );
}

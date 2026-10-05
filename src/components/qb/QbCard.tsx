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
  background: "linear-gradient(150deg, #fdeeee 0%, #fbd8d8 52%, #fce4e4 100%)",
  text: "#1b2a47",
  subText: "#5a4a5c",
  pill: "#1e3a5f",
  /** The soft white shape sweeping in from the left edge. */
  shapeLeft: "rgba(255,255,255,0.92)",
  /** The smaller circle sitting over the right-hand end. */
  shapeRight: "rgba(255,255,255,0.55)",
} as const;

/** The two white shapes, positioned as in the reference artwork. */
function Shapes({ wide }: { wide: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full",
          wide
            ? "-left-[18%] -top-[34%] size-[78%]"
            : "-left-[14%] -top-[55%] size-[70%]",
        )}
        style={{ backgroundColor: COLORS.shapeLeft }}
      />
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full",
          wide
            ? "-bottom-[26%] right-[6%] size-[38%]"
            : "-bottom-[42%] right-[8%] size-[34%]",
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
   * "wide" is the taller card for banks and institutes, where there are only a
   * handful. "compact" is the short strip used for units, which sit two per
   * row. "row" is the flat box used for the long list of years.
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
  const wide = variant === "wide";

  const count = (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap sm:text-xs",
        wide && "absolute right-3 top-3",
      )}
      style={{ backgroundColor: COLORS.pill }}
    >
      {toBengaliDigits(questions)} টি প্রশ্ন
    </span>
  );

  const label = (
    <>
      <h3
        className={cn(
          "truncate font-black leading-snug",
          wide
            ? "line-clamp-2 text-center text-[15px] sm:text-lg md:text-xl"
            : "text-sm",
        )}
        style={{ color: COLORS.text }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={cn(
            "truncate font-medium leading-snug",
            wide ? "mt-1 text-center text-[11px] sm:text-xs" : "text-[11px]",
          )}
          style={{ color: COLORS.subText }}
        >
          {subtitle}
        </p>
      )}
    </>
  );

  if (wide) {
    return (
      <a
        href={href}
        className={cn(
          "group relative block overflow-hidden rounded-2xl border border-border/40 shadow-sm",
          "aspect-[5/4] sm:aspect-[6/5]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        )}
        style={{ background: COLORS.background }}
      >
        <Shapes wide />
        {count}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-5 text-center">
          {label}
        </div>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        "group relative flex items-center overflow-hidden rounded-2xl border border-border/40 p-3 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        variant === "compact" ? "h-[78px] sm:h-[84px]" : "h-[72px] sm:h-[78px]",
      )}
      style={{ background: COLORS.background }}
    >
      <Shapes wide={false} />
      <div className="relative z-10 min-w-0 flex-1 pr-[4.5rem] sm:pr-24">
        {label}
      </div>
      {count}
    </a>
  );
}

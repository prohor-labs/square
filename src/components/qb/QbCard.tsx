import {
  QB_CARD_COLORS,
  QB_FLAT_BLOBS,
  QB_SQUARE_BLOBS,
  QbCardFrame,
  QbCountPill,
} from "@/components/qb/card-skin";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/** The card body is not focusable, so the ring hangs off the link instead. */
const RING =
  "group-focus-visible:ring-2 group-focus-visible:ring-primary/50 group-focus-visible:ring-offset-2";

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
  if (variant === "row") {
    return (
      <a href={href} className={cn("group block", RING)}>
        <QbCardFrame blobs={QB_FLAT_BLOBS} flat>
          <div className="relative z-10 min-w-0 flex-1 pr-[4.5rem] sm:pr-24">
            <h3
              className="truncate text-base font-black leading-snug sm:text-lg"
              style={{ color: QB_CARD_COLORS.text }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className="truncate text-xs font-medium leading-snug sm:text-sm"
                style={{ color: QB_CARD_COLORS.subText }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <span
            className="absolute right-3 top-1/2 z-10 shrink-0 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-white sm:text-xs"
            style={{ backgroundColor: QB_CARD_COLORS.pill }}
          >
            {toBengaliDigits(questions)} টি প্রশ্ন
          </span>
        </QbCardFrame>
      </a>
    );
  }

  /* Square tile, shared by banks and units — only the type size differs. The
     count is pinned to the top-right corner and the name is centred below it,
     so the name gets the full width; laid out side by side, every name clipped
     to two characters once the grids went two per row. */
  const big = variant === "wide";

  return (
    <a href={href} className={cn("group block", RING)}>
      <QbCardFrame blobs={QB_SQUARE_BLOBS}>
        <QbCountPill questions={questions} />

        <h3
          className={cn(
            "relative z-10 text-center font-black leading-tight",
            big
              ? "line-clamp-3 text-lg sm:text-xl md:text-2xl"
              : "line-clamp-2 text-lg sm:text-xl",
          )}
          style={{ color: QB_CARD_COLORS.text }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            className="relative z-10 mt-1 line-clamp-1 text-center text-xs font-medium leading-snug sm:text-sm"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            {subtitle}
          </p>
        )}
      </QbCardFrame>
    </a>
  );
}

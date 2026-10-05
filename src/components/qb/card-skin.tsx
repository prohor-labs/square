import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/**
 * White on red — the shared skin for every question bank card.
 *
 * One palette rather than a hue per name: with only a handful of cards at the
 * bank and unit levels, a different wash on each one pulled the eye towards the
 * colour instead of the label.
 */
export const QB_CARD_COLORS = {
  /* A true red rather than a pink wash — three lighter passes (#fdeeee, #f6c8c8,
     #f4bcbc) all read as pale pink. The name is near-black navy so it still
     clears the contrast bar on the deepest stop. */
  background: "linear-gradient(150deg, #f0a6a6 0%, #d97070 52%, #e89090 100%)",
  text: "#121c33",
  subText: "#7a3b40",
  pill: "#1e3a5f",
  /** The soft white shape sweeping in from the left edge. */
  shapeLeft: "rgba(255,255,255,0.94)",
  /** The smaller circle sitting over the right-hand end. */
  shapeRight: "rgba(255,255,255,0.6)",
  /** Translucent white plate, so a control still reads on the red wash. */
  plate: "bg-white/25 hover:bg-white/40",
  plateText: "text-[#1e3a5f]",
} as const;

/** Circle placed by percentage of the card's own width, so it stays round. */
export interface QbBlob {
  readonly cx: number;
  readonly cy: number;
  /** Diameter as a percentage of the card's width. */
  readonly size: number;
}

/**
 * Squares and flat rows need their own placements: a row is about eight times
 * wider than it is tall, so one set of percentages lands in the wrong place.
 */
export const QB_SQUARE_BLOBS: readonly [QbBlob, QbBlob] = [
  { cx: 8, cy: -5, size: 62 },
  { cx: 88, cy: 88, size: 30 },
];

export const QB_FLAT_BLOBS: readonly [QbBlob, QbBlob] = [
  { cx: 6, cy: -5, size: 55 },
  { cx: 86, cy: 95, size: 15 },
];

/** The two white shapes, positioned as in the reference artwork. */
export function QbCardShapes({ blobs }: { blobs: readonly [QbBlob, QbBlob] }) {
  return (
    <>
      {blobs.map((b, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed two-slot tuple
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: `${b.cx}%`,
            top: `${b.cy}%`,
            width: `${b.size}%`,
            aspectRatio: "1",
            translate: "-50% -50%",
            backgroundColor:
              i === 0 ? QB_CARD_COLORS.shapeLeft : QB_CARD_COLORS.shapeRight,
          }}
        />
      ))}
    </>
  );
}

/** Card chrome shared by the student and admin versions. */
export function QbCardFrame({
  blobs,
  flat,
  className,
  children,
}: {
  blobs: readonly [QbBlob, QbBlob];
  /** Flat cards skip the top padding that reserves room for the count pill. */
  flat?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-2xl border border-border/40 shadow-sm",
        flat
          ? "h-[78px] items-center p-3 sm:h-[84px]"
          : "aspect-square flex-col justify-center px-3 pt-9 pb-4 sm:px-4 sm:pt-11 sm:pb-5",
        className,
      )}
      style={{ background: QB_CARD_COLORS.background }}
    >
      <QbCardShapes blobs={blobs} />
      {children}
    </div>
  );
}

/** The navy count pill that sits in the top-right corner of a card. */
export function QbCountPill({ questions }: { questions: number }) {
  return (
    <span
      className="absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-white sm:text-xs"
      style={{ backgroundColor: QB_CARD_COLORS.pill }}
    >
      {toBengaliDigits(questions)} টি প্রশ্ন
    </span>
  );
}

/** The same pill, laid out inline instead of pinned to a corner. */
export function QbCountBadge({ questions }: { questions: number }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-white"
      style={{ backgroundColor: QB_CARD_COLORS.pill }}
    >
      {toBengaliDigits(questions)} টি প্রশ্ন
    </span>
  );
}

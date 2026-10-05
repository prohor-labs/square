import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/**
 * Cards are coloured from a hash of their seed rather than from a fixed palette.
 *
 * The seed is the university or bank a card belongs to, so every card under
 * "ঢাকা বিশ্ববিদ্যালয়" lands on the same hue while different universities get
 * different ones — variety across the page, consistency within a course.
 */
function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return hash;
}

interface CardColours {
  readonly background: string;
  readonly text: string;
  readonly subText: string;
  readonly pill: string;
  readonly blobA: string;
  readonly blobB: string;
}

/** Light, low-saturation washes so dark text stays readable on every hue. */
function coloursFor(seed: string): CardColours {
  const hue = hueFromSeed(seed);
  return {
    background: `linear-gradient(145deg, hsl(${hue} 78% 91%) 0%, hsl(${(hue + 26) % 360} 68% 83%) 55%, hsl(${(hue + 12) % 360} 72% 86%) 100%)`,
    text: `hsl(${hue} 62% 21%)`,
    subText: `hsl(${hue} 45% 34%)`,
    pill: `hsl(${hue} 48% 30%)`,
    blobA: `hsl(${(hue + 34) % 360} 88% 96%)`,
    blobB: `hsl(${(hue + 320) % 360} 72% 88%)`,
  };
}

/** Blob placement varies per seed so a grid does not look stamped. */
function blobGeometry(seed: string) {
  const hash = hueFromSeed(seed);
  const a = {
    cx: 18 + (hash % 40),
    cy: 12 + ((hash >> 3) % 30),
    r: 26 + ((hash >> 5) % 18),
  };
  const b = {
    cx: 62 + ((hash >> 7) % 30),
    cy: 58 + ((hash >> 9) % 32),
    r: 22 + ((hash >> 11) % 20),
  };
  return { a, b };
}

export interface QbCardProps {
  readonly href: string;
  readonly title: string;
  readonly subtitle: string;
  readonly questions: number;
  /** University or bank name — drives the colour and blob placement. */
  readonly seed: string;
  /**
   * "tile" is a short card for banks, institutes and units; "row" is a flat box
   * in a vertical list, used for the long lists of years.
   */
  readonly variant?: "tile" | "row";
}

/**
 * Card built from a hashed colour wash with two soft corner shapes. Nothing
 * animates — the earlier drifting waves were more motion than the content
 * needed, so the decoration is static and the colour does the work instead.
 */
export function QbCard({
  href,
  title,
  subtitle,
  questions,
  seed,
  variant = "tile",
}: QbCardProps) {
  const c = coloursFor(seed);
  const { a, b } = blobGeometry(seed);

  if (variant === "row") {
    return (
      <a
        href={href}
        className={cn(
          "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 p-3.5 shadow-sm transition-[transform,box-shadow] duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
        style={{ background: c.background }}
      >
        <span
          aria-hidden
          className="absolute -top-10 -left-8 size-28 rounded-full"
          style={{ backgroundColor: c.blobA }}
        />
        <span
          aria-hidden
          className="absolute -bottom-12 right-16 size-24 rounded-full"
          style={{ backgroundColor: c.blobB }}
        />

        <div className="relative z-10 min-w-0 flex-1">
          <h3
            className="truncate text-sm font-black leading-snug"
            style={{ color: c.text }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="truncate text-[11px] font-medium leading-snug"
              style={{ color: c.subText }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <span
          className="relative z-10 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap sm:text-xs"
          style={{ backgroundColor: c.pill }}
        >
          {toBengaliDigits(questions)} টি প্রশ্ন
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl shadow-sm transition-[transform,box-shadow] duration-200",
        "aspect-[5/4] sm:aspect-[6/5]",
        "hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
      )}
      style={{ background: c.background }}
    >
      {/* Two soft corner shapes, placed from the seed. */}
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: `${a.cx}%`,
          top: `${a.cy}%`,
          width: `${a.r}%`,
          aspectRatio: "1",
          translate: "-50% -50%",
          backgroundColor: c.blobA,
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: `${b.cx}%`,
          top: `${b.cy}%`,
          width: `${b.r}%`,
          aspectRatio: "1",
          translate: "-50% -50%",
          backgroundColor: c.blobB,
        }}
      />

      <span
        className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap sm:text-xs"
        style={{ backgroundColor: c.pill }}
      >
        {toBengaliDigits(questions)} টি প্রশ্ন
      </span>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-5 text-center">
        <h3
          className="text-[15px] sm:text-lg md:text-xl font-black leading-tight line-clamp-2"
          style={{ color: c.text }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="mt-1 text-[11px] sm:text-xs font-medium leading-snug line-clamp-1"
            style={{ color: c.subText }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </a>
  );
}

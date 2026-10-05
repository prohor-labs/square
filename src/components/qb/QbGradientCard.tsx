import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/** One palette per bank so the shape stays identical while the colour shifts. */
export interface QbCardPalette {
  /** Base wash behind the mesh gradients. */
  readonly base: string;
  readonly glowTop: string;
  readonly glowBottom: string;
  readonly text: string;
  readonly pill: string;
  readonly wave: readonly [string, string, string];
}

export const QB_PALETTES = {
  varsity: {
    base: "linear-gradient(150deg, #b6cbf9 0%, #7fa3f0 48%, #6b8fe8 100%)",
    glowTop:
      "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.55), transparent 60%)",
    glowBottom:
      "radial-gradient(90% 60% at 85% 95%, rgba(38,74,168,0.35), transparent 65%)",
    text: "#12203a",
    pill: "rgba(19,44,80,0.82)",
    wave: [
      "rgba(255,255,255,0.34)",
      "rgba(255,255,255,0.20)",
      "rgba(28,58,124,0.16)",
    ],
  },
  engineering: {
    base: "linear-gradient(150deg, #b8e8f8 0%, #62c4ec 48%, #45aade 100%)",
    glowTop:
      "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.58), transparent 60%)",
    glowBottom:
      "radial-gradient(90% 60% at 85% 95%, rgba(10,86,133,0.35), transparent 65%)",
    text: "#072b3a",
    pill: "rgba(9,52,74,0.82)",
    wave: [
      "rgba(255,255,255,0.36)",
      "rgba(255,255,255,0.21)",
      "rgba(7,74,109,0.16)",
    ],
  },
  medical: {
    base: "linear-gradient(150deg, #fdc6d6 0%, #f68aa8 48%, #ef6e90 100%)",
    glowTop:
      "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.55), transparent 60%)",
    glowBottom:
      "radial-gradient(90% 60% at 85% 95%, rgba(155,25,60,0.32), transparent 65%)",
    text: "#451024",
    pill: "rgba(78,18,38,0.82)",
    wave: [
      "rgba(255,255,255,0.34)",
      "rgba(255,255,255,0.20)",
      "rgba(143,23,54,0.15)",
    ],
  },
  board: {
    base: "linear-gradient(150deg, #bdf0d7 0%, #62d09c 48%, #45c084 100%)",
    glowTop:
      "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.55), transparent 60%)",
    glowBottom:
      "radial-gradient(90% 60% at 85% 95%, rgba(11,110,68,0.34), transparent 65%)",
    text: "#08301e",
    pill: "rgba(12,62,42,0.82)",
    wave: [
      "rgba(255,255,255,0.35)",
      "rgba(255,255,255,0.21)",
      "rgba(10,99,61,0.15)",
    ],
  },
  neutral: {
    base: "linear-gradient(150deg, #d6dfee 0%, #a7b5cf 48%, #93a3c1 100%)",
    glowTop:
      "radial-gradient(120% 70% at 18% 8%, rgba(255,255,255,0.5), transparent 60%)",
    glowBottom:
      "radial-gradient(90% 60% at 85% 95%, rgba(45,58,84,0.32), transparent 65%)",
    text: "#1a2333",
    pill: "rgba(30,40,58,0.82)",
    wave: [
      "rgba(255,255,255,0.32)",
      "rgba(255,255,255,0.19)",
      "rgba(40,50,70,0.14)",
    ],
  },
} as const satisfies Record<string, QbCardPalette>;

export type QbPaletteKey = keyof typeof QB_PALETTES;

export interface QbGradientCardProps {
  readonly href: string;
  readonly title: string;
  readonly subtitle: string;
  readonly questions: number;
  readonly palette: QbPaletteKey;
  /** Extra line under the subtitle, e.g. "১২টি অধ্যায়". */
  readonly footnote?: string;
}

/**
 * Square card built from three drifting wave layers over a mesh gradient, with
 * the question count in a glass pill at the top right.
 *
 * The waves are 200% wide and translate by half their own width, so the loop
 * is seamless; each layer runs at a different duration to avoid a visible
 * repeat. `prefers-reduced-motion` disables the drift (see globals.css).
 */
export function QbGradientCard({
  href,
  title,
  subtitle,
  questions,
  palette,
  footnote,
}: QbGradientCardProps) {
  const colors = QB_PALETTES[palette];

  return (
    <a
      href={href}
      className={cn(
        "group relative block aspect-square overflow-hidden rounded-[22px] sm:rounded-[28px] shadow-sm transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-1.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
      )}
      style={{ background: colors.base }}
    >
      {/* Mesh glows, so the wash is not a flat diagonal. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: colors.glowTop }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: colors.glowBottom }}
      />

      {/* Slow breathing wave behind everything else. */}
      <svg
        aria-hidden
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        className="qb-wave-c pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path
          d="M0,168 C62,120 152,190 242,152 C314,124 358,176 400,146 L400,200 L0,200 Z"
          fill={colors.wave[2]}
        />
      </svg>

      {/* Two counter-drifting bands, 200% wide for a seamless loop. */}
      <svg
        aria-hidden
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        className="qb-wave-track pointer-events-none absolute inset-x-0 top-0 h-1/2"
      >
        <path
          className="qb-wave-a"
          d="M0,128 C46,170 116,76 198,106 C276,134 342,68 400,94 C462,120 522,72 600,100 C678,128 742,80 800,96 L800,0 L0,0 Z"
          fill={colors.wave[0]}
        />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        className="qb-wave-track pointer-events-none absolute inset-x-0 top-0 h-1/2"
      >
        <path
          className="qb-wave-b"
          d="M0,158 C70,120 140,178 210,146 C280,114 350,168 420,140 C490,112 560,164 640,136 C712,110 756,150 800,138 L800,0 L0,0 Z"
          fill={colors.wave[1]}
        />
      </svg>

      {/* Question count in a glass pill. */}
      <span
        className="absolute right-2.5 top-2.5 sm:right-4 sm:top-4 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-white whitespace-nowrap border border-white/25 backdrop-blur-md"
        style={{ backgroundColor: colors.pill }}
      >
        {toBengaliDigits(questions)} টি প্রশ্ন
      </span>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-7 text-center">
        <h3
          className="text-base sm:text-2xl md:text-[26px] font-black leading-tight line-clamp-2"
          style={{ color: colors.text }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm font-medium leading-snug line-clamp-1"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            {subtitle}
          </p>
        )}
        {footnote && (
          <p
            className="mt-1 text-[10px] sm:text-xs font-semibold"
            style={{ color: colors.text, opacity: 0.45 }}
          >
            {footnote}
          </p>
        )}
      </div>
    </a>
  );
}

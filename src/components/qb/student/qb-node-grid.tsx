import Link from "next/link";
import type { ReactElement } from "react";
import { Edit } from "@/components/icons";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { QbNode } from "@/lib/qb-catalog";

interface Tint {
  /** Gradient body of the tile. */
  readonly bg: string;
  /** Label ink that stays readable on that gradient. */
  readonly ink: string;
}

/**
 * Six bright tiles reused in order — the palette is intentionally louder than
 * the rest of the page, because these cards *are* the navigation.
 */
const TINTS: readonly Tint[] = [
  { bg: "from-[#F8CD4F] to-[#E2A00B]", ink: "text-[#3B2A05]" },
  { bg: "from-[#98AAF8] to-[#7086EC]", ink: "text-[#1B2454]" },
  { bg: "from-[#8BD3F5] to-[#55B4E9]", ink: "text-[#07344E]" },
  { bg: "from-[#7AD69A] to-[#45BD70]", ink: "text-[#08351B]" },
  { bg: "from-[#3CC1B9] to-[#109089]", ink: "text-[#04312E]" },
  { bg: "from-[#F6E764] to-[#E2CA22]", ink: "text-[#3A3204]" },
];

/** The hint repeats the pill for year cards ("৩টি প্রশ্ন"), so drop it there. */
function nodeHint(node: QbNode): string | null {
  const hint = node.hint.trim();
  if (hint.length === 0) return null;
  if (/^[০-৯]+টি প্রশ্ন$/.test(hint)) return null;
  return hint;
}

/**
 * The tile grid every shelf level is rendered with.
 *
 * Long Bangla labels wrap instead of overflowing, and the count stays in a
 * white pill so it reads the same on every colour.
 */
export function QbNodeGrid({
  nodes,
}: {
  readonly nodes: readonly QbNode[];
}): ReactElement {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {nodes.map((node, index) => {
        const tint = TINTS[index % TINTS.length];
        const hint = nodeHint(node);

        return (
          <li key={node.key} className="min-w-0">
            <Link
              href={node.href}
              className={`group relative flex h-full min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${tint.bg} p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2`}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full bg-white/25"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -left-10 size-28 rounded-full bg-white/15"
              />

              <span className="relative block min-w-0">
                <span
                  className={`block break-words text-base font-black leading-snug sm:text-[17px] ${tint.ink}`}
                >
                  {node.label}
                </span>
                {hint ? (
                  <span
                    className={`mt-1 block break-words text-[11px] font-semibold leading-snug opacity-80 ${tint.ink}`}
                  >
                    {hint}
                  </span>
                ) : null}
              </span>

              <span className="relative mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-black/65 shadow-sm">
                <Edit className="size-3" aria-hidden="true" />
                {toBengaliDigits(node.count)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

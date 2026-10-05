import Link from "next/link";
import {
  QB_CARD_COLORS,
  QB_FLAT_BLOBS,
  QB_SQUARE_BLOBS,
  QbCardFrame,
  QbCountBadge,
  QbCountPill,
} from "@/components/qb/card-skin";
import { cn } from "@/lib/utils";

/** Button plate that stays readable on the red wash. */
export const ADMIN_ACTION_CLASS = cn(
  "gap-1 rounded-xl px-2.5 text-xs font-bold cursor-pointer",
  QB_CARD_COLORS.plate,
  QB_CARD_COLORS.plateText,
);

interface AdminQbCardBase {
  readonly href: string;
  readonly title: string;
  /** Counts line under the name, e.g. "২ টি ইউনিট". */
  readonly meta: string;
  readonly questions: number;
  /** Edit and delete controls, rendered above the link overlay. */
  readonly actions: React.ReactNode;
}

function OverlayLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="absolute inset-0 rounded-2xl focus-visible:outline-none"
      aria-label={title}
    />
  );
}

/**
 * Bank or unit tile: square, name centred, count in the corner, actions below.
 */
export function AdminQbSquareCard({
  href,
  title,
  meta,
  questions,
  actions,
}: AdminQbCardBase) {
  return (
    <div className="group relative">
      <QbCardFrame
        blobs={QB_SQUARE_BLOBS}
        className="group-focus-visible:ring-2 group-focus-visible:ring-primary/50"
      >
        <OverlayLink href={href} title={title} />
        <QbCountPill questions={questions} />

        <h3
          className="relative z-10 line-clamp-2 px-1 text-center text-lg font-black leading-snug sm:text-xl"
          style={{ color: QB_CARD_COLORS.text }}
        >
          {title}
        </h3>

        <p
          className="relative z-10 mt-1 line-clamp-1 px-1 text-center text-xs font-medium leading-snug sm:text-[13px]"
          style={{ color: QB_CARD_COLORS.subText }}
        >
          {meta}
        </p>

        <div
          className="relative z-10 mt-4 flex justify-center gap-1.5"
          style={{ color: QB_CARD_COLORS.plateText }}
        >
          {actions}
        </div>
      </QbCardFrame>
    </div>
  );
}

/**
 * Year or topic row: name and counts on the left, count pill and actions on the
 * right.
 */
export function AdminQbFlatCard({
  href,
  title,
  meta,
  questions,
  actions,
}: AdminQbCardBase) {
  return (
    <div className="group relative">
      <QbCardFrame
        blobs={QB_FLAT_BLOBS}
        flat
        className="group-focus-visible:ring-2 group-focus-visible:ring-primary/50"
      >
        <OverlayLink href={href} title={title} />

        <div className="relative z-10 min-w-0 flex-1 pr-4">
          <h3
            className="truncate text-base font-black leading-snug sm:text-lg"
            style={{ color: QB_CARD_COLORS.text }}
          >
            {title}
          </h3>
          <p
            className="truncate text-xs font-medium leading-snug sm:text-[13px]"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            {meta}
          </p>
        </div>

        <div
          className="relative z-10 flex shrink-0 items-center gap-2"
          style={{ color: QB_CARD_COLORS.plateText }}
        >
          <QbCountBadge questions={questions} />
          {actions}
        </div>
      </QbCardFrame>
    </div>
  );
}

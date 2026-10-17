import Link from "next/link";
import { AngleRight } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface QbCrumb {
  readonly label: string;
  readonly href?: string;
}

/**
 * The trail back up.
 *
 * Every page in the bank has one, because the bank is a drill-down and a
 * student three levels in still needs to get to the subject two levels up
 * without using the browser's back button four times.
 */
export function QbBreadcrumb({
  items,
  className,
}: {
  readonly items: readonly QbCrumb[];
  readonly className?: string;
}) {
  return (
    <nav aria-label="ব্রেডক্রাম" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              // A breadcrumb has no identity beyond its place in the trail, and
              // the same label can legitimately appear twice in it.
              // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity here
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 && (
                <AngleRight
                  className="size-3.5 shrink-0 opacity-50"
                  aria-hidden
                />
              )}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "truncate",
                    last && "font-bold text-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import Link from "next/link";
import type { ReactElement } from "react";
import { AngleRight } from "@/components/icons";
import type { QbCrumb } from "@/lib/qb-catalog";

/** Clickable trail for every inner page; the last item is the current page. */
export function QbBreadcrumbs({
  items,
}: {
  readonly items: readonly QbCrumb[];
}): ReactElement {
  return (
    <nav
      aria-label="ব্রেডক্রাম্ব"
      className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-[13px]"
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span
            key={`${item.label}-${item.href ?? "self"}`}
            className="inline-flex items-center gap-1.5"
          >
            {index > 0 ? (
              <AngleRight
                className="size-3 text-muted-foreground/50"
                aria-hidden="true"
              />
            ) : null}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="font-semibold transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={last ? "font-bold text-foreground" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

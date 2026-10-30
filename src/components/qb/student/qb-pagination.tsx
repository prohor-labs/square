import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { AngleLeft, AngleRight } from "@/components/icons";
import { toBengaliDigits } from "@/lib/calendar-date";

/** Server-rendered pager — a plain link per page, so it works without JS. */
export function QbPagination({
  basePath,
  page,
  pageCount,
  query = "",
}: {
  readonly basePath: string;
  readonly page: number;
  readonly pageCount: number;
  /** Extra query string kept on every page link (e.g. `subject=পদার্থবিজ্ঞান`). */
  readonly query?: string;
}): ReactElement | null {
  if (pageCount <= 1) return null;

  const href = (target: number): string =>
    `${basePath}?${query ? `${query}&` : ""}page=${target}`;
  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pageCount, page + 2);
  for (let index = from; index <= to; index += 1) pages.push(index);

  return (
    <nav
      aria-label="পৃষ্ঠা"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      <PageLink
        href={href(Math.max(1, page - 1))}
        disabled={page === 1}
        label="আগের"
      >
        <AngleLeft className="size-3.5" aria-hidden="true" />
      </PageLink>

      {from > 1 ? <Ellipsis /> : null}
      {pages.map((item) => (
        <Link
          key={item}
          href={href(item)}
          aria-current={item === page ? "page" : undefined}
          className={
            item === page
              ? "flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary px-2 text-xs font-black text-primary-foreground"
              : "flex h-9 min-w-9 items-center justify-center rounded-xl border border-border px-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          }
        >
          {toBengaliDigits(item)}
        </Link>
      ))}
      {to < pageCount ? <Ellipsis /> : null}

      <PageLink
        href={href(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        label="পরের"
      >
        <AngleRight className="size-3.5" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  readonly href: string;
  readonly disabled: boolean;
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  if (disabled) {
    return (
      <span className="flex h-9 items-center gap-1 rounded-xl border border-border/60 px-3 text-xs font-bold text-muted-foreground/40">
        {children}
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function Ellipsis(): ReactElement {
  return <span className="px-1 text-xs text-muted-foreground/60">…</span>;
}

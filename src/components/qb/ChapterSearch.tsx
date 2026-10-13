"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Search inside a chapter.
 *
 * A plain GET form would reload and drop the scroll position on every
 * keystroke, so the query is pushed with a short debounce and the input keeps
 * its own value while typing.
 */
export function ChapterSearch({
  basePath,
  params,
}: {
  readonly basePath: string;
  /** The facets already chosen, so searching never discards them. */
  readonly params: Readonly<Record<string, string>>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const query = new URLSearchParams(params);
      if (value.trim()) query.set("q", value.trim());
      else query.delete("q");
      const search = query.toString();
      router.push(search ? `${basePath}?${search}` : basePath, {
        scroll: false,
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [value, basePath, params, router]);

  return (
    <form onSubmit={(event) => event.preventDefault()} className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="এই অধ্যায়ে প্রশ্ন খুঁজুন…"
        aria-label="এই অধ্যায়ে প্রশ্ন খুঁজুন"
        className="w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 text-sm outline-none transition-colors focus:border-primary"
      />
    </form>
  );
}

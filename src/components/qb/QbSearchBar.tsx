"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { CloseCircle, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * The search box that sits at the top of the bank.
 *
 * Typing rewrites the query string instead of posting a form, so the page the
 * student was already on keeps its filters and its position, and Back still
 * works. Typing is debounced; Enter skips the wait.
 */
export function QbSearchBar({
  placeholder = "প্রশ্ন, বিষয়, অধ্যায়, টপিক বা পরীক্ষার নাম লিখে খুঁজুন...",
  className,
  autoFocus,
}: {
  readonly placeholder?: string;
  readonly className?: string;
  readonly autoFocus?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the box in step when the URL changes underneath it — a Back press, or
  // clearing a filter from somewhere else on the page.
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  const push = (next: string) => {
    const current = params.get("q") ?? "";
    if (next === current) return;

    const search = new URLSearchParams(params.toString());
    if (next) search.set("q", next);
    else search.delete("q");
    // A new search starts at the first page; page 4 of the old results is
    // meaningless against the new ones.
    search.delete("page");

    setBusy(true);
    router.replace(`?${search.toString()}`, { scroll: false });
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next), 450);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    push(value.trim());
  };

  return (
    <search className={cn("block", className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="প্রশ্নব্যাংকে খুঁজুন"
          className="h-11 pr-20 pl-9"
        />

        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1">
          {busy && <Spinner className="size-3.5 text-muted-foreground" />}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setValue("");
                push("");
              }}
              aria-label="খুঁজবা মুছে ফেলুন"
              className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <CloseCircle className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </search>
  );
}

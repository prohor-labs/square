"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CloseCircle, Search } from "@/components/icons";
import {
  type QbSearchNodeHit,
  type QbSearchQuestionHit,
  searchQbAction,
} from "@/lib/actions/qb-search";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

type Row =
  | { readonly kind: "node"; readonly node: QbSearchNodeHit }
  | { readonly kind: "question"; readonly question: QbSearchQuestionHit };

const DEBOUNCE_MS = 280;

/**
 * Search that works across Bangla, English and a mix of the two.
 *
 * The words themselves are matched on the server (`searchQbAction`) against the
 * real bank; this component only debounces keystrokes and renders what comes
 * back. A slow network never blocks typing because every response is tagged
 * with a request id and stale answers are dropped.
 */
export function QbSearchBox({
  initialTerm = "",
}: {
  readonly initialTerm?: string;
}): React.ReactElement {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  const [term, setTerm] = useState(initialTerm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [payload, setPayload] = useState<{
    readonly questions: readonly QbSearchQuestionHit[];
    readonly nodes: readonly QbSearchNodeHit[];
    readonly totalQuestions: number;
  } | null>(null);

  const trimmed = term.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setPayload(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = window.setTimeout(() => {
      searchQbAction(trimmed)
        .then((result) => {
          if (requestRef.current !== requestId) return;
          setPayload(result);
          setLoading(false);
        })
        .catch(() => {
          if (requestRef.current !== requestId) return;
          setPayload(null);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const rows = useMemo<readonly Row[]>(() => {
    if (!payload) return [];
    return [
      ...payload.nodes.map((node) => ({ kind: "node" as const, node })),
      ...payload.questions.map((question) => ({
        kind: "question" as const,
        question,
      })),
    ];
  }, [payload]);

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) return;
    setOpen(false);
    router.push(`/qb/search?q=${encodeURIComponent(next)}`);
  };

  const go = (row: Row) => {
    setOpen(false);
    if (row.kind === "node") router.push(row.node.href);
    else router.push(`/qb/question/${row.question.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (rows.length > 0) {
        setOpen(true);
        setActive((index) => (index + 1) % rows.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (rows.length > 0) {
        setOpen(true);
        setActive((index) => (index - 1 + rows.length) % rows.length);
      }
      return;
    }
    if (event.key === "Enter") {
      if (open && active >= 0 && rows[active]) {
        event.preventDefault();
        go(rows[active]);
        return;
      }
      event.preventDefault();
      submit(term);
    }
  };

  const showPanel = open && trimmed.length >= 2;

  return (
    <div ref={boxRef} className="relative">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(term);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          প্রশ্নব্যাংকে খুঁজুন
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25 sm:gap-3 sm:rounded-3xl">
          <Search
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="বিষয়, বিশ্ববিদ্যালয়, অধ্যায় বা প্রশ্ন লিখুন…"
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 ? `${listId}-row-${active}` : undefined
            }
            className="h-14 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70 sm:h-16 sm:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                setPayload(null);
                setOpen(false);
              }}
              aria-label="সার্চ মুছুন"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <CloseCircle className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          {loading ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
            />
          ) : null}
          <button
            type="submit"
            className="hidden rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:block"
          >
            খুঁজুন
          </button>
        </div>
      </form>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="সার্চ ফলাফল"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/10"
        >
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              {loading ? "খোঁজা হচ্ছে…" : "কিছু পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন।"}
            </p>
          ) : (
            <ul className="max-h-[26rem] overflow-y-auto py-1.5">
              {payload && payload.nodes.length > 0 ? (
                <li className="px-3 pb-1 pt-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  বিভাগ
                </li>
              ) : null}
              {rows.map((row, index) =>
                row.kind === "node" ? (
                  <li key={`n-${row.node.href}`}>
                    <button
                      type="button"
                      id={`${listId}-row-${index}`}
                      role="option"
                      aria-selected={active === index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(row)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                        active === index
                          ? "bg-primary/10"
                          : "hover:bg-muted/70",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {row.node.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {row.node.hint}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {toBengaliDigits(row.node.count)}
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={`q-${row.question.id}`}>
                    <button
                      type="button"
                      id={`${listId}-row-${index}`}
                      role="option"
                      aria-selected={active === index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(row)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-2.5 text-left transition-colors",
                        active === index
                          ? "bg-primary/10"
                          : "hover:bg-muted/70",
                      )}
                    >
                      <span className="line-clamp-2 text-sm leading-snug">
                        {row.question.text}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {[row.question.subject, row.question.chapter]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}

          {payload && payload.totalQuestions > 0 ? (
            <button
              type="button"
              onClick={() => submit(term)}
              className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <span>সব ফলাফল দেখুন</span>
              <span>{toBengaliDigits(payload.totalQuestions)}টি প্রশ্ন</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

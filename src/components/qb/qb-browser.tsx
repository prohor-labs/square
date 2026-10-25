"use client";

import { useRouter } from "next/navigation";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  AngleLeft,
  AngleRight,
  CloseCircle,
  Courthouse,
  Flash,
  GradCap,
  Grid,
  Lightbulb,
  Search,
  Stethoscope,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQbCounts, getQbQuestions } from "@/lib/actions/qb-browse";
import { toBengaliDigits } from "@/lib/calendar-date";
import {
  QB_CATEGORIES,
  QB_EXAM_TYPE_LABELS,
  QB_PAGE_SIZE,
  type QbCategory,
  type QbCounts,
  type QbPage,
  type QbQuestion,
  type QbQuery,
} from "@/lib/qb-browse-types";
import {
  markdownComponents,
  sanitizeQuestionContent,
} from "@/lib/question-content";
import { cn } from "@/lib/utils";

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ", "ঙ"];

/**
 * Each category card carries its own accent so the grid reads as distinct
 * destinations rather than four copies of one button. `plate` paints the icon
 * tile, `active` is the ring + wash when that card is the chosen slice.
 */
const CATEGORY_META: Record<
  QbCategory,
  {
    readonly label: string;
    readonly caption: string;
    readonly Icon: typeof Grid;
    readonly plate: string;
    readonly active: string;
  }
> = {
  all: {
    label: "সব প্রশ্ন",
    caption: "পুরো ব্যাংক",
    Icon: Grid,
    plate: "bg-primary/12 text-primary",
    active: "border-primary/50 bg-primary/5 ring-2 ring-primary/20",
  },
  board: {
    label: "বোর্ড",
    caption: "একাডেমিক বোর্ড",
    Icon: Courthouse,
    plate: "bg-amber-500/15 text-amber-600",
    active: "border-amber-500/50 bg-amber-500/5 ring-2 ring-amber-500/20",
  },
  varsity: {
    label: "ভার্সিটি",
    caption: "বিশ্ববিদ্যালয় ভর্তি",
    Icon: GradCap,
    plate: "bg-indigo-500/15 text-indigo-600",
    active: "border-indigo-500/50 bg-indigo-500/5 ring-2 ring-indigo-500/20",
  },
  medical: {
    label: "মেডিকেল",
    caption: "এমবিবিএস ভর্তি",
    Icon: Stethoscope,
    plate: "bg-emerald-500/15 text-emerald-600",
    active: "border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20",
  },
};

/** The stored source is mostly a meaningless "1", so only a real label shows. */
const MEANINGLESS_SOURCES = new Set(["1", "csv import", "custom", ""]);

function sourceLabel(source: string): string {
  const trimmed = source.trim();
  return MEANINGLESS_SOURCES.has(trimmed.toLowerCase()) ? "" : trimmed;
}

function QuestionBody({ text }: { readonly text: string }): ReactElement {
  return (
    <div className="[&_p]:m-0 [&_p]:leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={markdownComponents}
      >
        {sanitizeQuestionContent(text)}
      </ReactMarkdown>
    </div>
  );
}

/** A small colored chip naming every exam this question was filed under. */
function ExamTags({
  types,
}: {
  readonly types: readonly string[];
}): ReactElement | null {
  if (types.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {types.map((type) => (
        <span
          key={type}
          className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground"
        >
          {QB_EXAM_TYPE_LABELS[type] ?? type}
        </span>
      ))}
    </span>
  );
}

function QuestionRow({
  question,
  index,
}: {
  readonly question: QbQuestion;
  readonly index: number;
}): ReactElement {
  const [picked, setPicked] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const correctOption = useMemo(
    () => question.options.find((option) => option.isCorrect),
    [question.options],
  );
  const answered = picked !== null;
  const source = sourceLabel(question.source);

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-black tabular-nums text-primary">
          {toBengaliDigits(index + 1)}
        </span>
        {question.isFree && (
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">
            উন্মুক্ত
          </span>
        )}
        <ExamTags types={question.examTypes} />
        {source && (
          <span className="text-xs text-muted-foreground">• {source}</span>
        )}
      </div>

      <div className="mb-3.5 text-[15px] font-medium sm:text-base">
        <QuestionBody text={question.text} />
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option, optionIndex) => {
          const pickedThis = picked === option.id;
          const isCorrect = option.isCorrect;

          let state = "idle";
          if (answered) {
            if (pickedThis && isCorrect) state = "right";
            else if (pickedThis && !isCorrect) state = "wrong";
            else if (isCorrect) state = "reveal";
            else state = "muted";
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => setPicked(option.id)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                state === "idle" &&
                  "border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
                state === "right" &&
                  "border-emerald-500/60 bg-emerald-500/10 text-emerald-700",
                state === "wrong" &&
                  "border-destructive/60 bg-destructive/10 text-destructive",
                state === "reveal" && "border-emerald-500/40 bg-emerald-500/5",
                state === "muted" && "border-border/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  state === "right" &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  state === "wrong" &&
                    "border-destructive bg-destructive text-white",
                  state === "reveal" && "border-emerald-500/50 text-emerald-600",
                  (state === "idle" || state === "muted") && "border-border",
                )}
              >
                {state === "right" ? (
                  <TickCircle className="size-3.5" />
                ) : state === "wrong" ? (
                  <CloseCircle className="size-3.5" />
                ) : (
                  (OPTION_KEYS[optionIndex] ?? optionIndex + 1)
                )}
              </span>
              <span className="flex-1 text-sm">
                <QuestionBody text={option.text} />
              </span>
            </button>
          );
        })}
      </div>

      {(question.explanation || (answered && correctOption)) && (
        <div className="mt-3.5 border-t border-dashed border-border/50 pt-3">
          {question.explanation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation((prev) => !prev)}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <Lightbulb className="size-3.5" />
              {showExplanation ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা দেখুন"}
            </Button>
          )}

          {showExplanation && question.explanation && (
            <div className="mt-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm">
              <QuestionBody text={question.explanation} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function QbBrowser({
  initial,
  initialCounts,
  initialQuery,
}: {
  readonly initial: QbPage;
  readonly initialCounts: QbCounts;
  readonly initialQuery: QbQuery;
}): ReactElement {
  const router = useRouter();

  const [category, setCategory] = useState<QbCategory>(initialQuery.category);
  const [free, setFree] = useState(initialQuery.free);
  const [explained, setExplained] = useState(initialQuery.explained);
  const [search, setSearch] = useState(initialQuery.search);
  const [page, setPage] = useState(initial.page);
  const [data, setData] = useState<QbPage>(initial);
  const [counts, setCounts] = useState<QbCounts>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const firstRender = useRef(true);

  // Any change to the slice re-asks the server. The first paint already has
  // the answer, so this waits until the student actually changes something.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    const query: QbQuery = { category, free, explained, search, page };

    const timer = setTimeout(() => {
      void Promise.all([getQbQuestions(query), getQbCounts(query)]).then(
        ([questions, nextCounts]) => {
          if (cancelled) return;
          setData(questions);
          setCounts(nextCounts);
          setPage(questions.page);
          setLoaded(true);
          setLoading(false);
        },
      );
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, free, explained, search, page]);

  // The address bar stays in step so a filtered slice can be shared as a link.
  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category !== "all") params.set("c", category);
    if (free) params.set("free", "1");
    if (explained) params.set("exp", "1");
    if (page > 1) params.set("p", String(page));
    const query = params.toString();
    router.replace(query ? `/qb?${query}` : "/qb", { scroll: false });
  }, [category, free, explained, search, page, loaded, router]);

  const pickCategory = useCallback((next: QbCategory) => {
    setCategory(next);
    setPage(1);
  }, []);

  const changePage = useCallback((next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // A pill narrows (AND) rather than replacing the category, so turning one on
  // keeps the others and only resets the page.
  const toggleFree = useCallback(() => {
    setFree((prev) => !prev);
    setPage(1);
  }, []);
  const toggleExplained = useCallback(() => {
    setExplained((prev) => !prev);
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setCategory("all");
    setFree(false);
    setExplained(false);
    setSearch("");
    setPage(1);
  }, []);

  const anyFilter = free || explained || category !== "all" || !!search.trim();

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Hero header ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/4 to-transparent p-5 sm:p-7">
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Grid className="size-3" />
            {toBengaliDigits(data.total)}টি প্রশ্ন
          </span>
          <h1 className="mt-2.5 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-2xl font-black tracking-tight sm:text-3xl">
            প্রশ্নব্যাংক
          </h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            বোর্ড, ভার্সিটি ও মেডিকেল — যেকোনো ক্যাটাগরি থেকে প্রশ্ন খুঁজে
            অনুশীলন করো।
          </p>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="প্রশ্ন খুঁজুন…"
          className="h-12 rounded-2xl border-border/60 bg-card pl-11 shadow-xs"
        />
      </div>

      {/* ─── Category cards ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QB_CATEGORIES.map((key) => {
          const meta = CATEGORY_META[key];
          const active = category === key;
          const count = counts.categories[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => pickCategory(key)}
              aria-pressed={active}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
                active
                  ? meta.active
                  : "border-border/60 bg-card shadow-xs hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
              )}
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl transition-colors",
                  meta.plate,
                )}
              >
                <meta.Icon className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold sm:text-base">
                  {meta.label}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {meta.caption}
                </span>
              </span>
              <span className="text-2xl font-black leading-none tabular-nums text-foreground/80">
                {toBengaliDigits(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Quick toggles (AND onto the category) ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleFree}
          aria-pressed={free}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            free
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Flash className="size-3.5" />
          উন্মুক্ত
          <span
            className={cn("text-xs tabular-nums", free ? "opacity-80" : "opacity-60")}
          >
            {toBengaliDigits(counts.free)}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleExplained}
          aria-pressed={explained}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            explained
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Lightbulb className="size-3.5" />
          ব্যাখ্যা আছে
          <span
            className={cn("text-xs tabular-nums", explained ? "opacity-80" : "opacity-60")}
          >
            {toBengaliDigits(counts.explained)}
          </span>
        </button>

        {anyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="ml-auto h-8 rounded-lg px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            রিসেট
          </Button>
        )}
      </div>

      {/* ─── List ─── */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-opacity",
          loading && "pointer-events-none opacity-50",
        )}
      >
        {data.questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
            <p className="font-bold">কোনো প্রশ্ন পাওয়া যায়নি</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              অন্য শব্দ দিয়ে খুঁজুন, বা ফিল্টার বদলান।
            </p>
          </div>
        ) : (
          data.questions.map((question, index) => (
            <QuestionRow
              key={question.id}
              question={question}
              index={(data.page - 1) * QB_PAGE_SIZE + index}
            />
          ))
        )}
      </div>

      {/* ─── Pagination ─── */}
      {data.pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-xs">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1 || loading}
            onClick={() => changePage(data.page - 1)}
            className="gap-1.5 rounded-xl"
          >
            <AngleLeft className="size-4" />
            আগের
          </Button>

          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {toBengaliDigits(data.page)} / {toBengaliDigits(data.pageCount)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.pageCount || loading}
            onClick={() => changePage(data.page + 1)}
            className="gap-1.5 rounded-xl"
          >
            পরের
            <AngleRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

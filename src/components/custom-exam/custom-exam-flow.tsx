"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight2,
  Clock,
  Danger,
  Flash,
  TickCircle,
  Trophy,
} from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getQbExamSubjectsAction,
  startCustomExamAction,
} from "@/lib/actions/qb-exam";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { QbExamOptions } from "@/lib/qb-catalog";
import {
  CUSTOM_EXAM_MAX_QUESTIONS,
  CUSTOM_EXAM_NEGATIVE,
  type CustomExam,
  type CustomExamQuestion,
} from "@/lib/qb-exam-types";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

const ALL = "all";

const SECTION_CHOICES = [
  { id: "all", label: "সব প্রশ্ন" },
  { id: "university", label: "বিশ্ববিদ্যালয়" },
  { id: "engineering", label: "ইঞ্জিনিয়ারিং" },
  { id: "medical", label: "মেডিকেল" },
] as const;

const COUNT_PRESETS = [5, 10, 20, 50] as const;
const MINUTE_PRESETS = [5, 10, 15, 30] as const;

/** How long the admission card stays up before the paper appears. */
const EXAM_AD_SECONDS = 3;

/** One admission course shown as the pre-exam ad. */
export interface ExamAdCourse {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly image: string;
  readonly price: number;
  readonly originalPrice: number | null;
  readonly badge: string | null;
  readonly features: readonly string[];
}

/** Bengali digits for a whole number or a two-place mark like ৭.২৫. */
function numberText(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return toBengaliDigits(text).replace("-", "−");
}

/** mm:ss with Bengali digits. */
function clockText(totalSeconds: number): string {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  return `${toBengaliDigits(String(Math.floor(safe / 60)).padStart(2, "0"))}:${toBengaliDigits(
    String(safe % 60).padStart(2, "0"),
  )}`;
}

function toQuestion(question: CustomExamQuestion): Question {
  return {
    id: question.id,
    type: "mcq",
    source: "কাস্টম এক্সাম",
    standard: "HSC",
    questionText: question.text,
    questionImage: question.image,
    explanation: question.explanation,
    explanationImage: question.explanationImage,
    mcqOptions: question.options.map((option, index) => ({
      id: option.id,
      questionId: question.id,
      optionText: option.text,
      image: option.image,
      isCorrect: option.isCorrect,
      orderNo: index + 1,
    })),
  };
}

type Step = "config" | "exam" | "result";

/** Full-screen admission card shown while the paper is being prepared. */
function ExamAdOverlay({
  ad,
}: {
  readonly ad: ExamAdCourse;
}): React.ReactElement {
  const [left, setLeft] = useState(EXAM_AD_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="এডমিশন কোর্স"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            এডমিশন কোর্স
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
            {left > 0 ? `${numberText(left)} সেকেন্ড` : "প্রস্তুত হচ্ছে…"}
          </span>
        </div>

        <div className="relative aspect-video overflow-hidden">
          <Image
            src={ad.image || "/images/image.png"}
            alt={ad.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-cover"
          />
          {ad.badge ? (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {ad.badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <h2 className="text-base font-extrabold leading-snug">{ad.name}</h2>

          {ad.features.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {ad.features.map((feature) => (
                <li
                  key={feature}
                  className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                >
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              {ad.originalPrice ? (
                <span className="text-[11px] font-semibold text-muted-foreground line-through">
                  ৳{numberText(ad.originalPrice)}
                </span>
              ) : null}
              <span className="text-lg font-black tabular-nums text-emerald-600">
                ৳{numberText(ad.price)}
              </span>
            </div>
            <Button
              render={
                <a
                  href={`/courses/${ad.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              ভর্তি হোন
            </Button>
          </div>

          <p className="text-center text-[10px] font-semibold text-muted-foreground">
            আপনার পরীক্ষা প্রস্তুত করা হচ্ছে…
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom exam screen: pick a slice of the question bank, sit the paper with a
 * countdown, then see the score and the solutions.
 *
 * Everything after the questions arrive is client state. No login, no
 * submission, no stored result — reloading the page simply starts over.
 */
export function CustomExamFlow({
  options,
  ads,
}: {
  readonly options: QbExamOptions;
  readonly ads: readonly ExamAdCourse[];
}): React.ReactElement {
  const [step, setStep] = useState<Step>("config");

  // Filters
  const [section, setSection] = useState<string>("all");
  const [group, setGroup] = useState("");
  const [year, setYear] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  /** Subject tree for the current shelf; reloaded when section/group/year move. */
  const [subjects, setSubjects] = useState(options.subjects);
  const [scopeLoading, setScopeLoading] = useState(false);

  // Paper settings
  const [countMode, setCountMode] = useState<"preset" | "all" | "custom">(
    "preset",
  );
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [minuteMode, setMinuteMode] = useState<"preset" | "custom">("preset");
  const [minutes, setMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState("");
  const [negative, setNegative] = useState(0);

  // Running paper
  const [exam, setExam] = useState<CustomExam | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Pre-exam ad: one admission course, never the same one twice in a row.
  const [ad, setAd] = useState<ExamAdCourse | null>(null);
  const lastAdId = useRef<string | null>(null);

  const activeSection = options.sections.find((item) => item.id === section);
  const groups = activeSection?.groups ?? [];
  const years = groups.find((item) => item.key === group)?.years ?? [];
  const subject = subjects.find((item) => item.id === subjectId);
  const chapters = subject?.chapters ?? [];
  const chapter = chapters.find((item) => item.id === chapterId);
  const topics = chapter?.topics ?? [];
  const scoped = section !== "all" || group !== "" || year !== "";

  // The subject list follows the shelf: a paper only offers its own subjects.
  useEffect(() => {
    if (!scoped) {
      setSubjects(options.subjects);
      setScopeLoading(false);
      return;
    }

    let active = true;
    setScopeLoading(true);
    getQbExamSubjectsAction({
      section,
      group: group || undefined,
      year: year || undefined,
    })
      .then((list) => {
        if (active) setSubjects(list);
      })
      .catch(() => {
        if (active) setSubjects([]);
      })
      .finally(() => {
        if (active) setScopeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scoped, section, group, year, options.subjects]);

  const questionCount =
    countMode === "all"
      ? CUSTOM_EXAM_MAX_QUESTIONS
      : countMode === "custom"
        ? Math.min(CUSTOM_EXAM_MAX_QUESTIONS, Number(customCount) || 0)
        : count;

  const minuteCount =
    minuteMode === "custom"
      ? Math.min(180, Number(customMinutes) || 0)
      : minutes;

  /** A blank custom field is 0, not 1 — the start button waits for a real number. */
  const settingsReady = questionCount >= 1 && minuteCount >= 1;

  const title = useMemo(() => {
    const parts: string[] = [];
    if (section !== "all") {
      parts.push(
        SECTION_CHOICES.find((item) => item.id === section)?.label ?? "",
      );
    }
    if (group) parts.push(group);
    if (year)
      parts.push(years.find((item) => item.key === year)?.label ?? year);
    if (subject) parts.push(subject.name);
    if (chapter) parts.push(chapter.name);
    if (topicId)
      parts.push(topics.find((item) => item.id === topicId)?.name ?? "");
    return parts.filter(Boolean).join(" · ") || "সব বিষয়ের প্রশ্ন";
  }, [section, group, year, years, subject, chapter, topicId, topics]);

  // Countdown; auto-submits when it reaches zero.
  useEffect(() => {
    if (step !== "exam") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "exam" || !exam || secondsLeft > 0) return;
    setTimeTaken(exam.minutes * 60);
    setStep("result");
  }, [step, exam, secondsLeft]);

  /** A random admission course, avoiding the one shown last time. */
  function nextAd(): ExamAdCourse | null {
    if (ads.length === 0) return null;
    const pool =
      ads.length > 1
        ? ads.filter((course) => course.id !== lastAdId.current)
        : ads;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    if (!chosen) return null;
    lastAdId.current = chosen.id;
    return chosen;
  }

  async function start() {
    setStarting(true);
    setError(null);
    const adCourse = nextAd();
    setAd(adCourse);
    try {
      const [result] = await Promise.all([
        startCustomExamAction({
          section,
          group: group || undefined,
          year: year || undefined,
          subjectId: subjectId || undefined,
          chapterId: chapterId || undefined,
          topicId: topicId || undefined,
          count: questionCount,
          minutes: minuteCount,
          negative,
        }),
        adCourse
          ? new Promise<void>((resolve) =>
              window.setTimeout(resolve, EXAM_AD_SECONDS * 1000),
            )
          : Promise.resolve(),
      ]);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setExam(result.exam);
      setExamTitle(title);
      setAnswers({});
      setSecondsLeft(result.exam.minutes * 60);
      setTimeTaken(0);
      setStep("exam");
    } catch {
      setError(
        "পরীক্ষাটি তৈরি করা যায়নি। ইন্টারনেট বা সার্ভার ঠিক আছে কিনা দেখে আবার চেষ্টা করুন।",
      );
    } finally {
      setAd(null);
      setStarting(false);
    }
  }

  function submit() {
    if (!exam) return;
    setTimeTaken(exam.minutes * 60 - secondsLeft);
    setConfirmSubmit(false);
    setStep("result");
  }

  /** Drops the subject chain; its options belong to the previous shelf. */
  function clearSubject() {
    setSubjectId("");
    setChapterId("");
    setTopicId("");
  }

  function restart() {
    setExam(null);
    setAnswers({});
    setSecondsLeft(0);
    setTimeTaken(0);
    setError(null);
    setStep("config");
  }

  const outcome = useMemo(() => {
    if (!exam) {
      return { correct: 0, wrong: 0, skipped: 0, marks: 0, percent: 0 };
    }
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    for (const question of exam.questions) {
      const chosen = answers[question.id];
      if (!chosen) {
        skipped += 1;
        continue;
      }
      const option = question.options.find((item) => item.id === chosen);
      if (option?.isCorrect) correct += 1;
      else wrong += 1;
    }
    const marks = correct - wrong * exam.negative;
    const percent = exam.questions.length
      ? Math.round((Math.max(0, marks) / exam.questions.length) * 100)
      : 0;
    return { correct, wrong, skipped, marks, percent };
  }, [exam, answers]);

  /* ── config ─────────────────────────────────────────────────────────────── */

  if (step === "config") {
    const fieldLabel =
      "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground";
    const pill = (active: boolean) =>
      cn(
        "rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-colors sm:text-xs",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      );
    const sectionPill = (active: boolean) =>
      cn(
        "truncate rounded-xl border px-1 py-1.5 text-center text-[10px] font-bold leading-tight transition-colors sm:px-3 sm:text-xs",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      );

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
        <header className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl">
            <Flash className="size-5 text-primary" aria-hidden="true" />
            কাস্টম এক্সাম
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            প্রশ্নব্যাংক থেকে নিজের মতো প্রশ্ন বেছে পরীক্ষা দিন।
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <span className={fieldLabel}>১. কোন প্রশ্ন থেকে?</span>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {SECTION_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => {
                      setSection(choice.id);
                      setGroup("");
                      setYear("");
                      clearSubject();
                    }}
                    className={sectionPill(section === choice.id)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>

            {section !== "all" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <span className={fieldLabel}>
                    {section === "university"
                      ? "বিশ্ববিদ্যালয়"
                      : section === "medical"
                        ? "ক্যাটাগরি"
                        : "প্রতিষ্ঠান"}
                  </span>
                  <Select
                    value={group || ALL}
                    onValueChange={(value) => {
                      setGroup(value === ALL ? "" : value);
                      setYear("");
                      clearSubject();
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="সব" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>সব</SelectItem>
                      {groups.map((item) => (
                        <SelectItem key={item.key} value={item.key}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0">
                  <span className={fieldLabel}>সাল</span>
                  <Select
                    value={year || ALL}
                    onValueChange={(value) => {
                      setYear(value === ALL ? "" : value);
                      clearSubject();
                    }}
                    disabled={group.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="সব সাল" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>সব সাল</SelectItem>
                      {years.map((item) => (
                        <SelectItem key={item.key} value={item.key}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <span className={fieldLabel}>
            ২. বিষয় (ঐচ্ছিক){scopeLoading ? " · লোড হচ্ছে…" : ""}
          </span>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <Select
              value={subjectId || ALL}
              onValueChange={(value) => {
                setSubjectId(value === ALL ? "" : value);
                setChapterId("");
                setTopicId("");
              }}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="সব বিষয়" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>সব বিষয়</SelectItem>
                {subjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={chapterId || ALL}
              onValueChange={(value) => {
                setChapterId(value === ALL ? "" : value);
                setTopicId("");
              }}
              disabled={chapters.length === 0}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="সব অধ্যায়" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>সব অধ্যায়</SelectItem>
                {chapters.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={topicId || ALL}
              onValueChange={(value) => setTopicId(value === ALL ? "" : value)}
              disabled={topics.length === 0}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="সব টপিক" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>সব টপিক</SelectItem>
                {topics.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <span className={fieldLabel}>৩. প্রশ্নের সংখ্যা</span>
              <div className="flex flex-wrap items-center gap-2">
                {COUNT_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCountMode("preset");
                      setCount(value);
                    }}
                    className={pill(countMode === "preset" && count === value)}
                  >
                    {numberText(value)}টি
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCountMode("all")}
                  className={pill(countMode === "all")}
                >
                  সব প্রশ্ন
                </button>
                <button
                  type="button"
                  onClick={() => setCountMode("custom")}
                  className={pill(countMode === "custom")}
                >
                  নিজে লিখুন
                </button>
              </div>
              {countMode === "custom" ? (
                <Input
                  inputMode="numeric"
                  value={customCount}
                  onChange={(event) => {
                    const digits = event.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 3);
                    setCustomCount(
                      digits === ""
                        ? ""
                        : String(
                            Math.min(CUSTOM_EXAM_MAX_QUESTIONS, Number(digits)),
                          ),
                    );
                  }}
                  placeholder={`১ – ${numberText(CUSTOM_EXAM_MAX_QUESTIONS)}`}
                  className="mt-2 h-9 max-w-40 text-sm font-bold"
                />
              ) : null}
            </div>

            <div>
              <span className={fieldLabel}>৪. সময় (মিনিট)</span>
              <div className="flex flex-wrap items-center gap-2">
                {MINUTE_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setMinuteMode("preset");
                      setMinutes(value);
                    }}
                    className={pill(
                      minuteMode === "preset" && minutes === value,
                    )}
                  >
                    {numberText(value)} মিনিট
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMinuteMode("custom")}
                  className={pill(minuteMode === "custom")}
                >
                  নিজে লিখুন
                </button>
              </div>
              {minuteMode === "custom" ? (
                <Input
                  inputMode="numeric"
                  value={customMinutes}
                  onChange={(event) => {
                    const digits = event.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 3);
                    setCustomMinutes(
                      digits === ""
                        ? ""
                        : String(Math.min(180, Number(digits))),
                    );
                  }}
                  placeholder="১ – ১৮০"
                  className="mt-2 h-9 max-w-40 text-sm font-bold"
                />
              ) : null}
            </div>

            <div>
              <span className={fieldLabel}>
                ৫. নেগেটিভ মার্কিং (প্রতিটি ভুল উত্তরে)
              </span>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_EXAM_NEGATIVE.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNegative(value)}
                    className={pill(negative === value)}
                  >
                    {value === 0 ? "নেই" : numberText(value)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive sm:text-xs">
            <Danger className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <Button
          size="lg"
          onClick={() => void start()}
          disabled={starting || !settingsReady}
          className="h-11 w-full rounded-xl text-sm font-bold sm:h-12 sm:text-base"
        >
          {starting ? (
            <>প্রশ্ন সাজানো হচ্ছে…</>
          ) : (
            <>
              পরীক্ষা শুরু করুন
              <ArrowRight2 className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>

        {ad ? <ExamAdOverlay ad={ad} /> : null}
      </div>
    );
  }

  if (!exam) return <div />;

  /* ── taking ─────────────────────────────────────────────────────────────── */

  if (step === "exam") {
    const answered = Object.keys(answers).length;
    const progress = (answered / exam.questions.length) * 100;

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
        <div className="sticky top-2 z-10 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                কাস্টম এক্সাম
              </p>
              <p className="truncate text-sm font-extrabold">{examTitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-black tabular-nums",
                  secondsLeft <= 60
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-muted text-foreground",
                )}
              >
                <Clock className="size-3.5" aria-hidden="true" />
                {clockText(secondsLeft)}
              </span>
              <Button
                size="sm"
                onClick={() => setConfirmSubmit(true)}
                className="h-8 rounded-xl text-[11px] font-bold"
              >
                জমা দিন
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>মোট প্রশ্ন {numberText(exam.questions.length)}</span>
            <span>উত্তর দেওয়া {numberText(answered)}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {exam.questions.map((question, number) => (
          <section key={question.id} className="flex flex-col gap-1.5">
            <p className="px-1 text-[11px] font-bold text-muted-foreground">
              প্রশ্ন {numberText(number + 1)}
            </p>
            <UniversalQuestionCard
              question={toQuestion(question)}
              questionIndex={number}
              selectedOptionId={answers[question.id]}
              showCorrectAnswer={false}
              allowReselect
              hideHeader
              hideControls
              onSelectOption={(_questionId, optionId) =>
                setAnswers((previous) => ({
                  ...previous,
                  [question.id]: optionId,
                }))
              }
            />
          </section>
        ))}

        <Button
          size="lg"
          onClick={() => setConfirmSubmit(true)}
          className="h-11 w-full rounded-xl text-sm font-bold sm:h-12 sm:text-base"
        >
          পরীক্ষা জমা দিন
          <ArrowRight2 className="size-4" aria-hidden="true" />
        </Button>

        <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>পরীক্ষা জমা দেবেন?</DialogTitle>
              <DialogDescription>
                {numberText(answered)}টি উত্তর দেওয়া হয়েছে,{" "}
                {numberText(exam.questions.length - answered)}টি বাকি। জমা দিলে আর
                বদলানো যাবে না।
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmSubmit(false)}
                className="rounded-xl text-xs font-bold"
              >
                ফিরে যান
              </Button>
              <Button onClick={submit} className="rounded-xl text-xs font-bold">
                জমা দিন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ── result ─────────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-10">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={cn(
              "grid size-16 shrink-0 place-items-center rounded-2xl",
              outcome.percent >= 50
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-primary/10 text-primary",
            )}
          >
            <span className="text-lg font-black">
              {numberText(outcome.percent)}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {examTitle}
            </p>
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-black sm:text-xl">
              প্রাপ্ত নম্বর: {numberText(outcome.marks)} /{" "}
              {numberText(exam.questions.length)}
              {outcome.percent >= 80 ? (
                <Trophy className="size-4 text-amber-500" aria-hidden="true" />
              ) : null}
            </h2>
            <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] font-semibold text-muted-foreground sm:text-xs">
              <span className="text-emerald-600">
                সঠিক {numberText(outcome.correct)}
              </span>
              <span>·</span>
              <span className="text-destructive">
                ভুল {numberText(outcome.wrong)}
              </span>
              <span>·</span>
              <span>উত্তর দেননি {numberText(outcome.skipped)}</span>
              <span>·</span>
              <span>সময় {clockText(timeTaken)}</span>
            </p>
          </div>
          <Button
            onClick={restart}
            className="h-9 w-full rounded-xl text-xs font-bold sm:w-auto"
          >
            নতুন পরীক্ষা
          </Button>
        </div>

        {exam.negative > 0 ? (
          <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            প্রতিটি ভুল উত্তরে {numberText(exam.negative)} নম্বর কাটা হয়েছে।
          </p>
        ) : null}
      </div>

      <h3 className="px-1 text-sm font-bold">সব প্রশ্নের উত্তর ও ব্যাখ্যা</h3>

      {exam.questions.map((question, number) => {
        const chosen = answers[question.id];
        const correctOption = question.options.find((item) => item.isCorrect);
        const status = !chosen
          ? { label: "উত্তর দেননি", tone: "text-muted-foreground" }
          : correctOption?.id === chosen
            ? { label: "সঠিক", tone: "text-emerald-600" }
            : { label: "ভুল", tone: "text-destructive" };

        return (
          <div key={question.id} className="flex flex-col gap-1.5">
            <p className="px-1 text-[11px] font-bold">
              <span className="text-muted-foreground">
                প্রশ্ন {numberText(number + 1)} ·{" "}
              </span>
              <span className={status.tone}>{status.label}</span>
            </p>
            <UniversalQuestionCard
              question={toQuestion(question)}
              questionIndex={number}
              selectedOptionId={chosen}
              showCorrectAnswer
              isSolutionOpen
              hideControls
              disableOptionChange
              hideHeader
              minimal
              stemFooter={
                question.context.length > 0 ? (
                  <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
                    {question.context.join(" · ")}
                  </p>
                ) : null
              }
            />
          </div>
        );
      })}

      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          onClick={restart}
          className="h-10 rounded-xl text-xs font-bold"
        >
          <TickCircle className="size-4" aria-hidden="true" />
          আরেকটি পরীক্ষা দিন
        </Button>
      </div>
    </div>
  );
}

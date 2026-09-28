"use client";

import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { markdownComponents, sanitizeQuestionContent } from "@/lib/question-content";
import {
  ArrowLeft2,
  Award,
  BookOpen,
  Clock,
  CloseCircle,
  Danger,
  Flash,
  Lightbulb,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ", "ঙ"];

interface FreeExamResultViewProps {
  slug: string;
  resultData: {
    submission: any;
    metrics: {
      correctCount: number;
      wrongCount: number;
      unattemptedCount: number;
      attemptedCount: number;
      totalQuestions: number;
      accuracy: number;
    };
  };
}

export function FreeExamResultView({ slug, resultData }: FreeExamResultViewProps) {
  const { submission, metrics } = resultData;
  const exam = submission.exam;
  const user = submission.user;
  const [filterType, setFilterType] = useState<"all" | "correct" | "wrong" | "unattempted">("all");

  const responses = submission.responses || [];

  const filteredResponses = responses.filter((r: any) => {
    if (filterType === "correct") return r.isCorrect;
    if (filterType === "wrong") return !r.isCorrect && (r.selectedOptionId || r.cqAnswerText);
    if (filterType === "unattempted") return !r.selectedOptionId && !r.cqAnswerText;
    return true;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} মিনিট ${s} সেকেন্ড`;
  };

  const scoreNum = parseFloat(submission.score || "0");
  const isGoodScore = scoreNum >= (submission.totalMarks * 0.6);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Header Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/free-exam/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="p-1.5 rounded-xl border border-border/80 group-hover:border-foreground transition-all bg-card shadow-2xs">
            <ArrowLeft2 className="size-3.5" />
          </div>
          <span>পরীক্ষার পেজে ফিরে যান</span>
        </Link>

        <Button
          render={<Link href={`/free-exam/${slug}/leaderboard`} />}
          className="rounded-2xl font-black text-xs h-10 px-5 bg-amber-500 text-white hover:bg-amber-600 shadow-md cursor-pointer gap-2"
        >
          <Award className="size-4" />
          <span>লাইভ লিডারবোর্ড দেখুন</span>
        </Button>
      </div>

      {/* Hero Scorecard */}
      <Card className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-md">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-primary/15 via-background to-muted border-b border-border/60 text-center space-y-3">
          <span className="inline-flex items-center text-[10px] font-black px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
            ফলাফল ও পারফরম্যান্স রিপোর্ট
          </span>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground">
            {exam.title}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            পরীক্ষার্থী: <strong className="text-foreground">{user?.name || "Guest Student"}</strong>{" "}
            {user?.college && user.college !== "N/A" ? `(${user.college})` : ""}
          </p>

          {/* Big Score Display */}
          <div className="pt-2 flex items-center justify-center">
            <div className="px-8 py-4 rounded-3xl bg-card border border-border shadow-md flex flex-col items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                প্রাপ্ত স্কোর
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-3xl sm:text-5xl font-black tracking-tight",
                    isGoodScore ? "text-primary" : "text-foreground",
                  )}
                >
                  {submission.score}
                </span>
                <span className="text-sm sm:text-lg font-extrabold text-muted-foreground">
                  / {submission.totalMarks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Performance Metrics */}
        <CardContent className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <TickCircle className="size-3.5" /> সঠিক উত্তর
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.correctCount} টি
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-1">
            <span className="text-xs font-bold text-destructive flex items-center justify-center gap-1">
              <Danger className="size-3.5" /> ভুল উত্তর
            </span>
            <span className="text-xl font-black text-destructive">
              {metrics.wrongCount} টি
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60 space-y-1">
            <span className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-1">
              <TaskSquare className="size-3.5" /> অনুত্তরিত
            </span>
            <span className="text-xl font-black text-foreground">
              {metrics.unattemptedCount} টি
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
            <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
              <Clock className="size-3.5" /> সময় ব্যয়
            </span>
            <span className="text-xs sm:text-sm font-black text-primary">
              {formatTime(submission.timeTakenSeconds)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Solutions Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            <span>বিস্তারিত প্রশ্ন ও সমাধান (Solutions)</span>
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                filterType === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              সকল ({responses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("correct")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-emerald-600 dark:text-emerald-400",
                filterType === "correct" ? "bg-emerald-500/15 font-black shadow-xs" : "opacity-80 hover:opacity-100",
              )}
            >
              সঠিক ({metrics.correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("wrong")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-destructive",
                filterType === "wrong" ? "bg-destructive/15 font-black shadow-xs" : "opacity-80 hover:opacity-100",
              )}
            >
              ভুল ({metrics.wrongCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("unattempted")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                filterType === "unattempted" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              বাদ ({metrics.unattemptedCount})
            </button>
          </div>
        </div>

        {/* Responses Breakdown */}
        <div className="space-y-5">
          {filteredResponses.map((r: any, idx: number) => {
            const q = r.examQuestion?.question;
            if (!q) return null;

            const isCorrect = r.isCorrect;
            const isUnattempted = !r.selectedOptionId && !r.cqAnswerText;
            const isWrong = !isCorrect && !isUnattempted;

            return (
              <Card
                key={r.id}
                className={cn(
                  "rounded-3xl border p-5 sm:p-6 transition-all space-y-4 shadow-xs",
                  isCorrect
                    ? "border-emerald-500/30 bg-card"
                    : isWrong
                      ? "border-destructive/30 bg-card"
                      : "border-border/70 bg-card",
                )}
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-xl bg-muted text-foreground font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      প্রশ্ন নং {r.examQuestion?.orderNo || idx + 1}
                    </span>
                  </div>

                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <TickCircle className="size-3.5" /> সঠিক (+{r.marksObtained})
                      </span>
                    ) : isWrong ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        <Danger className="size-3.5" /> ভুল ({r.marksObtained})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                        অনুত্তরিত (০)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-sm font-semibold text-foreground leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={markdownComponents}
                  >
                    {sanitizeQuestionContent(q.questionText)}
                  </ReactMarkdown>
                </div>

                {/* MCQ Options with Highlights */}
                {q.type === "mcq" && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {q.mcqOptions?.map((opt: any, optIdx: number) => {
                      const isStudentSelected = r.selectedOptionId === opt.id;
                      const isCorrectOption = opt.isCorrect;
                      const label = OPTION_KEYS[optIdx] || String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-colors",
                            isCorrectOption
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : isStudentSelected && !isCorrectOption
                                ? "bg-destructive/10 border-destructive/30 text-destructive font-semibold"
                                : "bg-muted/20 border-border/60 text-muted-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "size-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                              isCorrectOption
                                ? "bg-emerald-600 text-white"
                                : isStudentSelected && !isCorrectOption
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {label}
                          </div>

                          <div className="flex-1 pt-0.5">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                              rehypePlugins={[rehypeRaw, rehypeKatex]}
                              components={markdownComponents}
                            >
                              {sanitizeQuestionContent(opt.optionText)}
                            </ReactMarkdown>
                          </div>

                          {isCorrectOption && (
                            <span className="text-[10px] font-black text-emerald-600 uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 shrink-0 self-center">
                              সঠিক উত্তর
                            </span>
                          )}
                          {isStudentSelected && !isCorrectOption && (
                            <span className="text-[10px] font-black text-destructive uppercase px-2 py-0.5 rounded-md bg-destructive/15 shrink-0 self-center">
                              আপনার উত্তর
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Lightbulb className="size-3.5" />
                      <span>ব্যাখ্যা ও সমাধান:</span>
                    </div>
                    <div className="text-xs text-foreground/90 leading-relaxed pl-5 border-l-2 border-primary/40">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={markdownComponents}
                      >
                        {sanitizeQuestionContent(q.explanation)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-border">
        <Button
          render={<Link href="/free-exam" />}
          variant="outline"
          className="rounded-2xl font-bold text-xs h-11 px-6 border-border/80 cursor-pointer"
        >
          <span>সকল ফ্রি এক্সাম দেখুন</span>
        </Button>

        <Button
          render={<Link href={`/free-exam/${slug}/leaderboard`} />}
          className="rounded-2xl font-black text-xs h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-2"
        >
          <Award className="size-4" />
          <span>লাইভ লিডারবোর্ড দেখুন</span>
        </Button>
      </div>
    </div>
  );
}
